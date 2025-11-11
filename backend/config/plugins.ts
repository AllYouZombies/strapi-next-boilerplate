export default ({ env }) => ({
  // Internationalization (i18n) plugin configuration
  i18n: {
    enabled: true,
    config: {
      // Default locale for content
      defaultLocale: env('DEFAULT_LOCALE', 'ru'),
      // Available locales in the system
      locales: env.array('AVAILABLE_LOCALES', ['ru', 'uz', 'en']),
    },
  },
});
