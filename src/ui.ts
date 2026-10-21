import { DIFFICULTIES, difficultyHint, modeCopy } from './config.ts'
import {
  compareRank,
  esc,
  formatAccuracy,
  formatClock,
  formatInt,
  formatSeconds,
  formatWhen,
  formatWpm,
} from './logic.ts'
import type { Difficulty, EndReason, LiveStats, Mode, ScoreEntry, Script } from './types.ts'

export function fillHud(hud: HTMLElement): void {
  hud.innerHTML = `
    <div class="stat"><span class="k">分數</span><span class="v" data-k="score">0</span></div>
    <div class="stat" data-speed title="每分鐘字數"><span class="k" data-k="speed-label">字／分</span><span class="v" data-k="wpm">0</span></div>
    <div class="stat"><span class="k">準確率</span><span class="v" data-k="acc">100%</span></div>
    <div class="stat" data-combo><span class="k">連擊</span><span class="v" data-k="combo">0</span></div>
    <div class="stat" data-extra><span class="k" data-k="extra-label">生命</span><span class="v extra" data-k="extra"></span></div>
  `
}

export function paintHud(hud: HTMLElement, stats: LiveStats, mode: Mode, script: Script = 'zh'): void {
  const score = hud.querySelector('[data-k="score"]')
  const wpm = hud.querySelector('[data-k="wpm"]')
  const acc = hud.querySelector('[data-k="acc"]')
  const combo = hud.querySelector('[data-k="combo"]')
  const extra = hud.querySelector('[data-k="extra"]')
  const extraLabel = hud.querySelector('[data-k="extra-label"]')
  const comboStat = hud.querySelector('[data-combo]')
  const extraStat = hud.querySelector('[data-extra]')
  if (!score || !wpm || !acc || !combo || !extra || !extraLabel || !comboStat || !extraStat) return

  bump(score, hud.dataset.score, String(stats.score), formatInt(stats.score))
  bump(wpm, hud.dataset.wpm, String(Math.round(stats.wpm)), formatWpm(stats.wpm))
  acc.textContent = formatAccuracy(stats.accuracy)
  bump(combo, hud.dataset.combo, String(stats.combo), String(stats.combo))
  hud.dataset.score = String(stats.score)
  hud.dataset.wpm = String(Math.round(stats.wpm))
  hud.dataset.combo = String(stats.combo)

  const speedLabel = hud.querySelector('[data-k="speed-label"]')
  const speedStat = hud.querySelector('[data-speed]')
  if (speedLabel) speedLabel.textContent = script === 'zh' ? '字／分' : 'WPM'
  speedStat?.setAttribute('title', script === 'zh' ? '每分鐘字數' : '每分鐘英文詞數')

  comboStat.classList.toggle('hot', stats.combo >= 5)
  comboStat.classList.toggle('blaze', stats.combo >= 10)
  extraLabel.textContent = mode === 'arcade' ? '生命' : '時間'
  extraStat.classList.toggle('danger', mode === 'sprint' && stats.remainingMs <= 10_000 && stats.remainingMs > 0)

  if (mode === 'sprint') {
    extra.textContent = formatSeconds(stats.remainingMs)
    hud.dataset.lives = ''
    return
  }

  const lifeKey = `${stats.lives}/${stats.maxLives}`
  if (hud.dataset.lives !== lifeKey) {
    const prev = hud.dataset.lives ? Number(hud.dataset.lives.split('/')[0]) : stats.lives
    extra.innerHTML = heartRow(stats.lives, stats.maxLives, prev)
    hud.dataset.lives = lifeKey
  }
}

function bump(node: Element, prev: string | undefined, nextKey: string, label: string): void {
  node.textContent = label
  if (prev === undefined || prev === nextKey) return
  node.classList.remove('bump')
  void (node as HTMLElement).offsetWidth
  node.classList.add('bump')
}

const HEART =
  '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M12 20.4s-6.4-4.1-8.5-7.8C1.9 9.7 3 6.4 6.3 6.4c1.8 0 3 1.1 3.7 2.3.7-1.2 1.9-2.3 3.7-2.3 3.3 0 4.4 3.3 2.8 6.2-2.1 3.7-8.5 7.8-8.5 7.8z"/></svg>'

function heartRow(lives: number, max: number, prev: number): string {
  let html = ''
  for (let i = 0; i < max; i++) {
    const on = i < lives
    const pop = prev > lives && i === lives
    html += `<span class="heart${on ? ' on' : ''}${pop ? ' pop' : ''}">${HEART}</span>`
  }
  return `<span class="hearts" aria-label="剩餘 ${lives} 條命">${html}</span>`
}

export function paintMute(button: HTMLButtonElement, muted: boolean): void {
  button.textContent = muted ? '音效關' : '音效開'
  button.setAttribute('aria-pressed', muted ? 'true' : 'false')
}

export function paintTheme(button: HTMLButtonElement, theme: 'light' | 'dark'): void {
  const dark = theme === 'dark'
  button.textContent = dark ? '深色' : '淺色'
  button.setAttribute('aria-pressed', dark ? 'true' : 'false')
  button.setAttribute('aria-label', dark ? '切換為淺色' : '切換為深色')
}

export function menuHtml(mode: Mode, difficulty: Difficulty, scores: readonly ScoreEntry[], script: Script): string {
  const cards = (['arcade', 'sprint'] as Mode[])
    .map((id) => {
      const copy = modeCopy(script, id)
      const pressed = id === mode
      return `
        <button class="mode" type="button" data-act="mode" data-mode="${id}" aria-pressed="${pressed}">
          <span class="kicker">${copy.kicker}</span>
          <span class="mode-name">${copy.label}</span>
          <span class="mode-copy">${copy.blurb}</span>
        </button>
      `
    })
    .join('')

  const diffs = (Object.keys(DIFFICULTIES) as Difficulty[])
    .map((id) => {
      const item = DIFFICULTIES[id]
      return `<button type="button" data-act="diff" data-diff="${id}" aria-pressed="${id === difficulty}">${item.label}</button>`
    })
    .join('')

  const best = scores
    .filter((entry) => entry.mode === mode && entry.difficulty === difficulty && (entry.script ?? 'en') === script)
    .slice()
    .sort(compareRank)[0]

  const eyebrow = script === 'zh' ? '今天練中文。' : '今天練英文。'
  const lede =
    script === 'zh'
      ? '字從上方落下。用注音或倉頡打完，選字送出之後才算數。想練英文，也可以從這裡切過去。'
      : '單字從上方落下。落地之前打完，或用六十秒把一段英文順順打完。'
  const ime =
    script === 'zh'
      ? '請把輸入法切到中文。組字時不會算分，選字送出後才比對。'
      : '請把輸入法切到英文。'

  return `
    <section class="menu">
      <p class="eyebrow">${eyebrow}</p>
      <h1>鍵雨</h1>
      <p class="lede">${lede}</p>
      <div class="lang" role="radiogroup" aria-label="打字語言">
        <button type="button" data-act="lang" data-script="zh" aria-pressed="${script === 'zh'}">中文</button>
        <button type="button" data-act="lang" data-script="en" aria-pressed="${script === 'en'}">English</button>
      </div>
      <p class="ime">${ime}</p>
      <div class="modes">${cards}</div>
      <div class="diff-block">
        <div class="diff" role="radiogroup" aria-label="難度">${diffs}</div>
        <p class="diff-hint">${difficultyHint(script, difficulty)}</p>
      </div>
      <div class="row">
        <button class="primary" type="button" data-act="start">開始遊戲</button>
        <button class="ghost" type="button" data-act="help">怎麼玩</button>
        <p class="best">${best ? `最佳 ${formatInt(best.score)}` : '這個組合還沒有紀錄'}</p>
      </div>
      <section class="board">
        <div class="board-head">
          <h2>排行榜</h2>
          <p>現在是${modeCopy(script, mode).label}，${DIFFICULTIES[difficulty].label}，${script === 'zh' ? '中文' : '英文'}。</p>
        </div>
        ${boardHtml(scores, mode, difficulty, script)}
        <p class="fine">成績只留在這台瀏覽器。中文與英文分開排名。</p>
      </section>
      <p class="keys">上下鍵選模式，左右鍵調難度。L 切換中文和英文，Enter 開始，H 看說明，M 開關音效。</p>
    </section>
  `
}

export function helpHtml(script: Script): string {
  const arcade =
    script === 'zh'
      ? `
            <li>好幾個詞會同時落下。標著「贊助」的是品牌詞。</li>
            <li>用注音、倉頡或其他中文輸入法。組字過程不算，選字送出後才比對。</li>
            <li>送出的字若是某個還沒開始的詞的開頭，會鎖定最靠近地面的那個。</li>
            <li>打錯會中斷連擊，已經送出的進度還在。</li>
            <li>詞碰到下方紅線就失去一條命。</li>
            <li>越接近地面才消去，會有「驚險」加分。</li>
            <li>打完的詞會留在左側，贊助詞附上連結。</li>`
      : `
            <li>好幾個單字會同時落下。</li>
            <li>按下第一個字母，會鎖定最靠近地面、而且對得上的那個。</li>
            <li>把剩下的字母依序打完，單字就消去。</li>
            <li>打錯會中斷連擊，已經打對的進度還在。</li>
            <li>單字碰到下方紅線就失去一條命。</li>
            <li>越接近地面才消去，會有「驚險」加分。</li>`
  const sprint =
    script === 'zh'
      ? `
            <li>你有六十秒，用輸入法依序打出接下來的字。</li>
            <li>組字時不會前進，選字送出後才比對。</li>
            <li>送出的內容必須接得上後面的文字，標點也要打。</li>
            <li>打錯不會跳過，訂正後才能繼續。</li>
            <li>一整句分段都沒打錯，連擊就加一。</li>`
      : `
            <li>你有六十秒，依序打出每一個字元，空白也要打。</li>
            <li>簡單與普通不計大小寫。</li>
            <li>困難要完全相符，包含大小寫、逗號、句點和撇號。</li>
            <li>打錯不會跳過，訂正後才能繼續。</li>
            <li>一整個單字都沒打錯，連擊就加一。</li>`
  return `
    <div class="sheet help">
      <p class="eyebrow">操作說明</p>
      <h2>怎麼玩</h2>
      <div class="help-grid">
        <section>
          <h3>字雨</h3>
          <ul>${arcade}
          </ul>
        </section>
        <section>
          <h3>競速</h3>
          <ul>${sprint}
          </ul>
        </section>
      </div>
      <ul class="keys tight">
        <li><kbd>Esc</kbd> 暫停，再按一次繼續</li>
        <li>暫停時 <kbd>R</kbd> 重來，<kbd>Q</kbd> 回主選單</li>
        <li>結束時 <kbd>Enter</kbd> 再來一局，<kbd>Esc</kbd> 回主選單</li>
        <li><kbd>M</kbd> 在選單與暫停時切換音效，遊戲中按 <kbd>F2</kbd></li>
      </ul>
      <div class="row">
        <button class="primary" type="button" data-act="close">知道了</button>
      </div>
    </div>
  `
}

export function countdownHtml(label: string): string {
  return `<div class="count" aria-hidden="true">${esc(label)}</div>`
}

export function pauseHtml(auto: boolean, script: Script): string {
  const noun = script === 'zh' ? '詞語' : '單字'
  return `
    <div class="sheet slim">
      <p class="eyebrow">暫停</p>
      <h2>${auto ? '先幫你按住了' : '先停一下'}</h2>
      <p class="lede">${auto ? `視窗切到背景，${noun}先停在原地。` : `${noun}會停在原地，時間也不會走。`}</p>
      <div class="row">
        <button class="primary" type="button" data-act="resume">繼續遊戲</button>
        <button class="ghost" type="button" data-act="retry">重來一局</button>
        <button class="ghost" type="button" data-act="menu">回主選單</button>
      </div>
      <p class="keys">Enter 繼續，R 重來，Q 回主選單。</p>
    </div>
  `
}

export function overHtml(
  stats: LiveStats,
  mode: Mode,
  difficulty: Difficulty,
  reason: EndReason,
  scores: readonly ScoreEntry[],
  rank: number | null,
  isBest: boolean,
  highlightAt: string,
  script: Script,
): string {
  const title = reason === 'time' ? '時間到' : '生命用盡'
  const place = isBest ? '新紀錄' : rank ? `第 ${rank} 名` : '這次沒有擠進排行榜'
  const wordLabel = mode === 'arcade' ? (script === 'zh' ? '消去的詞' : '消去單字') : script === 'zh' ? '完成詞句' : '完成單字'
  const timeLabel = mode === 'arcade' ? '存活' : '用時'
  const timeValue = mode === 'arcade' ? formatClock(stats.elapsedMs) : '60 秒'
  const speedName = script === 'zh' ? '每分鐘字數' : 'WPM'
  return `
    <div class="sheet result">
      <p class="eyebrow">${esc(modeCopy(script, mode).label)}，${esc(DIFFICULTIES[difficulty].label)}</p>
      <div class="result-top">
        <h2>${title}</h2>
        ${isBest ? '<span class="stamp">新紀錄</span>' : `<span class="place">${place}</span>`}
      </div>
      <p class="big-score">${formatInt(stats.score)}</p>
      <dl class="metrics">
        <div><dt>${speedName}</dt><dd>${formatWpm(stats.wpm)}</dd></div>
        <div><dt>準確率</dt><dd>${formatAccuracy(stats.accuracy)}</dd></div>
        <div><dt>最高連擊</dt><dd>${stats.maxCombo}</dd></div>
        <div><dt>正確字元</dt><dd>${formatInt(stats.correct)}</dd></div>
        <div><dt>${wordLabel}</dt><dd>${formatInt(stats.wordsCleared)}</dd></div>
        <div><dt>${timeLabel}</dt><dd>${timeValue}</dd></div>
      </dl>
      <div class="row">
        <button class="primary" type="button" data-act="retry">再來一局</button>
        <button class="ghost" type="button" data-act="menu">回主選單</button>
      </div>
      <section class="board">
        <div class="board-head">
          <h2>排行榜</h2>
          <p>${place}</p>
        </div>
        ${boardHtml(scores, mode, difficulty, script, highlightAt)}
      </section>
      <p class="keys">Enter 再來一局，Esc 回主選單。</p>
    </div>
  `
}

function boardHtml(
  scores: readonly ScoreEntry[],
  mode: Mode,
  difficulty: Difficulty,
  script: Script,
  highlightAt?: string,
): string {
  const rows = scores
    .filter((entry) => entry.mode === mode && entry.difficulty === difficulty && (entry.script ?? 'en') === script)
    .slice()
    .sort(compareRank)
  if (rows.length === 0) {
    return `<p class="empty">這個組合還沒有紀錄。打完一局就會留在這裡。</p>`
  }
  const body = rows
    .map((entry, index) => {
      const fresh = highlightAt && entry.at === highlightAt ? ' class="fresh"' : ''
      return `<tr${fresh}><td>${index + 1}</td><td>${formatInt(entry.score)}</td><td>${formatInt(entry.wpm)}</td><td>${formatAccuracy(entry.accuracy)}</td><td class="hide-sm">${entry.maxCombo}</td><td class="hide-sm">${esc(formatWhen(entry.at))}</td></tr>`
    })
    .join('')
  return `
    <table>
      <thead>
        <tr><th>名次</th><th>分數</th><th>${script === 'zh' ? '字／分' : 'WPM'}</th><th>準確率</th><th class="hide-sm">連擊</th><th class="hide-sm">日期</th></tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  `
}
