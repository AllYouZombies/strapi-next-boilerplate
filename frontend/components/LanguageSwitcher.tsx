'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { locales, getLocaleName, getLocaleFlag, type Locale } from '@/src/i18n/request';
import { useState, useEffect, useRef } from 'react';

type LanguageSwitcherProps = {
  isScrolled?: boolean;
};

export default function LanguageSwitcher({ isScrolled = false }: LanguageSwitcherProps) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === locale) {
      setIsOpen(false);
      return;
    }

    // Remove the current locale from the pathname
    const pathWithoutLocale = pathname.replace(`/${locale}`, '');

    // Navigate to the new locale
    router.push(`/${newLocale}${pathWithoutLocale || ''}`);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg shadow-sm px-4 py-2 transition-colors"
        style={{ backgroundColor: '#eeede9' }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e8e7e4'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#eeede9'}
        aria-label="Change language"
      >
        <span className="text-lg">{getLocaleFlag(locale)}</span>
        <span className="text-sm font-medium text-gray-700">
          {locale.toUpperCase()}
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-1 z-50"
          style={{ backgroundColor: '#2e2f33' }}
        >
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => handleLocaleChange(loc)}
              className={`
                w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors
                ${
                  locale === loc
                    ? 'text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }
              `}
            >
              <span className="text-lg">{getLocaleFlag(loc)}</span>
              <span className="font-medium">{getLocaleName(loc)}</span>
              {locale === loc && (
                <svg
                  className="w-4 h-4 ml-auto"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
