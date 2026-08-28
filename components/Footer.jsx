'use client';

import React from 'react';
import Link from 'next/link';
import { Vote, ShieldCheck, FileText, ExternalLink, Lock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-card border-t border-border mt-20 py-12">
      <div className="w-full max-w-[96%] xl:max-w-[90%] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-border">
          
          {/* Brand */}
          <div className="space-y-2 max-w-md">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-bold">
                <Vote className="w-4 h-4" />
              </div>
              <span className="font-display font-bold text-lg text-foreground tracking-tight">
                Decentra<span className="text-primary font-extrabold">Vote</span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Enterprise Web3 Blockchain Governance & Sri Lankan Identity Verification System. Built for high-security academic evaluation and institutional ballot auditability.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center gap-6 text-xs font-semibold text-muted-foreground">
            <Link href="/elections" className="hover:text-primary transition-colors">
              Active Elections
            </Link>
            <Link href="/audit" className="hover:text-primary transition-colors">
              On-Chain Audit Trail
            </Link>
            <Link href="/register" className="hover:text-primary transition-colors">
              Voter Registration
            </Link>
            <Link href="/admin" className="hover:text-primary transition-colors">
              Organizer Admin
            </Link>
          </div>

          {/* Security Badge */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-muted border border-border text-xs text-muted-foreground font-mono">
            <Lock className="w-3.5 h-3.5 text-emerald-500" />
            <span>Solidity ^0.8.19 • OpenZeppelin RBAC</span>
          </div>

        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-3">
          <p>© 2026 DecentraVote Governance System. All rights reserved.</p>
          <p className="font-mono text-[11px]">Academic Evaluation • DAS5003 Task 3.1(b)</p>
        </div>

      </div>
    </footer>
  );
}
