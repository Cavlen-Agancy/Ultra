<script setup lang="ts">
import {
  ArrowRight,
  Boxes,
} from 'lucide-vue-next'

const { t, locale } = useI18n()
const localePath = useLocalePath()

const { data: general } = await useAsyncData('home-general', () => $fetch<any>('/api/settings/general'))
const { data: contact } = await useAsyncData('home-contact', () => $fetch<any>('/api/settings/contact'))
const { data: categoryData } = await useAsyncData('home-categories', () => $fetch<{ categories: any[] } | any[]>('/api/categories/featured'))
const { data: productData } = await useAsyncData('home-featured-products', () => $fetch<{ products: any[] }>('/api/products?limit=5'))

const categories = computed(() => {
  if (!categoryData.value) return []
  if (Array.isArray(categoryData.value)) return categoryData.value
  return categoryData.value.categories || []
})

const featuredProducts = computed(() => {
  return productData.value?.products || []
})

const siteSeo = await useSiteSeo()
const runtimeConfig = useRuntimeConfig()

useHead(() => {
  const siteName = general.value ? (general.value.siteNameEn || general.value.siteNameAr) : t('brand.name')
  const tagline = (locale.value === 'ar' ? general.value?.taglineAr : general.value?.taglineEn) || (locale.value === 'ar' ? t('brand.shortDesc') : t('brand.tagline'))
  const geoDescription = (siteSeo.value?.geoDescription || '').trim()
  const brandDescription = geoDescription || t('brand.longDesc')
  const siteUrl = (runtimeConfig.public.siteUrl as string) || ''
  return {
    title: `${siteName}${tagline ? ` - ${tagline}` : ''}`,
    script: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Store",
          "name": siteName,
          ...(siteUrl ? { "url": siteUrl } : {}),
          "logo": general.value?.logoPath || "",
          ...(brandDescription ? { description: brandDescription } : {}),
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": contact.value?.contactPhone1 || "",
            "contactType": "customer service"
          }
        })
      }
    ]
  }
})

// Transparent navbar overlays the hero: pull the hero up under the header
// stack (announcement + navbar + ticker, all measured live so dismissing the
// ticker, font zoom, or locale changes stay correct) and compensate with
// inner top padding so content never hides. Vertical-only math: RTL/LTR safe.
const heroSection = ref<HTMLElement | null>(null)
const heroContent = ref<HTMLElement | null>(null)

function layoutHero() {
  if (!heroSection.value || !heroContent.value) return
  const q = (sel: string) => document.querySelector(sel) as HTMLElement | null
  const h = (el: HTMLElement | null) => {
    if (!el || getComputedStyle(el).display === 'none') return 0
    return el.offsetHeight || 0
  }
  const offset = h(q('[data-site-announce]')) + h(q('[data-site-header]')) + h(q('[data-site-ticker]'))
  heroSection.value.style.marginTop = offset ? `${-offset}px` : ''
  heroContent.value.style.paddingTop = offset ? `${offset}px` : ''
}

onMounted(() => {
  layoutHero()
  window.addEventListener('resize', layoutHero, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', layoutHero)
})

// Re-measure when the locale changes (ticker/announcement copy may wrap)
// or when the ticker is dismissed (shared state with AppTicker).
watch(locale, () => nextTick(() => layoutHero()))
try {
  watch(() => useState('ticker-dismissed').value, () => nextTick(() => layoutHero()))
}
catch { /* state not registered yet — mount layout already ran */ }
</script>

<template>
  <div class="space-y-0 selection:bg-accent selection:text-on-accent">

    <!-- 1. Hero: full-bleed image (or neutral fallback), display title -->
    <section
      ref="heroSection"
      class="relative flex min-h-[50svh] sm:min-h-[calc(100svh-4rem)] flex-col items-center justify-center overflow-hidden bg-[#111111] bg-cover bg-center px-4 pt-12 pb-20 text-center sm:pt-20 sm:pb-32"
      :style="general?.heroImagePath ? `background-image: url('${general.heroImagePath}')` : ''"
    >
      <!-- Neutral no-photo fallback. A real Ultra hero image can be uploaded later. -->
      <div
        v-if="!general?.heroImagePath"
        class="absolute inset-0"
        aria-hidden="true"
      >
        <div
          class="absolute inset-0"
          style="background: radial-gradient(ellipse 50% 40% at 85% 8%, rgb(115 115 115 / 0.18), transparent 70%)"
        />
      </div>

      <!-- Readability scrim: طبقة تعتيم فوق الصورة لتوضيح النص -->
      <div
        class="absolute inset-0"
        style="background: linear-gradient(to bottom, rgb(0 0 0 / 0.48), rgb(0 0 0 / 0.42) 45%, rgb(0 0 0 / 0.65))"
      />
      <div
        class="absolute inset-0"
        style="background: radial-gradient(ellipse 70% 60% at 50% 50%, rgb(0 0 0 / 0.32), transparent 70%)"
      />

      <div ref="heroContent" class="relative z-10 mx-auto my-auto flex w-full max-w-5xl flex-col items-center justify-center text-center">
        <!-- Headline in the display typeface -->
        <h1 class="hero-anim font-display text-4xl sm:text-6xl text-white leading-[1.15] mb-2 sm:mb-3 drop-shadow-[0_2px_12px_rgb(0_0_0/0.7)]" style="animation-delay: 100ms">
          <span class="block">{{ t('home.heroTitleLine1') }}</span>
          <span class="block text-gold-300 text-xl sm:text-3xl">{{ t('home.heroTitleLine2') }}</span>
        </h1>

        <!-- Subheadline -->
        <p class="hero-anim text-sm text-white/90 sm:text-lg max-w-2xl mx-auto leading-relaxed drop-shadow-[0_1px_8px_rgb(0_0_0/0.8)]" style="animation-delay: 200ms">
          {{ t('home.heroSubtitle') }}
        </p>
      </div>

      <!-- Curved bottom edge with a gold diamond at its center -->
      <div class="absolute bottom-0 start-0 end-0" aria-hidden="true">
        <svg class="block h-[64px] w-full sm:h-[96px]" viewBox="0 0 1440 96" preserveAspectRatio="none">
          <path class="fill-bg" d="M0,96 L0,56 C360,8 1080,8 1440,56 L1440,96 Z" />
        </svg>
        <span class="absolute start-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/4 rotate-45 bg-gold-500 shadow-gold rtl:translate-x-1/2" />
      </div>
    </section>

    <!-- Dynamic promo banners: below_hero slot (managed in /admin/banners) -->
    <AppHomeBanners placement="below_hero" />

    <!-- 3. Featured collections -->
    <section class="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-bg">
      <div class="mx-auto max-w-7xl">
        <!-- Mobile: 2-col grid · sm+: 3-col grid -->
        <div
          v-if="categories?.length"
          class="reveal grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:gap-6"
        >
          <NuxtLink
            v-for="(cat, i) in categories"
            :key="cat.id"
            :to="localePath(`/products/${cat.slug}`)"
            class="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-border bg-ink-950 shadow-sm transition-all duration-300 hover:shadow-gold"
            :style="{ '--reveal-delay': `${i * 70}ms` }"
          >
            <img
              v-if="cat.coverImagePath"
              :src="cat.coverImagePath"
              :alt="locale === 'ar' ? cat.nameAr : cat.nameEn"
              class="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              loading="lazy"
            />
            <div
              v-else
              class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-ink-800 via-ink-900 to-ink-950"
            >
              <Boxes class="h-10 w-10 text-gold-500/50" aria-hidden="true" />
            </div>

            <div class="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/45 to-transparent" />

            <div class="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1.5 sm:gap-2.5 p-3 sm:p-5 text-center">
              <h3 class="font-display text-lg sm:text-2xl text-white leading-snug">
                {{ locale === 'ar' ? cat.nameAr : cat.nameEn }}
                <span v-if="cat.isVip" class="ms-2 inline-block rounded bg-accent/20 px-2 py-0.5 align-middle text-[12px] font-bold text-accent">VIP</span>
              </h3>
              <span class="inline-flex h-8 sm:h-9 items-center rounded-full bg-gold-gradient px-4 sm:px-5 text-[11px] sm:text-xs font-bold text-[#111111] shadow-gold transition-transform group-hover:scale-105">
                {{ t('home.viewCollection') }}
              </span>
            </div>
          </NuxtLink>
        </div>

        <div class="mt-8 text-center">
          <NuxtLink
            :to="localePath('/products')"
            class="inline-flex h-11 items-center gap-2 rounded-full border border-primary px-7 text-sm font-bold text-primary transition-all hover:bg-primary hover:text-on-primary active:scale-[0.98]"
          >
            <span>{{ t('home.allCategories') }}</span>
            <ArrowRight class="h-4 w-4 rtl:rotate-180" />
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Dynamic promo banners: below_categories slot (managed in /admin/banners) -->
    <AppHomeBanners placement="below_categories" />

    <!-- 4. New arrivals -->
    <section v-if="featuredProducts.length" class="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-surface border-y border-border">
      <div class="mx-auto max-w-7xl">
        <div class="reveal mb-8 text-center max-w-2xl mx-auto">
          <h2 class="font-display text-3xl sm:text-4xl text-text mb-2">
            {{ t('home.productsTitle') }}
          </h2>
          <p class="text-sm text-muted leading-relaxed">
            {{ t('home.productsSubtitle') }}
          </p>
        </div>

        <AppSectionDivider class="reveal mb-8" />

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          <AppProductCard
            v-for="(product, i) in featuredProducts"
            :key="product.id"
            :product="product"
            class="reveal"
            :style="{ '--reveal-delay': `${i * 70}ms` }"
          />
        </div>
      </div>
    </section>

    <!-- Dynamic promo banners: above_footer slot (managed in /admin/banners) -->
    <AppHomeBanners placement="above_footer" />

  </div>
</template>
