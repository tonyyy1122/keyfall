import { esc } from './logic.ts'
import { formatUsd, tip } from './monetization.ts'

/**
 * 側欄的打賞格與認購連結。金額按鈕直接送表單到 /api/tip，
 * worker 會 303 轉到 Stripe Checkout，所以不需要額外的前端程式。
 */
export function mountTip(form: HTMLFormElement): void {
  const cells = tip.amounts
    .map((amount) => {
      const label = formatUsd(amount)
      return `<button class="tip-cell" type="submit" name="amount" value="${amount}" aria-label="打賞 ${esc(label)}">${esc(label.replace('US$', ''))}</button>`
    })
    .join('')
  form.innerHTML = `
    <p class="tip-title">${esc(tip.label)}</p>
    <div class="tip-grid">${cells}</div>
    <p class="tip-note">美元，用 Stripe 付款</p>
    <a class="tip-sponsor" href="/sponsor">把你的品牌放進字雨</a>
  `
}

/** 從付款頁回來時，網址會帶 ?tip=thanks。回傳是否要道謝，並把參數清掉。 */
export function takeTipReturn(): boolean {
  const params = new URLSearchParams(location.search)
  if (params.get('tip') !== 'thanks') return false
  params.delete('tip')
  const rest = params.toString()
  history.replaceState(null, '', `${location.pathname}${rest ? `?${rest}` : ''}${location.hash}`)
  return true
}
