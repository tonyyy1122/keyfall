// Worker 直接回的 HTML：錯誤訊息頁與審核頁。沿用遊戲的原稿紙配色，不另載字型。
import { esc } from '../src/logic.ts'
import { formatUsd, planById } from '../src/monetization.ts'

export interface SponsorRow {
  id: string
  name: string
  words: string
  url: string | null
  plan: string
  days: number
  amount: number
  status: 'review' | 'live' | 'rejected'
  email: string | null
  paid_at: string | null
  starts_at: string | null
  ends_at: string | null
}

export interface TipSummary {
  count: number
  total: number
}

const CSS = `
:root {
  --paper: #eef0ee; --sheet: #f7f7f5; --sumi: #1a1a18; --nezumi: #5c5c56;
  --rule: #d4d5d0; --aisumi: #1e2a3a; --shu: #8f3330; --ink-on-aisumi: #f4f5f2;
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  :root {
    --paper: #121211; --sheet: #191918; --sumi: #e7e6e1; --nezumi: #a4a49c;
    --rule: #2c2c2a; --aisumi: #d7dde6; --shu: #e09a96; --ink-on-aisumi: #121211;
    color-scheme: dark;
  }
}
* { box-sizing: border-box; }
body {
  margin: 0; background: var(--paper); color: var(--sumi);
  font: 16px/1.7 "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif;
}
main { width: min(880px, 100%); margin: 0 auto; padding: 40px 20px 64px; }
h1 { margin: 0; font: 500 2rem/1.3 "Noto Serif TC", "Songti TC", serif; letter-spacing: 0.04em; }
h2 { margin: 40px 0 0; padding-bottom: 8px; border-bottom: 1px solid var(--sumi); font-size: 1rem; font-weight: 500; }
p { margin: 12px 0 0; max-width: 36rem; }
.quiet { color: var(--nezumi); }
a { color: inherit; }
.note { margin-top: 20px; padding: 10px 14px; border-left: 2px solid var(--aisumi); background: var(--sheet); }
.back { display: inline-block; margin-top: 28px; padding: 10px 18px; border: 1px solid var(--sumi); border-radius: 2px; text-decoration: none; font-weight: 500; }
.row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px 20px; padding: 16px 0; border-bottom: 1px solid var(--rule); }
.who { font-weight: 500; }
.words { font: 500 1.15rem/1.5 "Noto Serif TC", "Songti TC", serif; letter-spacing: 0.12em; }
.meta { color: var(--nezumi); font-size: 0.85rem; }
.acts { display: flex; gap: 8px; align-items: start; }
button { font: inherit; padding: 6px 14px; border-radius: 2px; cursor: pointer; }
.ok { background: var(--aisumi); color: var(--ink-on-aisumi); border: 1px solid var(--aisumi); }
.no { background: transparent; color: var(--shu); border: 1px solid var(--shu); }
.empty { color: var(--nezumi); padding: 16px 0; }
@media (max-width: 560px) { .row { grid-template-columns: 1fr; } }
`

function shell(title: string, body: string): string {
  return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">
<title>${esc(title)}｜鍵雨</title><style>${CSS}</style></head><body><main>${body}</main></body></html>`
}

export function messagePage(title: string, message: string, back: string): string {
  return shell(
    title,
    `<h1>${esc(title)}</h1><p>${esc(message)}</p><a class="back" href="${esc(back)}">回上一頁</a>`,
  )
}

function when(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', dateStyle: 'medium', timeStyle: 'short' })
}

function rowHtml(row: SponsorRow, now: Date): string {
  const words = (JSON.parse(row.words) as string[]).join('　')
  const plan = planById(row.plan)?.label ?? `${row.days} 天`
  const link = row.url ? `<a href="${esc(row.url)}" target="_blank" rel="noopener noreferrer">${esc(row.url)}</a>` : '沒有連結'
  const meta: string[] = [`${plan} ${formatUsd(row.amount)}`, row.email ? esc(row.email) : '沒有 Email']
  if (row.status === 'review') meta.push(`付款於 ${when(row.paid_at)}`)
  if (row.status === 'live') {
    const over = row.ends_at && new Date(row.ends_at) <= now
    meta.push(over ? `已於 ${when(row.ends_at)} 結束` : `落下到 ${when(row.ends_at)}`)
  }
  if (row.status === 'rejected') meta.push('已退款')
  const acts =
    row.status === 'review'
      ? `<div class="acts">
          <form method="post" action="/admin/approve"><input type="hidden" name="id" value="${esc(row.id)}"><button class="ok">通過</button></form>
          <form method="post" action="/admin/reject"><input type="hidden" name="id" value="${esc(row.id)}"><button class="no">退款退回</button></form>
        </div>`
      : '<div></div>'
  return `<div class="row"><div>
      <div class="who">${esc(row.name)}</div>
      <div class="words">${esc(words)}</div>
      <div class="meta">${link}</div>
      <div class="meta">${meta.join('，')}</div>
    </div>${acts}</div>`
}

export function adminPage(rows: SponsorRow[], tips: TipSummary, now: Date, note: string | null): string {
  const group = (status: SponsorRow['status']) => rows.filter((row) => row.status === status)
  const list = (items: SponsorRow[], empty: string) =>
    items.length ? items.map((row) => rowHtml(row, now)).join('') : `<p class="empty">${empty}</p>`
  return shell(
    '贊助審核',
    `<h1>贊助審核</h1>
    <p class="quiet">通過後立刻開始落下，天數從現在算。退回會透過 Stripe 全額退款。</p>
    ${note ? `<p class="note">${esc(note)}</p>` : ''}
    <h2>待審核（${group('review').length}）</h2>
    ${list(group('review'), '沒有待審核的贊助。')}
    <h2>已上線</h2>
    ${list(group('live'), '還沒有上線的贊助。')}
    <h2>已退回</h2>
    ${list(group('rejected'), '沒有退回紀錄。')}
    <h2>打賞</h2>
    <p>${tips.count} 筆，合計 ${formatUsd(tips.total)}。</p>`,
  )
}
