'use client';
import React, { useState } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Wallet, Link2, Unlink, AlertTriangle, CheckCircle2, Loader2, ExternalLink } from 'lucide-react';
import { ethers } from 'ethers';

export default function MyWalletPage() {
  const { user, isApproved, refreshUser } = useAuth();
  const { account, connectWallet, signer, provider, isConnecting } = useWeb3();
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const isWalletLinked = !!user?.linkedWalletAddress;
  const isCorrectWalletConnected = account && user?.linkedWalletAddress && account.toLowerCase() === user.linkedWalletAddress.toLowerCase();

  const handleLinkWallet = async () => {
    if (!account || !signer) {
      setError("Please connect your MetaMask wallet first.");
      return;
    }
    
    setIsLinking(true);
    setError(null);
    setSuccess(null);
    
    try {
      // 1. Get challenge nonce
      const res = await fetch('/api/wallet/link');
      if (!res.ok) throw new Error("Failed to fetch wallet challenge");
      const { message, nonce } = await res.json();

      // 2. Cryptographically sign the challenge
      const signature = await signer.signMessage(message);

      // 3. Verify signature and link
      const linkRes = await fetch('/api/wallet/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: account, signature, nonce })
      });

      const data = await linkRes.json();
      if (!linkRes.ok) throw new Error(data.error || "Failed to link wallet");

      setSuccess("Wallet ownership verified and linked successfully!");
      await refreshUser();
    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred during wallet verification.");
    } finally {
      setIsLinking(false);
    }
  };

  const handleDisconnect = () => {
    // Note: True disconnection from MetaMask requires the user to do it in the extension.
    // This just clears the local session state (handled dynamically by Web3Context reloading or user action).
    alert("To fully disconnect, please open the MetaMask extension and click 'Disconnect' for this site. Your verified association remains saved.");
  };

  if (!user) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <Wallet className="w-8 h-8 text-primary" />
            My Wallet
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your cryptographic blockchain identity and verify ownership to participate in elections.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-3 text-rose-700">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-3 text-emerald-700">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{success}</p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          
          {/* Identity Status Card */}
          <div className="p-6 bg-card border border-border rounded-2xl shadow-subtle flex flex-col">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Application Identity
            </h3>
            <div className="space-y-4 flex-1">
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">User</p>
                <p className="font-medium text-foreground">{user.fullName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Verification Status</p>
                <div className="mt-1">
                  {isApproved ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      APPROVED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      PENDING ADMIN REVIEW
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Wallet Status Card */}
          <div className="p-6 bg-card border border-border rounded-2xl shadow-subtle flex flex-col">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Link2 className="w-5 h-5 text-emerald-500" />
              Blockchain Identity
            </h3>
            
            <div className="space-y-4 flex-1">
              {isWalletLinked ? (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Registered Wallet</p>
                    <p className="font-mono text-sm font-medium text-foreground break-all mt-1 bg-muted p-2 rounded-lg border border-border">
                      {user.linkedWalletAddress}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Connection Status</p>
                    <p className={`text-sm font-bold mt-1 ${isCorrectWalletConnected ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {isCorrectWalletConnected ? '✓ Connected & Verified' : '⚠ Wallet Mismatch / Not Connected'}
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                  <Unlink className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground font-medium">No wallet registered.</p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-border">
              {!isWalletLinked ? (
                isApproved ? (
                  account ? (
                    <button
                      onClick={handleLinkWallet}
                      disabled={isLinking}
                      className="w-full flex items-center justify-center space-x-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl font-bold transition-all disabled:opacity-50"
                    >
                      {isLinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                      <span>Verify & Link Wallet</span>
                    </button>
                  ) : (
                    <button
                      onClick={connectWallet}
                      className="w-full flex items-center justify-center space-x-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl font-bold transition-all"
                    >
                      <Wallet className="w-4 h-4" />
                      <span>Connect Wallet to Link</span>
                    </button>
                  )
                ) : (
                  <p className="text-xs text-center text-amber-600 font-semibold bg-amber-50 p-2 rounded-lg border border-amber-200">
                    Identity must be approved by an Admin before linking a wallet.
                  </p>
                )
              ) : (
                <button
                  onClick={handleDisconnect}
                  className="w-full flex items-center justify-center space-x-2 bg-muted hover:bg-rose-50 hover:text-rose-600 text-foreground px-4 py-2 rounded-xl font-bold transition-all border border-border"
                >
                  <Unlink className="w-4 h-4" />
                  <span>Disconnect Session</span>
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Informational Panel */}
        <div className="p-6 bg-muted/50 border border-border rounded-2xl">
          <h4 className="font-bold text-foreground mb-2 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            Security & Ownership
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            DecentraVote enforces a strict <strong>One Voter ↔ One Wallet</strong> policy. 
            We never store your private keys or seed phrases. Your wallet signature is only used to prove mathematical ownership of the public address during registration. 
            Once linked, only this specific wallet address will be eligible to cast a ballot on the smart contract.
          </p>
        </div>

      </div>
    </div>
  );
}
