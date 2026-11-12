import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST: Student Live Session Heartbeat — upgrades to 'Present' ONLY after minimum required stay duration is completed
export async function POST(req: Request) {
  try {
    const { attendanceId, studentId, courseId } = await req.json();

    if (!attendanceId || !studentId || !courseId) {
      return NextResponse.json({ error: 'Missing attendance session parameters.' }, { status: 400 });
    }

    const { data: att } = await supabase
      .from('attendance')
      .select('*')
      .eq('id', attendanceId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (!att) {
      return NextResponse.json({ error: 'Attendance record not found.' }, { status: 404 });
    }

    const { data: meeting } = await supabase
      .from('zoom_meetings')
      .select('min_attendance_minutes, duration_minutes')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const minRequired = meeting?.min_attendance_minutes || 30;

    // Calculate verified elapsed minutes based on server timestamp (cannot be spoofed easily)
    const joinedAtMs = new Date(att.joined_at || att.marked_at).getTime();
    const elapsedMinutes = Math.max(
      Number(att.verified_minutes || 0),
      Math.floor((Date.now() - joinedAtMs) / 60000)
    );

    const newStatus = elapsedMinutes >= minRequired ? 'Present' : 'Joined (Verifying)';

    await supabase
      .from('attendance')
      .update({
        verified_minutes: elapsedMinutes,
        status: newStatus
      })
      .eq('id', attendanceId);

    return NextResponse.json({
      success: true,
      verifiedMinutes: elapsedMinutes,
      minRequiredMinutes: minRequired,
      status: newStatus
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT: Teacher Sync with Zoom Server Participants Report API (verifies exact Zoom call duration per student)
export async function PUT(req: Request) {
  try {
    const { courseId, meetingId } = await req.json();

    if (!courseId || !meetingId) {
      return NextResponse.json({ error: 'Course ID and Meeting ID are required.' }, { status: 400 });
    }

    const { data: creds } = await supabase
      .from('zoom_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!creds?.account_id || !creds?.client_id || !creds?.client_secret) {
      return NextResponse.json({ error: 'Zoom credentials not configured.' }, { status: 400 });
    }

    const authHeader = Buffer.from(`${creds.client_id}:${creds.client_secret}`).toString('base64');
    const tokenRes = await fetch(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${creds.account_id}`,
      {
        method: 'POST',
        headers: { Authorization: `Basic ${authHeader}` }
      }
    );

    if (!tokenRes.ok) {
      return NextResponse.json({ error: 'Failed to authenticate with Zoom API.' }, { status: 400 });
    }

    const tokenData = await tokenRes.json();

    // Try Past Meeting Participants endpoint (works across standard Zoom API scopes)
    let participantsRes = await fetch(
      `https://api.zoom.us/v2/past_meetings/${meetingId}/participants?page_size=300`,
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      }
    );

    if (!participantsRes.ok) {
      participantsRes = await fetch(
        `https://api.zoom.us/v2/report/meetings/${meetingId}/participants?page_size=300`,
        {
          headers: { Authorization: `Bearer ${tokenData.access_token}` }
        }
      );
    }

    if (!participantsRes.ok) {
      const errJson = await participantsRes.json();
      return NextResponse.json(
        {
          error:
            errJson.message ||
            'Zoom participant report is not ready yet (available a few minutes after the meeting ends, or requires Zoom Pro report scope).'
        },
        { status: 400 }
      );
    }

    const pData = await participantsRes.json();
    const participants: any[] = pData.participants || [];

    const { data: meeting } = await supabase
      .from('zoom_meetings')
      .select('min_attendance_minutes, duration_minutes')
      .eq('meeting_id', meetingId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const minRequired = meeting?.min_attendance_minutes || 30;

    // Fetch enrolled students for this course
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('student_id, students(id, index_number, full_name)')
      .eq('course_id', courseId);

    const enrolledStudents = (enrollments || []).map((e: any) => e.students).filter(Boolean);
    let syncedCount = 0;

    for (const stu of enrolledStudents) {
      const idxLower = (stu.index_number || '').toLowerCase();
      const nameLower = (stu.full_name || '').toLowerCase();

      // Sum total seconds this student stayed across reconnects in Zoom
      const matchingLogs = participants.filter((p) => {
        const pName = (p.name || '').toLowerCase();
        const pEmail = (p.user_email || '').toLowerCase();
        return (
          (idxLower && (pName.includes(idxLower) || pEmail.includes(idxLower.replace(/[^a-z0-9]/g, '')))) ||
          (nameLower && pName.includes(nameLower))
        );
      });

      if (matchingLogs.length > 0) {
        const totalSeconds = matchingLogs.reduce((sum, item) => sum + Number(item.duration || 0), 0);
        const actualMinutes = Math.max(1, Math.round(totalSeconds / 60));
        const finalStatus = actualMinutes >= minRequired ? 'Present' : `Left Early (${actualMinutes}m)`;

        const { data: existingLog } = await supabase
          .from('attendance')
          .select('id')
          .eq('student_id', stu.id)
          .eq('course_id', courseId)
          .eq('meeting_id', meetingId)
          .maybeSingle();

        if (existingLog) {
          await supabase
            .from('attendance')
            .update({
              verified_minutes: actualMinutes,
              status: finalStatus
            })
            .eq('id', existingLog.id);
        } else {
          await supabase.from('attendance').insert([
            {
              student_id: stu.id,
              course_id: courseId,
              meeting_id: meetingId,
              duration_minutes: meeting?.duration_minutes || 120,
              verified_minutes: actualMinutes,
              status: finalStatus
            }
          ]);
        }
        syncedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      syncedCount,
      totalParticipantsFound: participants.length
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}