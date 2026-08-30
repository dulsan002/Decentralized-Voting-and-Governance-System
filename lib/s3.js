import { readDb, addDocument } from './db';

/**
 * Save NIC identity document securely.
 * In production (Vercel), documents are stored as base64 in MongoDB
 * since the filesystem is read-only. For a production-grade app,
 * you would use AWS S3 or Cloudinary.
 */
export async function saveDocument(userId, docType, dataUrl) {
  const fileExt = dataUrl.startsWith('data:image/png') ? 'png' : 'jpg';
  const fileName = `${userId}_${docType}_${Date.now()}.${fileExt}`;

  // Extract base64 buffer
  const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');

  // Save metadata record in DB (store base64 in MongoDB for serverless compat)
  const docRecord = {
    id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    docType, // NIC_FRONT or NIC_BACK
    fileName,
    s3Key: null,
    base64Data, // Store the image data directly in MongoDB
    fileSize: Buffer.from(base64Data, 'base64').length,
    mimeType: `image/${fileExt}`,
    uploadedAt: new Date().toISOString(),
  };

  await addDocument(docRecord);

  // Return record without the heavy base64 payload
  const { base64Data: _, ...meta } = docRecord;
  return meta;
}

/**
 * Retrieve document binary for authenticated Admin request.
 */
export async function getDocumentAccess(docId, reqUser) {
  const { findDocument } = await import('./db');
  const doc = await findDocument(docId);
  if (!doc) return null;

  // Authorization check: Admin OR Document Owner
  if (reqUser.role !== 'ADMIN' && reqUser.id !== doc.userId) {
    return { error: 'Unauthorized access to identity document', status: 403 };
  }

  if (doc.base64Data) {
    const buffer = Buffer.from(doc.base64Data, 'base64');
    return { type: 'BUFFER', buffer, mimeType: doc.mimeType, doc };
  }

  return null;
}
