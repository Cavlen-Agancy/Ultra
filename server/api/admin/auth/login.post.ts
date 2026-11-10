import { Prisma } from '@prisma/client'
import { ALL_PERMISSIONS } from '../../../../shared/permissions'

type AdminUserWithPermissions = Prisma.AdminUserGetPayload<{ include: { permissions: true } }>

interface LoginBody {
  email?: unknown
  password?: unknown
}

export default defineEventHandler(async (event) => {
  // Rate limited by server/middleware/rate-limit.ts (5 req/min).
  const body = await readBody<LoginBody>(event)
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  // Generic failure: never reveal whether the email exists.
  const fail = (): never => {
    recordFailedLogin(email)
    throw createError({ statusCode: 401, statusMessage: 'Invalid email or password' })
  }

  if (!email || !password) return fail()

  const user: AdminUserWithPermissions | null = await prisma.adminUser.findUnique({
      where: { email },
      include: { permissions: true },
    })

  if (!user || !user.isActive) return fail()

  const authenticatedUser: AdminUserWithPermissions = user
  if (!(await verifyPassword(password, authenticatedUser.passwordHash))) fail()

  await prisma.adminUser.update({
    where: { id: authenticatedUser.id },
    data: { lastLoginAt: new Date() },
  })

  const sessionUser = {
    userId: authenticatedUser.id,
    email: authenticatedUser.email,
    name: authenticatedUser.name,
    isSuper: authenticatedUser.isSuper,
    permissions: authenticatedUser.isSuper
      ? [...ALL_PERMISSIONS]
      : authenticatedUser.permissions.map(p => p.permission),
  }
  await createSession(event, sessionUser)

  return { user: sessionUser }
})
