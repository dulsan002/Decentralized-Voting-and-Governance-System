import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth';
import { saveDocument } from '../../../../lib/s3';
import { updateUser } from '../../../../lib/db';

export async function POST(req) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { nicFrontDataUrl, nicBackDataUrl } = body;

    if (!nicFrontDataUrl || !nicBackDataUrl) {
      return NextResponse.json({ error: 'Missing NIC image files' }, { status: 400 });
    }

    const frontDoc = await saveDocument(user.id, 'NIC_FRONT', nicFrontDataUrl);
    const backDoc = await saveDocument(user.id, 'NIC_BACK', nicBackDataUrl);

    // Update User Verification state to PENDING_VERIFICATION
    await updateUser(user.id, {
      verificationStatus: 'PENDING_VERIFICATION',
    });

    return NextResponse.json({
      success: true,
      documents: [frontDoc, backDoc],
      verificationStatus: 'PENDING_VERIFICATION',
    });
  } catch (err) {
    console.error("Document upload error:", err);
    return NextResponse.json({ error: 'Failed uploading documents' }, { status: 500 });
  }
}
