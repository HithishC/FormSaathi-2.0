'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import {
  ShieldCheck,
  Lock,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  History,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Shield,
  FileText,
} from 'lucide-react';

export default function PrivacyPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [consents, setConsents] = useState<any[]>([]);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [aiLogs, setAiLogs] = useState<any[]>([]);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadPrivacyData = async () => {
    try {
      setLoading(true);
      const [consentsRes, auditRes, aiLogsRes] = await Promise.all([
        api.privacy.getConsents().catch(() => ({ consents: [] })),
        api.privacy.getAuditLog().catch(() => []),
        api.privacy.getAiProcessingLog().catch(() => []),
      ]);
      setConsents(consentsRes?.consents || []);
      setAuditEvents(auditRes || []);
      setAiLogs(aiLogsRes || []);
    } catch (err) {
      console.error('Failed to load privacy data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrivacyData();
  }, []);

  const handleToggleConsent = async (type: string, currentVal: boolean) => {
    setToggling(type);
    setFeedback(null);
    try {
      await api.privacy.updateConsent({
        consent_type: type,
        is_granted: !currentVal,
        details: `Citizen updated consent setting for ${type}.`,
      });
      setFeedback(`Consent for ${type.replace('_', ' ')} updated successfully.`);
      await loadPrivacyData();
    } catch (err: any) {
      alert(err?.message || 'Failed to update consent');
    } finally {
      setToggling(null);
    }
  };

  const handleDeleteAllData = async () => {
    if (!currentPassword) {
      alert('Enter your current password to confirm account deletion.');
      return;
    }

    const confirmed = confirm(
      'PERMANENT ACCOUNT DELETION: This will permanently delete your login account, profile, uploaded certificates, applications, DigiLocker connection, consent records, notifications and AI processing logs. Necessary security audit events will be retained in anonymized form. You will no longer be able to log in. This action cannot be undone. Do you wish to continue?'
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await api.privacy.deleteData(currentPassword);
      setCurrentPassword('');
      alert(res.message);
      logout();
      router.push('/');
    } catch (err: any) {
      alert(err?.message || 'Deletion failed');
      setDeleting(false);
    }
  };

  const CONSENT_DESCRIPTIONS: Record<string, string> = {
    DATA_PROCESSING: 'Permission to evaluate statutory eligibility criteria against Karnataka Government guidelines.',
    AI_ANALYSIS: 'Authorization to invoke Sarvam AI for multilingual translation and document intelligence using minimized payloads.',
    DIGILOCKER_ACCESS: 'Temporary authorization to retrieve verified digital certificates via DigiLocker Sandbox gateway.',
    DOCUMENT_STORAGE: 'Encryption and storage of scanned certificates inside your encrypted document vault.',
    NOTIFICATION: 'Receiving lifecycle progression alerts regarding SSP attestation and DBT milestones.',
  };

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader
        title="Privacy Shield & Consent Center"
        subtitle="Privacy controls, consent records, and data minimization information."
        onMenuClick={() => {}}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1">
        {/* Security Architecture Snapshot */}
        <div className="bg-[#134E4A] rounded-3xl p-6 sm:p-10 text-white shadow-md space-y-4">
          <div className="flex items-center space-x-2.5 text-emerald-300">
            <Lock className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Privacy by Design & Cryptographic Architecture
            </span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            You Own Your Data. We Only Process What Is Strictly Necessary.
          </h2>
          <p className="text-xs text-teal-100/90 leading-relaxed max-w-2xl">
            Under India&apos;s Digital Personal Data Protection (DPDP) Act, the law establishes rights and obligations for personal data processing. All uploaded documents are encrypted with the configured Fernet encryption key at rest, Aadhaar numbers are never persisted in plaintext, and external AI services receive only pre-sanitized, minimized attributes.
          </p>
        </div>

        {feedback && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{feedback}</span>
          </div>
        )}

        {/* 1. CONSENT MANAGEMENT SWITCHES */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">Granular Consent Preferences</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Revoke or grant individual processing scopes at any time. Revocation takes effect immediately.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {consents.map((c) => {
              const isChecked = Boolean(c.is_granted);
              const isBusy = toggling === c.consent_type;

              return (
                <div
                  key={c.id || c.consent_type}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <span className="text-sm font-bold text-slate-900 block">
                      {c.consent_type.replace('_', ' ')}
                    </span>
                    <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                      {CONSENT_DESCRIPTIONS[c.consent_type] || c.details || 'Scope consent permission.'}
                    </p>
                    {c.granted_at && isChecked && (
                      <span className="text-[10px] text-emerald-600 font-mono block">
                        Granted on: {new Date(c.granted_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleToggleConsent(c.consent_type, isChecked)}
                    disabled={isBusy}
                    className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      isChecked
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{isBusy ? 'Updating...' : isChecked ? 'Consent Active' : 'Revoked'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. SARVAM AI PROCESSING AUDIT LOG */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-4">
            <Sparkles className="w-4 h-4 text-[#059669]" />
            <h3 className="text-base font-bold text-slate-900">
              Sarvam AI Transparency & Redaction Log ({aiLogs.length})
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Every external AI operation is recorded. Notice that raw Aadhaar, phone numbers, and full names are sanitized before submission.
          </p>

          {aiLogs.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No AI operations logged yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase tracking-wider font-semibold">
                    <th className="py-2.5">Timestamp</th>
                    <th className="py-2.5">Service</th>
                    <th className="py-2.5">Operation</th>
                    <th className="py-2.5">Redacted Fields</th>
                    <th className="py-2.5">Processing Time</th>
                    <th className="py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {aiLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="py-2 text-slate-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </td>
                      <td className="py-2 font-bold text-slate-800">{log.service_name}</td>
                      <td className="py-2 text-slate-600">{log.operation}</td>
                      <td className="py-2 text-emerald-700">
                        {(log.pii_fields_redacted || []).join(', ') || 'None'}
                      </td>
                      <td className="py-2 text-slate-500">{log.processing_time_ms}ms</td>
                      <td className="py-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                          SUCCESS
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 3. IMMUTABLE SYSTEM AUDIT TRAIL */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-4">
            <History className="w-4 h-4 text-[#0F766E]" />
            <h3 className="text-base font-bold text-slate-900">
              Personal Security Audit Trail ({auditEvents.length})
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Immutable log of document uploads, consent changes, and session authentications.
          </p>

          {auditEvents.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No security events recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase tracking-wider font-semibold">
                    <th className="py-2.5">Date & Time</th>
                    <th className="py-2.5">Action Event</th>
                    <th className="py-2.5">Resource</th>
                    <th className="py-2.5">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {auditEvents.slice(0, 10).map((ev) => (
                    <tr key={ev.id}>
                      <td className="py-2 text-slate-500 whitespace-nowrap">
                        {new Date(ev.created_at).toLocaleString()}
                      </td>
                      <td className="py-2 font-bold text-slate-800">{ev.action}</td>
                      <td className="py-2 text-slate-600">{ev.resource_type || 'N/A'}</td>
                      <td className="py-2 text-slate-400">{ev.ip_address || '127.0.0.1'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 4. RIGHT TO BE FORGOTTEN DATA ERASURE */}
        <div className="bg-rose-50/70 rounded-3xl p-6 sm:p-8 border border-rose-200 text-rose-950 space-y-4">
          <div className="flex items-center space-x-2 text-rose-700">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-base font-bold">DPDP Right to be Forgotten (Data Erasure)</h3>
          </div>
          <p className="text-xs leading-relaxed text-rose-900 max-w-2xl">
            Permanently delete your login account and associated personal data, including encrypted certificates, applications, profile details, DigiLocker connection and AI processing logs. Necessary security audit events are retained in anonymized form. You will not be able to sign in again after deletion.
          </p>
          <label
            htmlFor="delete-account-password"
            className="block text-xs font-semibold text-rose-950 mb-2"
          >
            Enter your current password to confirm
          </label>
          <input
            id="delete-account-password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            placeholder="Current account password"
            disabled={deleting}
            className="block w-full max-w-sm mb-4 px-3 py-2 rounded-lg border border-rose-300 bg-white text-sm text-gray-900"
          />
          <button
            onClick={handleDeleteAllData}
            disabled={deleting}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors text-xs disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{deleting ? 'Executing Erasure...' : 'Permanently Delete My Account'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
