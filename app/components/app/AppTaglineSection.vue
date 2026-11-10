<script setup lang="ts">
const props = withDefaults(defineProps<{
  heading?: string
  paragraph: string
  align?: 'start' | 'center'
}>(), {
  heading: '',
  paragraph: '',
  align: 'start',
})
</script>

<template>
  <AppGridPatternBackground class="w-full">
    <div class="container-editorial">
      <div
        class="mx-auto max-w-[650px]"
        :class="props.align === 'center' ? 'text-center' : ''"
      >
        <div
          v-if="props.heading"
          class="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md border-2 border-brand-red text-[28px] font-black leading-none text-brand-red"
          aria-hidden="true"
        >
          U
        </div>

        <p class="font-heading text-[32px] font-medium leading-[1.18] tracking-[-0.01em] text-black sm:text-[36px]">
          {{ props.paragraph }}
        </p>
      </div>
    </div>
  </AppGridPatternBackground>
</template>
