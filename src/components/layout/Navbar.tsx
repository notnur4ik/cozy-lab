'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { SUPPORTED_LOCALES, type Locale } from '@/types/domain';
import { cn } from '@/lib/utils';

export function Navbar({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() || `/${locale}`;
  const t = getDictionary(locale);

  const switchLocaleHref = (target: Locale) => {
    const segments = pathname.split('/');
    if (SUPPORTED_LOCALES.includes(segments[1] as Locale)) {
      segments[1] = target;
      return segments.join('/') || `/${target}`;
    }
    return `/${target}${pathname}`;
  };

  const links = [
    { href: `/${locale}/services`, label: t.nav.services },
    { href: `/${locale}/masters`, label: t.nav.masters },
    { href: `/${locale}/branches`, label: t.nav.branches },
    { href: `/${locale}/gallery`, label: t.nav.gallery },
    { href: `/${locale}/contacts`, label: t.nav.contacts },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-sand bg-ivory/95 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href={`/${locale}`}
          className="font-serif text-2xl font-semibold tracking-[0.14em] text-dark"
        >
          COZY LAB
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-dark',
                pathname.startsWith(item.href) ? 'text-dark underline underline-offset-8' : 'text-mocha'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <div className="flex items-center rounded-md border border-sand bg-white p-0.5 text-xs">
            {SUPPORTED_LOCALES.map((loc) => (
              <Link
                key={loc}
                href={switchLocaleHref(loc)}
                className={cn(
                  'rounded px-2 py-1 font-medium uppercase transition-colors',
                  loc === locale ? 'bg-mocha text-white' : 'text-mocha hover:text-dark'
                )}
              >
                {loc}
              </Link>
            ))}
          </div>
          <Link
            href={`/${locale}/booking`}
            className="inline-flex h-10 items-center rounded-md bg-mocha px-5 text-sm font-medium text-white transition-colors hover:bg-dark"
          >
            {t.nav.bookOnline}
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-dark lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-sand bg-ivory px-4 pb-6 pt-4 lg:hidden">
          <div className="flex flex-col gap-3">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="py-2 text-base font-medium text-dark"
              >
                {item.label}
              </Link>
            ))}
            <div className="flex items-center gap-2 pt-2">
              {SUPPORTED_LOCALES.map((loc) => (
                <Link
                  key={loc}
                  href={switchLocaleHref(loc)}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'rounded border px-3 py-1.5 text-xs font-medium uppercase',
                    loc === locale
                      ? 'border-mocha bg-mocha text-white'
                      : 'border-sand bg-white text-mocha'
                  )}
                >
                  {loc}
                </Link>
              ))}
            </div>
            <Link
              href={`/${locale}/booking`}
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex h-11 items-center justify-center rounded-md bg-mocha px-5 text-sm font-medium text-white"
            >
              {t.nav.bookOnline}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
