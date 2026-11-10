import { createHash, randomBytes } from 'node:crypto'
import type { H3Event } from 'h3'

export const VIP_COOKIE_NAME = 'ultra_vip_session'
export const VIP_ACCESS_TTL_SEC = 24 * 60 * 60

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function isRawSessionId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
}

function securedSession(): string {
  return randomBytes(32).toString('hex')
}

function cookieOptions(event?: H3Event) {
  const production = process.env.NODE_ENV === 'production'
  return {
    name: VIP_COOKIE_NAME,
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: VIP_ACCESS_TTL_SEC,
    secure: production && isHttpsRequest(event!),
  }
}

export function isHttpsRequest(event: H3Event): boolean {
  const proto = getRequestHeader(event, 'x-forwarded-proto')
  if (proto) {
  const firstProto = String(proto).split(',')[0] ?? ''
  return firstProto.trim().toLowerCase() === 'https'
  }
  const req = event.node?.req
  return Boolean(
    (req?.socket as any)?.encrypted ||
    (req?.connection as any)?.encrypted ||
    req?.headers?.['x-forwarded-ssl'] === 'on',
  )
}

function hashSession(raw: string): string {
  return sha256(raw)
}

export function getVipSessionId(event: H3Event): string | null {
  const raw = getCookie(event, VIP_COOKIE_NAME)
  if (!isRawSessionId(raw)) return null
  return raw
}

export async function hasVipGrant(event: H3Event, categoryId: string): Promise<boolean> {
  const raw = getVipSessionId(event)
  if (!raw) return false
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true, type: true, vipAccessVersion: true },
  })
  if (!category || category.type !== 'VIP') return false
  const grant = await prisma.vipCategoryAccess.findUnique({
    where: {
      categoryId_sessionIdHash: { categoryId, sessionIdHash: hashSession(raw) },
    },
  })
  if (!grant) return false
  if (grant.expiresAt.getTime() <= Date.now()) return false
  return grant.passwordVersionAtGrant === category.vipAccessVersion
}

export async function getGrantedVipCategorySlugs(event: H3Event): Promise<string[]> {
  const raw = getVipSessionId(event)
  if (!raw) return []
  const grants = await prisma.vipCategoryAccess.findMany({
    where: { sessionIdHash: hashSession(raw), expiresAt: { gt: new Date() } },
    include: { category: { select: { slug: true, vipAccessVersion: true, type: true } } },
  })
  return grants
    .filter(g => g.category.type === 'VIP' && g.passwordVersionAtGrant === g.category.vipAccessVersion)
    .map(g => g.category.slug)
}

export async function hasVipGrantBySlug(event: H3Event, slug: string): Promise<boolean> {
  const category = await prisma.category.findUnique({ where: { slug }, select: { id: true } })
  if (!category) return false
  return hasVipGrant(event, category.id)
}

export async function issueVipGrant(event: H3Event, categoryId: string, expiresAt?: Date): Promise<string> {
  const expiry = expiresAt || new Date(Date.now() + VIP_ACCESS_TTL_SEC * 1000)
  const existing = getVipSessionId(event)
  let raw = existing
  const generate = !isRawSessionId(raw)
  if (generate) raw = securedSession()

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { vipAccessVersion: true },
  })
  if (!category) throw createError({ statusCode:404, statusMessage: 'Category not found' })

  await prisma.vipCategoryAccess.upsert({
    where: { categoryId_sessionIdHash: { categoryId, sessionIdHash: hashSession(raw!) } },
    update: {
      passwordVersionAtGrant: category.vipAccessVersion,
      expiresAt: expiry,
    },
    create: {
      categoryId,
      sessionIdHash: hashSession(raw!),
      passwordVersionAtGrant: category.vipAccessVersion,
      expiresAt: expiry,
    },
  })

  setCookie(event, VIP_COOKIE_NAME, raw!, cookieOptions(event))
  return raw!
}

export function revokeVipSession(event: H3Event) {
  setCookie(event, VIP_COOKIE_NAME, '', { ...cookieOptions(event), maxAge: 0 })
}

export async function grantIsValid(event: H3Event, categorySlug: string): Promise<boolean> {
  return hasVipGrantBySlug(event, categorySlug)
}