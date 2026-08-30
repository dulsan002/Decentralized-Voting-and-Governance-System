import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
export const dynamic = 'force-dynamic';
import { DECENTRAVOTE_ABI, CONTRACT_ADDRESS } from '../../../lib/contract';

export async function GET(request) {
  try {
    const rpcUrl = process.env.SEPOLIA_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL;
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, DECENTRAVOTE_ABI, provider);

    const count = await contract.getElectionCount();
    const total = Number(count);
    let elections = [];

    for (let i = 1; i <= total; i++) {
      const e = await contract.getElection(i);
      elections.push({
        id: Number(e.id),
        title: e.title,
        description: e.description,
        startTime: Number(e.startTime),
        endTime: Number(e.endTime),
        candidateCount: Number(e.candidateCount),
        totalVotes: Number(e.totalVotes),
        winnerId: Number(e.winnerId),
        status: Number(e.status),
        resultStatus: Number(e.resultStatus),
      });
    }

    return NextResponse.json({ elections });
  } catch (error) {
    console.error("Error fetching elections from Smart Contract:", error);
    return NextResponse.json({ error: "Failed to fetch elections", elections: [] }, { status: 500 });
  }
}
