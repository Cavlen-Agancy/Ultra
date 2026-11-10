<script setup lang="ts">
import { Boxes, ChevronLeft, ChevronRight } from 'lucide-vue-next'

const { t, locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const slug = String(route.params.slug)

const { data, error } = await useAsyncData(`category-${slug}`, () =>
  $fetch<{ category: {
    nameAr: string, nameEn: string, slug: string,
    descriptionAr: string | null, descriptionEn: string | null,
    coverImagePath: string | null, coverVideoUrl: string | null,
    isVip?: boolean
  } }>(`/api/categories/${slug}`),
)

if (error.value) {
  throw createError({ statusCode: 404, statusMessage: 'Category not found', fatal: true })
}

const isVipCategory = computed(() => data.value?.category?.isVip === true)

const requestFetch = useRequestFetch()
const { data: vipAccess, refresh: refreshVipAccess } = await useAsyncData(`vip-access-${slug}`, () =>
  requestFetch<{ categories: string[] }>('/api/vip-access').catch(() => ({ categories: [] })),
)

const hasVipGrant = computed(() => Boolean(vipAccess.value?.categories && vipAccess.value.categories.some(permissionSlug => permissionSlug === slug)))
const showPasswordGate = computed(() => isVipCategory.value && !hasVipGrant.value)

const vipPasswordInput = ref('')
const vipPasswordError = ref('')
const unlocking = ref(false)

async function unlockVip() {
  unlocking.value = true
  vipPasswordError.value = ''
  try {
    await $fetch(`/api/vip-categories/${encodeURIComponent(slug)}/unlock`, {
      method: 'POST',
      body: { password: vipPasswordInput.value },
    })
    vipPasswordInput.value = ''
    await refreshVipAccess()
    console.log('DEBUG after refresh', JSON.stringify(vipAccess.value))
  } catch (e: any) {
    const status = e?.status || e?.statusCode
    if (status === 429) {
      vipPasswordError.value = locale.value === 'ar'
        ? 'محاولات كثيرة. يرجى المحاولة لاحقاً.'
        : 'Too many attempts. Please try again later.'
    } else {
      vipPasswordError.value = locale.value === 'ar' ? 'كلمة المرور غير صحيحة' : 'Invalid password'
    }
  } finally {
    unlocking.value = false
  }
}

const { data: heroGeneral } = await useAsyncData('hero-general', () => $fetch<any>('/api/settings/general'))

const name = computed(() => (locale.value === 'ar' ? data.value?.category.nameAr : data.value?.category.nameEn))
const desc = computed(() => (locale.value === 'ar' ? data.value?.category.descriptionAr : data.value?.category.descriptionEn))

useHead(() => ({
  title: `${name.value} | ${t('brand.name')}`,
  meta: desc.value ? [{ name: 'description', content: desc.value }] : [],
}))
</script>

<template>
  <div class="space-y-0">
    <!-- Category Hero Banner with Cover Media & Dark Scrim -->
    <div
      class="relative overflow-hidden bg-ink-950 bg-cover bg-center text-white"
      :style="!data?.category.coverImagePath && heroGeneral?.heroImagePath ? `background-image: url('${heroGeneral.heroImagePath}')` : ''"
    >
      <!-- Category cover image (with alt); homepage hero image is the CSS fallback above -->
      <img
        v-if="data?.category.coverImagePath"
        :src="data.category.coverImagePath"
        :alt="name"
        class="absolute inset-0 h-full w-full object-cover"
      />
      <div class="absolute inset-0" style="background: linear-gradient(to bottom, rgba(13,27,46,0.85), rgba(13,27,46,0.95))"></div>

      <svg class="absolute bottom-0 left-0 h-[72px] w-full sm:h-[110px]" viewBox="0 0 1440 110" preserveAspectRatio="none" aria-hidden="true" style="filter: drop-shadow(0 -10px 24px rgba(13,27,46,0.35))">
        <path class="fill-bg" d="M0,110 L0,60 C360,5 1080,5 1440,60 L1440,110 Z" />
      </svg>

      <div class="relative z-10 mx-auto w-full max-w-[1536px] px-4 sm:px-6 lg:px-8 xl:px-10 pt-10 sm:pt-12 pb-24 sm:pb-28">
        <!-- Breadcrumb Navigation -->
        <nav class="mb-5 flex items-center gap-1.5 text-xs font-medium text-white/60" aria-label="Breadcrumb">
          <NuxtLink :to="localePath('/')" class="hover:text-white transition-colors">{{ t('nav.home') }}</NuxtLink>
          <span class="text-white/40" aria-hidden="true">/</span>
          <NuxtLink :to="localePath('/products')" class="hover:text-white transition-colors">{{ t('products.title') }}</NuxtLink>
          <span class="text-white/40" aria-hidden="true">/</span>
          <span class="text-white font-semibold" aria-current="page">{{ name }}</span>
        </nav>

        <div class="max-w-3xl">
          <div class="inline-flex items-center gap-1.5 rounded-full border border-cream/30 bg-cream/10 px-4 py-1.5 text-xs sm:text-sm font-semibold text-cream shadow-sm backdrop-blur-md mb-4">
            <Boxes class="h-3.5 w-3.5" aria-hidden="true" />
            <span>{{ locale === 'ar' ? 'فئة معتمدة' : 'Verified Category' }}</span>
          </div>

          <h1 class="font-heading text-4xl font-extrabold tracking-tight text-white mb-3 leading-tight">
            {{ name }}
          </h1>

          <p v-if="desc" class="text-sm sm:text-base text-white/80 leading-relaxed max-w-2xl">
            {{ desc }}
          </p>
        </div>
      </div>
    </div>

    <!-- Product Grid for Category -->
    <div v-if="showPasswordGate" class="mx-auto max-w-xl px-4 py-12">
      <div class="rounded-md border bg-surface p-6 shadow-xs text-center">
        <h2 class="font-display text-2xl text-text mb-2">
          {{ locale === 'ar' ? 'مجموعة VIP' : 'VIP Collection' }}
        </h2>
        <p class="text-sm text-muted mb-4">
          {{ locale === 'ar' ? 'أدخل كلمة المرور للوصول إلى هذه المجموعة.' : 'Enter the password to access this collection.' }}
        </p>
        <form class="space-y-3" @submit.prevent="unlockVip">
          <input
            v-model="vipPasswordInput"
            type="password"
            required
            :class="['h-10 w-full rounded-md border bg-transparent px-3 text-sm', vipPasswordError ? 'border-error' : 'border-border']"
            :style="{ borderColor: vipPasswordError ? undefined : 'var(--color-border)' }"
          />
          <p v-if="vipPasswordError" class="text-xs text-error">{{ vipPasswordError }}</p>
          <button
            type="submit"
            :disabled="unlocking"
            class="inline-flex w-full h-10 items-center justify-center rounded-md bg-accent px-4 text-xs font-semibold text-on-accent disabled:opacity-50"
          >
            {{ unlocking ? (locale === 'ar' ? 'جاري التحقق...' : 'Unlocking...') : (locale === 'ar' ? 'الوصول' : 'Access') }}
          </button>
        </form>
      </div>
    </div>

    <template v-else>
      <AppProductGrid :category-slug="slug" />
    </template>
  </div>
</template>
