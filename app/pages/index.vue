<script setup lang="ts">
import { ArrowRight, Boxes } from 'lucide-vue-next'

const { t, locale } = useI18n()
const localePath = useLocalePath()

const { data: general } = await useAsyncData('home-general', () => $fetch<any>('/api/settings/general'))
const { data: contact } = await useAsyncData('home-contact', () => $fetch<any>('/api/settings/contact'))
const { data: categoryData } = await useAsyncData('home-categories', () => $fetch<{ categories: any[] } | any[]>('/api/categories/featured'))
const { data: productData } = await useAsyncData('home-featured-products', () => $fetch<{ products: any[] }>('/api/products?limit=8'))

const categories = computed(() => {
  if (!categoryData.value) return []
  if (Array.isArray(categoryData.value)) return categoryData.value
  return categoryData.value.categories || []
})

const featuredProducts = computed(() => productData.value?.products || [])

const heroImage = computed(() =>
  general.value?.heroImagePath
  || categories.value.find(c => c.coverImagePath)?.coverImagePath
  || featuredProducts.value.find(p => p.coverImage)?.coverImage
  || null,
)

const heroTagline = computed(() => {
  const configured = locale.value === 'ar' ? general.value?.taglineAr : general.value?.taglineEn
  return configured || (locale.value === 'ar' ? t('brand.shortDesc') : t('brand.tagline'))
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
    <!-- Hero: image-led when real media exists, otherwise a typographic fallback. -->
    <section class="relative overflow-hidden bg-black">
      <img
        v-if="heroImage"
        :src="heroImage"
        alt=""
        class="absolute inset-0 h-full w-full object-cover"
      />
      <div v-if="heroImage" class="absolute inset-0 bg-black/60" aria-hidden="true" />
      <div v-if="heroImage" class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" aria-hidden="true" />

      <div
        class="container-editorial relative flex pt-24"
        :class="heroImage
          ? 'min-h-[62svh] items-end pb-12 sm:min-h-[72svh] sm:pb-16 lg:min-h-[78svh]'
          : 'min-h-[46svh] items-center py-16 sm:min-h-[54svh] sm:py-20'"
      >
        <div :class="heroImage ? 'max-w-3xl text-white' : 'mx-auto max-w-4xl text-center text-white'">
          <p class="eyebrow !text-white/70">{{ heroTagline }}</p>
          <h1 class="mt-4 font-display text-5xl font-bold uppercase leading-[0.95] tracking-[0.06em] sm:text-7xl lg:text-8xl">
            <span class="block">{{ t('home.heroTitleLine1') }}</span>
          </h1>
          <p class="mt-5 text-sm leading-7 text-white/70 sm:text-base" :class="heroImage ? 'max-w-xl' : 'mx-auto max-w-2xl'">
            {{ t('home.heroSubtitle') }}
          </p>

          <div class="mt-8 flex flex-wrap items-center gap-3" :class="heroImage ? '' : 'justify-center'">
            <NuxtLink :to="localePath('/products')" class="btn-primary">
              <span>{{ locale === 'ar' ? 'تسوق الآن' : 'Shop now' }}</span>
              <ArrowRight class="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            </NuxtLink>
            <NuxtLink
              v-if="categories.length"
              :to="`#shop-by-category`"
              class="inline-flex min-h-11 items-center justify-center border border-white/40 px-6 text-sm font-semibold text-white transition-colors hover:border-white hover:bg-white hover:text-black"
            >
              {{ locale === 'ar' ? 'تصفح الفئات' : 'Browse categories' }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Existing admin-managed banners. -->
    <AppHomeBanners placement="below_hero" />

    <!-- Horizontally browsable category highlights. -->
    <section v-if="categories.length" id="shop-by-category" class="border-b border-black/10 py-14 sm:py-20">
      <div class="container-editorial">
        <div class="flex items-end justify-between gap-6">
          <div>
            <p class="eyebrow">{{ locale === 'ar' ? 'اكتشف' : 'Discover' }}</p>
            <h2 class="mt-2 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              {{ locale === 'ar' ? 'تسوق حسب الفئة' : 'Shop by category' }}
            </h2>
          </div>
          <NuxtLink :to="localePath('/products')" class="hidden text-xs font-bold uppercase tracking-[0.14em] text-black link-underline sm:inline-block">
            {{ locale === 'ar' ? 'عرض الكل' : 'View all' }}
          </NuxtLink>
        </div>

        <div class="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <NuxtLink
            v-for="cat in categories"
            :key="cat.id"
            :to="localePath(`/products/${cat.slug}`)"
            class="group w-[72vw] max-w-[320px] shrink-0 snap-start sm:w-[38vw] lg:w-[23%]"
          >
            <div class="relative aspect-[4/5] overflow-hidden bg-[#F7F7F7]">
              <img
                v-if="cat.coverImagePath"
                :src="cat.coverImagePath"
                :alt="locale === 'ar' ? cat.nameAr : cat.nameEn"
                class="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                loading="lazy"
              />
              <div v-else class="flex h-full w-full items-center justify-center">
                <Boxes class="h-8 w-8 text-black/15" aria-hidden="true" />
              </div>
            </div>
            <div class="mt-3 flex items-center justify-between gap-3 border-b border-black/10 pb-3">
              <span class="text-sm font-medium text-black group-hover:text-ultra-600">
                {{ locale === 'ar' ? cat.nameAr : cat.nameEn }}
              </span>
              <ArrowRight class="h-4 w-4 shrink-0 text-black/55 transition-transform group-hover:translate-x-1 group-hover:text-ultra-500 rtl:rotate-180 rtl:group-hover:-translate-x-1" aria-hidden="true" />
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>

    <AppHomeBanners placement="below_categories" />

    <!-- Featured products. -->
    <section class="bg-[#F7F7F7] py-14 sm:py-20">
      <div class="container-editorial">
        <div class="flex items-end justify-between gap-6">
          <div>
            <p class="eyebrow">{{ locale === 'ar' ? 'مختارات' : 'Selected' }}</p>
            <h2 class="mt-2 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              {{ t('home.productsTitle') }}
            </h2>
            <p class="mt-2 max-w-xl text-sm leading-6 text-black/55">{{ t('home.productsSubtitle') }}</p>
          </div>
          <NuxtLink :to="localePath('/products')" class="hidden text-xs font-bold uppercase tracking-[0.14em] text-black link-underline sm:inline-block">
            {{ locale === 'ar' ? 'عرض الكل' : 'View all' }}
          </NuxtLink>
        </div>

        <div v-if="featuredProducts.length" class="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
          <AppProductCard
            v-for="(product, i) in featuredProducts"
            :key="product.id"
            :product="product"
            class="reveal"
            :style="{ '--reveal-delay': `${i * 50}ms` }"
          />
        </div>

        <div v-else class="mt-8 border border-black/10 px-6 py-16 text-center">
          <p class="font-heading text-lg font-medium text-black">{{ locale === 'ar' ? 'لا توجد منتجات بعد' : 'No products yet' }}</p>
          <p class="mt-2 text-sm text-black/55">{{ locale === 'ar' ? 'أضف المنتجات من لوحة الإدارة لتظهر هنا.' : 'Add products in the admin panel to feature them here.' }}</p>
          <NuxtLink :to="localePath('/products')" class="btn-outline mt-6">{{ locale === 'ar' ? 'تصفح المتجر' : 'Browse the store' }}</NuxtLink>
        </div>
      </div>
    </section>

    <!-- Editorial brand note, using existing configured copy only. -->
    <section class="bg-black py-14 text-white sm:py-20">
      <div class="container-editorial grid gap-8 md:grid-cols-12 md:items-end">
        <div class="md:col-span-7">
          <p class="eyebrow !text-white/60">{{ locale === 'ar' ? 'عن Ultra' : 'About Ultra' }}</p>
          <p class="mt-4 max-w-3xl font-heading text-2xl font-medium leading-tight tracking-tight sm:text-4xl">
            {{ t('brand.longDesc') }}
          </p>
        </div>
        <div class="md:col-span-5 md:text-end">
          <NuxtLink :to="localePath('/products')" class="inline-flex min-h-11 items-center justify-center border border-white/30 px-6 text-sm font-semibold text-white transition-colors hover:border-white hover:bg-white hover:text-black">
            {{ locale === 'ar' ? 'استكشف المتجر' : 'Explore the store' }}
            <ArrowRight class="ms-2 h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          </NuxtLink>
        </div>
      </div>
    </section>

    <AppHomeBanners placement="above_footer" />
  </div>
</template>
