<script setup lang="ts">
const props = withDefaults(defineProps<{
  status: string
  showDot?: boolean
  size?: 'sm' | 'md'
}>(), {
  showDot: true,
  size: 'md',
})

const badgeConfig = computed(() => {
  const s = props.status?.toLowerCase() || ''
  
  if (['active', 'delivered', 'done', 'completed', 'accepted', 'paid', 'مقبول'].includes(s)) {
    return {
      classes: 'bg-success/10 text-success border-success/30 dark:bg-success/15 dark:text-success dark:border-success/30',
      dot: 'bg-success dark:bg-success',
    }
  }
  if (['pending', 'pending approval', 'معلق'].includes(s)) {
    return {
      classes: 'bg-warning/10 text-warning border-warning/30 dark:bg-warning/15 dark:text-warning dark:border-warning/50',
      dot: 'bg-warning dark:bg-warning',
    }
  }
  if (['processing', 'new', 'in review', 'in_review', 'reviewed', 'contacted', 'جديد', 'تمت المراجعة'].includes(s)) {
    return {
      classes: 'bg-primary/10 text-primary border-primary/30 dark:bg-primary/15 dark:text-primary dark:border-primary/50',
      dot: 'bg-primary dark:bg-primary',
    }
  }
  if (['shipped'].includes(s)) {
    return {
      classes: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/50',
      dot: 'bg-purple-500 dark:bg-purple-400',
    }
  }
  if (['cancelled', 'rejected', 'failed', 'مرفوض'].includes(s)) {
    return {
      classes: 'bg-error/10 text-error border-error/30 dark:bg-error/15 dark:text-error dark:border-error/30',
      dot: 'bg-error dark:bg-error',
    }
  }
  if (['super', 'superadmin'].includes(s)) {
    return {
      classes: 'bg-accent/20 text-text border-accent/40 dark:bg-accent/20 dark:text-accent dark:border-accent/30',
      dot: 'bg-accent',
    }
  }
  return {
    classes: 'bg-border/40 text-text border-border dark:text-muted',
    dot: 'bg-border',
  }
})
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full border font-medium uppercase tracking-wider transition-colors"
    :class="[
      badgeConfig.classes,
      size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs'
    ]"
  >
    <span
      v-if="showDot"
      class="h-1.5 w-1.5 rounded-full shrink-0"
      :class="badgeConfig.dot"
      aria-hidden="true"
    />
    <span>{{ status }}</span>
  </span>
</template>
