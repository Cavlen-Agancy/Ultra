<script setup lang="ts">
import {
  LayoutDashboard,
  Loader2,
  LogIn,
  Menu,
  Search,
  ShoppingBag,
  X,
} from 'lucide-vue-next'

const { t, locale, setLocale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()

const mobileOpen = ref(false)
const searchBarOpen = ref(false)
const searchInputRef = ref<HTMLInputElement | null>(null)
const searchQuery = ref('')
const searchLoading = ref(false)
const searchResults = ref<any[]>([])
const searchTotalMatches = ref(0)
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null

const cartStore = useCartStore()
const { money } = useMoney()
const { data: adminSession } = useAdminSession()
const isAdminLoggedIn = computed(() => !!adminSession.value?.user)

const { data: navCats } = await useAsyncData('navbar-categories', () =>
  $fetch<{ categories: { slug: string, nameAr: string, nameEn: string, isVip?: boolean }[] }>('/api/categories'),
  { server: true, lazy: true },
)

const { data: generalSettings } = await useAsyncData('navbar-settings-general', () =>
  $fetch<any>('/api/settings/general'),
  { server: true, lazy: true },
)

const productsHref = computed(() => localePath('/products'))
const brandName = computed(() => generalSettings.value?.siteNameEn || generalSettings.value?.siteNameAr || t('brand.name'))
const isProductsActive = computed(() =>
  route.path === productsHref.value
  || route.path.startsWith(`${productsHref.value}/`)
  || /(^|\/)p\//.test(route.path),
)

function toggleLocale() {
  setLocale(locale.value === 'ar' ? 'en' : 'ar')
  mobileOpen.value = false
}

function toggleSearchBar() {
  searchBarOpen.value = !searchBarOpen.value
  if (searchBarOpen.value) {
    mobileOpen.value = false
    nextTick(() => searchInputRef.value?.focus())
  }
}

function closeSearchBar() {
  searchBarOpen.value = false
  searchQuery.value = ''
  searchResults.value = []
}

async function fetchAutocomplete(term: string) {
  if (!term.trim()) {
    searchResults.value = []
    searchTotalMatches.value = 0
    searchLoading.value = false
    return
  }
  searchLoading.value = true
  try {
    const res = await $fetch<{ results: any[], total: number }>(`/api/products/autocomplete?q=${encodeURIComponent(term.trim())}`)
    searchResults.value = res.results || []
    searchTotalMatches.value = res.total || 0
  }
  catch {
    searchResults.value = []
    searchTotalMatches.value = 0
  }
  finally {
    searchLoading.value = false
  }
}

watch(searchQuery, (val) => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  if (!val.trim()) {
    searchResults.value = []
    searchTotalMatches.value = 0
    searchLoading.value = false
    return
  }
  searchDebounceTimer = setTimeout(() => fetchAutocomplete(val), 220)
})

function submitNavSearch() {
  const q = searchQuery.value.trim()
  if (!q) return
  closeSearchBar()
  navigateTo(localePath(`/products?search=${encodeURIComponent(q)}`))
}

function closeMobile() {
  mobileOpen.value = false
}

watch(() => route.fullPath, () => {
  closeSearchBar()
  closeMobile()
})

watch([mobileOpen, searchBarOpen], ([menu, search]) => {
  if (typeof document !== 'undefined') {
    document.body.classList.toggle('overflow-hidden', menu || search)
  }
})

function handleKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  if (searchBarOpen.value) closeSearchBar()
  if (mobileOpen.value) closeMobile()
}

onMounted(() => {
  if (typeof window !== 'undefined') window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') window.removeEventListener('keydown', handleKeydown)
  if (typeof document !== 'undefined') document.body.classList.remove('overflow-hidden')
})
</script>

<template>
  <header data-site-header class="sticky top-0 z-40 border-b border-black/10 bg-white">
    <div class="container-editorial relative flex h-[72px] items-center justify-between">
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="-ms-2 flex h-10 w-10 items-center justify-center text-black transition-colors hover:text-brand-red md:hidden"
          :aria-label="mobileOpen ? 'Close menu' : 'Open menu'"
          :aria-expanded="mobileOpen"
          aria-controls="mobile-menu"
          @click="mobileOpen = !mobileOpen"
        >
          <X v-if="mobileOpen" class="h-5 w-5" aria-hidden="true" />
          <Menu v-else class="h-5 w-5" aria-hidden="true" />
        </button>

        <nav class="hidden items-center gap-7 md:flex" aria-label="Main navigation">
          <NuxtLink :to="localePath('/')" class="text-[12px] font-bold uppercase tracking-[0.13em] text-[#5A5A5A] transition-colors hover:text-black">
            {{ t('nav.home') }}
          </NuxtLink>
          <NuxtLink
            :to="productsHref"
            class="text-[12px] font-bold uppercase tracking-[0.13em] transition-colors"
            :class="isProductsActive ? 'text-brand-red underline decoration-2 underline-offset-4' : 'text-[#5A5A5A] hover:text-black'"
          >
            {{ t('nav.products') }}
          </NuxtLink>
        </nav>
      </div>

      <NuxtLink
        :to="localePath('/')"
        class="group absolute left-1/2 top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2.5 min-w-[120px] sm:min-w-[160px]"
        aria-label="Ultra Store home"
      >
        <img
          :src="generalSettings?.logoPath || '/logo.png'"
          :alt="brandName"
          class="h-10 w-auto object-contain transition-transform group-hover:scale-105"
        />
        <span class="font-display text-[20px] font-bold uppercase tracking-[0.22em] text-black">
          {{ brandName }}
        </span>
      </NuxtLink>

      <div class="flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          class="hidden h-10 items-center px-2 text-[11px] font-bold uppercase tracking-[0.14em] text-black/60 transition-colors hover:text-black sm:inline-flex"
          :aria-label="t('common.toggleLanguage')"
          @click="toggleLocale"
        >
          {{ locale === 'ar' ? 'EN' : 'AR' }}
        </button>

        <button
          type="button"
          class="flex h-10 w-10 items-center justify-center text-black transition-colors hover:text-brand-red"
          :aria-label="locale === 'ar' ? 'بحث' : 'Search'"
          :aria-expanded="searchBarOpen"
          aria-controls="site-search"
          @click="toggleSearchBar"
        >
          <X v-if="searchBarOpen" class="h-5 w-5" aria-hidden="true" />
          <Search v-else class="h-5 w-5" aria-hidden="true" />
        </button>

        <NuxtLink
          :to="isAdminLoggedIn ? localePath('/admin') : localePath('/admin/login')"
          class="hidden h-10 w-10 items-center justify-center text-black transition-colors hover:text-brand-red sm:flex"
          :aria-label="isAdminLoggedIn ? t('nav.dashboard') : t('nav.login')"
        >
          <LayoutDashboard v-if="isAdminLoggedIn" class="h-5 w-5" aria-hidden="true" />
          <LogIn v-else class="h-5 w-5" aria-hidden="true" />
        </NuxtLink>

        <NuxtLink
          :to="localePath('/cart')"
          class="relative flex h-10 items-center gap-2 px-1 text-black transition-colors hover:text-brand-red"
          :aria-label="`${t('nav.cart')} (${cartStore.itemCount})`"
        >
          <ShoppingBag class="h-5 w-5" aria-hidden="true" />
          <span class="hidden text-[11px] font-bold uppercase tracking-[0.14em] lg:inline">{{ t('nav.cart') }}</span>
          <span
            v-if="cartStore.itemCount"
            class="flex h-5 min-w-5 items-center justify-center bg-brand-red px-1 text-[10px] font-bold text-white"
          >
            {{ cartStore.itemCount }}
          </span>
        </NuxtLink>
      </div>
    </div>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="-translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="-translate-y-2 opacity-0"
    >
      <div
        v-if="searchBarOpen"
        id="site-search"
        class="absolute inset-x-0 top-full z-50 border-b border-black/10 bg-white"
      >
        <div class="container-editorial py-4 sm:py-6">
          <div class="mx-auto w-full max-w-3xl">
            <div class="flex items-center justify-between">
              <span class="eyebrow">{{ locale === 'ar' ? 'ابحث في المتجر' : 'Search the store' }}</span>
              <button type="button" class="text-xs font-semibold text-black/55 hover:text-black" @click="closeSearchBar">
                {{ locale === 'ar' ? 'إغلاق' : 'Close' }}
              </button>
            </div>

            <form class="mt-3 flex items-center border-b-2 border-black py-2" role="search" @submit.prevent="submitNavSearch">
              <Loader2 v-if="searchLoading" class="h-5 w-5 animate-spin text-black/60" aria-hidden="true" />
              <Search v-else class="h-5 w-5 text-black/60" aria-hidden="true" />
              <input
                ref="searchInputRef"
                v-model="searchQuery"
                type="search"
                inputmode="search"
                enterkeyhint="search"
                autocomplete="off"
                :placeholder="locale === 'ar' ? 'ابحث بالاسم أو الفئة' : 'Search by name or category'"
                :aria-label="locale === 'ar' ? 'بحث في المتجر' : 'Search the store'"
                class="h-10 flex-1 bg-transparent px-3 text-base text-black placeholder:text-black/35 focus:outline-none"
              />
              <button type="submit" class="text-xs font-bold uppercase tracking-[0.14em] text-brand-red">
                {{ locale === 'ar' ? 'بحث' : 'Search' }}
              </button>
            </form>

            <div v-if="searchQuery.trim()" class="mt-3 border border-black/10 bg-white">
              <div v-if="searchResults.length" class="max-h-[min(60vh,420px)] overflow-y-auto">
                <NuxtLink
                  v-for="item in searchResults"
                  :key="item.id"
                  :to="localePath(`/p/${item.slug}`)"
                  class="flex items-center justify-between gap-4 border-b border-black/5 px-3 py-3 transition-colors last:border-0 hover:bg-black/[0.03]"
                  @click="closeSearchBar"
                >
                  <div class="flex min-w-0 items-center gap-3">
                    <div class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden bg-[#F7F7F7]">
                      <img v-if="item.coverImage" :src="item.coverImage" :alt="locale === 'ar' ? item.nameAr : item.nameEn" class="h-full w-full object-cover" loading="lazy" />
                      <ShoppingBag v-else class="h-4 w-4 text-black/30" />
                    </div>
                    <div class="min-w-0">
                      <p class="truncate text-sm font-medium text-black">{{ locale === 'ar' ? item.nameAr : item.nameEn }}</p>
                      <p v-if="item.category" class="truncate text-[11px] text-black/60">{{ locale === 'ar' ? item.category.nameAr : item.category.nameEn }}</p>
                    </div>
                  </div>
                  <span class="shrink-0 text-sm font-semibold text-black">{{ money(item.price) }}</span>
                </NuxtLink>
                <NuxtLink
                  :to="localePath(`/products?search=${encodeURIComponent(searchQuery.trim())}`)"
                  class="flex items-center justify-center gap-2 px-3 py-3 text-xs font-bold uppercase tracking-[0.14em] text-brand-red"
                  @click="closeSearchBar"
                >
                  {{ locale === 'ar' ? `عرض كل النتائج (${searchTotalMatches})` : `View all results (${searchTotalMatches})` }}
                </NuxtLink>
              </div>
              <div v-else-if="!searchLoading" class="px-4 py-8 text-center">
                <p class="text-sm text-black/55">{{ locale === 'ar' ? 'لا توجد نتائج مطابقة.' : 'No matching products.' }}</p>
                <NuxtLink :to="productsHref" class="mt-3 inline-block text-xs font-bold uppercase tracking-[0.14em] text-brand-red" @click="closeSearchBar">
                  {{ locale === 'ar' ? 'تصفح كل المنتجات' : 'Browse all products' }}
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="-translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="-translate-y-2 opacity-0"
    >
      <div
        v-if="mobileOpen"
        id="mobile-menu"
        class="fixed inset-x-0 top-[72px] bottom-0 z-50 overflow-y-auto border-t border-black/10 bg-white md:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        <div class="container-editorial py-6">
          <nav class="max-h-[62vh] divide-y divide-black/10 overflow-y-auto" aria-label="Mobile navigation links">
            <NuxtLink :to="localePath('/')" class="flex items-center justify-between py-4 text-lg font-medium text-black" @click="closeMobile">
              {{ t('nav.home') }}
            </NuxtLink>
            <NuxtLink :to="productsHref" class="flex items-center justify-between py-4 text-lg font-medium text-black" @click="closeMobile">
              {{ t('nav.allProducts') }}
            </NuxtLink>
            <NuxtLink
              v-for="c in navCats?.categories || []"
              :key="c.slug"
              :to="`${productsHref}/${c.slug}`"
              class="flex items-center justify-between py-4 text-base text-black/70"
              @click="closeMobile"
            >
              <span>{{ locale === 'ar' ? c.nameAr : c.nameEn }}</span>
              <span v-if="c.isVip" class="text-[10px] font-bold uppercase tracking-wider text-brand-red">VIP</span>
            </NuxtLink>
          </nav>

          <div class="mt-8 flex items-center justify-between border-t border-black/10 pt-5">
            <button type="button" class="text-xs font-bold uppercase tracking-[0.14em] text-black/60" @click="toggleLocale">
              {{ locale === 'ar' ? 'English' : 'العربية' }}
            </button>
            <NuxtLink :to="isAdminLoggedIn ? localePath('/admin') : localePath('/admin/login')" class="text-xs font-bold uppercase tracking-[0.14em] text-black/60" @click="closeMobile">
              {{ isAdminLoggedIn ? t('nav.dashboard') : t('nav.login') }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </Transition>
  </header>
</template>
