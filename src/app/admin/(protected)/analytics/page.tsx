'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/primitives';
import { formatKzt } from '@/lib/utils';

export default function AdminAnalyticsPage() {
  const [summary, setSummary] = useState<{
    totalAppointments: number;
    completedCount: number;
    revenueKzt: number | null;
    averageTransactionKzt: number;
  } | null>(null);

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((r) => r.json())
      .then((d) => setSummary(d.summary ?? null))
      .catch(() => setSummary(null));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-dark">Финансовая аналитика / Analytics</h1>
      <p className="text-xs text-mocha">
        Выручка рассчитывается строго по фактически проведённым оплатам в таблице payments.
      </p>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-5">
          <p className="text-xs text-mocha">Выручка (оплаты)</p>
          <p className="mt-2 font-serif text-3xl text-dark">
            {summary?.revenueKzt === null
              ? 'Доступ ограничен'
              : formatKzt(summary?.revenueKzt ?? 0, '0 ₸')}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-mocha">Средний чек</p>
          <p className="mt-2 font-serif text-3xl text-dark">
            {formatKzt(summary?.averageTransactionKzt ?? 0, '0 ₸')}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-mocha">Завершённые визиты</p>
          <p className="mt-2 font-serif text-3xl text-dark">{summary?.completedCount ?? 0}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-mocha">Всего записей</p>
          <p className="mt-2 font-serif text-3xl text-dark">{summary?.totalAppointments ?? 0}</p>
        </Card>
      </div>
    </div>
  );
}
