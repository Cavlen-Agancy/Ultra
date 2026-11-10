<script setup lang="ts">
import { Check, RotateCcw, Save } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  loading?: boolean
  dirty?: boolean
  /** Extra disable condition (e.g. missing manage permission). */
  disabled?: boolean
  saveLabel?: string
  savingLabel?: string
  resetLabel?: string
}>(), {
  loading: false,
  dirty: false,
  disabled: false,
  saveLabel: 'Save',
  savingLabel: 'Saving…',
  resetLabel: 'Reset',
})

defineEmits<{
  (e: 'reset'): void
}>()

const { locale } = useI18n()
</script>

<template>
  <div class="sticky bottom-0 -mx-1 border-t bg-surface/95 px-1 py-3 backdrop-blur transition-colors/95" :style="{ borderColor: 'var(--color-border)' }">
    <div class="flex flex-wrap items-center gap-3">
      <!-- Dirty / pristine indicator -->
      <span
        class="inline-flex items-center gap-1.5 text-[11px] font-medium"
        :class="dirty ? 'text-warning dark:text-warning' : 'text-muted dark:text-muted'"
        role="status"
      >
        <span
          class="h-2 w-2 rounded-full"
          :class="dirty ? 'bg-warning' : 'bg-success'"
          aria-hidden="true"
        />
        <span v-if="dirty">{{ locale === 'ar' ? 'توجد تغييرات غير محفوظة' : 'Unsaved changes' }}</span>
        <span v-else class="inline-flex items-center gap-1">
          <Check class="h-3 w-3" aria-hidden="true" />
          {{ locale === 'ar' ? 'لا توجد تغييرات معلقة' : 'All changes saved' }}
        </span>
      </span>

      <span class="ms-auto" />

      <slot name="hint" />

      <button
        v-if="dirty"
        type="button"
        class="inline-flex h-10 items-center gap-1.5 rounded-md border px-4 text-xs font-semibold text-muted transition-colors hover:bg-surface dark:text-muted dark:hover:bg-ink-800"
        @click="$emit('reset')"
      >
        <RotateCcw class="h-3.5 w-3.5" aria-hidden="true" />
        <span>{{ resetLabel }}</span>
      </button>

      <button
        type="submit"
        :disabled="loading || !dirty || disabled"
        class="inline-flex h-10 items-center gap-1.5 rounded-md bg-accent px-6 text-xs font-semibold text-on-accent shadow-xs transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Save class="h-3.5 w-3.5" aria-hidden="true" />
        <span>{{ loading ? savingLabel : saveLabel }}</span>
      </button>
    </div>
  </div>
</template>
