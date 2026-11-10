<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  page: number
  pages: number
  total?: number
  itemName?: string
}>(), {
  total: 0,
  itemName: '',
})

const emit = defineEmits<{ (e: 'change', page: number): void }>()

const { locale } = useI18n()

const summary = computed(() => {
  if (locale.value === 'ar') {
    const base = `الصفحة ${props.page} من إجمالي ${props.pages}`
    return props.total ? `${base} (إجمالي ${props.itemName ? `${props.itemName}: ` : ''}${props.total})` : base
  }
  const base = `Showing page ${props.page} of ${props.pages}`
  return props.total ? `${base} (${props.total} total ${props.itemName})` : base
})

function goto(p: number) {
  const next = Math.min(Math.max(1, p), Math.max(1, props.pages))
  if (next !== props.page) emit('change', next)
}
</script>

<template>
  <div
    v-if="pages > 1"
    class="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 text-xs sm:flex-row"
    :style="{ borderColor: 'var(--color-border)' }"
  >
    <span class="text-muted">{{ summary }}</span>
    <div class="flex items-center gap-1.5">
      <button
        type="button"
        class="inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs font-medium text-text transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40 dark:text-muted dark:hover:bg-ink-800"
        :disabled="page <= 1"
        @click="goto(page - 1)"
      >
        <ChevronRight v-if="locale === 'ar'" class="h-3.5 w-3.5" aria-hidden="true" />
        <ChevronLeft v-else class="h-3.5 w-3.5" aria-hidden="true" />
        <span>{{ locale === 'ar' ? 'السابق' : 'Previous' }}</span>
      </button>
      <button
        type="button"
        class="inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs font-medium text-text transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40 dark:text-muted dark:hover:bg-ink-800"
        :disabled="page >= pages"
        @click="goto(page + 1)"
      >
        <span>{{ locale === 'ar' ? 'التالي' : 'Next' }}</span>
        <ChevronLeft v-if="locale === 'ar'" class="h-3.5 w-3.5" aria-hidden="true" />
        <ChevronRight v-else class="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
