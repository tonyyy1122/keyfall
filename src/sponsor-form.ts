import { simplifiedChars } from './lexicon-zh.ts'
import { SPONSOR_LIMITS, planById, type SponsorPlan } from './monetization.ts'

/**
 * 認購表單的檢查。前端送出前和 worker 收單時跑的是同一份規則，
 * 所以玩家在畫面上看到的錯誤，就是後端會擋下來的錯誤。
 */
export interface SponsorDraft {
  name: string
  words: string[]
  url: string
  plan: string
}

export interface SponsorOrder {
  name: string
  words: string[]
  url: string | null
  plan: SponsorPlan
}

export type SponsorField = 'name' | 'words' | 'url' | 'plan'

export type SponsorCheck =
  | { ok: true; order: SponsorOrder }
  | { ok: false; errors: Partial<Record<SponsorField, string>> }

const HAN = /^[一-鿿]+$/

export function checkSponsorDraft(draft: SponsorDraft): SponsorCheck {
  const errors: Partial<Record<SponsorField, string>> = {}
  const { nameMax, words: maxWords, wordMin, wordMax } = SPONSOR_LIMITS

  const name = draft.name.trim()
  if (!name) errors.name = '請填名稱，打完詞之後會顯示在側欄。'
  else if ([...name].length > nameMax) errors.name = `名稱最多 ${nameMax} 個字。`

  const words = draft.words.map((word) => word.trim()).filter(Boolean)
  const wordProblem = words
    .map((word) => {
      const len = [...word].length
      if (!HAN.test(word)) return `「${word}」只能用中文字，不含標點、英文或數字。`
      if (len < wordMin || len > wordMax) return `「${word}」要 ${wordMin} 到 ${wordMax} 個字。`
      const simplified = simplifiedChars(word)
      if (simplified.length > 0) return `「${word}」有簡體字：${simplified.join('')}。請改用繁體。`
      return ''
    })
    .find(Boolean)
  if (words.length === 0) errors.words = '至少填一個詞。'
  else if (words.length > maxWords) errors.words = `最多 ${maxWords} 個詞。`
  else if (wordProblem) errors.words = wordProblem
  else if (new Set(words).size !== words.length) errors.words = '詞語不能重複。'

  let url: string | null = null
  const rawUrl = draft.url.trim()
  if (rawUrl) {
    try {
      const parsed = new URL(rawUrl)
      if (parsed.protocol !== 'https:') errors.url = '連結要以 https:// 開頭。'
      else if (rawUrl.length > 300) errors.url = '連結太長，請縮短到 300 字元以內。'
      else url = parsed.toString()
    } catch {
      errors.url = '連結格式不對，請貼完整網址，例如 https://example.com。'
    }
  }

  const plan = planById(draft.plan)
  if (!plan) errors.plan = '請選一個方案。'

  if (Object.keys(errors).length > 0 || !plan) return { ok: false, errors }
  return { ok: true, order: { name, words, url, plan } }
}
