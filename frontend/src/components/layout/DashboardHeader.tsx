'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, Bell, Shield, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick: () => void;
  actions?: React.ReactNode;
}

export default function DashboardHeader({
  title,
  subtitle,
  onMenuClick,
  actions,
}: DashboardHeaderProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-[#FFFBEB]/90 backdrop-blur-md border-b border-[#0F766E]/10 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl text-slate-700 hover:bg-[#0F766E]/10 lg:hidden focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center space-x-3 sm:space-x-4">
        {actions}

        {/* Sandbox Badge */}
        <div className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100/80 text-emerald-800 border border-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Privacy Shield Active</span>
        </div>

        {/* Notifications Icon Button */}
        <Link
          href="/dashboard/notifications"
          className="p-2 rounded-xl text-slate-600 hover:bg-[#0F766E]/10 hover:text-[#0F766E] transition-colors relative"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
        </Link>
      </div>
    </header>
  );
}
