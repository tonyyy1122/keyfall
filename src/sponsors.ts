import type { Difficulty } from './types.ts'

/**
 * 贊助詞設定。
 * 落下的中文詞裡，會依 weight 與難度機率混入這裡的品牌或標語。
 * example 為 true 時，側欄會標成「範例 · 名稱」。換成真正的贊助時，把 example 拿掉。
 * url、logo 可以省略。logo 請放公開圖片網址。
 */
export interface Sponsor {
  id: string
  name: string
  words: readonly string[]
  url?: string
  logo?: string
  weight: number
  example?: boolean
}

export const SPONSORS: readonly Sponsor[] = [
  {
    id: 'qingshan',
    name: '青山茶行',
    words: ['青山茶行', '今日手沖', '午後熱茶'],
    url: 'https://example.com/qingshan-tea',
    weight: 3,
    example: true,
  },
  {
    id: 'yujie',
    name: '雨街書店',
    words: ['雨街書店', '翻開這一頁'],
    url: 'https://example.com/yujie-books',
    weight: 2,
    example: true,
  },
  {
    id: 'island-keys',
    name: '島嶼鍵盤',
    words: ['島嶼鍵盤', '讓手指記得'],
    url: 'https://example.com/island-keys',
    weight: 2,
    example: true,
  },
]

/** Chance a newly spawned arcade word is sponsored. English mode never rolls. */
export const SPONSOR_CHANCE: Record<Difficulty, number> = {
  easy: 0.14,
  medium: 0.2,
  hard: 0.24,
}

export interface SponsorRoll {
  sponsor: Sponsor
  text: string
}

export function rollSponsor(
  rng: () => number,
  chance: number,
  sponsors: readonly Sponsor[] = SPONSORS,
): SponsorRoll | null {
  if (sponsors.length === 0 || chance <= 0 || rng() >= chance) return null
  const total = sponsors.reduce((sum, item) => sum + Math.max(0, item.weight), 0)
  if (total <= 0) return null
  let cursor = rng() * total
  let picked = sponsors[0]!
  for (const item of sponsors) {
    cursor -= Math.max(0, item.weight)
    if (cursor <= 0) {
      picked = item
      break
    }
  }
  const words = picked.words.filter((word) => word.length > 0)
  if (words.length === 0) return null
  const text = words[Math.floor(rng() * words.length)] ?? words[0]!
  return { sponsor: picked, text }
}

export function sponsorForText(text: string, sponsors: readonly Sponsor[] = SPONSORS): Sponsor | null {
  for (const sponsor of sponsors) {
    if (sponsor.words.includes(text)) return sponsor
  }
  return null
}

export function auditSponsors(sponsors: readonly Sponsor[] = SPONSORS): string[] {
  const problems: string[] = []
  const ids = new Set<string>()
  for (const sponsor of sponsors) {
    if (!sponsor.id || ids.has(sponsor.id)) problems.push(`id:${sponsor.id}`)
    ids.add(sponsor.id)
    if (!sponsor.name) problems.push(`name:${sponsor.id}`)
    if (sponsor.weight <= 0) problems.push(`weight:${sponsor.id}`)
    if (sponsor.words.length === 0) problems.push(`words:${sponsor.id}`)
    for (const word of sponsor.words) {
      if (!/^[\u4e00-\u9fff]{2,12}$/.test(word)) problems.push(`word:${sponsor.id}:${word}`)
    }
    if (sponsor.url && !/^https?:\/\//.test(sponsor.url)) problems.push(`url:${sponsor.id}`)
  }
  return problems
}
