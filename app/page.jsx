'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Vote, 
  ShieldCheck, 
  Lock, 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  Scale, 
  UserCheck, 
  Building2,
  ChevronRight,
  Cpu,
  Globe2,
  Activity,
  KeyRound,
  Database,
  Layers,
  Zap,
  Sparkles
} from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { contract } = useWeb3();
  const { isAuthenticated, user } = useAuth();
  
  const [stats, setStats] = useState({
    electionCount: 3,
    totalVotes: 142,
    verifiedVoters: 105,
    privacyScore: '100%'
  });

  useEffect(() => {
    async function loadStats() {
      if (contract) {
        try {
          const count = await contract.getElectionCount();
          setStats(prev => ({ ...prev, electionCount: Number(count) }));
        } catch (e) {
          // Fallback stats for display
        }
      }
    }
    loadStats();
  }, [contract]);

  return (
    <div className="w-full space-y-20 pb-20">
      
      {/* HERO SECTION — 100% Full Width Premium Enterprise Banner */}
      <section className="relative w-full overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background pt-12 pb-20 border-b border-border/60">
        
        {/* Subtle Background Glows & Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:36px_36px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-tr from-primary/20 via-blue-500/10 to-indigo-500/0 blur-[120px] rounded-full pointer-events-none" />

        <div className="w-full max-w-[96%] xl:max-w-[90%] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
          
          {/* Top Pill */}
          <div className="flex justify-center">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-card/80 border border-primary/20 text-primary shadow-subtle backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span>Next-Generation Institutional Web3 Governance</span>
            </div>
          </div>

          {/* Core Headline */}
          <div className="text-center space-y-6 max-w-5xl mx-auto">
            <h1 className="text-5xl sm:text-7xl xl:text-8xl font-black font-display text-foreground tracking-tight leading-[1.05]">
              Verifiable Blockchain Voting & <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-600 to-indigo-600">Off-Chain Identity</span>
            </h1>
            <p className="text-lg sm:text-2xl text-muted-foreground font-normal leading-relaxed max-w-3xl mx-auto">
              DecentraVote bridges enterprise Sri Lankan NIC identity verification with immutable Ethereum smart contract ballot execution, preferential tallying, and deterministic tie resolution.
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {isAuthenticated ? (
              <Link
                href="/elections"
                className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-primary hover:bg-primary-hover text-white font-bold text-base shadow-elevated transition-all flex items-center justify-center space-x-3 group"
              >
                <Vote className="w-5 h-5" />
                <span>Cast Ballot in Active Elections</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-primary hover:bg-primary-hover text-white font-bold text-base shadow-elevated transition-all flex items-center justify-center space-x-3 group"
                >
                  <span>Start Voter Registration</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/login"
                  className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-card border border-border hover:bg-muted text-foreground font-bold text-base shadow-subtle transition-all flex items-center justify-center space-x-2"
                >
                  <KeyRound className="w-5 h-5 text-primary" />
                  <span>Voter Sign In</span>
                </Link>
              </>
            )}

            <Link
              href="/elections"
              className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-card/60 backdrop-blur-sm border border-border hover:bg-muted text-foreground font-bold text-base transition-all flex items-center justify-center space-x-2"
            >
              <Globe2 className="w-5 h-5 text-muted-foreground" />
              <span>Public Election Audit</span>
            </Link>
          </div>

          {/* LIVE METRICS DASHBOARD BANNER */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-10 border-t border-border/60 w-full text-center">
            
            <div className="bg-card/80 backdrop-blur-md p-6 rounded-2xl border border-border shadow-subtle space-y-1">
              <span className="text-muted-foreground text-xs uppercase font-bold tracking-wider block">Smart Contract Target</span>
              <span className="font-bold text-foreground font-mono text-xl sm:text-2xl">Solidity ^0.8.19</span>
            </div>

            <div className="bg-card/80 backdrop-blur-md p-6 rounded-2xl border border-border shadow-subtle space-y-1">
              <span className="text-muted-foreground text-xs uppercase font-bold tracking-wider block">Preferential Voting</span>
              <span className="font-bold text-primary font-display text-xl sm:text-2xl">1st & 2nd Choice</span>
            </div>

            <div className="bg-card/80 backdrop-blur-md p-6 rounded-2xl border border-border shadow-subtle space-y-1">
              <span className="text-muted-foreground text-xs uppercase font-bold tracking-wider block">Off-Chain PII Protection</span>
              <span className="font-bold text-emerald-600 font-mono text-xl sm:text-2xl">100% Isolated</span>
            </div>

            <div className="bg-card/80 backdrop-blur-md p-6 rounded-2xl border border-border shadow-subtle space-y-1">
              <span className="text-muted-foreground text-xs uppercase font-bold tracking-wider block">Access Control Engine</span>
              <span className="font-bold text-foreground font-mono text-xl sm:text-2xl">OpenZeppelin RBAC</span>
            </div>

          </div>

        </div>
      </section>

      {/* THREE-TIER ARCHITECTURE GRID — 100% Wide Container */}
      <section className="w-full max-w-[96%] xl:max-w-[90%] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-bold font-display text-foreground">Enterprise Dual-Layer Security</h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Strict separation between off-chain citizen identity records and on-chain governance logic.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1 */}
          <div className="bg-card p-8 sm:p-10 rounded-3xl border border-border shadow-subtle hover:border-primary/50 transition-all hover:-translate-y-1 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-primary flex items-center justify-center font-bold">
                <UserCheck className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold font-display text-foreground">1. Off-Chain NIC Identity</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Multi-step registration workflow verifying Sri Lankan NIC documents and contact details off-chain. Passwords hashed using PBKDF2 sha512.
              </p>
            </div>
            <div className="pt-4 border-t border-border/60">
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                ✓ Zero PII Stored On-Chain
              </span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-card p-8 sm:p-10 rounded-3xl border border-border shadow-subtle hover:border-primary/50 transition-all hover:-translate-y-1 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                <KeyRound className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold font-display text-foreground">2. Cryptographic Wallet Bridge</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                EIP-191 message signature challenge binds approved citizen accounts 1-to-1 with unique Ethereum wallets, preventing Sybil attacks.
              </p>
            </div>
            <div className="pt-4 border-t border-border/60">
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-800">
                ✓ 1 Citizen = 1 Wallet = 1 Vote
              </span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-card p-8 sm:p-10 rounded-3xl border border-border shadow-subtle hover:border-primary/50 transition-all hover:-translate-y-1 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold font-display text-foreground">3. Private S3 Document Storage</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Identity NIC files reside in strictly private S3 bucket storage. Administrative review is gated by short-lived 15-minute presigned URLs.
              </p>
            </div>
            <div className="pt-4 border-t border-border/60">
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                ✓ Short-Lived Signed Access
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* SYSTEM WORKFLOW INTERACTIVE TEASER */}
      <section className="w-full max-w-[96%] xl:max-w-[90%] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-card p-10 sm:p-16 rounded-3xl border border-border shadow-elevated space-y-10">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-border">
            <div>
              <h3 className="text-2xl sm:text-4xl font-bold font-display text-foreground">6-Stage Voter Eligibility Gateway</h3>
              <p className="text-sm text-muted-foreground">Every ballot submission enforces 6 automated security gates before enabling smart contract execution.</p>
            </div>

            <Link
              href="/elections"
              className="px-6 py-3 rounded-2xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-sm transition-all flex items-center space-x-2 self-start"
            >
              <span>Explore Active Elections</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* 6 Steps Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm">
            
            <div className="p-5 rounded-2xl bg-muted/60 border border-border/80 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-xs">1</div>
              <h4 className="font-bold text-foreground">Authenticated Account</h4>
              <p className="text-xs text-muted-foreground">Voter maintains an active application session.</p>
            </div>

            <div className="p-5 rounded-2xl bg-muted/60 border border-border/80 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-xs">2</div>
              <h4 className="font-bold text-foreground">Identity Approved</h4>
              <p className="text-xs text-muted-foreground">Admin verified NIC identity documents.</p>
            </div>

            <div className="p-5 rounded-2xl bg-muted/60 border border-border/80 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-xs">3</div>
              <h4 className="font-bold text-foreground">Wallet Connected</h4>
              <p className="text-xs text-muted-foreground">MetaMask or Web3 wallet active in browser.</p>
            </div>

            <div className="p-5 rounded-2xl bg-muted/60 border border-border/80 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-xs">4</div>
              <h4 className="font-bold text-foreground">Cryptographic Link</h4>
              <p className="text-xs text-muted-foreground">Nonce challenge signed by wallet private key.</p>
            </div>

            <div className="p-5 rounded-2xl bg-muted/60 border border-border/80 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-xs">5</div>
              <h4 className="font-bold text-foreground">On-Chain Whitelisted</h4>
              <p className="text-xs text-muted-foreground">Address recorded in contract mapping.</p>
            </div>

            <div className="p-5 rounded-2xl bg-muted/60 border border-border/80 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-xs">6</div>
              <h4 className="font-bold text-foreground">Election Active</h4>
              <p className="text-xs text-muted-foreground">Election status open prior to deadline.</p>
            </div>

          </div>

        </div>
      </section>

    </div>
  );
}
