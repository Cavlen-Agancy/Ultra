<script setup lang="ts">
import {
  ArrowRight,
  ArrowUpRight,
  Clock,
  ExternalLink,
  FolderTree,
  Package,
  Plus,
  RefreshCw,
  Settings,
  ShoppingCart,
  TrendingUp,
} from 'lucide-vue-next'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const { t, locale } = useI18n()
const localePath = useLocalePath()

interface DashboardResponse {
  stats: {
    totalOrders: number
    pendingOrders: number
    totalProducts: number
    totalCategories: number
    totalRevenue: number
    lowStockCount: number
  }
  recentOrders: Array<{
    id: string
    orderNumber: string
    customerName: string
    customerGovernorat: string
    status: string
    totalAmount: number
    createdAt: string
    itemCount: number
  }>
}

const fetch = useRequestFetch()
const { data, pending, refresh } = await useAsyncData<DashboardResponse>(
  'admin-dashboard-stats',
  () => fetch<DashboardResponse>('/api/admin/dashboard/stats'),
)

const canOrdersView = useAdminCan('orders.view')
const canCategoriesManage = useAdminCan('categories.manage')
const canSettingsView = useAdminCan('settings.view')
const canFinancialsView = useAdminCan('dashboard.financials.view')
const canFinancialsTab = useAdminCan('financials.view')

// Monthly financial summary widget (current month, totals only — no names exposed).
const { data: finSummary, pending: finPending } = await useAsyncData(
  'admin-dashboard-financial-summary',
  () => {
    const now = new Date()
    return fetch<{ revenue: { total: number }, profit: number, margin: number }>(
      `/api/admin/financials/summary?month=${now.getMonth() + 1}&year=${now.getFullYear()}`,
    )
  },
)

const stats = computed(() => data.value?.stats)
const recentOrders = computed(() => data.value?.recentOrders || [])
const lowStockCount = computed(() => stats.value?.lowStockCount || 0)

const canProductsView = useAdminCan('products.view')

const { money } = useMoney()
function formatCurrency(amount: number): string {
  return money(amount)
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString(locale.value === 'ar' ? 'ar' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return locale.value === 'ar' ? 'الآن' : 'Just now'
  if (diffMins < 60) return locale.value === 'ar' ? `منذ ${diffMins} دقيقة` : `${diffMins}m ago`
  if (diffHours < 24) return locale.value === 'ar' ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`
  if (diffDays < 7) return locale.value === 'ar' ? `منذ ${diffDays} يوم` : `${diffDays}d ago`
  return formatDate(dateStr)
}

const cards = computed(() => [
  {
    label: locale.value === 'ar' ? 'إجمالي الطلبات' : 'Total Orders',
    value: stats.value?.totalOrders ?? 0,
    hint: canFinancialsView.value
      ? (stats.value?.totalRevenue !== null && stats.value?.totalRevenue !== undefined
        ? (locale.value === 'ar' ? `حجم المبيعات: ${formatCurrency(stats.value.totalRevenue)}` : `Volume: ${formatCurrency(stats.value.totalRevenue)}`)
        : (locale.value === 'ar' ? 'كل الطلبات المسجلة' : 'All lifetime orders'))
      : (locale.value === 'ar' ? 'حجم المبيعات: •••' : 'Volume: •••'),
    icon: ShoppingCart,
    to: '/admin/orders',
    iconBg: 'bg-primary/10 text-primary dark:bg-primary/25 dark:text-primary',
    highlight: false,
  },
  {
    label: locale.value === 'ar' ? 'طلبات قيد المراجعة' : 'Pending Orders',
    value: stats.value?.pendingOrders ?? 0,
    hint: locale.value === 'ar' ? 'تحتاج إلى مراجعة وتأكيد' : 'Requires dispatch review',
    icon: Clock,
    to: '/admin/orders',
    iconBg: 'bg-warning/10 text-warning dark:bg-warning/25 dark:text-warning',
    badge: (stats.value?.pendingOrders || 0) > 0 ? (locale.value === 'ar' ? 'تحتاج إجراء' : 'Action needed') : undefined,
    badgeColor: 'bg-warning/20 text-warning dark:bg-warning/30 dark:text-warning',
    highlight: (stats.value?.pendingOrders || 0) > 0,
  },
  {
    label: locale.value === 'ar' ? 'إجمالي المنتجات' : 'Total Products',
    value: stats.value?.totalProducts ?? 0,
    hint: stats.value?.totalCategories
      ? (locale.value === 'ar' ? `في ${stats.value.totalCategories} فئات متجر` : `In ${stats.value.totalCategories} categories`)
      : (locale.value === 'ar' ? 'الكتالوج المتاح' : 'In catalog'),
    icon: Package,
    to: '/admin/products',
    iconBg: 'bg-border/40 text-text dark:text-muted',
    highlight: false,
  },
])

const canCreateProduct = useAdminCan('products.create')

const quickActions = computed(() => [
  {
    title: locale.value === 'ar' ? 'إضافة منتج جديد' : 'Add New Product',
    desc: locale.value === 'ar' ? 'إنشاء منتج بالصور والأسعار والمواصفات' : 'Create catalog item with specs & images',
    to: '/admin/products/new',
    icon: Plus,
    show: canCreateProduct.value,
  },
  {
    title: locale.value === 'ar' ? 'إدارة الطلبات والشحن' : 'Manage Orders',
    desc: locale.value === 'ar' ? 'متابعة وتحديث حالات الشحن والطلبات' : 'Process, filter & update order dispatch',
    to: '/admin/orders',
    icon: ShoppingCart,
    show: canOrdersView.value,
  },
  {
    title: locale.value === 'ar' ? 'إدارة الفئات' : 'Manage Categories',
    desc: locale.value === 'ar' ? 'تعديل وتصنيف فئات المتجر وصور الغلاف' : 'Organize catalog categories & covers',
    to: '/admin/categories',
    icon: FolderTree,
    show: canCategoriesManage.value,
  },
  {
    title: locale.value === 'ar' ? 'إعدادات المنصة' : 'Platform Settings',
    desc: locale.value === 'ar' ? 'تحديث معلومات التواصل والبانرات والسيو' : 'Update contact info, SEO & store config',
    to: '/admin/settings',
    icon: Settings,
    show: canSettingsView.value,
  },
].filter(a => a.show))
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <AdminPageHeader
      :title="t('admin.dashboard')"
      :description="locale === 'ar' ? 'نظرة عامة على النشاط والطلبات.' : 'System overview and active orders.'"
    >
      <template #actions>
        <!-- Refresh Button -->
        <button
          type="button"
          class="inline-flex h-9 items-center gap-1.5 rounded-md border bg-surface px-3 text-xs font-semibold text-text shadow-2xs transition-colors hover:bg-surface focus-visible:outline-none dark:text-muted dark:hover:bg-ink-800"
          :style="{ borderColor: 'var(--color-border)' }"
          :disabled="pending"
          @click="refresh"
        >
          <RefreshCw class="h-3.5 w-3.5" :class="{ 'animate-spin': pending }" aria-hidden="true" />
          <span>{{ locale === 'ar' ? 'تحديث' : 'Refresh' }}</span>
        </button>

        <!-- Add Product CTA -->
        <NuxtLink
          v-if="canCreateProduct"
          :to="localePath('/admin/products/new')"
          class="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Plus class="h-4 w-4" aria-hidden="true" />
          <span>{{ locale === 'ar' ? 'منتج جديد' : 'Add Product' }}</span>
        </NuxtLink>
      </template>
    </AdminPageHeader>

    <!-- Low Stock Warning Banner -->
    <div
      v-if="lowStockCount > 0"
      role="alert"
      class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-error/30 bg-error/10 px-5 py-3.5 dark:border-error/30 dark:bg-error/15"
    >
      <p class="flex items-center gap-2 text-xs font-semibold text-error dark:text-error sm:text-sm">
        <span aria-hidden="true">⚠️</span>
        <span>
          {{ locale === 'ar'
            ? `${lowStockCount} منتجات وصلت للحد الأدنى من المخزون`
            : `${lowStockCount} products at or below minimum stock` }}
        </span>
      </p>
      <NuxtLink
        v-if="canProductsView"
        :to="localePath('/admin/products')"
        class="inline-flex items-center gap-1 rounded-md bg-error px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-error"
      >
        <span>{{ locale === 'ar' ? 'عرض المنتجات' : 'View products' }}</span>
        <ArrowRight class="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
      </NuxtLink>
    </div>

    <!-- Monthly Financial Summary Widget -->
    <section
      v-if="canFinancialsTab"
      aria-label="Monthly Financial Summary"
      class="rounded-xl border bg-surface p-5 shadow-xs"
      :style="{ borderColor: 'var(--color-border)' }"
    >
      <h2 class="font-heading text-sm font-bold text-text sm:text-base">
        {{ locale === 'ar' ? 'الملخص المالي لهذا الشهر' : 'This Month’s Financial Summary' }}
      </h2>

      <!-- Skeleton loading (same pattern as KPI cards) -->
      <div v-if="finPending" class="mt-4 grid gap-4 sm:grid-cols-3">
        <div v-for="i in 3" :key="i" class="h-16 animate-pulse rounded-lg bg-border/40" />
      </div>

      <div v-else-if="finSummary && finSummary.revenue.total > 0" class="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-wider text-muted">
            {{ locale === 'ar' ? 'إجمالي المبيعات' : 'Total Sales' }}
          </p>
          <p class="mt-1 font-heading text-2xl font-extrabold text-success dark:text-success">
            {{ formatCurrency(finSummary.revenue.total) }}
          </p>
        </div>
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-wider text-muted">
            {{ locale === 'ar' ? 'صافي الربح' : 'Net Profit' }}
          </p>
          <p
            class="mt-1 font-heading text-2xl font-extrabold"
            :class="finSummary.profit >= 0 ? 'text-primary dark:text-accent' : 'text-error dark:text-error'"
          >
            {{ formatCurrency(finSummary.profit) }}
          </p>
        </div>
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-wider text-muted">
            {{ locale === 'ar' ? 'هامش الربح %' : 'Profit Margin %' }}
          </p>
          <p class="mt-1 font-heading text-2xl font-extrabold text-text">
            {{ finSummary.margin }}%
          </p>
        </div>
      </div>

      <p v-else class="mt-4 text-xs text-muted">
        {{ locale === 'ar' ? 'لا توجد مبيعات مكتملة هذا الشهر' : 'No completed sales this month' }}
      </p>

      <p class="mt-4 text-[13px] text-muted">
        {{ locale === 'ar' ? 'بناءً على الطلبات المكتملة هذا الشهر — ' : 'Based on this month’s completed orders — ' }}
        <NuxtLink :to="localePath('/admin/financials')" class="font-semibold text-primary hover:underline dark:text-primary">
          {{ locale === 'ar' ? 'عرض التفاصيل ←' : 'View details ←' }}
        </NuxtLink>
      </p>
    </section>

    <!-- KPI Metric Cards Grid -->
    <section aria-label="Metrics Overview" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <NuxtLink
        v-for="card in cards"
        :key="card.label"
        :to="localePath(card.to)"
        class="group relative flex flex-col justify-between rounded-lg border bg-surface p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
        :class="{ 'border-warning dark:border-warning/60': card.highlight && card.label.includes('Pending') }"
        :style="{ borderColor: card.highlight ? undefined : 'var(--color-border)' }"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="space-y-1.5">
            <p class="text-[11px] font-semibold uppercase tracking-wider text-muted">
              {{ card.label }}
            </p>
            <p class="font-heading text-2xl font-extrabold tracking-tight text-text">
              {{ Number(card.value || 0).toLocaleString('en-US') }}
            </p>
          </div>
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105"
            :class="card.iconBg"
          >
            <component :is="card.icon" class="h-5 w-5" aria-hidden="true" />
          </div>
        </div>

        <div class="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted/80 dark:text-muted">
          <span class="truncate text-[11px]">{{ card.hint }}</span>
          <span
            v-if="card.badge"
            class="rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0"
            :class="card.badgeColor"
          >
            {{ card.badge }}
          </span>
          <ArrowUpRight v-else class="h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 text-primary dark:text-accent" />
        </div>
      </NuxtLink>
    </section>

    <!-- Main Activity Section: Recent Orders -->
    <section aria-label="Recent Activity" class="grid grid-cols-1 gap-6">
      <!-- Recent Orders (full width) -->
      <div
        class="flex flex-col justify-between rounded-xl border bg-surface shadow-xs"
        :style="{ borderColor: 'var(--color-border)' }"
      >
        <div>
          <!-- Card Header -->
          <div class="flex items-center justify-between border-b px-5 py-4" :style="{ borderColor: 'var(--color-border)' }">
            <div class="space-y-0.5">
              <div class="flex items-center gap-2">
                <ShoppingCart class="h-4 w-4 text-primary dark:text-primary" aria-hidden="true" />
                <h2 class="font-heading text-sm font-bold text-text sm:text-base">
                  {{ locale === 'ar' ? 'أحدث الطلبات' : 'Recent Orders' }}
                </h2>
              </div>
              <p class="text-xs text-muted">
                {{ locale === 'ar' ? 'آخر طلبات العملاء وحالة التنفيذ والشحن' : 'Latest orders received through the platform' }}
              </p>
            </div>

            <NuxtLink
              v-if="canOrdersView"
              :to="localePath('/admin/orders')"
              class="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-accent-hover hover:underline dark:text-primary dark:hover:text-primary"
            >
              <span>{{ locale === 'ar' ? 'عرض الكل' : 'View all' }}</span>
              <ArrowRight class="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
            </NuxtLink>
          </div>

          <!-- Orders Table -->
          <div v-if="recentOrders.length > 0" class="overflow-x-auto">
            <table class="w-full text-start text-xs">
              <thead class="sticky top-0 z-10">
                <tr class="border-b bg-border/10 text-[11px] font-semibold uppercase tracking-wider text-muted dark:text-muted" :style="{ borderColor: 'var(--color-border)' }">
                  <th scope="col" class="px-5 py-3 text-start">{{ locale === 'ar' ? 'رقم الطلب' : 'Order #' }}</th>
                  <th scope="col" class="px-4 py-3 text-start">{{ locale === 'ar' ? 'العميل' : 'Customer' }}</th>
                  <th scope="col" class="px-4 py-3 text-start">{{ locale === 'ar' ? 'الحالة' : 'Status' }}</th>
                  <th scope="col" class="px-4 py-3 text-start">{{ locale === 'ar' ? 'الإجمالي' : 'Total' }}</th>
                  <th scope="col" class="px-5 py-3 text-end">{{ locale === 'ar' ? 'التوقيت' : 'Time' }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr
                  v-for="order in recentOrders"
                  :key="order.id"
                  class="group transition-colors hover:bg-surface/70 dark:hover:bg-ink-800/40"
                >
                  <!-- Order Number -->
                  <td class="px-5 py-3.5 whitespace-nowrap">
                    <NuxtLink
                      :to="localePath(`/admin/orders/${order.id}`)"
                      class="font-mono text-xs font-semibold text-primary transition-colors hover:underline dark:text-primary"
                    >
                      {{ order.orderNumber }}
                    </NuxtLink>
                  </td>

                  <!-- Customer Name & Region -->
                  <td class="px-4 py-3.5">
                    <div class="min-w-0">
                      <p class="truncate font-semibold text-text">
                        {{ order.customerName }}
                      </p>
                      <p class="truncate text-[11px] text-muted dark:text-muted">
                        {{ order.customerGovernorat }} · {{ order.itemCount }} {{ locale === 'ar' ? 'منتج' : 'items' }}
                      </p>
                    </div>
                  </td>

                  <!-- Status -->
                  <td class="px-4 py-3.5 whitespace-nowrap">
                    <AdminStatusBadge :status="order.status" size="sm" />
                  </td>

                  <!-- Total Amount -->
                  <td class="px-4 py-3.5 whitespace-nowrap font-bold text-text">
                    <span v-if="order.totalAmount !== null && order.totalAmount !== undefined && canFinancialsView">
                      {{ formatCurrency(order.totalAmount) }}
                    </span>
                    <span v-else class="font-mono text-muted font-bold" :title="locale === 'ar' ? 'بيانات مالية محجوبة' : 'Financial data masked'">
                      •••
                    </span>
                  </td>

                  <!-- Time (relative time depends on wall-clock "now", which differs
                    between SSR and hydration — ClientOnly with absolute-date fallback) -->
                  <td class="px-5 py-3.5 whitespace-nowrap text-end text-[11px] text-muted">
                    <ClientOnly>
                      {{ formatRelativeTime(order.createdAt) }}
                      <template #fallback>{{ formatDate(order.createdAt) }}</template>
                    </ClientOnly>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Empty State for Orders -->
          <div v-else class="flex flex-col items-center justify-center p-8 text-center">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-border/40 text-muted">
              <ShoppingCart class="h-5 w-5" />
            </div>
            <p class="mt-2 text-xs font-semibold text-text">
              {{ locale === 'ar' ? 'لا توجد طلبات مسجلة بعد' : 'No recent orders yet' }}
            </p>
            <p class="text-[11px] text-muted">
              {{ locale === 'ar' ? 'ستظهر هنا أحدث طلبات المتجر بمجرد قيام العملاء بالطلب' : 'Customer orders will appear here automatically.' }}
            </p>
          </div>
        </div>

        <!-- Card Footer -->
        <div class="border-t border-border bg-border/10 px-5 py-2.5">
          <NuxtLink
            v-if="canOrdersView"
            :to="localePath('/admin/orders')"
            class="flex items-center justify-between text-xs font-semibold text-primary transition-colors hover:text-accent-hover dark:text-primary"
          >
            <span>{{ locale === 'ar' ? 'إدارة جميع الطلبات في المتجر' : 'Manage all orders & fulfillment' }}</span>
            <ArrowRight class="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Quick Shortcuts & Quick Navigation -->
    <section aria-label="Quick Actions">
      <div class="mb-3 flex items-center justify-between">
        <div>
          <h2 class="font-heading text-sm font-bold text-text sm:text-base">
            {{ locale === 'ar' ? 'إجراءات سريعة' : 'Quick Actions' }}
          </h2>
          <p class="text-xs text-muted">
            {{ locale === 'ar' ? 'الوصول المباشر للمهام الإدارية الأكثر تكراراً.' : 'Direct access to frequent administrative workflows.' }}
          </p>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="action in quickActions"
          :key="action.title"
          :to="localePath(action.to)"
          class="group flex flex-col justify-between rounded-xl border bg-surface p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-md dark:hover:border-primary"
          :style="{ borderColor: 'var(--color-border)' }"
        >
          <div class="space-y-2.5">
            <div class="flex items-center justify-between">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white dark:text-accent dark:group-hover:bg-accent dark:group-hover:text-on-accent">
                <component :is="action.icon" class="h-5 w-5" aria-hidden="true" />
              </div>
              <ArrowUpRight class="h-4 w-4 text-muted opacity-60 transition-all group-hover:opacity-100 group-hover:text-primary dark:group-hover:text-accent rtl:rotate-270" aria-hidden="true" />
            </div>

            <h3 class="font-heading text-sm font-bold text-text transition-colors group-hover:text-primary dark:text-text dark:group-hover:text-accent">
              {{ action.title }}
            </h3>
            <p class="text-xs leading-relaxed text-muted">
              {{ action.desc }}
            </p>
          </div>

          <div class="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs font-semibold text-primary/80 dark:text-accent">
            <span>{{ locale === 'ar' ? 'بدء الإجراء' : 'Open action' }}</span>
            <ArrowRight class="h-3.5 w-3.5 rtl:rotate-180 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" aria-hidden="true" />
          </div>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
