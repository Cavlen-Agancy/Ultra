import { hashPassword } from '../../../../../utils/password'
import { logAudit } from '../../../../../utils/audit'

export default defineEventHandler(async (event) => {
  const actor = await requirePermission(event, 'vip_categories.manage')
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Category ID required' })

  const existing = await prisma.category.findFirst({ where: { id, type: 'VIP' } })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'VIP category not found' })

  const body = await readBody(event)
  const password = typeof body.password === 'string' ? body.password : ''
  if (password.length < 8) {
    throw createError({ statusCode: 400, statusMessage: 'Password must be at least 8 characters long' })
  }

  const hash = await hashPassword(password)
  await prisma.$transaction([
    prisma.category.update({
      where: { id: existing.id },
      data: { vipPasswordHash: hash, vipAccessVersion: { increment: 1 } },
    }),
    prisma.vipCategoryAccess.deleteMany({ where: { categoryId: existing.id } }),
  ])

  await logAudit({
    entityType: 'category',
    entityId: existing.id,
    entityName: `${existing.nameAr} / ${existing.nameEn}`,
    action: 'updated',
    details: 'Rotated VIP category password; existing grants invalidated',
    user: actor,
  })
  return { ok: true }
})