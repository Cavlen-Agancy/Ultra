interface AttrFilter {
  key?: string
  value?: string
}

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const page = Math.max(1, Number(q.page) || 1)
  const limit = Math.min(50, Math.max(1, Number(q.limit) || 16))
  const where: Record<string, unknown> = { isActive: true }

  const requestedCategory = typeof q.category === 'string' ? q.category.trim() : ''
  let categoryType: string | null = null
  if (requestedCategory) {
    const category = await prisma.category.findUnique({
      where: { slug: requestedCategory },
      select: { id: true, type: true, slug: true },
    })
    if (!category) return { products: [], total: 0, page, limit, pages: 0 }

    if (category.type === 'VIP') {
      const { hasVipGrantBySlug } = await import('../../utils/vip-access')
      if (!(await hasVipGrantBySlug(event, category.slug))) {
        throw createError({ statusCode: 404, statusMessage: 'Category not found' })
      }
      categoryType = 'VIP'
      const filters: Record<string, unknown>[] = [
        { categories: { some: { categoryId: category.id } } },
      ]
      where.AND = filters
    } else {
      categoryType = String(category.type)
      const filters: Record<string, unknown>[] = [
        { categories: { some: { categoryId: category.id } } },
        { categories: { none: { category: { type: 'VIP' } } } },
      ]
      where.AND = filters
    }
  }

  // All normal public discovery must exclude products assigned to any VIP category.
  if (!requestedCategory || (typeof requestedCategory === 'string' && requestedCategory === '')) {
    // Fall through: category handling already sets AND; still add global exclusion.
  }

  // Handle other filters and AND composition.
  // We avoid overwriting category-derived conditions.
  const compound = Array.isArray(where.AND) ? [...where.AND] : []

  if (typeof q.search === 'string' && q.search.trim()) {
    const s = q.search.trim()
    compound.push({
      OR: [
        { nameEn: { contains: s, mode: 'insensitive' } },
        { nameAr: { contains: s, mode: 'insensitive' } },
        { slug: { contains: s, mode: 'insensitive' } },
        { categories: { some: { category: { is: { nameEn: { contains: s, mode: 'insensitive' } } } } } },
        { categories: { some: { category: { is: { nameAr: { contains: s, mode: 'insensitive' } } } } } },
        { seo: { is: { keywords: { contains: s, mode: 'insensitive' } } } },
      ],
    })
  }
  const price: Record<string, number> = {}
  if (q.minPrice !== undefined && q.minPrice !== '') price.gte = Number(q.minPrice)
  if (q.maxPrice !== undefined && q.maxPrice !== '') price.lte = Number(q.maxPrice)
  if (Object.keys(price).length) where.price = price

  if (typeof q.attributes === 'string' && q.attributes) {
    try {
      const filters = JSON.parse(q.attributes) as AttrFilter[]
      const valid = (Array.isArray(filters) ? filters : []).filter(f => f.key && f.value)

      const keyMap = new Map<string, string[]>()
      for (const item of valid) {
        const k = String(item.key).trim()
        const v = String(item.value).trim()
        if (!k || !v) continue
        if (!keyMap.has(k)) keyMap.set(k, [])
        keyMap.get(k)!.push(v)
      }

      const andConditions = Array.from(keyMap.entries()).map(([k, values]) => ({
        attributes: {
          some: {
            AND: [
              {
                OR: [
                  { keyEn: { equals: k, mode: 'insensitive' as const } },
                  { keyAr: { equals: k, mode: 'insensitive' as const } },
                  { keyEn: { contains: k, mode: 'insensitive' as const } },
                ],
              },
              {
                OR: values.flatMap(v => [
                  { valueEn: { equals: v, mode: 'insensitive' as const } },
                  { valueAr: { equals: v, mode: 'insensitive' as const } },
                  { valueEn: { contains: v, mode: 'insensitive' as const } },
                ]),
              },
            ],
          },
        },
      }))

      for (const cond of andConditions) compound.push(cond)
    }
    catch { /* ignore malformed filter */ }
  }

  // For all normal/non-granted listing: keep VIP product exclusion.
  if (!requestedCategory || categoryType !== 'VIP') {
    compound.push({ categories: { none: { category: { type: 'VIP' } } } })
  }

  if (compound.length) where.AND = compound
  if (price && Object.keys(price).length) where.price = price

  const orderBy = q.sort === 'price_asc'
    ? { price: 'asc' as const }
    : q.sort === 'price_desc'
      ? { price: 'desc' as const }
      : { createdAt: 'desc' as const }

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        slug: true,
        nameAr: true,
        nameEn: true,
        price: true,
        compareAtPrice: true,
        categories: { select: { category: { select: { id: true, slug: true, nameAr: true, nameEn: true } } } },
        images: { where: { isCover: true }, take: 1, select: { path: true } },
      },
    }),
  ])

  return {
    products: products.map(p => ({
      ...p,
      category: p.categories[0]?.category || null,
      coverImage: p.images[0]?.path || null,
      images: undefined,
    })),
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  }
})