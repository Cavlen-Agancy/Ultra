// Deletes ALL products + their storage files.
// Cascade removes images/attributes/seo/video/documents/movements;
// order items keep snapshots with productId set to NULL.
// Usage: node prisma/remove-all-products.mjs
import { rm } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const products = await prisma.product.findMany({ select: { id: true, slug: true } })
  if (!products.length) {
    console.log('No products to delete.')
    return
  }
  const { count } = await prisma.product.deleteMany({})
  let filesRemoved = 0
  for (const p of products) {
    try {
      await rm(join(resolve(process.cwd(), 'storage'), 'products', p.id), { recursive: true, force: true })
      filesRemoved++
    } catch (e) {
      console.error(`Could not remove files for ${p.slug}:`, e.message)
    }
  }
  console.log(`Deleted ${count} product(s); cleaned storage for ${filesRemoved} product(s).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
