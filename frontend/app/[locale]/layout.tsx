import type { Metadata } from "next";
import { Geist, Geist_Mono, Rubik } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, isValidLocale } from '@/src/i18n/request';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
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

export const metadata: Metadata = {
  title: "Next.js + Strapi Boilerplate",
  description: "Full-stack application with Next.js and Strapi CMS",
};

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

  return (
    <html lang={locale}>
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
