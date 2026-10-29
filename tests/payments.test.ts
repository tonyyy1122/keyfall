import assert from 'node:assert/strict'
import { test } from 'node:test'
import { SPONSOR_PLANS, formatUsd, planById } from '../src/monetization.ts'
import { checkSponsorDraft } from '../src/sponsor-form.ts'
import { SPONSORS, rollSponsor, sponsorForText, useSponsors } from '../src/sponsors.ts'
import { formEncode, hmacSha256Hex, verifyStripeSignature } from '../worker/stripe.ts'

const good = { name: '雨街書店', words: ['雨街書店', '翻開這一頁', ''], url: 'https://example.com/books', plan: 'week' }

test('usd formatting and plans', () => {
  assert.equal(formatUsd(900), 'US$9')
  assert.equal(formatUsd(150), 'US$1.50')
  assert.equal(planById('month')?.days, 30)
  assert.equal(planById('year'), null)
  assert.ok(SPONSOR_PLANS.every((plan) => plan.amount >= 50 && plan.days > 0))
})

test('a clean sponsor draft becomes an order', () => {
  const checked = checkSponsorDraft(good)
  assert.ok(checked.ok)
  if (!checked.ok) return
  assert.deepEqual(checked.order.words, ['雨街書店', '翻開這一頁'])
  assert.equal(checked.order.url, 'https://example.com/books')
  assert.equal(checked.order.plan.id, 'week')
})

test('sponsor drafts reject what the game cannot drop', () => {
  const errorsOf = (patch: Partial<typeof good>) => {
    const checked = checkSponsorDraft({ ...good, ...patch })
    return checked.ok ? {} : checked.errors
  }
  assert.ok(errorsOf({ name: '  ' }).name)
  assert.ok(errorsOf({ words: ['', ''] }).words)
  assert.ok(errorsOf({ words: ['好'] }).words)
  assert.ok(errorsOf({ words: ['這個標語實在太長了吧'] }).words)
  assert.ok(errorsOf({ words: ['茶行2'] }).words)
  assert.ok(errorsOf({ words: ['茶行，好'] }).words)
  assert.match(errorsOf({ words: ['学书店'] }).words ?? '', /簡體/)
  assert.ok(errorsOf({ words: ['茶行', '茶行'] }).words)
  assert.ok(errorsOf({ words: ['一一', '二二', '三三', '四四'] }).words)
  assert.ok(errorsOf({ url: 'http://example.com' }).url)
  assert.ok(errorsOf({ url: 'javascript:alert(1)' }).url)
  assert.ok(errorsOf({ url: 'not a url' }).url)
  assert.ok(errorsOf({ plan: 'forever' }).plan)
  assert.deepEqual(errorsOf({ url: '' }), {})
})

test('live sponsors replace the examples, and an empty list brings them back', () => {
  const live = [{ id: 'live-1', name: '真的茶行', words: ['真的茶行'], weight: 3 }]
  useSponsors(live)
  assert.equal(sponsorForText('青山茶行'), null)
  assert.equal(sponsorForText('真的茶行')?.id, 'live-1')
  assert.equal(rollSponsor(() => 0, 1)?.sponsor.id, 'live-1')
  useSponsors([{ id: 'bad', name: '壞', words: ['abc'], weight: 3 }])
  assert.equal(sponsorForText('青山茶行')?.id, SPONSORS[0]!.id)
  useSponsors([])
  assert.equal(sponsorForText('青山茶行')?.id, 'qingshan')
})

test('stripe form encoding nests like the API expects', () => {
  const body = formEncode({
    mode: 'payment',
    line_items: [{ quantity: 1, price_data: { unit_amount: 300, product_data: { name: '鍵雨', tax_code: undefined } } }],
  })
  assert.equal(
    decodeURIComponent(body),
    'mode=payment&line_items[0][quantity]=1&line_items[0][price_data][unit_amount]=300&line_items[0][price_data][product_data][name]=鍵雨',
  )
})

test('webhook signatures are checked against the secret and the clock', async () => {
  const secret = 'whsec_test'
  const payload = JSON.stringify({ type: 'checkout.session.completed' })
  const t = 1_800_000_000
  const sig = await hmacSha256Hex(secret, `${t}.${payload}`)
  const event = await verifyStripeSignature<{ type: string }>(payload, `t=${t},v1=${sig}`, secret, 300, t + 10)
  assert.equal(event.type, 'checkout.session.completed')
  await assert.rejects(verifyStripeSignature(payload, `t=${t},v1=${sig}`, 'whsec_other', 300, t))
  await assert.rejects(verifyStripeSignature(payload, `t=${t},v1=${sig}`, secret, 300, t + 301))
  await assert.rejects(verifyStripeSignature(payload, null, secret))
})
