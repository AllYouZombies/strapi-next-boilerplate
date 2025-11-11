'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { locales, getLocaleName, getLocaleFlag, type Locale } from '@/src/i18n/request';

export default function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === locale) return;

    // Remove the current locale from the pathname
    const pathWithoutLocale = pathname.replace(`/${locale}`, '');

    // Navigate to the new locale
    router.push(`/${newLocale}${pathWithoutLocale || ''}`);
  };

  return (
    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-2">
      <span className="text-sm text-gray-600 dark:text-gray-400 px-2">
        🌐
      </span>
      <div className="flex gap-1">
        {locales.map((loc) => (
          <button
            key={loc}
            onClick={() => handleLocaleChange(loc)}
            className={`
              px-3 py-2 rounded-md text-sm font-medium transition-all
              ${
                locale === loc
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }
            `}
            title={getLocaleName(loc)}
            aria-label={`Switch to ${getLocaleName(loc)}`}
          >
            <span className="mr-1">{getLocaleFlag(loc)}</span>
            {loc.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
