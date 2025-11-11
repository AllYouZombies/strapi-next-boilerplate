import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ locale: string }>;
};

// Generate metadata with translations
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const tNav = await getTranslations({ locale, namespace: 'nav' });

  // Example: fetch products from Strapi with locale parameter
  async function getProducts() {
    try {
      const strapiUrl = process.env.STRAPI_URL || 'http://backend:1337';
      const res = await fetch(
        `${strapiUrl}/api/products?locale=${locale}&populate=*`,
        {
          cache: 'force-cache',
        }
      );

      if (!res.ok) return null;
      return res.json();
    } catch (error) {
      console.error('Failed to fetch products:', error);
      return null;
    }
  }

  const products = await getProducts();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
              {t('title')}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              {t('subtitle')}
            </p>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Current locale: <span className="font-semibold">{locale}</span>
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                Next.js Frontend
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Next.js 16 with App Router</li>
                <li>• TypeScript</li>
                <li>• Tailwind CSS</li>
                <li>• next-intl i18n</li>
                <li>• Hot-reload enabled</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                Strapi Backend
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Strapi 5 CMS</li>
                <li>• PostgreSQL 18</li>
                <li>• i18n plugin enabled</li>
                <li>• Admin at /admin</li>
                <li>• API at /api</li>
              </ul>
            </div>
          </div>

          {/* Products Example */}
          {products && products.data && products.data.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
                {tNav('products')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {tCommon('inStock')}: {products.data.length}
              </p>
              <div className="grid gap-4">
                {products.data.slice(0, 3).map((product: any) => (
                  <div
                    key={product.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {product.name || product.attributes?.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {product.description || product.attributes?.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div className="mt-8 text-center">
            <div className="flex gap-4 justify-center flex-wrap">
              <a
                href="http://localhost:1337/admin"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Open Strapi Admin
              </a>
              <a
                href={`/${locale}/${tNav('products').toLowerCase()}`}
                className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                {tNav('products')}
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
