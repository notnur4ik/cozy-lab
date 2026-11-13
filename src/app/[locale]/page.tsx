import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, Calendar, Clock, MapPin, Phone, Sparkles } from 'lucide-react';
import { getPublicCatalogData } from '@/server/repositories/catalog';
import { getDictionary, pickI18n } from '@/lib/i18n/dictionaries';
import { Badge, Card, EmptyState } from '@/components/ui/primitives';
import { formatKzt } from '@/lib/utils';
import type { Locale } from '@/types/domain';

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getDictionary((locale as Locale) || 'ru');
  return {
    title: `COZY LAB — ${t.hero.eyebrow}`,
    description: t.hero.subtitle,
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = (rawLocale as Locale) || 'ru';
  const t = getDictionary(locale);
  const catalog = await getPublicCatalogData();

  const popularServices = catalog.services.filter((s) => s.is_popular).slice(0, 6);
  const featuredMasters = catalog.masters.slice(0, 4);
  const featuredGallery = catalog.gallery.slice(0, 6);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BeautySalon',
    name: 'COZY LAB',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Almaty',
      addressCountry: 'KZ',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 1. Hero Section */}
      <section className="relative overflow-hidden border-b border-sand bg-ivory">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:px-8 lg:py-24">
          <div className="lg:col-span-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-mocha">
              {t.hero.eyebrow}
            </p>
            <h1 className="mt-4 font-serif text-4xl font-medium leading-[1.1] text-dark sm:text-5xl lg:text-6xl">
              {t.hero.title}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-mocha/90 sm:text-lg">
              {t.hero.subtitle}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href={`/${locale}/booking`}
                className="inline-flex h-12 items-center gap-2 rounded-md bg-mocha px-7 text-sm font-medium text-white shadow-soft transition-colors hover:bg-dark"
              >
                <Calendar className="h-4 w-4" />
                {t.hero.primaryCta}
              </Link>
              <Link
                href={`/${locale}/services`}
                className="inline-flex h-12 items-center gap-2 rounded-md border border-mocha/30 bg-white px-7 text-sm font-medium text-dark transition-colors hover:bg-sand/50"
              >
                {t.hero.secondaryCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-sand bg-sand/40 shadow-soft">
              <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-sand/70 via-ivory to-taupe/30 p-8 text-center">
                <Sparkles className="h-10 w-10 text-mocha/60" />
                <p className="mt-4 font-serif text-2xl text-dark">COZY LAB ALMATY</p>
                <p className="mt-2 max-w-xs text-xs text-mocha/80">{t.hero.photoDisclaimer}</p>
              </div>
              <Badge className="absolute bottom-4 left-4 bg-white/90 text-mocha">
                {t.common.placeholderPhotoBadge}
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {!catalog.configured ? (
        <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-taupe bg-sand/40 px-5 py-4 text-sm text-dark">
            {t.common.dbNotConfigured}
          </div>
        </section>
      ) : null}

      {/* 2. Services Overview */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-3xl font-medium text-dark sm:text-4xl">
              {t.sections.servicesOverview}
            </h2>
            <p className="mt-2 text-sm text-mocha/80">{t.sections.servicesOverviewSub}</p>
          </div>
          <Link
            href={`/${locale}/services`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-mocha hover:text-dark"
          >
            {t.sections.viewAll} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.categories.length > 0 ? (
            catalog.categories.map((cat) => (
              <Link key={cat.id} href={`/${locale}/services?category=${cat.slug}`}>
                <Card className="h-full p-7 transition-transform hover:-translate-y-0.5">
                  <h3 className="font-serif text-2xl text-dark">
                    {pickI18n(cat.name_i18n, locale)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-mocha/85">
                    {pickI18n(cat.description_i18n, locale)}
                  </p>
                </Card>
              </Link>
            ))
          ) : (
            <div className="sm:col-span-2 lg:col-span-3">
              <EmptyState title={t.common.emptyState} />
            </div>
          )}
        </div>
      </section>

      {/* 3. Popular Services */}
      <section className="border-y border-sand bg-white/70 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-serif text-3xl font-medium text-dark sm:text-4xl">
              {t.sections.popularServices}
            </h2>
            <Link
              href={`/${locale}/booking`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-mocha hover:text-dark"
            >
              {t.nav.bookOnline} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {popularServices.length > 0 ? (
              popularServices.map((srv) => (
                <Card key={srv.id} className="flex flex-col justify-between p-6">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-serif text-2xl text-dark">
                        {pickI18n(srv.name_i18n, locale)}
                      </h3>
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
                        {formatKzt(srv.price_kzt, t.common.priceOnRequest)}
                      </p>
                      {!srv.is_price_verified ? (
                        <p className="text-[11px] text-taupe">{t.common.priceUnverifiedNote}</p>
                      ) : null}
                    </div>
                    <Link
                      href={`/${locale}/booking?serviceId=${srv.id}`}
                      className="rounded-md bg-sand px-4 py-2 text-xs font-medium text-dark transition-colors hover:bg-taupe/40"
                    >
                      {t.nav.bookOnline}
                    </Link>
                  </div>
                </Card>
              ))
            ) : (
              <div className="md:col-span-2 lg:col-span-3">
                <EmptyState title={t.common.emptyState} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Master Profiles */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-3xl font-medium text-dark sm:text-4xl">
              {t.sections.mastersTitle}
            </h2>
            <p className="mt-2 text-sm text-mocha/80">{t.sections.mastersSub}</p>
          </div>
          <Link
            href={`/${locale}/masters`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-mocha hover:text-dark"
          >
            {t.sections.viewAll} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featuredMasters.length > 0 ? (
            featuredMasters.map((m) => (
              <Card key={m.id} className="overflow-hidden">
                <div className="relative aspect-[4/5] bg-sand/40">
                  {m.photo_url ? (
                    <Image
                      src={m.photo_url}
                      alt={m.full_name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-4 text-center text-xs text-mocha/70">
                      {t.common.placeholderPhotoBadge}
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-serif text-xl text-dark">{m.full_name}</h3>
                  <p className="mt-1 text-xs font-medium text-mocha">
                    {pickI18n(m.specialization_i18n, locale)}
                  </p>
                  <Link
                    href={`/${locale}/booking?masterId=${m.id}`}
                    className="mt-4 inline-flex w-full items-center justify-center rounded-md border border-mocha/30 py-2 text-xs font-medium text-dark hover:bg-sand/50"
                  >
                    {t.common.bookWithMaster}
                  </Link>
                </div>
              </Card>
            ))
          ) : (
            <div className="sm:col-span-2 lg:col-span-4">
              <EmptyState title={t.common.emptyState} />
            </div>
          )}
        </div>
      </section>

      {/* 5. Portfolio & Reviews */}
      <section className="border-y border-sand bg-white/70 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-serif text-3xl font-medium text-dark sm:text-4xl">
                {t.sections.portfolioTitle}
              </h2>
              <p className="mt-2 text-sm text-mocha/80">{t.sections.portfolioSub}</p>
            </div>
            <Link
              href={`/${locale}/gallery`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-mocha hover:text-dark"
            >
              {t.sections.viewAll} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {featuredGallery.length > 0 ? (
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
              {featuredGallery.map((g) => (
                <div key={g.id} className="relative aspect-square overflow-hidden rounded-lg bg-sand/30">
                  <Image
                    src={g.image_url}
                    alt={pickI18n(g.caption_i18n, locale)}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover"
                  />
                  {g.is_placeholder ? (
                    <Badge className="absolute bottom-2 left-2 bg-white/90">
                      {t.common.placeholderPhotoBadge}
                    </Badge>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-8">
              <EmptyState title={t.common.emptyState} />
            </div>
          )}

          <div className="mt-20">
            <h2 className="font-serif text-3xl font-medium text-dark sm:text-4xl">
              {t.sections.reviewsTitle}
            </h2>
            <p className="mt-2 text-sm text-mocha/80">{t.sections.reviewsSub}</p>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {catalog.reviews.length > 0 ? (
                catalog.reviews.slice(0, 3).map((r) => (
                  <Card key={r.id} className="p-6">
                    <p className="text-sm leading-relaxed text-dark">
                      “{pickI18n(r.content_i18n, locale)}”
                    </p>
                    <div className="mt-4 flex items-center justify-between border-t border-sand pt-3 text-xs text-mocha">
                      <span className="font-medium">{r.author_name}</span>
                      {r.external_url ? (
                        <a
                          href={r.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          {r.source_name}
                        </a>
                      ) : (
                        <span>{r.source_name}</span>
                      )}
                    </div>
                  </Card>
                ))
              ) : (
                <div className="md:col-span-3">
                  <EmptyState title={t.common.emptyState} />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 6. Branches & Contacts */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-3xl font-medium text-dark sm:text-4xl">
              {t.sections.branchesTitle}
            </h2>
            <p className="mt-2 text-sm text-mocha/80">{t.sections.branchesSub}</p>
          </div>
          <Link
            href={`/${locale}/contacts`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-mocha hover:text-dark"
          >
            {t.nav.contacts} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {catalog.branches.length > 0 ? (
            catalog.branches.map((b) => (
              <Card key={b.id} className="flex flex-col justify-between p-6">
                <div>
                  <h3 className="font-serif text-2xl text-dark">{b.name}</h3>
                  <p className="mt-3 flex items-start gap-2 text-sm text-mocha">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{b.address}</span>
                  </p>
                  {!b.is_verified_address ? (
                    <Badge variant="outline" className="mt-2">
                      {t.common.addressPendingVerification}
                    </Badge>
                  ) : null}
                  {b.phone ? (
                    <p className="mt-3 flex items-center gap-2 text-sm text-dark">
                      <Phone className="h-4 w-4 shrink-0 text-mocha" />
                      <a href={`tel:${b.phone}`} className="hover:underline">
                        {b.phone}
                      </a>
                    </p>
                  ) : null}
                </div>
                <div className="mt-6 flex items-center gap-3 border-t border-sand pt-4">
                  <Link
                    href={`/${locale}/booking?branchId=${b.id}`}
                    className="inline-flex flex-1 items-center justify-center rounded-md bg-mocha py-2.5 text-xs font-medium text-white hover:bg-dark"
                  >
                    {t.common.bookAtBranch}
                  </Link>
                  <Link
                    href={`/${locale}/branches/${b.slug}`}
                    className="inline-flex items-center justify-center rounded-md border border-mocha/30 px-4 py-2.5 text-xs font-medium text-dark hover:bg-sand/50"
                  >
                    {t.sections.viewAll}
                  </Link>
                </div>
              </Card>
            ))
          ) : (
            <div className="md:col-span-2 lg:col-span-3">
              <EmptyState title={t.common.emptyState} />
            </div>
          )}
        </div>
      </section>
    </>
  );
}
