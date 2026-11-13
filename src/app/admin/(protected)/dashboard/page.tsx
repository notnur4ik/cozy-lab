'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/primitives';
import { formatKzt } from '@/lib/utils';

interface AnalyticsSummary {
  totalAppointments: number;
  newCount: number;
  pendingCount: number;
  confirmedCount: number;
  completedCount: number;
  cancelledCount: number;
  noShowCount: number;
  revenueKzt: number | null;
  averageTransactionKzt: number;
}

type DatePreset = 'today' | 'yesterday' | '7d' | '30d' | 'custom';

function computeRange(preset: DatePreset): { from: string; to: string } {
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
  const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

  if (preset === 'yesterday') {
    const y = new Date(now.getTime() - 86400_000);
    return { from: startOfDay(y).toISOString(), to: endOfDay(y).toISOString() };
  }
  if (preset === '7d') {
    const d = new Date(now.getTime() - 7 * 86400_000);
    return { from: startOfDay(d).toISOString(), to: endOfDay(now).toISOString() };
  }
  if (preset === '30d') {
    const d = new Date(now.getTime() - 30 * 86400_000);
    return { from: startOfDay(d).toISOString(), to: endOfDay(now).toISOString() };
  }
  return { from: startOfDay(now).toISOString(), to: endOfDay(now).toISOString() };
}

export default function AdminDashboardPage() {
  const [preset, setPreset] = useState<DatePreset>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    const range =
      preset === 'custom' && customFrom && customTo
        ? {
            from: new Date(`${customFrom}T00:00:00`).toISOString(),
            to: new Date(`${customTo}T23:59:59`).toISOString(),
          }
        : computeRange(preset);

    const qs = new URLSearchParams({ from: range.from, to: range.to });
    fetch(`/api/admin/analytics?${qs.toString()}`)
      .then((r) => r.json())
      .then((d: { summary?: AnalyticsSummary }) => setSummary(d.summary ?? null))
      .catch(() => setSummary(null));
  }, [preset, customFrom, customTo]);

  const cards = [
    { label: 'Всего записей / Total', value: summary?.totalAppointments ?? 0 },
    { label: 'Новые / New', value: summary?.newCount ?? 0 },
    { label: 'Ожидают / Pending', value: summary?.pendingCount ?? 0 },
    { label: 'Подтверждены / Confirmed', value: summary?.confirmedCount ?? 0 },
    { label: 'Завершены / Completed', value: summary?.completedCount ?? 0 },
    { label: 'Отмены / Cancelled', value: summary?.cancelledCount ?? 0 },
    { label: 'Неявки / No-Show', value: summary?.noShowCount ?? 0 },
    {
      label: 'Выручка (оплаты) / Revenue',
      value:
        summary?.revenueKzt === null
          ? 'Ограничено'
          : formatKzt(summary?.revenueKzt ?? 0, '0 ₸'),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-3xl text-dark">Дашборд / Dashboard</h1>
        <div className="flex flex-wrap items-center gap-2">
          {(['today', 'yesterday', '7d', '30d', 'custom'] as DatePreset[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPreset(p)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                preset === p ? 'bg-mocha text-white' : 'border border-sand bg-white text-mocha'
              }`}
            >
              {p === 'today'
                ? 'Сегодня'
                : p === 'yesterday'
                  ? 'Вчера'
                  : p === '7d'
                    ? '7 дней'
                    : p === '30d'
                      ? '30 дней'
                      : 'Период'}
            </button>
          ))}
          {preset === 'custom' ? (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="h-9 rounded border border-sand bg-white px-2 text-xs"
              />
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="h-9 rounded border border-sand bg-white px-2 text-xs"
              />
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="p-5">
            <p className="text-xs font-medium text-mocha">{c.label}</p>
            <p className="mt-2 font-serif text-3xl text-dark">{c.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
