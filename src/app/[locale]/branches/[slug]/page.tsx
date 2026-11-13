import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, Phone } from 'lucide-react';
import { getPublicCatalogData } from '@/server/repositories/catalog';
import { getDictionary, pickI18n } from '@/lib/i18n/dictionaries';
import { Badge, Card } from '@/components/ui/primitives';
import { formatKzt } from '@/lib/utils';
import type { Locale } from '@/types/domain';

export const revalidate = 60;

export default async function BranchDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  const locale = (rawLocale as Locale) || 'ru';
  const t = getDictionary(locale);
  const catalog = await getPublicCatalogData();

  const branch = catalog.branches.find((b) => b.slug === slug);
  if (!branch) {
    notFound();
  }

  const branchMasters = catalog.masters.filter((m) => m.branch_id === branch.id);
  const serviceIds = new Set(
    catalog.branchServices.filter((bs) => bs.branch_id === branch.id).map((bs) => bs.service_id)
  );
  const branchServices = catalog.services.filter((s) => serviceIds.has(s.id));

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-sand bg-white p-8 shadow-card">
        <h1 className="font-serif text-4xl font-medium text-dark">{branch.name}</h1>
        <p className="mt-3 flex items-center gap-2 text-base text-mocha">
          <MapPin className="h-4 w-4" />
          {branch.address}
        </p>
        {!branch.is_verified_address ? (
          <Badge variant="outline" className="mt-2">
            {t.common.addressPendingVerification}
          </Badge>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-4">
          <Link
            href={`/${locale}/booking?branchId=${branch.id}`}
            className="inline-flex h-11 items-center rounded-md bg-mocha px-6 text-sm font-medium text-white hover:bg-dark"
          >
            {t.common.bookAtBranch}
          </Link>
          {branch.phone ? (
            <a
              href={`tel:${branch.phone}`}
              className="inline-flex h-11 items-center gap-2 rounded-md border border-mocha/30 px-5 text-sm font-medium text-dark hover:bg-sand/50"
            >
              <Phone className="h-4 w-4" />
              {branch.phone}
            </a>
          ) : null}
          {branch.map_url ? (
            <a
              href={branch.map_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center rounded-md border border-mocha/30 px-5 text-sm font-medium text-dark hover:bg-sand/50"
            >
              {t.common.openMap}
            </a>
          ) : null}
        </div>
      </div>

      <section>
        <h2 className="font-serif text-3xl text-dark">{t.sections.mastersTitle}</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {branchMasters.map((m) => (
            <Card key={m.id} className="p-5">
              <h3 className="font-serif text-xl text-dark">{m.full_name}</h3>
              <p className="mt-1 text-xs text-mocha">{pickI18n(m.specialization_i18n, locale)}</p>
              <Link
                href={`/${locale}/booking?branchId=${branch.id}&masterId=${m.id}`}
                className="mt-4 inline-flex text-xs font-medium text-mocha underline"
              >
                {t.common.bookWithMaster}
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-serif text-3xl text-dark">{t.nav.services}</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {branchServices.map((s) => (
            <Card key={s.id} className="flex items-center justify-between p-5">
              <div>
                <h3 className="font-serif text-xl text-dark">{pickI18n(s.name_i18n, locale)}</h3>
                <p className="text-xs text-mocha">
                  {s.duration_minutes} {t.common.minutesShort}
                </p>
              </div>
              <p className="text-sm font-semibold text-dark">
                {formatKzt(s.price_kzt, t.common.priceOnRequest)}
              </p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
