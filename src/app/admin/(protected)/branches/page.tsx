'use client';

import React, { useEffect, useState } from 'react';
import { Badge, Button, Card, Input } from '@/components/ui/primitives';
import type { Branch } from '@/types/domain';

export default function AdminBranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function load() {
    fetch('/api/admin/branches')
      .then((r) => r.json())
      .then((d: { branches?: Branch[] }) => setBranches(d.branches ?? []));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    const res = await fetch('/api/admin/branches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        slug: `branch-${Date.now()}`,
        address,
        phone: phone || null,
        is_verified_address: false,
        working_hours: {
          mon: '10:00-20:00',
          tue: '10:00-20:00',
          wed: '10:00-20:00',
          thu: '10:00-20:00',
          fri: '10:00-20:00',
          sat: '10:00-20:00',
          sun: '10:00-19:00',
        },
        is_active: true,
      }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => null);
      setErrorMsg(d?.error?.message || 'Не удалось создать филиал.');
      return;
    }
    setName('');
    setAddress('');
    setPhone('');
    load();
  }

  async function toggleActive(b: Branch) {
    setErrorMsg(null);
    const res = await fetch('/api/admin/branches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: b.id,
        slug: b.slug,
        name: b.name,
        address: b.address,
        is_verified_address: b.is_verified_address,
        phone: b.phone,
        whatsapp_phone: b.whatsapp_phone,
        instagram_url: b.instagram_url,
        working_hours: b.working_hours,
        is_active: !b.is_active,
      }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => null);
      setErrorMsg(d?.error?.message || 'Не удалось обновить статус филиала.');
      return;
    }
    load();
  }

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-3xl text-dark">Филиалы / Branches</h1>

      <Card className="p-6">
        <h2 className="font-serif text-xl text-dark">Добавить филиал</h2>
        <form onSubmit={handleCreate} className="mt-4 grid gap-4 md:grid-cols-4">
          <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Название" />
          <Input required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Адрес" />
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Телефон" />
          <Button type="submit">Создать</Button>
        </form>
        {errorMsg ? (
          <p className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {errorMsg}
          </p>
        ) : null}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {branches.map((b) => (
          <Card key={b.id} className="flex items-start justify-between gap-4 p-5">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-serif text-xl text-dark">{b.name}</p>
                <Badge>{b.is_active ? 'Active' : 'Inactive'}</Badge>
              </div>
              <p className="mt-2 text-sm text-mocha">{b.address}</p>
              {b.phone ? <p className="mt-1 text-xs text-dark">{b.phone}</p> : null}
            </div>
            <Button size="sm" variant="outline" onClick={() => toggleActive(b)}>
              {b.is_active ? 'Отключить' : 'Включить'}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
