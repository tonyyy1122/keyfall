// 不依賴任何套件的 Stripe 小工具：表單編碼、API 呼叫、Webhook 簽章驗證

const enc = new TextEncoder()

type FormValue = string | number | boolean | null | undefined | FormObject | FormValue[]
interface FormObject {
  [key: string]: FormValue
}

/** { line_items: [{ price: 'p' }] } → line_items[0][price]=p */
export function formEncode(obj: FormObject | FormValue[], prefix = '', out: string[] = []): string {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue
    const key = prefix ? `${prefix}[${k}]` : k
    if (typeof v === 'object') formEncode(v, key, out)
    else out.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`)
  }
  return out.join('&')
}

export async function stripeApi<T>(secret: string, method: 'GET' | 'POST', path: string, params?: FormObject): Promise<T> {
  let url = `https://api.stripe.com/v1/${path}`
  const headers: Record<string, string> = { Authorization: `Bearer ${secret}` }
  const init: RequestInit = { method, headers }
  if (params) {
    const body = formEncode(params)
    if (method === 'GET') url += `?${body}`
    else {
      init.body = body
      headers['content-type'] = 'application/x-www-form-urlencoded'
    }
  }
  const res = await fetch(url, init)
  const data = (await res.json()) as T & { error?: { message?: string } }
  if (!res.ok) throw new Error(`Stripe ${path}：${data.error?.message ?? res.status}`)
  return data
}

export async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let r = 0
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return r === 0
}

/** 依 Stripe 官方規則驗證 Stripe-Signature 標頭，通過才回傳事件物件。 */
export async function verifyStripeSignature<T>(
  payload: string,
  header: string | null,
  secret: string,
  toleranceSec = 300,
  nowSec = Date.now() / 1000,
): Promise<T> {
  if (!header) throw new Error('缺少 Stripe-Signature 標頭')
  let t: string | undefined
  const sigs: string[] = []
  for (const part of header.split(',')) {
    const i = part.indexOf('=')
    const k = part.slice(0, i).trim()
    const v = part.slice(i + 1).trim()
    if (k === 't') t = v
    else if (k === 'v1') sigs.push(v)
  }
  if (!t || sigs.length === 0) throw new Error('Stripe-Signature 格式錯誤')
  if (Math.abs(nowSec - Number(t)) > toleranceSec) throw new Error('簽章時間超出容許範圍')
  const expected = await hmacSha256Hex(secret, `${t}.${payload}`)
  if (!sigs.some((s) => timingSafeEqual(s, expected))) throw new Error('簽章不符')
  return JSON.parse(payload) as T
}
