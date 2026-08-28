'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Play, 
  Square, 
  CheckSquare, 
  RefreshCw, 
  AlertTriangle, 
  UserCheck,
  Vote,
  FileText,
  BarChart3
} from 'lucide-react';
import { useWeb3 } from '../../context/Web3Context';
import { useAuth } from '../../context/AuthContext';
import { ELECTION_STATUS, TIE_BREAK_MODE } from '../../lib/contract';
import AdminVerificationManager from '../../components/AdminVerificationManager';
import ElectionAnalyticsManager from '../../components/ElectionAnalyticsManager';

export default function AdminDashboardPage() {
  const { contract, account, isOrganizer, isWalletConnected, connectWallet } = useWeb3();
  const { user: authUser } = useAuth();

  const [activeTab, setActiveTab] = useState('ELECTIONS'); // ELECTIONS, VERIFICATIONS, ANALYTICS

  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedElectionId, setSelectedElectionId] = useState(null);

  // Form states: Create Election
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [startDelayMinutes, setStartDelayMinutes] = useState(5);
  const [durationHours, setDurationHours] = useState(24);
  const [secondPrefEnabled, setSecondPrefEnabled] = useState(true);
  const [tieBreakMode, setTieBreakMode] = useState(0);

  // Form states: Candidates & Voters
  const [candName, setCandName] = useState('');
  const [candDesc, setCandDesc] = useState('');
  const [voterAddress, setVoterAddress] = useState('');
  const [batchVotersText, setBatchVotersText] = useState('');

  // UI state
  const [statusMsg, setStatusMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Load organizer elections
  const loadElections = useCallback(async () => {
    if (!contract) return;
    try {
      setLoading(true);
      const count = await contract.getElectionCount();
      const total = Number(count);
      const list = [];

      for (let i = 1; i <= total; i++) {
        try {
          const e = await contract.getElection(i);
          list.push({
            id: Number(e.id),
            title: e.title,
            description: e.description,
            startTime: Number(e.startTime),
            endTime: Number(e.endTime),
            candidateCount: Number(e.candidateCount),
            totalVotes: Number(e.totalVotes),
            status: Number(e.status),
            creator: e.creator,
          });
        } catch (err) {
          console.error(`Failed loading election #${i}:`, err);
        }
      }
      setElections(list.reverse());
      if (list.length > 0 && !selectedElectionId) {
        setSelectedElectionId(list[0].id);
      }
    } catch (err) {
      console.error("Error fetching admin elections:", err);
    } finally {
      setLoading(false);
    }
  }, [contract, selectedElectionId]);

  useEffect(() => {
    loadElections();
  }, [loadElections]);

  const handleCreateElection = async (e) => {
    e.preventDefault();
    if (!contract) return;
    try {
      setSubmitting(true);
      setErrorMsg(null);
      setStatusMsg(null);

      const nowSec = Math.floor(Date.now() / 1000);
      const startSec = nowSec + Number(startDelayMinutes) * 60;
      const endSec = startSec + Number(durationHours) * 3600;

      const tx = await contract.createElection(
        newTitle,
        newDesc,
        startSec,
        endSec,
        secondPrefEnabled,
        Number(tieBreakMode)
      );

      setStatusMsg("Creating election on blockchain...");
      await tx.wait();

      setStatusMsg("Election created successfully!");
      setNewTitle('');
      setNewDesc('');
      await loadElections();
    } catch (err) {
      console.error("Create election failed:", err);
      setErrorMsg(err.reason || err.message || "Failed to create election.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    if (!contract || !selectedElectionId) return;
    try {
      setSubmitting(true);
      setErrorMsg(null);
      setStatusMsg(null);

      const tx = await contract.addCandidate(selectedElectionId, candName, candDesc);
      setStatusMsg("Adding candidate on-chain...");
      await tx.wait();

      setStatusMsg("Candidate added successfully!");
      setCandName('');
      setCandDesc('');
      await loadElections();
    } catch (err) {
      console.error("Add candidate failed:", err);
      setErrorMsg(err.reason || err.message || "Failed to add candidate.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAuthorizeVoter = async (e) => {
    e.preventDefault();
    if (!contract || !selectedElectionId) return;
    try {
      setSubmitting(true);
      setErrorMsg(null);
      setStatusMsg(null);

      const tx = await contract.authorizeVoter(selectedElectionId, voterAddress.trim());
      setStatusMsg("Authorizing voter on-chain...");
      await tx.wait();

      setStatusMsg("Voter authorized successfully!");
      setVoterAddress('');
    } catch (err) {
      console.error("Authorize voter failed:", err);
      setErrorMsg(err.reason || err.message || "Failed to authorize voter.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBatchAuthorize = async (e) => {
    e.preventDefault();
    if (!contract || !selectedElectionId) return;
    try {
      setSubmitting(true);
      setErrorMsg(null);
      setStatusMsg(null);

      const addresses = batchVotersText
        .split('\n')
        .map(a => a.trim())
        .filter(a => a.length > 0);

      if (addresses.length === 0) {
        setErrorMsg("Please enter at least one address.");
        setSubmitting(false);
        return;
      }

      const tx = await contract.authorizeVotersBatch(selectedElectionId, addresses);
      setStatusMsg(`Submitting batch authorization for ${addresses.length} voters...`);
      await tx.wait();

      setStatusMsg("Batch voters authorized successfully!");
      setBatchVotersText('');
    } catch (err) {
      console.error("Batch authorize failed:", err);
      setErrorMsg(err.reason || err.message || "Failed batch authorization.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLifecycleAction = async (actionType) => {
    if (!contract || !selectedElectionId) return;
    try {
      setSubmitting(true);
      setErrorMsg(null);
      setStatusMsg(null);

      let tx;
      if (actionType === 'START') {
        tx = await contract.startElection(selectedElectionId);
      } else if (actionType === 'END') {
        tx = await contract.endElection(selectedElectionId);
      } else if (actionType === 'FINALIZE') {
        tx = await contract.finalizeElection(selectedElectionId);
      }

      setStatusMsg(`Executing ${actionType} action on smart contract...`);
      await tx.wait();

      setStatusMsg(`Election status updated successfully!`);
      await loadElections();
    } catch (err) {
      console.error(`${actionType} action failed:`, err);
      setErrorMsg(err.reason || err.message || `Action ${actionType} failed.`);
    } finally {
      setSubmitting(false);
    }
  };

  // Enforce strict enterprise Admin RBAC access control wall
  if (!authUser || authUser.role !== 'ADMIN') {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-800 shadow-subtle">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-foreground font-display">Access Denied — Admin Authorization Required</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The Organizer Administration Dashboard contains restricted voter identity document verification, Presigned S3 access tools, and smart contract lifecycle controls. You must sign in with an official Administrator account (<code className="font-mono text-primary font-bold">admin@decentravote.lk</code>) to proceed.
        </p>
      </div>
    );
  }

  const selectedElection = elections.find(e => e.id === selectedElectionId);

  return (
    <div className="w-full max-w-[95%] xl:max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground">Organizer Administration</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              RBAC Authorized
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Manage smart contract elections, voter identity verification support, and live election voting analytics.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-1 bg-muted p-1 rounded-xl border border-border text-xs">
          <button
            onClick={() => setActiveTab('ELECTIONS')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg font-semibold transition-all ${
              activeTab === 'ELECTIONS'
                ? 'bg-card text-primary shadow-subtle border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Vote className="w-4 h-4" />
            <span>Contracts & Elections</span>
          </button>

          <button
            onClick={() => setActiveTab('VERIFICATIONS')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg font-semibold transition-all ${
              activeTab === 'VERIFICATIONS'
                ? 'bg-card text-primary shadow-subtle border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>Voter Support & Identity</span>
          </button>

          <button
            onClick={() => setActiveTab('ANALYTICS')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg font-semibold transition-all ${
              activeTab === 'ANALYTICS'
                ? 'bg-card text-primary shadow-subtle border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <span>Analytics & Voting Data</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-emerald-600" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TAB 1: ELECTIONS CONTRACT MANAGEMENT */}
      {activeTab === 'ELECTIONS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Create New Election */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-card p-6 rounded-2xl border border-border shadow-subtle space-y-5">
              <h2 className="text-base font-bold font-display text-foreground flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" />
                Create New Election
              </h2>

              <form onSubmit={handleCreateElection} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-foreground font-semibold mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Student Council Election 2026"
                    className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-foreground font-semibold mb-1">Description</label>
                  <textarea
                    rows="3"
                    required
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Context of election rules..."
                    className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:border-primary resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-foreground font-semibold mb-1">Start Delay (min)</label>
                    <input
                      type="number"
                      min="1"
                      value={startDelayMinutes}
                      onChange={(e) => setStartDelayMinutes(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-foreground font-semibold mb-1">Duration (hours)</label>
                    <input
                      type="number"
                      min="1"
                      value={durationHours}
                      onChange={(e) => setDurationHours(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-foreground font-semibold mb-1">Tie-Break Algorithm</label>
                  <select
                    value={tieBreakMode}
                    onChange={(e) => setTieBreakMode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="0">Second Preference (Preferential)</option>
                    <option value="1">No Tie Break (Report Unresolved)</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="secondPrefCheck"
                    checked={secondPrefEnabled}
                    onChange={(e) => setSecondPrefEnabled(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-0"
                  />
                  <label htmlFor="secondPrefCheck" className="text-foreground font-medium cursor-pointer">
                    Enable 2nd Preference Selection
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Deploy Election Contract</span>}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Manage Selected Election */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card p-6 rounded-2xl border border-border shadow-subtle space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
                <h2 className="text-base font-bold font-display text-foreground">Manage Election</h2>
                
                {elections.length > 0 && (
                  <select
                    value={selectedElectionId || ''}
                    onChange={(e) => setSelectedElectionId(Number(e.target.value))}
                    className="px-3 py-1.5 rounded-xl bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    {elections.map((e) => (
                      <option key={e.id} value={e.id}>
                        Election #{e.id} — {e.title} ({ELECTION_STATUS[e.status]})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedElection ? (
                <div className="space-y-6">
                  
                  {/* Lifecycle Control Bar */}
                  <div className="p-4 rounded-xl bg-muted border border-border space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Current Lifecycle State</span>
                      <span className="font-bold text-primary font-mono">
                        {ELECTION_STATUS[selectedElection.status]}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {selectedElection.status === 0 && (
                        <button
                          onClick={() => handleLifecycleAction('START')}
                          disabled={submitting}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Start Election (Open Voting)</span>
                        </button>
                      )}

                      {selectedElection.status === 1 && (
                        <button
                          onClick={() => handleLifecycleAction('END')}
                          disabled={submitting}
                          className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <Square className="w-3.5 h-3.5" />
                          <span>End Election (Close Voting)</span>
                        </button>
                      )}

                      {selectedElection.status === 2 && (
                        <button
                          onClick={() => handleLifecycleAction('FINALIZE')}
                          disabled={submitting}
                          className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>Finalize Election & Calculate Winner</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Candidate Management */}
                  {selectedElection.status === 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold font-display text-foreground uppercase tracking-wider">Add Candidates</h3>
                      <form onSubmit={handleAddCandidate} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <input
                          type="text"
                          required
                          placeholder="Candidate Name"
                          value={candName}
                          onChange={(e) => setCandName(e.target.value)}
                          className="px-3 py-2 rounded-xl bg-muted border border-border text-foreground focus:outline-none"
                        />
                        <input
                          type="text"
                          required
                          placeholder="Candidate Description"
                          value={candDesc}
                          onChange={(e) => setCandDesc(e.target.value)}
                          className="px-3 py-2 rounded-xl bg-muted border border-border text-foreground focus:outline-none"
                        />
                        <div className="sm:col-span-2">
                          <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold"
                          >
                            + Add Candidate
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Voter Whitelist Authorization */}
                  <div className="space-y-4 pt-4 border-t border-border text-xs">
                    <h3 className="text-xs font-bold font-display text-foreground uppercase tracking-wider">Voter Whitelist Authorization</h3>

                    <form onSubmit={handleAuthorizeVoter} className="space-y-2">
                      <label className="block text-foreground font-semibold">Authorize Single Address</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          placeholder="0x..."
                          value={voterAddress}
                          onChange={(e) => setVoterAddress(e.target.value)}
                          className="flex-grow px-3 py-2 rounded-xl bg-muted border border-border text-foreground font-mono focus:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={submitting}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                        >
                          Authorize
                        </button>
                      </div>
                    </form>

                    <form onSubmit={handleBatchAuthorize} className="space-y-2">
                      <label className="block text-foreground font-semibold">Batch Authorize (One address per line)</label>
                      <textarea
                        rows="3"
                        placeholder="0x123...&#10;0x456..."
                        value={batchVotersText}
                        onChange={(e) => setBatchVotersText(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-foreground font-mono focus:outline-none resize-none"
                      />
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold"
                      >
                        Authorize Batch
                      </button>
                    </form>
                  </div>

                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-8">Select or create an election above.</p>
              )}
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: VOTER SUPPORT & IDENTITY APPROVALS */}
      {activeTab === 'VERIFICATIONS' && (
        <AdminVerificationManager />
      )}

      {/* TAB 3: ELECTION ANALYTICS & VOTING DATA */}
      {activeTab === 'ANALYTICS' && (
        <ElectionAnalyticsManager />
      )}

    </div>
  );
}
