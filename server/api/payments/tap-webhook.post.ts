import { confirmPayment, getGatewayConfig, retrieveTapCharge } from '../../utils/payments'
import { verifyTapWebhookHashstring } from '../../utils/tap-webhook-signature'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const normalizedBody = (body && typeof body === 'object' ? body : {}) as Record<string, any>

  const cfg = await getGatewayConfig()
  if (cfg?.name !== 'tap') {
    throw createError({ statusCode: 400, statusMessage: 'Tap payment webhook is not configured' })
  }

  const secretKey = String(cfg.creds.secretKey || cfg.creds.secret_key || cfg.creds.apiKey || cfg.creds.api_key || '')
  if (!secretKey) throw createError({ statusCode: 400, statusMessage: 'Tap webhook secret is not configured' })

  const receivedHeader = String(getRequestHeader(event, 'hashstring') || getQuery(event).hashstring || normalizedBody?.hashstring || normalizedBody?.hash || '')
  if (!receivedHeader) throw createError({ statusCode: 403, statusMessage: 'Missing Tap webhook signature' })

  if (!verifyTapWebhookHashstring(normalizedBody, secretKey, receivedHeader)) {
    throw createError({ statusCode: 403, statusMessage: 'Invalid Tap webhook signature' })
  }

  const chargeId = String(normalizedBody?.id || '')
  if (!chargeId) throw createError({ statusCode: 400, statusMessage: 'Missing Tap charge id' })

  const charge = await retrieveTapCharge(chargeId, cfg.creds)
  if (!charge) {
    throw createError({ statusCode: 502, statusMessage: 'Unable to retrieve Tap charge' })
  }

  const status = String(charge?.status || '').toUpperCase()
  const amount = Number(charge?.amount)
  const currency = String(charge?.currency || '').toUpperCase()
  const chargeOrderNumber = String(charge?.reference?.order || '').trim()
  const retrievedId = String(charge?.id || '')
  if (retrievedId !== chargeId) throw createError({ statusCode: 400, statusMessage: 'Tap charge mismatch' })

  const order = await prisma.order.findFirst({
    where: { OR: [{ paymentChargeId: chargeId }, { orderNumber: chargeOrderNumber }] },
    include: { invoice: true },
  })

  if (!order) return { ok: true, confirmed: false }
  if (chargeOrderNumber && chargeOrderNumber !== order.orderNumber) {
    throw createError({ statusCode: 400, statusMessage: 'Tap order reference mismatch' })
  }

  if (status === 'CAPTURED') {
    const confirmed = await confirmPayment({
      orderNumber: order.orderNumber,
      provider: 'tap',
      chargeId,
      amount,
      currency,
      verifiedAt: new Date(),
    })

    if (!confirmed && order.paymentStatus === 'failed') {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'failed', paymentFailureReason: `tap:${status}` },
      })
    }
    return { ok: true, confirmed }
  }

  if (status === 'FAILED' || status === 'DECLINED' || status === 'CANCELLED' || status === 'VOIDED') {
    if (order.paymentStatus !== 'paid') {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: status === 'CANCELLED' || status === 'VOIDED' ? 'cancelled' : 'failed',
          paymentFailureReason: `tap:${status}`,
        },
      })
    }
    return { ok: true, confirmed: false }
  }

  if (order.paymentStatus !== 'paid') {
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: 'pending', paymentFailureReason: null },
    })
  }
  return { ok: true, confirmed: false }
})
