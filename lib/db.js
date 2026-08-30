/**
 * Database Abstraction Layer — DecentraVote Governance System
 * 
 * MongoDB-backed implementation that replaces the previous local JSON file (data/db.json).
 * All exported functions maintain the SAME signatures as the original db.js so that
 * API routes require zero changes — only the underlying storage engine has changed.
 * 
 * KEY CHANGE: All functions are now ASYNC since MongoDB operations are asynchronous.
 * API routes already use `async function POST/GET`, so adding `await` is seamless.
 */

import { getDb } from './mongodb';

// ──────────────────────────────────────────────
// Low-Level Helpers (readDb / writeDb / get / set)
// ──────────────────────────────────────────────

/**
 * Read entire DB state — returns an object with users, documents, verifications, sessions arrays.
 * This mirrors the old JSON structure for backward compatibility.
 */
export async function readDb() {
  const db = await getDb();
  const [users, documents, verifications, sessions] = await Promise.all([
    db.collection('users').find({}).toArray(),
    db.collection('documents').find({}).toArray(),
    db.collection('verifications').find({}).toArray(),
    db.collection('sessions').find({}).toArray(),
  ]);
  return { users, documents, verifications, sessions };
}

/**
 * Write entire DB state — replaces all collections with the provided data.
 * Used by the seed route. WARNING: This is destructive.
 */
export async function writeDb(data) {
  const db = await getDb();
  const ops = [];

  if (data.users) {
    ops.push(
      db.collection('users').deleteMany({}).then(() =>
        data.users.length > 0 ? db.collection('users').insertMany(data.users) : null
      )
    );
  }
  if (data.documents) {
    ops.push(
      db.collection('documents').deleteMany({}).then(() =>
        data.documents.length > 0 ? db.collection('documents').insertMany(data.documents) : null
      )
    );
  }
  if (data.verifications) {
    ops.push(
      db.collection('verifications').deleteMany({}).then(() =>
        data.verifications.length > 0 ? db.collection('verifications').insertMany(data.verifications) : null
      )
    );
  }
  if (data.sessions) {
    ops.push(
      db.collection('sessions').deleteMany({}).then(() =>
        data.sessions.length > 0 ? db.collection('sessions').insertMany(data.sessions) : null
      )
    );
  }

  await Promise.all(ops);
}

/**
 * Get a specific collection's data as an array.
 * @param {string} key - Collection name (e.g., 'users', 'elections', 'documents')
 */
export async function get(key) {
  const db = await getDb();
  return db.collection(key).find({}).toArray();
}

/**
 * Replace an entire collection's data.
 * @param {string} key - Collection name
 * @param {Array} value - Array of documents to store
 */
export async function set(key, value) {
  const db = await getDb();
  await db.collection(key).deleteMany({});
  if (value && value.length > 0) {
    await db.collection(key).insertMany(value);
  }
}

// ──────────────────────────────────────────────
// User Helpers
// ──────────────────────────────────────────────

export async function findUserByEmail(email) {
  const db = await getDb();
  return db.collection('users').findOne({ email: { $regex: new RegExp(`^${escapeRegex(email)}$`, 'i') } });
}

export async function findUserById(id) {
  const db = await getDb();
  return db.collection('users').findOne({ id });
}

export async function findUserByNic(nicNumber) {
  const db = await getDb();
  return db.collection('users').findOne({ nicNumber: { $regex: new RegExp(`^${escapeRegex(nicNumber)}$`, 'i') } });
}

export async function createUser(userData) {
  const db = await getDb();
  const newUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    verificationStatus: 'REGISTERED',
    role: 'VOTER',
    linkedWalletAddress: null,
    walletVerifiedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...userData,
  };
  await db.collection('users').insertOne(newUser);
  return newUser;
}

export async function updateUser(id, updates) {
  const db = await getDb();
  const result = await db.collection('users').findOneAndUpdate(
    { id },
    { $set: { ...updates, updatedAt: new Date().toISOString() } },
    { returnDocument: 'after' }
  );
  return result;
}

// ──────────────────────────────────────────────
// Session Helpers
// ──────────────────────────────────────────────

export async function createSession(userId) {
  const db = await getDb();
  const token = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const session = {
    token,
    userId,
    createdAt: new Date().toISOString(),
    expiresAt,
  };

  await db.collection('sessions').insertOne(session);
  return session;
}

export async function getSession(token) {
  if (!token) return null;
  const db = await getDb();
  const session = await db.collection('sessions').findOne({ token });
  if (!session) return null;

  if (new Date(session.expiresAt) < new Date()) {
    await deleteSession(token);
    return null;
  }
  return session;
}

export async function deleteSession(token) {
  const db = await getDb();
  await db.collection('sessions').deleteOne({ token });
}

// ──────────────────────────────────────────────
// Document Helpers (used by s3.js)
// ──────────────────────────────────────────────

export async function addDocument(docRecord) {
  const db = await getDb();
  await db.collection('documents').insertOne(docRecord);
}

export async function findDocument(docId) {
  const db = await getDb();
  return db.collection('documents').findOne({ id: docId });
}

// ──────────────────────────────────────────────
// Utility
// ──────────────────────────────────────────────

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ──────────────────────────────────────────────
// Default Export (backward compat for `import db from ...`)
// ──────────────────────────────────────────────

export default {
  readDb,
  writeDb,
  get,
  set,
  findUserByEmail,
  findUserById,
  findUserByNic,
  createUser,
  updateUser,
  createSession,
  getSession,
  deleteSession,
  addDocument,
  findDocument,
};
