<script setup lang="ts">
import { Crown, Loader2, Pencil, Plus, Search, Trash2, X } from 'lucide-vue-next'

const { locale } = useI18n()
const toast = useAdminToast()

interface VipCategory {
  id: string
  nameAr: string
  nameEn: string
  slug: string
  descriptionAr: string | null
  descriptionEn: string | null
  coverImagePath: string | null
  coverVideoUrl: string | null
  featuredOnHomepage: boolean
  sortOrder: number
  productCount?: number
}

const canManage = useAdminCan('vip_categories.manage')
const canView = useAdminCan('vip_categories.view')

const searchQuery = ref('')
const page = ref(1)
const limit = 20
const fetch = useRequestFetch()
const { data, refresh, pending } = await useAsyncData('admin-vip-categories', () =>
  fetch<{ categories: VipCategory[] }>(`/api/admin/categories/vip?search=${encodeURIComponent(searchQuery.value.trim())}&page=${page.value}&limit=${limit}`),
)

const showModal = ref(false)
const editing = ref<VipCategory | null>(null)
const saving = ref(false)
const deletingId = ref<string | null>(null)
const formError = ref('')
const form = reactive({
  nameAr: '',
  nameEn: '',
  slug: '',
  descriptionAr: '',
  descriptionEn: '',
  coverVideoUrl: '',
  featuredOnHomepage: false,
  sortOrder: 0,
  vipPassword: '',
})

const pagedCategories = computed(() => data.value?.categories || [])

function openCreate() {
  editing.value = null
  Object.assign(form, {
    nameAr: '',
    nameEn: '',
    slug: '',
    descriptionAr: '',
    descriptionEn: '',
    coverVideoUrl: '',
    featuredOnHomepage: false,
    sortOrder: 0,
    vipPassword: '',
  })
  formError.value = ''
  showModal.value = true
}

function openEdit(category: VipCategory) {
  editing.value = category
  Object.assign(form, {
    nameAr: category.nameAr,
    nameEn: category.nameEn,
    slug: category.slug,
    descriptionAr: category.descriptionAr || '',
    descriptionEn: category.descriptionEn || '',
    coverVideoUrl: category.coverVideoUrl || '',
    featuredOnHomepage: category.featuredOnHomepage,
    sortOrder: category.sortOrder,
    vipPassword: '',
  })
  formError.value = ''
  showModal.value = true
}

async function save() {
  if (!form.nameAr.trim() || !form.nameEn.trim()) {
    formError.value = locale.value === 'ar' ? 'الاسم باللغتين العربية والإنجليزية مطلوب' : 'Name in both Arabic and English is required.'
    return
  }
  if (!editing.value && form.vipPassword.trim().length < 8) {
    formError.value = locale.value === 'ar' ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters.'
    return
  }
  if (editing.value && form.vipPassword.trim() && form.vipPassword.trim().length < 8) {
    formError.value = locale.value === 'ar' ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters.'
    return
  }

  saving.value = true
  formError.value = ''
  try {
    const payload: any = {
      nameAr: form.nameAr.trim(),
      nameEn: form.nameEn.trim(),
      slug: form.slug.trim() || undefined,
      descriptionAr: form.descriptionAr || null,
      descriptionEn: form.descriptionEn || null,
      coverVideoUrl: form.coverVideoUrl || null,
      featuredOnHomepage: form.featuredOnHomepage,
      sortOrder: form.sortOrder,
    }

    let id = editing.value?.id
    if (editing.value) {
      await $fetch(`/api/admin/categories/vip/${id}`, { method: 'PUT', body: payload })
      if (form.vipPassword.trim()) {
        await $fetch(`/api/admin/categories/vip/${id}/password`, { method: 'PUT', body: { password: form.vipPassword.trim() } })
      }
    } else {
      payload.vipPassword = form.vipPassword.trim()
      const result = await $fetch<{ category: VipCategory }>('/api/admin/categories/vip', { method: 'POST', body: payload })
      id = result.category.id
    }

    showModal.value = false
    await refresh()
    toast.success(
      locale.value === 'ar' ? 'تم حفظ VIP' : 'VIP saved',
      locale.value === 'ar' ? `تم حفظ فئة VIP "${form.nameAr || form.nameEn}".` : `"${form.nameEn}" saved.`,
    )
  } catch (e: any) {
    formError.value = e?.data?.message || 'Save failed'
    toast.error(locale.value === 'ar' ? 'فشل حفظ VIP' : 'Save Failed', formError.value)
  } finally {
    saving.value = false
  }
}

async function removeCategory(category: VipCategory) {
  const confirmed = await useAdminConfirm().confirm({
    title: locale.value === 'ar' ? `حذف VIP "${category.nameAr || category.nameEn}"؟` : `Delete VIP category "${category.nameEn}"?`,
    message: locale.value === 'ar' ? 'لا يمكن التراجع عن هذا الإجراء.' : 'This action cannot be undone.',
  })
  if (!confirmed) return
  deletingId.value = category.id
  try {
    await $fetch(`/api/admin/categories/vip/${category.id}`, { method: 'DELETE' })
    await refresh()
    toast.success(locale.value === 'ar' ? 'تم حذف VIP' : 'VIP Deleted', locale.value === 'ar' ? `تم حذف VIP "${category.nameAr || category.nameEn}".` : `VIP "${category.nameEn}" deleted.`)
  } catch (e: any) {
    toast.error(locale.value === 'ar' ? 'فشل حذف VIP' : 'Delete Failed', e?.data?.message || 'Delete failed')
  } finally {
    deletingId.value = null
  }
}

const inputCls = 'h-10 w-full rounded-md border bg-transparent px-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:border-primary'
</script>

<template>
  <div v-if="!canView">
    <p class="text-sm text-muted">{{ locale === 'ar' ? 'لا تملك صلاحية عرض VIP' : 'You do not have permission to view VIP categories.' }}</p>
  </div>
  <div v-else>
    <div class="mb-4 flex items-center justify-between gap-3">
      <p class="text-sm text-muted">{{ locale === 'ar' ? 'إدارة VIP' : 'Manage VIP categories' }}</p>
      <button v-if="canManage" type="button" class="inline-flex h-9 items-center gap-1.5 rounded-md bg-accent px-4 text-xs font-semibold text-on-accent" @click="openCreate">
        <Plus class="h-4 w-4" />
        {{ locale === 'ar' ? 'إضافة VIP' : 'Add VIP' }}
      </button>
    </div>

    <div v-if="pending" class="rounded-md border bg-surface p-6 text-sm text-muted">{{ locale === 'ar' ? 'جاري التحميل...' : 'Loading...' }}</div>
    <div v-else-if="!pagedCategories.length" class="rounded-md border bg-surface p-6 text-sm text-muted">{{ locale === 'ar' ? 'لا توجد VIP' : 'No VIP categories yet' }}</div>
    <div v-else class="overflow-x-auto rounded-md border bg-surface">
      <table class="w-full min-w-[720px] text-sm">
        <thead class="border-b bg-border/10 text-[11px] uppercase tracking-wider text-muted">
          <tr>
            <th class="px-4 py-3 text-start">{{ locale === 'ar' ? 'VIP' : 'VIP' }}</th>
            <th class="px-4 py-3 text-start">{{ locale === 'ar' ? 'Slug' : 'Slug' }}</th>
            <th class="px-4 py-3 text-center">{{ locale === 'ar' ? 'المنتجات' : 'Products' }}</th>
            <th class="px-4 py-3 text-end">{{ locale === 'ar' ? 'الإجراءات' : 'Actions' }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          <tr v-for="c in pagedCategories" :key="c.id">
            <td class="px-4 py-3">
              <div class="font-semibold text-text">{{ locale === 'ar' ? c.nameAr : c.nameEn }}</div>
              <div class="text-xs text-muted">{{ locale === 'ar' ? c.nameEn : c.nameAr }}</div>
            </td>
            <td class="px-4 py-3 text-xs text-muted">{{ c.slug }}</td>
            <td class="px-4 py-3 text-center text-xs text-muted">{{ c.productCount ?? 0 }}</td>
            <td class="px-4 py-3 text-end">
              <div class="flex justify-end gap-1">
                <button v-if="canManage" type="button" class="inline-flex h-8 w-8 items-center justify-center rounded text-primary hover:bg-primary/10" @click="openEdit(c)">
                  <Pencil class="h-4 w-4" />
                </button>
                <button v-if="canManage" type="button" class="inline-flex h-8 w-8 items-center justify-center rounded text-error hover:bg-error/10" :disabled="deletingId === c.id" @click="removeCategory(c)">
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-xs" role="dialog" aria-modal="true" @click.self="showModal = false">
      <div class="my-8 w-full max-w-[560px] overflow-y-auto rounded-lg border bg-surface p-6 shadow-xl" :style="{ borderColor: 'var(--color-border)' }">
        <div class="mb-5 flex items-center justify-between border-b pb-4">
          <div>
            <h2 class="font-heading text-lg font-bold text-text">{{ editing ? (locale === 'ar' ? 'تعديل VIP' : 'Edit VIP') : (locale === 'ar' ? 'إضافة VIP' : 'Add VIP') }}</h2>
            <p class="text-xs text-muted">{{ locale === 'ar' ? 'بيانات VIP' : 'VIP details' }}</p>
          </div>
          <button type="button" class="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-border/40" @click="showModal = false">
            <X class="h-5 w-5" />
          </button>
        </div>
        <div v-if="formError" role="alert" class="mb-4 rounded-md border border-error/30 bg-error/10 p-3 text-xs font-medium text-error">
          {{ formError }}
        </div>
        <div class="space-y-4">
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="block">
              <span class="mb-1 block text-xs font-semibold text-text">Name (EN) *</span>
              <input v-model="form.nameEn" type="text" required class="h-10 w-full rounded-md border bg-transparent px-3 text-sm" :style="{ borderColor: 'var(--color-border)' }" />
            </label>
            <label class="block">
              <span class="mb-1 block text-xs font-semibold text-text">Name (AR) *</span>
              <input v-model="form.nameAr" type="text" required dir="rtl" class="h-10 w-full rounded-md border bg-transparent px-3 text-sm" :style="{ borderColor: 'var(--color-border)' }" />
            </label>
          </div>
          <label class="block">
            <span class="mb-1 block text-xs font-semibold text-text">Slug</span>
            <input v-model="form.slug" type="text" class="h-10 w-full rounded-md border bg-transparent px-3 text-sm" :style="{ borderColor: 'var(--color-border)' }" />
          </label>
          <label class="block">
            <span class="mb-1 block text-xs font-semibold text-text">{{ editing ? (locale === 'ar' ? 'كلمة مرور جديدة (اختياري)' : 'New password (optional)') : (locale === 'ar' ? 'كلمة مرور VIP' : 'VIP password') }}</span>
            <input v-model="form.vipPassword" type="password" class="h-10 w-full rounded-md border bg-transparent px-3 text-sm" :style="{ borderColor: 'var(--color-border)' }" />
          </label>
          <div class="flex flex-wrap items-center justify-between gap-4 border-t pt-4">
            <label class="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-text">
              <input v-model="form.featuredOnHomepage" type="checkbox" class="h-4 w-4 rounded accent-primary" />
              <span>{{ locale === 'ar' ? 'مميز بالرئيسية' : 'Feature on homepage' }}</span>
            </label>
            <label class="inline-flex items-center gap-2 text-xs font-medium text-text">
              <span>{{ locale === 'ar' ? 'الترتيب:' : 'Sort order:' }}</span>
              <input v-model.number="form.sortOrder" type="number" class="h-8 w-20 rounded border bg-transparent px-2 text-center text-xs" :style="{ borderColor: 'var(--color-border)' }" />
            </label>
          </div>
        </div>
        <div class="mt-6 flex items-center justify-end gap-2.5 border-t pt-4">
          <button type="button" class="h-9 rounded-md border px-4 text-xs font-semibold text-text" @click="showModal = false">
            {{ locale === 'ar' ? 'إلغاء' : 'Cancel' }}
          </button>
          <button type="button" :disabled="saving || !canManage" class="inline-flex h-9 items-center gap-1.5 rounded-md bg-accent px-5 text-xs font-semibold text-on-accent disabled:opacity-50" @click="save">
            <span>{{ saving ? (locale === 'ar' ? 'جاري الحفظ…' : 'Saving…') : (locale === 'ar' ? 'حفظ VIP' : 'Save VIP') }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>