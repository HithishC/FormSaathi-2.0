'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { api } from '@/lib/api';
import {
  BookOpen,
  Building2,
  CheckCircle2,
  ExternalLink,
  FileText,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Landmark,
  GraduationCap,
  Scale,
  Calendar,
} from 'lucide-react';

export default function SchemesPage() {
  const [loading, setLoading] = useState(true);
  const [scheme, setScheme] = useState<any>(null);

  useEffect(() => {
    async function loadScheme() {
      try {
        setLoading(true);
        const data = await api.schemes.getById('karnataka-post-matric-scholarship');
        setScheme(data);
      } catch (err) {
        console.error('Failed to load scheme details', err);
      } finally {
        setLoading(false);
      }
    }
    loadScheme();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader
        title="Scheme Intelligence Engine"
        subtitle="Official criteria, statutory income limits, and document checklists from Karnataka SSP."
        onMenuClick={() => {}}
        actions={
          <Link
            href="/dashboard/eligibility"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#0F766E] text-white hover:bg-[#115E59] shadow-sm transition-all"
          >
            <span>Assess My Eligibility</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1">
        {/* Banner */}
        <div className="bg-gradient-to-r from-[#134E4A] to-[#0F766E] rounded-3xl p-6 sm:p-10 text-white shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
              Verified Flagship Scholarship
            </span>
            <a
              href="https://ssp.karnataka.gov.in"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1 text-xs text-teal-200 hover:text-white underline"
            >
              <span>ssp.karnataka.gov.in</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight mb-3">
            {scheme?.name || 'Karnataka Post-Matric Scholarship (SC / ST / OBC)'}
          </h1>
          <p className="text-sm text-teal-100 max-w-3xl leading-relaxed">
            {scheme?.description ||
              'A unified scheme administered by the Social Welfare, Tribal Welfare, and Backward Classes Welfare departments of Government of Karnataka. Provides complete tuition reimbursement and monthly maintenance allowances for students pursuing higher education.'}
          </p>
        </div>

        {/* 3-Column Detailed Intelligence Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Col 1: Statutory Eligibility & Income Matrix */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center space-x-2.5 text-slate-900 border-b border-slate-100 pb-4">
              <Scale className="w-5 h-5 text-[#0F766E]" />
              <h3 className="text-base font-bold">Statutory Criteria</h3>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="font-semibold text-slate-900 block mb-1">State Domicile</span>
                <p className="text-slate-600 leading-relaxed">
                  Applicant must be a permanent resident of Karnataka. Non-Karnataka residents are not eligible under state quotas.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <span className="font-semibold text-slate-900 block mb-1">Category & Income Limits</span>
                <div className="space-y-2 mt-2">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                    <span className="font-bold text-slate-800 block">SC / ST Categories:</span>
                    <span className="text-slate-600">Annual family income up to ₹2,50,000</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                    <span className="font-bold text-slate-800 block">OBC Category-1:</span>
                    <span className="text-slate-600">Annual family income up to ₹2,50,000</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                    <span className="font-bold text-slate-800 block">OBC 2A / 2B / 3A / 3B:</span>
                    <span className="text-slate-600">Annual family income up to ₹1,00,000</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <span className="font-semibold text-slate-900 block mb-1">Education Level</span>
                <p className="text-slate-600 leading-relaxed">
                  Must be pursuing post-matric courses (Class 11, Class 12, ITI, Diploma, Undergraduate, Postgraduate, or PhD).
                </p>
              </div>
            </div>
          </div>

          {/* Col 2: Mandatory Verification Documents */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center space-x-2.5 text-slate-900 border-b border-slate-100 pb-4">
              <FileText className="w-5 h-5 text-[#0F766E]" />
              <h3 className="text-base font-bold">Required Documents</h3>
            </div>

            <div className="space-y-3 text-xs">
              {[
                { name: 'Income Certificate', desc: 'Issued by Revenue Dept with valid RD number', mandatory: true },
                { name: 'Caste Certificate', desc: 'Issued by Revenue Dept with valid RD number', mandatory: true },
                { name: 'Aadhaar Card', desc: 'Name must match exactly on portal & bank account', mandatory: true },
                { name: 'SSLC Marksheet', desc: 'SATS / Registration number for academic verification', mandatory: true },
                { name: 'College Admission Receipt', desc: 'Bonafide certificate or current fee receipt', mandatory: true },
                { name: 'Previous Year Marksheet', desc: 'Last qualifying examination certificate', mandatory: true },
                { name: 'Aadhaar-Seeded Bank Passbook', desc: 'NPCI mapped for Direct Benefit Transfer', mandatory: true },
              ].map((doc, idx) => (
                <div key={idx} className="flex items-start space-x-2.5 p-2 rounded-xl hover:bg-slate-50">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900">{doc.name}</span>
                    <p className="text-[11px] text-slate-500">{doc.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Col 3: Disqualifications, Renewals & Portal */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center space-x-2.5 text-slate-900 border-b border-slate-100 pb-4">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-bold">Disqualifications & Rules</h3>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70 text-amber-900">
                <span className="font-bold block mb-1">Disqualifying Conditions:</span>
                <ul className="list-disc pl-4 space-y-1 text-[11px]">
                  <li>Annual family income exceeding category ceiling</li>
                  <li>Non-domicile of Karnataka state</li>
                  <li>Availing another government scholarship for same course</li>
                  <li>Failing the previous qualifying year without renewal justification</li>
                </ul>
              </div>

              <div className="pt-2">
                <span className="font-semibold text-slate-900 block mb-1">Annual Renewal Requirements</span>
                <p className="text-[11px] leading-relaxed">
                  Income certificates must be renewed every 5 years. Fresh e-attestation and bonafide college verification are required annually on SSP.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <Link
                  href="/dashboard/eligibility"
                  className="w-full inline-flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-xs font-bold bg-[#0F766E] text-white hover:bg-[#115E59] shadow-sm transition-all"
                >
                  <span>Evaluate Against My Profile</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
