<script setup lang="ts">
const { locale } = useI18n()
const route = useRoute()
const colorMode = useColorMode()

// Allow previewing light/dark mode via ?theme=light / ?theme=dark
watch(
  () => route.query.theme,
  (t) => {
    if (t === 'light' || t === 'dark') colorMode.preference = t
  },
  { immediate: true },
)

// Dedicated key (same cached endpoint as the navbar) so the uploaded admin
// favicon is reflected in the browser tab icon. Falls back to bundled icon.
const { data: brandSettings } = await useAsyncData('app-brand-settings', () =>
  $fetch<any>('/api/settings/general'),
  { server: true, lazy: true },
)
const faviconHref = computed(() => brandSettings.value?.faviconPath || null)
const siteName = computed(() => brandSettings.value?.siteNameEn || 'Ultra')

// hreflang alternates (ar default unprefixed, en under /en).
const i18nHead = useLocaleHead({ addSeoAttributes: true })

useHead(() => ({
  htmlAttrs: {
    lang: locale.value,
    dir: locale.value === 'ar' ? 'rtl' : 'ltr',
  },
  link: [
    ...(faviconHref.value ? [{ rel: 'icon', type: 'image/png', sizes: '32x32', href: faviconHref.value }] : []),
    ...(i18nHead.value.link || []),
  ],
  meta: [
    { name: 'theme-color', media: '(prefers-color-scheme: dark)', content: '#111111' },
    { name: 'theme-color', media: '(prefers-color-scheme: light)', content: '#F5F5F5' },
    { property: 'og:site_name', content: siteName.value },
    ...(i18nHead.value.meta || []),
  ],
}))
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
