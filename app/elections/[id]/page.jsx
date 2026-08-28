'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Vote, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  ArrowLeft, 
  Trophy, 
  RefreshCw, 
  ExternalLink,
  ShieldCheck,
  Wallet,
  UserCheck,
  XCircle,
  KeyRound
} from 'lucide-react';
import { useWeb3 } from '../../../context/Web3Context';
import { useAuth } from '../../../context/AuthContext';
import { ELECTION_STATUS, RESULT_STATUS, TIE_BREAK_MODE } from '../../../lib/contract';

export default function ElectionDetailPage() {
  const params = useParams();
  const electionId = Number(params.id);

  const { contract, account, isWalletConnected, connectWallet, signer } = useWeb3();
  const { user, isAuthenticated, isApproved, refreshUser } = useAuth();

  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [existingBallot, setExistingBallot] = useState(null);
  const [loading, setLoading] = useState(true);

  // Wallet Linking State
  const [linkingWallet, setLinkingWallet] = useState(false);
  const [linkMsg, setLinkMsg] = useState(null);

  // Form states
  const [firstPref, setFirstPref] = useState(0);
  const [secondPref, setSecondPref] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Fetch election & voter state
  const loadData = useCallback(async () => {
    if (!contract || !electionId) return;
    try {
      setLoading(true);
      setErrorMsg(null);

      const e = await contract.getElection(electionId);
      const electionObj = {
        id: Number(e.id),
        title: e.title,
        description: e.description,
        startTime: Number(e.startTime),
        endTime: Number(e.endTime),
        candidateCount: Number(e.candidateCount),
        totalVotes: Number(e.totalVotes),
        winnerId: Number(e.winnerId),
        creator: e.creator,
        status: Number(e.status),
        maxPreferences: Number(e.maxPreferences),
        secondPreferenceEnabled: e.secondPreferenceEnabled,
        tieBreakMode: Number(e.tieBreakMode),
        resultStatus: Number(e.resultStatus),
      };
      setElection(electionObj);

      const cList = await contract.getAllCandidates(electionId);
      const formattedCandidates = cList.map((c) => ({
        id: Number(c.id),
        name: c.name,
        description: c.description,
        primaryVotes: Number(c.primaryVotes),
        secondaryVotes: Number(c.secondaryVotes),
      }));
      setCandidates(formattedCandidates);

      if (account) {
        const eligible = await contract.isEligibleVoter(electionId, account);
        setIsWhitelisted(eligible);

        const b = await contract.getBallot(electionId, account);
        if (b.exists) {
          setExistingBallot({
            firstPreference: Number(b.firstPreference),
            secondPreference: Number(b.secondPreference),
            timestamp: Number(b.timestamp),
            exists: b.exists,
          });
          setFirstPref(Number(b.firstPreference));
          setSecondPref(Number(b.secondPreference));
        }
      }
    } catch (err) {
      console.warn("Smart contract fetch error, fetching election detail from database API:", err);
      try {
        const res = await fetch(`/api/elections/${electionId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.election) {
            setElection(data.election);
            setCandidates(data.election.candidates || []);
          }
        } else {
          setErrorMsg("Failed to load election details from database or blockchain.");
        }
      } catch (apiErr) {
        console.error("API fetch error:", apiErr);
        setErrorMsg("Failed to load election details.");
      }
    } finally {
      setLoading(false);
    }
  }, [contract, electionId, account]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Cryptographic Wallet Linking
  const handleLinkWallet = async () => {
    if (!account || !signer) return;
    try {
      setLinkingWallet(true);
      setLinkMsg(null);

      const res = await fetch('/api/wallet/link');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed getting challenge nonce');

      const signature = await signer.signMessage(data.message);

      const linkRes = await fetch('/api/wallet/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: account,
          signature,
          nonce: data.nonce,
        }),
      });

      const linkData = await linkRes.json();
      if (!linkRes.ok) throw new Error(linkData.error || 'Signature verification failed');

      setLinkMsg("Wallet successfully linked & verified!");
      await refreshUser();
    } catch (err) {
      console.error("Wallet link error:", err);
      setLinkMsg(`Linking failed: ${err.message}`);
    } finally {
      setLinkingWallet(false);
    }
  };

  // Handle ballot submission
  const handleSubmitBallot = async (e) => {
    e.preventDefault();
    if (!contract || !account) return;

    if (firstPref === 0) {
      setErrorMsg("Primary preference is required.");
      return;
    }
    if (secondPref !== 0 && firstPref === secondPref) {
      setErrorMsg("1st and 2nd preferences cannot be the same candidate.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);
      setTxHash(null);

      let tx;
      const contractWithSigner = signer ? contract.connect(signer) : contract;
      if (existingBallot && existingBallot.exists) {
        tx = await contractWithSigner.modifyBallot(electionId, firstPref, secondPref);
      } else {
        tx = await contractWithSigner.castBallot(electionId, firstPref, secondPref);
      }

      setTxHash(tx.hash);
      await tx.wait();
      
      await loadData();
    } catch (err) {
      console.error("Transaction failed:", err);
      if (err.reason) {
        setErrorMsg(`Reverted: ${err.reason}`);
      } else if (err.message && err.message.includes("user rejected")) {
        setErrorMsg("Transaction was rejected in wallet.");
      } else {
        setErrorMsg("Transaction failed on-chain.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
        <p className="text-xs text-muted-foreground">Loading election data from smart contract...</p>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-foreground font-display">Election Not Found</h2>
        <p className="text-xs text-muted-foreground">Election #{electionId} does not exist on-chain.</p>
        <Link href="/elections" className="inline-block px-4 py-2 bg-primary text-white rounded-lg text-xs font-semibold">
          Back to Elections
        </Link>
      </div>
    );
  }

  const isFinalized = election.status === 3;
  const isActive = election.status === 1;

  // Evaluate 6-Stage Voting Eligibility Checklist
  const isUserAuthenticated = isAuthenticated;
  const isUserIdentityApproved = isApproved;
  const isWalletLinked = user?.linkedWalletAddress && account && user.linkedWalletAddress.toLowerCase() === account.toLowerCase();
  const isWalletActive = isWalletConnected;
  const isWhitelistedOnChain = isWhitelisted;
  const isElectionActiveState = isActive;

  const canVote = isUserAuthenticated && isUserIdentityApproved && isWalletLinked && isWalletActive && isWhitelistedOnChain && isElectionActiveState;

  return (
    <div className="w-full max-w-[95%] xl:max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Top Back Link */}
      <div>
        <Link href="/elections" className="inline-flex items-center space-x-1 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Elections</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border shadow-subtle space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono text-primary bg-muted border border-border font-bold">
              Election #{election.id}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-foreground border border-border">
              {ELECTION_STATUS[election.status]}
            </span>
          </div>

          <div className="text-xs text-muted-foreground font-mono">
            {election.totalVotes} Total Votes Cast
          </div>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground mb-2">
            {election.title}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {election.description}
          </p>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border text-xs">
          <div>
            <span className="block text-muted-foreground text-[10px] uppercase font-bold mb-0.5">Tie Break Mode</span>
            <span className="font-semibold text-foreground">{TIE_BREAK_MODE[election.tieBreakMode]}</span>
          </div>
          <div>
            <span className="block text-muted-foreground text-[10px] uppercase font-bold mb-0.5">2nd Preference</span>
            <span className="font-semibold text-foreground">{election.secondPreferenceEnabled ? 'Enabled' : 'Disabled'}</span>
          </div>
          <div>
            <span className="block text-muted-foreground text-[10px] uppercase font-bold mb-0.5">Start Time</span>
            <span className="font-semibold text-foreground">{new Date(election.startTime * 1000).toLocaleDateString()}</span>
          </div>
          <div>
            <span className="block text-muted-foreground text-[10px] uppercase font-bold mb-0.5">End Time</span>
            <span className="font-semibold text-foreground">{new Date(election.endTime * 1000).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* 6-STAGE VOTER ELIGIBILITY CHECKLIST */}
      <div className="bg-card p-6 rounded-2xl border border-border shadow-subtle space-y-4">
        <h3 className="text-xs font-bold font-display text-foreground uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          6-Stage Voting Eligibility Checklist
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          
          <div className={`p-3 rounded-xl border flex items-center justify-between ${isUserAuthenticated ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800' : 'bg-muted border-border'}`}>
            <span>1. Authenticated Account</span>
            {isUserAuthenticated ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}
          </div>

          <div className={`p-3 rounded-xl border flex items-center justify-between ${isUserIdentityApproved ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800' : 'bg-muted border-border'}`}>
            <span>2. Identity Approved</span>
            {isUserIdentityApproved ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}
          </div>

          <div className={`p-3 rounded-xl border flex items-center justify-between ${isWalletActive ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800' : 'bg-muted border-border'}`}>
            <span>3. Wallet Connected</span>
            {isWalletActive ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}
          </div>

          <div className={`p-3 rounded-xl border flex items-center justify-between ${isWalletLinked ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800' : 'bg-muted border-border'}`}>
            <span>4. Wallet Verified & Linked</span>
            {isWalletLinked ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}
          </div>

          <div className={`p-3 rounded-xl border flex items-center justify-between ${isWhitelistedOnChain ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800' : 'bg-muted border-border'}`}>
            <span>5. Election Whitelisted</span>
            {isWhitelistedOnChain ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}
          </div>

          <div className={`p-3 rounded-xl border flex items-center justify-between ${isElectionActiveState ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800' : 'bg-muted border-border'}`}>
            <span>6. Election Active</span>
            {isElectionActiveState ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>

        {/* Cryptographic Link Trigger if connected but unlinked */}
        {isUserAuthenticated && isWalletActive && !isWalletLinked && (
          <div className="pt-3 border-t border-border flex items-center justify-between text-xs bg-amber-50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300">
            <div className="flex items-center space-x-2">
              <KeyRound className="w-4 h-4 flex-shrink-0" />
              <span>Connected wallet <code className="font-mono">{account}</code> is not cryptographically linked to your approved account.</span>
            </div>
            <button
              onClick={handleLinkWallet}
              disabled={linkingWallet}
              className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold whitespace-nowrap transition-colors"
            >
              {linkingWallet ? 'Signing...' : 'Sign to Link Wallet'}
            </button>
          </div>
        )}

        {linkMsg && <p className="text-xs text-emerald-600 font-semibold">{linkMsg}</p>}
      </div>

      {/* FINALIZED RESULTS DISPLAY */}
      {isFinalized && (
        <div className="bg-card p-6 sm:p-8 rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-950/10 space-y-6 shadow-subtle">
          <div className="flex items-center space-x-3">
            <Trophy className="w-7 h-7 text-amber-500" />
            <div>
              <h2 className="text-xl font-bold text-foreground font-display">Election Finalized</h2>
              <p className="text-xs text-muted-foreground">Result Determination: {RESULT_STATUS[election.resultStatus]}</p>
            </div>
          </div>

          {/* Winner Banner */}
          {election.winnerId > 0 && (
            <div className="p-4 rounded-xl bg-card border border-amber-300 dark:border-amber-700 flex items-center justify-between shadow-subtle">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 tracking-wider block mb-0.5">Declared Winner</span>
                <span className="text-xl font-bold font-display text-foreground">
                  {candidates.find(c => c.id === election.winnerId)?.name || `Candidate #${election.winnerId}`}
                </span>
              </div>
              <span className="px-3 py-1 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-300 dark:border-amber-800">
                Winner ID #{election.winnerId}
              </span>
            </div>
          )}

          {/* Results Breakdown Table */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-foreground font-display uppercase tracking-wider">Candidate Tally Breakdown</h3>
            <div className="space-y-2.5">
              {candidates.map((c) => {
                const isWinner = c.id === election.winnerId;
                const percentage = election.totalVotes > 0 ? ((c.primaryVotes / election.totalVotes) * 100).toFixed(1) : 0;
                return (
                  <div key={c.id} className={`p-3.5 rounded-xl border ${isWinner ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800' : 'bg-card border-border'}`}>
                    <div className="flex items-center justify-between mb-1.5 text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-foreground">{c.name}</span>
                        {isWinner && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white">WINNER</span>}
                      </div>
                      <div className="font-mono space-x-3 text-[11px] text-muted-foreground">
                        <span>1st Pref: <strong className="text-foreground">{c.primaryVotes}</strong> ({percentage}%)</span>
                        {election.secondPreferenceEnabled && (
                          <span>2nd Pref: <strong className="text-foreground">{c.secondaryVotes}</strong></span>
                        )}
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isWinner ? 'bg-amber-500' : 'bg-primary'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VOTING BALLOT INTERFACE */}
      {isActive && (
        <div className="space-y-6">
          
          {!canVote ? (
            <div className="bg-card p-8 text-center rounded-2xl border border-border shadow-subtle space-y-3">
              <Vote className="w-8 h-8 text-primary mx-auto" />
              <h3 className="text-base font-bold text-foreground font-display">Voting Eligibility Incomplete</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Please satisfy all 6 conditions in the checklist above to unlock your ballot.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitBallot} className="bg-card p-6 sm:p-8 rounded-2xl border border-border shadow-subtle space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
                <div>
                  <h3 className="text-lg font-bold font-display text-foreground">Cast Your Preferential Ballot</h3>
                  <p className="text-xs text-muted-foreground">
                    {existingBallot && existingBallot.exists
                      ? 'You have already voted. Submitting will update your active ballot on-chain.'
                      : 'Select your preferred candidates below.'}
                  </p>
                </div>

                {existingBallot && existingBallot.exists && (
                  <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Ballot Active
                  </span>
                )}
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {txHash && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                  <span>Transaction confirmed on blockchain!</span>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="underline font-mono text-[11px] flex items-center gap-1"
                  >
                    <span>View Tx</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Candidates Selector Grid */}
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-2 font-display uppercase tracking-wider">
                    1st Preference (Primary Vote) <span className="text-rose-600">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {candidates.map((c) => (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => setFirstPref(c.id)}
                        className={`p-4 rounded-xl text-left border transition-all ${
                          firstPref === c.id
                            ? 'bg-muted border-primary text-foreground font-bold shadow-subtle'
                            : 'bg-card border-border hover:border-muted-foreground text-muted-foreground'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold font-display text-sm">{c.name}</span>
                          {firstPref === c.id && <CheckCircle2 className="w-4 h-4 text-primary" />}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional Second Preference */}
                {election.secondPreferenceEnabled && (
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-2 font-display uppercase tracking-wider">
                      2nd Preference (Optional Tie-Break Vote)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setSecondPref(0)}
                        className={`p-3.5 rounded-xl text-left border transition-all ${
                          secondPref === 0
                            ? 'bg-muted border-border text-foreground font-semibold'
                            : 'bg-card border-border text-muted-foreground'
                        }`}
                      >
                        <span className="font-bold text-xs block">No Second Preference</span>
                        <span className="text-[11px] text-muted-foreground">Leave 2nd choice blank</span>
                      </button>

                      {candidates.map((c) => {
                        const isFirstChoice = firstPref === c.id;
                        return (
                          <button
                            type="button"
                            key={c.id}
                            disabled={isFirstChoice}
                            onClick={() => setSecondPref(c.id)}
                            className={`p-3.5 rounded-xl text-left border transition-all ${
                              isFirstChoice
                                ? 'opacity-40 cursor-not-allowed border-border bg-muted'
                                : secondPref === c.id
                                ? 'bg-muted border-primary text-foreground font-bold shadow-subtle'
                                : 'bg-card border-border hover:border-muted-foreground text-muted-foreground'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold font-display text-xs">{c.name}</span>
                              {secondPref === c.id && <CheckCircle2 className="w-4 h-4 text-primary" />}
                            </div>
                            {isFirstChoice && <span className="text-[10px] text-rose-600">Selected as 1st choice</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-border flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || firstPref === 0}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-xs shadow-sm transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Submitting to Blockchain...</span>
                    </>
                  ) : (
                    <>
                      <Vote className="w-4 h-4" />
                      <span>{existingBallot && existingBallot.exists ? 'Update Ballot' : 'Submit Ballot'}</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}
        </div>
      )}

    </div>
  );
}
