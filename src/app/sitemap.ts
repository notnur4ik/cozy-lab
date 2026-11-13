import type { MetadataRoute } from 'next';
import { getPublicEnv } from '@/lib/env';
import { SUPPORTED_LOCALES } from '@/types/domain';

export default function sitemap(): MetadataRoute.Sitemap {
  const { siteUrl } = getPublicEnv();
  const routes = ['', '/services', '/masters', '/branches', '/gallery', '/contacts', '/booking'];

  return SUPPORTED_LOCALES.flatMap((locale) =>
    routes.map((route) => ({
      url: `${siteUrl}/${locale}${route}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: route === '' ? 1.0 : 0.8,
    }))
  );
}
