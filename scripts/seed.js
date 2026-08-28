import fs from 'fs';
import path from 'path';
import { generateSyntheticUsers } from '../lib/seed-data.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function seedDatabase() {
  console.log("Seeding synthetic test data for DecentraVote governance system...");

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const users = generateSyntheticUsers(105);

  const initialDocuments = [
    {
      id: 'doc_demo_001',
      userId: 'usr_voter_001',
      docType: 'NIC_FRONT',
      fileName: 'usr_voter_001_NIC_FRONT_demo.png',
      fileSize: 45200,
      mimeType: 'image/png',
      uploadedAt: new Date().toISOString(),
    },
    {
      id: 'doc_demo_002',
      userId: 'usr_voter_001',
      docType: 'NIC_BACK',
      fileName: 'usr_voter_001_NIC_BACK_demo.png',
      fileSize: 42100,
      mimeType: 'image/png',
      uploadedAt: new Date().toISOString(),
    },
  ];

  const dbState = {
    users,
    documents: initialDocuments,
    verifications: [],
    sessions: [],
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2), 'utf-8');
  console.log(`Successfully seeded ${users.length} synthetic voter profiles into data/db.json`);
}

seedDatabase();
