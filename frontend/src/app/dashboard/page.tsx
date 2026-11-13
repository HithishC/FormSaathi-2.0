'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import {
  CheckCircle2,
  FolderLock,
  Clock,
  Award,
  ArrowRight,
  Shield,
  AlertTriangle,
  Building2,
  Sparkles,
  Link2,
  FileText,
  Calendar,
  Lock,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [schemes, setSchemes] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [digiLockerStatus, setDigiLockerStatus] = useState<any>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [profData, schemesData, appsData, docsData, dlData] = await Promise.all([
          api.auth.getProfile().catch(() => null),
          api.schemes.list().catch(() => ({ schemes: [] })),
          api.applications.list().catch(() => ({ applications: [] })),
          api.documents.list().catch(() => ({ documents: [] })),
          api.digilocker.getStatus().catch(() => ({ is_connected: false })),
        ]);

        setProfile(profData);
        setSchemes(schemesData?.schemes || []);
        setApplications(appsData?.applications || []);
        setDocuments(docsData?.documents || []);
        setDigiLockerStatus(dlData);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const flagshipScheme = schemes[0] || {
    id: 'karnataka-post-matric-scholarship',
    name: 'Karnataka Post-Matric Scholarship',
    department: 'Social Welfare Department, Government of Karnataka',
    portal_url: 'https://ssp.karnataka.gov.in',
  };

  const latestApp = applications[0];

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader
        title={`Namaskara, ${user?.full_name?.split(' ')[0] || 'Citizen'}!`}
        subtitle="Manage your government scholarship lifecycle from eligibility to DBT credit."
        onMenuClick={() => {}}
        actions={
          <Link
            href="/dashboard/eligibility"
            className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#0F766E] text-white hover:bg-[#115E59] shadow-sm transition-all"
          >
            <span>Assess Eligibility</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1">
        {/* STATS OVERVIEW CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Stat 1: Eligibility */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Eligibility Status
              </p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {profile?.category ? 'Assessed' : 'Pending'}
              </h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
                {profile?.category ? 'Category & Income matched' : 'Fill questionnaire'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          {/* Stat 2: Vault Documents */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Vault Documents
              </p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{documents.length} Files</h3>
              <p className="text-[11px] text-teal-600 font-medium mt-0.5">
                {digiLockerStatus?.is_connected ? 'DigiLocker Connected' : 'Upload or Connect DL'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <FolderLock className="w-6 h-6" />
            </div>
          </div>

          {/* Stat 3: Application Stage */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Active Application
              </p>
              <h3 className="text-xl font-black text-slate-900 mt-1 truncate max-w-[130px]">
                {latestApp ? latestApp.status.replace('_', ' ') : 'None'}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                {latestApp ? latestApp.reference_number : 'Create application'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-700 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          {/* Stat 4: Readiness Score */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Readiness Score
              </p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {documents.length > 0 ? '85%' : '45%'}
              </h3>
              <p className="text-[11px] text-amber-600 font-medium mt-0.5">Pre-submission quality</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* FLAGSHIP SCHEME SPOTLIGHT & QUICK ACTIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Flagship Scheme Spotlight */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between">
            <div className="p-6 sm:p-8 bg-gradient-to-br from-[#0F766E] to-[#134E4A] text-white">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                  Karnataka Flagship Scheme
                </span>
                <span className="text-xs text-teal-200">State Scholarship Portal (SSP)</span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight mb-2">
                Karnataka Post-Matric Scholarship (SC / ST / OBC)
              </h2>
              <p className="text-xs text-teal-100/90 leading-relaxed max-w-xl">
                Official financial assistance covering full tuition fee reimbursement and monthly maintenance allowances for Class 11, Diploma, Undergrad, and Postgrad students enrolled in recognized Karnataka institutions.
              </p>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-500 block font-medium">Income Ceiling</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                    ₹1 Lakh – ₹2.5 Lakhs
                  </span>
                  <span className="text-[10px] text-slate-500">Depends on reservation quota</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-500 block font-medium">Domicile Rule</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                    Karnataka Resident
                  </span>
                  <span className="text-[10px] text-slate-500">Statutory permanent residency</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-500 block font-medium">Disbursement</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">Direct DBT Credit</span>
                  <span className="text-[10px] text-slate-500">Aadhaar-seeded NPCI account</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between pt-4 border-t border-slate-200/80 gap-3">
                <div className="flex items-center space-x-2 text-xs text-slate-600">
                  <Building2 className="w-4 h-4 text-[#0F766E]" />
                  <span>Administered by Dept. of Social Welfare, Karnataka</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Link
                    href="/dashboard/schemes"
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    View Criteria Details
                  </Link>
                  <Link
                    href="/dashboard/eligibility"
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#0F766E] text-white hover:bg-[#115E59] shadow-sm transition-all"
                  >
                    <span>Check Eligibility Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Right Col: Quick Actions & Privacy Shield Status */}
          <div className="space-y-6">
            {/* Quick Action Hub */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Quick Actions
              </h3>
              <div className="space-y-2.5">
                <Link
                  href="/dashboard/digilocker"
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200/70 hover:border-[#0F766E]/40 hover:bg-teal-50/50 transition-all text-xs font-semibold text-slate-800"
                >
                  <div className="flex items-center space-x-2.5">
                    <Link2 className="w-4 h-4 text-[#0F766E]" />
                    <span>Connect DigiLocker (Sandbox)</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>

                <Link
                  href="/dashboard/documents"
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200/70 hover:border-[#0F766E]/40 hover:bg-teal-50/50 transition-all text-xs font-semibold text-slate-800"
                >
                  <div className="flex items-center space-x-2.5">
                    <FolderLock className="w-4 h-4 text-[#0F766E]" />
                    <span>Upload to Encrypted Vault</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>

                <Link
                  href="/dashboard/tracking"
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200/70 hover:border-[#0F766E]/40 hover:bg-teal-50/50 transition-all text-xs font-semibold text-slate-800"
                >
                  <div className="flex items-center space-x-2.5">
                    <Clock className="w-4 h-4 text-[#0F766E]" />
                    <span>Track Lifecycle Milestones</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>

                <Link
                  href="/dashboard/readiness"
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200/70 hover:border-[#0F766E]/40 hover:bg-teal-50/50 transition-all text-xs font-semibold text-slate-800"
                >
                  <div className="flex items-center space-x-2.5">
                    <Award className="w-4 h-4 text-[#0F766E]" />
                    <span>View Readiness Passport</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              </div>
            </div>

            {/* Privacy Shield Status Card */}
            <div className="bg-[#134E4A] rounded-3xl p-6 text-white space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
                  <Shield className="w-4 h-4" />
                  <span>Privacy Shield Active</span>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-xs text-teal-100/80 leading-relaxed">
                All document uploads are encrypted with Fernet before disk writes. Sarvam AI requests are strictly sanitized and minimized.
              </p>
              <Link
                href="/dashboard/privacy"
                className="w-full inline-flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-xs font-bold bg-white text-[#0F766E] hover:bg-teal-50 transition-colors"
              >
                <span>Consent & Audit Logs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
