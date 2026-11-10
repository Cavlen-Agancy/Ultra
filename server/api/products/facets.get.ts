export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const where: Record<string, unknown> = { isActive: true }

  if (typeof q.category === 'string' && q.category) {
    const cat = await prisma.category.findUnique({ where: { slug: q.category } })
    if (!cat) {
      return { minPrice: 0, maxPrice: 0, attributes: [] }
    }
    if (cat.type === 'VIP') {
      const { hasVipGrantBySlug } = await import('../../utils/vip-access')
      if (!(await hasVipGrantBySlug(event, cat.slug))) {
        return { minPrice: 0, maxPrice: 0, attributes: [] }
      }
    }
    where.categories = { some: { categoryId: cat.id } }
    if (cat.type !== 'VIP') {
      const conditions: any[] = where.AND ? [...(Array.isArray(where.AND) ? where.AND : [where.AND])] : []
      conditions.push({ categories: { none: { category: { type: 'VIP' } } } })
      where.AND = conditions
    }
  }

  if (typeof q.search === 'string' && q.search.trim()) {
    const s = q.search.trim()
    const conditions = Array.isArray(where.AND) ? [...where.AND] : []
    conditions.push({ OR: [
      { nameEn: { contains: s, mode: 'insensitive' } },
      { nameAr: { contains: s, mode: 'insensitive' } },
    ] })
    where.AND = conditions
  }

  if (!where.AND) {
    where.AND = [{ categories: { none: { category: { type: 'VIP' } } } }]
  } else if (Array.isArray(where.AND) && !where.AND.some((cond: any) => cond.categories?.none?.category?.type === 'VIP')) {
    ;(where.AND as any[]).push({ categories: { none: { category: { type: 'VIP' } } } })
  }

  const [priceAgg, rawAttributes] = await Promise.all([
    prisma.product.aggregate({ where, _min: { price: true }, _max: { price: true } }),
    prisma.productAttribute.findMany({ where: { product: where }, select: { keyEn: true, keyAr: true, valueEn: true, valueAr: true } }),
  ])

  // clustering logic unchanged
  const groupMap = new Map<string, { keyEn: string; keyAr: string; valuesMap: Map<string, { valueEn: string; valueAr: string; count: number }> }>()
  for (const attr of rawAttributes) {
    const kEn = attr.keyEn.trim()
    if (!kEn) continue
    if (!groupMap.has(kEn)) {
      groupMap.set(kEn, {
        keyEn: kEn,
        keyAr: attr.keyAr.trim() || kEn,
        valuesMap: new Map(),
      })
    }
    const group = groupMap.get(kEn)!
    const vEn = attr.valueEn.trim()
    if (!vEn) continue
    if (!group.valuesMap.has(vEn)) {
      group.valuesMap.set(vEn, { valueEn: vEn, valueAr: attr.valueAr.trim() || vEn, count: 1 })
    } else {
      group.valuesMap.get(vEn)!.count++
    }
  }

  const attributes = Array.from(groupMap.values()).map(g => ({
    keyEn: g.keyEn,
    keyAr: g.keyAr,
    values: Array.from(g.valuesMap.values()).sort((a, b) => b.count - a.count),
  }))

  function facetPriority(keyEn: string, keyAr: string): number {
    const k = `${keyEn} ${keyAr}`
    if (/volt|فولت|جهد/i.test(k)) return 0
    if (/brand|manufacturer|العلامة|الماركة|الشركة المصنعة/i.test(k)) return 1
    return 2
  }
  attributes.sort((a, b) => facetPriority(a.keyEn, a.keyAr) - facetPriority(b.keyEn, b.keyAr))

  const minPrice = priceAgg._min.price ? Math.floor(Number(priceAgg._min.price)) : 0
  const maxPrice = priceAgg._max.price ? Math.ceil(Number(priceAgg._max.price)) : 0
  return { minPrice, maxPrice, attributes }
})