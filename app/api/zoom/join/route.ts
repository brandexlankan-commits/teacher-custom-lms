import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { studentId, courseId, deviceFingerprint } = await req.json();

    if (!studentId || !courseId || !deviceFingerprint) {
      return NextResponse.json(
        { error: 'Missing verification parameters.' },
        { status: 400 }
      );
    }

    // 1. Verify Student & 1-Device Lock
    const { data: stu } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .maybeSingle();

    if (!stu) {
      return NextResponse.json({ error: 'Student account not found.' }, { status: 404 });
    }

    if (stu.device_id && stu.device_id !== deviceFingerprint) {
      return NextResponse.json(
        { error: 'Device Security Violation: Access is locked to your registered device.' },
        { status: 403 }
      );
    }

    // 2. Verify Enrollment & Flexible Monthly Access Control (Sri Lanka Timezone)
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('*')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (!enrollment) {
      return NextResponse.json({ error: 'You are not enrolled in this class.' }, { status: 403 });
    }

    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Colombo' }); // 'YYYY-MM-DD'
    const currentMonth = todayStr.slice(0, 7); // 'YYYY-MM'
    const dayOfMonth = Number(todayStr.slice(8, 10));

    const isFreeCard = Boolean(enrollment.is_free_card);
    const hasValidExtension = Boolean(enrollment.access_until && todayStr <= enrollment.access_until);
    const isWithinGracePeriod = dayOfMonth <= 15;

    const { data: approvedSlip } = await supabase
      .from('slips')
      .select('id')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .eq('billing_month', currentMonth)
      .eq('status', 'Approved')
      .limit(1)
      .maybeSingle();

    const hasAccess = isFreeCard || hasValidExtension || isWithinGracePeriod || Boolean(approvedSlip);

    if (!hasAccess) {
      return NextResponse.json(
        {
          error: `Monthly fee grace period (1st–15th) has ended. Please submit your bank slip for ${currentMonth} or contact your teacher for access.`
        },
        { status: 403 }
      );
    }

    // 3. Fetch Latest Zoom Meeting & Course Fallback Link
    const { data: meeting } = await supabase
      .from('zoom_meetings')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: course } = await supabase
      .from('courses')
      .select('zoom_link')
      .eq('id', courseId)
      .maybeSingle();

    let personalJoinUrl = meeting?.join_url || course?.zoom_link || '';
    if (!personalJoinUrl) {
      return NextResponse.json(
        { error: 'No active Zoom class session found.' },
        { status: 404 }
      );
    }

    // 4. If Zoom Registration is enabled, generate a unique single-student Zoom join URL with Index No locked in Display Name
    if (meeting?.meeting_id && meeting?.registration_enabled) {
      const { data: creds } = await supabase
        .from('zoom_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (creds?.account_id && creds?.client_id && creds?.client_secret) {
        const authHeader = Buffer.from(`${creds.client_id}:${creds.client_secret}`).toString('base64');
        const tokenRes = await fetch(
          `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${creds.account_id}`,
          {
            method: 'POST',
            headers: { Authorization: `Basic ${authHeader}` }
          }
        );

        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          const nameParts = (stu.full_name || 'Student').trim().split(' ');
          const firstName = `[${stu.index_number}] ${nameParts[0]}`;
          const lastName = nameParts.slice(1).join(' ') || 'Student';
          const safeEmail = `${stu.index_number.toLowerCase().replace(/[^a-z0-9]/g, '')}@smarttuition.lms`;

          const regRes = await fetch(
            `https://api.zoom.us/v2/meetings/${meeting.meeting_id}/registrants`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                email: safeEmail,
                first_name: firstName,
                last_name: lastName
              })
            }
          );

          if (regRes.ok) {
            const regData = await regRes.json();
            if (regData.join_url) {
              personalJoinUrl = regData.join_url;
            }
          }
        }
      }
    }

    // 5. Create or reuse today's Attendance Session in 'Joined (Verifying)' status until minimum stay time is met
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: existingAtt } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .gte('marked_at', todayStart.toISOString())
      .order('marked_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let attendanceId = existingAtt?.id;
    let currentVerifiedMinutes = existingAtt?.verified_minutes || 0;
    let currentStatus = existingAtt?.status || 'Joined (Verifying)';

    if (!existingAtt) {
      const { data: newAtt } = await supabase
        .from('attendance')
        .insert([
          {
            student_id: studentId,
            course_id: courseId,
            meeting_id: meeting?.meeting_id || null,
            duration_minutes: meeting?.duration_minutes || 120,
            verified_minutes: 0,
            status: 'Joined (Verifying)'
          }
        ])
        .select()
        .single();

      attendanceId = newAtt?.id;
    }

    return NextResponse.json({
      success: true,
      joinUrl: personalJoinUrl,
      attendanceId,
      verifiedMinutes: currentVerifiedMinutes,
      minRequiredMinutes: meeting?.min_attendance_minutes || 30,
      status: currentStatus
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}