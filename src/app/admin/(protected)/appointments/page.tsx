'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, EmptyState, Input } from '@/components/ui/primitives';
import { buildReplayHeaders } from '@/lib/client-security';
import { formatKzt } from '@/lib/utils';
import type { AppointmentStatus } from '@/types/domain';

interface AdminAppointmentRow {
  id: string;
  booking_code: string;
  starts_at: string;
  ends_at: string;
  price_kzt: number | null;
  status: AppointmentStatus;
  clients?: { full_name: string; phone: string } | null;
  services?: { name_i18n?: { ru?: string } } | null;
  employees?: { full_name: string } | null;
  branches?: { name: string } | null;
}

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<AdminAppointmentRow[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'day' | 'week' | 'month'>('list');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadAppointments = useCallback(() => {
    const qs = new URLSearchParams();
    if (statusFilter) qs.set('status', statusFilter);
    fetch(`/api/admin/appointments?${qs.toString()}`)
      .then((r) => r.json())
      .then((d: { appointments?: AdminAppointmentRow[] }) => setAppointments(d.appointments ?? []))
      .catch(() => setAppointments([]));
  }, [statusFilter]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  async function transitionStatus(id: string, nextStatus: AppointmentStatus) {
    setErrorMsg(null);
    const res = await fetch(`/api/admin/appointments/${id}/status`, {
      method: 'PATCH',
      headers: buildReplayHeaders(`st-${id}-${nextStatus}`),
      body: JSON.stringify({ status: nextStatus }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setErrorMsg(data?.error?.message || 'Failed to update status.');
      return;
    }
    loadAppointments();
  }

  const filtered = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfToday = startOfToday + 86_400_000;
    const endOfWeek = startOfToday + 7 * 86_400_000;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();

    return appointments.filter((a) => {
      const ts = new Date(a.starts_at).getTime();
      if (viewMode === 'day' && (ts < startOfToday || ts >= endOfToday)) return false;
      if (viewMode === 'week' && (ts < startOfToday || ts >= endOfWeek)) return false;
      if (viewMode === 'month' && (ts < startOfMonth || ts >= endOfMonth)) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        a.booking_code.toLowerCase().includes(q) ||
        (a.clients?.full_name ?? '').toLowerCase().includes(q) ||
        (a.clients?.phone ?? '').toLowerCase().includes(q)
      );
    });
  }, [appointments, viewMode, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-3xl text-dark">Записи / Appointments</h1>
        <div className="flex flex-wrap gap-2">
          {(['list', 'day', 'week', 'month'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setViewMode(m)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium uppercase ${
                viewMode === m ? 'bg-mocha text-white' : 'border border-sand bg-white text-mocha'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по коду, имени, телефону..."
          className="max-w-xs"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-11 rounded-md border border-taupe/50 bg-white px-3 text-sm"
        >
          <option value="">Все статусы</option>
          {['NEW', 'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].map(
            (s) => (
              <option key={s} value={s}>
                {s}
              </option>
            )
          )}
        </select>
      </div>

      {errorMsg ? (
        <p className="rounded-md bg-destructive/10 px-4 py-2 text-xs text-destructive">{errorMsg}</p>
      ) : null}

      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((a) => (
            <Card key={a.id} className="flex flex-col justify-between gap-4 p-5 md:flex-row md:items-center">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-mocha">{a.booking_code}</span>
                  <Badge>{a.status}</Badge>
                </div>
                <p className="font-medium text-dark">
                  {a.clients?.full_name} · <span className="text-mocha">{a.clients?.phone}</span>
                </p>
                <p className="text-xs text-mocha">
                  {a.branches?.name} · {a.services?.name_i18n?.ru} · {a.employees?.full_name}
                </p>
                <p className="text-xs text-dark">
                  {new Date(a.starts_at).toLocaleString('ru-KZ')} — {formatKzt(a.price_kzt, '—')}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {a.status === 'NEW' || a.status === 'PENDING' ? (
                  <Button size="sm" onClick={() => transitionStatus(a.id, 'CONFIRMED')}>
                    Confirm
                  </Button>
                ) : null}
                {a.status === 'CONFIRMED' || a.status === 'IN_PROGRESS' ? (
                  <Button size="sm" onClick={() => transitionStatus(a.id, 'COMPLETED')}>
                    Complete
                  </Button>
                ) : null}
                {a.status !== 'CANCELLED' && a.status !== 'COMPLETED' && a.status !== 'NO_SHOW' ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => transitionStatus(a.id, 'NO_SHOW')}
                    >
                      No-show
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => transitionStatus(a.id, 'CANCELLED')}
                    >
                      Cancel
                    </Button>
                  </>
                ) : null}
              </div>
            </Card>
          ))
        ) : (
          <EmptyState title="Записей за выбранный период нет" />
        )}
      </div>
    </div>
  );
}
