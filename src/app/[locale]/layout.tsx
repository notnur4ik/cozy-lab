import { notFound } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { getPublicCatalogData } from '@/server/repositories/catalog';
import { SUPPORTED_LOCALES, type Locale } from '@/types/domain';

export default async function PublicLocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!SUPPORTED_LOCALES.includes(locale as Locale)) {
    notFound();
  }

  const typedLocale = locale as Locale;
  const catalog = await getPublicCatalogData();

  return (
    <div className="flex min-h-screen flex-col bg-ivory text-dark">
      <Navbar locale={typedLocale} />
      <main className="flex-1">{children}</main>
      <Footer locale={typedLocale} branches={catalog.branches} />
    </div>
  );
}
