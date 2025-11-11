// Strapi lifecycle hooks for Next.js On-Demand Revalidation

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }) {
    // Register webhook for Next.js revalidation
    const nextjsUrl = process.env.NEXTJS_URL;
    const revalidationSecret = process.env.REVALIDATION_SECRET;
    const enableWebhooks = process.env.ENABLE_WEBHOOKS === 'true';

    if (!enableWebhooks) {
      console.log('[Webhooks] 🔕 Disabled (ENABLE_WEBHOOKS is not true)');
      return;
    }

    if (!nextjsUrl || !revalidationSecret) {
      console.warn('[Webhooks] ⚠️  NEXTJS_URL or REVALIDATION_SECRET not set, skipping webhook registration');
      return;
    }

    console.log('[Webhooks] ✅ Registering Next.js revalidation webhooks');
    console.log(`[Webhooks] 🎯 Target: ${nextjsUrl}/api/revalidate`);

    // Subscribe to lifecycle events for all content types
    // Add your content types here as you create them
    const contentTypes = ['product', 'category', 'page', 'blog-post'];

    contentTypes.forEach((contentType) => {
      const modelName = `api::${contentType}.${contentType}`;

      strapi.db.lifecycles.subscribe({
        models: [modelName],

        async afterCreate(event) {
          await triggerRevalidation(event, 'create', contentType);
        },

        async afterUpdate(event) {
          await triggerRevalidation(event, 'update', contentType);
        },

        async afterDelete(event) {
          await triggerRevalidation(event, 'delete', contentType);
        },
      });

      console.log(`[Webhooks] 📝 Subscribed to ${contentType} lifecycle events`);
    });

    async function triggerRevalidation(event, eventType, contentType) {
      try {
        const entry = event.result || event.params?.data;

        const payload = {
          model: contentType,
          event: eventType,
          entry: {
            id: entry?.id,
            slug: entry?.slug,
            documentId: entry?.documentId, // Strapi 5
          },
        };

        console.log(`[Webhooks] 🔄 Triggering revalidation for ${contentType} ${eventType}`, {
          id: payload.entry.id,
          slug: payload.entry.slug,
        });

        const response = await fetch(`${nextjsUrl}/api/revalidate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${revalidationSecret}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `[Webhooks] ❌ Revalidation failed: ${response.status} ${response.statusText}`,
            errorText
          );
        } else {
          const result = await response.json();
          console.log(
            `[Webhooks] ✅ Revalidated Next.js for ${contentType} ${eventType}`,
            result
          );
        }
      } catch (error) {
        console.error('[Webhooks] ❌ Error triggering revalidation:', error);
      }
    }
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap(/* { strapi } */) {},
};
