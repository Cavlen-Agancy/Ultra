import { Package, ShieldAlert, Users } from 'lucide-vue-next'

export interface NotificationTypeMeta {
  en: string
  ar: string
  icon: any
  /** Tinted chip classes for icon container + dot. */
  chip: string
  dot: string
}

/** Shared visual language for notification types (bell + full page). */
export function useNotificationUi() {
  const { locale } = useI18n()

  const TYPE_META: Record<string, NotificationTypeMeta> = {
    order: {
      en: 'Orders', ar: 'الطلبات', icon: Package,
      chip: 'bg-blue-50 text-primary dark:bg-blue-950/50 dark:text-blue-300',
      dot: 'bg-primary dark:bg-accent',
    },
    staff: {
      en: 'Staff', ar: 'الموظفون', icon: Users,
      chip: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
      dot: 'bg-slate-400',
    },
    security: {
      en: 'Security', ar: 'الأمان', icon: ShieldAlert,
      chip: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300',
      dot: 'bg-rose-500',
    },
  }

  function typeGroupOf(type: string) {
    if (type === 'new_order' || type === 'payment_confirmed') return 'order'
    if (type === 'new_staff_user' || type === 'staff_updated') return 'staff'
    return 'security'
  }

  function typeLabel(group: string) {
    const m = TYPE_META[group]
    if (!m) return group
    return locale.value === 'ar' ? m.ar : m.en
  }

  return { TYPE_META, typeGroupOf, typeLabel }
}
