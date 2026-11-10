<script setup lang="ts">
const { t, locale } = useI18n()
const localePath = useLocalePath()

useHead(() => ({ title: `${t('products.title')} | ${t('brand.name')}` }))
</script>

<template>
  <div class="bg-white text-black">
    <header class="border-b border-black/10">
      <div class="container-editorial py-10 sm:py-16">
        <nav class="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-black/60" aria-label="Breadcrumb">
          <NuxtLink :to="localePath('/')" class="transition-colors hover:text-black">{{ t('nav.home') }}</NuxtLink>
          <span aria-hidden="true">/</span>
          <span class="text-black" aria-current="page">{{ t('products.title') }}</span>
        </nav>
        <p class="eyebrow mt-8">{{ locale === 'ar' ? 'الكتالوج' : 'Catalog' }}</p>
        <h1 class="mt-3 max-w-3xl font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
          {{ t('products.title') }}
        </h1>
        <p class="mt-3 max-w-2xl text-sm leading-7 text-black/55 sm:text-base">
          {{ t('products.subtitle') }}
        </p>
      </div>
    </header>

    <AppProductGrid />
  </div>
</template>
