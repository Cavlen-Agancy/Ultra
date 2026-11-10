import { generateSlug, uniqueSlug } from '../../../../../shared/slug'
import { logAudit } from '../../../../utils/audit'

export default defineEventHandler(async (event) => {
  const actor = await requirePermission(event, 'products.create')
  const id = event.context.params?.id
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing product ID' })

  const orig = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      attributes: { orderBy: { keyEn: 'asc' } },
      seo: true,
      documents: { orderBy: { sortOrder: 'asc' } },
      video: true,
      categories: { include: { category: { select: { id: true, type: true } } } },
    },
  })

  if (!orig) throw createError({ statusCode: 404, statusMessage: 'Product not found' })

  if (orig.categories.length > 0 && !actor.isSuper) {
    const categoryTypes = new Set(orig.categories.map((c: any) => String(c.category?.type)))
    if (categoryTypes.has('NORMAL') && !actor.permissions.includes('categories.manage')) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }
    if (categoryTypes.has('VIP') && !actor.permissions.includes('vip_categories.manage')) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }
  }

  const baseSlug = generateSlug(orig.nameEn || orig.nameAr) || 'product'
  const newSlug = await uniqueSlug(`${baseSlug}-copy`, async (slug) => {
    const existing = await prisma.product.findUnique({ where: { slug } })
    return Boolean(existing)
  })

  const duplicated = await prisma.product.create({
    data: {
      nameAr: `${orig.nameAr} (نسخة)`,
      nameEn: `${orig.nameEn} (Copy)`,
      slug: newSlug,
      descriptionAr: orig.descriptionAr,
      descriptionEn: orig.descriptionEn,
      price: orig.price,
      compareAtPrice: orig.compareAtPrice,
      costPrice: orig.costPrice,
      stock: orig.stock,
      minStock: orig.minStock,
      categoryId: orig.categoryId,
      categories: {
        create: orig.categories.map((c: any) => ({ categoryId: c.categoryId })),
      },
      images: {
        create: orig.images.map((image: { path: string, altAr: string | null, altEn: string | null, sortOrder: number, isCover: boolean }) => ({
          path: image.path,
          altAr: image.altAr,
          altEn: image.altEn,
          sortOrder: image.sortOrder,
          isCover: image.isCover,
        })),
      },
      attributes: {
        create: orig.attributes.map(({ keyAr, keyEn, valueAr, valueEn }) => ({
          keyAr,
          keyEn,
          valueAr,
          valueEn,
        })),
      },
      seo: orig.seo
        ? {
            create: {
              metaTitleAr: orig.seo.metaTitleAr,
              metaTitleEn: orig.seo.metaTitleEn,
              metaDescriptionAr: orig.seo.metaDescriptionAr,
              metaDescriptionEn: orig.seo.metaDescriptionEn,
              keywords: orig.seo.keywords,
              geoContent: orig.seo.geoContent,
            },
          }
        : undefined,
      video: orig.video
        ? {
            create: {
              type: orig.video.type,
              url: orig.video.url,
            },
          }
        : undefined,
      documents: {
        create: orig.documents.map((doc: { labelAr: string, labelEn: string, filePath: string, fileType: string, sortOrder: number }) => ({
          labelAr: doc.labelAr,
          labelEn: doc.labelEn,
          filePath: doc.filePath,
          fileType: doc.fileType,
          sortOrder: doc.sortOrder,
        })),
      },
      isActive: false,
    },
  })

  await logAudit({
    entityType: 'product',
    entityId: duplicated.id,
    entityName: `${duplicated.nameAr} / ${duplicated.nameEn}`,
    action: 'created',
    details: `نسخ من المنتج ${orig.nameAr}`,
    user: actor,
  })

  return duplicated
})