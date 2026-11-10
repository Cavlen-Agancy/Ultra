<script setup lang="ts">
const props = withDefaults(defineProps<{
  eyebrow?: string
  title: string
  subtitle?: string
  align?: 'start' | 'center' | 'end'
  tone?: 'light' | 'dark'
  href?: string
  linkLabel?: string
}>(), {
  eyebrow: '',
  subtitle: '',
  align: 'start',
  tone: 'light',
  href: '',
  linkLabel: '',
})
</script>

<template>
  <div class="w-full">
    <div
      class="flex flex-col gap-4 sm:items-center"
      :class="props.align === 'center'
        ? 'items-center text-center justify-center'
        : 'sm:flex-row sm:items-end sm:justify-between'"
    >
      <div class="max-w-2xl" :class="props.align === 'center' ? 'mx-auto' : ''">
        <p v-if="props.eyebrow" class="eyebrow">{{ props.eyebrow }}</p>
        <h2
          class="mt-2 font-heading text-2xl font-bold tracking-tight sm:text-[36px] sm:leading-[1.05]"
          :class="props.tone === 'dark' ? 'text-white' : 'text-black'"
        >
          {{ props.title }}
        </h2>
        <p
          v-if="props.subtitle"
          class="mt-3 text-sm leading-6 sm:text-base sm:leading-7"
          :class="props.tone === 'dark' ? 'text-white/65' : 'text-[#5A5A5A]'"
        >
          {{ props.subtitle }}
        </p>
      </div>

      <NuxtLink
        v-if="props.href && props.linkLabel"
        :to="props.href"
        class="text-[12px] font-bold uppercase tracking-[0.13em] text-black transition-colors hover:text-brand-red"
        :class="props.align === 'center' ? 'mx-auto' : ''"
      >
        {{ props.linkLabel }}
      </NuxtLink>
    </div>
  </div>
</template>
