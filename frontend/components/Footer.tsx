'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';

type FooterProps = {
  phoneNumber?: string;
  telegramLink?: string;
  email?: string;
};

export default function Footer({ phoneNumber, telegramLink, email }: FooterProps) {
  const t = useTranslations('footer');
  // Format telegram link
  const formatTelegramLink = (link: string | undefined) => {
    if (!link) return null;
    if (link.startsWith('http://') || link.startsWith('https://')) {
      return link;
    }
    if (link.startsWith('t.me/')) {
      return `https://${link}`;
    }
    if (!link.includes('/')) {
      return `https://t.me/${link}`;
    }
    return `https://${link}`;
  };

  const telegram = formatTelegramLink(telegramLink);

  return (
    <footer className="w-full mt-auto bg-[#2e2f33]">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Logo */}
          <div className="mb-12">
            <Image
              src="/logo.svg"
              alt="Ayda"
              width={150}
              height={50}
              className="h-12 w-auto brightness-0 invert"
            />
          </div>

          {/* Contacts Block */}
          <div className="mb-12">
            <h3 className="text-2xl md:text-3xl font-light text-white mb-6 font-rubik">
              {t('contacts')}
            </h3>
            <div className="flex flex-col gap-4">
              {/* Phone */}
              {phoneNumber && (
                <a
                  href={`tel:${phoneNumber}`}
                  className="flex items-center gap-3 text-gray-200 hover:text-white transition-colors duration-300 font-rubik font-light text-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{phoneNumber}</span>
                </a>
              )}

              {/* Email */}
              {email && (
                <a
                  href={`mailto:${email}`}
                  className="flex items-center gap-3 text-gray-200 hover:text-white transition-colors duration-300 font-rubik font-light text-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{email}</span>
                </a>
              )}

              {/* Telegram */}
              {telegram && (
                <a
                  href={telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-gray-200 hover:text-white transition-colors duration-300 font-rubik font-light text-lg"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.053 5.56-5.023c.242-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                  </svg>
                  <span>Telegram</span>
                </a>
              )}
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-8 border-t border-gray-700">
            <p className="text-gray-400 font-rubik font-light text-sm">
              © {new Date().getFullYear()} All rights reserved
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
