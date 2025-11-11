import type { Locale } from '@/src/i18n/request';

/**
 * Format price according to locale
 * @param price - The price to format
 * @param locale - Current locale
 * @returns Formatted price string
 */
export function formatPrice(price: number, locale: Locale): string {
  // Currency mapping by locale
  const currencies: Record<Locale, string> = {
    ru: 'сум',
    uz: 'so\'m',
    en: 'UZS',
  };

  // Format number with spaces as thousands separator
  const formattedNumber = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);

  return `${formattedNumber} ${currencies[locale]}`;
}

/**
 * Format date according to locale
 * @param date - The date to format
 * @param locale - Current locale
 * @param format - Format type ('short', 'medium', 'long')
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string,
  locale: Locale,
  format: 'short' | 'medium' | 'long' = 'medium'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const options: Record<string, Intl.DateTimeFormatOptions> = {
    short: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    },
    medium: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
    long: {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
  };

  return new Intl.DateTimeFormat(locale, options[format]).format(dateObj);
}

/**
 * Get currency symbol for locale
 * @param locale - Current locale
 * @returns Currency symbol
 */
export function getCurrencySymbol(locale: Locale): string {
  const currencies: Record<Locale, string> = {
    ru: 'сум',
    uz: 'so\'m',
    en: 'UZS',
  };

  return currencies[locale];
}

/**
 * Format number according to locale
 * @param num - Number to format
 * @param locale - Current locale
 * @param decimals - Number of decimal places
 * @returns Formatted number string
 */
export function formatNumber(
  num: number,
  locale: Locale,
  decimals: number = 0
): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Get relative time string (e.g., "2 hours ago")
 * @param date - The date to compare
 * @param locale - Current locale
 * @returns Relative time string
 */
export function getRelativeTime(date: Date | string, locale: Locale): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, 'second');
  } else if (diffInSeconds < 3600) {
    return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
  } else if (diffInSeconds < 86400) {
    return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
  } else if (diffInSeconds < 2592000) {
    return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
  } else if (diffInSeconds < 31536000) {
    return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
  } else {
    return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
  }
}
