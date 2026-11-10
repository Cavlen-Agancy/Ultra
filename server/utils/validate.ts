import { z } from 'zod'
import type { H3Event } from 'h3'

export const phoneSchema = z.string().trim().regex(/^\+?[0-9][0-9\s\-()]{6,19}$/, 'Invalid phone number')

/** Keep digits and a leading + so the number stays portable across markets. */
export function normalizePhone(raw: string): string {
  const value = String(raw || '').trim()
  const hasPlus = value.startsWith('+')
  const digits = value.replace(/[^0-9]/g, '')
  return `${hasPlus ? '+' : ''}${digits}`
}

const idString = z.string().trim().min(1).max(100)

// ── Orders ──
export const orderItemSchema = z.object({
  productId: idString,
  quantity: z.coerce.number().int().min(1).max(100),
})

export const orderCreateSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2).max(120),
    phone: phoneSchema,
    governorate: z.string().trim().min(2).max(80),
    address: z.string().trim().max(500).nullish(),
    email: z.string().trim().email().max(160).nullish().or(z.literal('')),
  }),
  items: z.array(orderItemSchema).min(1).max(50),
  paymentMethod: z.enum(['COD', 'ONLINE']).default('COD'),
})

export const orderStatusSchema = z.object({
  status: z.enum(['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded']),
})

export const refundReasonSchema = z.enum(['customer_request', 'damaged', 'wrong_item', 'other'])

// ── Helper ──
export async function parseBody<T extends z.ZodTypeAny>(event: H3Event, schema: T): Promise<z.infer<T>> {
  const raw = await readBody(event)
  const parsed = schema.safeParse(raw ?? {})
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    const where = first?.path?.length ? ` (${first.path.join('.')})` : ''
    throw createError({ statusCode: 400, statusMessage: `Invalid request body: ${first?.message || 'validation failed'}${where}` })
  }
  return parsed.data
}
