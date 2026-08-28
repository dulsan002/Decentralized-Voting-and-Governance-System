'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, 
  Vote, 
  Users, 
  Trophy, 
  PieChart, 
  RefreshCw, 
  FileText,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { ELECTION_STATUS, RESULT_STATUS, TIE_BREAK_MODE } from '../lib/contract';

export default function ElectionAnalyticsManager() {
  const { contract } = useWeb3();
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedElectionId, setSelectedElectionId] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    if (!contract) return;
    try {
      setLoading(true);
      const count = await contract.getElectionCount();
      const total = Number(count);
      const list = [];

      for (let i = 1; i <= total; i++) {
        try {
          const e = await contract.getElection(i);
          const cList = await contract.getAllCandidates(i);

          const formattedCandidates = cList.map((c) => ({
            id: Number(c.id),
            name: c.name,
            description: c.description,
            primaryVotes: Number(c.primaryVotes),
            secondaryVotes: Number(c.secondaryVotes),
          }));

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
            secondPreferenceEnabled: e.secondPreferenceEnabled,
            tieBreakMode: Number(e.tieBreakMode),
            resultStatus: Number(e.resultStatus),
            candidates: formattedCandidates,
          });
        } catch (err) {
          console.error(`Failed loading election #${i} analytics:`, err);
        }
      }

      setElections(list.reverse());
      if (list.length > 0 && !selectedElectionId) {
        setSelectedElectionId(list[0].id);
      }
    } catch (err) {
      console.error("Error loading analytics:", err);
    } finally {
      setLoading(false);
    }
  }, [contract, selectedElectionId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const selectedElection = elections.find(e => e.id === selectedElectionId);

  if (loading) {
    return (
      <div className="bg-card p-12 rounded-2xl border border-border text-center space-y-2 shadow-subtle">
        <RefreshCw className="w-6 h-6 text-primary animate-spin mx-auto" />
        <p className="text-xs text-muted-foreground">Aggregating smart contract election tallies & voting metrics...</p>
      </div>
    );
  }

  if (elections.length === 0) {
    return (
      <div className="bg-card p-12 rounded-2xl border border-border text-center space-y-2 shadow-subtle">
        <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto" />
        <p className="text-xs font-semibold text-foreground">No active or historic elections found on blockchain.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card p-5 rounded-2xl border border-border shadow-subtle space-y-1">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total On-Chain Elections</span>
          <div className="text-2xl font-bold font-display text-foreground">{elections.length}</div>
        </div>

        <div className="bg-card p-5 rounded-2xl border border-border shadow-subtle space-y-1">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total Ballots Cast Across System</span>
          <div className="text-2xl font-bold font-display text-primary">
            {elections.reduce((acc, curr) => acc + curr.totalVotes, 0)}
          </div>
        </div>

        <div className="bg-card p-5 rounded-2xl border border-border shadow-subtle space-y-1">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Finalized & Decided Elections</span>
          <div className="text-2xl font-bold font-display text-emerald-600">
            {elections.filter(e => e.status === 3).length}
          </div>
        </div>
      </div>

      {/* Main Analytics Inspector */}
      <div className="bg-card p-6 rounded-2xl border border-border shadow-subtle space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
          <div>
            <h3 className="text-base font-bold font-display text-foreground flex items-center gap-2">
              <PieChart className="w-4 h-4 text-primary" />
              Election Breakdown & Voting Data
            </h3>
            <p className="text-xs text-muted-foreground">Select an election contract to inspect ballot tallies and winner determinations.</p>
          </div>

          <select
            value={selectedElectionId || ''}
            onChange={(e) => setSelectedElectionId(Number(e.target.value))}
            className="px-3 py-2 rounded-xl bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary font-semibold"
          >
            {elections.map((e) => (
              <option key={e.id} value={e.id}>
                Election #{e.id} — {e.title} ({ELECTION_STATUS[e.status]})
              </option>
            ))}
          </select>
        </div>

        {selectedElection && (
          <div className="space-y-6">
            
            {/* Header info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted p-4 rounded-xl border border-border text-xs">
              <div><span className="text-muted-foreground block text-[10px] uppercase font-bold">Total Ballots Cast</span><strong className="text-foreground font-mono text-sm">{selectedElection.totalVotes}</strong></div>
              <div><span className="text-muted-foreground block text-[10px] uppercase font-bold">Candidate Count</span><strong className="text-foreground">{selectedElection.candidateCount}</strong></div>
              <div><span className="text-muted-foreground block text-[10px] uppercase font-bold">Lifecycle State</span><strong className="text-primary">{ELECTION_STATUS[selectedElection.status]}</strong></div>
              <div><span className="text-muted-foreground block text-[10px] uppercase font-bold">Result Status</span><strong className="text-emerald-600">{RESULT_STATUS[selectedElection.resultStatus]}</strong></div>
            </div>

            {/* Candidate Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold font-display text-foreground uppercase tracking-wider">Candidate Voting Tallies & Preference Percentages</h4>
              <div className="space-y-3">
                {selectedElection.candidates.map((c) => {
                  const isWinner = selectedElection.winnerId === c.id;
                  const pct = selectedElection.totalVotes > 0 ? ((c.primaryVotes / selectedElection.totalVotes) * 100).toFixed(1) : 0;
                  
                  return (
                    <div key={c.id} className={`p-4 rounded-xl border ${isWinner ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800' : 'bg-muted/50 border-border'}`}>
                      <div className="flex items-center justify-between mb-2 text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-foreground font-display text-sm">{c.name}</span>
                          {isWinner && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white flex items-center gap-1">
                              <Trophy className="w-3 h-3" /> WINNER
                            </span>
                          )}
                        </div>

                        <div className="font-mono text-xs space-x-4">
                          <span>1st Preference: <strong className="text-foreground">{c.primaryVotes}</strong> ({pct}%)</span>
                          {selectedElection.secondPreferenceEnabled && (
                            <span>2nd Preference: <strong className="text-foreground">{c.secondaryVotes}</strong></span>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2.5 rounded-full bg-card border border-border overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isWinner ? 'bg-amber-500' : 'bg-primary'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
