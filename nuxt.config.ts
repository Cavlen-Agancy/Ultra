// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  vite: {
    server: {
      // Allow Cloudflare Quick Tunnel hostnames in dev (public demo URLs).
      // Vite blocks unknown Host headers by default; this wildcard covers
      // all *.trycloudflare.com tunnels. Dev-server only.
      allowedHosts: ['.trycloudflare.com'],
    },
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    // Server-only. Min 32 chars; enforced in server/utils/auth.ts.
    sessionPassword: '',
    public: {
      // Firebase web config (public keys only). Overridden by
      // NUXT_PUBLIC_FIREBASE_* env vars. Empty = push disabled (graceful).
      firebaseApiKey: '',
      firebaseAuthDomain: '',
      firebaseMessagingSenderId: '',
      firebaseAppId: '',
      firebaseVapidKey: '',
      // Canonical public site URL (e.g. https://ultra.example.com).
      // Used for Meta domain verification display + CAPI event_source_url.
      siteUrl: '',
    },
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@nuxtjs/i18n',
    '@pinia/nuxt',
    '@pinia-plugin-persistedstate/nuxt',
  ],

  colorMode: {
    classSuffix: '',
    // الدليل: الفاتح 60% → الافتراضي light، والداكن متاح بالتبديل.
    preference: 'light',
    fallback: 'light',
    storageKey: 'ultra-color-mode',
  },

  i18n: {
    vueI18n: './i18n.config.ts',
    locales: [
      { code: 'ar', language: 'ar-SA', name: 'العربية', dir: 'rtl' },
      { code: 'en', language: 'en-US', name: 'English', dir: 'ltr' },
    ],
    defaultLocale: 'ar',
    strategy: 'prefix_except_default',
    // The storefront always opens in Arabic; no automatic browser-language redirect.
    detectBrowserLanguage: false,
  },
})
