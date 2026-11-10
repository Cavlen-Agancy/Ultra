<script setup lang="ts">
const { locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const router = useRouter()

type ProductCard = {
  id: string
  slug: string
  nameAr: string
  nameEn: string
  price: number
  compareAtPrice: number | null
  coverImage: string | null
  category?: { slug: string, nameAr: string, nameEn: string } | null
}

type TabValue = 'bestsellers' | 'new-releases' | 'value-sets'

const props = withDefaults(defineProps<{
  products: ProductCard[]
  pending?: boolean
  bestsellersLabel?: string
  newReleasesLabel?: string
  valueSetsLabel?: string
}>(), {
  products: () => [],
  pending: false,
  bestsellersLabel: 'Bestsellers',
  newReleasesLabel: 'New Releases',
  valueSetsLabel: 'Value Sets',
})

const PAGE_SIZE = 6
const rootRef = ref<HTMLElement | null>(null)

const activeTab = ref<TabValue>('bestsellers')

const tabs = computed(() => [
  { value: 'bestsellers' as const, label: props.bestsellersLabel },
  { value: 'new-releases' as const, label: props.newReleasesLabel },
  { value: 'value-sets' as const, label: props.valueSetsLabel },
])

const fullList = computed(() => {
  if (props.pending || !props.products.length) return []
  if (activeTab.value === 'new-releases') return [...props.products].reverse()
  if (activeTab.value === 'value-sets') return [...props.products].slice(0, 6)
  return props.products
})

const pageCount = computed(() => Math.max(1, Math.ceil(fullList.value.length / PAGE_SIZE)))
const showPagination = computed(() => !props.pending && fullList.value.length > PAGE_SIZE)

// ── URL-backed current page (?page=2) ──
function readPageFromQuery(): number {
  const raw = Array.isArray(route.query.page) ? route.query.page[0] : route.query.page
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 1
}

const currentPage = ref(readPageFromQuery())
const safePage = computed(() => Math.min(currentPage.value, pageCount.value))

const pagedProducts = computed(() => {
  const start = (safePage.value - 1) * PAGE_SIZE
  return fullList.value.slice(start, start + PAGE_SIZE)
})

function syncQuery(page: number) {
  const query = { ...route.query }
  if (page <= 1) delete query.page
  else query.page = String(page)
  return router.push({ query })
}

// Keep state in sync with browser back/forward and manual URL edits.
watch(() => route.query.page, () => {
  const next = Math.min(readPageFromQuery(), pageCount.value)
  if (next !== currentPage.value) currentPage.value = next
})

// Clamp when the active tab shrinks the page count (e.g. deep link ?page=5).
watch(pageCount, (total) => {
  if (currentPage.value > total) {
    currentPage.value = total
    const query = { ...route.query }
    if (total <= 1) delete query.page
    else query.page = String(total)
    router.replace({ query })
  }
})

// ── Skeleton swap + scroll on page change ──
const paging = ref(false)
let pagingTimer: ReturnType<typeof setTimeout> | null = null
const showSkeletons = computed(() => props.pending || paging.value)

function startPageTransition() {
  paging.value = true
  if (pagingTimer) clearTimeout(pagingTimer)
  pagingTimer = setTimeout(() => {
    paging.value = false
    pagingTimer = null
  }, 250)
}

onBeforeUnmount(() => {
  if (pagingTimer) clearTimeout(pagingTimer)
})

function scrollToSection() {
  if (typeof window === 'undefined' || !rootRef.value) return
  const top = rootRef.value.getBoundingClientRect().top + window.scrollY - 88
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' })
}

async function goToPage(page: number) {
  const next = Math.min(Math.max(1, page), pageCount.value)
  if (next === safePage.value) return
  currentPage.value = next
  startPageTransition()
  scrollToSection()
  await syncQuery(next)
}

// Tab switch always returns to page 1 and drops the stale ?page param.
function selectTab(tab: TabValue) {
  if (tab === activeTab.value) return
  activeTab.value = tab
  currentPage.value = 1
  if (route.query.page) {
    const query = { ...route.query }
    delete query.page
    router.replace({ query })
  }
}

// Deterministic id: the tabs render once per page, so keep the ARIA wiring stable
// across SSR and client hydration.
const tabsId = 'home-product-tabs'
</script>

<template>
  <div ref="rootRef">
    <div>
      <nav
        class="flex gap-6 overflow-x-auto no-scrollbar"
        role="tablist"
        :aria-label="locale === 'ar' ? 'تصنيفات المنتجات' : 'Product collections'"
      >
        <button
          v-for="(tab, index) in tabs"
          :id="`${tabsId}-tab-${index}`"
          :key="tab.value"
          type="button"
          class="shrink-0 border-b-2 pb-2 text-[16px] leading-none font-medium transition-colors"
          :class="activeTab === tab.value
            ? 'border-brand-red text-brand-red'
            : 'border-transparent text-[#5A5A5A] hover:text-black'"
          :aria-selected="activeTab === tab.value"
          :aria-controls="`${tabsId}-panel-${index}`"
          :aria-current="activeTab === tab.value ? 'true' : undefined"
          role="tab"
          @click="selectTab(tab.value)"
        >
          {{ tab.label }}
        </button>
      </nav>

      <div
        :id="`${tabsId}-panel-${tabs.findIndex(t => t.value === activeTab)}`"
        role="tabpanel"
        :aria-labelledby="`${tabsId}-tab-${tabs.findIndex(t => t.value === activeTab)}`"
      >
        <div
          v-if="showSkeletons"
          class="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-3"
          aria-label="Loading products"
        >
          <AppSkeletonCard v-for="i in 6" :key="i" />
        </div>

        <div
          v-else-if="pagedProducts.length"
          class="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-3"
        >
          <AppProductCard v-for="product in pagedProducts" :key="product.id" :product="product" />
        </div>

        <div v-else class="mt-10 border border-black/10 px-6 py-16 text-center">
          <p class="font-heading text-xl font-semibold text-black">
            {{ locale === 'ar' ? 'لا توجد منتجات بعد' : 'No products yet' }}
          </p>
          <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-[#5A5A5A]">
            {{ locale === 'ar' ? 'أضف المنتجات من لوحة الإدارة لتظهر هنا.' : 'Add products in the admin panel to feature them here.' }}
          </p>
        </div>

        <AppProductPagination
          v-if="showPagination"
          :page="safePage"
          :pages="pageCount"
          @change="goToPage"
        />
      </div>
    </div>

    <div class="mt-10">
      <NuxtLink :to="localePath('/products')" class="btn-outline">
        {{ locale === 'ar' ? 'تسوق الأكثر مبيعاً' : 'Shop bestsellers' }}
      </NuxtLink>
    </div>
  </div>
</template>
