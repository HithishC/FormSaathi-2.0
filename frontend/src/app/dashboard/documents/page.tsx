'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { api } from '@/lib/api';
import {
  FolderLock,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Sparkles,
  Lock,
  Eye,
  X,
  FileCheck2,
  Link2,
} from 'lucide-react';

export default function DocumentsPage() {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState('INCOME_CERTIFICATE');
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.documents.list();
      setDocuments(res.documents || []);
    } catch (err) {
      console.error('Failed to load documents', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setFeedback(null);
    try {
      await api.documents.upload(file, uploadType);
      setFeedback(`Successfully uploaded and encrypted '${file.name}' in vault.`);
      await loadDocuments();
    } catch (err: any) {
      setFeedback(err?.message || 'Upload failed.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };


  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to securely erase this document from the encrypted vault?')) return;

    try {
      await api.documents.delete(docId);
      await loadDocuments();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader
        title="Secure Document Vault"
        subtitle="Secure document storage with encryption at rest."
        onMenuClick={() => {}}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1">
        {/* Encryption & Privacy Notice */}
        <div className="p-4 rounded-2xl bg-teal-50/80 border border-teal-200 text-teal-900 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Lock className="w-5 h-5 text-[#0F766E] shrink-0" />
            <div>
              <span className="font-bold block">Encrypted Document Vault</span>
              <p className="text-teal-700 mt-0.5">
                Files are encrypted before being written to storage. Authorized backend services can decrypt files for permitted operations. Uploading a document does not verify its contents.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/privacy"
            className="hidden sm:inline-block font-bold text-[#0F766E] hover:underline shrink-0"
          >
            Privacy Settings →
          </Link>
        </div>

        {feedback && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Upload & DigiLocker Gateway Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Box */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">Upload Certificate / Marksheet</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Document Type
                </label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-[#0F766E]"
                >
                  <option value="INCOME_CERTIFICATE">Income Certificate (ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ)</option>
                  <option value="CASTE_CERTIFICATE">Caste Certificate (ಜಾತಿ ಪ್ರಮಾಣಪತ್ರ)</option>
                  <option value="SSLC_MARKSHEET">SSLC / 10th Marksheet (SATS)</option>
                  <option value="PREVIOUS_MARKSHEET">Previous Year Marksheet</option>
                  <option value="COLLEGE_ADMISSION">College Admission / Fee Receipt</option>
                  <option value="BANK_PASSBOOK">Bank Passbook (Aadhaar Seeded)</option>
                  <option value="AADHAAR">Aadhaar Card (e-Aadhaar)</option>
                  <option value="OTHER">Other Scholarship Document</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Select File (PDF, PNG, JPG)
                </label>
                <label className="flex items-center justify-center space-x-2 w-full px-4 py-2 rounded-xl border-2 border-dashed border-[#0F766E]/40 hover:border-[#0F766E] hover:bg-teal-50/50 cursor-pointer text-xs font-semibold text-[#0F766E] transition-all">
                  <Upload className="w-4 h-4" />
                  <span>{uploading ? 'Encrypting & Storing...' : 'Choose File to Upload'}</span>
                  <input
                    type="file"
                    disabled={uploading}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* DigiLocker Shortcut Card */}
          <div className="bg-gradient-to-br from-[#0F766E] to-[#134E4A] rounded-3xl p-6 text-white flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-300 mb-2">
                <Link2 className="w-4 h-4" />
                <span>DigiLocker Integration</span>
              </div>
              <h4 className="text-lg font-bold mb-1">Need Digital Certificates?</h4>
              <p className="text-xs text-teal-100/80 leading-relaxed">
                Import verified Nadakacheri and KSEAB certificates directly without scanning paperwork.
              </p>
            </div>
            <Link
              href="/dashboard/digilocker"
              className="mt-4 inline-flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-white text-[#0F766E] hover:bg-teal-50 transition-colors"
            >
              <span>Connect DigiLocker (Sandbox)</span>
              <FileCheck2 className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* VAULT DOCUMENTS LIST */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Stored Vault Documents ({documents.length})</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Documents are securely stored. Automated extraction and document verification are not currently available.
              </p>
            </div>
          </div>

          {documents.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <FolderLock className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-600">No documents in vault yet.</p>
              <p className="text-[11px] text-slate-400">
                Upload a certificate above or import from DigiLocker.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {documents.map((doc: any) => (
                <div
                  key={doc.id}
                  className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-slate-900">
                          {doc.original_filename}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {doc.source}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 block mt-0.5">
                        Type: {doc.document_type.replace('_', ' ')} • Encrypted at rest
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-xs text-slate-500 px-2 py-1 rounded-lg bg-slate-100">Analysis unavailable</span>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete from vault"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
