<script setup lang="ts">
const props = withDefaults(defineProps<{
  paragraph: string
  linkLabel?: string
  href?: string
  primaryImage?: string | null
  secondaryImage?: string | null
}>(), {
  paragraph: '',
  linkLabel: '',
  href: '/products',
  primaryImage: null,
  secondaryImage: null,
})
</script>

<template>
  <section class="ultra-grid-section">
    <div class="container-editorial grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-12 lg:gap-16 lg:py-28">
      <div class="lg:col-span-5">
        <p class="font-heading text-[26px] font-semibold leading-[1.15] text-black sm:text-[30px] sm:leading-[1.12]">
          {{ props.paragraph }}
        </p>

        <NuxtLink
          v-if="props.linkLabel"
          :to="props.href"
          class="mt-5 inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.13em] text-brand-red transition-colors hover:text-brand-red-dark"
        >
          {{ props.linkLabel }}
        </NuxtLink>
      </div>

      <div class="lg:col-span-7">
        <div class="relative flex justify-end">
          <img
            v-if="props.primaryImage"
            :src="props.primaryImage"
            alt=""
            class="h-[260px] w-[220px] rounded-lg object-cover shadow-ultra sm:h-[310px] sm:w-[250px]"
            loading="lazy"
          />
          <img
            v-if="props.secondaryImage"
            :src="props.secondaryImage"
            alt=""
            class="absolute end-[-1rem] top-8 h-[280px] w-[190px] rounded-lg object-cover shadow-ultra sm:h-[330px] sm:w-[220px] rotate-3 opacity-95"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  </section>
  </template>
