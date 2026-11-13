import React from 'react';
import Link from 'next/link';
import { Shield, Lock, FileText, CheckCircle2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#134E4A] text-white border-t border-[#115E59]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Brand & Tagline */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#059669] to-[#047857] flex items-center justify-center text-white">
                <Shield className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Form<span className="text-[#34D399]">Saathi</span>
              </span>
            </div>
            <p className="text-sm text-teal-100/80 leading-relaxed">
              From Eligibility to Benefit. Privacy-first, AI-powered government application intelligence and tracking for Indian citizens.
            </p>
            <div className="inline-flex items-center space-x-2 text-xs bg-[#0F766E] px-3 py-1.5 rounded-lg text-emerald-200">
              <Lock className="w-3.5 h-3.5 text-emerald-300" />
              <span>Privacy-Focused & Fernet Encrypted</span>
            </div>
          </div>

          {/* Col 2: Flagship Scheme */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-emerald-300 mb-4">
              Flagship Scheme
            </h4>
            <ul className="space-y-2.5 text-sm text-teal-100/80">
              <li>
                <Link href="/dashboard/schemes" className="hover:text-white transition-colors">
                  Karnataka Post-Matric (SC/ST/OBC)
                </Link>
              </li>
              <li>
                <Link href="/dashboard/eligibility" className="hover:text-white transition-colors">
                  State Scholarship Portal (SSP) Rules
                </Link>
              </li>
              <li>
                <Link href="/dashboard/schemes" className="hover:text-white transition-colors">
                  Income Limits & Quota Matrix
                </Link>
              </li>
              <li>
                <Link href="/dashboard/readiness" className="hover:text-white transition-colors">
                  Direct Benefit Transfer (DBT) Readiness
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Core Engines */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-emerald-300 mb-4">
              Intelligent Engines
            </h4>
            <ul className="space-y-2.5 text-sm text-teal-100/80">
              <li>
                <Link href="/dashboard/eligibility" className="hover:text-white transition-colors">
                  Deterministic Eligibility Evaluator
                </Link>
              </li>
              <li>
                <Link href="/dashboard/digilocker" className="hover:text-white transition-colors">
                  DigiLocker Consent Gateway (Sandbox)
                </Link>
              </li>
              <li>
                <Link href="/dashboard/documents" className="hover:text-white transition-colors">
                  Sarvam AI Document Intelligence
                </Link>
              </li>
              <li>
                <Link href="/dashboard/tracking" className="hover:text-white transition-colors">
                  10-Stage Lifecycle Tracker
                </Link>
              </li>
              <li>
                <Link href="/dashboard/risk" className="hover:text-white transition-colors">
                  Application Risk Assessment
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Privacy & Official Notice */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-emerald-300 mb-4">
              Privacy & Sources
            </h4>
            <ul className="space-y-2.5 text-sm text-teal-100/80">
              <li>
                <Link href="/dashboard/privacy" className="hover:text-white transition-colors">
                  Privacy Shield & Consent Center
                </Link>
              </li>
              <li>
                <Link href="/dashboard/privacy" className="hover:text-white transition-colors">
                  Immutable Audit Logs
                </Link>
              </li>
              <li>
                <a
                  href="https://ssp.karnataka.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center space-x-1"
                >
                  <span>Official SSP Portal</span>
                  <span className="text-xs">↗</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="pt-8 border-t border-teal-800/60 flex flex-col sm:flex-row justify-between items-center text-xs text-teal-200/70 gap-4">
          <p>© {new Date().getFullYear()} FormSaathi 2.0. Built for Indian Citizen Empowerment.</p>
          <p className="text-center sm:text-right max-w-xl">
            Disclaimer: FormSaathi is an independent assistive intelligence platform. Official scheme approvals, document attestations, and DBT disbursements are governed strictly by the respective State and Central Government authorities.
          </p>
        </div>
      </div>
    </footer>
  );
}
