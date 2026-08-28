'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, CheckCircle2, XCircle, Clock, Vote, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function PendingVerificationPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center text-xs text-muted-foreground">
        Loading profile status...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-3 text-xs">
        <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold font-display text-foreground">Sign In Required</h2>
        <p className="text-muted-foreground">Please log into your voter account to view verification status.</p>
        <Link href="/login" className="inline-block px-4 py-2 bg-primary text-white rounded-xl font-semibold">
          Log In
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-2 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h3 className="text-base font-bold font-display">Identity Approved</h3>
            <p className="text-xs">Your Sri Lankan NIC identity documents have been verified by the administrator. You may now connect your wallet to proceed to voting.</p>
          </div>
        );
      case 'REJECTED':
        return (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300">
            <XCircle className="w-8 h-8 text-rose-600 mx-auto" />
            <h3 className="text-base font-bold font-display">Verification Declined</h3>
            <p className="text-xs">Your identity submission was rejected by administrator review. Please update your document uploads or contact support.</p>
          </div>
        );
      default:
        return (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 space-y-2 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300">
            <Clock className="w-8 h-8 text-amber-600 mx-auto animate-pulse" />
            <h3 className="text-base font-bold font-display">Verification Pending Review</h3>
            <p className="text-xs">Your identity registration and Sri Lankan NIC documents have been submitted securely and are currently under administrator review.</p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12 space-y-6">
      
      <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border shadow-subtle space-y-6 text-center">
        <h1 className="text-2xl font-bold font-display text-foreground">Voter Identity Profile</h1>

        {getStatusBadge(user.verificationStatus)}

        {/* User Summary Card */}
        <div className="bg-muted p-4 rounded-xl border border-border text-left text-xs space-y-2">
          <div className="flex justify-between"><span className="text-muted-foreground">Full Name:</span><strong className="text-foreground">{user.fullName}</strong></div>
          <div className="flex justify-between"><span className="text-muted-foreground">NIC Number:</span><strong className="text-foreground font-mono">{user.nicNumber}</strong></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Email:</span><strong className="text-foreground">{user.email}</strong></div>
          <div className="flex justify-between"><span className="text-muted-foreground">District:</span><strong className="text-foreground">{user.district}</strong></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Status:</span><strong className="text-primary font-bold">{user.verificationStatus}</strong></div>
        </div>

        {user.verificationStatus === 'APPROVED' && (
          <Link
            href="/elections"
            className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center space-x-2"
          >
            <span>Proceed to Active Elections</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

    </div>
  );
}
