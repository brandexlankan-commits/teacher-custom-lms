import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { topic, duration, courseId, minAttendanceMinutes } = await req.json();

    // 1. Fetch Zoom Credentials from Database
    const { data: creds } = await supabase
      .from('zoom_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!creds || !creds.account_id || !creds.client_id || !creds.client_secret) {
      return NextResponse.json(
        {
          error:
            'Zoom Credentials not found. Please go to the "Zoom Account" tab, enter your Account ID, Client ID, and Client Secret, and click Save.'
        },
        { status: 400 }
      );
    }

    const { account_id, client_id, client_secret } = creds;

    // 2. Get Zoom OAuth Token
    const authHeader = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
    const tokenRes = await fetch(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${account_id}`,
      {
        method: 'POST',
        headers: { Authorization: `Basic ${authHeader}` }
      }
    );

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      return NextResponse.json(
        {
          error: `Zoom connection failed: ${tokenData.message || tokenData.error || 'Invalid credentials'}`
        },
        { status: 400 }
      );
    }

    const accessToken = tokenData.access_token;
    const parsedDuration = Number(duration) || 120;
    const parsedMinAttendance = Math.min(parsedDuration, Math.max(1, Number(minAttendanceMinutes) || 30));

    // 3. Create Zoom Live Meeting with Registration (approval_type: 0) + Waiting Room for Anti-Link-Sharing
    let registrationEnabled = true;
    let meetingRes = await fetch('https://api.zoom.us/v2/users/me/meetings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic: topic || 'Live Class Session',
        type: 2,
        duration: parsedDuration,
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: true,
          waiting_room: true,
          approval_type: 0, // Auto-approve unique per-student registrants
          registration_type: 1,
          registrants_email_notification: false
        }
      })
    });

    let meetingData = await meetingRes.json();

    // Fallback for Basic/Free Zoom accounts where registration (approval_type: 0) is restricted by Zoom
    if (!meetingRes.ok) {
      registrationEnabled = false;
      meetingRes = await fetch('https://api.zoom.us/v2/users/me/meetings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          topic: topic || 'Live Class Session',
          type: 2,
          duration: parsedDuration,
          settings: {
            host_video: true,
            participant_video: true,
            join_before_host: false,
            mute_upon_entry: true,
            waiting_room: true
          }
        })
      });
      meetingData = await meetingRes.json();
    }

    if (!meetingRes.ok) {
      return NextResponse.json(
        {
          error: `Failed to create meeting: ${meetingData.message || 'Error creating meeting'}`
        },
        { status: 400 }
      );
    }

    // 4. Save Meeting to Database and Update Course Zoom Link
    if (courseId) {
      await supabase.from('zoom_meetings').insert([
        {
          course_id: courseId,
          topic: topic || 'Live Class Session',
          duration_minutes: parsedDuration,
          min_attendance_minutes: parsedMinAttendance,
          registration_enabled: registrationEnabled,
          meeting_id: meetingData.id?.toString(),
          password: meetingData.password || '',
          join_url: meetingData.join_url,
          start_url: meetingData.start_url
        }
      ]);

      await supabase.from('courses').update({ zoom_link: meetingData.join_url }).eq('id', courseId);
    }

    return NextResponse.json({
      success: true,
      meetingId: meetingData.id?.toString(),
      password: meetingData.password || '',
      joinUrl: meetingData.join_url,
      startUrl: meetingData.start_url,
      registrationEnabled
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}