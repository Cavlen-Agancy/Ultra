export default defineEventHandler(async (event) => {
  await requirePermission(event, 'vip_categories.view')
  const rows = await prisma.category.findMany({
    where: { type: 'VIP' },
    orderBy: [{ sortOrder: 'asc' }, { nameEn: 'asc' }],
    select: {
      id: true,
      nameAr: true,
      nameEn: true,
      slug: true,
      descriptionAr: true,
      descriptionEn: true,
      coverImagePath: true,
      coverVideoUrl: true,
      featuredOnHomepage: true,
      sortOrder: true,
      vipAccessVersion: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { productCategories: true } },
    },
  })
  return {
    categories: rows.map(r => ({
      ...r,
      isVip: true,
      productCount: r._count.productCategories,
    })),
  }
})