import { getPublicCatalogData } from '@/server/repositories/catalog';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { GalleryClient } from '@/components/gallery/GalleryClient';
import type { Locale } from '@/types/domain';

export const revalidate = 60;

export default async function GalleryPage({
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
          {t.sections.portfolioTitle}
        </h1>
        <p className="mt-2 text-sm text-mocha/85">{t.sections.portfolioSub}</p>
      </div>

      <GalleryClient
        locale={locale}
        items={catalog.gallery}
        categories={catalog.categories}
        masters={catalog.masters}
      />
    </div>
  );
}
