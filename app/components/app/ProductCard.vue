<script setup lang="ts">
import { Check, ShoppingBag } from 'lucide-vue-next'

interface Card {
  id?: string
  slug: string
  nameAr: string
  nameEn: string
  price: string | number
  compareAtPrice: string | number | null
  coverImage: string | null
  category: { slug: string, nameAr: string, nameEn: string }
}

const props = defineProps<{ product: Card }>()

const { locale, t } = useI18n()
const { money } = useMoney()
const localePath = useLocalePath()
const cartStore = useCartStore()

const name = (p: Card) => (locale.value === 'ar' ? p.nameAr : p.nameEn)
const added = ref(false)

const discountPercent = computed(() => {
  const price = Number(props.product.price)
  const compare = Number(props.product.compareAtPrice)
  if (!compare || !Number.isFinite(price) || !Number.isFinite(compare)) return 0
  if (!(compare > price)) return 0
  return Math.round(((compare - price) / compare) * 100)
})

function onAddToCart() {
  cartStore.addItem({
    productId: props.product.id || props.product.slug,
    slug: props.product.slug,
    nameAr: props.product.nameAr,
    nameEn: props.product.nameEn,
    price: Number(props.product.price),
    coverImage: props.product.coverImage || null,
    quantity: 1,
  })
  added.value = true
  setTimeout(() => {
    added.value = false
  }, 2000)
}
</script>

<template>
  <article class="group flex h-full flex-col">
    <NuxtLink :to="localePath(`/p/${product.slug}`)" class="block focus-visible:outline-none">
      <div class="relative aspect-[4/5] overflow-hidden bg-[#F7F7F7]">
        <img
          v-if="product.coverImage"
          :src="product.coverImage"
          :alt="name(product)"
          class="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
          loading="lazy"
        />
        <div v-else class="flex h-full w-full items-center justify-center text-xs font-medium text-black/30">
          {{ t('common.noImage') }}
        </div>

        <span
          v-if="discountPercent > 0"
          class="absolute start-3 top-3 bg-ultra-500 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white"
        >
          {{ locale === 'ar' ? `خصم ${discountPercent}%` : `-${discountPercent}%` }}
        </span>
      </div>

      <div class="pt-3">
        <p v-if="product.category" class="eyebrow !text-black/55">
          {{ locale === 'ar' ? product.category.nameAr : product.category.nameEn }}
        </p>
        <h3 class="mt-1.5 line-clamp-2 font-heading text-sm font-medium leading-snug text-black transition-colors group-hover:text-ultra-600 sm:text-[15px]">
          {{ name(product) }}
        </h3>
        <div class="mt-2 flex flex-wrap items-baseline gap-2">
          <span class="text-sm font-semibold text-black">{{ money(product.price) }}</span>
          <span v-if="product.compareAtPrice" class="text-xs text-black/55 line-through">{{ money(product.compareAtPrice) }}</span>
        </div>
      </div>
    </NuxtLink>

    <button
      type="button"
      class="mt-3 inline-flex min-h-10 items-center justify-center gap-2 border border-black/15 px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-black transition-colors hover:border-black hover:bg-black hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ultra-500"
      :class="added ? 'border-ultra-500 bg-ultra-500 text-white' : ''"
      @click="onAddToCart"
    >
      <Check v-if="added" class="h-3.5 w-3.5" aria-hidden="true" />
      <ShoppingBag v-else class="h-3.5 w-3.5" aria-hidden="true" />
      <span>
        {{ added
          ? (locale === 'ar' ? 'تمت الإضافة' : 'Added')
          : (locale === 'ar' ? 'إضافة للسلة' : 'Add to cart') }}
      </span>
    </button>
  </article>
</template>
