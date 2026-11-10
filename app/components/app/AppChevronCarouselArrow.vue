<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  direction?: 'prev' | 'next' | 'start' | 'end'
  label?: string
}>(), {
  direction: 'next',
  label: '',
})

const isVisible = computed(() => props.direction !== 'prev' && props.direction !== 'start')
</script>

<template>
  <button
    type="button"
    class="ultra-carousel-control border-none bg-transparent hover:text-brand-red"
    :aria-label="props.label || (isVisible ? 'Next slide' : 'Previous slide')"
  >
    <ChevronLeft
      v-if="props.direction === 'prev' || props.direction === 'start'"
      class="h-6 w-6"
      aria-hidden="true"
    />
    <ChevronRight
      v-else
      class="h-6 w-6"
      aria-hidden="true"
    />
  </button>
</template>
