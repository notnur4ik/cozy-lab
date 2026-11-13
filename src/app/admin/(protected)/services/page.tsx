'use client';

import React, { useEffect, useState } from 'react';
import { Badge, Button, Card, Input } from '@/components/ui/primitives';
import { formatKzt } from '@/lib/utils';
import type { Service, ServiceCategory } from '@/types/domain';

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [nameRu, setNameRu] = useState('');
  const [slug, setSlug] = useState('');
  const [priceKzt, setPriceKzt] = useState('');
  const [duration, setDuration] = useState('60');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function load() {
    fetch('/api/admin/services')
      .then((r) => r.json())
      .then((d: { services?: Service[]; categories?: ServiceCategory[] }) => {
        setServices(d.services ?? []);
        const cats = d.categories ?? [];
        setCategories(cats);
        if (!categoryId && cats[0]) setCategoryId(cats[0].id);
      });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    const res = await fetch('/api/admin/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category_id: categoryId,
        slug: slug || `srv-${Date.now()}`,
        name_i18n: { ru: nameRu, kk: nameRu, en: nameRu },
        description_i18n: { ru: '', kk: '', en: '' },
        price_kzt: priceKzt ? Number(priceKzt) : null,
        is_price_verified: Boolean(priceKzt),
        duration_minutes: Number(duration) || 60,
        is_active: true,
      }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => null);
      setErrorMsg(d?.error?.message || 'Не удалось создать услугу.');
      return;
    }
    setNameRu('');
    setSlug('');
    setPriceKzt('');
    load();
  }

  async function handleArchive(srv: Service) {
    await fetch('/api/admin/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: srv.id,
        category_id: srv.category_id,
        slug: srv.slug,
        name_i18n: srv.name_i18n,
        description_i18n: srv.description_i18n,
        duration_minutes: srv.duration_minutes,
        archive: true,
      }),
    });
    load();
  }

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-3xl text-dark">Услуги / Services</h1>

      <Card className="p-6">
        <h2 className="font-serif text-xl text-dark">Создать услугу</h2>
        <form onSubmit={handleCreate} className="mt-4 grid gap-4 md:grid-cols-5">
          <Input
            required
            value={nameRu}
            onChange={(e) => setNameRu(e.target.value)}
            placeholder="Название услуги"
          />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="h-11 rounded-md border border-taupe/50 bg-white px-3 text-sm"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_i18n.ru}
              </option>
            ))}
          </select>
          <Input
            type="number"
            value={priceKzt}
            onChange={(e) => setPriceKzt(e.target.value)}
            placeholder="Цена (KZT)"
          />
          <Input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Длительность (мин)"
          />
          <Button type="submit">Добавить</Button>
        </form>
        {errorMsg ? (
          <p className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {errorMsg}
          </p>
        ) : null}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {services.map((s) => (
          <Card key={s.id} className="flex items-center justify-between p-5">
            <div>
              <p className="font-serif text-xl text-dark">{s.name_i18n.ru}</p>
              <p className="text-xs text-mocha">
                {s.duration_minutes} мин · {formatKzt(s.price_kzt, 'По запросу')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge>{s.is_active ? 'Active' : 'Inactive'}</Badge>
              <Button size="sm" variant="outline" onClick={() => handleArchive(s)}>
                Архив
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
