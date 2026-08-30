import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDb } from '../../../lib/mongodb';

function hashPassword(password) {
  const salt = 'c7d740c0363297a78e7c10b77b7d0d0f';
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export async function GET(req) {
  try {
    const db = await getDb();
    
    const newUsers = [];
    const newDocuments = [];
    const newVerifications = [];
    const newSessions = [];

    const statuses = ['APPROVED', 'PENDING_VERIFICATION', 'UNDER_REVIEW', 'REJECTED'];
    
    // Generate 15 fake users with associated documents, verifications, and sessions
    for (let i = 1; i <= 15; i++) {
      const uniqueSuffix = Date.now() + '_' + i;
      const userId = `usr_append_${uniqueSuffix}`;
      const status = statuses[i % statuses.length];
      
      // 1. User Record
      newUsers.push({
        id: userId,
        fullName: `Appended User ${i}`,
        email: `appended${uniqueSuffix}@example.com`,
        passwordHash: hashPassword("Password123!"),
        role: "VOTER",
        verificationStatus: status,
        nicNumber: `199${i}00000${i}`,
        dob: `199${i % 9}-01-15`,
        gender: i % 2 === 0 ? "Male" : "Female",
        nationality: "Sri Lankan",
        address: `No ${i}, Appended Street, Colombo`,
        district: "Colombo",
        province: "Western",
        city: "Colombo",
        phone: `+947700000${i.toString().padStart(2, '0')}`,
        linkedWalletAddress: status === 'APPROVED' ? `0xAppendedWallet${uniqueSuffix}` : null,
        walletVerifiedAt: status === 'APPROVED' ? new Date().toISOString() : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // 2. Document Record
      const docId = `doc_${uniqueSuffix}`;
      newDocuments.push({
        id: docId,
        userId: userId,
        fileName: `nic_front_${i}.jpg`,
        fileType: "image/jpeg",
        s3Url: `https://dummy-bucket.s3.amazonaws.com/${docId}.jpg`,
        uploadedAt: new Date().toISOString()
      });

      // 3. Verification Record
      newVerifications.push({
        id: `ver_${uniqueSuffix}`,
        userId: userId,
        documentId: docId,
        status: status,
        adminNotes: status === 'REJECTED' ? 'Blurry image' : 'Looks good',
        reviewedBy: 'usr_admin_001',
        reviewedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });

      // 4. Session Record
      newSessions.push({
        token: `sess_${uniqueSuffix}`,
        userId: userId,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      });
    }

    // Insert all records without deleting existing ones
    await Promise.all([
      db.collection('users').insertMany(newUsers),
      db.collection('documents').insertMany(newDocuments),
      db.collection('verifications').insertMany(newVerifications),
      db.collection('sessions').insertMany(newSessions)
    ]);

    return NextResponse.json({
      success: true,
      message: `Successfully appended 15 records to users, documents, verifications, and sessions!`,
      inserted: {
        users: newUsers.length,
        documents: newDocuments.length,
        verifications: newVerifications.length,
        sessions: newSessions.length
      }
    });

  } catch (error) {
    console.error("Append seed error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
