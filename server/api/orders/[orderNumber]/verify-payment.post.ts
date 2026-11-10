import { verifyAccessToken } from '../../../utils/access-tokens'
import { confirmPayment, getGatewayConfig, retrieveTapCharge } from '../../../utils/payments'
import { getSessionUser } from '../../../utils/auth'
import { clientIp, rateLimit } from '../../../utils/rate-limit'

export default defineEventHandler(async (event) => {
  const orderNumber = String(getRouterParam(event, 'orderNumber') || '').trim()
  if (!orderNumber) throw createError({ statusCode: 400, statusMessage: 'Order number is required' })

  const body = await readBody(event)
  const token = typeof body?.token === 'string' ? body.token : ''

  let isAdmin = false
  const sessionUser = await getSessionUser(event).catch(() => null)
  isAdmin = !!sessionUser && (sessionUser.isSuper || sessionUser.permissions.includes('orders.view') || sessionUser.permissions.includes('orders.manage'))

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: {
      id: true,
      orderNumber: true,
      totalAmount: true,
      paymentMethod: true,
      paymentStatus: true,
      paymentProvider: true,
      paymentChargeId: true,
      paymentVerifiedAt: true,
      paymentFailureReason: true,
    },
  })
  if (!order) throw createError({ statusCode: 404, statusMessage: 'Order not found' })

  if (!isAdmin) {
    if (!token || !(await verifyAccessToken('order', order.id, token))) {
      throw createError({ statusCode: 403, statusMessage: 'Invalid or expired access token' })
    }
  }

  rateLimit(event, {
    key: `order-payment-verify:${order.orderNumber}:${clientIp(event)}`,
    limit: 10,
    windowSec: 60,
  })
  if (order.paymentMethod !== 'ONLINE') {
    return { paymentStatus: order.paymentStatus, verified: order.paymentStatus === 'paid', provider: order.paymentProvider }
  }

  // If already paid, do not re-run gateway calls.
  if (order.paymentStatus === 'paid') {
    return {
      paymentStatus: 'paid',
      verified: true,
      provider: order.paymentProvider,
      chargeId: order.paymentChargeId,
      verifiedAt: order.paymentVerifiedAt,
    }
  }

  const cfg = await getGatewayConfig()
  if (cfg?.name !== 'tap') {
    return { paymentStatus: order.paymentStatus, verified: false, provider: order.paymentProvider, chargeId: order.paymentChargeId }
  }

  const requestedChargeId = typeof body?.chargeId === 'string' && body.chargeId.trim() ? body.chargeId.trim() : order.paymentChargeId
  if (!requestedChargeId) {
    return { paymentStatus: order.paymentStatus, verified: false, provider: order.paymentProvider, chargeId: null }
  }

  const charge = await retrieveTapCharge(requestedChargeId, cfg.creds)
  if (!charge) {
    return { paymentStatus: order.paymentStatus, verified: false, provider: 'tap', chargeId: requestedChargeId, unavailable: true }
  }

  const status = String(charge?.status || '').toUpperCase()
  const amount = Number(charge?.amount)
  const currency = String(charge?.currency || '').toUpperCase()
  const chargeOrderNumber = String(charge?.reference?.order || '').trim()
  if (chargeOrderNumber && chargeOrderNumber !== order.orderNumber) {
    return { paymentStatus: 'failed', verified: false, provider: 'tap', chargeId: requestedChargeId, reason: 'order_reference_mismatch' }
  }

  if (status === 'CAPTURED') {
    const confirmed = await confirmPayment({
      orderNumber: order.orderNumber,
      provider: 'tap',
      chargeId: String(charge?.id || requestedChargeId),
      amount,
      currency,
      verifiedAt: new Date(),
    })
    return {
      paymentStatus: confirmed ? 'paid' : order.paymentStatus,
      verified: confirmed,
      provider: 'tap',
      chargeId: String(charge?.id || requestedChargeId),
    }
  }

  const failed = status === 'FAILED' || status === 'DECLINED' || status === 'CANCELLED' || status === 'VOIDED'
  if (failed && order.paymentStatus !== 'paid') {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: status === 'CANCELLED' || status === 'VOIDED' ? 'cancelled' : 'failed',
        paymentFailureReason: `tap:${status}`,
      },
    })
  }
  return {
    paymentStatus: failed ? (status === 'CANCELLED' || status === 'VOIDED' ? 'cancelled' : 'failed') : 'pending',
    verified: false,
    provider: 'tap',
    chargeId: String(charge?.id || requestedChargeId),
    tapStatus: status,
  }
})
