<script setup lang="ts">
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
  }
  catch (e: any) {
    const status = e?.status || e?.statusCode
    if (status === 429) {
      vipPasswordError.value = locale.value === 'ar'
        ? 'محاولات كثيرة. يرجى المحاولة لاحقاً.'
        : 'Too many attempts. Please try again later.'
    }
    else {
      vipPasswordError.value = locale.value === 'ar' ? 'كلمة المرور غير صحيحة' : 'Invalid password'
    }
  }
  finally {
    unlocking.value = false
  }
}

const name = computed(() => (locale.value === 'ar' ? data.value?.category.nameAr : data.value?.category.nameEn))
const desc = computed(() => (locale.value === 'ar' ? data.value?.category.descriptionAr : data.value?.category.descriptionEn))

useHead(() => ({
  title: `${name.value} | ${t('brand.name')}`,
  meta: desc.value ? [{ name: 'description', content: desc.value }] : [],
}))
</script>

<template>
  <div class="bg-white text-black">
    <header v-if="data?.category.coverImagePath" class="relative overflow-hidden bg-black">
      <img :src="data.category.coverImagePath" :alt="name" class="absolute inset-0 h-full w-full object-cover" />
      <div class="absolute inset-0 bg-black/55" aria-hidden="true" />
      <div class="container-editorial relative flex min-h-[44svh] items-end pb-10 pt-24 sm:min-h-[52svh] sm:pb-14">
        <div class="max-w-3xl text-white">
          <nav class="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-white/70" aria-label="Breadcrumb">
            <NuxtLink :to="localePath('/')" class="transition-colors hover:text-white">{{ t('nav.home') }}</NuxtLink>
            <span aria-hidden="true">/</span>
            <NuxtLink :to="localePath('/products')" class="transition-colors hover:text-white">{{ t('products.title') }}</NuxtLink>
            <span aria-hidden="true">/</span>
            <span class="text-white" aria-current="page">{{ name }}</span>
          </nav>
          <p class="eyebrow mt-8 !text-white/70">{{ locale === 'ar' ? 'مجموعة' : 'Collection' }}</p>
          <h1 class="mt-3 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">{{ name }}</h1>
          <p v-if="desc" class="mt-4 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">{{ desc }}</p>
        </div>
      </div>
    </header>

    <header v-else class="border-b border-black/10">
      <div class="container-editorial py-10 sm:py-16">
        <nav class="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-black/60" aria-label="Breadcrumb">
          <NuxtLink :to="localePath('/')" class="transition-colors hover:text-black">{{ t('nav.home') }}</NuxtLink>
          <span aria-hidden="true">/</span>
          <NuxtLink :to="localePath('/products')" class="transition-colors hover:text-black">{{ t('products.title') }}</NuxtLink>
          <span aria-hidden="true">/</span>
          <span class="text-black" aria-current="page">{{ name }}</span>
        </nav>
        <p class="eyebrow mt-8">{{ locale === 'ar' ? 'مجموعة' : 'Collection' }}</p>
        <h1 class="mt-3 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">{{ name }}</h1>
        <p v-if="desc" class="mt-3 max-w-2xl text-sm leading-7 text-black/55 sm:text-base">{{ desc }}</p>
      </div>
    </header>

    <div v-if="showPasswordGate" class="container-editorial py-16 sm:py-24">
      <div class="mx-auto max-w-md border border-black/10 p-6 sm:p-8">
        <p class="eyebrow">{{ locale === 'ar' ? 'وصول خاص' : 'Private access' }}</p>
        <h2 class="mt-3 font-heading text-2xl font-semibold">{{ locale === 'ar' ? 'مجموعة VIP' : 'VIP collection' }}</h2>
        <p class="mt-2 text-sm leading-6 text-black/55">
          {{ locale === 'ar' ? 'أدخل كلمة المرور للوصول إلى هذه المجموعة.' : 'Enter the password to access this collection.' }}
        </p>
        <form class="mt-6 space-y-4" @submit.prevent="unlockVip">
          <label class="block">
            <span class="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-black/60">{{ locale === 'ar' ? 'كلمة المرور' : 'Password' }}</span>
            <input
              v-model="vipPasswordInput"
              type="password"
              required
              class="h-11 w-full border border-black/20 bg-white px-3 text-sm text-black focus:border-black focus:outline-none"
              :class="vipPasswordError ? 'border-ultra-500' : ''"
            />
          </label>
          <p v-if="vipPasswordError" class="text-xs text-ultra-600">{{ vipPasswordError }}</p>
          <button type="submit" :disabled="unlocking" class="btn-dark h-11 w-full disabled:opacity-50">
            {{ unlocking ? (locale === 'ar' ? 'جاري التحقق...' : 'Unlocking...') : (locale === 'ar' ? 'دخول' : 'Enter') }}
          </button>
        </form>
      </div>
    </div>

    <AppProductGrid v-else :category-slug="slug" />
  </div>
</template>
