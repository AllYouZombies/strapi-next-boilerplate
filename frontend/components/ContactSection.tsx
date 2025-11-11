'use client';

import { useTranslations } from 'next-intl';

type ContactSectionProps = {
  telegramLink?: string;
  phoneNumber?: string;
};

export default function ContactSection({
  telegramLink,
  phoneNumber,
}: ContactSectionProps) {
  const t = useTranslations('contact');

  // Ensure telegram link has protocol
  const formatTelegramLink = (link: string | undefined) => {
    if (!link) return 'https://t.me/yourusername';
    if (link.startsWith('http://') || link.startsWith('https://')) {
      return link;
    }
    // If link starts with t.me/, add https://
    if (link.startsWith('t.me/')) {
      return `https://${link}`;
    }
    // If link is just username, add full URL
    if (!link.includes('/')) {
      return `https://t.me/${link}`;
    }
    return `https://${link}`;
  };

  const telegram = formatTelegramLink(telegramLink);
  const phone = phoneNumber || '+998901234567';

  return (
    <section className="relative w-full min-h-screen flex items-center justify-center py-20 px-4">
      <div className="max-w-4xl w-full text-center">
        {/* Heading */}
        <h2 className="text-5xl md:text-6xl lg:text-7xl font-light text-[#2e2f33] mb-6 font-rubik">
          {t('heading')}
        </h2>

        {/* Subheading */}
        <p className="text-xl md:text-2xl lg:text-3xl text-gray-600 font-light mb-12 font-rubik">
          {t('subheading')}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          {/* Primary Button - Discuss Project (Phone Call) */}
          <a
            href={`tel:${phone}`}
            className="
              group relative w-full sm:w-auto
              px-8 py-4
              bg-[#2e2f33] text-white
              rounded-full
              font-rubik font-light text-lg
              transition-all duration-300 ease-out
              hover:bg-[#1a1b1d] hover:scale-105 hover:shadow-xl
              active:scale-95
              overflow-hidden
            "
          >
            <span className="relative z-10">{t('discussProject')}</span>
            {/* Hover effect */}
            <div className="
              absolute inset-0 bg-gradient-to-r from-[#1a1b1d] to-[#2e2f33]
              opacity-0 group-hover:opacity-100
              transition-opacity duration-300
            " />
          </a>

          {/* Secondary Button - Telegram */}
          <a
            href={telegram}
            target="_blank"
            rel="noopener noreferrer"
            className="
              group relative w-full sm:w-auto
              px-8 py-4
              bg-white text-[#2e2f33]
              border-2 border-[#2e2f33]
              rounded-full
              font-rubik font-light text-lg
              transition-all duration-300 ease-out
              hover:bg-[#2e2f33] hover:text-white hover:scale-105 hover:shadow-xl
              active:scale-95
              overflow-hidden
            "
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <svg
                className="w-5 h-5 transition-transform duration-300 group-hover:scale-110"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.053 5.56-5.023c.242-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
              </svg>
              {t('writeToTelegram')}
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
