import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth';
import { generateChallengeNonce, verifyWalletSignature } from '../../../../lib/wallet-verify';
import { updateUser, readDb } from '../../../../lib/db';

// GET /api/wallet/link - Get challenge message for authenticated user
export async function GET(req) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, nonce } = await generateChallengeNonce(user.id);
    return NextResponse.json({ success: true, message, nonce });
  } catch (err) {
    console.error("Wallet challenge GET error:", err);
    return NextResponse.json({ error: 'Failed generating challenge' }, { status: 500 });
  }
}

// POST /api/wallet/link - Submit signed message to verify and link wallet address
export async function POST(req) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { address, signature, nonce } = body;

    if (!address || !signature || !nonce) {
      return NextResponse.json({ error: 'Missing address, signature, or nonce' }, { status: 400 });
    }

    const isValid = verifyWalletSignature(address, signature, nonce);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid wallet signature. Ownership verification failed.' }, { status: 400 });
    }

    // If wallet is already linked to another account, automatically unlink it from that account
    // This prevents wallet-stealing conflicts when users switch between accounts with the same MetaMask wallet
    const db = await readDb();
    const existingLink = db.users.find(u => u.linkedWalletAddress && u.linkedWalletAddress.toLowerCase() === address.toLowerCase() && u.id !== user.id);
    if (existingLink) {
      await updateUser(existingLink.id, {
        linkedWalletAddress: null,
        walletVerifiedAt: null,
      });
    }

    // Link wallet address to user account
    const updated = await updateUser(user.id, {
      linkedWalletAddress: address,
      walletVerifiedAt: new Date().toISOString(),
      currentChallengeNonce: null,
    });

    const { passwordHash: _, ...sanitized } = updated;
    return NextResponse.json({ success: true, user: sanitized });
  } catch (err) {
    console.error("Wallet linking POST error:", err);
    return NextResponse.json({ error: 'Failed linking wallet' }, { status: 500 });
  }
}
