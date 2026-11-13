import { getPublicCatalogData } from '@/server/repositories/catalog';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { BookingWizard } from '@/components/booking/BookingWizard';
import type { Locale } from '@/types/domain';

export const dynamic = 'force-dynamic';

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ branchId?: string; serviceId?: string; masterId?: string }>;
}) {
  const { locale: rawLocale } = await params;
  const sp = await searchParams;
  const locale = (rawLocale as Locale) || 'ru';
  const t = getDictionary(locale);
  const catalog = await getPublicCatalogData();

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h1 className="font-serif text-4xl font-medium text-dark sm:text-5xl">
          {t.booking.title}
        </h1>
        <p className="mt-2 text-sm text-mocha/85">{t.booking.subtitle}</p>
      </div>

      <BookingWizard
        locale={locale}
        branches={catalog.branches}
        categories={catalog.categories}
        services={catalog.services}
        masters={catalog.masters}
        branchServices={catalog.branchServices}
        employeeServices={catalog.employeeServices}
        initialBranchId={sp.branchId}
        initialServiceId={sp.serviceId}
        initialMasterId={sp.masterId}
      />
    </div>
  );
}
