import { NextResponse } from 'next/server';
import { findUserByEmail, createSession } from '../../../../lib/db';
import { verifyPassword } from '../../../../lib/auth';

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = findUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const session = createSession(user.id);
    const { passwordHash: _, ...sanitizedUser } = user;

    const response = NextResponse.json({ 
      success: true, 
      user: sanitizedUser, 
      token: session.token 
    });

    response.cookies.set('decentravote_session', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err) {
    console.error("Login route error:", err);
    return NextResponse.json({ error: 'Internal server error during login' }, { status: 500 });
  }
}
