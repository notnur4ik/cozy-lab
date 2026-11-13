import Link from 'next/link';
import { MapPin, MessageCircle, Phone } from 'lucide-react';
import { getPublicCatalogData } from '@/server/repositories/catalog';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Badge, Card, EmptyState } from '@/components/ui/primitives';
import type { Locale } from '@/types/domain';

export const revalidate = 60;

export default async function ContactsPage({
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
          {t.sections.contactsTitle}
        </h1>
        <p className="mt-2 text-sm text-mocha/85">{t.sections.contactsSub}</p>
      </div>

      {catalog.branches.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {catalog.branches.map((branch) => (
            <Card key={branch.id} className="p-7">
              <h2 className="font-serif text-2xl text-dark">{branch.name}</h2>
              <p className="mt-3 flex items-start gap-2 text-sm text-mocha">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                {branch.address}
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

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={`/${locale}/booking?branchId=${branch.id}`}
                  className="inline-flex h-10 items-center rounded-md bg-mocha px-5 text-xs font-medium text-white hover:bg-dark"
                >
                  {t.nav.bookOnline}
                </Link>
                {branch.whatsapp_phone ? (
                  <a
                    href={`https://wa.me/${branch.whatsapp_phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center gap-2 rounded-md border border-mocha/30 px-4 text-xs font-medium text-dark hover:bg-sand/50"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {t.common.whatsapp}
                  </a>
                ) : null}
                {branch.instagram_url ? (
                  <a
                    href={branch.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center rounded-md border border-mocha/30 px-4 text-xs font-medium text-dark hover:bg-sand/50"
                  >
                    {t.common.instagram}
                  </a>
                ) : null}
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
