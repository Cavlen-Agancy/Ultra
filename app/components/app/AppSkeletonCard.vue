<script setup lang="ts">
const props = withDefaults(defineProps<{
  type?: 'card' | 'grid-item'
  layout?: '4:5' | '3:4' | 'portrait'
}>(), {
  type: 'card',
  layout: 'portrait',
})
</script>

<template>
  <div class="flex flex-col">
    <div
      class="w-full animate-pulse bg-[#F7F7F7] rounded-lg"
      :class="{
        'aspect-[4/5]': props.layout === 'portrait',
        'aspect-[3/4]': props.layout === '3:4',
      }"
    />
    <div class="mt-3 h-3 w-1/2 rounded-sm bg-black/[0.06]" />
    <div class="mt-2 h-4 w-3/4 rounded-sm bg-black/[0.06]" />
    <div class="mt-2 h-4 w-1/3 rounded-sm bg-black/[0.06]" />
  </div>
</template>
