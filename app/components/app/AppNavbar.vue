<script setup lang="ts">
import {
  ArrowLeft,
  Boxes,
  ChevronDown,
  Globe,
  LayoutDashboard,
  Loader2,
  LogIn,
  Menu,
  PhoneCall,
  Search,
  ShoppingCart,
  X
} from 'lucide-vue-next'

const { t, locale, setLocale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const mobileOpen = ref(false)
const productsOpen = ref(false)
const mobileProductsOpen = ref(false)

// Navbar Search Bar State
const searchBarOpen = ref(false)
const searchInputRef = ref<HTMLInputElement | null>(null)
const searchQuery = ref('')
const isSearchFocused = ref(false)
const searchLoading = ref(false)
const searchResults = ref<any[]>([])
const searchTotalMatches = ref(0)
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null

function toggleSearchBar() {
  searchBarOpen.value = !searchBarOpen.value
  if (searchBarOpen.value) {
    mobileOpen.value = false
    nextTick(() => {
      searchInputRef.value?.focus()
    })
  }
}

function closeSearchBar() {
  searchBarOpen.value = false
  searchQuery.value = ''
  searchResults.value = []
}

// Mobile UX: Lock body scroll when search is active; close on route change
watch(searchBarOpen, (open) => {
  if (typeof document !== 'undefined') {
    if (open) {
      document.body.classList.add('overflow-hidden', 'sm:overflow-auto')
    } else {
      document.body.classList.remove('overflow-hidden', 'sm:overflow-auto')
    }
  }
})

watch(() => route.fullPath, () => {
  closeSearchBar()
  mobileOpen.value = false
  mobileProductsOpen.value = false
})

watch(mobileOpen, (open) => {
  if (!open) mobileProductsOpen.value = false
})

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && searchBarOpen.value) {
    closeSearchBar()
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeydown)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeydown)
  }
})

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
  searchDebounceTimer = setTimeout(() => {
    fetchAutocomplete(val)
  }, 220)
})

function submitNavSearch() {
  const q = searchQuery.value.trim()
  if (!q) return
  closeSearchBar()
  navigateTo(localePath(`/products?search=${encodeURIComponent(q)}`))
}

const productsHref = computed(() => localePath('/products'))
const cartStore = useCartStore()

const { data: adminSession } = useAdminSession()
const { money } = useMoney()
const isAdminLoggedIn = computed(() => !!adminSession.value?.user)

const { data: navCats } = await useAsyncData('navbar-categories', () =>
  $fetch<{ categories: { slug: string, nameAr: string, nameEn: string, isVip?: boolean }[] }>('/api/categories'),
  { server: true, lazy: true },
)

const { data: generalSettings } = await useAsyncData('navbar-settings-general', () =>
  $fetch<any>('/api/settings/general'),
  { server: true, lazy: true },
)

function toggleLocale() {
  setLocale(locale.value === 'ar' ? 'en' : 'ar')
  mobileOpen.value = false
}

// Transparent-over-hero mode (homepage only): navbar shows the ink-950 hero
// behind it at the very top; solid theme bar everywhere else / on scroll.
const barePath = computed(() => route.path.replace(/^\/(en|ar)(?=\/|$)/, '') || '/')
const isHome = computed(() => barePath.value === '/')
const scrolled = ref(false)
const heroMode = computed(() => isHome.value && !scrolled.value)

function updateScrolled() {
  scrolled.value = window.scrollY > 30
}

onMounted(() => {
  updateScrolled()
  window.addEventListener('scroll', updateScrolled, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateScrolled)
})

// Desktop link states (tokens only; yellow underline marks active)
function solidLink(active: boolean): string {
  return active
    ? 'bg-primary/10 text-primary underline decoration-accent decoration-2 underline-offset-4'
    : 'text-text hover:bg-border/40 hover:text-primary'
}

function deskLink(active: boolean): string {
  if (heroMode.value) {
    return active
      ? 'bg-white/10 text-white underline decoration-accent decoration-2 underline-offset-4'
      : 'text-white/85 hover:bg-white/10 hover:text-white'
  }
  return solidLink(active)
}

// Icon buttons (search / language / theme), desktop + mobile
function iconBtn(active = false): string {
  if (heroMode.value) {
    return active
      ? 'border-white/40 text-white bg-white/10'
      : 'border-white/20 text-white hover:bg-white/10'
  }
  return active
    ? 'border-accent text-accent-text bg-accent/10'
    : 'border-border bg-surface text-muted hover:bg-border/40'
}

function isActiveRoute(path: string, exact = false) {
  if (exact) {
    return route.path === path || route.path === `${path}/`
  }
  return route.path === path || route.path.startsWith(`${path}/`)
}

const isProductsActive = computed(() => {
  const p = productsHref.value
  // NOTE: plain string prefix checks only — never pass '/p/' (no slug) through
  // localePath()/router.resolve(), it matches no route and spams
  // "No match found for location with path" warnings on every render.
  return route.path === p || route.path.startsWith(`${p}/`) || /(^|\/)p\//.test(route.path)
})
</script>

<template>
  <header
    data-site-header
    class="sticky top-0 z-40 transition-colors duration-300"
    :class="heroMode ? 'bg-transparent border-transparent' : 'border-b border-gold-500/20 bg-surface/90 backdrop-blur-md shadow-xs'"
    :style="{ borderColor: heroMode ? 'transparent' : undefined }"
  >
    <nav class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8" aria-label="Main">

      <!-- Brand logo & name. No bundled logo is shipped with Ultra; an uploaded
           logo from settings is used when present, otherwise the name renders. -->
      <NuxtLink :to="localePath('/')" class="group flex min-w-[120px] items-center gap-2.5 p-1 focus-visible:outline-none">
        <img
          v-if="generalSettings?.logoPath"
          :src="generalSettings.logoPath"
          :alt="generalSettings?.siteNameEn || t('brand.name')"
          class="h-9 w-auto object-contain transition-transform group-hover:scale-102"
        />
        <div class="leading-tight">
          <span :class="heroMode ? 'text-white group-hover:text-[#F5F5F5]' : 'text-text group-hover:text-primary'" class="font-heading text-base sm:text-lg font-bold tracking-tight transition-colors">
            {{ generalSettings ? (generalSettings.siteNameEn || generalSettings.siteNameAr) : t('brand.name') }}
          </span>
          <span class="hidden lg:block text-[13px] font-medium tracking-wider uppercase" :class="heroMode ? 'text-white/70' : 'text-muted'">
            {{ locale === 'ar' ? t('brand.shortDesc') : t('brand.tagline') }}
          </span>
        </div>
      </NuxtLink>

      <!-- Desktop Navigation Links -->
      <ul class="hidden items-center gap-1 lg:gap-2 md:flex">
        <!-- Home Link -->
        <li>
          <NuxtLink
            :to="localePath('/')"
            class="inline-flex items-center rounded-lg px-3.5 py-2 text-sm font-semibold transition-all"
            :class="deskLink(isActiveRoute(localePath('/'), true))"
          >
            {{ t('nav.home') }}
          </NuxtLink>
        </li>

        <!-- Products Dropdown -->
        <li
          class="relative"
          @mouseenter="productsOpen = true"
          @mouseleave="productsOpen = false"
        >
          <NuxtLink
            :to="productsHref"
            class="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-all"
            :class="deskLink(isProductsActive)"
            aria-haspopup="true"
            :aria-expanded="productsOpen"
            @click="productsOpen = !productsOpen"
          >
            <span>{{ t('nav.products') }}</span>
            <ChevronDown
              class="h-3.5 w-3.5 transition-transform duration-200"
              :class="productsOpen ? (heroMode ? 'rotate-180 text-white' : 'rotate-180 text-primary') : (heroMode ? 'text-white/70' : 'text-muted')"
              aria-hidden="true"
            />
          </NuxtLink>

          <!-- Dropdown Flyout Card -->
          <div
            v-if="productsOpen"
            class="absolute start-0 top-full pt-1.5 z-50 w-72"
          >
            <div
              class="rounded-xl border border-border bg-surface p-2 shadow-xl ring-1 ring-border"
              :style="{ borderColor: 'var(--color-border)' }"
            >
              <NuxtLink
                :to="productsHref"
                class="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-bold text-primary hover:bg-primary/10 transition-colors"
                @click="productsOpen = false"
              >
                <Boxes class="h-4 w-4" />
                <span>{{ t('nav.allProducts') }}</span>
              </NuxtLink>

              <div class="my-1.5 border-t border-border"></div>

              <div class="max-h-64 overflow-y-auto space-y-0.5 pr-1">
                <NuxtLink
                  v-for="c in navCats?.categories || []"
                  :key="c.slug"
                  :to="`${productsHref}/${c.slug}`"
                  class="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-muted hover:bg-border/40 hover:text-primary transition-colors"
                  @click="productsOpen = false"
                >
                  <span class="truncate">
                    {{ locale === 'ar' ? c.nameAr : c.nameEn }}
                    <span v-if="c.isVip" class="ms-1 rounded bg-accent/20 px-1 text-[10px] font-bold text-accent">VIP</span>
                  </span>
                  <span class="text-[10px] font-mono text-muted group-hover:text-muted">→</span>
                </NuxtLink>
              </div>
            </div>
          </div>
        </li>
      </ul>

      <!-- Action Utilities (Language, Theme, Cart) -->
      <div class="hidden items-center gap-2 md:flex">
        <!-- Language Switcher -->
        <button
          type="button"
          :aria-label="t('common.toggleLanguage')"
          :title="t('common.toggleLanguage')"
          class="inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-bold active:scale-95 transition-all"
          :class="iconBtn()"
          @click="toggleLocale"
        >
          <Globe class="h-3.5 w-3.5" aria-hidden="true" />
          <span>{{ locale === 'ar' ? 'English' : 'العربية' }}</span>
        </button>

        <div class="h-4 w-px bg-border mx-0.5" />

        <!-- Search Icon Trigger (Desktop) -->
        <button
          type="button"
          :aria-label="locale === 'ar' ? 'بحث' : 'Search'"
          :title="locale === 'ar' ? 'ابحث عن منتج' : 'Search products'"
          class="inline-flex h-9 w-9 items-center justify-center rounded-lg border active:scale-95 transition-all"
          :class="iconBtn(searchBarOpen)"
          @click="toggleSearchBar"
        >
          <X v-if="searchBarOpen" class="h-4 w-4" aria-hidden="true" />
          <Search v-else class="h-4 w-4" aria-hidden="true" />
        </button>

        <!-- Shopping Cart Button -->
        <NuxtLink
          :to="localePath('/cart')"
          :aria-label="t('nav.cart')"
          class="relative inline-flex h-9 items-center gap-1.5 rounded-full bg-accent px-3.5 text-xs font-bold text-on-accent shadow-xs hover:bg-accent-hover active:scale-95 transition-all"
        >
          <ShoppingCart class="h-4 w-4" aria-hidden="true" />
          <span class="hidden lg:inline">{{ t('nav.cart') }}</span>
          <span
            v-if="cartStore.itemCount"
            class="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#F5F5F5] px-1 text-[11px] font-black text-[#111111] shadow-xs"
          >
            {{ cartStore.itemCount }}
          </span>
        </NuxtLink>

        <!-- Admin Login / Dashboard Button -->
        <NuxtLink
          v-if="isAdminLoggedIn"
          :to="localePath('/admin')"
          :aria-label="t('nav.dashboard')"
          :title="t('nav.dashboard')"
          class="inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-bold active:scale-95 transition-all"
          :class="iconBtn()"
        >
          <LayoutDashboard class="h-3.5 w-3.5" aria-hidden="true" />
          <span class="hidden lg:inline">{{ t('nav.dashboard') }}</span>
        </NuxtLink>
        <NuxtLink
          v-else
          :to="localePath('/admin/login')"
          :aria-label="t('nav.login')"
          :title="t('nav.login')"
          class="inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-bold active:scale-95 transition-all"
          :class="iconBtn()"
        >
          <LogIn class="h-3.5 w-3.5" aria-hidden="true" />
          <span class="hidden lg:inline">{{ t('nav.login') }}</span>
        </NuxtLink>
      </div>

      <!-- Mobile Actions -->
      <div class="flex items-center gap-2 md:hidden">
        <!-- Search Trigger (Mobile) -->
        <button
          type="button"
          class="flex h-10 w-10 items-center justify-center rounded-lg border"
          :class="iconBtn(searchBarOpen)"
          :aria-label="searchBarOpen ? 'Close search' : 'Open search'"
          @click="toggleSearchBar"
        >
          <X v-if="searchBarOpen" class="h-5 w-5" aria-hidden="true" />
          <Search v-else class="h-5 w-5" aria-hidden="true" />
        </button>

        <NuxtLink
          :to="localePath('/cart')"
          :aria-label="t('nav.cart')"
          class="relative flex h-10 w-10 items-center justify-center rounded-lg border"
          :class="iconBtn()"
        >
          <ShoppingCart class="h-5 w-5" aria-hidden="true" />
          <span
            v-if="cartStore.itemCount"
            class="absolute -end-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-black text-on-accent shadow-xs"
          >
            {{ cartStore.itemCount }}
          </span>
        </NuxtLink>

        <NuxtLink
          v-if="isAdminLoggedIn"
          :to="localePath('/admin')"
          :aria-label="t('nav.dashboard')"
          class="flex h-10 w-10 items-center justify-center rounded-lg border"
          :class="iconBtn()"
          @click="mobileOpen = false"
        >
          <LayoutDashboard class="h-5 w-5" aria-hidden="true" />
        </NuxtLink>
        <NuxtLink
          v-else
          :to="localePath('/admin/login')"
          :aria-label="t('nav.login')"
          class="flex h-10 w-10 items-center justify-center rounded-lg border"
          :class="iconBtn()"
          @click="mobileOpen = false"
        >
          <LogIn class="h-5 w-5" aria-hidden="true" />
        </NuxtLink>

        <button
          type="button"
          class="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-muted"
          :aria-label="mobileOpen ? 'Close menu' : 'Open menu'"
          :aria-expanded="mobileOpen"
          @click="mobileOpen = !mobileOpen"
        >
          <X v-if="mobileOpen" class="h-5 w-5" aria-hidden="true" />
          <Menu v-else class="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </nav>

    <!-- Dimmed Backdrop Overlay (Closes search on tap, prevents background scrolling) -->
    <Transition
      enter-active-class="transition-opacity duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="searchBarOpen"
        class="fixed inset-0 top-16 z-30 bg-[#111111]/60 backdrop-blur-xs transition-opacity"
        aria-hidden="true"
        @click="closeSearchBar"
      />
    </Transition>

    <!-- Slide-down Search Bar Panel (Full Width, 56px input, Dropdown, Category Pills) -->
    <Transition
      enter-active-class="transition duration-300 ease-out transform"
      enter-from-class="-translate-y-4 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in transform"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="-translate-y-4 opacity-0"
    >
      <div
        v-if="searchBarOpen"
        class="relative z-40 border-t border-border bg-surface shadow-2xl py-3.5 px-3 sm:py-6 sm:px-6 transition-colors"
        :style="{ borderColor: 'var(--color-border)' }"
      >
        <div class="mx-auto w-full max-w-[720px]">
          <!-- Label above & Close Trigger -->
          <div class="mb-2 flex items-center justify-between">
            <span class="text-xs sm:text-base font-semibold text-muted">
              {{ locale === 'ar' ? 'ابحث عن منتج' : 'Search for a product' }}
            </span>
            <button
              type="button"
              class="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted hover:bg-border/40 hover:text-text transition-colors"
              @click="closeSearchBar"
            >
              <span class="hidden sm:inline">{{ locale === 'ar' ? 'إغلاق (Esc)' : 'Close (Esc)' }}</span>
              <span class="sm:hidden">{{ locale === 'ar' ? 'إغلاق' : 'Close' }}</span>
              <X class="h-3.5 w-3.5" />
            </button>
          </div>

          <!-- Search Bar (Height 48px mobile, 56px desktop, 2px border, rounded-xl) -->
          <div class="relative">
            <form
              class="relative flex h-12 sm:h-14 w-full items-center rounded-xl border-2 bg-surface p-1 sm:p-1.5 transition-all duration-200"
              :class="isSearchFocused ? 'border-primary bg-surface ring-4 ring-primary/10' : 'border-border'"
              @submit.prevent="submitNavSearch"
            >
              <!-- Search Icon (Right side in RTL) -->
              <div class="flex h-full w-9 sm:w-11 shrink-0 items-center justify-center text-primary">
                <Loader2 v-if="searchLoading" class="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                <Search v-else class="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              </div>

              <!-- Input (with mobile-native search keyboard hints) -->
              <input
                ref="searchInputRef"
                v-model="searchQuery"
                type="search"
                inputmode="search"
                enterkeyhint="search"
                autocapitalize="none"
                autocorrect="off"
                spellcheck="false"
                autocomplete="off"
                :placeholder="locale === 'ar' ? 'ابحث بالاسم أو رقم الموديل أو الكلمة...' : 'Search by name, part number, or keyword...'"
                class="h-full flex-1 bg-transparent px-1.5 sm:px-2 text-xs sm:text-sm text-text placeholder:text-muted focus:outline-none"
                @focus="isSearchFocused = true"
                @blur="setTimeout(() => { isSearchFocused = false }, 200)"
              />

              <!-- Clear button (×) when typing -->
              <button
                v-if="searchQuery"
                type="button"
                class="me-1 flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-border/40 hover:text-text shrink-0 active:scale-90 transition-transform"
                :aria-label="locale === 'ar' ? 'مسح البحث' : 'Clear search'"
                @click="searchQuery = ''; searchResults = []; searchInputRef?.focus()"
              >
                <X class="h-3.5 w-3.5" />
              </button>

              <!-- Yellow submit button (Left side in RTL) -->
              <button
                type="submit"
                class="h-9 sm:h-11 shrink-0 rounded-lg bg-accent px-3.5 sm:px-6 text-xs sm:text-sm font-bold text-on-accent shadow-xs hover:bg-accent-hover active:scale-95 transition-all"
              >
                {{ locale === 'ar' ? 'بحث' : 'Search' }}
              </button>
            </form>

            <!-- Autocomplete Results Dropdown (Mobile-Optimized Touch Scroll) -->
            <div
              v-if="searchQuery.trim()"
              class="absolute top-full z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
            >
              <div
                v-if="searchResults.length"
                class="max-h-[min(58vh,380px)] overflow-y-auto divide-y divide-border [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]"
              >
                <NuxtLink
                  v-for="item in searchResults"
                  :key="item.id"
                  :to="localePath(`/p/${item.slug}`)"
                  class="flex items-center justify-between gap-3 p-2.5 sm:p-3 hover:bg-border/30 active:bg-border/50 transition-colors"
                  @click="closeSearchBar"
                >
                  <div class="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div class="h-11 w-11 sm:h-10 sm:w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-border/40 flex items-center justify-center">
                      <img
                        v-if="item.coverImage"
                        :src="item.coverImage"
                        :alt="locale === 'ar' ? item.nameAr : item.nameEn"
                        class="h-full w-full object-cover"
                        loading="lazy"
                      />
                      <Boxes v-else class="h-4 w-4 text-muted" />
                    </div>
                    <div class="min-w-0">
                      <p class="font-semibold text-xs sm:text-sm text-text truncate">
                        {{ locale === 'ar' ? item.nameAr : item.nameEn }}
                      </p>
                      <span v-if="item.category" class="inline-block text-[10px] font-medium text-muted">
                        {{ locale === 'ar' ? item.category.nameAr : item.category.nameEn }}
                      </span>
                    </div>
                  </div>

                  <div class="text-end shrink-0">
                    <span class="font-mono text-xs sm:text-sm font-bold text-primary">
                      {{ money(item.price) }}
                    </span>
                    <span v-if="item.compareAtPrice" class="block text-[10px] text-muted line-through">
                      {{ money(item.compareAtPrice) }}
                    </span>
                  </div>
                </NuxtLink>

                <!-- View All Link (Touch Friendly 44px target) -->
                <NuxtLink
                  :to="localePath(`/products?search=${encodeURIComponent(searchQuery.trim())}`)"
                  class="flex h-11 items-center justify-center gap-1.5 p-3 text-xs font-bold text-primary bg-surface hover:bg-border/30 active:bg-border/50 transition-colors"
                  @click="closeSearchBar"
                >
                  <span>{{ locale === 'ar' ? `عرض كل النتائج (${searchTotalMatches})` : `View all results (${searchTotalMatches})` }}</span>
                  <ArrowLeft class="h-3.5 w-3.5 rtl:rotate-180" />
                </NuxtLink>
              </div>

              <!-- No Results State -->
              <div v-else-if="!searchLoading" class="p-6 text-center">
                <p class="text-xs sm:text-sm text-muted mb-2">
                  {{ locale === 'ar' ? `لا توجد نتائج لـ "${searchQuery}"` : `No results found for "${searchQuery}"` }}
                </p>
                <NuxtLink
                  :to="localePath('/products')"
                  class="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                  @click="closeSearchBar"
                >
                  <span>{{ locale === 'ar' ? 'تصفح كل المنتجات' : 'Browse all products' }}</span>
                  <ArrowLeft class="h-3 w-3 rtl:rotate-180" />
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Mobile Drawer Menu -->
    <div
      v-if="mobileOpen"
      class="border-t border-border bg-surface px-4 py-4 md:hidden shadow-2xl transition-all"
      :style="{ borderColor: 'var(--color-border)' }"
    >
      <ul class="flex flex-col gap-1.5">
        <li>
          <NuxtLink
            :to="localePath('/')"
            class="block rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-colors"
            :class="solidLink(isActiveRoute(localePath('/'), true))"
            @click="mobileOpen = false"
          >
            {{ t('nav.home') }}
          </NuxtLink>
        </li>
        <li class="overflow-hidden rounded-lg">
          <div
            class="flex items-center justify-between rounded-lg transition-colors"
            :class="solidLink(isProductsActive)"
          >
            <NuxtLink
              :to="productsHref"
              class="flex-1 px-3.5 py-2.5 text-sm font-semibold"
              @click="mobileOpen = false"
            >
              {{ t('nav.products') }}
            </NuxtLink>
            <button
              type="button"
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              :aria-label="mobileProductsOpen ? 'Collapse products' : 'Expand products'"
              :aria-expanded="mobileProductsOpen"
              @click="mobileProductsOpen = !mobileProductsOpen"
            >
              <ChevronDown
                class="h-4 w-4 transition-transform duration-200"
                :class="mobileProductsOpen ? 'rotate-180' : ''"
                aria-hidden="true"
              />
            </button>
          </div>
          <div
            v-if="mobileProductsOpen"
            class="mt-1 space-y-0.5 rounded-lg border border-border bg-surface p-1.5"
          >
            <NuxtLink
              :to="productsHref"
              class="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-primary hover:bg-primary/10 transition-colors"
              @click="mobileOpen = false"
            >
              <Boxes class="h-4 w-4" aria-hidden="true" />
              <span>{{ t('nav.allProducts') }}</span>
            </NuxtLink>
            <div class="mx-3 border-t border-border" />
            <NuxtLink
              v-for="c in navCats?.categories || []"
              :key="c.slug"
              :to="`${productsHref}/${c.slug}`"
              class="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-muted hover:bg-border/40 hover:text-primary transition-colors"
              @click="mobileOpen = false"
            >
              <span class="truncate">
                {{ locale === 'ar' ? c.nameAr : c.nameEn }}
                <span v-if="c.isVip" class="ms-1 rounded bg-accent/20 px-1 text-[10px] font-bold text-accent">VIP</span>
              </span>
              <span class="text-[10px] font-mono" aria-hidden="true">→</span>
            </NuxtLink>
          </div>
        </li>
        <li>
          <NuxtLink
            v-if="isAdminLoggedIn"
            :to="localePath('/admin')"
            class="flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-colors"
            :class="solidLink(isActiveRoute(localePath('/admin')))"
            @click="mobileOpen = false"
          >
            <LayoutDashboard class="h-4 w-4" aria-hidden="true" />
            <span>{{ t('nav.dashboard') }}</span>
          </NuxtLink>
          <NuxtLink
            v-else
            :to="localePath('/admin/login')"
            class="flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-colors"
            :class="solidLink(isActiveRoute(localePath('/admin/login')))"
            @click="mobileOpen = false"
          >
            <LogIn class="h-4 w-4" aria-hidden="true" />
            <span>{{ t('nav.login') }}</span>
          </NuxtLink>
        </li>
      </ul>

      <!-- Mobile Language Toggle -->
      <div class="mt-4 flex items-center gap-2 border-t border-border pt-3.5">
        <button
          type="button"
          class="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-bold"
          :class="iconBtn()"
          @click="toggleLocale"
        >
          <Globe class="h-4 w-4" aria-hidden="true" />
          <span>{{ locale === 'ar' ? 'English' : 'العربية' }}</span>
        </button>
      </div>
    </div>
  </header>
</template>
