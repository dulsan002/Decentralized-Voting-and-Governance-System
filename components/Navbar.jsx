'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Vote, 
  ShieldCheck, 
  FileText, 
  Wallet, 
  UserCheck, 
  ChevronDown, 
  Check, 
  LogIn, 
  UserPlus, 
  LogOut, 
  Link2
} from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const pathname = usePathname();
  const { 
    account, 
    connectWallet, 
    isConnecting, 
    isOrganizer 
  } = useWeb3();

  const { user, isAuthenticated, isApproved, logout } = useAuth();

  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Auto-connect linked wallet when user logs in
  useEffect(() => {
    if (isAuthenticated && user?.linkedWalletAddress && !account) {
      connectWallet();
    }
  }, [isAuthenticated, user, account, connectWallet]);

  const navItems = [
    { name: 'Elections', href: '/elections', icon: Vote },
  ];

  if (isAuthenticated) {
    navItems.push({ name: 'Audit Trail', href: '/audit', icon: FileText });
  }

  if (isAuthenticated && user?.role === 'ADMIN') {
    navItems.push({ name: 'Organizer Admin', href: '/admin', icon: ShieldCheck });
  }

  const formatAddress = (addr) => `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;

  const isWalletLinkedToUser = user?.linkedWalletAddress && account && user.linkedWalletAddress.toLowerCase() === account.toLowerCase();

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-subtle">
      <div className="w-full max-w-[95%] xl:max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-2">
          
          {/* Brand Identity */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-bold shadow-sm transition-transform group-hover:scale-105">
              <Vote className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg text-foreground tracking-tight flex items-center gap-1">
                Decentra<span className="text-primary font-extrabold">Vote</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Enterprise Web3 Governance</span>
            </div>
          </Link>

          {/* Main Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 bg-muted/80 p-1 rounded-xl border border-border">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-card text-primary shadow-subtle border border-border font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Action Group */}
          <div className="flex items-center space-x-2.5">
            
            {/* Theme Switcher */}
            <ThemeToggle />

            {/* If Authenticated: User Profile + Wallet Controls */}
            {isAuthenticated ? (
              <>
                {/* Cryptographic Wallet Selector (Only shown to authenticated users) */}
                <div className="relative">
                  {account ? (
                    <button
                      onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
                      className={`flex items-center space-x-2 border px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-subtle ${
                        isWalletLinkedToUser 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300' 
                          : 'bg-card border-border text-foreground hover:bg-muted'
                      }`}
                    >
                      {isWalletLinkedToUser ? (
                        <Link2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      )}
                      <span className="font-mono">{formatAddress(account)}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
                      disabled={isConnecting}
                      className="flex items-center space-x-2 bg-primary hover:bg-primary-hover text-white font-semibold px-3.5 py-1.5 rounded-xl text-xs shadow-sm transition-all disabled:opacity-50"
                    >
                      <Wallet className="w-4 h-4" />
                      <span>{isConnecting ? '...' : 'Connect Wallet'}</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {walletDropdownOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-80 bg-card rounded-2xl border border-border shadow-elevated p-2.5 z-50 space-y-1.5 text-xs"
                      onClick={() => setWalletDropdownOpen(false)}
                    >
                      <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border flex justify-between">
                        <span>Web3 Wallet Connection</span>
                        {account && isWalletLinkedToUser && <span className="text-emerald-600 font-bold">✓ Linked to Account</span>}
                      </div>

                      <button
                        onClick={() => { connectWallet(); setWalletDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-muted flex items-center justify-between transition-colors border border-border/50"
                      >
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                            <Wallet className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-foreground block">MetaMask Wallet</span>
                            <span className="text-[10px] text-muted-foreground">Injected Provider</span>
                          </div>
                        </div>
                        {account && <Check className="w-4 h-4 text-emerald-500" />}
                      </button>
                    </div>
                  )}
                </div>

                {/* User Identity Menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center space-x-2 bg-card hover:bg-muted border border-border px-3 py-1.5 rounded-xl text-xs font-semibold text-foreground transition-all shadow-subtle"
                  >
                    <div className={`w-2 h-2 rounded-full ${isApproved ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <span className="max-w-[120px] truncate font-display">{user.fullName}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>

                  {userDropdownOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-64 bg-card rounded-2xl border border-border shadow-elevated p-2.5 z-50 space-y-2 text-xs"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <div className="px-3 py-2 border-b border-border space-y-1 bg-muted/50 rounded-xl">
                        <p className="font-bold text-foreground truncate">{user.fullName}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                        <div className="pt-1 flex items-center justify-between text-[10px]">
                          <span className="text-muted-foreground">Identity Status:</span>
                          <span className={`px-2 py-0.5 rounded-full font-bold ${
                            isApproved 
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          }`}>
                            {user.verificationStatus}
                          </span>
                        </div>
                      </div>

                        <div className="space-y-0.5">
                        <Link href="/wallet" className="flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-muted font-medium text-foreground transition-colors">
                          <Wallet className="w-4 h-4 text-emerald-500" />
                          <span>My Wallet</span>
                        </Link>

                        <Link href="/pending-verification" className="flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-muted font-medium text-foreground transition-colors">
                          <UserCheck className="w-4 h-4 text-primary" />
                          <span>Identity Verification Profile</span>
                        </Link>

                        {user.role === 'ADMIN' && (
                          <Link href="/admin" className="flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-muted font-medium text-foreground transition-colors">
                            <ShieldCheck className="w-4 h-4 text-amber-500" />
                            <span>Admin Control Center</span>
                          </Link>
                        )}
                      </div>

                      <div className="pt-1 border-t border-border">
                        <button
                          onClick={logout}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-600 dark:hover:bg-rose-950/40 dark:text-rose-400 font-semibold flex items-center space-x-2 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Public / Guest Unauthenticated State: Only Sign In & Register */
              <div className="flex items-center space-x-2 bg-muted/60 p-1 rounded-xl border border-border">
                <Link
                  href="/login"
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    pathname === '/login' ? 'bg-card text-foreground shadow-subtle font-bold' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-primary hover:bg-primary-hover text-white shadow-sm transition-all"
                >
                  Register
                </Link>
              </div>
            )}

          </div>
        </div>
      </div>
    </header>
  );
}
