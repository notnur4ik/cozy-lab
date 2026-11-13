import Link from 'next/link';
import { Clock, MapPin, Phone } from 'lucide-react';
import { getPublicCatalogData } from '@/server/repositories/catalog';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Badge, Card, EmptyState } from '@/components/ui/primitives';
import type { Locale } from '@/types/domain';

export const revalidate = 60;

export default async function BranchesPage({
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
          {t.sections.branchesTitle}
        </h1>
        <p className="mt-2 text-sm text-mocha/85">{t.sections.branchesSub}</p>
      </div>

      {catalog.branches.length > 0 ? (
        <div className="grid gap-8 md:grid-cols-2">
          {catalog.branches.map((branch) => (
            <Card key={branch.id} className="flex flex-col justify-between p-7">
              <div>
                <h2 className="font-serif text-3xl text-dark">{branch.name}</h2>
                <p className="mt-3 flex items-start gap-2 text-sm text-mocha">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{branch.address}</span>
                </p>
                {!branch.is_verified_address ? (
                  <Badge variant="outline" className="mt-2">
                    {t.common.addressPendingVerification}
                  </Badge>
                ) : null}

                {branch.phone ? (
                  <p className="mt-4 flex items-center gap-2 text-sm text-dark">
                    <Phone className="h-4 w-4 text-mocha" />
                    <a href={`tel:${branch.phone}`} className="hover:underline">
                      {branch.phone}
                    </a>
                  </p>
                ) : null}

                <div className="mt-4 flex items-start gap-2 text-xs text-mocha">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                    {Object.entries(branch.working_hours || {}).map(([day, hours]) => (
                      <div key={day} className="flex gap-2">
                        <span className="uppercase text-taupe">{day}:</span>
                        <span>{hours}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3 border-t border-sand pt-5">
                <Link
                  href={`/${locale}/booking?branchId=${branch.id}`}
                  className="inline-flex h-10 items-center rounded-md bg-mocha px-5 text-xs font-medium text-white hover:bg-dark"
                >
                  {t.common.bookAtBranch}
                </Link>
                <Link
                  href={`/${locale}/branches/${branch.slug}`}
                  className="inline-flex h-10 items-center rounded-md border border-mocha/30 px-5 text-xs font-medium text-dark hover:bg-sand/50"
                >
                  {t.sections.viewAll}
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title={t.common.emptyState} />
      )}
    </div>
  );
}
