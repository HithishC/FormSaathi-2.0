'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Shield, ArrowRight, Lock, Mail, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#FFFBEB] px-4 py-12">
      {/* Brand Header */}
      <Link href="/" className="flex items-center space-x-3 mb-8 group">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0F766E] to-[#047857] flex items-center justify-center text-white shadow-md shadow-[#0F766E]/20 group-hover:scale-105 transition-transform">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <span className="text-2xl font-bold tracking-tight text-[#0F766E]">
            Form<span className="text-[#059669]">Saathi</span>
          </span>
          <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-[#0F766E]/10 text-[#0F766E]">
            2.0
          </span>
        </div>
      </Link>

      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 shadow-xl p-8 sm:p-10">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Citizen Sign In</h2>
          <p className="text-xs text-slate-500 mt-1">
            Access your scholarship intelligence dashboard, DigiLocker vault, and application tracking.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:border-transparent"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:border-transparent"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 inline-flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-semibold bg-[#0F766E] text-white hover:bg-[#115E59] shadow-md shadow-[#0F766E]/20 transition-all disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to FormSaathi'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-200/80 text-center text-xs text-slate-600">
          <span>New to FormSaathi? </span>
          <Link href="/register" className="font-semibold text-[#0F766E] hover:underline">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}
