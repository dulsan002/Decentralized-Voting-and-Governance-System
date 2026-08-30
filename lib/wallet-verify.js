import crypto from 'crypto';
import { ethers } from 'ethers';
import { readDb, writeDb, updateUser } from './db';

// Generate cryptographic challenge message with random nonce
export async function generateChallengeNonce(userId) {
  const nonce = crypto.randomBytes(16).toString('hex');
  const message = `Link wallet to DecentraVote account: nonce ${nonce}`;
  
  const db = await readDb();
  const user = db.users.find(u => u.id === userId);
  if (user) {
    await updateUser(userId, { currentChallengeNonce: nonce });
  }

  return { message, nonce };
}

// Verify signature using ethers.js
export function verifyWalletSignature(address, signature, nonce) {
  try {
    const message = `Link wallet to DecentraVote account: nonce ${nonce}`;
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (err) {
    console.error("Signature verification error:", err);
    return false;
  }
}
