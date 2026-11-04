import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { topic, duration, courseId } = await req.json();

    // 1. Database එකෙන් Zoom Credentials ලබා ගැනීම
    const { data: creds } = await supabase
      .from('zoom_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!creds || !creds.account_id || !creds.client_id || !creds.client_secret) {
      return NextResponse.json({
        error: 'Zoom Credentials හමුවූයේ නැත. කරුණාකර "Zoom Account" ටැබ් එකට ගොස් ඔබගේ Account ID, Client ID සහ Client Secret ඇතුළත් කර Save කරන්න.'
      }, { status: 400 });
    }

    const { account_id, client_id, client_secret } = creds;

    // 2. Zoom OAuth Token ලබා ගැනීම
    const authHeader = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
    const tokenRes = await fetch(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${account_id}`,
      {
        method: 'POST',
        headers: { Authorization: `Basic ${authHeader}` },
      }
    );

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      return NextResponse.json({
        error: `Zoom සම්බන්ධතාවය අසාර්ථක විය: ${tokenData.message || tokenData.error || 'Invalid credentials'}`
      }, { status: 400 });
    }

    const accessToken = tokenData.access_token;

    // 3. Zoom Live Meeting එකක් Create කිරීම
    const meetingRes = await fetch('https://api.zoom.us/v2/users/me/meetings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: topic || 'Live Class Session',
        type: 2,
        duration: Number(duration) || 120,
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: true,
          waiting_room: false,
        },
      }),
    });

    const meetingData = await meetingRes.json();
    if (!meetingRes.ok) {
      return NextResponse.json({
        error: `Meeting සාදාගැනීම අසාර්ථක විය: ${meetingData.message || 'Error creating meeting'}`
      }, { status: 400 });
    }

    // 4. Meeting එක Database එකට Save කර Course Zoom Link update කිරීම
    if (courseId) {
      await supabase.from('zoom_meetings').insert([{
        course_id: courseId,
        topic: topic || 'Live Class Session',
        duration_minutes: Number(duration) || 120,
        meeting_id: meetingData.id?.toString(),
        password: meetingData.password || '',
        join_url: meetingData.join_url,
        start_url: meetingData.start_url
      }]);

      await supabase.from('courses').update({ zoom_link: meetingData.join_url }).eq('id', courseId);
    }

    return NextResponse.json({
      success: true,
      meetingId: meetingData.id?.toString(),
      password: meetingData.password || '',
      joinUrl: meetingData.join_url,
      startUrl: meetingData.start_url,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}