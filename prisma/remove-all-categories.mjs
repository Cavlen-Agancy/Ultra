// Deletes ALL categories + their storage files.
// Fails on any category that still has products (FK Restrict) —
// delete products first via prisma/remove-all-products.mjs.
// Usage: node prisma/remove-all-categories.mjs
import { rm } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const categories = await prisma.category.findMany({
    select: { id: true, slug: true, _count: { select: { products: true } } },
  })
  if (!categories.length) {
    console.log('No categories to delete.')
    return
  }
  const blocked = categories.filter(c => c._count.products > 0)
  if (blocked.length) {
    console.error(`Refusing: ${blocked.length} categor(ies) still have products: ${blocked.map(c => c.slug).join(', ')}`)
    process.exit(1)
  }
  const { count } = await prisma.category.deleteMany({})
  let filesRemoved = 0
  for (const c of categories) {
    try {
      await rm(join(resolve(process.cwd(), 'storage'), 'categories', c.id), { recursive: true, force: true })
      filesRemoved++
    } catch (e) {
      console.error(`Could not remove files for ${c.slug}:`, e.message)
    }
  }
  console.log(`Deleted ${count} categor(ies); cleaned storage for ${filesRemoved} categor(ies).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
