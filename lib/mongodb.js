/**
 * MongoDB Connection Module — DecentraVote Governance System
 * 
 * Provides a cached MongoDB client connection optimized for serverless 
 * environments (Vercel). Reuses connections across API route invocations
 * to avoid exhausting the connection pool.
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'decentravote';

if (!MONGODB_URI) {
  throw new Error(
    'MONGODB_URI is not defined. Please add it to your .env.local or Vercel Environment Variables.'
  );
}

const options = {
  maxPoolSize: 10,
};

let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
  // In development, use a global variable to preserve the connection
  // across hot-reloads caused by Next.js HMR
  if (!global._mongoClientPromise) {
    client = new MongoClient(MONGODB_URI, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production, create a new client for each serverless instance
  client = new MongoClient(MONGODB_URI, options);
  clientPromise = client.connect();
}

/**
 * Returns the connected MongoDB database instance.
 * @returns {Promise<import('mongodb').Db>}
 */
export async function getDb() {
  const client = await clientPromise;
  return client.db(DB_NAME);
}

export default clientPromise;
