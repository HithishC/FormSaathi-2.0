'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import {
  Settings,
  Users,
  FileSpreadsheet,
  FolderLock,
  Building2,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [appsList, setAppsList] = useState<any[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    async function loadAdminData() {
      try {
        setLoading(true);
        const [statsRes, usersRes, appsRes] = await Promise.all([
          api.admin.getStats().catch(() => null),
          api.admin.getUsers().catch(() => []),
          api.admin.getApplications().catch(() => []),
        ]);
        setStats(statsRes);
        setUsersList(Array.isArray(usersRes) ? usersRes : usersRes?.items || []);
        setAppsList(Array.isArray(appsRes) ? appsRes : appsRes?.items || []);
      } catch (err) {
        console.error('Failed to load admin metrics', err);
      } finally {
        setLoading(false);
      }
    }

    loadAdminData();
  }, [user, router]);

  const handleAdminStatusChange = async (appId: string, newStatus: string) => {
    setUpdatingId(appId);
    try {
      await api.admin.updateApplicationStatus(appId, {
        status: newStatus as any,
        notes: `Official status advanced by Administrator ${user?.full_name}.`,
      });
      alert('Application status updated!');
      // Reload apps list
      const appsRes = await api.admin.getApplications().catch(() => []);
      setAppsList(appsRes || []);
    } catch (err: any) {
      alert(err?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader
        title="Administrative Authority Portal"
        subtitle="System metrics, applicant oversight, and department status determination."
        onMenuClick={() => {}}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1">
        {/* STATS TILES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Citizens</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{stats?.total_users || 0}</h3>
              <p className="text-[11px] text-teal-600 font-medium">Registered applicants</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#0F766E] flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Applications</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{stats?.total_applications || 0}</h3>
              <p className="text-[11px] text-cyan-700 font-medium">Lifecycle tracking</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-700 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Encrypted Vault</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{stats?.total_documents_secured || 0}</h3>
              <p className="text-[11px] text-emerald-600 font-medium">Secured certificates</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FolderLock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Schemes</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{stats?.active_schemes || 1}</h3>
              <p className="text-[11px] text-amber-600 font-medium">Karnataka Post-Matric</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* ALL APPLICATIONS MANAGEMENT TABLE */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900">Applicant Tracking Directory ({appsList.length})</h3>
          <p className="text-xs text-slate-500">
            Administrators can simulate departmental approval, verification sanctions, or disbursement updates.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase tracking-wider font-semibold">
                  <th className="py-2.5">Ref Number</th>
                  <th className="py-2.5">Applicant Name</th>
                  <th className="py-2.5">Scheme</th>
                  <th className="py-2.5">Current Status</th>
                  <th className="py-2.5">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {appsList.map((app) => (
                  <tr key={app.id}>
                    <td className="py-3 font-bold text-[#0F766E]">{app.reference_number}</td>
                    <td className="py-3 font-sans font-semibold text-slate-900">{app.applicant_name}</td>
                    <td className="py-3 font-sans text-slate-600">{app.scheme_name}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-teal-100 text-[#0F766E] font-bold">
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <select
                        defaultValue={app.status}
                        onChange={(e) => handleAdminStatusChange(app.id, e.target.value)}
                        disabled={updatingId === app.id}
                        className="text-xs bg-slate-50 border rounded-lg px-2 py-1 font-sans cursor-pointer focus:ring-[#0F766E]"
                      >
                        <option value="INITIAL_VERIFICATION">Initial Verification</option>
                        <option value="DEPARTMENT_REVIEW">Department Review</option>
                        <option value="INFO_REQUESTED">Clarification Requested</option>
                        <option value="APPROVED">Sanction Approved</option>
                        <option value="BENEFIT_SANCTIONED">Benefit Sanctioned</option>
                        <option value="PAYMENT_INITIATED">Payment Initiated</option>
                        <option value="BENEFIT_DISBURSED">Benefit Disbursed (Complete)</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
