// Canonical Admin permission model (sitemap §User Management).
// Server validates against ALL_PERMISSIONS; UI groups them for display.

export const PERMISSION_GROUPS = {
  dashboard: ['dashboard.financials.view'],
  products: ['products.view', 'products.create', 'products.edit', 'products.delete'],
  orders: ['orders.view', 'orders.manage'],
  categories: ['categories.manage'],
  vip_categories: ['vip_categories.view', 'vip_categories.manage'],
  banners: ['banners.manage'],
  invoices: ['invoices.view', 'invoices.manage'],
  inventory: ['inventory.view'],
  financials: ['financials.view', 'financials.manage'],
  settings: ['settings.view', 'settings.manage'],
  users: ['users.manage'],
} as const

export const ALL_PERMISSIONS: string[] = Object.values(PERMISSION_GROUPS).flat()

export type PermissionGroup = keyof typeof PERMISSION_GROUPS

export function isKnownPermission(p: string): boolean {
  return ALL_PERMISSIONS.includes(p)
}
