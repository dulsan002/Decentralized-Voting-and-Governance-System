import fs from 'fs';
import path from 'path';

// Path to local JSON database file in data directory
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Initial schema structure
const INITIAL_DB = {
  users: [],
  documents: [],
  verifications: [],
  sessions: [],
};

// Ensure data directory and db file exist
function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DB, null, 2), 'utf-8');
  }
}

// Read DB state
export function readDb() {
  ensureDb();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading database:", err);
    return INITIAL_DB;
  }
}

export function get(key) {
  const db = readDb();
  return db[key];
}

export function set(key, value) {
  const db = readDb();
  db[key] = value;
  writeDb(db);
}

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
  deleteSession
};

// Write DB state atomically
export function writeDb(data) {
  ensureDb();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error("Error writing database:", err);
  }
}

// User Helpers
export function findUserByEmail(email) {
  const db = readDb();
  return db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(id) {
  const db = readDb();
  return db.users.find(u => u.id === id);
}

export function findUserByNic(nicNumber) {
  const db = readDb();
  return db.users.find(u => u.nicNumber && u.nicNumber.toUpperCase() === nicNumber.toUpperCase());
}

export function createUser(userData) {
  const db = readDb();
  const newUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    verificationStatus: 'REGISTERED', // REGISTERED, PENDING_VERIFICATION, UNDER_REVIEW, APPROVED, REJECTED
    role: 'VOTER', // VOTER or ADMIN
    linkedWalletAddress: null,
    walletVerifiedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...userData,
  };
  db.users.push(newUser);
  writeDb(db);
  return newUser;
}

export function updateUser(id, updates) {
  const db = readDb();
  const idx = db.users.findIndex(u => u.id === id);
  if (idx === -1) return null;

  db.users[idx] = {
    ...db.users[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  writeDb(db);
  return db.users[idx];
}

// Session Helpers
export function createSession(userId) {
  const db = readDb();
  const token = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  const session = {
    token,
    userId,
    createdAt: new Date().toISOString(),
    expiresAt,
  };

  db.sessions.push(session);
  writeDb(db);
  return session;
}

export function getSession(token) {
  if (!token) return null;
  const db = readDb();
  const session = db.sessions.find(s => s.token === token);
  if (!session) return null;

  if (new Date(session.expiresAt) < new Date()) {
    deleteSession(token);
    return null;
  }
  return session;
}

export function deleteSession(token) {
  const db = readDb();
  db.sessions = db.sessions.filter(s => s.token !== token);
  writeDb(db);
}
