'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { api } from '@/lib/api';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Languages,
  Sparkles,
  HelpCircle,
  FileText,
  Building2,
  ShieldAlert,
} from 'lucide-react';

export default function EligibilityPage() {
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [scheme, setScheme] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  // Form State
  const [domicileState, setDomicileState] = useState('Karnataka');
  const [category, setCategory] = useState('OBC_CAT1');
  const [annualIncome, setAnnualIncome] = useState('180000');
  const [educationLevel, setEducationLevel] = useState('UNDERGRADUATE');
  const [institutionName, setInstitutionName] = useState('Government Science College, Bengaluru');
  const [sslcRegNo, setSslcRegNo] = useState('20210849201');
  const [bankLinked, setBankLinked] = useState(true);
  const [npciMapped, setNpciMapped] = useState(true);

  // Result state
  const [assessment, setAssessment] = useState<any>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'kn'>('en');

  useEffect(() => {
    async function loadInitial() {
      try {
        setLoading(true);
        const [profData, schemeData] = await Promise.all([
          api.auth.getProfile().catch(() => null),
          api.schemes.getById('karnataka-post-matric-scholarship').catch(() => null),
        ]);

        if (profData) {
          setProfile(profData);
          if (profData.domicile_state) setDomicileState(profData.domicile_state);
          if (profData.category) setCategory(profData.category);
          if (profData.annual_family_income) setAnnualIncome(String(profData.annual_family_income));
          if (profData.current_education_level) setEducationLevel(profData.current_education_level);
          if (profData.institution_name) setInstitutionName(profData.institution_name);
          if (profData.sslc_registration_number) setSslcRegNo(profData.sslc_registration_number);
          setBankLinked(Boolean(profData.bank_account_linked));
          setNpciMapped(Boolean(profData.npci_mapped));
        }

        setScheme(schemeData);
      } catch (err) {
        console.error('Failed to load initial eligibility form data', err);
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, []);

  const handleAssess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheme) return;

    setEvaluating(true);
    setAiExplanation(null);

    try {
      // 1. Update applicant profile first
      await api.auth.updateProfile({
        domicile_state: domicileState,
        category: category,
        annual_family_income: parseInt(annualIncome) || 0,
        current_education_level: educationLevel,
        institution_name: institutionName,
        sslc_registration_number: sslcRegNo,
        bank_account_linked: bankLinked,
        npci_mapped: npciMapped,
      } as any);

      // 2. Call deterministic eligibility assessment
      const res = await api.eligibility.assess({
        scheme_id: scheme.id,
      });

      setAssessment(res);

      // 3. Automatically fetch Sarvam AI natural language explanation in preferred language
      fetchAiExplanation(scheme.id, selectedLanguage);
    } catch (err) {
      console.error('Assessment failed', err);
    } finally {
      setEvaluating(false);
    }
  };

  const fetchAiExplanation = async (schemeId: string, lang: 'en' | 'kn') => {
    setExplaining(true);
    try {
      const explRes = await api.eligibility.explain(schemeId, lang);

      setAiExplanation(explRes.explanation || null);
    } catch (err) {
      console.error('Failed to fetch AI explanation', err);
    } finally {
      setExplaining(false);
    }
  };

  const toggleLanguage = (newLang: 'en' | 'kn') => {
    setSelectedLanguage(newLang);
    if (scheme) {
      fetchAiExplanation(scheme.id, newLang);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader
        title="Intelligent Eligibility Engine"
        subtitle="Rule-based deterministic calculation with Sarvam AI multilingual explanations."
        onMenuClick={() => {}}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1">
        {/* Flagship Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F766E] block mb-1">
              Active Assessment Target
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              Karnataka Post-Matric Scholarship (SC / ST / OBC)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Rules strictly evaluated against official Government of Karnataka SSP guidelines.
            </p>
          </div>
          <Link
            href="/dashboard/schemes"
            className="text-xs font-semibold text-[#0F766E] hover:underline shrink-0"
          >
            View Official Criteria Rules ↗
          </Link>
        </div>

        {/* 2-Column: Questionnaire (Left) + Assessment Result (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Questionnaire Form */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">Applicant Questionnaire</h3>
              <p className="text-xs text-slate-500 mt-1">
                Verify or update your profile parameters to evaluate statutory compliance.
              </p>
            </div>

            <form onSubmit={handleAssess} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Permanent Domicile State
                </label>
                <select
                  value={domicileState}
                  onChange={(e) => setDomicileState(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-[#0F766E]"
                >
                  <option value="Karnataka">Karnataka (Permanent Resident)</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Other">Other Non-Karnataka State</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Reservation Community / Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-[#0F766E]"
                >
                  <option value="SC">Scheduled Caste (SC) [Limit: ₹2.5L]</option>
                  <option value="ST">Scheduled Tribe (ST) [Limit: ₹2.5L]</option>
                  <option value="OBC_CAT1">OBC Category-1 [Limit: ₹2.5L]</option>
                  <option value="OBC_2A">OBC Category-2A [Limit: ₹1.0L]</option>
                  <option value="OBC_2B">OBC Category-2B [Limit: ₹1.0L]</option>
                  <option value="OBC_3A">OBC Category-3A [Limit: ₹1.0L]</option>
                  <option value="OBC_3B">OBC Category-3B [Limit: ₹1.0L]</option>
                  <option value="GENERAL">General / Unreserved</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Annual Family Income (₹)
                </label>
                <input
                  type="number"
                  required
                  value={annualIncome}
                  onChange={(e) => setAnnualIncome(e.target.value)}
                  placeholder="e.g. 180000"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-[#0F766E]"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  As certified in Revenue Dept Form 16 / RD Income Certificate.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Current Education Level
                </label>
                <select
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-[#0F766E]"
                >
                  <option value="CLASS_11">Class 11 / 1st PUC</option>
                  <option value="CLASS_12">Class 12 / 2nd PUC</option>
                  <option value="DIPLOMA">Polytechnic / Diploma</option>
                  <option value="ITI">ITI Technical Training</option>
                  <option value="UNDERGRADUATE">Undergraduate (BA / BSc / BCom / BE / MBBS)</option>
                  <option value="POSTGRADUATE">Postgraduate (MA / MSc / MTech / MBA)</option>
                  <option value="PHD">Doctoral (PhD)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Recognized Institution Name
                </label>
                <input
                  type="text"
                  required
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  placeholder="e.g. Government Science College, Bengaluru"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  SSLC / 10th Registration Number (SATS ID)
                </label>
                <input
                  type="text"
                  required
                  value={sslcRegNo}
                  onChange={(e) => setSslcRegNo(e.target.value)}
                  placeholder="e.g. 20210849201"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="font-semibold text-slate-900 block">DBT & Banking Compliance</span>
                <label className="flex items-center space-x-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bankLinked}
                    onChange={(e) => setBankLinked(e.target.checked)}
                    className="rounded text-[#0F766E] focus:ring-[#0F766E]"
                  />
                  <span>Bank account is seeded with Aadhaar</span>
                </label>
                <label className="flex items-center space-x-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={npciMapped}
                    onChange={(e) => setNpciMapped(e.target.checked)}
                    className="rounded text-[#0F766E] focus:ring-[#0F766E]"
                  />
                  <span>NPCI Direct Benefit Transfer (DBT) mapped</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={evaluating}
                className="w-full mt-4 inline-flex items-center justify-center space-x-2 py-3 rounded-xl font-bold bg-[#0F766E] text-white hover:bg-[#115E59] shadow-md shadow-[#0F766E]/20 transition-all disabled:opacity-50 text-xs"
              >
                <span>{evaluating ? 'Evaluating Rules...' : 'Run Deterministic Assessment'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Right Column: Assessment Result & Sarvam AI Multilingual Explanation */}
          <div className="lg:col-span-6 space-y-6">
            {assessment ? (
              <>
                {/* Result Summary Card */}
                <div
                  className={`rounded-3xl p-6 sm:p-8 border shadow-sm ${
                    assessment.overall_eligible
                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                      : 'bg-rose-50/80 border-rose-300 text-rose-950'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/80 border">
                      {assessment.overall_eligible ? 'ELIGIBLE' : 'ACTION REQUIRED'}
                    </span>
                    <span className="text-2xl font-black">
                      {assessment.eligibility_percentage}%
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold mb-2">
                    {assessment.overall_eligible
                      ? 'You Qualify for Karnataka Post-Matric Scholarship'
                      : 'Eligibility Attention Items Detected'}
                  </h3>

                  <p className="text-xs leading-relaxed opacity-90 mb-4">
                    {assessment.recommendation}
                  </p>

                  <div className="flex items-center space-x-3 pt-3 border-t border-black/10">
                    <Link
                      href="/dashboard/digilocker"
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0F766E] text-white hover:bg-[#115E59] transition-colors"
                    >
                      Connect DigiLocker (Sandbox)
                    </Link>
                    <Link
                      href="/dashboard/readiness"
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-800 border hover:bg-slate-50 transition-colors"
                    >
                      View Readiness Score
                    </Link>
                  </div>
                </div>

                {/* Sarvam AI Multilingual Explanation Card */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-[#059669]" />
                      <h4 className="text-sm font-bold text-slate-900">
                        Sarvam AI Natural Explanation
                      </h4>
                    </div>

                    {/* Language Switcher */}
                    <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs">
                      <button
                        onClick={() => toggleLanguage('en')}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                          selectedLanguage === 'en'
                            ? 'bg-white text-[#0F766E] shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        English
                      </button>
                      <button
                        onClick={() => toggleLanguage('kn')}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                          selectedLanguage === 'kn'
                            ? 'bg-white text-[#0F766E] shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        ಕನ್ನಡ
                      </button>
                    </div>
                  </div>

                  {explaining ? (
                    <div className="py-6 text-center text-xs text-slate-500 animate-pulse">
                      Generating Sarvam AI explanation in {selectedLanguage === 'kn' ? 'Kannada' : 'English'}...
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-[#FFFBEB] border border-amber-200/70 text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                      {aiExplanation || assessment.recommendation}
                    </div>
                  )}

                  <p className="text-[10px] text-slate-400">
                    Transparent AI explanation. AI does not determine statutory eligibility; the deterministic engine verifies official criteria.
                  </p>
                </div>

                {/* Detailed Conditions Breakdown */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Evaluated Criteria ({assessment.conditions.length})
                  </h4>

                  <div className="space-y-3">
                    {assessment.conditions.map((cond: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-2xl border text-xs flex items-start space-x-3 ${
                          cond.met
                            ? 'bg-emerald-50/50 border-emerald-200 text-slate-800'
                            : 'bg-rose-50/50 border-rose-200 text-slate-800'
                        }`}
                      >
                        {cond.met ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <span className="font-bold block text-slate-900">
                            {cond.rule_key.toUpperCase()}: {cond.met ? 'Verified' : 'Unmet'}
                          </span>
                          <p className="text-[11px] text-slate-600 mt-0.5">{cond.explanation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-3xl p-10 border border-slate-200/80 shadow-sm text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#0F766E] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-900">Ready for Assessment</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Fill in your academic and income details on the left, then click &quot;Run Deterministic Assessment&quot; to compute your eligibility.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
