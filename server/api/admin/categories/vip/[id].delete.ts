import { logAudit } from '../../../../utils/audit'

export default defineEventHandler(async (event) => {
  const actor = await requirePermission(event, 'vip_categories.manage')
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Category ID required' })

  const existing = await prisma.category.findFirst({
    where: { id, type: 'VIP' },
    include: { _count: { select: { productCategories: true } } },
  })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'VIP category not found' })
  if (existing._count.productCategories > 0) {
    throw createError({ statusCode: 409, statusMessage: 'Remove or reassign products first' })
  }

  await prisma.category.delete({ where: { id: existing.id } })
  await logAudit({
    entityType: 'category',
    entityId: existing.id,
    entityName: `${existing.nameAr} / ${existing.nameEn}`,
    action: 'deleted',
    details: 'Deleted VIP category',
    user: actor,
  })
  return { ok: true }
})