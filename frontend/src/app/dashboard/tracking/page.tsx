'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { api } from '@/lib/api';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Landmark,
  FileCheck2,
  ArrowRight,
  ShieldAlert,
  Send,
  Plus,
} from 'lucide-react';

const ALL_STAGES = [
  { key: 'ELIGIBILITY_CHECKED', title: '1. Eligibility Checked', desc: 'Criteria verified against official guidelines.' },
  { key: 'DOCUMENTS_PREPARED', title: '2. Documents Prepared', desc: 'Mandatory certificates uploaded & verified in vault.' },
  { key: 'SUBMITTED', title: '3. Application Submitted', desc: 'Locked on official State Scholarship Portal (SSP).' },
  { key: 'INITIAL_VERIFICATION', title: '4. Initial Verification', desc: 'College e-Attestation Officer verified original certificates.' },
  { key: 'DEPARTMENT_REVIEW', title: '5. Department Review', desc: 'Social Welfare Department reviewing application.' },
  { key: 'INFO_REQUESTED', title: '6. Clarification Requested', desc: 'Officer requested additional information or re-upload.' },
  { key: 'APPROVED', title: '7. Sanction Approved', desc: 'Application cleared by sanctioning authority.' },
  { key: 'BENEFIT_SANCTIONED', title: '8. Benefit Sanctioned', desc: 'Financial grant sanctioned by Government.' },
  { key: 'PAYMENT_INITIATED', title: '9. Payment Initiated', desc: 'DBT instruction transmitted to PFMS/Treasury.' },
  { key: 'BENEFIT_DISBURSED', title: '10. Benefit Disbursed', desc: 'Funds credited to Aadhaar-linked bank account.' },
];

export default function TrackingPage() {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [timeline, setTimeline] = useState<any>(null);

  // Status advance form
  const [nextStatus, setNextStatus] = useState('DOCUMENTS_PREPARED');
  const [statusNotes, setStatusNotes] = useState('');
  const [advancing, setAdvancing] = useState(false);

  // Official ref form
  const [officialRef, setOfficialRef] = useState('');
  const [updatingRef, setUpdatingRef] = useState(false);

  const loadApps = async () => {
    try {
      setLoading(true);
      const res = await api.applications.list();
      const list = res.applications || [];
      setApplications(list);
      if (list.length > 0) {
        const targetId = selectedAppId || list[0].id;
        setSelectedAppId(targetId);
        loadTimeline(targetId);
      }
    } catch (err) {
      console.error('Failed to load applications', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTimeline = async (appId: string) => {
    try {
      const res = await api.applications.getTimeline(appId);
      setTimeline(res);
      const current = applications.find((a) => a.id === appId);
      if (current?.official_reference_number) {
        setOfficialRef(current.official_reference_number);
      }
    } catch (err) {
      console.error('Failed to load timeline', err);
    }
  };

  useEffect(() => {
    loadApps();
  }, []);

  const handleSelectApp = (id: string) => {
    setSelectedAppId(id);
    loadTimeline(id);
  };

  const handleAdvanceStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId) return;

    setAdvancing(true);
    try {
      await api.applications.updateStatus(selectedAppId, {
        status: nextStatus,
        source: 'USER_REPORTED',
        notes: statusNotes || `Assisted status milestone advanced to ${nextStatus}`,
      });
      setStatusNotes('');
      await loadApps();
    } catch (err: any) {
      alert(err?.message || 'Failed to update status');
    } finally {
      setAdvancing(false);
    }
  };

  const handleUpdateOfficialRef = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId || !officialRef) return;

    setUpdatingRef(true);
    try {
      await api.applications.addOfficialRef(selectedAppId, officialRef);
      alert('Official SSP Portal reference number saved!');
      await loadApps();
    } catch (err: any) {
      alert(err?.message || 'Failed to update official reference');
    } finally {
      setUpdatingRef(false);
    }
  };

  const selectedApp = applications.find((a) => a.id === selectedAppId);

  // Compute stage states
  const currentStageIndex = selectedApp
    ? ALL_STAGES.findIndex((s) => s.key === selectedApp.status)
    : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader
        title="Application Lifecycle Tracker"
        subtitle="Chronological 10-stage progression from eligibility to DBT credit."
        onMenuClick={() => {}}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1">
        {/* Notice on Tracking Distinction */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start space-x-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold uppercase tracking-wider block">
              Integrity & Attribution Standard
            </span>
            <p className="leading-relaxed">
              FormSaathi distinguishes <strong>Official Tracking</strong> from <strong>Assisted Tracking</strong>. In Assisted Tracking mode, timeline updates are citizen self-reported with verified certificate proofs. We never fabricate live government database connections.
            </p>
          </div>
        </div>

        {applications.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center space-y-4">
            <Clock className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="text-base font-bold text-slate-900">No application record to track</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Please create an application on the Applications page first to start tracking.
            </p>
            <Link
              href="/dashboard/applications"
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#0F766E] text-white hover:bg-[#115E59]"
            >
              <span>Go to Applications</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 8 Cols: Visual 10-Stage Timeline */}
            <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
              {/* Selector header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Tracking Application
                  </span>
                  <div className="flex items-center space-x-2 mt-1">
                    <select
                      value={selectedAppId}
                      onChange={(e) => handleSelectApp(e.target.value)}
                      className="text-base font-bold text-slate-900 bg-transparent border-none focus:ring-0 p-0 cursor-pointer"
                    >
                      {applications.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.reference_number} ({a.scheme_name})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-teal-100 text-[#0F766E]">
                    {selectedApp?.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                    {selectedApp?.tracking_mode} Mode
                  </span>
                </div>
              </div>

              {/* 10-STAGE VERTICAL TIMELINE */}
              <div className="space-y-6 relative pl-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {ALL_STAGES.map((stage, idx) => {
                  const isCompleted = idx < currentStageIndex || selectedApp?.status === 'BENEFIT_DISBURSED';
                  const isCurrent = idx === currentStageIndex && selectedApp?.status !== 'BENEFIT_DISBURSED';
                  const isUpcoming = idx > currentStageIndex && selectedApp?.status !== 'BENEFIT_DISBURSED';

                  // Find event if present
                  const matchedEvent = timeline?.events?.find((e: any) => e.to_status === stage.key);

                  return (
                    <div key={stage.key} className="relative group">
                      {/* Timeline dot */}
                      <div
                        className={`absolute -left-6 top-1.5 w-4 h-4 rounded-full border-2 transition-all ${
                          isCompleted
                            ? 'bg-emerald-600 border-emerald-600'
                            : isCurrent
                            ? 'bg-[#0F766E] border-white ring-4 ring-[#0F766E]/20 animate-pulse'
                            : 'bg-white border-slate-300'
                        }`}
                      />

                      <div
                        className={`p-4 rounded-2xl border transition-all ${
                          isCurrent
                            ? 'bg-teal-50/70 border-teal-300 shadow-xs'
                            : isCompleted
                            ? 'bg-slate-50/60 border-slate-200'
                            : 'bg-white border-slate-100 opacity-60'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                          <h4 className="text-sm font-bold text-slate-900">{stage.title}</h4>
                          {matchedEvent && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(matchedEvent.created_at).toLocaleString()}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">
                          {matchedEvent?.notes || stage.desc}
                        </p>

                        {matchedEvent && (
                          <div className="mt-2 pt-2 border-t border-slate-200/50 flex items-center space-x-2 text-[10px] text-slate-500">
                            <span className="font-semibold text-slate-700">Source:</span>
                            <span className="font-mono bg-white px-2 py-0.5 rounded border">
                              {matchedEvent.source}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 4 Cols: Assisted Actions & SSP Ref Pairing */}
            <div className="lg:col-span-4 space-y-6">
              {/* Pair Official SSP Reference Number */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4 text-xs">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-[#0F766E]" />
                  <h4 className="font-bold text-slate-900">Official Portal Reference</h4>
                </div>
                <p className="text-slate-500 leading-relaxed">
                  Enter your SSP Karnataka acknowledgment number once you have locked your application online.
                </p>
                <form onSubmit={handleUpdateOfficialRef} className="space-y-3">
                  <input
                    type="text"
                    required
                    value={officialRef}
                    onChange={(e) => setOfficialRef(e.target.value)}
                    placeholder="e.g. 2425SSP00192834"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-[#0F766E]"
                  />
                  <button
                    type="submit"
                    disabled={updatingRef}
                    className="w-full py-2.5 rounded-xl font-bold bg-[#0F766E] text-white hover:bg-[#115E59] transition-colors disabled:opacity-50"
                  >
                    {updatingRef ? 'Saving...' : 'Link SSP Reference'}
                  </button>
                </form>
              </div>

              {/* Advance Status Stage (Assisted Mode) */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4 text-xs">
                <div className="flex items-center space-x-2">
                  <FileCheck2 className="w-4 h-4 text-[#0F766E]" />
                  <h4 className="font-bold text-slate-900">Update Lifecycle Status</h4>
                </div>
                <p className="text-slate-500 leading-relaxed">
                  Advance the status stage as you receive SMS / portal updates from your college or department nodal officer.
                </p>
                <form onSubmit={handleAdvanceStatus} className="space-y-3">
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      New Status Stage
                    </label>
                    <select
                      value={nextStatus}
                      onChange={(e) => setNextStatus(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-[#0F766E]"
                    >
                      {ALL_STAGES.map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Notes / SMS Evidence
                    </label>
                    <textarea
                      value={statusNotes}
                      onChange={(e) => setStatusNotes(e.target.value)}
                      placeholder="e.g. Received e-attestation SMS from nodal officer Dr. Kumar."
                      rows={3}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-[#0F766E]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={advancing}
                    className="w-full py-2.5 rounded-xl font-bold bg-[#0F766E] text-white hover:bg-[#115E59] transition-colors disabled:opacity-50"
                  >
                    {advancing ? 'Updating Timeline...' : 'Record Status Milestone'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
