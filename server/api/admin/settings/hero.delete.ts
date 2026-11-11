import { defineEventHandler, getQuery } from 'h3'
import { requirePermission } from '../../../utils/auth'
import { prisma } from '../../../utils/prisma'
import { heroImageSlotData, parseHeroImageSlot } from '../../../utils/hero-images'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'settings.manage')
  const slot = parseHeroImageSlot(getQuery(event).slot)
  const data = heroImageSlotData(slot, null)

  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: data,
    create: { siteNameAr: 'Ultra', siteNameEn: 'Ultra', ...data },
  })
  return { success: true, slot }
})
