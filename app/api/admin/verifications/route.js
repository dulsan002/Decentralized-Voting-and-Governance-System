import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth';
import { readDb, updateUser } from '../../../../lib/db';

// GET /api/admin/verifications - List users & document metadata for admin review
export async function GET(req) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin role required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status') || 'ALL';
    const searchQuery = (searchParams.get('search') || '').toLowerCase();

    const db = readDb();

    let usersList = db.users.map(u => {
      const { passwordHash, ...sanitized } = u;
      const userDocs = db.documents.filter(d => d.userId === u.id);
      return {
        ...sanitized,
        documents: userDocs.map(d => ({
          id: d.id,
          docType: d.docType,
          fileName: d.fileName,
          uploadedAt: d.uploadedAt,
        })),
      };
    });

    if (statusFilter !== 'ALL') {
      usersList = usersList.filter(u => u.verificationStatus === statusFilter);
    }

    if (searchQuery) {
      usersList = usersList.filter(u =>
        u.fullName.toLowerCase().includes(searchQuery) ||
        u.email.toLowerCase().includes(searchQuery) ||
        (u.nicNumber && u.nicNumber.toLowerCase().includes(searchQuery)) ||
        (u.linkedWalletAddress && u.linkedWalletAddress.toLowerCase().includes(searchQuery))
      );
    }

    return NextResponse.json({ success: true, users: usersList });
  } catch (err) {
    console.error("Admin verifications GET error:", err);
    return NextResponse.json({ error: 'Failed fetching verifications' }, { status: 500 });
  }
}

// POST /api/admin/verifications - Status update, wallet unlinking, support problem resolution
export async function POST(req) {
  try {
    const adminUser = getAuthenticatedUser(req);
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin role required.' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, action, status, rejectionReason, unlinkWallet, adminNotes } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const db = readDb();
    const targetUser = db.users.find(u => u.id === userId);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updates = {
      updatedAt: new Date().toISOString(),
    };

    // Support Action 1: Status Change
    if (status) {
      const allowedStatuses = ['REGISTERED', 'PENDING_VERIFICATION', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'];
      if (!allowedStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid verification status' }, { status: 400 });
      }
      updates.verificationStatus = status;
      updates.reviewedAt = new Date().toISOString();
      updates.reviewerAdminId = adminUser.id;
      if (status === 'REJECTED') {
        updates.rejectionReason = rejectionReason || 'Identity verification requirements not satisfied.';
      }
    }

    // Support Action 2: Unlink Lost/Stolen Wallet
    if (unlinkWallet) {
      updates.linkedWalletAddress = null;
      updates.walletVerifiedAt = null;
    }

    // Support Action 3: Add Admin Notes
    if (adminNotes !== undefined) {
      updates.adminNotes = adminNotes;
    }

    const updated = updateUser(userId, updates);
    const { passwordHash: _, ...sanitized } = updated;
    return NextResponse.json({ success: true, user: sanitized });
  } catch (err) {
    console.error("Admin verifications POST error:", err);
    return NextResponse.json({ error: 'Failed updating voter record' }, { status: 500 });
  }
}
