<script setup lang="ts">
import { Mail, MapPin, Phone } from 'lucide-vue-next'

const { t, locale } = useI18n()
const localePath = useLocalePath()

const { data: general } = await useAsyncData('footer-general', () =>
  $fetch<any>('/api/settings/general'),
  { server: true, lazy: true },
)

const { data: contact } = await useAsyncData('footer-contact', () =>
  $fetch<any>('/api/settings/contact'),
  { server: true, lazy: true },
)

const { data: categories } = await useAsyncData('footer-categories', () =>
  $fetch<{ categories: { slug: string, nameAr: string, nameEn: string }[] }>('/api/categories'),
  { server: true, lazy: true },
)

const year = new Date().getFullYear()
const hasContact = computed(() => Boolean(contact.value?.contactPhone1 || contact.value?.contactEmail || contact.value?.contactAddressEn || contact.value?.contactAddressAr))
const siteDisplayName = computed(() => general.value?.siteNameEn || general.value?.siteNameAr || t('brand.name'))
</script>

<template>
  <footer class="bg-black text-white">
    <div class="container-editorial py-14 sm:py-16">
      <div class="grid gap-10 border-b border-white/15 pb-12 md:grid-cols-12 md:gap-8">
        <div :class="hasContact ? 'md:col-span-5' : 'md:col-span-7'">
          <NuxtLink :to="localePath('/')" class="inline-flex items-center gap-3">
            <img
              v-if="general?.logoPath"
              :src="general.logoPath"
              :alt="siteDisplayName"
              class="h-9 w-auto object-contain brightness-0 invert"
            />
            <span v-else class="font-display text-2xl font-bold uppercase tracking-[0.22em] text-white">
              {{ siteDisplayName }}
            </span>
          </NuxtLink>

          <p class="mt-5 max-w-sm text-sm leading-7 text-white/75">
            {{ t('brand.longDesc') }}
          </p>

          <div class="mt-6">
            <AppSocialLinks variant="footer" />
          </div>
        </div>

        <div class="md:col-span-2">
          <h2 class="eyebrow !text-white/60">{{ locale === 'ar' ? 'تسوق' : 'Shop' }}</h2>
          <ul class="mt-4 space-y-3 text-sm text-white/75">
            <li><NuxtLink :to="localePath('/products')" class="text-white/80 transition-colors hover:text-brand-red hover:underline">{{ t('nav.allProducts') }}</NuxtLink></li>
            <li v-for="c in (categories?.categories || []).slice(0, 4)" :key="c.slug">
              <NuxtLink :to="localePath(`/products/${c.slug}`)" class="text-white/80 transition-colors hover:text-brand-red hover:underline">
                {{ locale === 'ar' ? c.nameAr : c.nameEn }}
              </NuxtLink>
            </li>
            <li><NuxtLink :to="localePath('/cart')" class="text-white/80 transition-colors hover:text-brand-red hover:underline">{{ t('nav.cart') }}</NuxtLink></li>
          </ul>
        </div>

        <div :class="hasContact ? 'md:col-span-2' : 'md:col-span-3'">
          <h2 class="eyebrow !text-white/60">{{ locale === 'ar' ? 'المتجر' : 'Store' }}</h2>
          <ul class="mt-4 space-y-3 text-sm text-white/75">
            <li><NuxtLink :to="localePath('/')" class="text-white/80 transition-colors hover:text-brand-red hover:underline">{{ t('nav.home') }}</NuxtLink></li>
            <li><NuxtLink :to="localePath('/products')" class="text-white/80 transition-colors hover:text-brand-red hover:underline">{{ t('nav.products') }}</NuxtLink></li>
            <li><NuxtLink :to="localePath('/admin/login')" class="text-white/80 transition-colors hover:text-brand-red hover:underline">{{ t('nav.login') }}</NuxtLink></li>
          </ul>
        </div>

        <div v-if="hasContact" class="md:col-span-3">
          <h2 class="eyebrow !text-white/60">{{ locale === 'ar' ? 'تواصل' : 'Contact' }}</h2>
          <ul class="mt-4 space-y-3 text-sm text-white/75">
            <li v-if="contact?.contactPhone1" class="flex items-start gap-2.5">
              <Phone class="mt-0.5 h-4 w-4 shrink-0 text-ultra-400" aria-hidden="true" />
              <a :href="`tel:${contact.contactPhone1}`" class="text-white/80 transition-colors hover:text-brand-red hover:underline" dir="ltr">{{ contact.contactPhone1 }}</a>
            </li>
            <li v-if="contact?.contactEmail" class="flex items-start gap-2.5">
              <Mail class="mt-0.5 h-4 w-4 shrink-0 text-ultra-400" aria-hidden="true" />
              <a :href="`mailto:${contact.contactEmail}`" class="break-all transition-colors hover:text-white">{{ contact.contactEmail }}</a>
            </li>
            <li v-if="contact?.contactAddressEn || contact?.contactAddressAr" class="flex items-start gap-2.5">
              <MapPin class="mt-0.5 h-4 w-4 shrink-0 text-ultra-400" aria-hidden="true" />
              <span class="leading-6">{{ locale === 'ar' ? contact.contactAddressAr : contact.contactAddressEn }}</span>
            </li>
          </ul>
        </div>
      </div>

      <div class="flex flex-col gap-3 pt-6 text-[11px] uppercase tracking-[0.12em] text-white/55 sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; {{ year }} {{ siteDisplayName }}. {{ locale === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.' }}</p>
        <p>{{ locale === 'ar' ? 'متجر إلكتروني' : 'Online store' }}</p>
      </div>
    </div>
  </footer>
</template>
