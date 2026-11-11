<script setup lang="ts">
const { t, locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const slug = String(route.params.slug)

const { data, error } = await useAsyncData(`category-${slug}`, () =>
  $fetch<{ category: {
    nameAr: string, nameEn: string, slug: string,
    descriptionAr: string | null, descriptionEn: string | null,
    coverImagePath: string | null, coverVideoUrl: string | null
  } }>(`/api/categories/${slug}`),
)

if (error.value) {
  throw createError({ statusCode: 404, statusMessage: 'Category not found', fatal: true })
}

const name = computed(() => (locale.value === 'ar' ? data.value?.category.nameAr : data.value?.category.nameEn))
const desc = computed(() => (locale.value === 'ar' ? data.value?.category.descriptionAr : data.value?.category.descriptionEn))

useHead(() => ({
  title: `${name.value} | ${t('brand.name')}`,
  meta: desc.value ? [{ name: 'description', content: desc.value }] : [],
}))
</script>

<template>
  <div class="bg-white text-black">
    <header v-if="data?.category.coverImagePath" class="relative overflow-hidden bg-black">
      <img :src="data.category.coverImagePath" :alt="name" class="absolute inset-0 h-full w-full object-cover" />
      <div class="absolute inset-0 bg-black/55" aria-hidden="true" />
      <div class="container-editorial relative flex min-h-[44svh] items-end pb-10 pt-24 sm:min-h-[52svh] sm:pb-14">
        <div class="max-w-3xl text-white">
          <nav class="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-white/70" aria-label="Breadcrumb">
            <NuxtLink :to="localePath('/')" class="transition-colors hover:text-white">{{ t('nav.home') }}</NuxtLink>
            <span aria-hidden="true">/</span>
            <NuxtLink :to="localePath('/products')" class="transition-colors hover:text-white">{{ t('products.title') }}</NuxtLink>
            <span aria-hidden="true">/</span>
            <span class="text-white" aria-current="page">{{ name }}</span>
          </nav>
          <p class="eyebrow mt-8 !text-white/70">{{ locale === 'ar' ? 'مجموعة' : 'Collection' }}</p>
          <h1 class="mt-3 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">{{ name }}</h1>
          <p v-if="desc" class="mt-4 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">{{ desc }}</p>
        </div>
      </div>
    </header>

    <header v-else class="border-b border-black/10">
      <div class="container-editorial py-10 sm:py-16">
        <nav class="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-black/60" aria-label="Breadcrumb">
          <NuxtLink :to="localePath('/')" class="transition-colors hover:text-black">{{ t('nav.home') }}</NuxtLink>
          <span aria-hidden="true">/</span>
          <NuxtLink :to="localePath('/products')" class="transition-colors hover:text-black">{{ t('products.title') }}</NuxtLink>
          <span aria-hidden="true">/</span>
          <span class="text-black" aria-current="page">{{ name }}</span>
        </nav>
        <p class="eyebrow mt-8">{{ locale === 'ar' ? 'مجموعة' : 'Collection' }}</p>
        <h1 class="mt-3 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">{{ name }}</h1>
        <p v-if="desc" class="mt-3 max-w-2xl text-sm leading-7 text-black/55 sm:text-base">{{ desc }}</p>
      </div>
    </header>

    <AppProductGrid :category-slug="slug" />
  </div>
</template>
