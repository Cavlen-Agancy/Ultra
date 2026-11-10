import { createReadStream, promises as fs } from 'node:fs'
import { getSessionUser } from '../../utils/auth'
import { resolveUploadPath } from '../../utils/storage'

const MIME: Record<string, string> = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'video/ogg',
}

function denyProtected(event: any) {
  setHeader(event, 'cache-control', 'private, no-store, no-cache, max-age=0, must-revalidate')
  setHeader(event, 'vary', 'Cookie')
  return { denied: true }
}

export default defineEventHandler(async (event) => {
  const parts = (getRouterParam(event, 'path') || '').split('/').filter(Boolean)
  if (parts.includes('..') || parts.includes('.')) throw createError({ statusCode: 400, statusMessage: 'Invalid path' })

  const full = resolveUploadPath(parts)
  if (!full) throw createError({ statusCode: 400, statusMessage: 'Invalid path' })
  try {
    const stat = await fs.stat(full)
    if (!stat.isFile()) throw new Error('not a file')
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  // Product media is the only tier we restrict on the authorization path.
  let requiresVip = false
  let active = true
  const productId = parts[0] === 'products' ? parts[1] : null
  if (productId) {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: {
          isActive: true,
          categories: { include: { category: { select: { type: true, slug: true } } } },
        },
      })
      active = product?.isActive ?? false
      const vipSlugs = (product?.categories || [])
        .filter((item: any) => item.category?.type === 'VIP')
        .map((item: any) => String(item.category.slug))
      if (vipSlugs.length) requiresVip = true

      let isAdmin = false
      try {
        const user = await getSessionUser(event)
        isAdmin = !!user && (user.isSuper || user.permissions.includes('products.view'))
      } catch {
        isAdmin = false
      }

      if (!active && !isAdmin) throw createError({ statusCode: 404, statusMessage: 'Not found' })
      if (requiresVip && !isAdmin) {
        let granted = false
        for (const slug of vipSlugs) {
          if (await hasVipGrantBySlug(event, slug)) {
            granted = true
            break
          }
        }
        if (!granted) {
          setHeader(event, 'cache-control', 'private, no-store, no-cache, max-age=0, must-revalidate')
          setHeader(event, 'vary', 'Cookie')
          setHeader(event, 'x-content-type-options', 'nosniff')
          throw createError({ statusCode: 404, statusMessage: 'Not found' })
        }
      }
    } catch (error: any) {
      if (error?.statusCode) throw error
      // Fail closed for restricted-looking product paths.
    }
  }

  const ext = full.slice(full.lastIndexOf('.')).toLowerCase()
  const allowPublic = !(requiresVip)
  const cache = allowPublic
    ? 'public, max-age=86400'
    : 'private, no-store, no-cache, max-age=0, must-revalidate'

  setHeader(event, 'content-type', MIME[ext] || 'application/octet-stream')
  setHeader(event, 'cache-control', cache)
  if (!allowPublic) setHeader(event, 'vary', 'Cookie')
  setHeader(event, 'x-content-type-options', 'nosniff')
  return sendStream(event, createReadStream(full))
})