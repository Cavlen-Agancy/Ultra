<script setup lang="ts">
import {
  Check,
  Copy,
  Download,
  FileText,
  Minus,
  Plus,
  ShoppingCart,
} from 'lucide-vue-next'

const { t, locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const slug = String(route.params.slug)

interface LandingProduct {
  id?: string
  nameAr: string
  nameEn: string
  slug: string
  descriptionAr: string | null
  descriptionEn: string | null
  price: string | number
  compareAtPrice: string | number | null
  category: { slug: string, nameAr: string, nameEn: string }
  images: { path: string, altAr: string | null, altEn: string | null }[]
  attributes: { keyAr: string, keyEn: string, valueAr: string, valueEn: string }[]
  seo: { metaTitleEn: string | null, metaDescriptionEn: string | null } | null
  video?: { id: string, type: string, url: string } | null
  documents?: { id: string, labelAr: string, labelEn: string, filePath: string, fileType: string, sortOrder: number }[]
}

const { data, error } = await useAsyncData(`product-${slug}`, () =>
  $fetch<{ product: LandingProduct }>(`/api/products/${slug}`),
)

if (error.value) {
  throw createError({ statusCode: 404, statusMessage: 'Product not found', fatal: true })
}

const p = computed(() => data.value!.product)
const name = computed(() => (locale.value === 'ar' ? p.value.nameAr : p.value.nameEn))
const desc = computed(() => (locale.value === 'ar' ? p.value.descriptionAr : p.value.descriptionEn))
const cover = computed(() => p.value.images[0]?.path || null)
const activeImage = ref(0)
const copied = ref(false)
const added = ref(false)
const quantity = ref(1)
const runtimeConfig = useRuntimeConfig()
const siteBase = computed(() => (runtimeConfig.public.siteUrl as string) || '')

const pageUrl = computed(() => `${siteBase.value}/p/${p.value.slug}`)

const discountPercent = computed(() => {
  const price = Number(p.value.price)
  const compare = Number(p.value.compareAtPrice)
  if (!compare || !Number.isFinite(price) || !Number.isFinite(compare)) return 0
  if (!(compare > price)) return 0
  return Math.round(((compare - price) / compare) * 100)
})

useHead(() => ({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": name.value,
        "image": p.value.images.map(i => siteBase.value + i.path),
        "description": desc.value || "",
        "sku": p.value.slug,
        "offers": {
          "@type": "Offer",
          "url": siteBase.value + "/p/" + p.value.slug,
          "priceCurrency": "XXX",
          "price": String(p.value.price),
          "availability": "https://schema.org/InStock"
        }
      })
    }
  ]
}))

// NOTE: Title/meta use useHead (not useSeoMeta) — useSeoMeta silently emitted
// no <title>/meta during SSR on this page. Same useHead pattern as products/[slug].vue.
const siteSeo = await useSiteSeo()

useHead(() => {
  const title = name.value ? `${name.value} | ${t('brand.name')}` : t('brand.name')
  // Product-specific data first, site-wide description as fallback.
  const description = desc.value
    || data.value?.product.seo?.metaDescriptionEn
    || (locale.value === 'ar' ? siteSeo.value?.descriptionAr : siteSeo.value?.descriptionEn)
    || undefined
  const image = cover.value || undefined
  return {
    title,
    meta: [
      ...(description ? [{ name: 'description', content: description }] : []),
      { property: 'og:title', content: title },
      ...(description ? [{ property: 'og:description', content: description }] : []),
      ...(image ? [{ property: 'og:image', content: image }] : []),
    ],
  }
})

const cart = useCartStore()
const { money } = useMoney()

function handleAddToCart() {
  cart.addItem({
    productId: p.value.id || p.value.slug,
    slug: p.value.slug,
    nameAr: p.value.nameAr,
    nameEn: p.value.nameEn,
    price: Number(p.value.price),
    coverImage: cover.value,
    quantity: quantity.value,
  })
  added.value = true
  setTimeout(() => {
    added.value = false
  }, 2200)
}

function updateQty(delta: number) {
  quantity.value = Math.max(1, quantity.value + delta)
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(pageUrl.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  }
  catch { /* clipboard unavailable */ }
}

const waHref = computed(() => {
  const msg = `${name.value} - ${pageUrl.value}`
  return `https://wa.me/?text=${encodeURIComponent(msg)}`
})

function getEmbedUrl(url: string, type?: string): string {
  if (!url) return ''
  if (type === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be')) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    if (match && match[2]?.length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`
    }
    return url
  }
  if (type === 'vimeo' || url.includes('vimeo.com')) {
    const regExp = /vimeo\.com\/(\d+)/
    const match = url.match(regExp)
    if (match && match[1]) {
      return `https://player.vimeo.com/video/${match[1]}`
    }
    return url
  }
  return url
}
</script>
<template>
  <div class="bg-white text-black">
    <div class="container-editorial py-6 sm:py-10">
      <nav class="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-black/60" aria-label="Breadcrumb">
        <NuxtLink :to="localePath('/')" class="transition-colors hover:text-black">{{ t('nav.home') }}</NuxtLink>
        <span aria-hidden="true">/</span>
        <NuxtLink :to="localePath('/products')" class="transition-colors hover:text-black">{{ t('products.title') }}</NuxtLink>
        <span aria-hidden="true">/</span>
        <NuxtLink :to="localePath(`/products/${p.category.slug}`)" class="transition-colors hover:text-black">
          {{ locale === 'ar' ? p.category.nameAr : p.category.nameEn }}
        </NuxtLink>
        <span aria-hidden="true">/</span>
        <span class="truncate text-black" aria-current="page">{{ name }}</span>
      </nav>
    </div>

    <div class="container-editorial grid gap-10 pb-16 lg:grid-cols-12 lg:gap-14 lg:pb-24">
      <div class="lg:col-span-7">
        <div class="relative aspect-square overflow-hidden bg-[#F7F7F7]">
          <img
            v-if="p.images[activeImage]"
            :src="p.images[activeImage]!.path"
            :alt="name"
            class="h-full w-full object-contain p-5 sm:p-8"
          />
          <div v-else class="flex h-full w-full items-center justify-center text-sm text-black/30">
            {{ t('common.noImage') }}
          </div>
          <span
            v-if="discountPercent > 0"
            class="absolute start-4 top-4 bg-ultra-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white"
          >
            {{ locale === 'ar' ? `خصم ${discountPercent}%` : `-${discountPercent}%` }}
          </span>
        </div>

        <div v-if="p.images.length > 1" class="mt-3 grid grid-cols-5 gap-2 sm:gap-3">
          <button
            v-for="(img, i) in p.images"
            :key="img.path"
            type="button"
            class="aspect-square overflow-hidden border bg-[#F7F7F7] p-1.5 transition-colors"
            :class="i === activeImage ? 'border-black' : 'border-transparent hover:border-black/25'"
            :aria-label="`${name} ${i + 1}`"
            :aria-current="i === activeImage ? 'true' : undefined"
            @click="activeImage = i"
          >
            <img :src="img.path" :alt="`${name} ${i + 1}`" class="h-full w-full object-contain" loading="lazy" />
          </button>
        </div>

        <div v-if="p.video" class="mt-8">
          <p class="eyebrow">{{ locale === 'ar' ? 'فيديو المنتج' : 'Product video' }}</p>
          <div class="mt-3 aspect-video w-full bg-black">
            <iframe
              v-if="p.video.type === 'youtube' || p.video.type === 'vimeo'"
              :src="getEmbedUrl(p.video.url, p.video.type)"
              class="h-full w-full"
              allowfullscreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
            <video v-else controls :src="p.video.url" class="h-full w-full object-cover" />
          </div>
        </div>
      </div>

      <div class="lg:col-span-5">
        <div class="lg:sticky lg:top-24">
          <NuxtLink :to="localePath(`/products/${p.category.slug}`)" class="eyebrow !text-ultra-600 hover:underline">
            {{ locale === 'ar' ? p.category.nameAr : p.category.nameEn }}
          </NuxtLink>

          <h1 class="mt-3 font-heading text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            {{ name }}
          </h1>

          <div class="mt-5 flex flex-wrap items-baseline gap-3">
            <span class="text-xl font-semibold text-black sm:text-2xl">{{ money(p.price) }}</span>
            <span v-if="p.compareAtPrice" class="text-sm text-black/55 line-through">{{ money(p.compareAtPrice) }}</span>
          </div>

          <div v-if="desc" class="mt-7 border-t border-black/10 pt-6 text-sm leading-7 text-black/65 [&_figure]:my-5 [&_figcaption]:mt-2 [&_figcaption]:text-xs [&_figcaption]:text-black/55 [&_img]:h-auto [&_img]:max-w-full" v-html="desc" />

          <div class="mt-8 border-t border-black/10 pt-6">
            <div class="flex flex-wrap items-center gap-3">
              <div class="flex h-12 items-center border border-black/20">
                <button type="button" class="flex h-11 w-11 items-center justify-center text-black/60 hover:text-black" :aria-label="locale === 'ar' ? 'تقليل الكمية' : 'Decrease quantity'" @click="updateQty(-1)">
                  <Minus class="h-4 w-4" aria-hidden="true" />
                </button>
                <span class="w-9 text-center font-mono text-sm font-semibold text-black">{{ quantity }}</span>
                <button type="button" class="flex h-11 w-11 items-center justify-center text-black/60 hover:text-black" :aria-label="locale === 'ar' ? 'زيادة الكمية' : 'Increase quantity'" @click="updateQty(1)">
                  <Plus class="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <button
                type="button"
                class="inline-flex min-h-12 flex-1 items-center justify-center gap-2 px-6 text-sm font-semibold text-white transition-colors"
                :class="added ? 'bg-black' : 'bg-ultra-500 hover:bg-ultra-600'"
                @click="handleAddToCart"
              >
                <Check v-if="added" class="h-4 w-4" aria-hidden="true" />
                <ShoppingCart v-else class="h-4 w-4" aria-hidden="true" />
                <span>{{ added ? (locale === 'ar' ? 'تمت الإضافة للسلة' : 'Added to cart') : (locale === 'ar' ? 'إضافة إلى السلة' : 'Add to cart') }}</span>
              </button>
            </div>

            <div class="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-black/60">
              <a :href="waHref" target="_blank" rel="noopener" class="transition-colors hover:text-black">{{ locale === 'ar' ? 'مشاركة واتساب' : 'Share on WhatsApp' }}</a>
              <button type="button" class="transition-colors hover:text-black" @click="copyLink">
                {{ copied ? (locale === 'ar' ? 'تم نسخ الرابط' : 'Link copied') : (locale === 'ar' ? 'نسخ الرابط' : 'Copy link') }}
              </button>
            </div>
          </div>

          <div v-if="p.attributes?.length" class="mt-10 border-t border-black/10 pt-6">
            <h2 class="eyebrow">{{ t('products.specs') }}</h2>
            <dl class="mt-4 divide-y divide-black/10">
              <div v-for="a in p.attributes" :key="a.keyEn" class="grid grid-cols-2 gap-4 py-2.5 text-sm">
                <dt class="text-black/60">{{ locale === 'ar' ? a.keyAr : a.keyEn }}</dt>
                <dd class="text-end font-medium text-black">{{ locale === 'ar' ? a.valueAr : a.valueEn }}</dd>
              </div>
            </dl>
          </div>

          <div v-if="p.documents?.length" class="mt-10 border-t border-black/10 pt-6">
            <h2 class="eyebrow">{{ locale === 'ar' ? 'الملفات' : 'Documents' }}</h2>
            <ul class="mt-3 divide-y divide-black/10">
              <li v-for="doc in p.documents" :key="doc.id">
                <a :href="doc.filePath" target="_blank" download class="flex items-center justify-between gap-4 py-3 text-sm text-black/70 transition-colors hover:text-black">
                  <span class="flex min-w-0 items-center gap-2">
                    <FileText class="h-4 w-4 shrink-0 text-black/55" aria-hidden="true" />
                    <span class="truncate">{{ locale === 'ar' ? doc.labelAr : doc.labelEn }}</span>
                  </span>
                  <Download class="h-4 w-4 shrink-0 text-black/35" aria-hidden="true" />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
