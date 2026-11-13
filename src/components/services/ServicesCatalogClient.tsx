'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Clock, Search } from 'lucide-react';
import { Badge, Card, EmptyState, Input } from '@/components/ui/primitives';
import { getDictionary, pickI18n } from '@/lib/i18n/dictionaries';
import { cn, formatKzt } from '@/lib/utils';
import type { Branch, Locale, Service, ServiceCategory } from '@/types/domain';

export function ServicesCatalogClient({
  locale,
  categories,
  services,
  branches,
  branchServices,
  initialCategorySlug,
}: {
  locale: Locale;
  categories: ServiceCategory[];
  services: Service[];
  branches: Branch[];
  branchServices: Array<{ branch_id: string; service_id: string; price_override_kzt: number | null }>;
  initialCategorySlug?: string;
}) {
  const t = getDictionary(locale);
  const initialCat = categories.find((c) => c.slug === initialCategorySlug)?.id ?? 'ALL';
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(initialCat);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return services.filter((srv) => {
      if (selectedCategoryId !== 'ALL' && srv.category_id !== selectedCategoryId) return false;
      if (
        selectedBranchId !== 'ALL' &&
        !branchServices.some((bs) => bs.branch_id === selectedBranchId && bs.service_id === srv.id)
      ) {
        return false;
      }
      if (q) {
        const name = pickI18n(srv.name_i18n, locale).toLowerCase();
        const desc = pickI18n(srv.description_i18n, locale).toLowerCase();
        if (!name.includes(q) && !desc.includes(q)) return false;
      }
      return true;
    });
  }, [services, selectedCategoryId, selectedBranchId, search, branchServices, locale]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategoryId('ALL')}
            className={cn(
              'rounded-full px-4 py-2 text-xs font-medium transition-colors',
              selectedCategoryId === 'ALL'
                ? 'bg-mocha text-white'
                : 'border border-sand bg-white text-mocha hover:bg-sand/40'
            )}
          >
            {t.common.allCategories}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategoryId(cat.id)}
              className={cn(
                'rounded-full px-4 py-2 text-xs font-medium transition-colors',
                selectedCategoryId === cat.id
                  ? 'bg-mocha text-white'
                  : 'border border-sand bg-white text-mocha hover:bg-sand/40'
              )}
            >
              {pickI18n(cat.name_i18n, locale)}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            aria-label={t.common.allBranches}
            className="h-11 rounded-md border border-taupe/50 bg-white px-3 text-sm text-dark"
          >
            <option value="ALL">{t.common.allBranches}</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <div className="relative">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-mocha/60" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.common.searchPlaceholder}
              className="pl-9 sm:w-64"
            />
          </div>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((srv) => {
            const override =
              selectedBranchId !== 'ALL'
                ? branchServices.find(
                    (bs) => bs.branch_id === selectedBranchId && bs.service_id === srv.id
                  )?.price_override_kzt
                : null;
            const effectivePrice = override ?? srv.price_kzt;
            return (
              <Card key={srv.id} className="flex flex-col justify-between p-6">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-serif text-2xl text-dark">
                      {pickI18n(srv.name_i18n, locale)}
                    </h2>
                    <Badge variant="outline">
                      <Clock className="mr-1 h-3 w-3" />
                      {srv.duration_minutes} {t.common.minutesShort}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-mocha/85">
                    {pickI18n(srv.description_i18n, locale)}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-sand pt-4">
                  <div>
                    <p className="text-base font-semibold text-dark">
                      {formatKzt(effectivePrice, t.common.priceOnRequest)}
                    </p>
                    {!srv.is_price_verified ? (
                      <p className="text-[11px] text-taupe">{t.common.priceUnverifiedNote}</p>
                    ) : null}
                  </div>
                  <Link
                    href={`/${locale}/booking?serviceId=${srv.id}${
                      selectedBranchId !== 'ALL' ? `&branchId=${selectedBranchId}` : ''
                    }`}
                    className="rounded-md bg-mocha px-4 py-2 text-xs font-medium text-white hover:bg-dark"
                  >
                    {t.nav.bookOnline}
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState title={t.common.emptyState} />
      )}
    </div>
  );
}
