export default defineEventHandler(async (event) => {
  await requirePermission(event, 'products.view')
  const id = getRouterParam(event, 'id')
  const product = await prisma.product.findUnique({
    where: { id: id || '' },
    include: {
      categories: { include: { category: { select: { id: true, slug: true, nameAr: true, nameEn: true } } } },
      category: { select: { id: true, slug: true, nameAr: true, nameEn: true } },
      images: { orderBy: { sortOrder: 'asc' } },
      attributes: true,
      seo: true,
      video: true,
      documents: { orderBy: { sortOrder: 'asc' } },
    },
  })
  if (!product) throw createError({ statusCode: 404, statusMessage: 'Product not found' })
  const primaryCategory =
    Array.isArray(product.categories) && product.categories.length > 0
      ? product.categories[0]?.category ?? product.category
      : product.category
  const result = {
    ...product,
    category: primaryCategory,
    categories: Array.isArray(product.categories) ? product.categories.map((c: any) => c.category).filter(Boolean) : [],
  }
  return { product: result }
})
