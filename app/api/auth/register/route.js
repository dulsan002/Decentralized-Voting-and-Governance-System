import { NextResponse } from 'next/server';
import { findUserByEmail, findUserByNic, createUser, createSession } from '../../../../lib/db';
import { hashPassword } from '../../../../lib/auth';

export async function POST(req) {
  try {
    const body = await req.json();
    const { 
      email, 
      password, 
      fullName, 
      dob, 
      gender, 
      nationality, 
      nicNumber, 
      address, 
      district, 
      province, 
      city, 
      phone 
    } = body;

    // Validation
    if (!email || !password || !fullName || !nicNumber) {
      return NextResponse.json({ error: 'Missing required fields (email, password, fullName, nicNumber)' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Check duplicate email
    if (findUserByEmail(email)) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    // Check duplicate NIC
    if (findUserByNic(nicNumber)) {
      return NextResponse.json({ error: 'An account with this NIC number already exists' }, { status: 409 });
    }

    const passwordHash = hashPassword(password);

    const newUser = createUser({
      email: email.toLowerCase(),
      passwordHash,
      fullName,
      dob: dob || '',
      gender: gender || '',
      nationality: nationality || 'Sri Lankan',
      nicNumber: nicNumber.toUpperCase(),
      address: address || '',
      district: district || '',
      province: province || '',
      city: city || '',
      phone: phone || '',
      role: email.toLowerCase().includes('admin') ? 'ADMIN' : 'VOTER',
      verificationStatus: 'REGISTERED', // Start as REGISTERED
    });

    const session = createSession(newUser.id);

    const { passwordHash: _, ...sanitizedUser } = newUser;

    const response = NextResponse.json({ 
      success: true, 
      user: sanitizedUser, 
      token: session.token 
    });

    // Set HTTP-Only Cookie
    response.cookies.set('decentravote_session', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err) {
    console.error("Registration route error:", err);
    return NextResponse.json({ error: 'Internal server error during registration' }, { status: 500 });
  }
}
