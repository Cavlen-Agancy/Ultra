import { clientIp, rateLimit } from '../../../utils/rate-limit'
import { issueVipGrant, revokeVipSession, VIP_ACCESS_TTL_SEC } from '../../../utils/vip-access'
import { verifyPassword } from '../../../utils/password'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Category slug is required' })

  const category = await prisma.category.findUnique({
    where: { slug },
    select: { id: true, type: true, vipPasswordHash: true, vipAccessVersion: true, nameAr: true, nameEn: true },
  })
  if (!category || category.type !== 'VIP') throw createError({ statusCode: 404, statusMessage: 'Category not found' })

  const { rateLimit } = await import('../../../utils/rate-limit')
  rateLimit(event, {
    key: `vip-unlock:${clientIp(event)}:${category.id}`,
    limit: 5,
    windowSec: 900,
  })

  const body = await readBody(event)
  const password = typeof body?.password === 'string' ? body.password : ''
  if (password.length < 8) throw createError({ statusCode: 400, statusMessage: 'Invalid password' })
  if (!category.vipPasswordHash || !(await verifyPassword(password, category.vipPasswordHash))) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid password' })
  }

  const raw = await issueVipGrant(event, category.id)
  if (!raw) {
    revokeVipSession(event)
    throw createError({ statusCode: 500, statusMessage: 'Unable to issue access' })
  }

  return { ok: true, expiresAt: new Date(Date.now() + VIP_ACCESS_TTL_SEC * 1000) }
})