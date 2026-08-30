'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FileText, RefreshCw, ExternalLink, ShieldCheck, Lock, LogIn } from 'lucide-react';
import { useWeb3 } from '../../context/Web3Context';
import { useAuth } from '../../context/AuthContext';

export default function AuditTrailPage() {
  const { contract, account } = useWeb3();
  const { isAuthenticated, isAdmin } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAuditLogs = useCallback(async () => {
    if (!contract) return;
    try {
      setLoading(true);
      const filter = contract.filters.BallotCast();
      
      // Free public RPCs limit log queries to 10,000 blocks at a time.
      // We will query from 9000 blocks ago to latest.
      const currentBlock = await contract.runner.provider.getBlockNumber();
      const startBlock = Math.max(0, currentBlock - 9000);
      const logs = await contract.queryFilter(filter, startBlock, 'latest');

      let formatted = logs.map((log) => ({
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
        electionId: Number(log.args[0]),
        voter: log.args[1],
        firstPref: Number(log.args[2]),
        secondPref: Number(log.args[3]),
      }));

      // Enterprise Security: Voters only see their own immutable record. Admins see full ledger.
      if (!isAdmin && account) {
        formatted = formatted.filter(evt => evt.voter.toLowerCase() === account.toLowerCase());
      }

      setEvents(formatted.reverse());
    } catch (err) {
      console.error("Error loading audit logs:", err);
    } finally {
      setLoading(false);
    }
  }, [contract, isAdmin, account]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAuditLogs();
    }
  }, [fetchAuditLogs, isAuthenticated]);

  // Auth requirement wall for unauthenticated guest users
  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-[95%] xl:max-w-[92%] mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold font-display text-foreground">Authentication Required</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          The system audit trail and event log are reserved for authenticated voters and system administrators. Please sign in to access blockchain audit records.
        </p>
        <div className="pt-2">
          <Link
            href="/login"
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-sm transition-all"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In to Access Audit Trail</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[95%] xl:max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <h1 className="text-3xl font-bold font-display text-foreground">Immutable Audit Log</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              On-Chain Verified
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Real-time audit log of all smart contract events emitted on the Ethereum blockchain.
          </p>
        </div>

        <button
          onClick={fetchAuditLogs}
          className="px-4 py-2 rounded-xl bg-card border border-border hover:bg-muted text-xs font-semibold text-foreground flex items-center space-x-2 transition-all shadow-subtle self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Contract Target Banner */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div>
          <span className="text-muted-foreground text-[10px] uppercase font-bold block">Smart Contract Target</span>
          <code className="font-mono text-primary font-bold text-sm">
            {contract?.target || 'DecentraVote.sol'}
          </code>
        </div>
        <div className="text-right">
          <span className="text-muted-foreground text-[10px] uppercase font-bold block">Total Events Recorded</span>
          <span className="font-bold text-foreground font-mono text-base">{events.length}</span>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-card rounded-2xl border border-border shadow-subtle overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-muted-foreground space-y-2">
            <RefreshCw className="w-6 h-6 text-primary animate-spin mx-auto" />
            <p className="text-xs">Querying EVM event logs from smart contract...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="p-16 text-center text-muted-foreground space-y-2">
            <FileText className="w-8 h-8 text-muted-foreground/50 mx-auto" />
            <p className="text-xs font-semibold">No audit events found on smart contract.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted border-b border-border text-muted-foreground font-mono uppercase text-[11px]">
                <tr>
                  <th className="py-3.5 px-5">Block #</th>
                  <th className="py-3.5 px-5">Election ID</th>
                  <th className="py-3.5 px-5">Voter Wallet Address</th>
                  <th className="py-3.5 px-5">Preferences</th>
                  <th className="py-3.5 px-5 text-right">Transaction Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground">
                {events.map((evt, idx) => (
                  <tr key={idx} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-primary">
                      #{evt.blockNumber}
                    </td>
                    <td className="py-3.5 px-5 font-semibold">
                      Election #{evt.electionId}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-muted-foreground">
                      {evt.voter}
                    </td>
                    <td className="py-3.5 px-5 space-x-2 font-mono text-[11px]">
                      <span className="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                        1st: Cand #{evt.firstPref}
                      </span>
                      {evt.secondPref > 0 && (
                        <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                          2nd: Cand #{evt.secondPref}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono">
                      <a
                        href={`https://sepolia.etherscan.io/tx/${evt.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                      >
                        <span>{evt.txHash.substring(0, 8)}...{evt.txHash.substring(evt.txHash.length - 6)}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
