<script setup lang="ts">
import { ChevronDown, ChevronUp, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-vue-next'

const props = defineProps<{ 
  categorySlug?: string
}>()

const { t, locale } = useI18n()
const { currencyLabel } = useMoney()
const localePath = useLocalePath()
const route = useRoute()
const router = useRouter()

const search = ref(String(route.query.search || ''))
const minPrice = ref(String(route.query.minPrice || ''))
const maxPrice = ref(String(route.query.maxPrice || ''))
const sort = ref(String(route.query.sort || ''))
const page = ref(Number(route.query.page) || 1)
const mobileFilters = ref(false)

watch(mobileFilters, (open) => {
  if (typeof document !== 'undefined') document.body.classList.toggle('overflow-hidden', open)
})

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') document.body.classList.remove('overflow-hidden')
})

// Dynamic multi-attribute selections: { [key: string]: string[] }
const selectedAttributes = ref<Record<string, string[]>>({})

// Track which attribute groups are collapsed/expanded
const expandedAttrGroups = ref<Record<string, boolean>>({})

function initAttributesFromQuery() {
  const map: Record<string, string[]> = {}
  try {
    const raw = String(route.query.attributes || '[]')
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (item.key && item.value) {
          const k = String(item.key)
          const v = String(item.value)
          if (!map[k]) map[k] = []
          if (!map[k].includes(v)) map[k].push(v)
        }
      }
    }
  }
  catch { /* ignore */ }
  selectedAttributes.value = map
}

initAttributesFromQuery()

// Fetch available categories
const { data: catData } = await useAsyncData('catalog-categories', () =>
  $fetch<{ categories: { slug: string, nameAr: string, nameEn: string, _count?: { products: number } }[] }>('/api/categories'),
)

// Fetch store settings for pagination limit
const requestFetch = useRequestFetch()

const { data: storeSettings } = await useAsyncData('catalog-store-settings', () =>
  requestFetch<{ productsPerPage: number }>('/api/settings/store'),
  { server: true, lazy: true },
)

const limit = computed(() => storeSettings.value?.productsPerPage || 16)

// Dynamic Facets Endpoint: provides real minPrice, maxPrice, and category-scoped attributes with counts
const { data: facetsData } = await useAsyncData(
  () => `catalog-facets-${props.categorySlug || 'all'}-${search.value.trim()}`,
  () => requestFetch<{
    minPrice: number
    maxPrice: number
    attributes: { keyEn: string, keyAr: string, values: { valueEn: string, valueAr: string, count: number }[] }[]
  }>(`/api/products/facets?${new URLSearchParams({
    ...(props.categorySlug ? { category: props.categorySlug } : {}),
    ...(search.value.trim() ? { search: search.value.trim() } : {}),
  })}`),
  { watch: [() => props.categorySlug] },
)

const attributesParam = computed(() => {
  const list: { key: string, value: string }[] = []
  for (const [key, vals] of Object.entries(selectedAttributes.value)) {
    for (const val of vals) {
      list.push({ key, value: val })
    }
  }
  return list.length ? JSON.stringify(list) : ''
})

const query = computed(() => {
  const q: Record<string, string> = {
    page: String(page.value),
    limit: String(limit.value),
    sort: sort.value,
    search: search.value.trim(),
    minPrice: minPrice.value,
    maxPrice: maxPrice.value,
  }
  if (props.categorySlug) q.category = props.categorySlug
  if (attributesParam.value) q.attributes = attributesParam.value

  const clean: Record<string, string> = {}
  for (const [k, v] of Object.entries(q)) if (v) clean[k] = v
  return clean
})

interface ProductCard {
  id: string
  slug: string
  nameAr: string
  nameEn: string
  price: number
  compareAtPrice: number | null
  coverImage: string | null
  category: { slug: string, nameAr: string, nameEn: string }
}

interface ProductGridResponse {
  products: ProductCard[]
  total: number
  pages: number
}

const { data, pending } = await useAsyncData<ProductGridResponse>(
  () => `catalog-${props.categorySlug || 'all'}-${JSON.stringify(query.value)}`,
  () => requestFetch<ProductGridResponse>(`/api/products?${new URLSearchParams(query.value)}`),
  { watch: [query] },
)

const hasActiveFilters = computed(() => {
  const hasAttr = Object.values(selectedAttributes.value).some(arr => arr.length > 0)
  return !!(search.value.trim() || minPrice.value || maxPrice.value || hasAttr || sort.value)
})

const resultCountText = computed(() => {
  if (!data.value) return ''
  const total = data.value.total
  if (total === 0) return locale.value === 'ar' ? 'لا توجد نتائج' : 'No results found'
  const start = (page.value - 1) * limit.value + 1
  const end = Math.min(page.value * limit.value, total)
  return locale.value === 'ar'
    ? `عرض ${start} - ${end} من إجمالي ${total} منتج`
    : `Showing ${start} - ${end} of ${total} products`
})

function isAttrSelected(key: string, val: string): boolean {
  return selectedAttributes.value[key]?.includes(val) || false
}

function toggleAttr(key: string, val: string) {
  const current = selectedAttributes.value[key] || []
  if (current.includes(val)) {
    selectedAttributes.value[key] = current.filter(v => v !== val)
    if (!selectedAttributes.value[key].length) {
      delete selectedAttributes.value[key]
    }
  }
  else {
    selectedAttributes.value[key] = [...current, val]
  }
  apply()
}

function isGroupOpen(key: string): boolean {
  return expandedAttrGroups.value[key] !== false
}

function toggleGroup(key: string) {
  expandedAttrGroups.value[key] = !isGroupOpen(key)
}

async function apply() {
  page.value = 1
  mobileFilters.value = false
  await router.replace({ query: { ...route.query, ...query.value, page: undefined } })
}

async function resetFilters() {
  search.value = ''
  minPrice.value = ''
  maxPrice.value = ''
  sort.value = ''
  selectedAttributes.value = {}
  page.value = 1
  mobileFilters.value = false
  await router.replace({ query: {} })
}

async function gotoPage(p: number) {
  page.value = p
  await router.replace({ query: { ...route.query, page: p > 1 ? String(p) : undefined } })
  if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
}

watch(() => props.categorySlug, () => {
  page.value = 1
  selectedAttributes.value = {}
  initAttributesFromQuery()
})

watch(() => route.query.page, (qp) => {
  const next = Number(qp) || 1
  if (next !== page.value) page.value = next
})

watch(() => route.query, (newQ) => {
  if (newQ.minPrice !== undefined) minPrice.value = String(newQ.minPrice)
  if (newQ.maxPrice !== undefined) maxPrice.value = String(newQ.maxPrice)
  if (newQ.search !== undefined) search.value = String(newQ.search)
  if (newQ.sort !== undefined) sort.value = String(newQ.sort)
  initAttributesFromQuery()
})
</script>
<template>
  <div class="container-editorial py-8 sm:py-10">
    <div class="flex flex-col gap-5 border-b border-black/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p class="eyebrow">{{ categorySlug ? (locale === 'ar' ? 'مجموعة' : 'Collection') : (locale === 'ar' ? 'الكتالوج' : 'Catalog') }}</p>
        <p class="mt-1 text-xs text-black/60">{{ resultCountText }}</p>
      </div>

      <div class="flex flex-wrap items-center gap-2.5">
        <div class="relative w-full sm:w-64">
          <Search class="pointer-events-none absolute start-0 top-1/2 h-4 w-4 -translate-y-1/2 text-black/55" aria-hidden="true" />
          <input
            v-model="search"
            type="search"
            :placeholder="t('products.search')"
            :aria-label="t('products.search')"
            class="h-10 w-full border-b border-black/20 bg-transparent ps-6 pe-2 text-sm text-black placeholder:text-black/35 focus:border-black focus:outline-none"
            @keyup.enter="apply"
          />
        </div>

        <select
          v-model="sort"
          class="h-10 border-b border-black/20 bg-transparent px-1 text-xs font-semibold uppercase tracking-[0.1em] text-black focus:border-black focus:outline-none"
          :aria-label="locale === 'ar' ? 'ترتيب المنتجات' : 'Sort products'"
          @change="apply"
        >
          <option value="">{{ t('products.sortDefault') }}</option>
          <option value="price_asc">{{ t('products.sortPriceAsc') }}</option>
          <option value="price_desc">{{ t('products.sortPriceDesc') }}</option>
          <option value="newest">{{ t('products.sortNewest') }}</option>
        </select>

        <button type="button" class="btn-dark h-10 min-h-10 px-4 text-[11px]" @click="apply">
          {{ t('common.apply') }}
        </button>

        <button
          type="button"
          class="inline-flex h-10 items-center gap-1.5 border border-black/20 px-3 text-xs font-semibold text-black md:hidden"
          :aria-expanded="mobileFilters"
          aria-controls="mobile-filters"
          @click="mobileFilters = true"
        >
          <SlidersHorizontal class="h-3.5 w-3.5" aria-hidden="true" />
          <span>{{ t('products.filters') }}</span>
        </button>

        <button
          v-if="hasActiveFilters"
          type="button"
          class="inline-flex h-10 items-center gap-1 px-2 text-xs font-medium text-black/60 transition-colors hover:text-ultra-600"
          :title="locale === 'ar' ? 'إعادة ضبط الفلاتر' : 'Reset filters'"
          @click="resetFilters"
        >
          <RotateCcw class="h-3.5 w-3.5" aria-hidden="true" />
          <span class="hidden sm:inline">{{ locale === 'ar' ? 'إلغاء' : 'Reset' }}</span>
        </button>
      </div>
    </div>

    <div class="mt-8 flex flex-col items-start gap-8 md:flex-row lg:gap-12">
      <aside class="hidden w-52 shrink-0 md:sticky md:top-24 md:block md:max-h-[calc(100vh-7rem)] md:overflow-y-auto md:pe-2 lg:w-60">
        <div class="border-t border-black/10 pt-5">
          <div class="mb-3 flex items-center justify-between">
            <h2 class="eyebrow">{{ t('products.category') }}</h2>
            <NuxtLink v-if="categorySlug" :to="localePath('/products')" class="text-[11px] font-semibold text-black/60 hover:text-ultra-600">
              {{ locale === 'ar' ? 'الكل' : 'All' }}
            </NuxtLink>
          </div>
          <ul class="space-y-1">
            <li v-for="c in catData?.categories || []" :key="c.slug">
              <NuxtLink
                :to="localePath(`/products/${c.slug}`)"
                class="flex items-center justify-between py-1.5 text-sm transition-colors"
                :class="(categorySlug === c.slug || route.params.slug === c.slug)
                  ? 'font-semibold text-ultra-600'
                  : 'text-black/60 hover:text-black'"
              >
                <span class="truncate">{{ locale === 'ar' ? c.nameAr : c.nameEn }}</span>
                <span v-if="c._count?.products" class="font-mono text-[10px] text-black/35">{{ c._count.products }}</span>
              </NuxtLink>
            </li>
          </ul>
        </div>

        <div class="mt-7 border-t border-black/10 pt-5">
          <h2 class="eyebrow">{{ t('products.priceRange') }}</h2>
          <div class="mt-3 flex items-center gap-2">
            <input
              v-model="minPrice"
              type="number"
              min="0"
              :placeholder="facetsData?.minPrice !== undefined ? String(facetsData.minPrice) : t('products.min')"
              class="h-9 w-full border-b border-black/20 bg-transparent px-0 text-sm text-black placeholder:text-black/30 focus:border-black focus:outline-none"
              :aria-label="t('products.min')"
              @keyup.enter="apply"
            />
            <span class="text-black/30">—</span>
            <input
              v-model="maxPrice"
              type="number"
              min="0"
              :placeholder="facetsData?.maxPrice !== undefined ? String(facetsData.maxPrice) : t('products.max')"
              class="h-9 w-full border-b border-black/20 bg-transparent px-0 text-sm text-black placeholder:text-black/30 focus:border-black focus:outline-none"
              :aria-label="t('products.max')"
              @keyup.enter="apply"
            />
          </div>
          <p v-if="facetsData" class="mt-2 font-mono text-[10px] text-black/35">
            {{ facetsData.minPrice }} — {{ facetsData.maxPrice }} {{ currencyLabel }}
          </p>
        </div>

        <div v-if="facetsData?.attributes?.length" class="mt-7 border-t border-black/10 pt-5">
          <div v-for="attr in facetsData.attributes" :key="attr.keyEn" class="mb-5 last:mb-0">
            <button
              type="button"
              class="mb-2 flex w-full items-center justify-between text-start"
              @click="toggleGroup(attr.keyEn)"
            >
              <span class="eyebrow !text-black/60">{{ locale === 'ar' ? attr.keyAr : attr.keyEn }}</span>
              <ChevronUp v-if="isGroupOpen(attr.keyEn)" class="h-3.5 w-3.5 text-black/55" aria-hidden="true" />
              <ChevronDown v-else class="h-3.5 w-3.5 text-black/55" aria-hidden="true" />
            </button>

            <div v-if="isGroupOpen(attr.keyEn)" class="max-h-44 space-y-1 overflow-y-auto">
              <label
                v-for="val in attr.values"
                :key="val.valueEn"
                class="flex cursor-pointer items-center justify-between gap-2 py-0.5 text-xs transition-colors"
                :class="isAttrSelected(attr.keyEn, val.valueEn) ? 'font-semibold text-ultra-600' : 'text-black/60 hover:text-black'"
              >
                <span class="flex min-w-0 items-center gap-2">
                  <input
                    type="checkbox"
                    :checked="isAttrSelected(attr.keyEn, val.valueEn)"
                    class="h-3.5 w-3.5 rounded-none border-black/30 accent-[#D2312D]"
                    @change="toggleAttr(attr.keyEn, val.valueEn)"
                  />
                  <span class="truncate">{{ locale === 'ar' ? val.valueAr : val.valueEn }}</span>
                </span>
                <span class="shrink-0 font-mono text-[10px] text-black/35">{{ val.count }}</span>
              </label>
            </div>
          </div>
        </div>

        <div class="mt-7 border-t border-black/10 pt-5">
          <button type="button" class="btn-dark h-10 min-h-10 w-full text-[11px]" @click="apply">
            {{ t('products.applyFilters') }}
          </button>
        </div>
      </aside>

      <div class="min-w-0 flex-1">
        <div v-if="pending" class="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-3 xl:grid-cols-4" aria-label="Loading catalog">
          <div v-for="i in 8" :key="i">
            <div class="aspect-[4/5] animate-pulse bg-black/[0.04]" />
            <div class="mt-3 h-3 w-1/2 animate-pulse bg-black/[0.06]" />
            <div class="mt-2 h-4 w-3/4 animate-pulse bg-black/[0.06]" />
            <div class="mt-2 h-4 w-1/3 animate-pulse bg-black/[0.06]" />
          </div>
        </div>

        <div v-else-if="data?.products?.length" class="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-3 xl:grid-cols-4">
          <AppProductCard v-for="p in data.products" :key="p.slug" :product="p" />
        </div>

        <div v-else class="border border-black/10 px-6 py-20 text-center">
          <Search class="mx-auto h-7 w-7 text-black/20" aria-hidden="true" />
          <h3 class="mt-4 font-heading text-xl font-semibold text-black">{{ t('products.noResults') }}</h3>
          <p class="mx-auto mt-2 max-w-sm text-sm leading-6 text-black/60">{{ t('products.noResultsHint') }}</p>
          <button type="button" class="btn-outline mt-6" @click="resetFilters">
            {{ locale === 'ar' ? 'عرض كل المنتجات' : 'Browse all products' }}
          </button>
        </div>

        <AppPagination v-if="data && data.pages > 1" :page="page" :pages="data.pages" @change="gotoPage" />
      </div>
    </div>

    <Teleport to="body">
      <div v-if="mobileFilters" id="mobile-filters" class="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true" aria-label="Product filters">
        <div class="fixed inset-0 bg-black/50" aria-hidden="true" @click="mobileFilters = false" />
        <div class="relative ms-auto flex h-full w-full max-w-sm flex-col bg-white shadow-2xl">
          <div class="flex h-16 items-center justify-between border-b border-black/10 px-5">
            <h2 class="font-heading text-sm font-semibold uppercase tracking-[0.12em] text-black">{{ t('products.filters') }}</h2>
            <button type="button" class="flex h-10 w-10 items-center justify-center text-black" :aria-label="locale === 'ar' ? 'إغلاق' : 'Close'" @click="mobileFilters = false">
              <X class="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div class="flex-1 space-y-7 overflow-y-auto px-5 py-6">
            <div>
              <div class="mb-3 flex items-center justify-between">
                <h3 class="eyebrow">{{ t('products.category') }}</h3>
                <NuxtLink v-if="categorySlug" :to="localePath('/products')" class="text-[11px] font-semibold text-black/60" @click="mobileFilters = false">
                  {{ locale === 'ar' ? 'الكل' : 'All' }}
                </NuxtLink>
              </div>
              <ul class="space-y-1">
                <li v-for="c in catData?.categories || []" :key="c.slug">
                  <NuxtLink
                    :to="localePath(`/products/${c.slug}`)"
                    class="flex items-center justify-between py-1.5 text-sm"
                    :class="(categorySlug === c.slug || route.params.slug === c.slug) ? 'font-semibold text-ultra-600' : 'text-black/60'"
                    @click="mobileFilters = false"
                  >
                    <span>{{ locale === 'ar' ? c.nameAr : c.nameEn }}</span>
                    <span v-if="c._count?.products" class="font-mono text-[10px] text-black/35">{{ c._count.products }}</span>
                  </NuxtLink>
                </li>
              </ul>
            </div>

            <div class="border-t border-black/10 pt-6">
              <h3 class="eyebrow">{{ t('products.priceRange') }}</h3>
              <div class="mt-3 flex items-center gap-2">
                <input v-model="minPrice" type="number" min="0" :placeholder="facetsData?.minPrice !== undefined ? String(facetsData.minPrice) : t('products.min')" class="h-9 w-full border-b border-black/20 bg-transparent px-0 text-sm focus:border-black focus:outline-none" @keyup.enter="apply" />
                <span class="text-black/30">—</span>
                <input v-model="maxPrice" type="number" min="0" :placeholder="facetsData?.maxPrice !== undefined ? String(facetsData.maxPrice) : t('products.max')" class="h-9 w-full border-b border-black/20 bg-transparent px-0 text-sm focus:border-black focus:outline-none" @keyup.enter="apply" />
              </div>
            </div>

            <div v-if="facetsData?.attributes?.length" class="border-t border-black/10 pt-6">
              <div v-for="attr in facetsData.attributes" :key="attr.keyEn" class="mb-5 last:mb-0">
                <p class="eyebrow mb-2">{{ locale === 'ar' ? attr.keyAr : attr.keyEn }}</p>
                <div class="max-h-40 space-y-1 overflow-y-auto">
                  <label
                    v-for="val in attr.values"
                    :key="val.valueEn"
                    class="flex items-center justify-between py-0.5 text-xs"
                    :class="isAttrSelected(attr.keyEn, val.valueEn) ? 'font-semibold text-ultra-600' : 'text-black/60'"
                  >
                    <span class="flex items-center gap-2">
                      <input type="checkbox" :checked="isAttrSelected(attr.keyEn, val.valueEn)" class="h-3.5 w-3.5 rounded-none accent-[#D2312D]" @change="toggleAttr(attr.keyEn, val.valueEn)" />
                      <span>{{ locale === 'ar' ? val.valueAr : val.valueEn }}</span>
                    </span>
                    <span class="font-mono text-[10px] text-black/35">{{ val.count }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div class="border-t border-black/10 p-5">
            <button type="button" class="btn-dark h-11 w-full" @click="apply">{{ t('products.applyFilters') }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
