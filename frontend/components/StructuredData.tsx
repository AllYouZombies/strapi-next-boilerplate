import Script from 'next/script';

type StructuredDataProps = {
  locale: string;
  phoneNumber?: string;
  telegramLink?: string;
  address?: string;
  siteName?: string;
  businessDescription?: string;
  services?: Array<{ name: string }>;
  instagramUrl?: string;
  facebookUrl?: string;
};

export default function StructuredData({
  locale,
  phoneNumber,
  telegramLink,
  address,
  siteName,
  businessDescription,
  services,
  instagramUrl,
  facebookUrl
}: StructuredDataProps) {
  // Build social media links array
  const socialLinks = [
    telegramLink,
    instagramUrl,
    facebookUrl,
  ].filter(Boolean) as string[];

  const businessData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://home.uzb-dev.com',
    name: siteName || 'My Business',
    image: 'https://home.uzb-dev.com/social-og.png',
    ...(businessDescription && { description: businessDescription }),
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
    ...(socialLinks.length > 0 && {
      sameAs: socialLinks,
    }),
    areaServed: {
      '@type': 'City',
      name: 'Tashkent',
    },
    ...(services && services.length > 0 && {
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: locale === 'ru' ? 'Наши услуги' : locale === 'uz' ? 'Bizning xizmatlarimiz' : 'Our Services',
        itemListElement: services.map(service => ({
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: service.name,
          },
        })),
      },
    }),
  };

  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName || 'My Business',
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
    ...(socialLinks.length > 0 && {
      sameAs: socialLinks,
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
