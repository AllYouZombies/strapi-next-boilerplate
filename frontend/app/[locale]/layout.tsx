import type { Metadata } from "next";
import { Geist, Geist_Mono, Rubik } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, isValidLocale } from '@/src/i18n/request';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import StructuredData from '@/components/StructuredData';
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700"],
});

// Generate dynamic metadata based on locale
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  // Get base metadata from SEO config
  const baseMetadata = await generateSEOMetadata(locale);

  // Add icons
  return {
    ...baseMetadata,
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: 'any' },
        { url: '/favicon-64-white.png', sizes: '64x64', type: 'image/png' },
        { url: '/favicon-128-white.png', sizes: '128x128', type: 'image/png' },
        { url: '/favicon-256-white.png', sizes: '256x256', type: 'image/png' },
      ],
      shortcut: ['/favicon.ico'],
      apple: [
        { url: '/favicon-128-white.png', sizes: '128x128', type: 'image/png' },
      ],
    },
  };
}

// Generate static params for all locales
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate locale
  if (!isValidLocale(locale)) {
    notFound();
  }

  // Get messages for the locale
  const messages = await getMessages({ locale });

  // Fetch contact data from Strapi for footer
  let contactData = null;
  try {
    if (process.env.STRAPI_URL) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(
        `${process.env.STRAPI_URL}/api/contact?locale=${locale}`,
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
        contactData = data.data;
      }
    }
  } catch (error) {
    console.error('Failed to fetch contact data for footer:', error);
  }

  // Fetch SEO settings from Strapi
  let seoData = null;
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

  return (
    <html lang={locale}>
      <head>
        <StructuredData
          locale={locale}
          phoneNumber={contactData?.phone_number}
          telegramLink={contactData?.telegram_link}
          address={contactData?.address}
          siteName={seoData?.site_name}
          businessDescription={seoData?.business_description}
          services={seoData?.services}
          instagramUrl={seoData?.instagram_url}
          facebookUrl={seoData?.facebook_url}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${rubik.variable} antialiased flex flex-col min-h-screen`}
        style={{ backgroundColor: '#f7f6f3' }}
      >
        <NextIntlClientProvider messages={messages}>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer
            phoneNumber={contactData?.phone_number}
            telegramLink={contactData?.telegram_link}
            email={contactData?.email}
          />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
