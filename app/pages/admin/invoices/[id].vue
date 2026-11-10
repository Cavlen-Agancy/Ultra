<script setup lang="ts">
import { ArrowRight, Download, Printer } from 'lucide-vue-next'

definePageMeta({ layout: 'admin', middleware: 'admin-auth', requiredPermission: 'invoices.view' })

const { locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const id = String(route.params.id)
const fetch = useRequestFetch()
const toast = useAdminToast()

const { data, refresh, error } = await useAsyncData(`admin-invoice-${id}`, () =>
  fetch<{ invoice: any }>(`/api/admin/invoices/${id}`),
)
const { data: general } = await useAsyncData('invoice-general', () => fetch<any>('/api/settings/general'))
const { data: contact } = await useAsyncData('invoice-contact', () => fetch<any>('/api/settings/contact'))

const invoice = computed(() => data.value?.invoice)
const newStatus = ref('')
const updating = ref(false)
watch(() => invoice.value?.status, s => { if (s) newStatus.value = s }, { immediate: true })

function formatDate(d: string): string {
  if (!d) return ''
  return new Date(d).toLocaleDateString(locale.value === 'ar' ? 'ar' : 'en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

function statusAr(s: string): string {
  const map: Record<string, string> = { Paid: 'مدفوعة', Pending: 'معلقة', Cancelled: 'ملغية' }
  return locale.value === 'ar' ? (map[s] || s) : s
}

async function saveStatus() {
  if (!invoice.value || newStatus.value === invoice.value.status) return
  updating.value = true
  try {
    await $fetch(`/api/admin/invoices/${id}/status`, { method: 'PUT', body: { status: newStatus.value } })
    await refresh()
    toast.success(locale.value === 'ar' ? 'تم تحديث حالة الفاتورة' : 'Invoice Status Updated')
  }
  catch (e: any) {
    toast.error(locale.value === 'ar' ? 'فشل التحديث' : 'Update Failed', e?.data?.message)
  }
  finally {
    updating.value = false
  }
}

function handlePrint() {
  window.print()
}
</script>

<template>
  <div>
    <div v-if="error" class="rounded-md border border-error/30 bg-error/10 p-6 text-center text-xs font-medium text-error dark:border-error/30 dark:bg-error/15 dark:text-error">
      {{ locale === 'ar' ? 'الفاتورة غير موجودة أو تعذر تحميلها.' : 'Invoice not found or failed to load.' }}
    </div>

    <div v-else-if="invoice">
      <AdminPageHeader
        :title="`${locale === 'ar' ? 'فاتورة' : 'Invoice'} #${invoice.invoiceNumber}`"
        :description="formatDate(invoice.createdAt)"
        back-to="/admin/invoices"
        :back-label="locale === 'ar' ? 'العودة للفواتير' : 'Back to Invoices'"
      >
        <template #badge>
          <AdminStatusBadge :status="statusAr(invoice.status)" size="md" />
        </template>
        <template #actions>
          <div class="flex items-center gap-2 print:hidden">
            <select
              v-model="newStatus"
              class="h-9 rounded-md border bg-surface px-2 text-xs font-semibold"
              :style="{ borderColor: 'var(--color-border)' }"
              :disabled="updating"
              @change="saveStatus"
            >
              <option value="Pending">{{ locale === 'ar' ? 'معلقة' : 'Pending' }}</option>
              <option value="Paid">{{ locale === 'ar' ? 'مدفوعة' : 'Paid' }}</option>
              <option value="Cancelled">{{ locale === 'ar' ? 'ملغية' : 'Cancelled' }}</option>
            </select>
            <a
              :href="`/api/invoices/${invoice.id}/pdf`"
              target="_blank" download
              class="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3.5 text-xs font-bold text-on-primary shadow-xs hover:bg-accent-hover"
            >
              <Download class="h-3.5 w-3.5" aria-hidden="true" />
              <span>{{ locale === 'ar' ? 'تحميل PDF' : 'Download PDF' }}</span>
            </a>
            <button
              type="button"
              class="inline-flex h-9 items-center gap-1.5 rounded-md border bg-surface px-3.5 text-xs font-bold text-text hover:bg-surface dark:text-text"
              :style="{ borderColor: 'var(--color-border)' }"
              @click="handlePrint"
            >
              <Printer class="h-3.5 w-3.5" aria-hidden="true" />
              <span>{{ locale === 'ar' ? 'طباعة' : 'Print' }}</span>
            </button>
          </div>
        </template>
      </AdminPageHeader>

      <!-- A4 Preview Card (shared component) -->
      <AdminInvoicePreview :invoice="invoice" :general="general" :contact="contact" />

      <div class="mt-4 flex items-center justify-center gap-2 print:hidden">
        <NuxtLink
          :to="localePath('/admin/invoices')"
          class="inline-flex h-10 items-center gap-1.5 rounded-md border bg-surface px-4 text-xs font-semibold text-text hover:bg-surface dark:text-muted"
          :style="{ borderColor: 'var(--color-border)' }"
        >
          <ArrowRight class="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          <span>{{ locale === 'ar' ? 'العودة للفواتير' : 'Back to Invoices' }}</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style>
@media print {
  aside, header, nav, .print\:hidden {
    display: none !important;
  }
}
</style>
