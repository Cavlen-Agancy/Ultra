import { generateSlug } from '../../../../../shared/slug'
import { logAudit } from '../../../../utils/audit'

export default defineEventHandler(async (event) => {
  const actor = await requirePermission(event, 'vip_categories.manage')
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Category ID required' })

  const existing = await prisma.category.findFirst({ where: { id, type: 'VIP' } })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'VIP category not found' })

  const body = await readBody(event)
  if (body.type !== undefined && String(body.type).toUpperCase() !== 'VIP') {
    throw createError({ statusCode: 400, statusMessage: 'Category type cannot be changed' })
  }

  const data: Record<string, unknown> = {}

  if (body.nameAr !== undefined) {
    const v = String(body.nameAr).trim()
    if (!v) throw createError({ statusCode: 400, statusMessage: 'Arabic name is required' })
    data.nameAr = v
  }
  if (body.nameEn !== undefined) {
    const v = String(body.nameEn).trim()
    if (!v) throw createError({ statusCode: 400, statusMessage: 'English name is required' })
    data.nameEn = v
  }
  if (body.descriptionAr !== undefined) data.descriptionAr = body.descriptionAr ? String(body.descriptionAr) : null
  if (body.descriptionEn !== undefined) data.descriptionEn = body.descriptionEn ? String(body.descriptionEn) : null
  if (body.coverVideoUrl !== undefined) data.coverVideoUrl = body.coverVideoUrl ? String(body.coverVideoUrl) : null
  if (body.showOnHome !== undefined) data.featuredOnHomepage = body.showOnHome === true
  if (body.featuredOnHomepage !== undefined) data.featuredOnHomepage = body.featuredOnHomepage === true
  if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder) || 0
  if (body.slug !== undefined && String(body.slug).trim() && String(body.slug).trim() !== existing.slug) {
    const candidate = generateSlug(String(body.slug))
    const clash = await prisma.category.findUnique({ where: { slug: candidate } })
    if (clash) throw createError({ statusCode: 409, statusMessage: 'Slug already in use' })
    data.slug = candidate
  }

  const updated = await prisma.category.update({ where: { id: existing.id }, data })
  await logAudit({
    entityType: 'category',
    entityId: existing.id,
    entityName: `${updated.nameAr} / ${updated.nameEn}`,
    action: 'updated',
    details: 'Updated VIP category metadata',
    user: actor,
  })
  return { category: { ...updated, isVip: true } }
})