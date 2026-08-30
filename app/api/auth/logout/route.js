import { NextResponse } from 'next/server';
import { deleteSession } from '../../../../lib/db';

export async function POST(req) {
  try {
    const cookieHeader = req.headers.get('cookie');
    if (cookieHeader) {
      const cookies = Object.fromEntries(
        cookieHeader.split(';').map(c => {
          const [k, ...v] = c.trim().split('=');
          return [k, v.join('=')];
        })
      );
      const token = cookies['decentravote_session'];
      if (token) {
        await deleteSession(token);
      }
    }

    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
    response.cookies.delete('decentravote_session');
    return response;
  } catch (err) {
    console.error("Logout error:", err);
    return NextResponse.json({ error: 'Internal server error during logout' }, { status: 500 });
  }
}
