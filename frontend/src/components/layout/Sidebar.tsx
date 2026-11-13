'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  BookOpen,
  CheckCircle2,
  Link2,
  FolderLock,
  FileSpreadsheet,
  MapPin,
  Award,
  AlertTriangle,
  ShieldCheck,
  Bell,
  Settings,
  LogOut,
  ChevronRight,
  Shield,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export default function Sidebar({ mobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/schemes', label: 'Scheme Intelligence', icon: BookOpen },
    { href: '/dashboard/eligibility', label: 'Eligibility Check', icon: CheckCircle2 },
    { href: '/dashboard/digilocker', label: 'DigiLocker (Sandbox)', icon: Link2, badge: 'Sandbox' },
    { href: '/dashboard/documents', label: 'Secure Vault', icon: FolderLock },
    { href: '/dashboard/applications', label: 'Applications', icon: FileSpreadsheet },
    { href: '/dashboard/tracking', label: 'Lifecycle Tracking', icon: MapPin },
    { href: '/dashboard/readiness', label: 'Readiness Passport', icon: Award },
    { href: '/dashboard/risk', label: 'Risk & Bottlenecks', icon: AlertTriangle },
    { href: '/dashboard/privacy', label: 'Privacy Shield', icon: ShieldCheck },
    { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  ];

  if (user?.role === 'admin') {
    navItems.push({ href: '/dashboard/admin', label: 'Admin Portal', icon: Settings });
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar sidebar element */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#134E4A] text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#115E59]">
          <Link href="/dashboard" className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#059669] to-[#047857] flex items-center justify-center text-white shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white">
                Form<span className="text-[#34D399]">Saathi</span>
              </span>
              <span className="block text-[10px] text-teal-200 tracking-wider uppercase font-medium">
                Application Intelligence
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-[#0F766E] text-white shadow-sm shadow-teal-900/30'
                    : 'text-teal-100/70 hover:bg-[#115E59] hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${active ? 'text-[#34D399]' : 'text-teal-300/70'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300">
                    {item.badge}
                  </span>
                ) : active ? (
                  <ChevronRight className="w-3.5 h-3.5 text-teal-300" />
                ) : null}
              </Link>
            );
          })}
        </div>

        {/* User profile & Logout */}
        <div className="p-4 border-t border-[#115E59]">
          <div className="flex items-center justify-between bg-[#115E59]/70 rounded-xl p-3">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-[#059669] flex items-center justify-center text-white font-bold text-xs uppercase shrink-0">
                {user?.full_name ? user.full_name[0] : 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">{user?.full_name || 'Citizen'}</p>
                <p className="text-[10px] text-teal-200 truncate capitalize">{user?.role || 'Applicant'}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-[#0F766E] transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
