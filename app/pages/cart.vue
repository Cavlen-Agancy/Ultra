<script setup lang="ts">
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-vue-next'

const { t, locale } = useI18n()
const localePath = useLocalePath()
const cart = useCartStore()
const { money } = useMoney()

useHead(() => ({ title: `${t('nav.cart')} | ${t('brand.name')}` }))

const itemName = (item: { nameAr: string, nameEn: string }) => locale.value === 'ar' ? item.nameAr : item.nameEn
</script>

<template>
  <div class="bg-white text-black">
    <div class="container-editorial py-10 sm:py-14">
      <header class="border-b border-black/10 pb-6">
        <p class="eyebrow">{{ locale === 'ar' ? 'حقيبة التسوق' : 'Shopping bag' }}</p>
        <div class="mt-2 flex flex-wrap items-end justify-between gap-4">
          <h1 class="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{{ t('nav.cart') }}</h1>
          <NuxtLink :to="localePath('/products')" class="text-xs font-bold uppercase tracking-[0.14em] text-black link-underline">
            {{ locale === 'ar' ? 'متابعة التسوق' : 'Continue shopping' }}
          </NuxtLink>
        </div>
      </header>

      <div v-if="cart.items.length" class="mt-8 grid gap-12 lg:grid-cols-[1fr_360px] lg:items-start">
        <section aria-label="Cart items">
          <div v-for="item in cart.items" :key="item.productId" class="flex gap-4 border-b border-black/10 py-5 first:pt-0 sm:gap-6">
            <NuxtLink :to="localePath(`/p/${item.slug}`)" class="block h-28 w-24 shrink-0 overflow-hidden bg-[#F7F7F7] sm:h-36 sm:w-32">
              <img v-if="item.coverImage" :src="item.coverImage" :alt="itemName(item)" class="h-full w-full object-cover" loading="lazy" />
              <div v-else class="flex h-full w-full items-center justify-center">
                <ShoppingBag class="h-5 w-5 text-black/20" aria-hidden="true" />
              </div>
            </NuxtLink>

            <div class="flex min-w-0 flex-1 flex-col justify-between py-1">
              <div class="flex items-start justify-between gap-4">
                <div class="min-w-0">
                  <NuxtLink :to="localePath(`/p/${item.slug}`)" class="font-heading text-sm font-medium leading-snug text-black hover:text-ultra-600 sm:text-base">
                    {{ itemName(item) }}
                  </NuxtLink>
                  <p class="mt-1 text-sm text-black/60">{{ money(item.price) }}</p>
                </div>
                <button
                  type="button"
                  class="flex h-9 w-9 shrink-0 items-center justify-center text-black/35 transition-colors hover:text-ultra-600"
                  :aria-label="locale === 'ar' ? `حذف ${itemName(item)}` : `Remove ${itemName(item)}`"
                  @click="cart.removeItem(item.productId)"
                >
                  <Trash2 class="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div class="flex h-9 items-center border border-black/15">
                  <button type="button" class="flex h-8 w-8 items-center justify-center text-black/60 hover:text-black" :aria-label="locale === 'ar' ? 'تقليل' : 'Decrease quantity'" @click="cart.updateQuantity(item.productId, item.quantity - 1)">
                    <Minus class="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <span class="w-8 text-center font-mono text-xs font-semibold text-black">{{ item.quantity }}</span>
                  <button type="button" class="flex h-8 w-8 items-center justify-center text-black/60 hover:text-black" :aria-label="locale === 'ar' ? 'زيادة' : 'Increase quantity'" @click="cart.updateQuantity(item.productId, item.quantity + 1)">
                    <Plus class="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
                <span class="font-mono text-sm font-semibold text-black">{{ money(item.price * item.quantity) }}</span>
              </div>
            </div>
          </div>
        </section>

        <aside class="bg-[#F7F7F7] p-6 sm:p-7">
          <h2 class="font-heading text-lg font-semibold text-black">{{ locale === 'ar' ? 'ملخص الطلب' : 'Order summary' }}</h2>
          <div class="mt-5 space-y-3 border-b border-black/10 pb-4 text-sm">
            <div class="flex justify-between text-black/55">
              <span>{{ locale === 'ar' ? 'المجموع الفرعي' : 'Subtotal' }}</span>
              <span class="font-medium text-black">{{ money(cart.totalAmount) }}</span>
            </div>
            <div class="flex justify-between text-black/55">
              <span>{{ locale === 'ar' ? 'الشحن' : 'Shipping' }}</span>
              <span>{{ locale === 'ar' ? 'يُحسب عند الدفع' : 'Calculated at checkout' }}</span>
            </div>
          </div>
          <div class="flex items-baseline justify-between pt-4">
            <span class="text-sm font-semibold text-black">{{ locale === 'ar' ? 'الإجمالي' : 'Total' }}</span>
            <span class="font-mono text-xl font-semibold text-black">{{ money(cart.totalAmount) }}</span>
          </div>
          <NuxtLink :to="localePath('/checkout')" class="btn-dark mt-6 w-full">
            {{ locale === 'ar' ? 'إتمام الطلب' : 'Checkout' }}
            <ArrowRight class="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          </NuxtLink>
          <p class="mt-4 text-[11px] leading-5 text-black/60">
            {{ locale === 'ar' ? 'سيتم تأكيد تفاصيل الطلب قبل الشحن.' : 'Order details are confirmed before dispatch.' }}
          </p>
        </aside>
      </div>

      <div v-else class="border border-black/10 px-6 py-20 text-center sm:py-28">
        <ShoppingBag class="mx-auto h-8 w-8 text-black/20" aria-hidden="true" />
        <h2 class="mt-5 font-heading text-2xl font-semibold text-black">{{ locale === 'ar' ? 'سلة المشتريات فارغة' : 'Your bag is empty' }}</h2>
        <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-black/60">
          {{ locale === 'ar' ? 'تصفح المنتجات وأضف ما يناسبك إلى الحقيبة.' : 'Browse the collection and add what you like to your bag.' }}
        </p>
        <NuxtLink :to="localePath('/products')" class="btn-dark mt-7">
          {{ locale === 'ar' ? 'تصفح المنتجات' : 'Browse products' }}
          <ArrowRight class="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
