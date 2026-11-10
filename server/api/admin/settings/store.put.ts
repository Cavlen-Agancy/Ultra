import { defineEventHandler, readBody } from 'h3'
import { requirePermission } from '../../../utils/auth'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'settings.manage')
  const body = await readBody(event)
  const vatRate = body.vatRate === undefined || body.vatRate === null || body.vatRate === ''
    ? undefined
    : Math.min(100, Math.max(0, Math.floor(Number(body.vatRate) || 0)))
  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {
      defaultCurrency: body.defaultCurrency,
      productsPerPage: Number(body.productsPerPage) || 16,
      ...(vatRate !== undefined ? { vatRate } : {}),
      ...(body.pricesIncludeVat !== undefined ? { pricesIncludeVat: !!body.pricesIncludeVat } : {}),
      ...(body.vatNumber !== undefined
        ? { vatNumber: String(body.vatNumber).trim() || null }
        : {}),
    },
    create: {
      siteNameAr: 'Ultra',
      siteNameEn: 'Ultra',
    }
  })
  return { success: true }
})
