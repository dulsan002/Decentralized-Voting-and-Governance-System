'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Vote, RefreshCw, Trophy, ArrowRight, CheckCircle2, ShieldCheck, Clock } from 'lucide-react';
import { useWeb3 } from '../../context/Web3Context';
import { ELECTION_STATUS, RESULT_STATUS } from '../../lib/contract';

export default function ElectionsListPage() {
  const { contract } = useWeb3();
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchElections = useCallback(async () => {
    try {
      setLoading(true);
      let list = [];

      // 1. Try querying smart contract on-chain
      if (contract) {
        try {
          const count = await contract.getElectionCount();
          const total = Number(count);

          for (let i = 1; i <= total; i++) {
            const e = await contract.getElection(i);
            list.push({
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
        } catch (err) {
          console.warn("Smart contract query failed or unseeded, fetching from database API:", err);
        }
      }

      // 2. If contract returned no elections or failed, fetch dynamically from database API (/api/elections)
      if (list.length === 0) {
        const res = await fetch('/api/elections');
        if (res.ok) {
          const data = await res.json();
          list = data.elections || [];
        }
      }

      setElections(list.reverse());
    } catch (err) {
      console.error("Error fetching elections:", err);
    } finally {
      setLoading(false);
    }
  }, [contract]);

  useEffect(() => {
    fetchElections();
  }, [fetchElections]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 1: // Active
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">Active — Voting Open</span>;
      case 2: // Ended
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300">Ended — Tallying</span>;
      case 3: // Finalized
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300">Finalized</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300">Created (Pending)</span>;
    }
  };

  return (
    <div className="w-full max-w-[95%] xl:max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">Governance Elections</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Publicly auditable blockchain elections, ballot statuses, and election results.
          </p>
        </div>

        <button
          onClick={fetchElections}
          className="px-4 py-2 rounded-xl bg-card border border-border hover:bg-muted text-xs font-semibold text-foreground flex items-center space-x-2 transition-all shadow-subtle self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-card p-16 rounded-3xl border border-border text-center space-y-3 shadow-subtle">
          <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground font-semibold">Querying Ethereum smart contract and database elections...</p>
        </div>
      ) : elections.length === 0 ? (
        <div className="bg-card p-16 rounded-3xl border border-border text-center space-y-3 shadow-subtle">
          <Vote className="w-10 h-10 text-muted-foreground mx-auto" />
          <h3 className="text-base font-bold text-foreground font-display">No Elections Found</h3>
          <p className="text-xs text-muted-foreground">There are currently no election records found in database or on-chain.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {elections.map((e) => (
            <div key={e.id} className="bg-card p-6 sm:p-7 rounded-3xl border border-border shadow-subtle hover:border-primary/50 transition-all space-y-5 flex flex-col justify-between">
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-primary bg-muted px-2.5 py-0.5 rounded-full border border-border">
                    Election #{e.id}
                  </span>
                  {getStatusBadge(e.status)}
                </div>

                <div>
                  <h2 className="text-xl font-bold font-display text-foreground mb-1.5">{e.title}</h2>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{e.description}</p>
                </div>
              </div>

              {/* Tally Metrics */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Candidates</span>
                  <span className="font-bold text-foreground">{e.candidateCount} Candidates</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Ballots Cast</span>
                  <span className="font-bold text-foreground font-mono">{e.totalVotes} Votes</span>
                </div>
              </div>

              {/* Finalized Winner Banner */}
              {e.status === 3 && e.winnerId > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span className="font-bold">Declared Winner: Candidate #{e.winnerId}</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-amber-200 dark:bg-amber-900 px-2 py-0.5 rounded font-bold">
                    Result Final
                  </span>
                </div>
              )}

              <div className="pt-2">
                <Link
                  href={`/elections/${e.id}`}
                  className="w-full py-2.5 rounded-xl bg-muted hover:bg-border text-foreground font-semibold text-xs transition-colors flex items-center justify-center space-x-2"
                >
                  <span>{e.status === 3 ? 'View Final Results & Tally' : 'View Election & Ballot'}</span>
                  <ArrowRight className="w-4 h-4 text-primary" />
                </Link>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
