import { defineEventHandler, getQuery } from 'h3'
import { requirePermission } from '../../../utils/auth'
import { prisma } from '../../../utils/prisma'
import { heroImageSlotData, parseHeroImageSlot, parseHeroImageVariant } from '../../../utils/hero-images'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'settings.manage')
  const query = getQuery(event)
  const slot = parseHeroImageSlot(query.slot)
  const variant = parseHeroImageVariant(query.variant)
  const data = heroImageSlotData(slot, variant, null)

  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: data,
    create: { siteNameAr: 'Ultra', siteNameEn: 'Ultra', ...data },
  })
  return { success: true, slot, variant }
})
