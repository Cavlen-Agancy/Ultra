<script setup lang="ts">
import { CreditCard, Lock } from 'lucide-vue-next'

const { locale } = useI18n()
const canManageSettings = useAdminCan('settings.manage')

const {
  form, data, loading, statusMessage, isError, dirty, save, reset, markSaved,
} = await useSettingsForm({
  key: 'admin-payment-settings',
  endpoint: '/api/admin/settings/payment',
  defaults: {
    codEnabled: true,
    onlineEnabled: false,
    gatewayName: '',
    gatewayMode: 'sandbox',
    apiKey: '',
    secretKey: '',
  },
  mapData: response => ({
    codEnabled: response.payment?.codEnabled ?? true,
    onlineEnabled: response.payment?.onlineEnabled ?? false,
    gatewayName: response.payment?.gatewayName ?? '',
    gatewayMode: response.payment?.gatewayMode ?? 'sandbox',
  }),
  buildBody: f => ({
    codEnabled: f.codEnabled,
    onlineEnabled: f.onlineEnabled,
    gatewayName: f.gatewayName,
    gatewayMode: f.gatewayMode,
    ...(f.apiKey || f.secretKey ? { credentials: { apiKey: f.apiKey, secretKey: f.secretKey } } : {}),
  }),
  saveEndpoint: '/api/admin/settings/payment',
  successAr: 'تم حفظ إعدادات الدفع بنجاح.',
  successEn: 'Payment settings saved successfully.',
  failAr: 'فشل حفظ الإعدادات.',
  failEn: 'Failed to save settings.',
})

async function saveAndClearSecrets() {
  const ok = await save()
  if (!ok) return
  // Never keep secrets in memory longer than needed; the server confirms storage.
  form.apiKey = ''
  form.secretKey = ''
  markSaved()
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="saveAndClearSecrets">
    <!-- Active Checkout Methods Card -->
    <div class="rounded-md border bg-surface p-4 shadow-xs" :style="{ borderColor: 'var(--color-border)' }">
      <div class="mb-3 flex items-center gap-2">
        <CreditCard class="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 class="font-heading text-base font-bold text-text">
          {{ locale === 'ar' ? 'طرق الدفع عند الشراء' : 'Checkout Payment Methods' }}
        </h2>
      </div>
      <p class="mb-4 text-xs text-muted">
        {{ locale === 'ar' ? 'تحديد الخيارات المتاحة للعملاء لإتمام الطلب في صفحة الدفع.' : 'Enable or disable payment options presented to customers during checkout.' }}
      </p>

      <div class="space-y-3">
        <label class="flex cursor-pointer items-center gap-3 rounded-md border p-3.5 transition-colors hover:bg-surface dark:hover:bg-ink-800/40" :style="{ borderColor: 'var(--color-border)' }">
          <input v-model="form.codEnabled" type="checkbox" class="h-4 w-4 rounded accent-primary" />
          <div>
            <span class="block text-xs font-bold text-text">Cash on Delivery (COD)</span>
            <span class="text-[11px] text-muted">Customers pay in cash upon receiving the order shipment.</span>
          </div>
        </label>

        <label class="flex cursor-pointer items-center gap-3 rounded-md border p-3.5 transition-colors hover:bg-surface dark:hover:bg-ink-800/40" :style="{ borderColor: 'var(--color-border)' }">
          <input v-model="form.onlineEnabled" type="checkbox" class="h-4 w-4 rounded accent-primary" />
          <div>
            <span class="block text-xs font-bold text-text">Online Card / Wallet Payment</span>
            <span class="text-[11px] text-muted">Accept credit/debit cards and electronic wallets via payment gateway.</span>
          </div>
        </label>
      </div>
    </div>

    <!-- Online Gateway Configuration Card -->
    <div v-if="form.onlineEnabled" class="rounded-md border bg-surface p-4 shadow-xs" :style="{ borderColor: 'var(--color-border)' }">
      <div class="mb-2 flex items-center gap-2">
        <Lock class="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 class="font-heading text-base font-bold text-text">
          {{ locale === 'ar' ? 'تهيئة بوابة الدفع الإلكتروني' : 'Gateway Credentials & Mode' }}
        </h2>
      </div>
      <p class="mb-4 text-xs text-muted">
        {{ locale === 'ar' ? 'يتم تشفير وتخزين مفاتيح API بتشفير AES-256 محمي في قاعدة البيانات.' : 'API keys and secrets are encrypted at rest with AES-256.' }}
      </p>

      <div class="space-y-4">
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-1.5 block text-xs font-semibold text-text">Gateway Provider Name</span>
            <input v-model="form.gatewayName" type="text" placeholder="e.g. Paymob, Fawry" :class="settingsInputCls" :style="{ borderColor: 'var(--color-border)' }" />
          </label>
          <label class="block">
            <span class="mb-1.5 block text-xs font-semibold text-text">Environment Mode</span>
            <select v-model="form.gatewayMode" :class="settingsInputCls" :style="{ borderColor: 'var(--color-border)' }">
              <option value="sandbox">Sandbox (بيئة الاختبار)</option>
              <option value="production">Production (بيئة العمل المباشرة)</option>
            </select>
          </label>
        </div>

        <div v-if="data?.payment?.hasCredentials" class="rounded-md bg-primary/10 p-3 text-xs text-primary dark:bg-primary/15 dark:text-primary">
          ✓ Active credentials are encrypted and stored safely. Leave fields blank to keep existing secrets.
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-1.5 block text-xs font-semibold text-text">API Key</span>
            <input v-model="form.apiKey" type="password" placeholder="••••••••••••••••" :class="settingsInputCls" :style="{ borderColor: 'var(--color-border)' }" autocomplete="off" />
          </label>
          <label class="block">
            <span class="mb-1.5 block text-xs font-semibold text-text">Secret Key</span>
            <input v-model="form.secretKey" type="password" placeholder="••••••••••••••••" :class="settingsInputCls" :style="{ borderColor: 'var(--color-border)' }" autocomplete="off" />
          </label>
        </div>
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
      :save-label="locale === 'ar' ? 'حفظ إعدادات الدفع' : 'Save Payment Settings'"
      :saving-label="locale === 'ar' ? 'جاري الحفظ…' : 'Saving…'"
      :reset-label="locale === 'ar' ? 'تراجع' : 'Reset'"
      @reset="reset"
    />
  </form>
</template>
