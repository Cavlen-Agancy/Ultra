import test from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { verifyTapWebhookHashstring } from '../server/utils/tap-webhook-signature.ts'

test('verifies a valid Tap hashstring', () => {
  const secret = 'sk_test_example'
  const body = {
    id: 'chg_test_1',
    amount: 1.5,
    currency: 'XXX',
    reference: { gateway: 'gw_1', payment: 'pay_1' },
    status: 'CAPTURED',
    transaction: { created: '1700000000000' },
  }
  const toBeHashed = `x_id${body.id}x_amount1.50x_currency${body.currency}x_gateway_reference${body.reference.gateway}x_payment_reference${body.reference.payment}x_status${body.status}x_created${body.transaction.created}`
  const hashstring = createHmac('sha256', secret).update(toBeHashed).digest('hex')

  assert.equal(verifyTapWebhookHashstring(body as any, secret, hashstring), true)
})

test('rejects an invalid Tap hashstring', () => {
  const body = {
    id: 'chg_test_1',
    amount: 1.5,
    currency: 'XXX',
    reference: { gateway: 'gw_1', payment: 'pay_1' },
    status: 'CAPTURED',
    transaction: { created: '1700000000000' },
  }
  assert.equal(verifyTapWebhookHashstring(body as any, 'sk_test_example', 'not-valid'), false)
})

test('does not accept a changed amount silently', () => {
  const secret = 'sk_test_example'
  const hashBody = {
    id: 'chg_test_1',
    amount: 1.5,
    currency: 'XXX',
    reference: { gateway: 'gw_1', payment: 'pay_1' },
    status: 'CAPTURED',
    transaction: { created: '1700000000000' },
  }
  const toBeHashed = `x_id${hashBody.id}x_amount1.50x_currency${hashBody.currency}x_gateway_reference${hashBody.reference.gateway}x_payment_reference${hashBody.reference.payment}x_status${hashBody.status}x_created${hashBody.transaction.created}`
  const hashstring = createHmac('sha256', secret).update(toBeHashed).digest('hex')

  // A mutated amount must not verify.
  assert.equal(
    verifyTapWebhookHashstring({ ...hashBody, amount: 2.5 } as any, secret, hashstring),
    false,
  )
})
