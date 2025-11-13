import Script from 'next/script';

type StructuredDataProps = {
  locale: string;
  phoneNumber?: string;
  telegramLink?: string;
  address?: string;
};

export default function StructuredData({ locale, phoneNumber, telegramLink, address }: StructuredDataProps) {
  const businessData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://home.uzb-dev.com',
    name: 'Ayda Design Studio',
    image: 'https://home.uzb-dev.com/social-og.png',
    description:
      locale === 'ru'
        ? 'Профессиональный дизайн интерьера и архитектурное проектирование в Ташкенте'
        : locale === 'uz'
        ? 'Toshkentda professional ichki dizayn va arxitektura loyihalash'
        : 'Professional interior design and architectural services in Tashkent',
    url: `https://home.uzb-dev.com/${locale}`,
    ...(phoneNumber && { telephone: phoneNumber }),
    priceRange: '$$',
    ...(address && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: address,
        addressLocality: 'Tashkent',
        addressRegion: 'Tashkent',
        postalCode: '100000',
        addressCountry: 'UZ',
      },
    }),
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 41.2995,
      longitude: 69.2401,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '18:00',
      },
    ],
    ...(telegramLink && {
      sameAs: [telegramLink],
    }),
    areaServed: {
      '@type': 'City',
      name: 'Tashkent',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name:
        locale === 'ru'
          ? 'Услуги дизайна интерьера'
          : locale === 'uz'
          ? 'Ichki dizayn xizmatlari'
          : 'Interior Design Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name:
              locale === 'ru'
                ? 'Дизайн жилых помещений'
                : locale === 'uz'
                ? 'Turar-joy dizayni'
                : 'Residential Design',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name:
              locale === 'ru'
                ? 'Коммерческий дизайн'
                : locale === 'uz'
                ? 'Tijorat dizayni'
                : 'Commercial Design',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name:
              locale === 'ru'
                ? 'Архитектурное проектирование'
                : locale === 'uz'
                ? 'Arxitektura loyihalash'
                : 'Architectural Design',
          },
        },
      ],
    },
  };

  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Ayda Design Studio',
    url: 'https://home.uzb-dev.com',
    logo: 'https://home.uzb-dev.com/logo.svg',
    ...(phoneNumber && {
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: phoneNumber,
        contactType: 'customer service',
        availableLanguage: ['Russian', 'Uzbek', 'English'],
        areaServed: 'UZ',
      },
    }),
    ...(telegramLink && {
      sameAs: [telegramLink],
    }),
  };

  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name:
          locale === 'ru' ? 'Главная' : locale === 'uz' ? 'Bosh sahifa' : 'Home',
        item: `https://home.uzb-dev.com/${locale}`,
      },
    ],
  };

  return (
    <>
      <Script
        id="business-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(businessData) }}
      />
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
      />
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
    </>
  );
}
