/**
 * 變現設定。改這一個檔案即可，前端與 worker/ 共用。
 *
 * 打賞與贊助詞都走 Stripe Checkout，金額單位是美分（100 = US$1）。
 * 付款由 worker/index.ts 建立，所以這裡改完要重新部署。
 *
 * 廣告版位：html 留空時顯示佔位。要接 Google AdSense 或其他廣告，
 * 把廣告單元的 HTML 貼進對應的 html。這個專案不會自行載入廣告腳本，
 * 若片段需要 <script>，請另外加到 index.html。
 *
 * 例如（請換成你自己的用戶端編號，不要直接上線這段範例）：
 * html: '<ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-0000000000000000" data-ad-slot="0000000000"></ins>'
 */
export const CURRENCY = 'usd'

export const tip = {
  label: '請我喝杯咖啡',
  /** 按鈕上的三個金額，美分。 */
  amounts: [100, 300, 500] as readonly number[],
  /** Stripe 付款頁上的商品名稱。 */
  product: '鍵雨打賞',
}

export interface SponsorPlan {
  id: string
  label: string
  days: number
  /** 美分 */
  amount: number
}

/** 天數從審核通過、開始落下那天起算。 */
export const SPONSOR_PLANS: readonly SponsorPlan[] = [
  { id: 'week', label: '七天', days: 7, amount: 900 },
  { id: 'month', label: '三十天', days: 30, amount: 2900 },
]

export const SPONSOR_PRODUCT = '鍵雨贊助詞'

export const SPONSOR_LIMITS = {
  nameMax: 16,
  words: 3,
  wordMin: 2,
  wordMax: 8,
}

export function formatUsd(cents: number): string {
  const dollars = cents / 100
  return `US$${Number.isInteger(dollars) ? dollars : dollars.toFixed(2)}`
}

export function planById(id: string): SponsorPlan | null {
  return SPONSOR_PLANS.find((plan) => plan.id === id) ?? null
}

export interface AdSlot {
  id: 'banner' | 'sidebar'
  enabled: boolean
  html: string
}

export const adSlots: Record<AdSlot['id'], AdSlot> = {
  banner: {
    id: 'banner',
    enabled: true,
    html: '',
  },
  sidebar: {
    id: 'sidebar',
    enabled: true,
    html: '',
  },
}
