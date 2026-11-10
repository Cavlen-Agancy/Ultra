<script setup lang="ts">
const props = withDefaults(defineProps<{
  as?: 'div' | 'section'
  tone?: 'light' | 'gray'
  padding?: 'md' | 'lg'
}>(), {
  as: 'div',
  tone: 'light',
  padding: 'lg',
})

const elementClass = computed(() => ({
  light: 'ultra-grid-section',
  gray: 'bg-surface-gray',
}))

const paddingClass = computed(() => (
  props.padding === 'md'
    ? 'py-14 sm:py-20'
    : 'py-20 sm:py-28'
))
</script>

<template>
  <component
    :is="props.as"
    class="relative overflow-hidden"
    :class="props.tone === 'light' ? 'ultra-grid-section' : 'bg-surface-gray'"
  >
    <div class="relative z-10">
      <slot />
    </div>
  </component>
</template>
