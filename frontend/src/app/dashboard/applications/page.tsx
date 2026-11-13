'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { api } from '@/lib/api';
import {
  FileSpreadsheet,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Award,
  Building2,
  Calendar,
} from 'lucide-react';

export default function ApplicationsPage() {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);
  const [schemes, setSchemes] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedSchemeId, setSelectedSchemeId] = useState('');
  const [trackingMode, setTrackingMode] = useState('ASSISTED');
  const [notes, setNotes] = useState('');

  const loadApps = async () => {
    try {
      setLoading(true);
      const [appsRes, schemesRes] = await Promise.all([
        api.applications.list().catch(() => ({ applications: [] })),
        api.schemes.list().catch(() => ({ schemes: [] })),
      ]);
      setApplications(appsRes?.applications || []);
      const slist = schemesRes?.schemes || [];
      setSchemes(slist);
      if (slist.length > 0) {
        setSelectedSchemeId(slist[0].id);
      }
    } catch (err) {
      console.error('Failed to load applications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApps();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchemeId) return;

    setCreating(true);
    try {
      await api.applications.create({
        scheme_id: selectedSchemeId,
        tracking_mode: trackingMode,
        notes: notes || 'Assisted scholarship lifecycle tracking initiated.',
      });
      setShowModal(false);
      setNotes('');
      await loadApps();
    } catch (err: any) {
      alert(err?.message || 'Failed to create application.');
    } finally {
      setCreating(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'APPROVED' || status === 'BENEFIT_DISBURSED') return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (status === 'REJECTED') return 'bg-rose-100 text-rose-800 border-rose-300';
    if (status === 'INFO_REQUESTED') return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-teal-100 text-[#0F766E] border-teal-300';
  };

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader
        title="Scholarship Applications"
        subtitle="Manage your tracked applications from initial eligibility to DBT disbursement."
        onMenuClick={() => {}}
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#0F766E] text-white hover:bg-[#115E59] shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Track New Application</span>
          </button>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1">
        {/* Mode Explanation Notice */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-3">
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-[#0F766E] shrink-0" />
            <div>
              <span className="font-bold text-slate-900 block">Transparent Tracking Modes</span>
              <p className="text-slate-500 mt-0.5">
                FormSaathi supports both <strong>Official Tracking</strong> (when government API tokens are paired) and <strong>Assisted Tracking</strong> (citizen self-reported with verified document evidence).
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/tracking"
            className="font-bold text-[#0F766E] hover:underline shrink-0"
          >
            Open 10-Stage Timeline →
          </Link>
        </div>

        {/* Applications List */}
        {applications.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center space-y-4 shadow-sm">
            <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="text-base font-bold text-slate-900">No applications tracked yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Start by checking your eligibility, then create an application record to follow your 10-stage lifecycle journey.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#0F766E] text-white hover:bg-[#115E59] shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Track Karnataka Post-Matric Scholarship</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {applications.map((app) => (
              <div
                key={app.id}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-6 hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-black font-mono text-[#0F766E] bg-teal-50 px-2.5 py-1 rounded-lg">
                      {app.reference_number}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {app.tracking_mode} Mode
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getStatusColor(
                          app.status
                        )}`}
                      >
                        {app.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-1">{app.scheme_name}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {app.notes || 'Karnataka Post-Matric Scholarship assistance record.'}
                  </p>

                  {app.official_reference_number && (
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                      <span className="text-slate-500 font-medium">Official Portal Ref: </span>
                      <span className="font-mono font-bold text-slate-900">{app.official_reference_number}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-2">
                    <Link
                      href="/dashboard/readiness"
                      className="inline-flex items-center space-x-1 font-semibold text-slate-600 hover:text-slate-900"
                    >
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      <span>Readiness</span>
                    </Link>
                  </div>
                  <Link
                    href="/dashboard/tracking"
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold bg-[#0F766E] text-white hover:bg-[#115E59] transition-colors"
                  >
                    <span>View Timeline</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Track New Scholarship Application</h3>
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Target Scheme
                </label>
                <select
                  value={selectedSchemeId}
                  onChange={(e) => setSelectedSchemeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-[#0F766E]"
                >
                  {schemes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Tracking Mode
                </label>
                <select
                  value={trackingMode}
                  onChange={(e) => setTrackingMode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-[#0F766E]"
                >
                  <option value="ASSISTED">Assisted Tracking (Citizen Updates & Verification)</option>
                  <option value="OFFICIAL">Official Integration (Requires Government Portal Ref)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Initial Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Applying for 2nd Year B.Sc tuition fee reimbursement."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 rounded-xl font-bold bg-[#0F766E] text-white hover:bg-[#115E59] text-xs disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Start Tracking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
