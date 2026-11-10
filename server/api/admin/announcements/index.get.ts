import { defineEventHandler } from 'h3'
import { requirePermission } from '../../../utils/auth'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'settings.view')

  const [items, settings, products] = await Promise.all([
    prisma.announcementItem.findMany({
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.siteSettings.findUnique({
      where: { id: 1 },
      select: { announcementActive: true, announcementBgColor: true },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, slug: true, nameAr: true, nameEn: true },
      orderBy: { nameAr: 'asc' },
      take: 100,
    }),
  ])

  return {
    items,
    active: settings?.announcementActive ?? true,
    bgColor: settings?.announcementBgColor || '#737373',
    products,
  }
})
