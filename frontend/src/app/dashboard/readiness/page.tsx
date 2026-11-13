'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { api } from '@/lib/api';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  FileCheck2,
  FolderLock,
  Building2,
  Check,
  X,
  HelpCircle,
} from 'lucide-react';

export default function ReadinessPage() {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [passport, setPassport] = useState<any>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.applications.list();
      const list = res.applications || [];
      setApplications(list);
      if (list.length > 0) {
        const targetId = selectedAppId || list[0].id;
        setSelectedAppId(targetId);
        loadPassport(targetId);
      }
    } catch (err) {
      console.error('Failed to load readiness data', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPassport = async (appId: string) => {
    try {
      const res = await api.risk.getReadiness(appId);
      setPassport(res);
    } catch (err) {
      console.error('Failed to load readiness passport', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectApp = (id: string) => {
    setSelectedAppId(id);
    loadPassport(id);
  };

  const score = passport?.overall_score || 0;
  const getScoreTheme = (s: number) => {
    if (s >= 80) return { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-300', label: 'Ready for Official Submission' };
    if (s >= 60) return { text: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-300', label: 'Almost Ready • Few Actions Pending' };
    if (s >= 40) return { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-300', label: 'Needs Attention • Missing Key Items' };
    return { text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-300', label: 'Not Ready • Action Required' };
  };

  const theme = getScoreTheme(score);

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader
        title="Scheme Readiness Passport"
        subtitle="Pre-submission quality scoring & comprehensive requirement verification."
        onMenuClick={() => {}}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1">
        {/* Transparent Methodology Disclaimer */}
        <div className="p-4 rounded-2xl bg-[#FFFBEB] border border-amber-300 text-amber-900 text-xs flex items-start space-x-3 shadow-xs">
          <HelpCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold uppercase tracking-wider block">
              Readiness Score Methodology Notice
            </span>
            <p className="leading-relaxed">
              The <strong>Scheme Readiness Passport</strong> measures pre-submission preparedness and compliance with Karnataka SSP requirements. <em>It does not claim to predict government approval probability</em>, as official awards are made exclusively by authorized Department Sanctioning Officers following e-Attestation.
            </p>
          </div>
        </div>

        {applications.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center space-y-4">
            <Award className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="text-base font-bold text-slate-900">No application tracked yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create an application first to compute your readiness score and generate your passport.
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
          <div className="space-y-8">
            {/* OVERALL READINESS SCORE HERO */}
            <div className={`rounded-3xl p-6 sm:p-10 border shadow-sm ${theme.bg} ${theme.border} flex flex-col md:flex-row items-center justify-between gap-8`}>
              <div className="space-y-3 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start space-x-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/80 border text-slate-800">
                    Application Readiness Passport
                  </span>
                  <select
                    value={selectedAppId}
                    onChange={(e) => handleSelectApp(e.target.value)}
                    className="text-xs font-semibold text-slate-700 bg-white/80 border rounded-full px-3 py-1 cursor-pointer"
                  >
                    {applications.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.reference_number} ({a.scheme_name})
                      </option>
                    ))}
                  </select>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {passport?.scheme_name || 'Karnataka Post-Matric Scholarship'}
                </h2>
                <p className="text-sm font-semibold text-slate-700 max-w-xl">
                  Status: {theme.label}
                </p>
              </div>

              {/* Circular Score Badge */}
              <div className="w-36 h-36 rounded-full bg-white shadow-md border-4 border-[#0F766E] flex flex-col items-center justify-center shrink-0">
                <span className={`text-4xl font-black ${theme.text}`}>{score}%</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Readiness
                </span>
              </div>
            </div>

            {/* 4 CATEGORICAL BREAKDOWNS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {(passport?.categories || []).map((cat: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        {cat.category}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          cat.status === 'COMPLETE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {cat.status}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      {cat.items?.map((item: any, i: number) => (
                        <div key={i} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-none">
                          <span className="text-slate-700 truncate max-w-[140px]">{item.name}</span>
                          <span
                            className={`text-[10px] font-semibold ${
                              item.status === 'VERIFIED' || item.status === 'IN_VAULT' || item.status === 'ACTIVE'
                                ? 'text-emerald-600'
                                : 'text-slate-500'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <div className="flex justify-between text-xs font-bold text-slate-900 mb-1">
                      <span>Category Score</span>
                      <span>{cat.score}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0F766E] rounded-full transition-all"
                        style={{ width: `${cat.score}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ACTIONABLE NEXT STEPS */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">Recommended Action Plan</h3>
              <div className="space-y-2.5 text-xs text-slate-700">
                {(passport?.next_steps || []).map((step: string, i: number) => (
                  <div key={i} className="flex items-start space-x-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
                    <span className="w-5 h-5 rounded-full bg-[#0F766E] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
                <Link
                  href="/dashboard/documents"
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#0F766E] text-white hover:bg-[#115E59] transition-colors"
                >
                  Upload Missing Documents to Vault
                </Link>
                <Link
                  href="/dashboard/digilocker"
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-slate-800 border hover:bg-slate-50 transition-colors"
                >
                  Import via DigiLocker (Sandbox)
                </Link>
                <Link
                  href="/dashboard/risk"
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  View Bottlenecks & Risk Factors →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
