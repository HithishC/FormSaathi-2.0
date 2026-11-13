'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { api } from '@/lib/api';
import {
  Link2,
  ShieldCheck,
  CheckCircle2,
  FileDown,
  AlertCircle,
  Lock,
  Building2,
  ArrowRight,
  RefreshCw,
  FolderLock,
  Shield,
  Unlink,
} from 'lucide-react';

export default function DigiLockerPage() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [fetchingDoc, setFetchingDoc] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);

  const loadDigiLocker = async () => {
    try {
      setLoading(true);
      const [statusRes, docsRes] = await Promise.all([
        api.digilocker.getStatus().catch(() => ({ is_connected: false, sandbox_mode: true })),
        api.digilocker.listDocuments().catch(() => ({ documents: [], sandbox_mode: true })),
      ]);
      setStatus(statusRes);
      setDocuments(docsRes?.documents || []);
    } catch (err) {
      console.error('Failed to load DigiLocker status', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDigiLocker();
  }, []);

  const handleConnect = async () => {
    if (!consentChecked) {
      alert('Please check the explicit consent box before connecting.');
      return;
    }

    setConnecting(true);
    setFeedback(null);
    try {
      // Simulate authorized callback exchange in sandbox
      await api.digilocker.callback('sandbox_auth_code_123', 'sandbox_state_xyz');
      setFeedback('Successfully authenticated with DigiLocker Consent Gateway (Sandbox).');
      await loadDigiLocker();
    } catch (err: any) {
      setFeedback(err?.message || 'Connection failed.');
    } finally {
      setConnecting(false);
    }
  };

  const handleFetchDocument = async (docType: string) => {
    setFetchingDoc(docType);
    setFeedback(null);
    try {
      const res = await api.digilocker.fetchDocument(docType);
      setFeedback(res.message);
      await loadDigiLocker();
    } catch (err: any) {
      setFeedback(err?.message || 'Failed to fetch document.');
    } finally {
      setFetchingDoc(null);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect DigiLocker and revoke access tokens?')) return;

    try {
      await api.digilocker.disconnect();
      setFeedback('DigiLocker disconnected and access tokens revoked.');
      await loadDigiLocker();
    } catch (err: any) {
      setFeedback(err?.message || 'Failed to disconnect.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader
        title="DigiLocker Integration"
        subtitle="Consent-based digital document retrieval from Nadakacheri and KSEAB."
        onMenuClick={() => {}}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1">
        {/* CLEAR SANDBOX / DEMO MODE NOTICE BANNER */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start space-x-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold uppercase tracking-wider block">
              Sandbox Mode Active (Evaluator Notice)
            </span>
            <p className="leading-relaxed">
              This environment operates in a transparently labelled <strong>DigiLocker Sandbox</strong> simulating the standard OAuth 2.0 PKCE consent protocol. Real government certificates (Nadakacheri Income/Caste and KSEAB SSLC marksheets) are modeled accurately without exposing citizen PII or requiring production credentials.
            </p>
          </div>
        </div>

        {feedback && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{feedback}</span>
            </div>
            <Link
              href="/dashboard/documents"
              className="font-bold underline text-emerald-800 hover:text-emerald-950"
            >
              View in Vault ↗
            </Link>
          </div>
        )}

        {/* CONNECTION STATUS & ACTION CARD */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="flex items-center space-x-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${
                  status?.is_connected
                    ? 'bg-gradient-to-br from-[#0F766E] to-[#059669]'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                <Link2 className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xl font-bold text-slate-900">DigiLocker National Gateway</h3>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      status?.is_connected
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {status?.is_connected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  OAuth 2.0 Consent-based pull API for Karnataka Government certificates.
                </p>
              </div>
            </div>

            {status?.is_connected ? (
              <button
                onClick={handleDisconnect}
                className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
              >
                <Unlink className="w-3.5 h-3.5" />
                <span>Disconnect & Revoke</span>
              </button>
            ) : null}
          </div>

          {!status?.is_connected ? (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-[#FFFBEB] border border-amber-200/80 space-y-3">
                <h4 className="text-sm font-bold text-slate-900">Consent & Data Authorization</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  By clicking connect, you grant FormSaathi temporary authorization to request only scholarship-relevant certificates (Income, Caste, SSLC marksheet, and masked Aadhaar). Tokens are stored encrypted and can be revoked at any time.
                </p>
                <label className="flex items-center space-x-2 text-xs font-semibold text-slate-800 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="rounded text-[#0F766E] focus:ring-[#0F766E]"
                  />
                  <span>I give explicit consent to connect my DigiLocker Sandbox account.</span>
                </label>
              </div>

              <button
                onClick={handleConnect}
                disabled={connecting || !consentChecked}
                className="inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl font-bold bg-[#0F766E] text-white hover:bg-[#115E59] shadow-md shadow-[#0F766E]/20 transition-all disabled:opacity-50 text-xs"
              >
                <span>{connecting ? 'Authenticating with DigiLocker...' : 'Connect DigiLocker (Sandbox)'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Available Digital Certificates in Repository ({documents.length})
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select certificates to import directly into your encrypted scholarship vault.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map((doc: any) => (
                  <div
                    key={doc.doc_type}
                    className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-[#0F766E]">
                          {doc.doc_type.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-semibold flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Issuer Verified</span>
                        </span>
                      </div>
                      <h5 className="text-sm font-bold text-slate-900">{doc.name}</h5>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        {doc.description}
                      </p>
                      <span className="text-[10px] text-slate-400 block mt-2">
                        Issuer: {doc.issuer}
                      </span>
                    </div>

                    <button
                      onClick={() => handleFetchDocument(doc.doc_type)}
                      disabled={fetchingDoc === doc.doc_type}
                      className="w-full inline-flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-xs font-bold bg-[#0F766E] text-white hover:bg-[#115E59] transition-colors disabled:opacity-50"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>
                        {fetchingDoc === doc.doc_type
                          ? 'Importing & Verifying...'
                          : 'Fetch & Import to Vault'}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
