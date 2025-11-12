'use client';

import { useTranslations } from 'next-intl';

type AboutSectionProps = {
  content?: string;
};

export default function AboutSection({ content }: AboutSectionProps) {
  const t = useTranslations('about');

  // If no content from Strapi, show fallback message
  const displayContent = content || t('noContent');

  return (
    <section className="relative w-full min-h-screen flex items-center justify-center py-20 px-4 bg-white">
      <div className="max-w-5xl w-full">
        {/* Heading */}
        <h2 className="text-5xl md:text-6xl lg:text-7xl font-light text-[#2e2f33] mb-12 text-center font-rubik">
          {t('heading')}
        </h2>

        {/* Content */}
        <div className="prose prose-lg md:prose-xl max-w-none">
          <p className="text-lg md:text-xl lg:text-2xl text-gray-700 font-light leading-relaxed font-rubik whitespace-pre-line">
            {displayContent}
          </p>
        </div>
      </div>
    </section>
  );
}
