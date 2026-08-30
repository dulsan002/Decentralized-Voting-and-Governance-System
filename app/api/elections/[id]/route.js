import { NextResponse } from 'next/server';
import db from '../../../../lib/db';

export async function GET(request, { params }) {
  try {
    const electionId = Number(params.id);
    const elections = await db.get('elections') || [];
    const election = elections.find(e => Number(e.id) === electionId);

    if (!election) {
      return NextResponse.json({ error: "Election not found" }, { status: 404 });
    }

    return NextResponse.json({ election });
  } catch (error) {
    console.error("Error fetching election detail from DB:", error);
    return NextResponse.json({ error: "Failed to fetch election detail" }, { status: 500 });
  }
}
