import { getVipSessionId, revokeVipSession } from '../../utils/vip-access'
import { createHash } from 'node:crypto'

export default defineEventHandler(async (event) => {
  const raw = getVipSessionId(event)
  if (raw) {
    const hash = createHash('sha256').update(raw).digest('hex')
    await prisma.vipCategoryAccess.deleteMany({ where: { sessionIdHash: hash } })
  }
  revokeVipSession(event)
  return { ok: true }
})