import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import ServicesSection from '@/components/ServicesSection';
import ContactSection from '@/components/ContactSection';

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
    const res = await fetch(
      `${process.env.STRAPI_URL}/api/contact?locale=${locale}`,
      {
        cache: 'force-cache',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      contactData = data.data;
    }
  } catch (error) {
    console.error('Failed to fetch contact data:', error);
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
              className="text-3xl md:text-5xl lg:text-6xl drop-shadow-lg leading-tight font-rubik"
              style={{
                fontWeight: 300,
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

      {/* Services Section */}
      <ServicesSection />

      {/* Contact Section */}
      <ContactSection
        telegramLink={contactData?.telegram_link}
        phoneNumber={contactData?.phone_number}
      />
    </>
  );
}
