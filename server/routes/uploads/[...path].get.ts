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

  // Inactive product media stays admin-only.
  const productId = parts[0] === 'products' ? parts[1] : null
  if (productId) {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { isActive: true },
      })
      const active = product?.isActive ?? false

      let isAdmin = false
      try {
        const user = await getSessionUser(event)
        isAdmin = !!user && (user.isSuper || user.permissions.includes('products.view'))
      } catch {
        isAdmin = false
      }

      if (!active && !isAdmin) throw createError({ statusCode: 404, statusMessage: 'Not found' })
    } catch (error: any) {
      if (error?.statusCode) throw error
      // Fail closed for restricted-looking product paths.
    }
  }

  const ext = full.slice(full.lastIndexOf('.')).toLowerCase()

  setHeader(event, 'content-type', MIME[ext] || 'application/octet-stream')
  setHeader(event, 'cache-control', 'public, max-age=86400')
  setHeader(event, 'x-content-type-options', 'nosniff')
  return sendStream(event, createReadStream(full))
})