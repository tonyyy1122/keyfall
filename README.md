# 鍵雨

在瀏覽器裡練打字。預設是繁體中文：詞語從上方落下，用系統輸入法（注音、倉頡或其他中文輸入法）把它們打完。組字過程不算分，選字送出後才比對。也可以在主選單切成英文練習。

有兩種玩法：

- **字雨**：詞語不斷落下。打完就消去，碰到紅線就失去一條命，而且會愈落愈快。接近地面才消去會有驚險加分。
- **競速**：六十秒限時。照順序打出畫面上的文字。中文要連標點一起打；英文的簡單與普通不分大小寫，困難要連大小寫、逗號、句點和撇號都正確。

分數、速度、準確率、連擊和命數（或剩餘時間）會即時顯示。中文的速度是每分鐘字數，英文是 WPM。打完的詞會留在左側。每個語言、模式和難度各自保留前六名，存在這台瀏覽器的 `localStorage`（鍵名 `keyfall-v2`）。舊的 `keyfall-v1` 成績會當成英文紀錄讀進來。

## 環境

需要 Node.js 20 以上。

## 啟動

```bash
npm install
npm run dev
```

然後打開 [http://127.0.0.1:47321](http://127.0.0.1:47321)。只開這個時，打賞和認購按下去會失敗，贊助詞用範例；要試付款，見下方「Stripe 付款」。

## 建置

```bash
npm run build
npm run preview
```

`npm test` 會檢查計分、選詞、中文題庫、贊助詞設定、認購表單規則和 Stripe 簽章驗證。

## 怎麼玩

1. 主選單用「中文 / English」切換語言，或按 `L`。上下鍵選模式，左右鍵調難度，也可以直接按 `1` / `2` / `3`。
2. 中文請把輸入法切到中文。畫面下方有一個「組字」欄，候選字窗會跟在那裡。英文請切到英文。
3. 按 Enter 開始。倒數時再按 Enter 可跳過。
4. 字雨：送出的字若接得上某個還沒開始的詞，會鎖定最靠近地面的那個。打錯不會清掉已經打對的進度。不能用倒退鍵改進度。
5. 競速：依序打出每個字。打錯要訂正後才能繼續。
6. Esc 暫停。組字進行中的 Esc 會先取消輸入，再按一次才暫停。暫停時 Enter 繼續、R 重來、Q 回主選單。
7. 結束後 Enter 再來一局，Esc 回主選單。

音效可用右上角按鈕開關。選單和暫停時按 M，遊戲中按 F2。音效是瀏覽器即時合成的，沒有額外音檔。

外觀是一張淺色原稿紙：墨色正文，朱印只用在贊助。右上角可以改成深色，選擇會跟成績一起留在這台瀏覽器。

清除這個網站的瀏覽器資料，就會一併清掉排行榜。

## 贊助詞

有些落下的中文詞是品牌或標語，右上角有一枚「贊助」標記。打完之後會出現在左側，並帶上贊助者的連結。英文模式不會出現贊助詞。

編輯 `src/sponsors.ts` 的 `SPONSORS`：

- `name`：側欄顯示的名稱。
- `words`：會落下的詞或標語，請用繁體中文。
- `url`：選填。打完後，「打過的詞」裡的詞會連到這裡。
- `logo`：選填，公開圖片網址。
- `weight`：出現權重，數字愈大愈常被抽到。
- `example`：範例贊助請留 `true`，側欄會寫成「範例，名稱」。正式贊助拿掉這個欄位。

`SPONSOR_CHANCE` 是每種難度抽到贊助詞的機率。目前附上的青山茶行、雨街書店、島嶼鍵盤都是標明的範例，連結指向 example.com。

這份清單只是預設。遊戲開始時會讀 `/api/sponsors`，只要有一筆付款並審核通過、還沒到期的贊助，範例就整份收起來，換成正式贊助。讀不到時維持範例。

### 讓品牌自己認購

`/sponsor` 是認購頁：填名稱、最多三個詞、連結，選天數，付款。右邊會用遊戲裡的稿紙即時預覽詞語落下的樣子。表單規則在 `src/sponsor-form.ts`，前端和 Worker 用同一份，所以畫面上不會出現後端才擋下的錯誤。

付款後狀態是「待審核」。到 `/admin`（帳號隨意，密碼是 `ADMIN_KEY`）按「通過」就開始落下，天數從那一刻起算，到期自動停止；按「退款退回」會透過 Stripe 全額退款。

## 廣告版位

畫面上有兩個佔位：遊戲區上方的橫幅，中間留白；右側靠外的直式欄。請我喝杯咖啡在直式欄最下方。它們都不會蓋住落下的詞。

編輯 `src/monetization.ts` 的 `adSlots`：

- `enabled`：`false` 會把該版位藏起來。
- `html`：留空就顯示佔位說明。要接 Google AdSense 或其他廣告，把廣告單元的 HTML 貼進這裡。

這個專案不會自動載入廣告腳本。若片段還需要 `<script>`，請另外加到 `index.html`。

## 請我喝杯咖啡

右側直式欄最下方有三格金額。按一格就會開 Stripe 付款頁，付完回到遊戲會看到道謝。金額、按鈕文字和付款頁上的商品名稱在 `src/monetization.ts` 的 `tip`，單位是美分。

## Stripe 付款

打賞和贊助都透過 `worker/index.ts` 建立 Stripe Checkout，用 `price_data` 直接帶金額，不必先在 Stripe 後台建商品。整個網站（`dist/` 的靜態檔加上 `/api/*`、`/admin`）是同一支 Cloudflare Worker，資料存在 D1，資料表在 `schema.sql`。

| 路徑 | 用途 |
| --- | --- |
| `POST /api/tip` | 打賞，轉到 Stripe 付款頁 |
| `POST /api/sponsor` | 認購贊助詞，先存成未付款，再轉到付款頁 |
| `GET /api/sponsors` | 正在落下的贊助 |
| `POST /api/stripe/webhook` | 付款完成改成待審核；付款頁過期就刪掉未付款的那筆 |
| `/admin` | 審核頁 |

### 本機試付款（Stripe 沙盒）

1. 把 `.dev.vars.example` 複製成 `.dev.vars`，填沙盒的 `sk_test_...` 和一組 `ADMIN_KEY`。
2. `npm run db:init:local`
3. `npm run build`，再 `npm run dev:api`，打開 [http://127.0.0.1:8787](http://127.0.0.1:8787)。
4. 另開一個終端機跑 `stripe listen --forward-to localhost:8787/api/stripe/webhook`，把印出的 `whsec_...` 填進 `.dev.vars` 的 `STRIPE_WEBHOOK_SECRET`，重開 `dev:api`。
5. 用測試卡 4242 4242 4242 4242 付款。

改前端時也可以同時開 `npm run dev`，`/api` 和 `/admin` 會轉給 8787。

### 部署

1. `npx wrangler d1 create keyfall`，把 `database_id` 貼進 `wrangler.toml`，再 `npm run db:init`。
2. `npx wrangler secret put STRIPE_SECRET_KEY`、`STRIPE_WEBHOOK_SECRET`、`ADMIN_KEY`。若帳號開了 Managed Payments、需要稅碼，再設 `STRIPE_TAX_CODE`。
3. `npm run deploy`
4. 在 Stripe 後台新增 webhook，網址 `https://你的網域/api/stripe/webhook`，事件選 `checkout.session.completed`、`checkout.session.async_payment_succeeded`、`checkout.session.expired`。
