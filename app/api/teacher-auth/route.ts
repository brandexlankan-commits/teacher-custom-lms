import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    const validUsername = process.env.TEACHER_USERNAME || 'admin';
    const validPassword = process.env.TEACHER_PASSWORD || 'teacher@2026';

    if (username?.trim() === validUsername && password?.trim() === validPassword) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid Username or Password.' },
      { status: 401 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}