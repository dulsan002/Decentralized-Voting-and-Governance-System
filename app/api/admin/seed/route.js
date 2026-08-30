import { NextResponse } from 'next/server';
import { generateSyntheticUsers } from '../../../../lib/seed-data';
import { readDb, writeDb } from '../../../../lib/db';

export async function POST(req) {
  try {
    const db = await readDb();
    const syntheticUsers = generateSyntheticUsers(105);

    // Merge existing admin & key users
    const existingMap = new Map(db.users.map(u => [u.email.toLowerCase(), u]));
    syntheticUsers.forEach(su => {
      if (!existingMap.has(su.email.toLowerCase())) {
        db.users.push(su);
      }
    });

    await writeDb(db);

    return NextResponse.json({
      success: true,
      message: `Seeded synthetic voter database. Total users in system: ${db.users.length}`,
      totalUsers: db.users.length,
    });
  } catch (err) {
    console.error("Seed API error:", err);
    return NextResponse.json({ error: 'Failed executing seed' }, { status: 500 });
  }
}
