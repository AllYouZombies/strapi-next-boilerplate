import { Metadata } from 'next';

type SEOData = {
  site_name: string;
  meta_title: string;
  meta_description: string;
  meta_keywords?: string;
  twitter_handle?: string;
};

export async function generateMetadata(locale: string): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL?.replace('/api', '') || 'https://home.uzb-dev.com';

  // Fetch SEO settings from Strapi
  let seoData: SEOData | null = null;
  try {
    if (process.env.STRAPI_URL) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(
        `${process.env.STRAPI_URL}/api/seo-setting?locale=${locale}`,
        {
          cache: 'force-cache',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        seoData = data.data;
      }
    }
  } catch (error) {
    console.error('Failed to fetch SEO settings:', error);
  }

  // Fallback values if Strapi is not available
  const siteName = seoData?.site_name || 'My Site';
  const title = seoData?.meta_title || 'Welcome';
  const description = seoData?.meta_description || 'Welcome to our website';
  const keywords = seoData?.meta_keywords ? seoData.meta_keywords.split(',').map(k => k.trim()) : [];
  const twitterHandle = seoData?.twitter_handle;

  return {
    title,
    description,
    ...(keywords.length > 0 && { keywords }),
    authors: [{ name: siteName }],
    creator: siteName,
    publisher: siteName,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        'ru': '/ru',
        'uz': '/uz',
        'en': '/en',
      },
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${locale}`,
      siteName,
      images: [
        {
          url: '/social-og.png',
          width: 512,
          height: 512,
          alt: siteName,
        },
      ],
      locale: locale === 'uz' ? 'uz_UZ' : locale === 'ru' ? 'ru_RU' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/social-og.png'],
      ...(twitterHandle && { creator: twitterHandle }),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION && {
        google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
      }),
      ...(process.env.NEXT_PUBLIC_YANDEX_VERIFICATION && {
        yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
      }),
    },
  };
}
