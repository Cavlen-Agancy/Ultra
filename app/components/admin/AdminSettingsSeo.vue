<script setup lang="ts">
import { Globe, Search, Sparkles } from 'lucide-vue-next'

const { locale } = useI18n()
const canManageSettings = useAdminCan('settings.manage')

const {
  form, loading, statusMessage, isError, dirty, save, reset,
} = await useSettingsForm({
  key: 'settings-seo',
  endpoint: '/api/admin/settings',
  defaults: {
    seoMetaTitleTemplateAr: '',
    seoMetaTitleTemplateEn: '',
    seoMetaDescriptionAr: '',
    seoMetaDescriptionEn: '',
    seoKeywords: '',
    geoDescription: '',
  },
  saveEndpoint: '/api/admin/settings/seo',
  successAr: 'تم حفظ إعدادات محركات البحث والذكاء الاصطناعي بنجاح.',
  successEn: 'SEO & AI Search Discovery settings saved successfully.',
  failAr: 'حدث خطأ أثناء الحفظ.',
  failEn: 'Failed to save SEO settings.',
})
</script>

<template>
  <form class="space-y-4" @submit.prevent="save">
    <!-- Title & Description Templates -->
    <div class="rounded-md border bg-surface p-4 shadow-xs" :style="{ borderColor: 'var(--color-border)' }">
      <div class="mb-3 flex items-center gap-2">
        <Search class="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 class="font-heading text-base font-bold text-text">
          {{ locale === 'ar' ? 'قوالب العناوين والوصف في محركات البحث' : 'Search Metadata Templates' }}
        </h2>
      </div>

      <div class="space-y-4">
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-1.5 block text-xs font-semibold text-text">Meta Title Template (EN)</span>
            <input v-model="form.seoMetaTitleTemplateEn" type="text" placeholder="{page} | Ultra" :class="settingsInputCls" :style="{ borderColor: 'var(--color-border)' }" />
          </label>
          <label class="block">
            <span class="mb-1.5 block text-xs font-semibold text-text">Meta Title Template (AR)</span>
            <input v-model="form.seoMetaTitleTemplateAr" type="text" placeholder="{page} | Ultra" dir="rtl" :class="settingsInputCls" :style="{ borderColor: 'var(--color-border)' }" />
          </label>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-1.5 block text-xs font-semibold text-text">Default Meta Description (EN)</span>
            <textarea v-model="form.seoMetaDescriptionEn" rows="2.5" placeholder="Bilingual online store — quality products with fast delivery..." class="w-full rounded-md border bg-surface p-2.5 text-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" :style="{ borderColor: 'var(--color-border)' }" />
          </label>
          <label class="block">
            <span class="mb-1.5 block text-xs font-semibold text-text">Default Meta Description (AR)</span>
            <textarea v-model="form.seoMetaDescriptionAr" rows="2.5" dir="rtl" placeholder="متجر إلكتروني — أضف وصف المتجر هنا..." class="w-full rounded-md border bg-surface p-2.5 text-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" :style="{ borderColor: 'var(--color-border)' }" />
          </label>
        </div>

        <label class="block">
          <span class="mb-1.5 block text-xs font-semibold text-text">Default Keywords</span>
          <input v-model="form.seoKeywords" type="text" placeholder="ultra, online store" :class="settingsInputCls" :style="{ borderColor: 'var(--color-border)' }" />
          <span class="mt-1 block text-[11px] text-muted">Comma-separated keywords for meta tags.</span>
        </label>
      </div>
    </div>

    <!-- GEO & AI Search Context -->
    <div class="rounded-md border bg-surface p-4 shadow-xs" :style="{ borderColor: 'var(--color-border)' }">
      <div class="mb-2 flex items-center gap-2">
        <Sparkles class="h-4 w-4 text-accent" aria-hidden="true" />
        <h2 class="font-heading text-base font-bold text-text">
          {{ locale === 'ar' ? 'سياق الذكاء الاصطناعي ومحركات البحث الجغرافية (GEO)' : 'GEO & AI Search Knowledge' }}
        </h2>
      </div>
      <p class="mb-4 text-xs text-muted leading-relaxed">
        {{ locale === 'ar' ? 'نص تعريفي منظم يصف المتجر وسياقه، يتم تضمينه في بيانات Schema المنظمة لتسهيل فهرسة وتلخيص الموقع بواسطة نماذج الذكاء الاصطناعي (ChatGPT, Gemini, Perplexity).' : 'Structured natural-language summary describing the store and its context. Embedded into schema markup to optimize AI engine comprehension.' }}
      </p>

      <textarea
        v-model="form.geoDescription"
        rows="4"
        placeholder="Ultra is an online store. Add a neutral description of the store here..."
        class="w-full rounded-md border bg-surface p-3 text-xs leading-relaxed focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        :style="{ borderColor: 'var(--color-border)' }"
      />
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
      :save-label="locale === 'ar' ? 'حفظ إعدادات السيو' : 'Save SEO Settings'"
      :saving-label="locale === 'ar' ? 'جاري الحفظ…' : 'Saving…'"
      :reset-label="locale === 'ar' ? 'تراجع' : 'Reset'"
      @reset="reset"
    />
  </form>
</template>
