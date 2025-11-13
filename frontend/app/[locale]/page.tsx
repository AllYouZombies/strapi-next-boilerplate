import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import AboutSection from '@/components/AboutSection';
import ServicesSection from '@/components/ServicesSection';
import PortfolioSection from '@/components/PortfolioSection';
import ContactSection from '@/components/ContactSection';

// Force dynamic rendering since we fetch from Strapi
export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string }>;
};

// Generate metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: 'Home',
    description: 'Welcome to our website',
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });

  const heroText = t('heroText');
  const lines = heroText.split('\n');

  // Fetch contact data from Strapi
  let contactData = null;
  try {
    // Skip fetch if STRAPI_URL is not defined (build time)
    if (process.env.STRAPI_URL) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

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
    console.error('Failed to fetch contact data:', error);
  }

  // Fetch main page content from Strapi
  let mainPageContent = null;
  try {
    // Skip fetch if STRAPI_URL is not defined (build time)
    if (process.env.STRAPI_URL) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const res = await fetch(
        `${process.env.STRAPI_URL}/api/main-page-content?locale=${locale}`,
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
        mainPageContent = data.data;
      }
    }
  } catch (error) {
    console.error('Failed to fetch main page content:', error);
  }

  // Fetch portfolio items from Strapi (no localization)
  let portfolioItems = null;
  try {
    // Skip fetch if STRAPI_URL is not defined (build time)
    if (process.env.STRAPI_URL) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const res = await fetch(
        `${process.env.STRAPI_URL}/api/portfolio-items?populate=image&pagination[limit]=10`,
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
        portfolioItems = data.data?.map((item: any) => ({
          id: item.id,
          documentId: item.documentId,
          image: {
            url: process.env.STRAPI_URL + item.image.url,
            alternativeText: item.image.alternativeText,
            width: item.image.width,
            height: item.image.height,
          },
        }));
      }
    }
  } catch (error) {
    console.error('Failed to fetch portfolio items:', error);
  }

  return (
    <>
      <div className="relative w-full min-h-screen flex items-center justify-center overflow-hidden">
        {/* Hero Section */}
        <div className="relative w-full h-screen flex items-center justify-center">
          {/* Left Monstera - Half visible, lower */}
          <div className="absolute left-0 top-[75%] -translate-y-1/2 -translate-x-1/2 z-0" style={{ opacity: 0.08 }}>
            <Image
              src="/monstera.png"
              alt="Monstera Left"
              width={400}
              height={600}
              className="object-cover"
              priority
            />
          </div>

          {/* Right Monstera - Half visible, higher */}
          <div className="absolute right-0 top-[17%] -translate-y-1/2 translate-x-1/2 z-0" style={{ opacity: 0.08 }}>
            <Image
              src="/monstera.png"
              alt="Monstera Right"
              width={400}
              height={600}
              className="object-cover"
              priority
            />
          </div>

          {/* SVG Background */}
          <div className="absolute inset-0 flex items-center justify-center z-5 -mt-24">
            <Image
              src="/flower.svg"
              alt="Flower"
              width={800}
              height={800}
              className="object-contain w-full h-full max-w-4xl"
              priority
            />
          </div>

          {/* Hero Text */}
          <div className="relative z-10 text-center px-4 -mt-24">
            <h1
              className="text-3xl md:text-5xl lg:text-6xl leading-tight font-rubik font-light"
              style={{
                color: '#2e2f33'
              }}
            >
              {lines.map((line, index) => (
                <span key={index}>
                  {line}
                  {index < lines.length - 1 && <br />}
                </span>
              ))}
            </h1>
          </div>
        </div>
      </div>

      {/* About Section */}
      <AboutSection content={mainPageContent?.about_us} />

      {/* Services Section */}
      <ServicesSection />

      {/* Portfolio Section */}
      <PortfolioSection items={portfolioItems} />

      {/* Contact Section */}
      <ContactSection
        telegramLink={contactData?.telegram_link}
        phoneNumber={contactData?.phone_number}
      />
    </>
  );
}
