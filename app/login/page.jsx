'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Vote, Lock, Mail, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMsg(null);

      const user = await login(email, password);
      
      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else if (user.verificationStatus === 'APPROVED') {
        router.push('/elections');
      } else {
        router.push('/pending-verification');
      }
    } catch (err) {
      console.error("Login error:", err);
      setErrorMsg(err.message || "Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-card p-8 rounded-2xl border border-border shadow-subtle space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center font-bold mx-auto shadow-sm">
            <Vote className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold font-display text-foreground">Voter Sign In</h1>
          <p className="text-xs text-muted-foreground">Enter your application account credentials</p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-foreground font-semibold mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voter@example.lk"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:border-primary"
              />
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-foreground font-semibold mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:border-primary"
              />
              <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold shadow-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Don't have an account? <Link href="/register" className="text-primary font-bold hover:underline">Register now</Link>
        </p>

      </div>
    </div>
  );
}
