<script setup lang="ts">
import { Globe, Menu, Moon, Sun } from 'lucide-vue-next'

defineEmits<{
  (e: 'toggle-sidebar'): void
}>()

const { t, locale, setLocale } = useI18n()
const localePath = useLocalePath()
const colorMode = useColorMode()
const { data } = useAdminSession()

const isDark = computed(() => colorMode.value === 'dark')

function toggleTheme() {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}

function toggleLocale() {
  setLocale(locale.value === 'ar' ? 'en' : 'ar')
}

const userInitials = computed(() => {
  const name = data.value?.user.name || 'Admin'
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
})
</script>

<template>
  <header
    class="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-surface/95 px-4 backdrop-blur transition-colors lg:px-8"
    :style="{ borderColor: 'var(--color-border)' }"
  >
    <div class="flex items-center gap-3">
      <!-- Mobile menu trigger -->
      <button
        type="button"
        class="flex h-10 w-10 items-center justify-center rounded-md border text-muted transition-colors hover:bg-border/40 lg:hidden dark:text-muted dark:hover:bg-ink-800"
        :aria-label="locale === 'ar' ? 'فتح القائمة الجانبية' : 'Open sidebar'"
        @click="$emit('toggle-sidebar')"
      >
        <Menu class="h-5 w-5" aria-hidden="true" />
      </button>
    </div>

    <div class="flex items-center gap-2">
      <!-- Notification center -->
      <AdminNotificationBell />

      <!-- Latest activity -->
      <AdminActivityBell />

      <!-- Language toggle -->
      <button
        type="button"
        :aria-label="t('common.toggleLanguage')"
        :title="t('common.toggleLanguage')"
        class="flex h-9 items-center gap-1.5 rounded-md border px-2.5 text-xs font-semibold text-text transition-colors hover:bg-border/40 dark:text-muted dark:hover:bg-ink-800"
        @click="toggleLocale"
      >
        <Globe class="h-3.5 w-3.5" aria-hidden="true" />
        <span>{{ locale === 'ar' ? 'English' : 'عربي' }}</span>
      </button>

      <!-- Theme toggle (icon is client-dependent: colorMode resolves 'system' only
        on the client, so SSR renders the Moon fallback to avoid hydration mismatch) -->
      <button
        type="button"
        :aria-label="t('common.toggleTheme')"
        :title="t('common.toggleTheme')"
        class="flex h-9 w-9 items-center justify-center rounded-md border text-text transition-colors hover:bg-border/40 dark:text-muted dark:hover:bg-ink-800"
        @click="toggleTheme"
      >
        <ClientOnly>
          <Moon v-if="!isDark" class="h-4 w-4" aria-hidden="true" />
          <Sun v-else class="h-4 w-4 text-accent" aria-hidden="true" />
          <template #fallback>
            <Moon class="h-4 w-4" aria-hidden="true" />
          </template>
        </ClientOnly>
      </button>

      <div class="h-4 w-[1px] bg-border/50 mx-1 hidden sm:block" />

      <!-- User avatar badge -->
      <div v-if="data?.user" class="hidden sm:flex items-center gap-2.5">
        <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary shadow-sm">
          {{ userInitials }}
        </div>
        <div class="text-xs leading-tight">
          <p class="font-semibold text-text dark:text-text">{{ data.user.name }}</p>
          <p class="text-[10px] text-muted">
            {{ data.user.isSuper ? (locale === 'ar' ? 'مدير عام' : 'Super Admin') : (locale === 'ar' ? 'مدير' : 'Admin') }}
          </p>
        </div>
      </div>
    </div>
  </header>
</template>
