import Link from 'next/link';
import { getDictionary } from '@/lib/i18n/dictionaries';
import type { Branch, Locale } from '@/types/domain';

export function Footer({ locale, branches }: { locale: Locale; branches: Branch[] }) {
  const t = getDictionary(locale);

  return (
    <footer className="border-t border-sand bg-dark text-ivory">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-4 lg:px-8">
        <div>
          <p className="font-serif text-2xl tracking-[0.14em] text-white">COZY LAB</p>
          <p className="mt-3 text-sm leading-relaxed text-sand/80">{t.footer.tagline}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-taupe">
            {t.footer.navigation}
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-sand/90">
            <li>
              <Link href={`/${locale}/services`} className="hover:text-white">
                {t.nav.services}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/masters`} className="hover:text-white">
                {t.nav.masters}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/branches`} className="hover:text-white">
                {t.nav.branches}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/gallery`} className="hover:text-white">
                {t.nav.gallery}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/booking`} className="hover:text-white">
                {t.nav.bookOnline}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-taupe">
            {t.footer.branches}
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-sand/90">
            {branches.length > 0 ? (
              branches.map((b) => (
                <li key={b.id}>
                  <Link href={`/${locale}/branches/${b.slug}`} className="hover:text-white">
                    {b.name}
                  </Link>
                  <p className="text-xs text-taupe">{b.address}</p>
                </li>
              ))
            ) : (
              <li className="text-xs text-taupe">{t.common.emptyState}</li>
            )}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-taupe">
            {t.footer.legal}
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-sand/90">
            <li>
              <Link href={`/${locale}/contacts`} className="hover:text-white">
                {t.nav.contacts}
              </Link>
            </li>
            <li>
              <Link href="/admin/login" className="text-taupe hover:text-white">
                {t.nav.crm}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-mocha/40">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-taupe sm:flex-row sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} COZY LAB. Almaty, Kazakhstan.</span>
          <span>{t.footer.credit}</span>
        </div>
      </div>
    </footer>
  );
}
