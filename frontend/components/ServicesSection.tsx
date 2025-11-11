'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';

type Service = {
  id: number;
  title: string;
  description: string;
  icon: string;
};

export default function ServicesSection() {
  const t = useTranslations('services');
  const [activeIndex, setActiveIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const services: Service[] = [
    {
      id: 1,
      title: t('website.title'),
      description: t('website.description'),
      icon: '🌐',
    },
    {
      id: 2,
      title: t('ecommerce.title'),
      description: t('ecommerce.description'),
      icon: '🛒',
    },
    {
      id: 3,
      title: t('webapp.title'),
      description: t('webapp.description'),
      icon: '⚡',
    },
  ];

  // Start auto-rotation timer
  const startTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % services.length);
    }, 4000);
  }, [services.length]);

  // Auto-rotate services every 4 seconds
  useEffect(() => {
    startTimer();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [startTimer]);

  // Handle manual service selection
  const handleServiceClick = (index: number) => {
    setActiveIndex(index);
    startTimer(); // Reset timer on manual selection
  };

  return (
    <section className="relative w-full min-h-screen flex items-center justify-center py-20 px-4 bg-[#2e2f33]">
      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
        {/* Left: Title and Description */}
        <div className="lg:col-span-4 flex flex-col justify-center">
          <h2 className="text-4xl md:text-5xl font-light text-white mb-4 font-rubik">
            {t('heading')}
          </h2>
          <p className="text-lg text-gray-300 font-light font-rubik">
            {t('subheading')}
          </p>
        </div>

        {/* Center & Right: Services List with Illustrations */}
        <div className="lg:col-span-8 flex items-center gap-8">
          {/* Services List */}
          <div className="flex-1 space-y-1">
            {services.map((service, index) => (
              <div
                key={service.id}
                onClick={() => handleServiceClick(index)}
                className={`
                  flex items-start gap-6 p-6 rounded-2xl cursor-pointer
                  transition-all duration-500 ease-out
                  ${
                    index === activeIndex
                      ? 'opacity-100 scale-100'
                      : 'opacity-30 scale-95'
                  }
                  hover:opacity-100 hover:scale-100
                `}
              >
                {/* Number */}
                <div
                  className={`
                    flex-shrink-0 w-12 h-12 rounded-full
                    flex items-center justify-center
                    text-2xl font-light transition-all duration-500
                    ${
                      index === activeIndex
                        ? 'bg-white text-[#2e2f33]'
                        : 'bg-gray-700 text-gray-500'
                    }
                  `}
                >
                  {service.id}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3
                    className={`
                      text-2xl font-light mb-2 font-rubik
                      transition-colors duration-500
                      ${
                        index === activeIndex
                          ? 'text-white'
                          : 'text-gray-500'
                      }
                    `}
                  >
                    {service.title}
                  </h3>
                  {/* Fixed height container for description */}
                  <div className="h-16 relative overflow-hidden">
                    <p
                      className={`
                        text-base font-light font-rubik
                        transition-opacity duration-500
                        absolute inset-0
                        ${
                          index === activeIndex
                            ? 'text-gray-300 opacity-100'
                            : 'text-gray-600 opacity-0'
                        }
                      `}
                    >
                      {service.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Illustration */}
          <div className="hidden lg:flex flex-shrink-0 w-64 h-64 items-center justify-center">
            <div className="relative w-full h-full">
              {services.map((service, index) => (
                <div
                  key={service.id}
                  className={`
                    absolute inset-0 flex items-center justify-center
                    transition-all duration-700 ease-in-out
                    ${
                      index === activeIndex
                        ? 'opacity-100 scale-100 rotate-0'
                        : 'opacity-0 scale-90 rotate-12'
                    }
                  `}
                >
                  <div className="text-9xl filter drop-shadow-2xl">
                    {service.icon}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {services.map((_, index) => (
          <button
            key={index}
            onClick={() => handleServiceClick(index)}
            className={`
              h-1 rounded-full transition-all duration-500
              ${
                index === activeIndex
                  ? 'w-12 bg-white'
                  : 'w-8 bg-gray-600'
              }
            `}
            aria-label={`Go to service ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
