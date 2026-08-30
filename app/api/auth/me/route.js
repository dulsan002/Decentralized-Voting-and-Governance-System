import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth';

export async function GET(req) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }
    return NextResponse.json({ authenticated: true, user });
  } catch (err) {
    console.error("Auth /me error:", err);
    return NextResponse.json({ error: 'Failed to verify session' }, { status: 500 });
  }
}
