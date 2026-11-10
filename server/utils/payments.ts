import { createHmac } from 'node:crypto'
import { decryptData } from './encryption'

// Neutral placeholders until the real payment market is configured.
const PAYMENT_CURRENCY = (process.env.PAYMENT_CURRENCY || 'XXX').toUpperCase()
const PAYMENT_COUNTRY = (process.env.PAYMENT_COUNTRY || 'XX').toUpperCase()
const PAYMENT_COUNTRY_CODE = Number(process.env.PAYMENT_COUNTRY_CODE || 0)

// Payment gateway integration (Paymob / Fawry).
// Credentials live ONLY in the encrypted SiteSettings.paymentGatewayCredentials
// column — never in .env. Every failure returns null so checkout silently
// falls back to COD.

export interface GatewayConfig {
  name: 'paymob' | 'fawry' | 'tap'
  mode: string
  creds: Record<string, string>
}

export async function getGatewayConfig(): Promise<GatewayConfig | null> {
  try {
    const settings = await prisma.siteSettings.findFirst()
    if (!settings?.paymentOnlineEnabled) return null
    const rawName = String(settings.paymentGatewayName || '').trim().toLowerCase()
    const name = rawName.includes('tap')
      ? 'tap'
      : rawName.includes('fawry')
        ? 'fawry'
        : rawName.includes('pay')
          ? 'paymob'
          : null
    if (!name || !settings.paymentGatewayCredentials) return null
    const creds = JSON.parse(decryptData(settings.paymentGatewayCredentials)) as Record<string, unknown>
    const flat: Record<string, string> = {}
    for (const [k, v] of Object.entries(creds)) {
      if (v !== null && v !== undefined) flat[k] = String(v)
    }
    return { name, mode: String(settings.paymentGatewayMode || 'sandbox'), creds: flat }
  }
  catch {
    return null
  }
}

interface ChargeOrder {
  id: string
  orderNumber: string
  customerName: string
  customerPhone: string
  customerEmail: string | null
  totalAmount: unknown
  accessToken?: string | null
}

function pick(creds: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    if (creds[k]) return creds[k]
  }
  return ''
}

async function postJson(url: string, body: unknown, headers?: Record<string, string>): Promise<any> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(headers || {}) },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`gateway http ${res.status}`)
  return res.json()
}

// ── Paymob (Accept Intention / iframe flow) ──────────────────────
export async function createPaymobPaymentUrl(order: ChargeOrder, creds: Record<string, string>): Promise<string | null> {
  try {
    const apiKey = pick(creds, 'apiKey', 'api_key')
    const integrationId = pick(creds, 'integrationId', 'integration_id')
    const iframeId = pick(creds, 'iframeId', 'iframe_id')
    if (!apiKey || !integrationId || !iframeId) return null

    const amountCents = Math.round(Number(order.totalAmount) * 100)
    const { token } = await postJson('https://accept.paymob.com/api/auth/tokens', { api_key: apiKey })
    const created = await postJson('https://accept.paymob.com/api/ecommerce/orders', {
      auth_token: token,
      delivery_needed: false,
      amount_cents: amountCents,
      currency: PAYMENT_CURRENCY,
      merchant_order_id: order.orderNumber,
      items: [{ name: `Order ${order.orderNumber}`, amount_cents: amountCents, description: `Ultra ${order.orderNumber}`, quantity: 1 }],
    })
    const names = String(order.customerName).split(' ')
    const { token: paymentToken } = await postJson('https://accept.paymob.com/api/acceptance/payment_keys', {
      auth_token: token,
      amount_cents: amountCents,
      expiration: 3600,
      order_id: created.id,
      billing_data: {
        first_name: names[0] || 'Customer',
        last_name: names.slice(1).join(' ') || 'Customer',
        email: order.customerEmail || 'customer@example.com',
        phone_number: order.customerPhone,
        apartment: 'NA', floor: 'NA', street: 'NA', building: 'NA',
        shipping_method: 'NA', postal_code: 'NA', city: 'NA',
        country: PAYMENT_COUNTRY, state: 'NA',
      },
      currency: PAYMENT_CURRENCY,
      integration_id: Number(integrationId),
    })
    return `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentToken}`
  }
  catch {
    return null
  }
}

// ── Fawry (hosted card charge) ───────────────────────────────────
export async function createFawryPaymentUrl(order: ChargeOrder, creds: Record<string, string>): Promise<string | null> {
  try {
    const merchantCode = pick(creds, 'merchantCode', 'merchant_code', 'apiKey')
    const secureKey = pick(creds, 'secureKey', 'secure_key', 'secretKey', 'secret_key')
    if (!merchantCode || !secureKey) return null

    const amount = Number(order.totalAmount).toFixed(2)
    const signature = createHmac('sha256', secureKey)
      .update(`${merchantCode}${order.orderNumber}${amount}${secureKey}`)
      .digest('hex')
    const res = await postJson('https://www.atfawry.com/ECommerceWebService/Charge', {
      merchantCode,
      merchantRefNum: order.orderNumber,
      customerName: order.customerName,
      customerMobile: order.customerPhone,
      customerEmail: order.customerEmail || '',
      paymentMethod: 'CARD',
      amount,
      currencyCode: PAYMENT_CURRENCY,
      language: 'en-gb',
      chargeItems: [{ itemId: order.id, description: `Order ${order.orderNumber}`, price: amount, quantity: 1 }],
      signature,
    })
    const url = res?.paymentUrl || res?.nextUrl || res?.redirectUrl
    return typeof url === 'string' && url.startsWith('http') ? url : null
  }
  catch {
    return null
  }
}

export async function createOnlinePaymentUrl(order: ChargeOrder): Promise<string> {
  const cfg = await getGatewayConfig()
  if (!cfg) throw createError({ statusCode: 503, statusMessage: 'Online payment is not configured' })
  if (cfg.name === 'tap') return createTapPaymentUrl(order, cfg.creds)
  if (cfg.name === 'paymob') {
    const url = await createPaymobPaymentUrl(order, cfg.creds)
    if (!url) throw createError({ statusCode: 502, statusMessage: 'Unable to initiate Paymob payment' })
    return url
  }
  const url = await createFawryPaymentUrl(order, cfg.creds)
  if (!url) throw createError({ statusCode: 502, statusMessage: 'Unable to initiate Fawry payment' })
  return url
}

// ── Shared post-payment bookkeeping ─────────────────────────────
function normalizedAmount(value: unknown): string | null {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return null
  return n.toFixed(2)
}

// ── Tap Payments (goSell / charges API) ─────────────────────────
// Server-side only. Amounts are loaded from the order; the currency is read from PAYMENT_CURRENCY.

function tapRuntimeSiteUrl(): string {
  const cfg = useRuntimeConfig().public as Record<string, string>
  const configured = (cfg?.siteUrl || process.env.NUXT_PUBLIC_SITE_URL || '').replace(/\/$/, '')
  return configured || 'http://localhost:3000'
}

function tapCustomerPhone(phone: string): { country_code: number, number: number } {
  const digits = String(phone || '').replace(/\D/g, '')
  const national = digits.replace(/^0/, '')
  return { country_code: PAYMENT_COUNTRY_CODE, number: Number(national) || 0 }
}

export async function createTapPaymentUrl(order: ChargeOrder, creds: Record<string, string>): Promise<string> {
  const secretKey = pick(creds, 'secretKey', 'secret_key', 'apiKey', 'api_key')
  if (!secretKey) throw createError({ statusCode: 503, statusMessage: 'Tap secret key is not configured' })

  const amount = Number(order.totalAmount)
  if (!Number.isFinite(amount) || amount <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid order amount' })
  }

  const siteUrl = tapRuntimeSiteUrl()
  const redirectUrl = `${siteUrl}/checkout/success?id=${encodeURIComponent(order.orderNumber)}${order.accessToken ? `&token=${encodeURIComponent(order.accessToken)}` : ''}`
  const postUrl = `${siteUrl}/api/payments/tap-webhook`

  const names = String(order.customerName || '').trim().split(/\s+/).filter(Boolean)
  const body = {
    amount,
    currency: PAYMENT_CURRENCY,
    customer: {
      first_name: names[0] || 'Customer',
      last_name: names.slice(1).join(' ') || 'Customer',
      email: order.customerEmail || 'customer@example.com',
      phone: tapCustomerPhone(order.customerPhone),
    },
    source: { id: 'src_all' },
    redirect: { url: redirectUrl },
    post: { url: postUrl },
    reference: {
      transaction: order.orderNumber,
      order: order.orderNumber,
      idempotent: order.orderNumber,
    },
    description: `Ultra order ${order.orderNumber}`,
    metadata: { order_number: order.orderNumber },
    threeDSecure: true,
    save_card: false,
    customer_initiated: true,
  }

  let created: any
  try {
    created = await $fetch('https://api.tap.company/v2/charges', {
      method: 'POST',
      headers: { Authorization: `Bearer ${secretKey}`, 'content-type': 'application/json' },
      body,
      timeout: 15000,
    })
  }
  catch (err: any) {
    console.warn('[tap] Charge creation failed:', err?.data?.message || err?.message || err)
    // Preserve the ONLINE order while recording that charge initiation failed.
    // Reversed charge attempts remain non-payment and cannot verify as paid.
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'pending',
        paymentFailureReason: 'charge_creation_failed',
      },
    }).catch(() => {})
    throw createError({ statusCode: 502, statusMessage: 'Unable to initiate Tap payment' })
  }

  const chargeId = String(created?.id || '')
  const paymentUrl = String(created?.transaction?.url || '')
  if (!chargeId || !paymentUrl) throw createError({ statusCode: 502, statusMessage: 'Tap returned an invalid charge response' })

  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentProvider: 'tap',
      paymentStatus: 'pending',
      paymentChargeId: chargeId,
      paymentReference: order.orderNumber,
      paymentAmount: null,
      paymentCurrency: PAYMENT_CURRENCY,
      paymentFailureReason: null,
    },
  })

  return paymentUrl
}



export async function retrieveTapCharge(chargeId: string, creds: Record<string, string>): Promise<Record<string, any> | null> {
  const secretKey = pick(creds, 'secretKey', 'secret_key', 'apiKey', 'api_key')
  if (!secretKey) return null
  try {
    return await $fetch<Record<string, any>>(`https://api.tap.company/v2/charges/${encodeURIComponent(chargeId)}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
      timeout: 15000,
    })
  }
  catch {
    return null
  }
}

// ── Verified payment confirmation ──────────────────────────────

export interface PaymentConfirmationInput {
  orderNumber: string
  provider: string
  chargeId: string
  amount: unknown
  currency: unknown
  verifiedAt?: Date | null
}

export async function confirmPayment(input: PaymentConfirmationInput): Promise<boolean> {
  const orderNumber = String(input.orderNumber || '').trim()
  const provider = String(input.provider || '').trim().toLowerCase()
  const chargeId = String(input.chargeId || '').trim()
  const amount = normalizedAmount(input.amount)
  const currency = String(input.currency || '').trim().toUpperCase()
  if (!orderNumber || !provider || !chargeId || !amount || currency !== PAYMENT_CURRENCY) return false

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { invoice: true },
  })
  if (!order || order.paymentMethod !== 'ONLINE') return false

  // Provider and charge binding checks (when already recorded).
  if (order.paymentProvider && order.paymentProvider !== provider) return false
  if (order.paymentChargeId && order.paymentChargeId !== chargeId) return false

  const expectedAmount = normalizedAmount(order.totalAmount)
  if (!expectedAmount || expectedAmount !== amount) return false

  // Already paid: idempotent success, no duplicate history or notifications.
  if (order.paymentStatus === 'paid') {
    if (order.invoice && order.invoice.status !== 'Paid' && order.invoice.status !== 'Cancelled') {
      await prisma.invoice.update({ where: { id: order.invoice.id }, data: { status: 'Paid' } })
    }
    return true
  }

  let confirmed = false
  try {
    await prisma.$transaction(async (tx) => {
      const fresh = await tx.order.findUnique({
        where: { id: order.id },
        include: { invoice: true },
      })
      if (!fresh || fresh.paymentMethod !== 'ONLINE') return
      if (fresh.paymentStatus === 'paid') {
        // Another callback won the race; idempotent success.
        confirmed = true
        return
      }
      if (fresh.paymentProvider && fresh.paymentProvider !== provider) return
      if (fresh.paymentChargeId && fresh.paymentChargeId !== chargeId) return
      const freshExpected = normalizedAmount(fresh.totalAmount)
      if (!freshExpected || freshExpected !== amount) return
      if (currency !== PAYMENT_CURRENCY) return

      const claimed = await tx.order.updateMany({
        where: { id: fresh.id, paymentStatus: { not: 'paid' } },
        data: {
          paymentStatus: 'paid',
          paymentProvider: provider,
          paymentChargeId: chargeId,
          paymentReference: fresh.orderNumber,
          paymentAmount: Number(amount),
          paymentCurrency: currency,
          paymentVerifiedAt: input.verifiedAt ? new Date(input.verifiedAt) : new Date(),
          paymentFailureReason: null,
          ...(fresh.status === 'Pending' ? { status: 'Processing' } : {}),
        },
      })
      if (claimed.count === 0) return

      confirmed = true
      if (fresh.status === 'Pending') {
        await tx.orderStatusHistory.create({
          data: { orderId: fresh.id, status: 'Processing', changedByUserId: null },
        })
      }
      if (fresh.invoice && fresh.invoice.status !== 'Paid' && fresh.invoice.status !== 'Cancelled') {
        await tx.invoice.update({
          where: { id: fresh.invoice.id },
          data: { status: 'Paid' },
        })
      }
    })
  }
  catch {
    return false
  }

  if (confirmed) {
    await notifyAdmins({
      type: 'payment_confirmed',
      relatedEntityId: order.id,
      url: `/admin/orders/${order.id}`,
      titleEn: `Payment confirmed ${orderNumber}`,
      titleAr: `تم تأكيد الدفع ${orderNumber}`,
      bodyEn: `tap:${chargeId}`,
      bodyAr: `tap:${chargeId}`,
    }).catch(() => {})
  }

  return confirmed
}

// Backward-compatible alias for legacy webhook callers. Amount/currency remain
// the function caller's responsibility through verify* methods where possible.
export async function confirmOnlineOrder(orderNumber: string, gatewayRef: string): Promise<boolean> {
  const provider = String((gatewayRef || '').split(':')[0] || '').trim().toLowerCase() || 'unknown'
  const chargeId = String((gatewayRef || '').split(':').slice(1).join(':') || '').trim() || gatewayRef
  // Load the order first because legacy callers may not have a server-verified
  // amount separate from the persisted total.
  const order = await prisma.order.findUnique({ where: { orderNumber }, select: { totalAmount: true } })
  if (!order) return false
  return confirmPayment({
    orderNumber,
    provider,
    chargeId,
    amount: order.totalAmount,
    currency: PAYMENT_CURRENCY,
  })
}
