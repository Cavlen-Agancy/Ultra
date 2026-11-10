interface ProductImageOrderBody {
  order?: unknown
}

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'products.edit')
  const body = await readBody<ProductImageOrderBody>(event)
  const order = Array.isArray(body.order)
    ? body.order.filter((value): value is string => typeof value === 'string' && value.length > 0)
    : []

  if (!order.length) throw createError({ statusCode: 400, statusMessage: 'Order array required' })

  const images = await prisma.productImage.findMany({ where: { id: { in: order } } })
  const productIds = new Set(images.map(image => image.productId))
  if (images.length !== order.length || productIds.size !== 1) {
    throw createError({ statusCode: 400, statusMessage: 'Images must belong to one product' })
  }

  await prisma.$transaction(
    order.map((imageId, index) =>
      prisma.productImage.update({
        where: { id: imageId },
        data: { sortOrder: index, isCover: index === 0 },
      }),
    ),
  )
  return { ok: true }
})
