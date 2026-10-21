import type { Difficulty } from './types.ts'
import { rollSponsor } from './sponsors.ts'

/** Simplified forms that should not appear in the Traditional Chinese lists. */
const SIMPLIFIED = new Set(
  (
    '说学书国东车门开风电脑键这还对时会过从为发们语简华与专鸡长云马鱼鸟龙问间闻题头实际经现关爱亲观觉让认识议论请谢读课习练难应该乐观兴气听见视频网络软戏级别达标准备复杂单错误确输选择确认继续暂结个吗么体后里贝见号质于写听欢' 
  ).split(''),
)

const EASY = [
  '茶葉', '雨水', '月亮', '鍵盤', '打字', '練習', '早晨', '夜晚', '海邊', '山路',
  '書店', '咖啡', '窗邊', '燈光', '風聲', '鳥鳴', '雲朵', '花朵', '草地', '石頭',
  '河水', '橋樑', '火車', '單車', '書包', '鉛筆', '紙張', '信件', '朋友', '家人',
  '晚餐', '早餐', '午餐', '湯匙', '碗筷', '米飯', '麵包', '水果', '蘋果', '香蕉',
  '橘子', '葡萄', '西瓜', '檸檬', '蜂蜜', '牛奶', '紅茶', '綠茶', '清茶', '熱茶',
  '冷水', '溫泉', '雪花', '晴天', '陰天', '微風', '暴雨', '彩虹', '星星', '太陽',
  '地球', '海洋', '島嶼', '森林', '竹林', '梅花', '櫻花', '蘭花', '松樹', '楓葉',
  '秋天', '春天', '夏天', '冬天', '今日', '明天', '昨日', '現在', '剛才', '等等',
  '謝謝', '再見', '你好', '早安', '晚安', '請問', '慢慢', '快快', '輕輕', '安靜',
  '熱鬧', '快樂', '平安', '健康', '勇氣', '希望', '夢想', '故事', '詩歌', '音樂',
  '鋼琴', '吉他', '歌曲', '電影', '小說', '漫畫', '圖畫', '顏色', '紅色', '藍色',
  '綠色', '黃色', '白色', '黑色', '紫色', '金色', '銀色', '街道', '巷口', '屋頂',
  '窗台', '桌燈', '書櫃', '信紙', '郵票', '船票', '車票', '雨傘', '外套', '圍巾',
  '手套', '口袋', '鑰匙', '時鐘', '日曆', '茶杯', '茶壺', '茶席', '筆電', '滑鼠',
] as const

const MEDIUM = [
  '手沖茶', '等公車', '看星星', '喝熱茶', '聽雨聲', '騎單車', '買麵包', '深呼吸',
  '風很輕', '茶很香', '路很長', '夜已深', '燈還亮', '門沒關', '舊城牆', '新書店',
  '小島嶼', '大橋樑', '慢火車', '快腳步', '軟麵包', '硬鉛筆', '白紙張', '黑咖啡',
  '綠抹茶', '紅蘋果', '黃檸檬', '紫葡萄', '白雲朵', '藍天空', '金陽光', '銀月光',
  '竹葉子', '梅花香', '松樹林', '楓葉紅', '春雨細', '夏日長', '秋風涼', '冬夜靜',
  '鍵盤聲', '螢幕亮', '滑鼠點', '視窗開', '檔案存', '網路慢', '程式碼', '函式庫',
  '變數名', '迴圈跑', '條件式', '註解行', '編譯過', '測試綠', '錯誤紅', '除錯中',
  '部署完', '版本號', '午後陽光', '街角書店', '老街散步', '窗外細雨', '熱茶一杯',
  '慢慢練習', '清晨市場', '夜市燈光', '山間小路', '海邊散步', '城市節奏', '安靜閱讀',
  '寫一封信', '煮味噌湯', '打開窗戶', '整理書桌', '練習打字', '記住詞語', '微笑一下',
  '說聲謝謝', '週末出遊', '平常日子', '一碗湯麵', '一盤水果', '兩杯紅茶', '三顆星星',
  '今天好熱', '明天會冷', '書還沒讀', '雨後天晴', '月色很美', '早起讀書',
] as const

const HARD = [
  '午後的書店', '窗邊的熱茶', '雨停了以後', '慢慢把字打完', '今天想去海邊',
  '夜市的燈很亮', '山路上有薄霧', '把輸入法切好', '一句一句打完', '連擊還在累積',
  '紅線就在腳下', '驚險消去加分', '六十秒的競速', '街機模式開始', '練習讓手指穩',
  '茶香混著紙墨', '老城的石板路', '公車來了再走', '市場剛開張時', '音樂從巷口來',
  '寫信給遠方友人', '把今天的事記下來', '雨聲蓋過鍵盤聲', '月亮掛在屋頂上',
  '朋友在轉角等你', '早餐是蛋和吐司', '書架最上層的詩', '傍晚的風很舒服',
  '城市慢慢亮起來', '島嶼四周都是海', '森林裡有一條溪', '冬天適合喝熱湯',
  '春天的雨下得細', '夏天的午後很長', '秋天的楓葉轉紅', '請把每個字打對',
  '速度會慢慢加快', '準確率要守住', '這句話請打完', '石板路還在反光',
  '熱茶先放窗邊', '輸入法切到中文', '選字送出才算數', '組字的時候先別急',
  '打錯了就重新來', '生命還剩最後幾條', '愈接近地面愈緊張', '連擊亮了第五次',
] as const

const SENTENCES = [
  '清晨的市場剛開張，熱騰騰的麵包香味飄過整個街角。',
  '雨停之後，石板路還亮著一層水光，腳步也不自覺放慢。',
  '他把熱茶放在窗邊，看雲慢慢走過屋頂，一時不想說話。',
  '夜市的燈一盞盞亮起來，人聲跟著熱鬧，鍋氣也冒了出來。',
  '練習打字的時候，先把輸入法切到中文，選字送出後才算數。',
  '一句話打完，連擊就會悄悄加上去，手也比較穩得住。',
  '海邊的風帶著鹽味，午後特別適合散步，別走得太急。',
  '舊書店的樓梯很窄，樓上卻安靜得剛剛好，只聽得見翻頁。',
  '月亮升起來的時候，城市的燈也跟著點亮，巷口有人在等車。',
  '朋友在轉角等你，手裡提著剛買的水果，笑得像沒有急事。',
  '冬天的湯要慢慢喝，別急著把故事講完，碗還溫著就好。',
  '鍵盤的聲音很輕，像雨點落在鐵皮屋頂，一下一下都不吵。',
  '請把每個字都打對，打錯了就停下來再試，已經打對的先留著。',
  '六十秒不算長，卻足夠把一段話順順打完，呼吸不用亂。',
  '山路上有薄霧，腳步因此放得更慢一些，石頭也看得清楚。',
  '她把信摺好，放進抽屜最裡面的那一層，明天再決定要不要寄。',
  '市場裡的魚很新鮮，攤販正用冰塊鋪平，喊價的聲音很亮。',
  '音樂從巷口傳來，是一段熟悉的老歌，沒有人把音量轉大。',
  '今天的目標很單純，把落下的詞都接住，紅線以上都還來得及。',
  '小島四周都是海，船隻要等潮水才出航，碼頭上的人並不焦急。',
] as const

function rngIndex(rng: () => number, length: number): number {
  return Math.floor(rng() * length)
}

export function simplifiedChars(text: string): string[] {
  const found: string[] = []
  for (const ch of text) {
    if (SIMPLIFIED.has(ch) && !found.includes(ch)) found.push(ch)
  }
  return found
}

export function zhWordsFor(difficulty: Difficulty): readonly string[] {
  if (difficulty === 'easy') return EASY
  if (difficulty === 'medium') return MEDIUM
  return HARD
}

export function buildZhPassage(difficulty: Difficulty, rng: () => number = Math.random, minChars = 900): string {
  const bank = (difficulty === 'hard' ? SENTENCES : zhWordsFor(difficulty)).slice()
  let cursor = bank.length
  let out = ''
  let n = 0
  while (out.length < minChars) {
    n += 1
    let piece = ''
    if (n % 8 === 0) piece = rollSponsor(rng, 1)?.text ?? ''
    if (!piece) {
      if (cursor >= bank.length) {
        cursor = 0
        for (let i = bank.length - 1; i > 0; i--) {
          const j = rngIndex(rng, i + 1)
          const swap = bank[i]!
          bank[i] = bank[j]!
          bank[j] = swap
        }
      }
      piece = bank[cursor] ?? bank[0] ?? '詞語'
      cursor += 1
    }
    out = out ? `${out} ${piece}` : piece
  }
  return out
}

export function auditZhLexicon(): string[] {
  const problems: string[] = []
  const seen = new Set<string>()
  const check = (label: string, words: readonly string[], pattern: RegExp) => {
    for (const word of words) {
      if (!pattern.test(word)) problems.push(`${label}:${word}`)
      const simplified = simplifiedChars(word)
      if (simplified.length > 0) problems.push(`${label}:${word}:simplified:${simplified.join('')}`)
      const key = `${label}:${word}`
      if (seen.has(key)) problems.push(`dup:${key}`)
      seen.add(key)
    }
  }
  check('easy', EASY, /^[\u4e00-\u9fff]{2}$/)
  check('medium', MEDIUM, /^[\u4e00-\u9fff]{3,4}$/)
  check('hard', HARD, /^[\u4e00-\u9fff]{5,8}$/)
  for (const sentence of SENTENCES) {
    const simplified = simplifiedChars(sentence)
    if (simplified.length > 0) problems.push(`sentence:${sentence}:simplified:${simplified.join('')}`)
    if (!/^[\u4e00-\u9fff，。、！？]+$/.test(sentence) || !sentence.endsWith('。') || sentence.includes('，，')) {
      problems.push(`sentence:${sentence}`)
    }
    if (sentence.length < 24) problems.push(`short:${sentence}`)
  }
  return problems
}
