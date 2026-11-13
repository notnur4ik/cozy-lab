'use client';

import React, { useEffect, useState } from 'react';
import { Badge, Button, Card, Input } from '@/components/ui/primitives';
import type { Branch, Employee } from '@/types/domain';

export default function AdminMastersPage() {
  const [masters, setMasters] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [fullName, setFullName] = useState('');
  const [branchId, setBranchId] = useState('');
  const [specRu, setSpecRu] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function load() {
    fetch('/api/admin/masters')
      .then((r) => r.json())
      .then((d: { masters?: Employee[] }) => setMasters(d.masters ?? []));
    fetch('/api/admin/branches')
      .then((r) => r.json())
      .then((d: { branches?: Branch[] }) => {
        const list = d.branches ?? [];
        setBranches(list);
        if (!branchId && list[0]) setBranchId(list[0].id);
      });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    if (!branchId || !fullName) return;
    const res = await fetch('/api/admin/masters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        branch_id: branchId,
        full_name: fullName,
        specialization_i18n: { ru: specRu, kk: specRu, en: specRu },
        bio_i18n: { ru: '', kk: '', en: '' },
        is_master: true,
        is_active: true,
      }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => null);
      setErrorMsg(d?.error?.message || 'Не удалось сохранить мастера.');
      return;
    }
    setFullName('');
    setSpecRu('');
    load();
  }

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-3xl text-dark">Мастера / Masters</h1>

      <Card className="p-6">
        <h2 className="font-serif text-xl text-dark">Добавить мастера</h2>
        <form onSubmit={handleCreate} className="mt-4 grid gap-4 md:grid-cols-4">
          <Input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Имя мастера"
          />
          <Input
            value={specRu}
            onChange={(e) => setSpecRu(e.target.value)}
            placeholder="Специализация"
          />
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="h-11 rounded-md border border-taupe/50 bg-white px-3 text-sm"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <Button type="submit">Сохранить</Button>
        </form>
        {errorMsg ? (
          <p className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {errorMsg}
          </p>
        ) : null}
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {masters.map((m) => (
          <Card key={m.id} className="p-5">
            <div className="flex items-start justify-between">
              <p className="font-serif text-xl text-dark">{m.full_name}</p>
              <Badge>{m.is_active ? 'Active' : 'Inactive'}</Badge>
            </div>
            <p className="mt-1 text-xs text-mocha">{m.specialization_i18n?.ru}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
