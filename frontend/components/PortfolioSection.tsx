'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

type PortfolioItem = {
  id: number;
  documentId: string;
  image: {
    url: string;
    alternativeText?: string;
    width: number;
    height: number;
  };
};

type PortfolioSectionProps = {
  items?: PortfolioItem[];
};

export default function PortfolioSection({ items }: PortfolioSectionProps) {
  const t = useTranslations('portfolio');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  if (!items || items.length === 0) {
    return null;
  }

  // Duplicate items for infinite scroll effect
  const duplicatedItems = [...items, ...items, ...items];

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationFrameId: number;
    let scrollSpeed = 0.5; // pixels per frame

    const scroll = () => {
      if (!isPaused && scrollContainer) {
        scrollContainer.scrollLeft += scrollSpeed;

        // Reset to middle section when reaching the end
        const maxScroll = scrollContainer.scrollWidth / 3;
        if (scrollContainer.scrollLeft >= maxScroll * 2) {
          scrollContainer.scrollLeft = maxScroll;
        }
      }
      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused]);

  // Start scrolling from middle section
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const scrollToMiddle = () => {
      const sectionWidth = scrollContainer.scrollWidth / 3;
      scrollContainer.scrollLeft = sectionWidth;
    };

    scrollToMiddle();
  }, []);

  return (
    <section className="relative w-full bg-white py-20">
      <div className="w-full">
        {/* Heading */}
        <h2 className="text-5xl md:text-6xl lg:text-7xl font-light text-[#2e2f33] mb-16 text-center font-rubik px-4">
          {t('heading')}
        </h2>

        {/* Infinite Horizontal Scroll Container */}
        <div
          ref={scrollRef}
          className="relative w-full overflow-x-auto overflow-y-hidden scrollbar-hide"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          <div className="flex gap-8 px-4 pb-8">
            {duplicatedItems.map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className="group relative flex-shrink-0 overflow-hidden rounded-3xl bg-gray-100 shadow-xl hover:shadow-2xl transition-all duration-500"
                style={{ width: 'min(90vw, 1200px)', height: 'min(60vh, 675px)' }}
              >
                <Image
                  src={item.image.url}
                  alt={item.image.alternativeText || 'Portfolio image'}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="min(90vw, 1200px)"
                  priority={index < 3}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Hint */}
        <div className="flex justify-center mt-8 gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="w-2 h-2 rounded-full bg-gray-300"
            />
          ))}
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}
