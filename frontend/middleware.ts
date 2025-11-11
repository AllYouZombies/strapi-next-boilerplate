import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './src/i18n/request';

export default createMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale,

  // Always show locale prefix in URL (e.g., /ru, /uz, /en)
  localePrefix: 'always',
});

export const config = {
  // Match all pathnames except for:
  // - API routes (/api/*)
  // - Next.js internals (_next/*)
  // - Static files (*.*)
  // - Favicon and other public files
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
