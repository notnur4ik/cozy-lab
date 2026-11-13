'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { Badge, EmptyState } from '@/components/ui/primitives';
import { getDictionary, pickI18n } from '@/lib/i18n/dictionaries';
import type { Employee, GalleryItem, Locale, ServiceCategory } from '@/types/domain';

export function GalleryClient({
  locale,
  items,
  categories,
  masters,
}: {
  locale: Locale;
  items: GalleryItem[];
  categories: ServiceCategory[];
  masters: Employee[];
}) {
  const t = getDictionary(locale);
  const [categoryId, setCategoryId] = useState('ALL');
  const [masterId, setMasterId] = useState('ALL');
  const [preview, setPreview] = useState<GalleryItem | null>(null);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (categoryId !== 'ALL' && item.category_id !== categoryId) return false;
      if (masterId !== 'ALL' && item.employee_id !== masterId) return false;
      return true;
    });
  }, [items, categoryId, masterId]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3">
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          aria-label={t.common.allCategories}
          className="h-11 rounded-md border border-taupe/50 bg-white px-3.5 text-sm text-dark"
        >
          <option value="ALL">{t.common.allCategories}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {pickI18n(c.name_i18n, locale)}
            </option>
          ))}
        </select>

        <select
          value={masterId}
          onChange={(e) => setMasterId(e.target.value)}
          aria-label={t.common.allMasters}
          className="h-11 rounded-md border border-taupe/50 bg-white px-3.5 text-sm text-dark"
        >
          <option value="ALL">{t.common.allMasters}</option>
          {masters.map((m) => (
            <option key={m.id} value={m.id}>
              {m.full_name}
            </option>
          ))}
        </select>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPreview(item)}
              className="group relative aspect-square overflow-hidden rounded-lg bg-sand/40 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mocha"
            >
              <Image
                src={item.image_url}
                alt={pickI18n(item.caption_i18n, locale)}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {item.is_placeholder ? (
                <Badge className="absolute bottom-2 left-2 bg-white/90">
                  {t.common.placeholderPhotoBadge}
                </Badge>
              ) : null}
            </button>
          ))}
        </div>
      ) : (
        <EmptyState title={t.common.emptyState} />
      )}

      {preview ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-dark/80 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-h-[90vh] max-w-3xl overflow-hidden rounded-xl bg-white p-4">
            <button
              type="button"
              onClick={() => setPreview(null)}
              aria-label={t.common.close}
              className="absolute right-4 top-4 rounded-full bg-white/90 p-2 text-dark shadow"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={preview.image_url}
              alt={pickI18n(preview.caption_i18n, locale)}
              className="max-h-[75vh] w-auto rounded-lg object-contain"
            />
            {pickI18n(preview.caption_i18n, locale) ? (
              <p className="mt-3 text-sm text-mocha">{pickI18n(preview.caption_i18n, locale)}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
