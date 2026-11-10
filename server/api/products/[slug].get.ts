import { hasVipGrantBySlug } from '../../utils/vip-access'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  const product = await prisma.product.findFirst({
    where: {
      isActive: true,
      OR: [
        { slug: slug || '' },
        { id: slug || '' },
      ],
    },
    include: {
      categories: {
        include: {
          category: { select: { id: true, slug: true, nameAr: true, nameEn: true, type: true } },
        },
      },
      category: { select: { id: true, slug: true, nameAr: true, nameEn: true } },
      images: { orderBy: { sortOrder: 'asc' } },
      attributes: true,
      seo: true,
      video: true,
      documents: { orderBy: { sortOrder: 'asc' } },
    },
  })

  if (!product || !product.isActive) {
    throw createError({ statusCode: 404, statusMessage: 'Product not found' })
  }

  const vipCategorySlugs = (product.categories || [])
    .filter((item: any) => item.category?.type === 'VIP')
    .map((item: any) => String(item.category.slug))

  if (vipCategorySlugs.length) {
    let authorized = false
    for (const categorySlug of vipCategorySlugs) {
      if (await hasVipGrantBySlug(event, categorySlug)) {
        authorized = true
        break
      }
    }
    if (!authorized) {
      throw createError({ statusCode: 404, statusMessage: 'Product not found' })
    }
  }

  const sharedCategory = Array.isArray(product.categories) && product.categories.length > 0
    ? (product.categories[0] as any).category
    : product.category
  const productResponse = {
    ...product,
    category: sharedCategory,
  }

  // Force serialization hint (not optimized).
  return { product: productResponse as any }
})