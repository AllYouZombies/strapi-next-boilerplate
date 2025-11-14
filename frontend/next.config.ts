import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// Extract hostname from NEXT_PUBLIC_STRAPI_URL for remotePatterns
const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const strapiHostname = new URL(strapiUrl).hostname;
const strapiProtocol = new URL(strapiUrl).protocol.replace(':', '') as 'http' | 'https';

const nextConfig: NextConfig = {
  output: 'standalone', // Required for Docker production builds
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '1337',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'backend',
        port: '1337',
        pathname: '/uploads/**',
      },
      // Production domain from NEXT_PUBLIC_STRAPI_URL
      {
        protocol: strapiProtocol,
        hostname: strapiHostname,
        pathname: '/uploads/**',
      },
      // Explicitly support punycode domain (айда.uz = xn--80aalt.uz)
      {
        protocol: 'https',
        hostname: 'admin.xn--80aalt.uz',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'xn--80aalt.uz',
        pathname: '/uploads/**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
