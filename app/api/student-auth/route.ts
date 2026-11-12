import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { identifier, password, deviceFingerprint } = await req.json();

    if (!identifier || !password || !deviceFingerprint) {
      return NextResponse.json(
        { error: 'Please provide your Index/WhatsApp Number and Password.' },
        { status: 400 }
      );
    }

    const cleanIdentifier = identifier.trim();
    const cleanPassword = password.trim();
    const cleanDeviceId = deviceFingerprint.trim();

    // 1. Search student by Index Number or WhatsApp Number
    const { data: stu, error } = await supabase
      .from('students')
      .select('*')
      .or(`index_number.eq.${cleanIdentifier},whatsapp_number.eq.${cleanIdentifier}`)
      .limit(1)
      .maybeSingle();

    if (error || !stu) {
      return NextResponse.json(
        { error: 'Invalid Index Number or WhatsApp Number.' },
        { status: 401 }
      );
    }

    // 2. Verify Password
    const validPassword = stu.password || stu.whatsapp_number || '123456';
    if (cleanPassword !== validPassword) {
      return NextResponse.json(
        { error: 'Incorrect Password.' },
        { status: 401 }
      );
    }

    // 3. Enforce 1-Device Lock on Server Side
    if (!stu.device_id) {
      const { error: updateErr } = await supabase
        .from('students')
        .update({ device_id: cleanDeviceId })
        .eq('id', stu.id);

      if (updateErr) {
        return NextResponse.json(
          { error: 'Failed to register device security lock.' },
          { status: 500 }
        );
      }
    } else if (stu.device_id !== cleanDeviceId) {
      return NextResponse.json(
        {
          error:
            '⚠️ Device Lock Active: Your account is already linked to another phone or computer. Please contact your teacher to unlock your device before logging in from a new device.'
        },
        { status: 403 }
      );
    }

    // 4. Return safe student session payload (excluding password)
    return NextResponse.json({
      success: true,
      student: {
        id: stu.id,
        full_name: stu.full_name,
        index_number: stu.index_number,
        whatsapp_number: stu.whatsapp_number,
        device_id: cleanDeviceId
      }
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Authentication Error: ' + err.message },
      { status: 500 }
    );
  }
}