<script setup lang="ts">
import { Facebook, Instagram, Linkedin, Mail, MapPin, Music2, Phone, Share2, Twitter, Youtube } from 'lucide-vue-next'

const { locale } = useI18n()
const canManageSettings = useAdminCan('settings.manage')

const {
  form, loading, statusMessage, isError, dirty, save, reset,
} = await useSettingsForm({
  key: 'settings-contact',
  endpoint: '/api/admin/settings',
  defaults: {
    contactPhone1: '',
    contactPhone2: '',
    contactWhatsapp: '',
    contactEmail: '',
    contactAddressAr: '',
    contactAddressEn: '',
    socialFacebook: '',
    socialInstagram: '',
    socialTiktok: '',
    socialYoutube: '',
    socialLinkedin: '',
    socialX: '',
    googleMapsEmbedUrl: '',
  },
  saveEndpoint: '/api/admin/settings/contact',
  successAr: 'تم حفظ بيانات الاتصال والموقع بنجاح.',
  successEn: 'Contact and location settings saved successfully.',
  failAr: 'حدث خطأ أثناء الحفظ.',
  failEn: 'Failed to save contact settings.',
})

const missingAddressAr = computed(() => !!form.contactAddressEn.trim() && !form.contactAddressAr.trim())
</script>

<template>
  <form class="space-y-4" @submit.prevent="save">
    <!-- Section 1: Official Communication Channels -->
    <div class="rounded-md border bg-surface p-4 shadow-xs" :style="{ borderColor: 'var(--color-border)' }">
      <div class="mb-3 flex items-center gap-2">
        <Phone class="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 class="font-heading text-base font-bold text-text">
          {{ locale === 'ar' ? 'قنوات الاتصال الرسمية' : 'Contact Channels' }}
        </h2>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block">
          <span class="mb-1.5 block text-xs font-semibold text-text">Primary Phone Number</span>
          <input v-model="form.contactPhone1" type="text" placeholder="Phone number" dir="ltr" :class="settingsInputCls" :style="{ borderColor: 'var(--color-border)' }" />
        </label>
        <label class="block">
          <span class="mb-1.5 block text-xs font-semibold text-text">Secondary Phone Number</span>
          <input v-model="form.contactPhone2" type="text" placeholder="Phone number" dir="ltr" :class="settingsInputCls" :style="{ borderColor: 'var(--color-border)' }" />
        </label>
        <label class="block">
          <span class="mb-1.5 block text-xs font-semibold text-text">WhatsApp Number</span>
          <input v-model="form.contactWhatsapp" type="text" placeholder="Phone number" dir="ltr" :class="settingsInputCls" :style="{ borderColor: 'var(--color-border)' }" />
        </label>
        <label class="block">
          <span class="mb-1.5 block text-xs font-semibold text-text">Official Email</span>
          <input v-model="form.contactEmail" type="email" placeholder="info@example.com" :class="settingsInputCls" :style="{ borderColor: 'var(--color-border)' }" />
        </label>
      </div>
    </div>

    <!-- Section 2: Physical Address -->
    <div class="rounded-md border bg-surface p-4 shadow-xs" :style="{ borderColor: 'var(--color-border)' }">
      <div class="mb-3 flex items-center gap-2">
        <MapPin class="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 class="font-heading text-base font-bold text-text">
          {{ locale === 'ar' ? 'العنوان والمقر' : 'Headquarters & Address' }}
        </h2>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block">
          <span class="mb-1.5 block text-xs font-semibold text-text">Address (EN)</span>
          <textarea v-model="form.contactAddressEn" rows="2.5" placeholder="Store address" class="w-full rounded-md border bg-surface p-2.5 text-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" :style="{ borderColor: 'var(--color-border)' }" />
        </label>
        <label class="block">
          <span class="mb-1.5 block text-xs font-semibold text-text">Address (AR)</span>
          <textarea v-model="form.contactAddressAr" rows="2.5" dir="rtl" placeholder="عنوان المتجر" class="w-full rounded-md border bg-surface p-2.5 text-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" :style="{ borderColor: missingAddressAr ? '#F59E0B' : 'var(--color-border)' }" />
          <span v-if="missingAddressAr" class="mt-1 block text-[11px] font-medium text-warning dark:text-warning">
            {{ locale === 'ar' ? 'تنبيه: العنوان بالإنجليزية موجود لكن الترجمة العربية فارغة.' : 'Heads up: English is filled but the Arabic translation is empty.' }}
          </span>
        </label>
      </div>
    </div>

    <!-- Section 3: Social Profiles -->
    <div class="rounded-md border bg-surface p-4 shadow-xs" :style="{ borderColor: 'var(--color-border)' }">
      <div class="mb-3 flex items-center gap-2">
        <Share2 class="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 class="font-heading text-base font-bold text-text">
          {{ locale === 'ar' ? 'منصات التواصل الاجتماعي' : 'Social Profiles' }}
        </h2>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block">
          <span class="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-text">
            <Facebook class="h-3.5 w-3.5 text-[#1877F2]" />
            <span>Facebook Page URL</span>
          </span>
          <input v-model="form.socialFacebook" type="url" placeholder="https://facebook.com/..." :class="settingsInputCls" :style="{ borderColor: 'var(--color-border)' }" />
        </label>

        <label class="block">
          <span class="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-text">
            <Instagram class="h-3.5 w-3.5 text-[#E4405F]" />
            <span>Instagram Profile URL</span>
          </span>
          <input v-model="form.socialInstagram" type="url" placeholder="https://instagram.com/..." :class="settingsInputCls" :style="{ borderColor: 'var(--color-border)' }" dir="ltr" />
        </label>

        <label class="block">
          <span class="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-text">
            <Music2 class="h-3.5 w-3.5 text-text" />
            <span>TikTok Profile URL</span>
          </span>
          <input v-model="form.socialTiktok" type="url" placeholder="https://tiktok.com/..." :class="settingsInputCls" :style="{ borderColor: 'var(--color-border)' }" dir="ltr" />
        </label>

        <label class="block">
          <span class="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-text">
            <Youtube class="h-3.5 w-3.5 text-[#FF0000]" />
            <span>YouTube Channel URL</span>
          </span>
          <input v-model="form.socialYoutube" type="url" placeholder="https://youtube.com/..." :class="settingsInputCls" :style="{ borderColor: 'var(--color-border)' }" dir="ltr" />
        </label>

        <label class="block">
          <span class="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-text">
            <Linkedin class="h-3.5 w-3.5 text-[#0A66C2]" />
            <span>LinkedIn Company URL</span>
          </span>
          <input v-model="form.socialLinkedin" type="url" placeholder="https://linkedin.com/company/..." :class="settingsInputCls" :style="{ borderColor: 'var(--color-border)' }" dir="ltr" />
        </label>

        <label class="block">
          <span class="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-text">
            <Twitter class="h-3.5 w-3.5 text-text" />
            <span>X (Twitter) Profile URL</span>
          </span>
          <input v-model="form.socialX" type="url" placeholder="https://x.com/..." :class="settingsInputCls" :style="{ borderColor: 'var(--color-border)' }" dir="ltr" />
        </label>
      </div>
      <p class="mt-3 text-[11px] text-muted">
        {{ locale === 'ar' ? 'الحقول الفارغة لن تظهر أيقوناتها في الموقع. رقم واتساب للمحادثة يُدار من حقل رقم واتساب أعلاه.' : 'Empty fields hide their icons publicly. The WhatsApp chat number is managed via the WhatsApp field above.' }}
      </p>
    </div>

    <!-- Section 4: Map Embed -->
    <div class="rounded-md border bg-surface p-4 shadow-xs" :style="{ borderColor: 'var(--color-border)' }">
      <h2 class="mb-1 font-heading text-base font-bold text-text">
        {{ locale === 'ar' ? 'خريطة جوجل (Google Maps)' : 'Google Maps Location' }}
      </h2>
      <p class="mb-3 text-xs text-muted">
        {{ locale === 'ar' ? 'أدخل كود iframe المضمن من خرائط جوجل لعرض الموقع في صفحة التواصل.' : 'Paste the Google Maps iframe embed code to display on the contact page.' }}
      </p>

      <textarea
        v-model="form.googleMapsEmbedUrl"
        rows="3"
        placeholder='<iframe src="https://www.google.com/maps/embed?..." width="600" height="450" ...></iframe>'
        class="w-full rounded-md border bg-surface p-2.5 font-mono text-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
      :save-label="locale === 'ar' ? 'حفظ معلومات التواصل' : 'Save Contact Settings'"
      :saving-label="locale === 'ar' ? 'جاري الحفظ…' : 'Saving…'"
      :reset-label="locale === 'ar' ? 'تراجع' : 'Reset'"
      @reset="reset"
    />
  </form>
</template>
