<script setup lang="ts">
import { Store } from 'lucide-vue-next'

const { locale } = useI18n()
const canManageSettings = useAdminCan('settings.manage')

const {
  form, loading, statusMessage, isError, dirty, save, reset,
} = await useSettingsForm({
  key: 'settings-store',
  endpoint: '/api/admin/settings',
  defaults: {
    defaultCurrency: 'XXX',
    productsPerPage: 16,
    vatRate: 0,
    pricesIncludeVat: false,
    vatNumber: '',
  },
  saveEndpoint: '/api/admin/settings/store',
  successAr: 'تم حفظ تهيئة المتجر بنجاح.',
  successEn: 'Store configuration saved successfully.',
  failAr: 'حدث خطأ أثناء الحفظ.',
  failEn: 'Failed to save store configuration.',
})
</script>

<template>
  <form class="space-y-4" @submit.prevent="save">
    <!-- Store Configuration Card -->
    <div class="rounded-md border bg-surface p-4 shadow-xs" :style="{ borderColor: 'var(--color-border)' }">
      <div class="mb-3 flex items-center gap-2">
        <Store class="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 class="font-heading text-base font-bold text-text">
          {{ locale === 'ar' ? 'العملة والتصفح في المتجر' : 'Catalog & Currency Settings' }}
        </h2>
      </div>

      <div class="grid max-w-xl gap-4 sm:grid-cols-2">
        <label class="block">
          <span class="mb-1.5 block text-xs font-semibold text-text">Default Currency Code</span>
          <input v-model="form.defaultCurrency" type="text" placeholder="XXX" :class="settingsInputCls" :style="{ borderColor: 'var(--color-border)' }" />
          <span class="mt-1 block text-[11px] text-muted">Default currency displayed across product pricing and checkout.</span>
        </label>

        <label class="block">
          <span class="mb-1.5 block text-xs font-semibold text-text">Products Per Page</span>
          <input v-model.number="form.productsPerPage" type="number" min="4" max="100" :class="settingsInputCls" :style="{ borderColor: 'var(--color-border)' }" />
          <span class="mt-1 block text-[11px] text-muted">Default number of items displayed per catalog pagination page.</span>
        </label>
      </div>

      <!-- VAT / tax settings -->
      <div class="mt-4 border-t pt-4" :style="{ borderColor: 'var(--color-border)' }">
        <h3 class="mb-3 text-xs font-bold text-text dark:text-text">
          {{ locale === 'ar' ? 'إعدادات العملة والضريبة' : 'Currency & Tax Settings' }}
        </h3>
        <div class="grid max-w-xl gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-1.5 block text-xs font-semibold text-text">{{ locale === 'ar' ? 'نسبة الضريبة %' : 'VAT Rate %' }}</span>
            <input v-model.number="form.vatRate" type="number" min="0" max="100" :class="settingsInputCls" :style="{ borderColor: 'var(--color-border)' }" />
            <span class="mt-1 block text-[11px] text-muted">{{ locale === 'ar' ? 'حدد نسبة الضريبة المطبقة على المتجر. الافتراضي 0 حتى يتم ضبطها.' : 'Set the store VAT rate here. Default is 0 until configured.' }}</span>
          </label>

          <label class="block">
            <span class="mb-1.5 block text-xs font-semibold text-text">{{ locale === 'ar' ? 'الرقم الضريبي' : 'VAT Number' }}</span>
            <input v-model="form.vatNumber" type="text" dir="ltr" placeholder="Tax ID" :class="settingsInputCls" :style="{ borderColor: 'var(--color-border)' }" />
            <span class="mt-1 block text-[11px] text-muted">{{ locale === 'ar' ? 'يظهر على الفواتير (اختياري).' : 'Shown on invoices (optional).' }}</span>
          </label>
        </div>

        <label class="mt-3 inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-text">
          <input v-model="form.pricesIncludeVat" type="checkbox" class="h-4 w-4 rounded accent-primary" />
          <span>{{ locale === 'ar' ? 'الأسعار المعروضة شاملة الضريبة' : 'Displayed prices include VAT' }}</span>
        </label>
      </div>
    </div>

    <!-- Inline Feedback Banner -->
    <div
      v-if="statusMessage"
      role="alert"
      aria-live="polite"
      class="rounded-md border p-3 text-xs font-medium transition-all"
      :class="isError ? 'border-error/30 bg-error/10 text-error dark:border-error/30 dark:bg-error/15 dark:text-error' : 'border-success/30 bg-success/10 text-success dark:border-success/30 dark:bg-success/15 dark:text-success'"
    >
      {{ statusMessage }}
    </div>

    <!-- Sticky Save Bar -->
    <AdminSettingsSaveBar
      :loading="loading"
      :dirty="dirty"
      :disabled="!canManageSettings"
      :save-label="locale === 'ar' ? 'حفظ إعدادات المتجر' : 'Save Store Config'"
      :saving-label="locale === 'ar' ? 'جاري الحفظ…' : 'Saving…'"
      :reset-label="locale === 'ar' ? 'تراجع' : 'Reset'"
      @reset="reset"
    />
  </form>
</template>
