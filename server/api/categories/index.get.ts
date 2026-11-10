export default defineEventHandler(async (event) => {
  const q = getQuery(event)

  const where: Record<string, unknown> = {}
  if (typeof q.search === 'string' && q.search.trim()) {
    const s = q.search.trim()
    where.OR = [
      { nameEn: { contains: s, mode: 'insensitive' } },
      { nameAr: { contains: s, mode: 'insensitive' } },
      { slug: { contains: s, mode: 'insensitive' } },
    ]
  }

  const select = {
    id: true,
    type: true,
    nameAr: true,
    nameEn: true,
    slug: true,
    descriptionAr: true,
    descriptionEn: true,
    coverImagePath: true,
    coverVideoUrl: true,
    featuredOnHomepage: true,
    sortOrder: true,
    _count: { select: { products: { where: { isActive: true } } } },
  }

  const shape = (row: any) => {
    const { type, ...rest } = row
    const vip = type === 'VIP'
    return {
      ...rest,
      isVip: vip,
      productCount: vip ? 0 : rest._count?.products ?? 0,
    }
  }

  // Pagination is opt-in: only when `page` or `limit` query params are present.
  // This keeps existing callers (navbar dropdown, filter chips) on the full list.
  const hasPagination = q.page !== undefined || q.limit !== undefined
  if (!hasPagination) {
    const rows = await prisma.category.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { nameEn: 'asc' }],
      select,
    })
    return { categories: rows.map(shape) }
  }

  const page = Math.max(1, Number(q.page) || 1)
  const limit = Math.min(50, Math.max(1, Number(q.limit) || 20))

  const [total, rows] = await Promise.all([
    prisma.category.count({ where }),
    prisma.category.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { nameEn: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
      select,
    }),
  ])
  return { categories: rows.map(shape), total, page, limit, pages: Math.ceil(total / limit) }
})