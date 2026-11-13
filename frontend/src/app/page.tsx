'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import {
  Shield,
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  Link2,
  Sparkles,
  Lock,
  Compass,
  AlertTriangle,
  Building2,
  GraduationCap,
  Clock,
  Landmark,
  FileText,
  ChevronRight,
  Eye,
  Languages,
} from 'lucide-react';

export default function LandingPage() {
  const journeyStages = [
    {
      step: '01',
      title: 'Discover Schemes',
      desc: 'Explore official scholarships with verified criteria from Karnataka SSP.',
      icon: Compass,
      color: 'from-teal-600 to-emerald-600',
    },
    {
      step: '02',
      title: 'Check Eligibility',
      desc: 'Deterministic rule evaluation with mathematical percentage and zero AI hallucinations.',
      icon: CheckCircle2,
      color: 'from-emerald-600 to-teal-700',
    },
    {
      step: '03',
      title: 'Connect DigiLocker',
      desc: 'Consent-based retrieval of official digital certificates in authorized sandbox.',
      icon: Link2,
      color: 'from-teal-700 to-cyan-700',
    },
    {
      step: '04',
      title: 'Verify Documents',
      desc: 'Sarvam AI extracts fields, checks expiry, and detects potential name mismatches.',
      icon: FileCheck2,
      color: 'from-cyan-700 to-emerald-700',
    },
    {
      step: '05',
      title: 'Prepare Application',
      desc: 'Generate Scheme Readiness Passport with pre-submission quality score (0-100).',
      icon: FileText,
      color: 'from-emerald-700 to-teal-800',
    },
    {
      step: '06',
      title: 'Track Application',
      desc: 'Follow the 10-stage lifecycle with official e-Attestation & department milestones.',
      icon: Clock,
      color: 'from-teal-800 to-emerald-800',
    },
    {
      step: '07',
      title: 'Receive Benefit',
      desc: 'Aadhaar-seeded NPCI verification ensures direct DBT scholarship credit.',
      icon: Landmark,
      color: 'from-emerald-800 to-teal-900',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFBEB]">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Pill Badge */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#0F766E]/10 text-[#0F766E] border border-[#0F766E]/20 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-[#059669]" />
              <span>FormSaathi 2.0 • Karnataka Post-Matric Flagship</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-6">
              From Eligibility to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0F766E] to-[#059669]">
                Benefit Disbursement
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed mb-8">
              An intelligent, privacy-first government application companion. Deterministic eligibility scoring, authorized DigiLocker consent, Sarvam AI document intelligence, and full lifecycle tracking.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/dashboard/eligibility"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl font-semibold bg-[#0F766E] text-white hover:bg-[#115E59] shadow-lg shadow-[#0F766E]/25 transition-all hover:-translate-y-0.5"
              >
                <span>Check Flagship Eligibility</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl font-semibold bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 shadow-sm transition-all"
              >
                <span>Explore Applicant Dashboard</span>
              </Link>
            </div>

            {/* Trust Markers */}
            <div className="mt-12 pt-8 border-t border-[#0F766E]/10 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-medium text-slate-600">
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Deterministic Rule Engine</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>Encrypted Document Vault</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Languages className="w-4 h-4 text-emerald-600" />
                <span>Kannada & English AI</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>DPDP-Ready Privacy Shield</span>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-[#0F766E]/15 to-[#059669]/15 blur-3xl rounded-full -z-10 pointer-events-none" />
      </section>

      {/* 7-STAGE JOURNEY SECTION */}
      <section id="journey" className="py-16 md:py-24 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F766E] mb-2">
              The Complete Citizen Journey
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              7 Intelligent Steps to Scholarship Disbursement
            </h3>
            <p className="mt-3 text-slate-600 text-sm">
              We guide you every step from first discovering the scheme to money in your bank account.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {journeyStages.map((stage) => {
              const Icon = stage.icon;
              return (
                <div
                  key={stage.step}
                  className="bg-[#FFFBEB]/50 rounded-2xl p-6 border border-[#0F766E]/10 hover:border-[#0F766E]/30 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-black text-[#0F766E]/30 tracking-wider">
                        {stage.step}
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F766E] to-[#059669] flex items-center justify-center text-white shadow-sm">
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 mb-2">{stage.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{stage.desc}</p>
                  </div>
                </div>
              );
            })}

            {/* Quick Demo CTA Card */}
            <div className="bg-gradient-to-br from-[#0F766E] to-[#134E4A] rounded-2xl p-6 text-white flex flex-col justify-between shadow-md">
              <div>
                <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider block mb-2">
                  Live Demonstration
                </span>
                <h4 className="text-lg font-bold mb-2">Experience the End-to-End Walkthrough</h4>
                <p className="text-xs text-teal-100/80 leading-relaxed">
                  Test the pre-seeded Karnataka applicant journey with one click.
                </p>
              </div>
              <Link
                href="/login"
                className="mt-6 inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-white text-[#0F766E] text-xs font-bold hover:bg-teal-50 transition-colors"
              >
                <span>Launch Demo Account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FLAGSHIP SCHEME SPOTLIGHT */}
      <section id="flagship" className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden">
            <div className="p-8 sm:p-12 bg-gradient-to-r from-[#134E4A] to-[#0F766E] text-white">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 mb-4">
                <Building2 className="w-3.5 h-3.5" />
                <span>Official Flagship Scheme Implementation</span>
              </div>
              <h3 className="text-3xl font-extrabold tracking-tight mb-3">
                Karnataka Post-Matric Scholarship (SC / ST / OBC)
              </h3>
              <p className="text-teal-100 text-sm max-w-2xl leading-relaxed">
                Administered via the unified State Scholarship Portal (SSP Karnataka). Providing tuition fee reimbursement and maintenance allowances to Class 11, Diploma, UG, PG, and PhD students.
              </p>
            </div>

            <div className="p-8 sm:p-12 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F766E]">
                  Statutory Income Limits
                </h4>
                <div className="space-y-2 text-sm text-slate-700">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <span className="font-semibold block text-slate-900">SC / ST Categories:</span>
                    <span className="text-xs text-slate-600">Up to ₹2,50,000 / year</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <span className="font-semibold block text-slate-900">OBC Category-1:</span>
                    <span className="text-xs text-slate-600">Up to ₹2,50,000 / year</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <span className="font-semibold block text-slate-900">OBC 2A / 2B / 3A / 3B:</span>
                    <span className="text-xs text-slate-600">Up to ₹1,00,000 / year</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F766E]">
                  Mandatory Verification Checklist
                </h4>
                <ul className="space-y-2 text-xs text-slate-600">
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Permanent Karnataka domicile status</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Revenue Dept Income & Caste Certificate with RD Number</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>SSLC Registration / SATS Board Marksheet</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>College admission receipt & e-Attestation</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Aadhaar-seeded & NPCI-mapped bank account</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-4 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F766E] mb-2">
                    Official Government Sources
                  </h4>
                  <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                    All rules are verified directly from Karnataka State Scholarship Portal and Social Welfare Department regulations.
                  </p>
                  <a
                    href="https://ssp.karnataka.gov.in"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-[#0F766E] hover:underline flex items-center space-x-1"
                  >
                    <span>Visit ssp.karnataka.gov.in</span>
                    <span>↗</span>
                  </a>
                </div>

                <Link
                  href="/dashboard/eligibility"
                  className="w-full inline-flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-sm font-semibold bg-[#0F766E] text-white hover:bg-[#115E59] transition-colors"
                >
                  <span>Evaluate My Eligibility</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRIVACY SHIELD SECTION */}
      <section id="privacy" className="py-16 md:py-24 bg-[#134E4A] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 mb-4">
                <Lock className="w-3.5 h-3.5" />
                <span>Privacy & Consent Shield</span>
              </div>
              <h3 className="text-3xl font-extrabold tracking-tight mb-4">
                Real Cryptographic Privacy, Not Just a Marketing Badge
              </h3>
              <p className="text-teal-100/90 text-sm leading-relaxed mb-6">
                Citizen data is protected by design. We implement strict data minimization before calling Sarvam AI, encrypt stored documents using Fernet, store only Aadhaar hashes with masked last-4 digits, and support full cryptographic data deletion.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-[#115E59]/80 border border-teal-700">
                  <span className="font-bold text-emerald-300 block mb-1">Aadhaar Minimization</span>
                  <p className="text-teal-100/70">Raw Aadhaar numbers are never persisted. Only SHA-256 hashes and last 4 digits are recorded.</p>
                </div>
                <div className="p-4 rounded-xl bg-[#115E59]/80 border border-teal-700">
                  <span className="font-bold text-emerald-300 block mb-1">AI Pre-Redaction</span>
                  <p className="text-teal-100/70">Sarvam AI calls only receive sanitized, redacted data. Full identity documents are never sent externally.</p>
                </div>
                <div className="p-4 rounded-xl bg-[#115E59]/80 border border-teal-700">
                  <span className="font-bold text-emerald-300 block mb-1">Consent Revocation</span>
                  <p className="text-teal-100/70">Users maintain granular consent switches for DigiLocker, AI analysis, and document storage.</p>
                </div>
                <div className="p-4 rounded-xl bg-[#115E59]/80 border border-teal-700">
                  <span className="font-bold text-emerald-300 block mb-1">Right to Be Forgotten</span>
                  <p className="text-teal-100/70">One-click data erasure permanently purges encrypted files and cascaded application records.</p>
                </div>
              </div>
            </div>

            <div className="bg-[#115E59] rounded-3xl p-8 border border-teal-600/50 shadow-2xl space-y-6">
              <h4 className="text-base font-bold text-emerald-200">Security Architecture Snapshot</h4>
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-lg bg-[#0D3B38] text-teal-200 border border-teal-800">
                  <span className="text-emerald-400">ENCRYPTION:</span> Fernet (AES-128-CBC + HMAC-SHA256) at rest for all vault files
                </div>
                <div className="p-3 rounded-lg bg-[#0D3B38] text-teal-200 border border-teal-800">
                  <span className="text-emerald-400">DIGILOCKER:</span> OAuth 2.0 PKCE consent gateway with sandbox mode
                </div>
                <div className="p-3 rounded-lg bg-[#0D3B38] text-teal-200 border border-teal-800">
                  <span className="text-emerald-400">SARVAM AI:</span> Backend-only integration with PII redactor filter
                </div>
                <div className="p-3 rounded-lg bg-[#0D3B38] text-teal-200 border border-teal-800">
                  <span className="text-emerald-400">AUDIT TRAIL:</span> Append-only database event log for user actions
                </div>
              </div>

              <Link
                href="/dashboard/privacy"
                className="w-full inline-flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-xs font-bold bg-white text-[#0F766E] hover:bg-teal-50 transition-colors"
              >
                <span>View Privacy Shield Settings</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
