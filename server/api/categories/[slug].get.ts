export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const row = await prisma.category.findUnique({
    where: { slug: slug || '' },
    select: {
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
    },
  })
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Category not found' })
  const { type, ...rest } = row
  return { category: { ...rest, isVip: type === 'VIP' } }
})
