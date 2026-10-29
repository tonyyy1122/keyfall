import './style.css'
import './sponsor.css'
import { esc } from './logic.ts'
import { SPONSOR_LIMITS, SPONSOR_PLANS, formatUsd, planById } from './monetization.ts'
import { checkSponsorDraft, type SponsorDraft, type SponsorField } from './sponsor-form.ts'

const DRAFT_KEY = 'keyfall-sponsor-draft'
const SAMPLE = { name: '青山茶行', words: ['青山茶行', '今日手沖', '午後熱茶'] }

const form = document.querySelector<HTMLFormElement>('#buy')!
const wordsHost = document.querySelector<HTMLDivElement>('#words')!
const plansHost = document.querySelector<HTMLDivElement>('#plans')!
const payBtn = document.querySelector<HTMLButtonElement>('#pay')!
const previewWord = document.querySelector<HTMLDivElement>('#preview-word')!
const previewText = document.querySelector<HTMLSpanElement>('#preview-text')!
const previewWho = document.querySelector<HTMLSpanElement>('#preview-who')!
const previewSaid = document.querySelector<HTMLSpanElement>('#preview-said')!

const { words: maxWords, wordMin, wordMax, nameMax } = SPONSOR_LIMITS
let previewIndex = 0

wordsHost.innerHTML = Array.from({ length: maxWords }, (_, i) => {
  const hint = SAMPLE.words[i] ?? ''
  const label = i === 0 ? '第一個詞' : `第 ${i + 1} 個詞（選填）`
  return `<input name="word" lang="zh-Hant" maxlength="${wordMax}" autocomplete="off" spellcheck="false" placeholder="${esc(hint)}" aria-label="${esc(label)}" />`
}).join('')
document.querySelector('#word-help')!.textContent =
  `品牌名或標語，每個 ${wordMin} 到 ${wordMax} 個中文字，不含標點。最多 ${maxWords} 個，落下時輪流出現。`
document.querySelector<HTMLInputElement>('#name')!.maxLength = nameMax

plansHost.innerHTML = SPONSOR_PLANS.map(
  (plan, i) => `
    <label class="plan">
      <input type="radio" name="plan" value="${esc(plan.id)}" ${i === 0 ? 'checked' : ''} />
      <span class="plan-days">${esc(plan.label)}</span>
      <span class="plan-price">${esc(formatUsd(plan.amount))}</span>
    </label>`,
).join('')

const params = new URLSearchParams(location.search)
if (params.has('paid')) {
  sessionStorage.removeItem(DRAFT_KEY)
  form.hidden = true
  document.querySelector<HTMLElement>('#paid')!.hidden = false
} else if (params.has('cancel')) {
  document.querySelector<HTMLElement>('#cancelled')!.hidden = false
  restoreDraft()
}

form.addEventListener('input', (event) => {
  const target = event.target
  if (target instanceof HTMLInputElement) clearError(fieldOf(target))
  paintPay()
  paintPreview()
})

form.addEventListener('submit', (event) => {
  const draft = readDraft()
  const checked = checkSponsorDraft(draft)
  if (!checked.ok) {
    event.preventDefault()
    for (const [field, message] of Object.entries(checked.errors)) showError(field as SponsorField, message)
    const first = form.querySelector<HTMLElement>('.err:not(:empty)')?.closest('.field-row')?.querySelector('input')
    first?.focus()
    return
  }
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  } catch {
    // 存不了草稿也照樣付款
  }
  payBtn.disabled = true
  payBtn.textContent = '正在開啟付款頁…'
})

// 從付款頁按上一頁回來時，瀏覽器可能直接還原這一頁，按鈕要恢復。
window.addEventListener('pageshow', () => {
  payBtn.disabled = false
  paintPay()
})

previewWord.addEventListener('animationiteration', () => {
  previewIndex += 1
  paintPreview()
})

paintPay()
paintPreview()

function readDraft(): SponsorDraft {
  const data = new FormData(form)
  return {
    name: String(data.get('name') ?? ''),
    words: data.getAll('word').map(String),
    url: String(data.get('url') ?? ''),
    plan: String(data.get('plan') ?? ''),
  }
}

function restoreDraft(): void {
  let draft: SponsorDraft | null = null
  try {
    draft = JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? 'null') as SponsorDraft | null
  } catch {
    return
  }
  if (!draft) return
  form.querySelector<HTMLInputElement>('#name')!.value = draft.name ?? ''
  form.querySelector<HTMLInputElement>('#url')!.value = draft.url ?? ''
  form.querySelectorAll<HTMLInputElement>('input[name="word"]').forEach((input, i) => {
    input.value = draft.words?.[i] ?? ''
  })
  const plan = form.querySelector<HTMLInputElement>(`input[name="plan"][value="${CSS.escape(draft.plan ?? '')}"]`)
  if (plan) plan.checked = true
}

function fieldOf(input: HTMLInputElement): SponsorField {
  if (input.name === 'word') return 'words'
  return input.name as SponsorField
}

function showError(field: SponsorField, message: string): void {
  const slot = form.querySelector<HTMLElement>(`[data-err="${field}"]`)
  if (slot) slot.textContent = message
  slot?.closest('.field-row')?.classList.add('bad')
}

function clearError(field: SponsorField): void {
  const slot = form.querySelector<HTMLElement>(`[data-err="${field}"]`)
  if (!slot || !slot.textContent) return
  slot.textContent = ''
  slot.closest('.field-row')?.classList.remove('bad')
}

function paintPay(): void {
  const plan = planById(String(new FormData(form).get('plan') ?? ''))
  payBtn.textContent = plan ? `付款 ${formatUsd(plan.amount)}` : '付款'
}

function paintPreview(): void {
  const draft = readDraft()
  const words = draft.words.map((word) => word.trim()).filter(Boolean)
  const shown = words.length > 0 ? words : SAMPLE.words
  const text = shown[previewIndex % shown.length] ?? SAMPLE.words[0]!
  const name = draft.name.trim() || SAMPLE.name
  previewText.textContent = text
  previewWho.textContent = name
  previewSaid.textContent = text
  previewSaid.classList.toggle('linked', draft.url.trim().length > 0)
}
