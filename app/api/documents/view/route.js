import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth';
import { getDocumentAccess } from '../../../../lib/s3';

export async function GET(req) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const docId = searchParams.get('id');

    if (!docId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    const result = await getDocumentAccess(docId, user);
    if (!result) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    if (result.type === 'URL') {
      return NextResponse.redirect(result.url);
    }

    if (result.type === 'BUFFER') {
      return new NextResponse(result.buffer, {
        headers: {
          'Content-Type': result.mimeType,
          'Cache-Control': 'private, max-age=300',
        },
      });
    }

    return NextResponse.json({ error: 'Failed to access document' }, { status: 500 });
  } catch (err) {
    console.error("Document view route error:", err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
