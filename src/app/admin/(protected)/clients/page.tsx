'use client';

import React, { useEffect, useState } from 'react';
import { Card, Input } from '@/components/ui/primitives';

interface ClientRow {
  id: string;
  full_name: string;
  phone: string;
  created_at: string;
  internal_notes: string | null;
  appointments?: Array<{ id: string; status: string; starts_at: string }>;
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    const qs = q ? `?q=${encodeURIComponent(q)}` : '';
    fetch(`/api/admin/clients${qs}`)
      .then((r) => r.json())
      .then((d: { clients?: ClientRow[] }) => setClients(d.clients ?? []))
      .catch(() => setClients([]));
  }, [q]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-3xl text-dark">Клиенты / Clients</h1>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Поиск по имени или телефону..."
          className="max-w-xs"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {clients.map((c) => {
          const completed = (c.appointments ?? []).filter((a) => a.status === 'COMPLETED').length;
          return (
            <Card key={c.id} className="p-5">
              <p className="font-serif text-xl text-dark">{c.full_name}</p>
              <p className="text-sm text-mocha">{c.phone}</p>
              <p className="mt-2 text-xs text-taupe">
                Завершённых визитов: {completed} · Всего записей: {c.appointments?.length ?? 0}
              </p>
              {c.internal_notes ? (
                <p className="mt-2 text-xs text-mocha">{c.internal_notes}</p>
              ) : null}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
