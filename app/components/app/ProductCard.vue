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
  category?: { slug: string, nameAr: string, nameEn: string } | null
}

const props = defineProps<{ product: Card }>()

const { locale, t } = useI18n()
const { money } = useMoney()
const localePath = useLocalePath()
const cartStore = useCartStore()

const name = computed(() => (locale.value === 'ar' ? props.product.nameAr : props.product.nameEn))
const specLine = computed(() => (
  props.product.category
    ? (locale.value === 'ar' ? props.product.category.nameAr : props.product.category.nameEn)
    : (locale.value === 'ar' ? 'متجر Ultra' : 'Ultra Store')
))
const added = ref(false)

const discountPercent = computed(() => {
  const price = Number(props.product.price)
  const compare = Number(props.product.compareAtPrice)
  if (!compare || !Number.isFinite(price) || !Number.isFinite(compare)) return 0
  return Math.max(0, Math.round(((compare - price) / compare) * 100))
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
    <NuxtLink :to="localePath(`/p/${props.product.slug}`)" class="block focus-visible:outline-none">
      <div class="relative aspect-[4/5] overflow-hidden rounded-lg bg-[#F7F7F7]">
        <img
          v-if="props.product.coverImage"
          :src="props.product.coverImage"
          :alt="name"
          class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-104"
          loading="lazy"
        />
        <div v-else class="flex h-full w-full items-center justify-center text-[32px] font-black leading-none text-black/15">
          U
        </div>

        <span
          v-if="discountPercent > 0"
          class="absolute start-3 top-3 rounded-sm bg-brand-red px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white"
        >
          {{ locale === 'ar' ? `خصم ${discountPercent}%` : `${discountPercent}% OFF` }}
        </span>
      </div>

      <div class="flex min-w-0 flex-col pt-3">
        <p v-if="specLine" class="text-[14px] leading-5 text-[#5A5A5A]">{{ specLine }}</p>
        <h3 class="mt-1 line-clamp-2 font-heading text-[16px] font-semibold leading-snug text-black transition-colors group-hover:text-brand-red">
          {{ name }}
        </h3>
        <div class="mt-2 flex flex-wrap items-baseline gap-2">
          <span class="font-heading text-[18px] font-bold text-black">{{ money(props.product.price) }}</span>
          <span
            v-if="props.product.compareAtPrice"
            class="text-sm text-black/45 line-through"
          >
            {{ money(props.product.compareAtPrice) }}
          </span>
        </div>
      </div>
    </NuxtLink>

    <div class="mt-3">
      <button
        type="button"
        class="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-sm border-2 border-black bg-transparent px-3 text-[12px] font-bold uppercase tracking-[0.13em] text-black transition-colors hover:bg-black hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red"
        @click="onAddToCart"
      >
        <Check v-if="added" class="h-3.5 w-3.5" aria-hidden="true" />
        <ShoppingBag v-else class="h-3.5 w-3.5" aria-hidden="true" />
        <span>{{ added ? (locale === 'ar' ? 'أُضيف إلى السلة' : 'Added') : (locale === 'ar' ? 'أضف للسلة' : 'Add to cart') }}</span>
      </button>
    </div>
  </article>
</template>
