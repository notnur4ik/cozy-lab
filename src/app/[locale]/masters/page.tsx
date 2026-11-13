import Image from 'next/image';
import Link from 'next/link';
import { getPublicCatalogData } from '@/server/repositories/catalog';
import { getDictionary, pickI18n } from '@/lib/i18n/dictionaries';
import { Badge, Card, EmptyState } from '@/components/ui/primitives';
import type { Locale } from '@/types/domain';

export const revalidate = 60;

export default async function MastersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = (rawLocale as Locale) || 'ru';
  const t = getDictionary(locale);
  const catalog = await getPublicCatalogData();

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h1 className="font-serif text-4xl font-medium text-dark sm:text-5xl">
          {t.sections.mastersTitle}
        </h1>
        <p className="mt-2 text-sm text-mocha/85">{t.sections.mastersSub}</p>
      </div>

      {catalog.masters.length > 0 ? (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {catalog.masters.map((master) => {
            const branch = catalog.branches.find((b) => b.id === master.branch_id);
            const masterServiceIds = catalog.employeeServices
              .filter((es) => es.employee_id === master.id)
              .map((es) => es.service_id);
            const masterServices = catalog.services.filter((s) => masterServiceIds.includes(s.id));

            return (
              <Card key={master.id} className="flex flex-col overflow-hidden">
                <div className="relative aspect-[4/5] bg-sand/40">
                  {master.photo_url ? (
                    <Image
                      src={master.photo_url}
                      alt={master.full_name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-6 text-center text-xs text-mocha/70">
                      {t.common.placeholderPhotoBadge}
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-serif text-2xl text-dark">{master.full_name}</h2>
                      {master.experience_verified && master.experience_years !== null ? (
                        <Badge>{master.experience_years} yrs</Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wider text-mocha">
                      {pickI18n(master.specialization_i18n, locale)}
                    </p>
                    {branch ? (
                      <p className="mt-2 text-xs text-taupe">{branch.name}</p>
                    ) : null}
                    <p className="mt-3 text-sm leading-relaxed text-mocha/85">
                      {pickI18n(master.bio_i18n, locale)}
                    </p>

                    {masterServices.length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {masterServices.map((s) => (
                          <Badge key={s.id} variant="outline">
                            {pickI18n(s.name_i18n, locale)}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <Link
                    href={`/${locale}/booking?masterId=${master.id}&branchId=${master.branch_id}`}
                    className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-mocha text-sm font-medium text-white hover:bg-dark"
                  >
                    {t.common.bookWithMaster}
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
