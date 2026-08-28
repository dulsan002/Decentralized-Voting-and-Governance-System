'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Search, 
  RefreshCw, 
  UserCheck, 
  ShieldCheck, 
  FileText,
  AlertTriangle,
  ExternalLink,
  Unlink,
  HelpCircle,
  MessageSquare
} from 'lucide-react';

export default function AdminVerificationManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [msg, setMsg] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/verifications?status=${filterStatus}&search=${encodeURIComponent(searchTerm)}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Error fetching admin verifications:", err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, searchTerm]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSupportAction = async (userId, actionPayload) => {
    try {
      setSubmitting(true);
      setMsg(null);
      const res = await fetch('/api/admin/verifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...actionPayload,
        }),
      });

      if (res.ok) {
        setMsg("Voter account updated successfully.");
        setSelectedUser(null);
        setRejectionReason('');
        setAdminNotes('');
        await fetchUsers();
      }
    } catch (err) {
      console.error("Support action error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const maskNic = (nic) => {
    if (!nic) return 'N/A';
    if (nic.length < 5) return '*****';
    return `${nic.substring(0, 3)}****${nic.substring(nic.length - 2)}`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">Approved</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300">Rejected</span>;
      case 'PENDING_VERIFICATION':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300">Pending</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border shadow-subtle">
        
        {/* Search */}
        <div className="relative flex-grow max-w-md">
          <input
            type="text"
            placeholder="Search by Voter Name, NIC, Email, or Linked Wallet Address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
          />
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1 bg-muted p-1 rounded-xl border border-border text-xs">
          {['ALL', 'PENDING_VERIFICATION', 'APPROVED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                filterStatus === st
                  ? 'bg-card text-foreground shadow-subtle border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {st === 'PENDING_VERIFICATION' ? 'Pending' : st}
            </button>
          ))}
        </div>

        <button
          onClick={fetchUsers}
          className="p-2.5 rounded-xl bg-card border border-border hover:bg-muted text-foreground transition-colors shadow-subtle"
          title="Refresh table"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {msg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          {msg}
        </div>
      )}

      {/* Voter Table */}
      <div className="bg-card rounded-2xl border border-border shadow-subtle overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground space-y-2">
            <RefreshCw className="w-6 h-6 text-primary animate-spin mx-auto" />
            <p className="text-xs">Loading voter records & verification queue...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground space-y-2">
            <UserCheck className="w-8 h-8 text-muted-foreground/50 mx-auto" />
            <p className="text-xs font-semibold">No voter identity records match your search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted border-b border-border text-muted-foreground font-mono uppercase text-[11px]">
                <tr>
                  <th className="py-3.5 px-5">Voter Name & Email</th>
                  <th className="py-3.5 px-5">Masked NIC</th>
                  <th className="py-3.5 px-5">District</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Unique Linked Wallet</th>
                  <th className="py-3.5 px-5 text-right">Support / Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3.5 px-5 font-semibold">
                      <span className="block text-foreground">{u.fullName}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{u.email}</span>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-muted-foreground">
                      {maskNic(u.nicNumber)}
                    </td>
                    <td className="py-3.5 px-5 font-medium">
                      {u.district || 'N/A'}
                    </td>
                    <td className="py-3.5 px-5">
                      {getStatusBadge(u.verificationStatus)}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-xs">
                      {u.linkedWalletAddress ? (
                        <span className="text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                          {u.linkedWalletAddress.substring(0, 6)}...{u.linkedWalletAddress.substring(u.linkedWalletAddress.length - 4)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic">Unlinked</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="px-3 py-1 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-xs inline-flex items-center gap-1 transition-all shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Manage Voter</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VOTER PROBLEM RESOLUTION & INSPECTION MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-3xl rounded-2xl border border-border shadow-elevated p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-bold font-display text-foreground">Voter Support & Verification Center: {selectedUser.fullName}</h3>
                <p className="text-xs text-muted-foreground">Account ID: <code className="font-mono">{selectedUser.id}</code></p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            {/* Profile Detail Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-muted p-4 rounded-xl border border-border text-xs">
              <div><span className="text-muted-foreground block text-[10px] uppercase font-bold">Full Name</span><strong className="text-foreground">{selectedUser.fullName}</strong></div>
              <div><span className="text-muted-foreground block text-[10px] uppercase font-bold">NIC Number</span><strong className="text-foreground font-mono">{selectedUser.nicNumber}</strong></div>
              <div><span className="text-muted-foreground block text-[10px] uppercase font-bold">Email</span><strong className="text-foreground font-mono">{selectedUser.email}</strong></div>
              <div><span className="text-muted-foreground block text-[10px] uppercase font-bold">District</span><strong className="text-foreground">{selectedUser.district || 'N/A'}</strong></div>
              <div><span className="text-muted-foreground block text-[10px] uppercase font-bold">Verification Status</span>{getStatusBadge(selectedUser.verificationStatus)}</div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Linked Wallet</span>
                {selectedUser.linkedWalletAddress ? (
                  <span className="font-mono text-emerald-600 font-bold">{selectedUser.linkedWalletAddress.substring(0, 6)}...{selectedUser.linkedWalletAddress.substring(selectedUser.linkedWalletAddress.length - 4)}</span>
                ) : (
                  <span className="text-muted-foreground">None</span>
                )}
              </div>
            </div>

            {/* Document Image Previews */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold font-display text-foreground uppercase tracking-wider">NIC Verification Documents</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedUser.documents && selectedUser.documents.length > 0 ? (
                  selectedUser.documents.map((doc) => (
                    <div key={doc.id} className="p-3 rounded-xl bg-muted border border-border space-y-2 text-center">
                      <span className="block font-bold text-foreground text-xs">{doc.docType}</span>
                      <img
                        src={`/api/documents/view?id=${doc.id}`}
                        alt={doc.docType}
                        className="h-36 mx-auto rounded-lg object-cover border border-border shadow-subtle w-full"
                      />
                      <a
                        href={`/api/documents/view?id=${doc.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-semibold"
                      >
                        <span>Inspect Original Document</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground col-span-2 py-3 text-center">No document uploads found for this voter.</p>
                )}
              </div>
            </div>

            {/* VOTER PROBLEM RESOLUTION CONTROLS */}
            <div className="pt-4 border-t border-border space-y-4">
              <h4 className="text-xs font-bold font-display text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-primary" />
                Voter Support & Problem Resolution Actions
              </h4>

              {/* Unlink Wallet Option if lost key */}
              {selectedUser.linkedWalletAddress && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
                  <div>
                    <span className="font-bold block">Reset Lost or Stolen Wallet Link</span>
                    <span className="text-[11px] text-muted-foreground">Allows voter to sign & bind a new wallet address if key was compromised.</span>
                  </div>
                  <button
                    onClick={() => handleSupportAction(selectedUser.id, { unlinkWallet: true })}
                    disabled={submitting}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold flex items-center gap-1"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                    <span>Unlink Wallet</span>
                  </button>
                </div>
              )}

              {/* Rejection / Approval Controls */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-foreground">Admin Support & Resolution Notes</label>
                <textarea
                  rows="2"
                  placeholder="Record administrative support details, re-verification reasons..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-xs text-foreground focus:outline-none resize-none"
                />

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-foreground">Rejection Reason (If declining verification)</label>
                  <input
                    type="text"
                    placeholder="e.g. NIC image blurry, name mismatch..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-xs text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  onClick={() => handleSupportAction(selectedUser.id, { status: 'REJECTED', rejectionReason, adminNotes })}
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Verification</span>
                </button>

                <button
                  onClick={() => handleSupportAction(selectedUser.id, { status: 'APPROVED', adminNotes })}
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve Voter Identity</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
