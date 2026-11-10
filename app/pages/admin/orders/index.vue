<script setup lang="ts">
import {
  Calendar,
  CreditCard,
  Eye,
  Filter,
  Package,
  Phone,
  RotateCcw,
  Search,
  ShoppingCart,
  User,
} from 'lucide-vue-next'

definePageMeta({ layout: 'admin', middleware: 'admin-auth', requiredPermission: 'orders.view' })

const { t, locale } = useI18n()
const { money } = useMoney()
const localePath = useLocalePath()
const route = useRoute()
const router = useRouter()

const search = ref(String(route.query.search || ''))
const status = ref(String(route.query.status || ''))
const paymentMethod = ref(String(route.query.paymentMethod || ''))
const page = ref(Number(route.query.page) || 1)
const limit = 20
const canOrdersManage = useAdminCan('orders.manage')
const canFinancialsView = useAdminCan('dashboard.financials.view')
const flashOrderId = ref<string | null>(null)
let flashTimer: ReturnType<typeof setTimeout> | null = null

onUnmounted(() => {
  if (flashTimer) clearTimeout(flashTimer)
})

function onStatusUpdated(order: Order, status: string) {
  order.status = status
  flashOrderId.value = order.id
  if (flashTimer) clearTimeout(flashTimer)
  flashTimer = setTimeout(() => { flashOrderId.value = null }, 1800)
}

interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerPhone: string
  customerGovernorat: string
  totalAmount: string
  paymentMethod: string
  status: string
  createdAt: string
  _count: { items: number }
}

const fetch = useRequestFetch()

const { data, refresh, pending } = await useAsyncData('admin-orders', () =>
  fetch<{ orders: Order[], pages: number, total: number }>(`/api/admin/orders?${new URLSearchParams({
    search: search.value,
    status: status.value,
    paymentMethod: paymentMethod.value,
    page: String(page.value),
    limit: String(limit),
  })}`),
  { watch: [page] },
)

const hasFilters = computed(() => !!(search.value || status.value || paymentMethod.value))

async function gotoPage(p: number) {
  page.value = p
  await router.replace({
    query: {
      search: search.value || undefined,
      status: status.value || undefined,
      paymentMethod: paymentMethod.value || undefined,
      page: p > 1 ? String(p) : undefined,
    },
  })
}

async function applyFilters() {
  page.value = 1
  await router.replace({
    query: {
      search: search.value || undefined,
      status: status.value || undefined,
      paymentMethod: paymentMethod.value || undefined,
    },
  })
  await refresh()
}

async function resetFilters() {
  search.value = ''
  status.value = ''
  paymentMethod.value = ''
  page.value = 1
  await router.replace({ query: {} })
  await refresh()
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString(locale.value === 'ar' ? 'ar' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <AdminPageHeader
      :title="t('admin.orders')"
      :description="locale === 'ar' ? 'متابعة وإدارة طلبات المتجر وتحديث حالات الشحن والتسليم.' : 'Monitor e-commerce orders, customer information, and dispatch lifecycles.'"
    />

    <!-- Filter Toolbar -->
    <div
      class="mb-4 rounded-md border bg-surface p-3.5 shadow-xs"
      :style="{ borderColor: 'var(--color-border)' }"
    >
      <form class="flex flex-wrap items-center gap-2.5" @submit.prevent="applyFilters">
        <!-- Search Input -->
        <div class="relative min-w-48 flex-1 sm:min-w-64">
          <Search class="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            v-model="search"
            type="search"
            :placeholder="locale === 'ar' ? 'بحث برقم الطلب، اسم العميل، الهاتف…' : 'Search by order #, customer, phone…'"
            class="h-9 w-full rounded-md border bg-surface ps-9 pe-3 text-xs placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            :style="{ borderColor: 'var(--color-border)' }"
          />
        </div>

        <!-- Status Filter -->
        <select
          v-model="status"
          class="h-9 rounded-md border bg-surface px-3 text-xs text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-muted"
          :style="{ borderColor: 'var(--color-border)' }"
          @change="applyFilters"
        >
          <option value="">{{ locale === 'ar' ? 'جميع الحالات' : 'All Statuses' }}</option>
          <option value="Pending">Pending (قيد الانتظار)</option>
          <option value="Processing">Processing (قيد التجهيز)</option>
          <option value="Shipped">Shipped (تم الشحن)</option>
          <option value="Delivered">Delivered (تم التسليم)</option>
          <option value="Cancelled">Cancelled (ملغي)</option>
        </select>

        <!-- Payment Method Filter -->
        <select
          v-model="paymentMethod"
          class="h-9 rounded-md border bg-surface px-3 text-xs text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-muted"
          :style="{ borderColor: 'var(--color-border)' }"
          @change="applyFilters"
        >
          <option value="">{{ locale === 'ar' ? 'جميع طرق الدفع' : 'All Payment Methods' }}</option>
          <option value="COD">{{ locale === 'ar' ? 'الدفع عند الاستلام (COD)' : 'Cash on Delivery' }}</option>
          <option value="ONLINE">{{ locale === 'ar' ? 'دفع إلكتروني (Online)' : 'Online Payment' }}</option>
        </select>

        <!-- Apply Button -->
        <button
          type="submit"
          class="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-3.5 text-xs font-semibold text-text transition-colors hover:bg-border/40 hover:text-text dark:text-muted dark:hover:bg-ink-700"
        >
          <Filter class="h-3.5 w-3.5" aria-hidden="true" />
          <span>{{ locale === 'ar' ? 'تصفية' : 'Filter' }}</span>
        </button>

        <!-- Reset Button -->
        <button
          v-if="hasFilters"
          type="button"
          class="inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-muted hover:text-text dark:hover:text-text"
          @click="resetFilters"
        >
          <RotateCcw class="h-3.5 w-3.5" aria-hidden="true" />
          <span>{{ locale === 'ar' ? 'إلغاء' : 'Reset' }}</span>
        </button>
      </form>
    </div>

    <!-- Orders Table Card -->
    <div class="overflow-hidden rounded-md border bg-surface shadow-xs" :style="{ borderColor: 'var(--color-border)' }">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[860px] text-start text-sm">
          <thead class="sticky top-0 z-10">
            <tr class="border-b bg-border/10 text-[11px] font-semibold uppercase tracking-wider text-muted dark:text-muted" :style="{ borderColor: 'var(--color-border)' }">
              <th scope="col" class="px-4 py-3 text-start">{{ locale === 'ar' ? 'رقم الطلب' : 'Order #' }}</th>
              <th scope="col" class="px-4 py-3 text-start">{{ locale === 'ar' ? 'تاريخ الإنشاء' : 'Date' }}</th>
              <th scope="col" class="px-4 py-3 text-start">{{ locale === 'ar' ? 'العميل' : 'Customer' }}</th>
              <th scope="col" class="px-4 py-3 text-start">{{ locale === 'ar' ? 'الإجمالي' : 'Total' }}</th>
              <th scope="col" class="px-4 py-3 text-start">{{ locale === 'ar' ? 'الدفع' : 'Payment' }}</th>
              <th scope="col" class="px-4 py-3 text-center">{{ locale === 'ar' ? 'الحالة' : 'Status' }}</th>
              <th scope="col" class="px-4 py-3 text-end">{{ locale === 'ar' ? 'الإجراءات' : 'Actions' }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr
              v-for="o in data?.orders || []"
              :key="o.id"
              class="transition-colors even:bg-border/10 even: hover:bg-border/10 dark:hover:bg-ink-800/40"
              :class="flashOrderId === o.id ? 'bg-success/10' : ''"
            >
              <!-- Order Number -->
              <td class="px-4 py-3 font-medium">
                <NuxtLink
                  :to="localePath(`/admin/orders/${o.id}`)"
                  class="font-mono text-xs font-bold text-primary hover:underline dark:text-primary"
                >
                  {{ o.orderNumber }}
                </NuxtLink>
              </td>

              <!-- Date -->
              <td class="px-4 py-3 text-xs text-muted">
                {{ formatDate(o.createdAt) }}
              </td>

              <!-- Customer Details -->
              <td class="px-4 py-3">
                <div>
                  <p class="font-semibold text-text">{{ o.customerName }}</p>
                  <p class="font-mono text-xs text-muted" dir="ltr">{{ o.customerPhone }}</p>
                </div>
              </td>

              <!-- Total -->
              <td class="px-4 py-3">
                <div class="flex items-baseline gap-1">
                  <template v-if="canFinancialsView && o.totalAmount !== null && o.totalAmount !== undefined">
                    <span class="font-bold text-text">{{ money(o.totalAmount) }}</span>
                  </template>
                  <template v-else>
                    <span class="font-mono font-bold text-muted dark:text-muted" :title="locale === 'ar' ? 'بيانات مالية محجوبة' : 'Financial data masked'">•••</span>
                  </template>
                  <span class="ms-1 rounded bg-border/40 px-1.5 py-0.2 text-[10px] text-muted dark:text-muted">
                    {{ o._count?.items || 1 }} {{ locale === 'ar' ? 'عنصر' : 'items' }}
                  </span>
                </div>
              </td>

              <!-- Payment -->
              <td class="px-4 py-3 text-xs">
                <span
                  class="inline-flex items-center gap-1 rounded px-2 py-0.5 font-medium"
                  :class="o.paymentMethod === 'ONLINE' ? 'bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary' : 'bg-border/40 text-text dark:text-muted'"
                >
                  <CreditCard class="h-3 w-3" aria-hidden="true" />
                  <span>{{ o.paymentMethod }}</span>
                </span>
              </td>

              <!-- Status: inline editable for orders.manage, read-only otherwise -->
              <td class="px-4 py-3 text-center">
                <AdminOrderStatusSelect
                  :order-id="o.id"
                  :order-label="o.orderNumber"
                  :status="o.status"
                  :can-edit="canOrdersManage"
                  @updated="(s) => onStatusUpdated(o, s)"
                />
              </td>

              <!-- Actions -->
              <td class="px-4 py-3 text-end">
                <NuxtLink
                  :to="localePath(`/admin/orders/${o.id}`)"
                  :title="locale === 'ar' ? 'تفاصيل' : 'Details'"
                  :aria-label="locale === 'ar' ? 'تفاصيل' : 'Details'"
                  class="inline-flex h-8 w-8 items-center justify-center rounded text-primary transition-colors hover:bg-primary/10 dark:text-primary dark:hover:bg-primary/15"
                >
                  <Eye class="h-4 w-4" aria-hidden="true" />
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-if="!data?.orders?.length" class="p-8">
        <AdminEmptyState
          :title="hasFilters ? (locale === 'ar' ? 'لا توجد طلبات مطابقة للبحث' : 'No orders matching filter') : (locale === 'ar' ? 'لا توجد طلبات مسجلة بعد' : 'No customer orders yet')"
          :description="hasFilters ? (locale === 'ar' ? 'جرب البحث بمعايير أخرى أو إعادة ضبط الفلاتر.' : 'Try changing status or search criteria.') : (locale === 'ar' ? 'ستظهر هنا طلبات الشراء الواردة من المتجر.' : 'Orders placed on the storefront will appear here.')"
          :icon="ShoppingCart"
        >
          <template #action>
            <button
              v-if="hasFilters"
              type="button"
              class="inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-semibold text-text hover:bg-surface dark:text-muted"
              @click="resetFilters"
            >
              <RotateCcw class="h-3.5 w-3.5" aria-hidden="true" />
              <span>{{ locale === 'ar' ? 'إلغاء الفلاتر' : 'Reset filters' }}</span>
            </button>
          </template>
        </AdminEmptyState>
      </div>

      <AdminPagination
        :page="page"
        :pages="data?.pages || 1"
        :total="data?.total || 0"
        :item-name="locale === 'ar' ? 'طلب' : 'orders'"
        @change="gotoPage"
      />
    </div>
  </div>
</template>
