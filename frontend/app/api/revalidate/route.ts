// On-Demand Revalidation endpoint for Strapi webhooks
// This endpoint is called when content is updated in Strapi CMS

import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { locales } from '@/src/i18n/request';

export async function POST(request: NextRequest) {
  // Security: validate authorization token
  const authHeader = request.headers.get('authorization');
  const secret = process.env.REVALIDATION_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    console.error('[Revalidation] ❌ Invalid authorization');
    return NextResponse.json(
      { message: 'Invalid authorization' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { model, event, entry } = body;

    console.log(`[Revalidation] 📥 Received: ${model} ${event}`, entry);

    // Revalidation logic based on content type
    // IMPORTANT: Revalidate for ALL locales since content is localized
    switch (model) {
      case 'product':
        // Revalidate specific product page for all locales
        if (entry?.slug) {
          for (const locale of locales) {
            revalidatePath(`/${locale}/products/${entry.slug}`);
            console.log(`[Revalidation] ✅ Revalidated /${locale}/products/${entry.slug}`);
          }
        }
        // Revalidate products listing page for all locales
        for (const locale of locales) {
          revalidatePath(`/${locale}/products`);
          console.log(`[Revalidation] ✅ Revalidated /${locale}/products`);
        }
        break;

      case 'category':
        if (entry?.slug) {
          for (const locale of locales) {
            revalidatePath(`/${locale}/categories/${entry.slug}`);
            console.log(`[Revalidation] ✅ Revalidated /${locale}/categories/${entry.slug}`);
          }
        }
        for (const locale of locales) {
          revalidatePath(`/${locale}/products`);
          console.log(`[Revalidation] ✅ Revalidated /${locale}/products`);
        }
        break;

      case 'page':
        if (entry?.slug) {
          for (const locale of locales) {
            revalidatePath(`/${locale}/${entry.slug}`);
            console.log(`[Revalidation] ✅ Revalidated /${locale}/${entry.slug}`);
          }
        }
        break;

      case 'blog-post':
        if (entry?.slug) {
          for (const locale of locales) {
            revalidatePath(`/${locale}/blog/${entry.slug}`);
            console.log(`[Revalidation] ✅ Revalidated /${locale}/blog/${entry.slug}`);
          }
        }
        for (const locale of locales) {
          revalidatePath(`/${locale}/blog`);
          console.log(`[Revalidation] ✅ Revalidated /${locale}/blog`);
        }
        break;

      case 'main-page-content':
        // Main page content is shown on the home page
        for (const locale of locales) {
          revalidatePath(`/${locale}`);
          console.log(`[Revalidation] ✅ Revalidated /${locale} (main-page-content)`);
        }
        break;

      default:
        // Revalidate home page for all locales
        for (const locale of locales) {
          revalidatePath(`/${locale}`);
          console.log(`[Revalidation] ✅ Revalidated /${locale} (default fallback)`);
        }
    }

    return NextResponse.json({
      revalidated: true,
      model,
      event,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('[Revalidation] ❌ Error:', error);
    return NextResponse.json(
      { message: 'Error revalidating', error: String(error) },
      { status: 500 }
    );
  }
}
