import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

// Available locales in the application
export const locales = ['ru', 'uz', 'en'] as const;
export type Locale = (typeof locales)[number];

// Default locale
export const defaultLocale: Locale = 'ru';

// Validate if a locale is supported
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

// Get locale display names
export function getLocaleName(locale: Locale): string {
  const names: Record<Locale, string> = {
    ru: 'Русский',
    uz: 'O\'zbek',
    en: 'English',
  };
  return names[locale];
}

// Get locale flag emoji
export function getLocaleFlag(locale: Locale): string {
  const flags: Record<Locale, string> = {
    ru: '🇷🇺',
    uz: '🇺🇿',
    en: '🇬🇧',
  };
  return flags[locale];
}

// next-intl configuration
export default getRequestConfig(async ({ requestLocale }) => {
  // Get the locale from the request
  let locale = await requestLocale;

  // Validate that the incoming `locale` parameter is valid
  if (!locale || !isValidLocale(locale)) {
    notFound();
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
