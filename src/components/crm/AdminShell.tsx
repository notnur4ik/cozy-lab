'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  Building2,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Scissors,
  Settings,
  Users,
  UserCheck,
} from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/database/supabase-browser';
import { cn } from '@/lib/utils';
import type { StaffProfile } from '@/types/domain';

export function AdminShell({
  staff,
  children,
}: {
  staff: StaffProfile;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { href: '/admin/dashboard', label: 'Дашборд / Dashboard', icon: LayoutDashboard },
    { href: '/admin/appointments', label: 'Записи / Appointments', icon: CalendarDays },
    { href: '/admin/clients', label: 'Клиенты / Clients', icon: Users },
    { href: '/admin/masters', label: 'Мастера / Masters', icon: UserCheck },
    { href: '/admin/services', label: 'Услуги / Services', icon: Scissors },
    { href: '/admin/branches', label: 'Филиалы / Branches', icon: Building2 },
    { href: '/admin/analytics', label: 'Финансы / Analytics', icon: BarChart3 },
    { href: '/admin/settings', label: 'Настройки / Settings', icon: Settings },
  ];

  async function handleLogout() {
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore if env not set
    }
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-ivory">
      <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-sand bg-white p-5 lg:flex">
        <div>
          <Link href="/admin/dashboard" className="block font-serif text-2xl tracking-[0.12em] text-dark">
            COZY LAB
          </Link>
          <p className="mt-1 text-xs text-mocha">
            {staff.full_name} · <span className="font-semibold">{staff.role}</span>
          </p>

          <nav className="mt-8 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                    active ? 'bg-mocha text-white' : 'text-mocha hover:bg-sand/50 hover:text-dark'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-md border border-sand px-3 py-2 text-xs font-medium text-mocha hover:bg-sand/40"
        >
          <LogOut className="h-4 w-4" />
          Выйти / Sign out
        </button>
      </aside>

      <main className="flex-1 p-6 lg:p-10">{children}</main>
    </div>
  );
}
