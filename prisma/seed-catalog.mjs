import { PrismaClient } from '@prisma/client'

try {
  process.loadEnvFile?.()
} catch {
  // Fall back to an externally provided DATABASE_URL.
}

const prisma = new PrismaClient()

const categoryCount = 5
const productCount = 10

async function main() {
  const categories = []

  for (let i = 1; i <= categoryCount; i++) {
    const category = await prisma.category.upsert({
      where: { slug: `sample-category-${i}` },
      update: {
        nameAr: `فئة نموذجية ${i}`,
        nameEn: `Sample Category ${i}`,
        descriptionAr: `وصف نموذجي لفئة ${i}.`,
        descriptionEn: `Sample description for category ${i}.`,
        featuredOnHomepage: i <= 3,
        sortOrder: i,
        type: 'NORMAL',
      },
      create: {
        nameAr: `فئة نموذجية ${i}`,
        nameEn: `Sample Category ${i}`,
        slug: `sample-category-${i}`,
        descriptionAr: `وصف نموذجي لفئة ${i}.`,
        descriptionEn: `Sample description for category ${i}.`,
        featuredOnHomepage: i <= 3,
        sortOrder: i,
        type: 'NORMAL',
      },
    })
    categories.push(category)
  }

  for (let i = 1; i <= productCount; i++) {
    const category = categories[(i - 1) % categories.length]

    await prisma.product.upsert({
      where: { slug: `sample-product-${i}` },
      update: {
        nameAr: `منتج نموذجي ${i}`,
        nameEn: `Sample Product ${i}`,
        descriptionAr: `وصف نموذجي للمنتج ${i}.`,
        descriptionEn: `Sample description for product ${i}.`,
        price: 0,
        compareAtPrice: null,
        costPrice: null,
        stock: 0,
        minStock: 0,
        categoryId: category.id,
        isActive: true,
        attributes: {
          deleteMany: {},
          create: [
            {
              keyAr: 'الوسم 1',
              keyEn: 'Attribute 1',
              valueAr: `قيمة ${i}`,
              valueEn: `Value ${i}`,
            },
            {
              keyAr: 'الوسم 2',
              keyEn: 'Attribute 2',
              valueAr: 'قيمة نموذجية',
              valueEn: 'Sample value',
            },
          ],
        },
        categories: {
          deleteMany: {},
          create: [{ categoryId: category.id }],
        },
      },
      create: {
        nameAr: `منتج نموذجي ${i}`,
        nameEn: `Sample Product ${i}`,
        slug: `sample-product-${i}`,
        descriptionAr: `وصف نموذجي للمنتج ${i}.`,
        descriptionEn: `Sample description for product ${i}.`,
        price: 0,
        compareAtPrice: null,
        costPrice: null,
        stock: 0,
        minStock: 0,
        categoryId: category.id,
        isActive: true,
        attributes: {
          create: [
            {
              keyAr: 'الوسم 1',
              keyEn: 'Attribute 1',
              valueAr: `قيمة ${i}`,
              valueEn: `Value ${i}`,
            },
            {
              keyAr: 'الوسم 2',
              keyEn: 'Attribute 2',
              valueAr: 'قيمة نموذجية',
              valueEn: 'Sample value',
            },
          ],
        },
        categories: {
          create: [{ categoryId: category.id }],
        },
      },
    })
  }

  console.log(`Seeded ${categories.length} sample categories and ${productCount} sample products.`)
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
