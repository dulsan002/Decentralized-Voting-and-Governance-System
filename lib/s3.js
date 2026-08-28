import fs from 'fs';
import path from 'path';
import { readDb, writeDb } from './db';

// Storage Directory for Local Secure Storage Fallback
const STORAGE_DIR = path.join(process.cwd(), 'data', 'secure_documents');

function ensureStorageDir() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
}

/**
 * Save NIC identity document securely.
 * Supports AWS S3 if credentials exist in .env.local, or local private storage fallback.
 */
export async function saveDocument(userId, docType, dataUrl) {
  ensureStorageDir();

  const fileExt = dataUrl.startsWith('data:image/png') ? 'png' : 'jpg';
  const fileName = `${userId}_${docType}_${Date.now()}.${fileExt}`;
  const localFilePath = path.join(STORAGE_DIR, fileName);

  // Extract base64 buffer
  const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  let s3Key = null;

  // AWS S3 Integration disabled to prevent Next.js Webpack 'Module not found' errors

  // Always write local file as secure fallback
  fs.writeFileSync(localFilePath, buffer);

  // Save metadata record in DB
  const db = readDb();
  const docRecord = {
    id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    docType, // NIC_FRONT or NIC_BACK
    fileName,
    s3Key,
    fileSize: buffer.length,
    mimeType: `image/${fileExt}`,
    uploadedAt: new Date().toISOString(),
  };

  db.documents.push(docRecord);
  writeDb(db);

  return docRecord;
}

/**
 * Retrieve document binary or presigned URL for authenticated Admin request.
 */
export async function getDocumentAccess(docId, reqUser) {
  const db = readDb();
  const doc = db.documents.find(d => d.id === docId);
  if (!doc) return null;

  // Authorization check: Admin OR Document Owner
  if (reqUser.role !== 'ADMIN' && reqUser.id !== doc.userId) {
    return { error: 'Unauthorized access to identity document', status: 403 };
  }

  // AWS S3 Integration disabled to prevent Next.js Webpack 'Module not found' errors
  // Local Secure Proxy Fallback is now strictly enforced

  // Local Secure Proxy Fallback
  ensureStorageDir();
  const localFilePath = path.join(STORAGE_DIR, doc.fileName);
  if (fs.existsSync(localFilePath)) {
    const buffer = fs.readFileSync(localFilePath);
    return { type: 'BUFFER', buffer, mimeType: doc.mimeType, doc };
  }

  return null;
}
