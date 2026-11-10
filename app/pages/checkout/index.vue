<script setup lang="ts">
import { AlertCircle, ArrowRight, CreditCard, Lock, ShoppingBag, User } from 'lucide-vue-next'
const { t, locale } = useI18n()
const localePath = useLocalePath()
const cart = useCartStore()
const { money } = useMoney()

useHead(() => ({ 
  title: `${locale.value === 'ar' ? 'إتمام الطلب' : 'Checkout'} | ${t('brand.name')}` 
}))

const form = reactive({
  name: '',
  phone: '',
  email: '',
  governorate: '',
  address: '',
})
const paymentMethod = ref('COD')
const error = ref('')
const loading = ref(false)

const { data: settings } = await useAsyncData('payment-settings', () =>
  $fetch<{ methods: { cod: boolean, online: boolean } }>('/api/settings/payment'),
)

onMounted(() => {
  if (!cart.items.length) {
    navigateTo(localePath('/cart'))
  }
})

async function placeOrder() {
  if (loading.value || !cart.items.length) return
  error.value = ''
  
  if (!/^\+?[0-9][0-9\s\-()]{6,19}$/.test(form.phone.trim())) {
    error.value = locale.value === 'ar'
      ? 'يرجى إدخال رقم هاتف صحيح'
      : 'Please enter a valid phone number'
    return
  }

  loading.value = true
  try {
    const res = await $fetch<{ orderNumber: string, accessToken: string, paymentUrl?: string }>('/api/orders', {
      method: 'POST',
      body: {
        customer: { ...form },
        items: cart.items.map(i => ({ productId: i.productId, quantity: i.quantity })),
        paymentMethod: paymentMethod.value,
      },
    })
    cart.clearCart()
    // ONLINE gateway checkout: hand off to the payment page instead of success.
    if (res.paymentUrl && typeof window !== 'undefined') {
      window.location.href = res.paymentUrl
      return
    }
    await navigateTo(localePath({ name: 'checkout-success', query: { id: res.orderNumber, token: res.accessToken } }))
  }
  catch (e) {
    error.value = (e as { data?: { message?: string } })?.data?.message || 
      (locale.value === 'ar' ? 'حدث خطأ أثناء تنفيذ الطلب. يرجى المحاولة مرة أخرى.' : 'Order failed. Please try again.')
  }
  finally {
    loading.value = false
  }
}

const inputCls = 'h-11 w-full border border-black/20 bg-white px-3 text-sm text-black placeholder:text-black/35 focus:border-black focus:outline-none transition-colors'
</script>
<template>
  <div class="bg-white text-black">
    <div class="container-editorial py-10 sm:py-14">
      <header class="border-b border-black/10 pb-6">
        <p class="eyebrow">{{ locale === 'ar' ? 'الدفع' : 'Checkout' }}</p>
        <h1 class="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {{ locale === 'ar' ? 'إتمام الطلب' : 'Complete your order' }}
        </h1>
        <p class="mt-2 max-w-2xl text-sm leading-6 text-black/60">
          {{ locale === 'ar' ? 'أدخل بيانات التوصيل واختر طريقة الدفع.' : 'Enter your delivery details and choose a payment method.' }}
        </p>
      </header>

      <div class="mt-8 grid gap-10 lg:grid-cols-[1fr_380px] lg:items-start lg:gap-16">
        <div class="order-2 lg:order-1">
          <div v-if="error" role="alert" class="mb-6 flex items-start gap-2 border border-ultra-200 bg-ultra-50 px-4 py-3 text-sm text-ultra-700">
            <AlertCircle class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{{ error }}</span>
          </div>

          <form class="space-y-10" @submit.prevent="placeOrder">
            <section>
              <div class="flex items-center gap-2 border-b border-black/10 pb-3">
                <User class="h-4 w-4 text-black/60" aria-hidden="true" />
                <h2 class="font-heading text-sm font-semibold uppercase tracking-[0.12em] text-black">{{ locale === 'ar' ? 'بيانات التوصيل' : 'Delivery details' }}</h2>
              </div>

              <div class="mt-5 grid gap-4 sm:grid-cols-2">
                <label class="block">
                  <span class="mb-1.5 block text-xs font-semibold uppercase tracking-[0.1em] text-black/60">{{ locale === 'ar' ? 'الاسم الكامل *' : 'Full name *' }}</span>
                  <input v-model="form.name" type="text" required :placeholder="locale === 'ar' ? 'الاسم الكامل' : 'Full name'" :class="inputCls" />
                </label>
                <label class="block">
                  <span class="mb-1.5 block text-xs font-semibold uppercase tracking-[0.1em] text-black/60">{{ locale === 'ar' ? 'رقم الهاتف *' : 'Phone *' }}</span>
                  <input v-model="form.phone" type="tel" required placeholder="Phone number" :class="inputCls" dir="ltr" />
                </label>
              </div>

              <div class="mt-4 grid gap-4 sm:grid-cols-2">
                <label class="block">
                  <span class="mb-1.5 block text-xs font-semibold uppercase tracking-[0.1em] text-black/60">{{ locale === 'ar' ? 'البريد الإلكتروني' : 'Email' }}</span>
                  <input v-model="form.email" type="email" placeholder="name@example.com" :class="inputCls" dir="ltr" />
                </label>
                <label class="block">
                  <span class="mb-1.5 block text-xs font-semibold uppercase tracking-[0.1em] text-black/60">{{ locale === 'ar' ? 'المنطقة *' : 'Region *' }}</span>
                  <input v-model="form.governorate" type="text" required :placeholder="locale === 'ar' ? 'أدخل المنطقة' : 'Enter region'" :class="inputCls" />
                </label>
              </div>

              <label class="mt-4 block">
                <span class="mb-1.5 block text-xs font-semibold uppercase tracking-[0.1em] text-black/60">{{ locale === 'ar' ? 'العنوان التفصيلي' : 'Address' }}</span>
                <textarea
                  v-model="form.address"
                  rows="3"
                  :placeholder="locale === 'ar' ? 'المدينة، الشارع، رقم المبنى، أي علامة مميزة...' : 'City, street, building, landmark...'"
                  class="w-full border border-black/20 bg-white px-3 py-3 text-sm text-black placeholder:text-black/35 focus:border-black focus:outline-none"
                />
              </label>
            </section>

            <section>
              <div class="flex items-center gap-2 border-b border-black/10 pb-3">
                <CreditCard class="h-4 w-4 text-black/60" aria-hidden="true" />
                <h2 class="font-heading text-sm font-semibold uppercase tracking-[0.12em] text-black">{{ locale === 'ar' ? 'طريقة الدفع' : 'Payment method' }}</h2>
              </div>

              <div class="mt-5 grid gap-3 sm:grid-cols-2">
                <label
                  v-if="settings?.methods.cod !== false"
                  class="flex cursor-pointer items-start gap-3 border p-4 transition-colors"
                  :class="paymentMethod === 'COD' ? 'border-black bg-white' : 'border-black/15 hover:border-black/40'"
                >
                  <input v-model="paymentMethod" type="radio" value="COD" class="mt-1 h-4 w-4 accent-[#D2312D]" />
                  <span>
                    <span class="block text-sm font-semibold text-black">{{ locale === 'ar' ? 'الدفع عند الاستلام' : 'Cash on delivery' }}</span>
                    <span class="mt-1 block text-xs leading-5 text-black/60">{{ locale === 'ar' ? 'الدفع نقداً عند تسليم الطلب.' : 'Pay when your order is delivered.' }}</span>
                  </span>
                </label>

                <label
                  v-if="settings?.methods.online"
                  class="flex cursor-pointer items-start gap-3 border p-4 transition-colors"
                  :class="paymentMethod === 'ONLINE' ? 'border-black bg-white' : 'border-black/15 hover:border-black/40'"
                >
                  <input v-model="paymentMethod" type="radio" value="ONLINE" class="mt-1 h-4 w-4 accent-[#D2312D]" />
                  <span>
                    <span class="block text-sm font-semibold text-black">{{ locale === 'ar' ? 'دفع إلكتروني' : 'Online payment' }}</span>
                    <span class="mt-1 block text-xs leading-5 text-black/60">{{ locale === 'ar' ? 'الدفع عبر بوابة الدفع المهيأة.' : 'Pay through the configured payment gateway.' }}</span>
                  </span>
                </label>
              </div>
            </section>

            <div class="border-t border-black/10 pt-6">
              <button type="submit" :disabled="loading || !cart.items.length" class="btn-dark h-12 w-full sm:w-auto sm:min-w-64">
                <Lock class="h-4 w-4" aria-hidden="true" />
                <span>{{ loading ? (locale === 'ar' ? 'جاري تأكيد الطلب...' : 'Placing order...') : (locale === 'ar' ? 'تأكيد الطلب' : 'Place order') }}</span>
                <ArrowRight class="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              </button>
            </div>
          </form>
        </div>

        <aside class="order-1 bg-[#F7F7F7] p-6 sm:p-7 lg:order-2 lg:sticky lg:top-24">
          <div class="flex items-center justify-between border-b border-black/10 pb-4">
            <h2 class="font-heading text-sm font-semibold uppercase tracking-[0.12em] text-black">{{ locale === 'ar' ? 'ملخص الطلب' : 'Order summary' }}</h2>
            <span class="font-mono text-xs text-black/55">{{ cart.itemCount }}</span>
          </div>

          <div class="max-h-80 space-y-4 overflow-y-auto py-4">
            <div v-for="item in cart.items" :key="item.productId" class="flex items-center gap-3">
              <div class="relative h-16 w-14 shrink-0 overflow-hidden bg-white">
                <img v-if="item.coverImage" :src="item.coverImage" :alt="locale === 'ar' ? item.nameAr : item.nameEn" class="h-full w-full object-cover" loading="lazy" />
                <ShoppingBag v-else class="absolute inset-0 m-auto h-4 w-4 text-black/20" aria-hidden="true" />
              </div>
              <div class="min-w-0 flex-1 text-xs">
                <p class="truncate font-medium text-black">{{ locale === 'ar' ? item.nameAr : item.nameEn }}</p>
                <p class="mt-1 text-black/60">{{ item.quantity }} × {{ money(item.price) }}</p>
              </div>
              <span class="shrink-0 text-xs font-semibold text-black">{{ money(item.price * item.quantity) }}</span>
            </div>
          </div>

          <div class="border-t border-black/10 pt-4 text-sm">
            <div class="flex justify-between text-black/55">
              <span>{{ locale === 'ar' ? 'المجموع الفرعي' : 'Subtotal' }}</span>
              <span class="font-medium text-black">{{ money(cart.totalAmount) }}</span>
            </div>
            <div class="mt-2 flex justify-between text-black/55">
              <span>{{ locale === 'ar' ? 'الشحن' : 'Shipping' }}</span>
              <span>{{ locale === 'ar' ? 'يُحسب لاحقاً' : 'Calculated later' }}</span>
            </div>
            <div class="mt-4 flex items-baseline justify-between border-t border-black/10 pt-4">
              <span class="font-semibold text-black">{{ locale === 'ar' ? 'الإجمالي' : 'Total' }}</span>
              <span class="font-mono text-xl font-semibold text-black">{{ money(cart.totalAmount) }}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>
