<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps<{ page: number, pages: number }>()
const emit = defineEmits<{ (e: 'change', page: number): void }>()

const { locale } = useI18n()

type PageItem = number | 'ellipsis'

// Max 5 number buttons; long ranges collapse to "…" around the active page.
const items = computed<PageItem[]>(() => {
  const total = props.pages
  const current = Math.min(Math.max(1, props.page), total)

  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 3) return [1, 2, 3, 4, 'ellipsis', total]
  if (current >= total - 2) return [1, 'ellipsis', total - 3, total - 2, total - 1, total]
  return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total]
})

function go(page: number) {
  const next = Math.min(Math.max(1, page), Math.max(1, props.pages))
  if (next !== props.page) emit('change', next)
}
</script>

<template>
  <nav
    v-if="pages > 1"
    class="mt-10 flex flex-wrap items-center justify-center gap-1.5"
    :aria-label="locale === 'ar' ? 'ترقيم الصفحات' : 'Pagination'"
  >
    <button
      type="button"
      class="inline-flex h-10 min-w-10 items-center justify-center rounded-sm border border-black bg-transparent px-3 text-black transition-colors hover:bg-black hover:text-white disabled:pointer-events-none disabled:opacity-40"
      :disabled="page <= 1"
      :aria-label="locale === 'ar' ? 'الصفحة السابقة' : 'Previous page'"
      @click="go(page - 1)"
    >
      <ChevronLeft class="h-4 w-4 rtl:rotate-180 sm:hidden" aria-hidden="true" />
      <span class="hidden text-[10px] font-bold uppercase tracking-[0.12em] sm:inline">
        {{ locale === 'ar' ? 'السابق' : 'Previous' }}
      </span>
    </button>

    <template v-for="(item, index) in items" :key="`${item}-${index}`">
      <span
        v-if="item === 'ellipsis'"
        class="flex h-10 w-10 items-center justify-center text-sm text-black/45"
        aria-hidden="true"
      >…</span>

      <button
        v-else
        type="button"
        class="h-10 w-10 rounded-sm border text-[13px] font-bold transition-colors"
        :class="item === page
          ? 'border-brand-red bg-brand-red text-white'
          : 'border-black bg-transparent text-black hover:bg-black hover:text-white'"
        :aria-label="locale === 'ar' ? `صفحة ${item}` : `Page ${item}`"
        :aria-current="item === page ? 'page' : undefined"
        @click="go(item)"
      >
        {{ item }}
      </button>
    </template>

    <button
      type="button"
      class="inline-flex h-10 min-w-10 items-center justify-center rounded-sm border border-black bg-transparent px-3 text-black transition-colors hover:bg-black hover:text-white disabled:pointer-events-none disabled:opacity-40"
      :disabled="page >= pages"
      :aria-label="locale === 'ar' ? 'الصفحة التالية' : 'Next page'"
      @click="go(page + 1)"
    >
      <span class="hidden text-[10px] font-bold uppercase tracking-[0.12em] sm:inline">
        {{ locale === 'ar' ? 'التالي' : 'Next' }}
      </span>
      <ChevronRight class="h-4 w-4 rtl:rotate-180 sm:hidden" aria-hidden="true" />
    </button>
  </nav>
</template>
