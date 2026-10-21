import { esc } from './logic.ts'
import { adSlots, type AdSlot } from './monetization.ts'

const COPY: Record<AdSlot['id'], { title: string; note: string }> = {
  banner: {
    title: '橫幅廣告版位',
    note: '在 src/monetization.ts 的 banner.html 貼上廣告程式碼後，這裡會換成正式廣告。',
  },
  sidebar: {
    title: '側欄廣告版位',
    note: '預留給 Google AdSense 或其他廣告碼。目前是佔位，不會擋住遊戲。',
  },
}

export function renderAdSlot(host: HTMLElement, slot: AdSlot): void {
  host.replaceChildren()
  host.hidden = !slot.enabled
  if (!slot.enabled) return
  host.dataset.slot = slot.id
  if (slot.html.trim()) {
    host.className = `ad-slot live ${slot.id}`
    host.innerHTML = slot.html
    return
  }
  host.className = `ad-slot placeholder ${slot.id}`
  const copy = COPY[slot.id]
  host.innerHTML = `
    <p class="ad-kicker">廣告</p>
    <p class="ad-title">${esc(copy.title)}</p>
    <p class="ad-note">${esc(copy.note)}</p>
  `
}

export function mountAds(): void {
  const banner = document.querySelector<HTMLElement>('#ad-banner')
  const side = document.querySelector<HTMLElement>('#ad-sidebar')
  if (banner) renderAdSlot(banner, adSlots.banner)
  if (side) renderAdSlot(side, adSlots.sidebar)
}
