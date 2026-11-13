import type { MetadataRoute } from 'next';
import { getPublicEnv } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  const { siteUrl } = getPublicEnv();
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/ru', '/kk', '/en'],
        disallow: ['/admin', '/api'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
