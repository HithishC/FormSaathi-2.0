'use client';

import React, { useState, useEffect } from 'react';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { api } from '@/lib/api';
import { Bell, CheckCheck, Clock, AlertCircle, CheckCircle2, Info } from 'lucide-react';

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);

  const loadNotifs = async () => {
    try {
      setLoading(true);
      const res = await api.notifications.list();
      setNotifications(res.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifs();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      await loadNotifs();
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.notifications.markRead(id);
      await loadNotifs();
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader
        title="Notifications & Lifecycle Alerts"
        subtitle="Real-time updates regarding e-Attestation, document reviews, and DBT disbursements."
        onMenuClick={() => {}}
        actions={
          notifications.some((n) => !n.is_read) ? (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all shadow-xs"
            >
              <CheckCheck className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>Mark All as Read</span>
            </button>
          ) : undefined
        }
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4 flex-1 w-full">
        {notifications.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center space-y-3">
            <Bell className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="text-base font-bold text-slate-900">No notifications yet</h4>
            <p className="text-xs text-slate-500">
              When college officers verify your certificates or updates occur on your application, they will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => {
              const isUnread = !n.is_read;
              return (
                <div
                  key={n.id}
                  onClick={() => isUnread && handleMarkRead(n.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-start space-x-4 ${
                    isUnread
                      ? 'bg-white border-[#0F766E]/40 shadow-sm ring-1 ring-[#0F766E]/20'
                      : 'bg-white/70 border-slate-200/80'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      n.notification_type === 'SUCCESS'
                        ? 'bg-emerald-50 text-emerald-600'
                        : n.notification_type === 'WARNING'
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-teal-50 text-[#0F766E]'
                    }`}
                  >
                    {n.notification_type === 'SUCCESS' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : n.notification_type === 'WARNING' ? (
                      <AlertCircle className="w-5 h-5" />
                    ) : (
                      <Info className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                  </div>

                  {isUnread && (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0F766E] shrink-0 mt-2" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
