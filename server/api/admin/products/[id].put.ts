import { generateSlug } from '../../../../shared/slug'
import { logAudit } from '../../../utils/audit'

interface ProductAttributeInput {
  keyAr?: unknown
  keyEn?: unknown
  valueAr?: unknown
  valueEn?: unknown
}

interface ProductSeoInput {
  metaTitleAr?: unknown
  metaTitleEn?: unknown
  metaDescriptionAr?: unknown
  metaDescriptionEn?: unknown
  keywords?: unknown
  geoContent?: unknown
}

interface ProductUpdateBody {
  nameAr?: unknown
  nameEn?: unknown
  descriptionAr?: unknown
  descriptionEn?: unknown
  price?: unknown
  compareAtPrice?: unknown
  costPrice?: unknown
  stock?: unknown
  minStock?: unknown
  categoryIds?: unknown
  categoryId?: unknown
  isActive?: unknown
  slug?: unknown
  attributes?: unknown
  seo?: unknown
}

export default defineEventHandler(async (event) => {
  const actor = await requirePermission(event, 'products.edit')
  const id = getRouterParam(event, 'id')
  const body = await readBody<ProductUpdateBody>(event)

  const existing = await prisma.product.findUnique({ where: { id: id || '' } })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Product not found' })

  const changes: string[] = []
  const data: Record<string, unknown> = {}
  if (body.nameAr !== undefined && String(body.nameAr).trim() !== existing.nameAr) {
    data.nameAr = String(body.nameAr).trim()
    changes.push('عدّل الاسم')
  }
  if (body.nameEn !== undefined && String(body.nameEn).trim() !== existing.nameEn) {
    data.nameEn = String(body.nameEn).trim()
    if (!changes.includes('عدّل الاسم')) changes.push('عدّل الاسم')
  }
  if (body.descriptionAr !== undefined || body.descriptionEn !== undefined) {
    const newAr = body.descriptionAr !== undefined ? (body.descriptionAr || null) : existing.descriptionAr
    const newEn = body.descriptionEn !== undefined ? (body.descriptionEn || null) : existing.descriptionEn
    if (newAr !== existing.descriptionAr || newEn !== existing.descriptionEn) changes.push('عدّل الوصف')
    if (body.descriptionAr !== undefined) data.descriptionAr = body.descriptionAr || null
    if (body.descriptionEn !== undefined) data.descriptionEn = body.descriptionEn || null
  }
  if (body.price !== undefined) {
    const price = Number(body.price)
    if (!Number.isFinite(price) || price < 0) throw createError({ statusCode: 400, statusMessage: 'Valid price is required' })
    if (price !== Number(existing.price)) changes.push('عدّل السعر')
    data.price = price
  }
  if (body.compareAtPrice !== undefined) {
    const current = (data.price as number | undefined) ?? Number(existing.price)
    const compareAt = body.compareAtPrice === '' || body.compareAtPrice === null ? null : Number(body.compareAtPrice)
    if (compareAt !== null && (!Number.isFinite(compareAt) || compareAt <= current)) {
      throw createError({ statusCode: 400, statusMessage: 'Compare-at price must be greater than price' })
    }
    const oldCompare = existing.compareAtPrice === null ? null : Number(existing.compareAtPrice)
    if (compareAt !== oldCompare && !changes.includes('عدّل السعر')) changes.push('عدّل السعر')
    data.compareAtPrice = compareAt
  }
  if (body.costPrice !== undefined) {
    const cost = body.costPrice === '' || body.costPrice === null ? null : Number(body.costPrice)
    if (cost !== null && (!Number.isFinite(cost) || cost < 0)) {
      throw createError({ statusCode: 400, statusMessage: 'Valid cost price is required' })
    }
    const oldCost = existing.costPrice === null ? null : Number(existing.costPrice)
    if (cost !== oldCost) changes.push('عدّل سعر الشراء')
    data.costPrice = cost
  }
  if (body.stock !== undefined) {
    const stock = Math.max(0, Math.floor(Number(body.stock)))
    if (!Number.isFinite(stock)) throw createError({ statusCode: 400, statusMessage: 'Valid stock quantity is required' })
    if (stock !== existing.stock) changes.push('عدّل المخزون')
    data.stock = stock
  }
  if (body.minStock !== undefined) {
    const minStock = Math.max(0, Math.floor(Number(body.minStock)))
    if (!Number.isFinite(minStock)) throw createError({ statusCode: 400, statusMessage: 'Valid minimum stock is required' })
    if (minStock !== existing.minStock && !changes.includes('عدّل المخزون')) changes.push('عدّل المخزون')
    data.minStock = minStock
  }
  const categoryChange: string[] | undefined =
    body.categoryIds !== undefined || body.categoryId !== undefined
      ? Array.isArray(body.categoryIds)
        ? Array.from(new Set((body.categoryIds as unknown[]).map(value => String(value ?? '').trim()).filter(value => value.length > 0)))
        : [String(body.categoryId ?? '').trim()]
      : undefined

  if (categoryChange !== undefined) {
    if (!categoryChange.length) throw createError({ statusCode: 400, statusMessage: 'At least one category is required' })
    const categoryRows = await prisma.category.findMany({
      where: { id: { in: categoryChange } },
      select: { id: true, type: true },
    })
    if (categoryRows.length !== categoryChange.length) throw createError({ statusCode: 400, statusMessage: 'Category not found' })
    const categoryTypes = [...new Set(categoryRows.map(c => String(c.type)))]
    if (categoryTypes.length !== 1) throw createError({ statusCode: 400, statusMessage: 'Products cannot mix NORMAL and VIP categories' })
    if (!actor.isSuper) {
      if (categoryTypes.includes('NORMAL') && !actor.permissions.includes('categories.manage')) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
      if (categoryTypes.includes('VIP') && !actor.permissions.includes('vip_categories.manage')) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }
    const primary = (categoryRows.find(c => c.id === categoryChange[0]) || categoryRows[0]) as any
    if (primary.id !== existing.categoryId) changes.push('غيّر القسم')
    data.categoryId = primary.id
  }

  if (body.isActive !== undefined) {
    const next = body.isActive === true
    if (next !== existing.isActive) changes.push(next ? 'فعّل المنتج' : 'عطّل المنتج')
    data.isActive = next
  }
  if (body.slug !== undefined && String(body.slug).trim() && String(body.slug).trim() !== existing.slug) {
    const base = generateSlug(String(body.slug))
    const clash = await prisma.product.findUnique({ where: { slug: base } })
    if (clash) throw createError({ statusCode: 409, statusMessage: 'Slug already in use' })
    data.slug = base
    changes.push('عدّل الرابط')
  }
  if (body.attributes !== undefined) changes.push('عدّل المواصفات')
  if (body.seo !== undefined) changes.push('عدّل السيو')

  const result = await prisma.$transaction(async (tx) => {
    if (categoryChange !== undefined) {
      await tx.productCategory.deleteMany({ where: { productId: existing.id } })
      await tx.productCategory.createMany({
        data: categoryChange.map((id: string) => ({ productId: existing.id, categoryId: id })),
      })
    }
    if (body.attributes !== undefined) {
      const rawAttributes = Array.isArray(body.attributes)
        ? (body.attributes as ProductAttributeInput[])
        : []

      const attrs = rawAttributes
        .filter(a => a && (a.keyEn || a.keyAr))
        .map(a => ({
          keyAr: String(a.keyAr || a.keyEn || ''),
          keyEn: String(a.keyEn || a.keyAr || ''),
          valueAr: String(a.valueAr ?? a.valueEn ?? ''),
          valueEn: String(a.valueEn ?? a.valueAr ?? ''),
        }))

      await tx.productAttribute.deleteMany({ where: { productId: existing.id } })
      if (attrs.length) await tx.productAttribute.createMany({ data: attrs.map(a => ({ ...a, productId: existing.id })) })
    }
    if (body.seo !== undefined && body.seo && typeof body.seo === 'object') {
      const s = body.seo as ProductSeoInput
      const seoData: Record<string, string | null> = {}
      for (const k of ['metaTitleAr', 'metaTitleEn', 'metaDescriptionAr', 'metaDescriptionEn', 'keywords', 'geoContent'] as const) {
        const value = s[k]
        if (value !== undefined) seoData[k] = value ? String(value) : null
      }
      await tx.productSeo.upsert({
        where: { productId: existing.id },
        update: seoData,
        create: { productId: existing.id, ...seoData },
      })
    }
    return tx.product.update({
      where: { id: existing.id },
      data,
      include: { attributes: true, seo: true, images: { orderBy: { sortOrder: 'asc' } } },
    })
  })
  if (changes.length) {
    await logAudit({
      entityType: 'product',
      entityId: existing.id,
      entityName: `${String(data.nameAr ?? existing.nameAr)} / ${String(data.nameEn ?? existing.nameEn)}`,
      action: 'updated',
      details: changes.join('، '),
      user: actor,
    })
  }
  // Track stock additions for the monthly inventory-valuation report.
  if (data.stock !== undefined && Number(data.stock) > existing.stock) {
    try {
      await prisma.stockMovement.create({
        data: {
          productId: existing.id,
          quantity: Number(data.stock) - existing.stock,
          costPrice: existing.costPrice,
          reason: 'adjustment',
          userId: actor.userId,
          userName: actor.name,
        },
      })
    }
    catch { /* movement log is best-effort */ }
  }
  return { product: result }
})
