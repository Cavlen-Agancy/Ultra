<script setup lang="ts">
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileText,
  Mail,
  MapPin,
  Package,
  Phone,
  Printer,
  ShoppingCart,
  User,
  X,
} from 'lucide-vue-next'

definePageMeta({ layout: 'admin', middleware: 'admin-auth', requiredPermission: 'orders.view' })

const { t, locale } = useI18n()
const { money } = useMoney()
const localePath = useLocalePath()
const route = useRoute()
const id = String(route.params.id)
const fetch = useRequestFetch()
const canFinancialsView = useAdminCan('dashboard.financials.view')
const toast = useAdminToast()
const { confirm: confirmDialog } = useAdminConfirm()

const { data, refresh, error } = await useAsyncData(`admin-order-${id}`, () =>
  fetch<{ order: any }>(`/api/admin/orders/${id}`),
)

const newStatus = ref('')
const updating = ref(false)
const updateMessage = ref('')
const deliverConfirmOpen = ref(false)
const printingInvoice = ref(false)
const invoiceModalId = ref<string | null>(null)

async function openInvoicePreview() {
  printingInvoice.value = true
  try {
    let invoiceId = linkedInvoice.value?.invoice?.id || null
    if (!invoiceId) {
      const created = await $fetch<{ invoice: { id: string } }>(`/api/admin/invoices/from-order/${id}`, { method: 'POST' })
      invoiceId = created.invoice.id
      await refreshInvoice()
    }
    invoiceModalId.value = invoiceId
  }
  catch (e: any) {
    toast.error(
      locale.value === 'ar' ? 'تعذر تجهيز الفاتورة' : 'Failed to prepare invoice',
      e?.data?.message || 'Create failed',
    )
  }
  finally {
    printingInvoice.value = false
  }
}
const canInvoicesManage = useAdminCan('invoices.manage')
const creatingInvoice = ref(false)

const { data: linkedInvoice, refresh: refreshInvoice } = await useAsyncData(`admin-order-invoice-${id}`, () =>
  fetch<{ invoice: { id: string, invoiceNumber: string, status: string, totalAmount: number } | null }>(
    `/api/admin/invoices/by-order/${id}`,
  ),
)

async function createOrderInvoice() {
  creatingInvoice.value = true
  try {
    await $fetch(`/api/admin/invoices/from-order/${id}`, { method: 'POST' })
    await refreshInvoice()
    toast.success(
      locale.value === 'ar' ? 'تم إنشاء الفاتورة' : 'Invoice Created',
      locale.value === 'ar' ? 'تم إنشاء فاتورة لهذا الطلب بنجاح.' : 'Invoice generated for this order.',
    )
  }
  catch (e: any) {
    toast.error(
      locale.value === 'ar' ? 'فشل إنشاء الفاتورة' : 'Invoice Failed',
      e?.data?.message || 'Create failed',
    )
  }
  finally {
    creatingInvoice.value = false
  }
}

if (data.value?.order) {
  newStatus.value = data.value.order.status
}

async function persistStatus(status: string) {
  updating.value = true
  updateMessage.value = ''
  try {
    const res = await $fetch<{ order: any, stockDeducted?: boolean }>(`/api/admin/orders/${id}/status`, {
      method: 'PUT',
      body: { status },
    })
    updateMessage.value = locale.value === 'ar' ? 'تم تحديث الحالة بنجاح' : 'Status updated successfully'
    await refresh()
    if (res.stockDeducted && status === 'Delivered') {
      toast.success(
        locale.value === 'ar' ? 'تم تأكيد التسليم وخصم المخزون' : 'Delivery confirmed, stock deducted',
        locale.value === 'ar' ? 'تم خصم كميات المنتجات من المخزون تلقائياً.' : 'Product quantities deducted from stock automatically.',
      )
    }
    else {
      toast.success(
        locale.value === 'ar' ? 'تم تحديث حالة الطلب' : 'Status Updated',
        locale.value === 'ar' ? `تم تغيير حالة الطلب إلى "${status}".` : `Order status changed to "${status}".`,
      )
    }
  }
  catch (e: any) {
    const msg = e?.data?.message || 'Update failed'
    toast.error(
      locale.value === 'ar' ? 'فشل تحديث الحالة' : 'Update Failed',
      msg,
    )
    newStatus.value = data.value!.order.status
  }
  finally {
    updating.value = false
    setTimeout(() => { updateMessage.value = '' }, 3000)
  }
}

async function updateStatus() {
  // Delivering for the first time requires explicit stock-deduction consent.
  if (newStatus.value === 'Delivered' && data.value?.order.status !== 'Delivered' && !data.value?.order.stockDeducted) {
    deliverConfirmOpen.value = true
    return
  }
  await persistStatus(newStatus.value)
}

async function confirmDelivery() {
  deliverConfirmOpen.value = false
  await persistStatus('Delivered')
}

function cancelDelivery() {
  deliverConfirmOpen.value = false
  newStatus.value = data.value!.order.status
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
    <!-- Error State -->
    <div
      v-if="error"
      class="rounded-md border border-error/30 bg-error/10 p-6 text-center text-xs font-medium text-error dark:border-error/30 dark:bg-error/15 dark:text-error"
    >
      {{ locale === 'ar' ? 'الطلب غير موجود أو تعذر تحميله.' : 'Order not found or failed to load.' }}
    </div>

    <!-- Order Detail View -->
    <div v-else-if="data?.order">
      <!-- Header with Back Link & Status Badge -->
      <AdminPageHeader
        :title="`${locale === 'ar' ? 'الطلب' : 'Order'} #${data.order.orderNumber}`"
        :description="formatDate(data.order.createdAt)"
        back-to="/admin/orders"
        :back-label="locale === 'ar' ? 'العودة إلى الطلبات' : 'Back to Orders'"
      >
        <template #badge>
          <div class="flex flex-wrap items-center gap-2">
            <AdminStatusBadge :status="data.order.status" size="md" />
            <span
              v-if="data.order.stockDeducted"
              class="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-xs font-bold text-success dark:border-success/30 dark:bg-success/15 dark:text-success"
            >
              <span aria-hidden="true">✓</span>
              <span>{{ locale === 'ar' ? 'تم خصم المخزون' : 'Stock deducted' }}</span>
            </span>
            <span
              v-if="data.order.paymentMethod === 'ONLINE'"
              class="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-bold text-text"
            >
              <span>{{ locale === 'ar' ? 'الدفع' : 'Payment' }}: {{ data.order.paymentStatus }}</span>
              <span v-if="data.order.paymentProvider">({{ data.order.paymentProvider }})</span>
            </span>
          </div>
        </template>
        <template #actions>
          <button
            type="button"
            :disabled="printingInvoice"
            class="inline-flex h-9 items-center gap-1.5 rounded-md border border-primary bg-transparent px-3.5 text-xs font-bold text-primary transition-colors hover:bg-primary/10 disabled:opacity-50 dark:border-primary dark:text-primary dark:hover:bg-primary/15"
            @click="openInvoicePreview"
          >
            <Printer class="h-4 w-4" aria-hidden="true" />
            <span>{{ printingInvoice ? (locale === 'ar' ? 'جاري التجهيز…' : 'Preparing…') : (locale === 'ar' ? 'طباعة فاتورة' : 'Print Invoice') }}</span>
          </button>
        </template>
      </AdminPageHeader>

      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Main Column: Ordered Items & History -->
        <div class="space-y-6 lg:col-span-2">
          <!-- Items List Card -->
          <div class="rounded-md border bg-surface p-5 shadow-xs" :style="{ borderColor: 'var(--color-border)' }">
            <div class="mb-4 flex items-center justify-between border-b pb-3" :style="{ borderColor: 'var(--color-border)' }">
              <h2 class="font-heading text-base font-bold text-text">
                {{ locale === 'ar' ? 'المنتجات المطلوبة' : 'Order Items' }}
              </h2>
              <span class="text-xs text-muted">
                {{ data.order.items.length }} {{ locale === 'ar' ? 'عناصر' : 'items' }}
              </span>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-start text-sm">
                <thead>
                  <tr class="border-b text-[11px] font-semibold uppercase tracking-wider text-muted" :style="{ borderColor: 'var(--color-border)' }">
                    <th scope="col" class="pb-2.5 text-start">{{ locale === 'ar' ? 'المنتج' : 'Product' }}</th>
                    <th scope="col" class="pb-2.5 text-end">{{ locale === 'ar' ? 'سعر الوحدة' : 'Unit Price' }}</th>
                    <th scope="col" class="pb-2.5 text-center">{{ locale === 'ar' ? 'الكمية' : 'Qty' }}</th>
                    <th scope="col" class="pb-2.5 text-end">{{ locale === 'ar' ? 'الإجمالي' : 'Subtotal' }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border">
                  <tr v-for="item in data.order.items" :key="item.id" class="text-xs">
                    <td class="py-3 font-medium text-text">
                      <div class="flex items-center gap-2">
                        <span>{{ item.productNameSnapshot }}</span>
                        <span v-if="!item.productId" class="rounded bg-error/10 px-1.5 py-0.2 text-[10px] font-medium text-error dark:bg-error/15 dark:text-error">
                          Archived
                        </span>
                      </div>
                    </td>
                    <td class="py-3 text-end font-mono text-muted">
                      <span v-if="canFinancialsView && item.productPriceSnapshot !== null">{{ money(item.productPriceSnapshot) }}</span>
                      <span v-else class="text-muted font-bold">•••</span>
                    </td>
                    <td class="py-3 text-center">
                      <span class="inline-block rounded bg-border/40 px-2 py-0.5 font-bold text-text dark:text-muted">
                        {{ item.quantity }}
                      </span>
                    </td>
                    <td class="py-3 text-end font-mono font-bold text-text">
                      <span v-if="canFinancialsView && item.subtotal !== null">{{ money(item.subtotal) }}</span>
                      <span v-else class="text-muted font-bold">•••</span>
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="border-t font-bold text-sm" :style="{ borderColor: 'var(--color-border)' }">
                    <td colspan="3" class="pt-4 text-end text-text">
                      {{ locale === 'ar' ? 'المبلغ الإجمالي:' : 'Total Amount:' }}
                    </td>
                    <td class="pt-4 text-end font-heading text-base text-primary dark:text-accent">
                      <span v-if="canFinancialsView && data.order.totalAmount !== null">{{ money(data.order.totalAmount) }}</span>
                      <span v-else class="font-mono text-muted font-bold">•••</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <!-- Status Timeline Card (RTL-Safe) -->
          <div class="rounded-md border bg-surface p-5 shadow-xs" :style="{ borderColor: 'var(--color-border)' }">
            <h2 class="mb-4 font-heading text-base font-bold text-text">
              {{ locale === 'ar' ? 'سجل تغيرات الحالة' : 'Status History' }}
            </h2>

            <div v-if="data.order.statusHistory?.length" class="relative ms-4 border-s ps-5 space-y-6" :style="{ borderColor: 'var(--color-border)' }">
              <div v-for="h in data.order.statusHistory" :key="h.id" class="relative">
                <!-- RTL-Safe Dot using -start -->
                <span class="absolute -start-[26px] top-1 h-3 w-3 rounded-full border-2 border-white bg-primary dark:border-ink-950" />
                <div class="space-y-0.5">
                  <div class="flex items-center gap-2">
                    <AdminStatusBadge :status="h.status" size="sm" :show-dot="false" />
                    <span class="text-xs text-muted">{{ formatDate(h.changedAt) }}</span>
                  </div>
                  <p v-if="h.changedBy" class="text-xs text-muted">
                    {{ locale === 'ar' ? `بواسطة: ${h.changedBy.name}` : `By: ${h.changedBy.name}` }}
                  </p>
                </div>
              </div>
            </div>
            <div v-else class="text-xs text-muted">
              {{ locale === 'ar' ? 'لا يوجد سجل سابق لتغيرات الحالة.' : 'No status history logged yet.' }}
            </div>
          </div>
        </div>

        <!-- Sidebar Column: Customer & Status Controls -->
        <div class="space-y-6">
          <!-- Customer Information Card -->
          <div class="rounded-md border bg-surface p-5 shadow-xs" :style="{ borderColor: 'var(--color-border)' }">
            <h2 class="mb-3.5 font-heading text-base font-bold text-text">
              {{ locale === 'ar' ? 'بيانات العميل' : 'Customer Details' }}
            </h2>

            <div class="space-y-3.5 text-xs">
              <div class="flex items-start gap-2.5">
                <User class="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                <div>
                  <span class="block text-[11px] text-muted">{{ locale === 'ar' ? 'الاسم' : 'Customer Name' }}</span>
                  <p class="font-semibold text-text">{{ data.order.customerName }}</p>
                </div>
              </div>

              <div class="flex items-start gap-2.5">
                <Phone class="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                <div>
                  <span class="block text-[11px] text-muted">{{ locale === 'ar' ? 'رقم الهاتف' : 'Phone' }}</span>
                  <a :href="`tel:${data.order.customerPhone}`" dir="ltr" class="font-mono font-medium text-primary hover:underline dark:text-primary">
                    {{ data.order.customerPhone }}
                  </a>
                </div>
              </div>

              <div v-if="data.order.customerEmail" class="flex items-start gap-2.5">
                <Mail class="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                <div>
                  <span class="block text-[11px] text-muted">{{ locale === 'ar' ? 'البريد الإلكتروني' : 'Email' }}</span>
                  <a :href="`mailto:${data.order.customerEmail}`" class="font-medium text-primary hover:underline dark:text-primary">
                    {{ data.order.customerEmail }}
                  </a>
                </div>
              </div>

              <div class="flex items-start gap-2.5 border-t pt-3" :style="{ borderColor: 'var(--color-border)' }">
                <MapPin class="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                <div>
                  <span class="block text-[11px] text-muted">{{ locale === 'ar' ? 'المنطقة والعنوان' : 'Delivery Address' }}</span>
                  <p class="font-semibold capitalize text-text">{{ data.order.customerGovernorat }}</p>
                  <p v-if="data.order.customerAddress" class="mt-0.5 text-muted leading-relaxed">
                    {{ data.order.customerAddress }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Invoice Card -->
          <div class="rounded-md border bg-surface p-5 shadow-xs" :style="{ borderColor: 'var(--color-border)' }">
            <h2 class="mb-3 font-heading text-base font-bold text-text">
              {{ locale === 'ar' ? 'فاتورة الطلب' : 'Order Invoice' }}
            </h2>
            <div v-if="linkedInvoice?.invoice" class="space-y-3">
              <div class="flex items-center justify-between rounded-md bg-surface px-3 py-2.5">
                <div>
                  <NuxtLink
                    :to="localePath(`/admin/invoices/${linkedInvoice.invoice.id}`)"
                    class="font-mono text-xs font-bold text-primary hover:underline dark:text-primary"
                  >
                    #{{ linkedInvoice.invoice.invoiceNumber }}
                  </NuxtLink>
                  <p class="mt-0.5 text-[11px] text-muted">{{ linkedInvoice.invoice.status }}</p>
                </div>
                <a
                  :href="`/api/invoices/${linkedInvoice.invoice.id}/pdf`"
                  target="_blank" download
                  class="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3.5 text-xs font-bold text-on-primary shadow-xs hover:bg-accent-hover"
                >
                  <Download class="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{{ locale === 'ar' ? 'تحميل الفاتورة' : 'Download Invoice' }}</span>
                </a>
              </div>
            </div>
            <button
              v-else-if="canInvoicesManage"
              type="button"
              :disabled="creatingInvoice"
              class="flex h-10 w-full items-center justify-center gap-1.5 rounded-md bg-accent px-4 text-xs font-bold text-on-accent shadow-xs transition-colors hover:bg-accent disabled:opacity-50"
              @click="createOrderInvoice"
            >
              <FileText class="h-4 w-4" aria-hidden="true" />
              <span>{{ creatingInvoice ? (locale === 'ar' ? 'جاري الإنشاء…' : 'Creating…') : (locale === 'ar' ? 'إنشاء فاتورة' : 'Create Invoice') }}</span>
            </button>
            <p v-else class="text-xs text-muted">
              {{ locale === 'ar' ? 'لا توجد فاتورة مرتبطة بهذا الطلب.' : 'No invoice linked to this order.' }}
            </p>
          </div>

          <!-- Payment Info Card -->
          <div class="rounded-md border bg-surface p-5 shadow-xs" :style="{ borderColor: 'var(--color-border)' }">
            <h2 class="mb-3 font-heading text-base font-bold text-text">
              {{ locale === 'ar' ? 'طريقة الدفع' : 'Payment Method' }}
            </h2>
            <div class="flex items-center gap-2.5 text-xs font-semibold text-text dark:text-text">
              <CreditCard class="h-4 w-4 text-primary" aria-hidden="true" />
              <span>{{ data.order.paymentMethod === 'COD' ? (locale === 'ar' ? 'الدفع عند الاستلام (COD)' : 'Cash on Delivery') : (locale === 'ar' ? 'دفع إلكتروني (Online)' : 'Online Card Payment') }}</span>
            </div>
          </div>

          <!-- Status Management Action Card -->
          <AdminPermissionGate permission="orders.manage">
            <div class="rounded-md border bg-surface p-5 shadow-xs" :style="{ borderColor: 'var(--color-border)' }">
              <h2 class="mb-2 font-heading text-base font-bold text-text">
                {{ locale === 'ar' ? 'تحديث حالة الطلب' : 'Update Status' }}
              </h2>
              <p class="mb-4 text-xs text-muted">
                {{ locale === 'ar' ? 'اختر الحالة الجديدة واضغط حفظ لتسجيل التغيير في سجل الطلب.' : 'Select new lifecycle state to notify logistics.' }}
              </p>

              <div class="space-y-3">
                <select
                  v-model="newStatus"
                  class="h-10 w-full rounded-md border bg-surface px-3 text-xs font-medium focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  :style="{ borderColor: 'var(--color-border)' }"
                  :disabled="updating"
                >
                  <option value="Pending">Pending (قيد الانتظار)</option>
                  <option value="Processing">Processing (قيد التجهيز)</option>
                  <option value="Shipped">Shipped (تم الشحن)</option>
                  <option value="Delivered">Delivered (تم التسليم)</option>
                  <option value="Cancelled">Cancelled (ملغي)</option>
                </select>

                <button
                  type="button"
                  class="flex h-10 w-full items-center justify-center gap-1.5 rounded-md bg-accent px-4 text-xs font-bold text-on-accent shadow-xs transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                  :disabled="updating || newStatus === data.order.status"
                  @click="updateStatus"
                >
                  <span>{{ updating ? (locale === 'ar' ? 'جاري التحديث…' : 'Updating…') : (locale === 'ar' ? 'حفظ الحالة' : 'Save Status') }}</span>
                </button>

                <p v-if="updateMessage" class="text-center text-xs font-semibold text-success dark:text-success">
                  {{ updateMessage }}
                </p>
              </div>
            </div>
          </AdminPermissionGate>
        </div>
      </div>

      <!-- Delivery Confirmation Modal (stock deduction consent) -->
      <Teleport to="body">
        <div
          v-if="deliverConfirmOpen"
          class="admin-shell fixed inset-0 z-[70] flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          @click.self="cancelDelivery"
        >
          <div class="w-full max-w-md rounded-xl border bg-surface p-6 shadow-2xl">
            <h3 class="font-heading text-base font-bold text-text dark:text-white">
              {{ locale === 'ar' ? 'هل تريد تأكيد التسليم؟' : 'Confirm delivery?' }}
            </h3>
            <p class="mt-2 text-xs leading-relaxed text-muted">
              {{ locale === 'ar' ? 'سيتم خصم الكميات التالية من المخزون تلقائياً:' : 'The following quantities will be deducted from stock automatically:' }}
            </p>
            <ul class="mt-3 max-h-48 space-y-1.5 overflow-y-auto rounded-lg bg-surface p-3 text-xs">
              <li v-for="item in data.order.items" :key="item.id" class="flex items-center justify-between gap-2">
                <span class="min-w-0 truncate font-semibold text-text dark:text-text">{{ item.productNameSnapshot }}</span>
                <span class="shrink-0 font-mono text-muted">
                  {{ locale === 'ar' ? `خصم ${item.quantity} قطعة` : `−${item.quantity} pcs` }}
                </span>
              </li>
            </ul>
            <div class="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                class="h-10 rounded-md border px-4 text-xs font-semibold text-text hover:bg-surface dark:text-muted dark:hover:bg-ink-800"
                @click="cancelDelivery"
              >
                {{ locale === 'ar' ? 'إلغاء' : 'Cancel' }}
              </button>
              <button
                type="button"
                :disabled="updating"
                class="inline-flex h-10 items-center rounded-md bg-accent px-6 text-xs font-bold text-on-accent shadow-xs transition-colors hover:bg-accent disabled:opacity-50"
                @click="confirmDelivery"
              >
                {{ updating ? (locale === 'ar' ? 'جاري التأكيد…' : 'Confirming…') : (locale === 'ar' ? 'تأكيد التسليم' : 'Confirm Delivery') }}
              </button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- Invoice Preview Modal -->
      <AdminInvoiceModal
        v-if="invoiceModalId"
        :invoice-id="invoiceModalId"
        @close="invoiceModalId = null"
      />
    </div>
  </div>
</template>
