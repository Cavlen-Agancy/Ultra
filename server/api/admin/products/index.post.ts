import { generateSlug, uniqueSlug } from '../../../../shared/slug'
import { createdLabel, logAudit } from '../../../utils/audit'

interface AttrInput {
  keyAr?: string
  keyEn?: string
  valueAr?: string
  valueEn?: string
}

interface SeoInput {
  metaTitleAr?: string
  metaTitleEn?: string
  metaDescriptionAr?: string
  metaDescriptionEn?: string
  keywords?: string
  geoContent?: string
}

function cleanAttributes(input: unknown): AttrInput[] {
  if (!Array.isArray(input)) return []
  return input
    .filter(a => a && (a.keyEn || a.keyAr))
    .map(a => ({
      keyAr: String(a.keyAr || a.keyEn || ''),
      keyEn: String(a.keyEn || a.keyAr || ''),
      valueAr: String(a.valueAr ?? a.valueEn ?? ''),
      valueEn: String(a.valueEn ?? a.valueAr ?? ''),
    }))
}

function cleanSeo(input: unknown): SeoInput | null {
  if (!input || typeof input !== 'object') return null
  const s = input as Record<string, unknown>
  const out: SeoInput = {}
  for (const k of ['metaTitleAr', 'metaTitleEn', 'metaDescriptionAr', 'metaDescriptionEn', 'keywords', 'geoContent'] as const) {
    if (s[k] !== undefined) out[k] = String(s[k] || '') || undefined
  }
  return Object.keys(out).length ? out : null
}

export default defineEventHandler(async (event) => {
  const actor = await requirePermission(event, 'products.create')
  const body = await readBody(event)

  const nameAr = typeof body.nameAr === 'string' ? body.nameAr.trim() : ''
  const nameEn = typeof body.nameEn === 'string' ? body.nameEn.trim() : ''
  if (!nameAr || !nameEn) throw createError({ statusCode: 400, statusMessage: 'Arabic and English names are required' })
  const categoryIds: string[] = Array.isArray(body?.categoryIds)
    ? Array.from(new Set((body.categoryIds as any[]).map((value: any) => String(value ?? '').trim()).filter((value): value is string => value.length > 0)))
    : body?.categoryId
      ? [String(body.categoryId).trim()]
      : []

  const categoryRows = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, type: true },
  })
  if (categoryRows.length !== categoryIds.length) {
    throw createError({ statusCode: 400, statusMessage: 'Category not found' })
  }

  const categoryTypes = [...new Set(categoryRows.map(c => String(c.type)))]
  if (categoryTypes.length !== 1) {
    throw createError({ statusCode: 400, statusMessage: 'Products cannot mix NORMAL and VIP categories' })
  }

  if (!actor.isSuper) {
    if (categoryTypes.includes('NORMAL') && !actor.permissions.includes('categories.manage')) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }
    if (categoryTypes.includes('VIP') && !actor.permissions.includes('vip_categories.manage')) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }
  }

  const [category] = categoryRows

  const price = Number(body.price)
  if (!Number.isFinite(price) || price < 0) throw createError({ statusCode: 400, statusMessage: 'Valid price is required' })
  const compareAt = body.compareAtPrice === undefined || body.compareAtPrice === '' || body.compareAtPrice === null
    ? null
    : Number(body.compareAtPrice)
  if (compareAt !== null && (!Number.isFinite(compareAt) || compareAt <= price)) {
    throw createError({ statusCode: 400, statusMessage: 'Compare-at price must be greater than price' })
  }

  const base = typeof body.slug === 'string' && body.slug.trim() ? generateSlug(body.slug) : generateSlug(nameEn)
  const slug = await uniqueSlug(base, async s => !!(await prisma.product.findUnique({ where: { slug: s } })))
  const seo = cleanSeo(body.seo)

  const costPrice = body.costPrice === undefined || body.costPrice === '' || body.costPrice === null
    ? null
    : Number(body.costPrice)
  if (costPrice !== null && (!Number.isFinite(costPrice) || costPrice < 0)) {
    throw createError({ statusCode: 400, statusMessage: 'Valid cost price is required' })
  }
  const stock = body.stock === undefined || body.stock === '' || body.stock === null ? 0 : Math.max(0, Math.floor(Number(body.stock)))
  if (!Number.isFinite(stock)) throw createError({ statusCode: 400, statusMessage: 'Valid stock quantity is required' })
  const minStock = body.minStock === undefined || body.minStock === '' || body.minStock === null ? 5 : Math.max(0, Math.floor(Number(body.minStock)))
  if (!Number.isFinite(minStock)) throw createError({ statusCode: 400, statusMessage: 'Valid minimum stock is required' })

  const product = await prisma.product.create({
    data: {
      nameAr,
      nameEn,
      slug,
      descriptionAr: body.descriptionAr || null,
      descriptionEn: body.descriptionEn || null,
      price,
      compareAtPrice: compareAt,
      costPrice,
      stock,
      minStock,
      categoryId: categoryIds[0] as string,
      categories: {
        create: categoryIds.map((id: string) => ({ categoryId: id })),
      },
      isActive: body.isActive !== false,
      attributes: { create: cleanAttributes(body.attributes) as any },
      ...(seo ? { seo: { create: seo } } : {}),
    },
    include: { attributes: true, seo: true, images: true, categories: true },
  })
  await logAudit({
    entityType: 'product',
    entityId: product.id,
    entityName: `${nameAr} / ${nameEn}`,
    action: 'created',
    details: createdLabel('product'),
    user: actor,
  })
  if (stock > 0) {
    try {
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          quantity: stock,
          costPrice,
          reason: 'initial',
          userId: actor.userId,
          userName: actor.name,
        },
      })
    }
    catch { /* movement log is best-effort */ }
  }
  return { product }
})
