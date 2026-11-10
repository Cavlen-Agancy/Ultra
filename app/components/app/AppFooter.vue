<script setup lang="ts">
import { Globe, Mail, MapPin, Phone, ShieldCheck, Zap } from 'lucide-vue-next'

const { t, locale } = useI18n()
const localePath = useLocalePath()

const { data: general } = await useAsyncData('footer-general', () =>
  $fetch<any>('/api/settings/general'),
  { server: true, lazy: true }
)

const { data: contact } = await useAsyncData('footer-contact', () =>
  $fetch<any>('/api/settings/contact'),
  { server: true, lazy: true }
)

const year = new Date().getFullYear()

const siteDisplayName = computed(() => {
  return general.value?.siteNameEn || general.value?.siteNameAr || t('brand.name')
})

</script>

<template>
  <footer class="relative overflow-hidden border-t-2 border-t-[#737373] bg-[#111111] text-muted pt-16 pb-12 transition-colors">
    <div class="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      
      <!-- Upper Footer Grid -->
      <div class="grid grid-cols-1 gap-10 md:grid-cols-12 lg:gap-14 pb-12">
        
        <!-- Col 1: Brand & Identity (5 cols) -->
        <div class="md:col-span-5 space-y-4">
          <NuxtLink :to="localePath('/')" class="inline-flex min-w-[120px] items-center gap-2.5 p-1 text-white group">
            <img 
              v-if="general?.logoPath" 
              :src="general.logoPath" 
              :alt="siteDisplayName" 
              class="h-10 w-auto object-contain" 
            />
            <div v-else class="flex items-center gap-2.5">
              <span class="font-heading text-xl font-bold tracking-tight text-white group-hover:text-accent transition-colors">
                {{ siteDisplayName }}
              </span>
            </div>
          </NuxtLink>

          <p class="text-[22px] font-bold leading-snug text-[#F5F5F5] max-w-sm">
            {{ t('brand.shortDesc') }}
          </p>

          <p class="font-display text-sm tracking-[0.18em] text-[#F5F5F5]/80 max-w-sm" dir="ltr" v-if="locale !== 'ar'">
            {{ t('brand.tagline') }}
          </p>
          <p v-else class="text-sm leading-relaxed text-muted max-w-sm">
            {{ t('brand.longDesc') }}
          </p>

          <!-- Social Links (only configured platforms render; empty = hidden) -->
          <div class="pt-2">
            <AppSocialLinks variant="footer" />
          </div>
        </div>

        <!-- Col 2: Navigation Links (3 cols) -->
        <div class="md:col-span-3 space-y-4">
          <h3 class="font-heading text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <span class="h-1.5 w-1.5 rounded-full bg-[#737373]" aria-hidden="true"></span>
            <span>{{ locale === 'ar' ? 'روابط المنصة' : 'Platform Navigation' }}</span>
          </h3>
          <ul class="space-y-2.5 text-sm">
            <li>
              <NuxtLink :to="localePath('/')" class="text-muted hover:text-[#737373] hover:translate-x-1 rtl:hover:-translate-x-1 transition-all duration-200 inline-flex items-center gap-1.5">
                <span>{{ t('nav.home') }}</span>
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/products')" class="text-muted hover:text-[#737373] hover:translate-x-1 rtl:hover:-translate-x-1 transition-all duration-200 inline-flex items-center gap-1.5">
                <span>{{ t('nav.products') }}</span>
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/cart')" class="text-muted hover:text-[#737373] hover:translate-x-1 rtl:hover:-translate-x-1 transition-all duration-200 inline-flex items-center gap-1.5">
                <span>{{ t('nav.cart') }}</span>
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Col 3: Direct Technical Contact (4 cols) -->
        <div class="md:col-span-4 space-y-4">
          <h3 class="font-heading text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <span class="h-1.5 w-1.5 rounded-full bg-[#737373]" aria-hidden="true"></span>
            <span>{{ locale === 'ar' ? 'خدمة العملاء والاستفسارات' : 'Customer Care & Inquiries' }}</span>
          </h3>
          <ul class="space-y-3.5 text-sm">
            <li v-if="contact?.contactPhone1" class="flex items-start gap-3 group">
              <div class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-accent shadow-xs group-hover:bg-white/10 group-hover:border-white/20 transition-colors">
                <Phone class="w-4 h-4" />
              </div>
              <div>
                <span class="block text-[11px] text-muted font-medium">{{ locale === 'ar' ? 'الهاتف المباشر' : 'Direct Line' }}</span>
                <a :href="`tel:${contact.contactPhone1}`" dir="ltr" class="font-mono text-sm text-[#F5F5F5] hover:text-[#737373] transition-colors">{{ contact.contactPhone1 }}</a>
              </div>
            </li>

            <li v-if="contact?.contactEmail" class="flex items-start gap-3 group">
              <div class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-accent shadow-xs group-hover:bg-white/10 group-hover:border-white/20 transition-colors">
                <Mail class="w-4 h-4" />
              </div>
              <div>
                <span class="block text-[11px] text-muted font-medium">{{ locale === 'ar' ? 'البريد الإلكتروني' : 'Official Email' }}</span>
                <a :href="`mailto:${contact.contactEmail}`" class="text-sm text-[#F5F5F5] hover:text-[#737373] transition-colors">{{ contact.contactEmail }}</a>
              </div>
            </li>

            <li v-if="contact?.contactAddressEn || contact?.contactAddressAr" class="flex items-start gap-3 group">
              <div class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-accent shadow-xs group-hover:bg-white/10 group-hover:border-white/20 transition-colors">
                <MapPin class="w-4 h-4" />
              </div>
              <div>
                <span class="block text-[11px] text-muted font-medium">{{ locale === 'ar' ? 'الموقع الفعلي' : 'Location' }}</span>
                <span class="text-xs text-muted leading-relaxed">{{ locale === 'ar' ? contact.contactAddressAr : contact.contactAddressEn }}</span>
              </div>
            </li>
          </ul>
        </div>

      </div>

      <!-- Lower Footer: Centered Vertically Stacked Content -->
      <div class="pt-8 border-t border-white/10 flex flex-col items-center justify-center gap-2 text-center text-xs text-muted">
        <!-- Line 1: Copyright -->
        <p>&copy; {{ year }} {{ siteDisplayName }}. {{ locale === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.' }}</p>
      </div>

    </div>
  </footer>
</template>
