import { Metadata } from 'next';

type LocaleSEO = {
  title: string;
  description: string;
  keywords: string[];
};

const seoData: Record<string, LocaleSEO> = {
  ru: {
    title: 'Ayda - Дизайн интерьера в Ташкенте | Архитектура и ремонт',
    description:
      'Профессиональный дизайн интерьера и архитектурное проектирование в Ташкенте. ✓ Жилые и коммерческие помещения ✓ 3D визуализация ✓ Авторский надзор. Студия Ayda - создаем уникальные пространства.',
    keywords: [
      'дизайн интерьера Ташкент',
      'архитектор Ташкент',
      'ремонт квартир Ташкент',
      'дизайн проект Узбекистан',
      'интерьер дома Ташкент',
      'коммерческий дизайн Ташкент',
      '3D визуализация интерьера',
      'студия дизайна Ayda',
      'современный интерьер Ташкент',
      'евроремонт Ташкент',
    ],
  },
  uz: {
    title: 'Ayda - Toshkentda ichki dizayn | Arxitektura va ta\'mir',
    description:
      'Toshkentda professional ichki dizayn va arxitektura loyihalash. ✓ Turar-joy va tijorat xonalari ✓ 3D vizualizatsiya ✓ Muallif nazorati. Ayda studiyasi - noyob makonlar yaratamiz.',
    keywords: [
      'ichki dizayn Toshkent',
      'arxitektor Toshkent',
      'kvartira ta\'miri Toshkent',
      'dizayn loyihasi O\'zbekiston',
      'uy interyeri Toshkent',
      'tijorat dizayni Toshkent',
      '3D vizualizatsiya',
      'Ayda dizayn studiyasi',
      'zamonaviy interer Toshkent',
    ],
  },
  en: {
    title: 'Ayda - Interior Design in Tashkent | Architecture & Renovation',
    description:
      'Professional interior design and architectural services in Tashkent, Uzbekistan. ✓ Residential & Commercial spaces ✓ 3D visualization ✓ Project supervision. Ayda Studio - creating unique spaces.',
    keywords: [
      'interior design Tashkent',
      'architect Tashkent',
      'apartment renovation Tashkent',
      'design project Uzbekistan',
      'home interior Tashkent',
      'commercial design Tashkent',
      '3D interior visualization',
      'Ayda design studio',
      'modern interior Tashkent',
      'renovation Uzbekistan',
    ],
  },
};

export function generateMetadata(locale: string): Metadata {
  const seo = seoData[locale] || seoData.en;
  const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL?.replace('/api', '') || 'https://home.uzb-dev.com';

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    authors: [{ name: 'Ayda Design Studio' }],
    creator: 'Ayda',
    publisher: 'Ayda Design Studio',
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
      title: seo.title,
      description: seo.description,
      url: `${baseUrl}/${locale}`,
      siteName: 'Ayda Design Studio',
      images: [
        {
          url: '/social-og.png',
          width: 512,
          height: 512,
          alt: 'Ayda Design Studio',
        },
      ],
      locale: locale === 'uz' ? 'uz_UZ' : locale === 'ru' ? 'ru_RU' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
      images: ['/social-og.png'],
      creator: '@ayda_design',
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
