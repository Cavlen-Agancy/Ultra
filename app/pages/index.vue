<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'

const { t, locale } = useI18n()
const localePath = useLocalePath()

const { data: general } = await useAsyncData('home-general', () => $fetch<any>('/api/settings/general'))
const { data: contact } = await useAsyncData('home-contact', () => $fetch<any>('/api/settings/contact'))
const { data: categoryData } = await useAsyncData('home-categories', () => $fetch<{ categories: any[] } | any[]>('/api/categories/featured'))
const { data: productData } = await useAsyncData('home-featured-products', () => $fetch<{ products: any[] }>('/api/products?limit=12'))

const categories = computed(() => {
  if (!categoryData.value) return []
  if (Array.isArray(categoryData.value)) return categoryData.value
  return categoryData.value.categories || []
})

const products = computed(() => productData.value?.products || [])

const fallbackHeroMedia = computed(() => {
  const images: string[] = []
  for (const category of categories.value) {
    if (category.coverImagePath) images.push(category.coverImagePath)
  }
  for (const product of products.value) {
    if (product.coverImage) images.push(product.coverImage)
  }
  return images
})

const configuredHeroMedia = computed(() => {
  const images = general.value?.heroImagePaths
  if (Array.isArray(images) && images.length) return images.filter(Boolean) as string[]
  // Older cached settings payloads may only include the original single field.
  return general.value?.heroImagePath ? [general.value.heroImagePath as string] : []
})

const heroMedia = computed(() => (
  configuredHeroMedia.value.length
    ? configuredHeroMedia.value
    // No hero slots configured: keep the previous safe fallback imagery from
    // category/product covers, capped at the three-slide hero length.
    : fallbackHeroMedia.value.slice(0, 3)
))

const brandPrimaryImage = computed(() => configuredHeroMedia.value[0] || null)

const headingLines = computed(() => [
  t('brand.name'),
  locale.value === 'ar' ? 'ترقية' : 'Upgrade',
  locale.value === 'ar' ? 'طريقة الاتصال' : 'The way you connect',
])

const heroSubtitle = computed(() => (
  locale.value === 'ar'
    ? 'جودة عالية، توصيل سريع، وطريقة شراء بسيطة.'
    : 'Great quality, fast delivery, and a calm checkout.'
))

const heroCtaLabel = computed(() => (locale.value === 'ar' ? 'تسوق الهواتف' : 'Shop phones'))

const featuredCategories = computed(() => (
  categories.value.filter(category => category.featuredOnHomepage === true)
))

const quickLinks = computed(() => featuredCategories.value.map(category => ({
  label: locale.value === 'ar' ? category.nameAr : category.nameEn,
  href: localePath(`/products/${category.slug}`),
  image: category.coverImagePath || null,
  badge: category.featuredOnHomepage ? (locale.value === 'ar' ? 'جديد' : 'New') : undefined,
})).slice(0, 8))

const statements = computed(() => [
  {
    heading: locale.value === 'ar' ? 'المنتجات أولاً' : 'Product first',
    sentence: locale.value === 'ar'
      ? 'منتجات واضحة وسهلة التصفح في متجر واحد.'
      : 'Phones, cases and chargers are easy to browse and easy to buy.',
  },
  {
    heading: locale.value === 'ar' ? 'مهمة المتجر' : 'Built to last',
    sentence: locale.value === 'ar'
      ? 'التصنيف والفلاتر والمواصفات تظل واضحة وسريعة.'
      : 'Pagination, filters and product details stay quick and clear.',
  },
  {
    heading: locale.value === 'ar' ? 'منتجات موثوقة' : 'Product-first',
    sentence: locale.value === 'ar'
      ? 'استخدم الموقع لتصميم المتجر بشكل أفضل.'
      : 'The experience feels helpful from first click to checkout.',
  },
])

const siteSeo = await useSiteSeo()
const runtimeConfig = useRuntimeConfig()

useHead(() => {
  const siteName = general.value
    ? (general.value.siteNameEn || general.value.siteNameAr)
    : t('brand.name')
  const tagline = (locale.value === 'ar' ? general.value?.taglineAr : general.value?.taglineEn)
    || (locale.value === 'ar' ? t('brand.shortDesc') : t('brand.tagline'))
  const geoDescription = (siteSeo.value?.geoDescription || '').trim()
  const brandDescription = geoDescription || t('brand.longDesc')
  const siteUrl = (runtimeConfig.public.siteUrl as string) || ''

  return {
    title: `${siteName}${tagline ? ` - ${tagline}` : ''}`,
    script: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Store',
          name: siteName,
          ...(siteUrl ? { url: siteUrl } : {}),
          'logo': general.value?.logoPath || '',
          ...(brandDescription ? { description: brandDescription } : {}),
          'contactPoint': {
            '@type': 'ContactPoint',
            telephone: contact.value?.contactPhone1 || '',
            contactType: 'customer service',
          },
        }),
      },
    ],
  }
})
</script>

<template>
  <div class="bg-white text-black">
    <AppHeroSplitSlider
      :media="heroMedia"
      :heading-lines="headingLines"
      :subtitle="heroSubtitle"
      :cta-label="heroCtaLabel"
      cta-href="/products"
    />

    <AppQuickLinksRow
      v-if="quickLinks.length"
      class="relative my-8"
      :items="quickLinks"
    />

    <AppTaglineSection
      class="mt-12"
      :heading="t('brand.name')"
      :paragraph="locale === 'ar'
        ? 'نصمم المتجر خارج صفحات المنتج، طالما التجربة تظل سهلة للمستخدم.'
        : 'We are committed to keeping you connected with confidence. Whatever you need, we gear you up for it.'"
    />

    <section class="py-14 sm:py-20">
      <div class="container-editorial">
        <AppPortraitCategoryCarousel
          :items="categories.slice(0, 4)"
          :title="locale === 'ar' ? 'تسوق جميع الفئات' : 'Shop all collections'"
          :subtitle="locale === 'ar' ? 'اختر الفئة التي تريدها.' : 'Find a collection by section.'"
        />
      </div>
    </section>

    <section class="relative py-14 sm:py-20">
      <div class="container-editorial">
        <AppProductTabs
          :products="products"
          :pending="false"
          :bestsellers-label="locale === 'ar' ? 'الأكثر مبيعاً' : 'Bestsellers'"
          :new-releases-label="locale === 'ar' ? 'وصل حديثاً' : 'New Releases'"
          :value-sets-label="locale === 'ar' ? 'مجموعة أحادية' : 'Value Sets'"
        />
      </div>
    </section>

    <section class="relative py-14 sm:py-20">
      <div class="container-editorial">
        <AppBrandStory
          :paragraph="t('brand.longDesc')"
          :link-label="locale === 'ar' ? 'تصفح المتجر' : 'Read about us'"
          href="/products"
          :primary-image="brandPrimaryImage"
          :secondary-image="categories.find(c => c.coverImagePath)?.coverImagePath || null"
        />
      </div>
    </section>

    <AppStatementBanner
      class="relative"
      :statements="statements"
    />

    <AppVideoCardsRow
      v-if="false"
      :items="[
        { id: 'video-1', src: null, poster: null, title: 'Video section placeholder' },
        { id: 'video-2', src: null, poster: null, title: 'Video section placeholder' },
      ]"
    />

    <AppHomeBanners placement="below_hero" />
  </div>
</template>

