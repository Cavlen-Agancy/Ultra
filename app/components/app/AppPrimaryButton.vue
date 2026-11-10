<script setup lang="ts">
const props = withDefaults(defineProps<{
  to?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  fullWidth?: boolean
}>(), {
  to: '',
  type: 'button',
  disabled: false,
  fullWidth: false,
})

const linkProps = computed(() => ({
  to: props.to || undefined,
  type: props.type || undefined,
  disabled: props.disabled || undefined,
}))

const classes = [
  'btn-primary',
  props.fullWidth ? 'w-full' : '',
].filter(Boolean).join(' ')
</script>

<template>
  <component
    :is="props.to ? 'NuxtLink' : 'button'"
    :class="classes"
    v-bind="linkProps"
  >
    <slot />
  </component>
</template>
