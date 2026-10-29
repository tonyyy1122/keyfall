/**
 * 鍵雨的 Worker：靜態檔交給 [assets]，這裡只處理付款與贊助。
 *
 *   POST /api/tip              打賞，303 轉到 Stripe Checkout
 *   POST /api/sponsor          認購贊助詞，先存成 unpaid，再轉到 Checkout
 *   GET  /api/sponsors         正在落下的贊助（遊戲開頭會讀）
 *   POST /api/stripe/webhook   付款完成 → 待審核；付款頁過期 → 刪除
 *   GET  /admin                審核頁（Basic Auth，密碼是 ADMIN_KEY）
 *   POST /admin/approve        通過，開始計算天數
 *   POST /admin/reject         不通過，全額退款
 */
import { CURRENCY, SPONSOR_PRODUCT, formatUsd, tip } from '../src/monetization.ts'
import { checkSponsorDraft } from '../src/sponsor-form.ts'
import { adminPage, messagePage, type SponsorRow, type TipSummary } from './pages.ts'
import { stripeApi, timingSafeEqual, verifyStripeSignature } from './stripe.ts'

export interface Env {
  ASSETS: Fetcher
  DB: D1Database
  STRIPE_SECRET_KEY: string
  STRIPE_WEBHOOK_SECRET: string
  ADMIN_KEY: string
  /** 選填：Stripe 稅碼，例如 txcd_10000000。開了 Managed Payments 時通常需要。 */
  STRIPE_TAX_CODE?: string
}

interface CheckoutSession {
  id: string
  url: string
  payment_status: 'paid' | 'unpaid' | 'no_payment_required'
  payment_intent: string | null
  amount_total: number | null
  currency: string | null
  metadata: Record<string, string> | null
  customer_details?: { email?: string | null } | null
}

interface StripeEvent {
  type: string
  data: { object: CheckoutSession }
}

const SPONSOR_WEIGHT = 3

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const route = `${request.method} ${url.pathname.replace(/\/+$/, '') || '/'}`
    try {
      switch (route) {
        case 'POST /api/tip':
          return await startTip(request, env, url)
        case 'POST /api/sponsor':
          return await startSponsor(request, env, url)
        case 'GET /api/sponsors':
          return await liveSponsors(env)
        case 'POST /api/stripe/webhook':
          return await webhook(request, env)
        case 'GET /admin':
        case 'POST /admin/approve':
        case 'POST /admin/reject':
          return await admin(request, env, url, route)
      }
      if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/admin')) {
        return new Response('Not found', { status: 404 })
      }
      return env.ASSETS.fetch(request)
    } catch (err) {
      console.error(route, err)
      return html(messagePage('付款頁沒有開成', '連不上付款服務，請稍後再試一次。這次沒有扣款。', '/'), 502)
    }
  },
}

async function startTip(request: Request, env: Env, url: URL): Promise<Response> {
  const form = await request.formData()
  const amount = Number(form.get('amount'))
  if (!tip.amounts.includes(amount)) {
    return html(messagePage('金額不對', `打賞金額只有 ${tip.amounts.map(formatUsd).join('、')} 三種。`, '/'), 400)
  }
  const session = await stripeApi<CheckoutSession>(env.STRIPE_SECRET_KEY, 'POST', 'checkout/sessions', {
    mode: 'payment',
    locale: 'zh-TW',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: CURRENCY,
          unit_amount: amount,
          product_data: { name: tip.product, tax_code: env.STRIPE_TAX_CODE },
        },
      },
    ],
    metadata: { kind: 'tip' },
    success_url: `${url.origin}/?tip=thanks`,
    cancel_url: `${url.origin}/`,
  })
  return Response.redirect(session.url, 303)
}

async function startSponsor(request: Request, env: Env, url: URL): Promise<Response> {
  const form = await request.formData()
  const checked = checkSponsorDraft({
    name: String(form.get('name') ?? ''),
    words: form.getAll('word').map(String),
    url: String(form.get('url') ?? ''),
    plan: String(form.get('plan') ?? ''),
  })
  if (!checked.ok) {
    const first = Object.values(checked.errors)[0] ?? '表單有欄位沒填好。'
    return html(messagePage('表單還沒填好', first, '/sponsor'), 400)
  }
  const { order } = checked
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  await env.DB.prepare(
    `INSERT INTO sponsors (id, name, words, url, plan, days, amount, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'unpaid', ?)`,
  )
    .bind(id, order.name, JSON.stringify(order.words), order.url, order.plan.id, order.plan.days, order.plan.amount, now)
    .run()

  // 付款頁沒開成就刪掉這筆，不然它會永遠停在 unpaid，也收不到過期通知。
  const session = await stripeApi<CheckoutSession>(env.STRIPE_SECRET_KEY, 'POST', 'checkout/sessions', {
    mode: 'payment',
    locale: 'zh-TW',
    client_reference_id: id,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: CURRENCY,
          unit_amount: order.plan.amount,
          product_data: {
            name: `${SPONSOR_PRODUCT}（${order.plan.label}）`,
            description: `${order.name}：${order.words.map((w) => `「${w}」`).join('')}。審核通過後開始落下，不通過全額退款。`,
            tax_code: env.STRIPE_TAX_CODE,
          },
        },
      },
    ],
    metadata: { kind: 'sponsor', sponsor_id: id },
    payment_intent_data: { metadata: { kind: 'sponsor', sponsor_id: id } },
    success_url: `${url.origin}/sponsor?paid=1`,
    cancel_url: `${url.origin}/sponsor?cancel=1`,
  }).catch(async (err: unknown) => {
    await env.DB.prepare(`DELETE FROM sponsors WHERE id = ? AND status = 'unpaid'`).bind(id).run()
    throw err
  })
  await env.DB.prepare('UPDATE sponsors SET session_id = ? WHERE id = ?').bind(session.id, id).run()
  return Response.redirect(session.url, 303)
}

async function liveSponsors(env: Env): Promise<Response> {
  const { results } = await env.DB.prepare(
    `SELECT id, name, words, url FROM sponsors WHERE status = 'live' AND ends_at > ? ORDER BY starts_at`,
  )
    .bind(new Date().toISOString())
    .all<{ id: string; name: string; words: string; url: string | null }>()
  const sponsors = results.map((row) => ({
    id: row.id,
    name: row.name,
    words: JSON.parse(row.words) as string[],
    url: row.url ?? undefined,
    weight: SPONSOR_WEIGHT,
  }))
  return Response.json(sponsors, { headers: { 'cache-control': 'public, max-age=60' } })
}

async function webhook(request: Request, env: Env): Promise<Response> {
  const payload = await request.text()
  let event: StripeEvent
  try {
    event = await verifyStripeSignature<StripeEvent>(payload, request.headers.get('stripe-signature'), env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    return new Response(String(err instanceof Error ? err.message : err), { status: 400 })
  }
  const session = event.data.object
  const kind = session.metadata?.kind
  const paid =
    (event.type === 'checkout.session.completed' && session.payment_status === 'paid') ||
    event.type === 'checkout.session.async_payment_succeeded'

  if (paid && kind === 'tip') {
    await env.DB.prepare('INSERT OR IGNORE INTO tips (session_id, amount, currency, created_at) VALUES (?, ?, ?, ?)')
      .bind(session.id, session.amount_total ?? 0, session.currency ?? CURRENCY, new Date().toISOString())
      .run()
  } else if (paid && kind === 'sponsor' && session.metadata?.sponsor_id) {
    await env.DB.prepare(
      `UPDATE sponsors SET status = 'review', paid_at = ?, payment_intent = ?, email = ?, session_id = ?
       WHERE id = ? AND status = 'unpaid'`,
    )
      .bind(
        new Date().toISOString(),
        session.payment_intent,
        session.customer_details?.email ?? null,
        session.id,
        session.metadata.sponsor_id,
      )
      .run()
  } else if (event.type === 'checkout.session.expired' && kind === 'sponsor' && session.metadata?.sponsor_id) {
    await env.DB.prepare(`DELETE FROM sponsors WHERE id = ? AND status = 'unpaid'`).bind(session.metadata.sponsor_id).run()
  }
  return new Response('ok')
}

async function admin(request: Request, env: Env, url: URL, route: string): Promise<Response> {
  if (!env.ADMIN_KEY || !authorized(request, env.ADMIN_KEY)) {
    return new Response('需要登入', { status: 401, headers: { 'www-authenticate': 'Basic realm="keyfall-admin", charset="UTF-8"' } })
  }
  if (request.method === 'POST') {
    // Basic Auth 會被瀏覽器自動帶上，所以要擋別的網站代送的表單。
    if (request.headers.get('origin') !== url.origin) return new Response('來源不符', { status: 403 })
    const form = await request.formData()
    const id = String(form.get('id') ?? '')
    const note = route === 'POST /admin/approve' ? await approve(env, id) : await reject(env, id)
    return Response.redirect(`${url.origin}/admin?note=${encodeURIComponent(note)}`, 303)
  }
  const { results } = await env.DB.prepare(
    `SELECT * FROM sponsors WHERE status IN ('review', 'live', 'rejected') ORDER BY
       CASE status WHEN 'review' THEN 0 WHEN 'live' THEN 1 ELSE 2 END, COALESCE(paid_at, created_at) DESC
     LIMIT 200`,
  ).all<SponsorRow>()
  const tips = await env.DB.prepare('SELECT COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total FROM tips').first<TipSummary>()
  return html(adminPage(results, tips ?? { count: 0, total: 0 }, new Date(), url.searchParams.get('note')))
}

async function approve(env: Env, id: string): Promise<string> {
  const row = await env.DB.prepare(`SELECT days, name FROM sponsors WHERE id = ? AND status = 'review'`)
    .bind(id)
    .first<{ days: number; name: string }>()
  if (!row) return '找不到這筆待審核的贊助，可能已經處理過。'
  const start = new Date()
  const end = new Date(start.getTime() + row.days * 86_400_000)
  await env.DB.prepare(`UPDATE sponsors SET status = 'live', starts_at = ?, ends_at = ? WHERE id = ? AND status = 'review'`)
    .bind(start.toISOString(), end.toISOString(), id)
    .run()
  return `已通過「${row.name}」，開始落下 ${row.days} 天。`
}

async function reject(env: Env, id: string): Promise<string> {
  const row = await env.DB.prepare(`SELECT name, payment_intent FROM sponsors WHERE id = ? AND status = 'review'`)
    .bind(id)
    .first<{ name: string; payment_intent: string | null }>()
  if (!row) return '找不到這筆待審核的贊助，可能已經處理過。'
  if (!row.payment_intent) return `「${row.name}」沒有付款紀錄，無法自動退款，請到 Stripe 後台處理。`
  try {
    await stripeApi(env.STRIPE_SECRET_KEY, 'POST', 'refunds', {
      payment_intent: row.payment_intent,
      metadata: { sponsor_id: id },
    })
  } catch (err) {
    return `「${row.name}」退款失敗，狀態沒有改：${err instanceof Error ? err.message : err}`
  }
  await env.DB.prepare(`UPDATE sponsors SET status = 'rejected' WHERE id = ? AND status = 'review'`).bind(id).run()
  return `已退回「${row.name}」並全額退款。`
}

function authorized(request: Request, key: string): boolean {
  const header = request.headers.get('authorization') ?? ''
  if (!header.startsWith('Basic ')) return false
  let decoded = ''
  try {
    decoded = new TextDecoder().decode(Uint8Array.from(atob(header.slice(6)), (c) => c.charCodeAt(0)))
  } catch {
    return false
  }
  const password = decoded.slice(decoded.indexOf(':') + 1)
  return timingSafeEqual(password, key)
}

function html(body: string, status = 200): Response {
  return new Response(body, { status, headers: { 'content-type': 'text/html; charset=utf-8' } })
}
