import type { Metadata } from 'next';
import { Cormorant_Garamond, Manrope } from 'next/font/google';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'COZY LAB — Сеть салонов красоты в Алматы',
    template: '%s | COZY LAB',
  },
  description:
    'COZY LAB — сеть салонов красоты в Алматы. Онлайн-запись, уход за волосами, ногтевой сервис, брови и ресницы. Designed by NOVEN.CODE.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${cormorant.variable} ${manrope.variable}`}>
      <body className="min-h-screen bg-ivory text-dark antialiased">{children}</body>
    </html>
  );
}
