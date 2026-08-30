import { NextResponse } from 'next/server';
import db from '../../../lib/db';

export async function GET(request) {
  try {
    const elections = await db.get('elections') || [];
    return NextResponse.json({ elections });
  } catch (error) {
    console.error("Error fetching elections from DB:", error);
    return NextResponse.json({ error: "Failed to fetch elections" }, { status: 500 });
  }
}
