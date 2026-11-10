import { createHmac, timingSafeEqual } from 'node:crypto'

export function verifyTapWebhookHashstring(
  body: Record<string, any>,
  secretKey: string,
  receivedHash: string,
): boolean {
  const id = String(body?.id || '')
  const amount = normalizedAmount(body?.amount)
  const currency = String(body?.currency || '')
  const gatewayReference = String(body?.reference?.gateway ?? '')
  const paymentReference = String(body?.reference?.payment ?? '')
  const status = String(body?.status || '')
  const created = String(body?.transaction?.created ?? '')

  if (!id || !amount || !currency || !status || !created) return false

  const toBeHashed =
    `x_id${id}x_amount${amount}x_currency${currency}x_gateway_reference${gatewayReference}` +
    `x_payment_reference${paymentReference}x_status${status}x_created${created}`

  const expected = createHmac('sha256', secretKey).update(toBeHashed).digest('hex')
  const normalizedReceived = String(receivedHash || '').trim().toLowerCase()
  if (expected.length !== normalizedReceived.length) return false

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(normalizedReceived))
  }
  catch {
    return false
  }
}

function normalizedAmount(value: unknown): string | null {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return null
  return n.toFixed(2)
}
