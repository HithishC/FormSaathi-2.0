'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { api } from '@/lib/api';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  FolderLock,
  Link2,
  FileText,
  HelpCircle,
} from 'lucide-react';

export default function RiskPage() {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [riskData, setRiskData] = useState<any>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.applications.list();
      const list = res.applications || [];
      setApplications(list);
      if (list.length > 0) {
        const targetId = selectedAppId || list[0].id;
        setSelectedAppId(targetId);
        loadRisk(targetId);
      }
    } catch (err) {
      console.error('Failed to load risk data', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRisk = async (appId: string) => {
    try {
      const res = await api.risk.getAssessment(appId);
      setRiskData(res);
    } catch (err) {
      console.error('Failed to load risk assessment', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectApp = (id: string) => {
    setSelectedAppId(id);
    loadRisk(id);
  };

  const riskFactors = riskData?.risk_factors || [];
  const highRisks = riskFactors.filter((r: any) => r.severity === 'HIGH');
  const mediumRisks = riskFactors.filter((r: any) => r.severity === 'MEDIUM');
  const lowRisks = riskFactors.filter((r: any) => r.severity === 'LOW');

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader
        title="Application Risk & Intervention Engine"
        subtitle="Detect pre-submission compliance bottlenecks, name mismatches, and expired certificates."
        onMenuClick={() => {}}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1">
        {/* Risk Methodology Notice */}
        <div className="p-4 rounded-2xl bg-[#FFFBEB] border border-amber-300 text-amber-900 text-xs flex items-start space-x-3 shadow-xs">
          <HelpCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold uppercase tracking-wider block">
              Pre-Submission Preparedness Notice
            </span>
            <p className="leading-relaxed">
              The <strong>Risk Engine</strong> flags omissions and discrepancies that typically trigger rejection during college e-Attestation or department verification. It does not predict government approval, but identifies remediable defects before final locking.
            </p>
          </div>
        </div>

        {applications.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="text-base font-bold text-slate-900">No application to assess</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Track an application first to compute risk factors and view remedial guidance.
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
            {/* Summary Bar */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Active Application
                </span>
                <select
                  value={selectedAppId}
                  onChange={(e) => handleSelectApp(e.target.value)}
                  className="text-base font-bold text-slate-900 bg-slate-50 border rounded-xl px-3 py-1.5 cursor-pointer"
                >
                  {applications.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.reference_number} ({a.scheme_name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Severity Pill Counts */}
              <div className="flex items-center space-x-3 text-xs">
                <div className="px-3.5 py-2 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-center">
                  <span className="text-xs text-rose-600 block uppercase font-bold">High Severity</span>
                  <span className="text-xl font-black">{highRisks.length}</span>
                </div>
                <div className="px-3.5 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-center">
                  <span className="text-xs text-amber-600 block uppercase font-bold">Medium</span>
                  <span className="text-xl font-black">{mediumRisks.length}</span>
                </div>
                <div className="px-3.5 py-2 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 text-center">
                  <span className="text-xs text-teal-600 block uppercase font-bold">Readiness Score</span>
                  <span className="text-xl font-black">{riskData?.readiness_score || 0}%</span>
                </div>
              </div>
            </div>

            {/* RISK FACTORS BY SEVERITY */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Ranked Risk Factors & Remedial Guidance ({riskFactors.length})
              </h3>

              {riskFactors.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 border border-slate-200/80 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-900">Zero Critical Bottlenecks Found</h4>
                  <p className="text-xs text-slate-500">
                    Your application satisfies mandatory profile and document consistency checks.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {riskFactors.map((rf: any, idx: number) => {
                    const isHigh = rf.severity === 'HIGH';
                    const isMed = rf.severity === 'MEDIUM';

                    return (
                      <div
                        key={idx}
                        className={`bg-white rounded-3xl p-6 border shadow-sm transition-all border-l-4 ${
                          isHigh
                            ? 'border-l-rose-500 border-slate-200/80'
                            : isMed
                            ? 'border-l-amber-500 border-slate-200/80'
                            : 'border-l-teal-500 border-slate-200/80'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                isHigh
                                  ? 'bg-rose-100 text-rose-800'
                                  : isMed
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-teal-100 text-teal-800'
                              }`}
                            >
                              {rf.severity} Risk
                            </span>
                            <span className="text-sm font-bold text-slate-900">{rf.factor}</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed mb-3">
                          {rf.description}
                        </p>

                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-800 flex items-start space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-slate-900 block">Recommended Corrective Action:</span>
                            <span className="text-slate-600 text-[11px] mt-0.5 block">{rf.recommendation}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Resolution Shortcuts */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Resolve Pending Attention Items</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Import missing certificates or update profile parameters to boost your Readiness Score.
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Link
                  href="/dashboard/digilocker"
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#0F766E] text-white hover:bg-[#115E59] transition-colors"
                >
                  Import via DigiLocker (Sandbox)
                </Link>
                <Link
                  href="/dashboard/documents"
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-slate-800 border hover:bg-slate-50 transition-colors"
                >
                  Upload Scanned PDF
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
