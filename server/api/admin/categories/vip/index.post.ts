import { generateSlug, uniqueSlug } from '../../../../../shared/slug'
import { hashPassword } from '../../../../utils/password'
import { logAudit } from '../../../../utils/audit'

export default defineEventHandler(async (event) => {
  const actor = await requirePermission(event, 'vip_categories.manage')
  const body = await readBody(event)

  const nameAr = typeof body.nameAr === 'string' ? body.nameAr.trim() : ''
  const nameEn = typeof body.nameEn === 'string' ? body.nameEn.trim() : ''
  if (!nameAr || !nameEn) throw createError({ statusCode: 400, statusMessage: 'Arabic and English names are required' })

  const vipPassword = typeof body.vipPassword === 'string' ? body.vipPassword : ''
  if (vipPassword.length < 8) throw createError({ statusCode: 400, statusMessage: 'VIP password must be at least 8 characters long' })

  const base = typeof body.slug === 'string' && body.slug.trim()
    ? generateSlug(body.slug)
    : generateSlug(nameEn)
  const slug = await uniqueSlug(base, async slugValue => !!(await prisma.category.findUnique({ where: { slug: slugValue } })))

  const category = await prisma.category.create({
    data: {
      nameAr,
      nameEn,
      slug,
      descriptionAr: typeof body.descriptionAr === 'string' ? body.descriptionAr || null : null,
      descriptionEn: typeof body.descriptionEn === 'string' ? body.descriptionEn || null : null,
      coverVideoUrl: typeof body.coverVideoUrl === 'string' ? body.coverVideoUrl || null : null,
      featuredOnHomepage: body.featuredOnHomepage === true,
      sortOrder: Number(body.sortOrder) || 0,
      type: 'VIP',
      vipPasswordHash: await hashPassword(vipPassword),
      vipAccessVersion: 1,
    },
  })

  await logAudit({
    entityType: 'category',
    entityId: category.id,
    entityName: `${nameAr} / ${nameEn}`,
    action: 'created',
    details: 'Created VIP category',
    user: actor,
  })

  return { category: { ...category, isVip: true }, vipPassword: undefined }
})