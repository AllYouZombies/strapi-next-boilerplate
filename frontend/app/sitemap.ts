import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL?.replace('/api', '') || 'https://home.uzb-dev.com';
  const locales = ['ru', 'uz', 'en'];
  const now = new Date();

  // Generate URLs for all locales
  const localeUrls = locales.flatMap((locale) => [
    {
      url: `${baseUrl}/${locale}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 1.0,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${baseUrl}/${l}`])
        ),
      },
    },
  ]);

  return [
    ...localeUrls,
    // Add more pages here when you create them
    // Example:
    // {
    //   url: `${baseUrl}/ru/portfolio`,
    //   lastModified: now,
    //   changeFrequency: 'weekly',
    //   priority: 0.8,
    //   alternates: {
    //     languages: {
    //       ru: `${baseUrl}/ru/portfolio`,
    //       uz: `${baseUrl}/uz/portfolio`,
    //       en: `${baseUrl}/en/portfolio`,
    //     },
    //   },
    // },
  ];
}
