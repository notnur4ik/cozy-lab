import { getPublicCatalogData } from '@/server/repositories/catalog';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { ServicesCatalogClient } from '@/components/services/ServicesCatalogClient';
import type { Locale } from '@/types/domain';

export const revalidate = 60;

export default async function ServicesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { locale: rawLocale } = await params;
  const { category } = await searchParams;
  const locale = (rawLocale as Locale) || 'ru';
  const t = getDictionary(locale);
  const catalog = await getPublicCatalogData();

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h1 className="font-serif text-4xl font-medium text-dark sm:text-5xl">
          {t.nav.services}
        </h1>
        <p className="mt-2 text-sm text-mocha/85">{t.sections.servicesOverviewSub}</p>
      </div>

      <ServicesCatalogClient
        locale={locale}
        categories={catalog.categories}
        services={catalog.services}
        branches={catalog.branches}
        branchServices={catalog.branchServices}
        initialCategorySlug={category}
      />
    </div>
  );
}
