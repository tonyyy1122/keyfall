/**
 * 變現設定。改這一個檔案即可。
 *
 * 請我喝杯咖啡：換成你的 Buy Me a Coffee 使用者名稱與網址。
 * 廣告版位：html 留空時顯示佔位。要接 Google AdSense 或其他廣告，
 * 把廣告單元的 HTML 貼進對應的 html。這個專案不會自行載入廣告腳本，
 * 若片段需要 <script>，請另外加到 index.html。
 *
 * 例如（請換成你自己的用戶端編號，不要直接上線這段範例）：
 * html: '<ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-0000000000000000" data-ad-slot="0000000000"></ins>'
 */
export const coffee = {
  username: 'your-name',
  url: 'https://buymeacoffee.com/your-name',
  label: '請我喝杯咖啡',
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
