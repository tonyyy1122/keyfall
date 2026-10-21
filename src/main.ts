import './style.css'
import type { ArcadeGame } from './arcade.ts'
import { ArcadeGame as Arcade } from './arcade.ts'
import { Sfx } from './audio.ts'
import { SprintGame } from './sprint.ts'
import { loadPersisted, savePersisted, submitScore } from './storage.ts'
import type { Difficulty, EndReason, LiveStats, Mode, Phase } from './types.ts'
import { cycleDifficulty, formatAccuracy, formatInt, formatWpm, otherMode } from './logic.ts'
import { MODE_COPY } from './config.ts'
import { startSky } from './sky.ts'
import {
  countdownHtml,
  fillHud,
  helpHtml,
  menuHtml,
  overHtml,
  paintHud,
  paintMute,
  pauseHtml,
} from './ui.ts'

type Engine = ArcadeGame | SprintGame

const sfx = new Sfx()
const prefs = loadPersisted()
sfx.muted = prefs.mute

const world = document.querySelector<HTMLDivElement>('#world')!
const overlay = document.querySelector<HTMLDivElement>('#overlay')!
const hud = document.querySelector<HTMLDivElement>('#hud')!
const home = document.querySelector<HTMLButtonElement>('#home')!
const pauseBtn = document.querySelector<HTMLButtonElement>('#pause')!
const muteBtn = document.querySelector<HTMLButtonElement>('#mute')!
const live = document.querySelector<HTMLDivElement>('#live')!
const sky = document.querySelector<HTMLCanvasElement>('#sky')!

let phase: Phase = 'menu'
let helpOpen = false
let session: Engine | null = null
let runId = 0
let countToken = 0
let countTimer = 0

fillHud(hud)
paintMute(muteBtn, prefs.mute)
startSky(sky)
showMenu()

home.addEventListener('click', () => {
  sfx.unlock()
  if (phase === 'playing') pause()
  else if (phase === 'countdown') showMenu()
  else if (phase === 'paused' || phase === 'over') showMenu()
  else if (helpOpen) closeHelp()
})

pauseBtn.addEventListener('click', () => {
  sfx.unlock()
  if (phase === 'playing') pause()
  else if (phase === 'paused') resume()
})

muteBtn.addEventListener('click', () => {
  sfx.unlock()
  toggleMute()
})

document.querySelector<HTMLElement>('#stage')!.addEventListener('click', (event) => {
  sfx.unlock()
  const target = event.target
  if (!(target instanceof Element)) return
  if (target.id === 'overlay' && helpOpen) {
    closeHelp()
    return
  }
  const act = target.closest<HTMLElement>('[data-act]')
  if (!act) return
  onAct(act.dataset.act ?? '', act)
})

window.addEventListener('keydown', onKey)
window.addEventListener('keyup', syncCaps)
document.addEventListener('pointerdown', () => sfx.unlock())
document.addEventListener('visibilitychange', () => {
  if (document.hidden && phase === 'playing') pause(true)
})

function setPhase(next: Phase): void {
  phase = next
  document.body.dataset.phase = next
  document.body.dataset.mode = prefs.mode
  document.body.dataset.diff = prefs.difficulty
  const inRun = next === 'countdown' || next === 'playing' || next === 'paused' || next === 'over'
  hud.hidden = !inRun
  pauseBtn.hidden = next !== 'playing' && next !== 'paused'
  pauseBtn.textContent = next === 'paused' ? '繼續' : '暫停'
  home.setAttribute('aria-label', next === 'playing' ? '暫停' : '回主選單')
}

function clearOverlay(): void {
  overlay.className = ''
  overlay.replaceChildren()
}

function showMenu(): void {
  runId += 1
  countToken += 1
  window.clearTimeout(countTimer)
  session?.destroy()
  session = null
  helpOpen = false
  setPhase('menu')
  clearOverlay()
  document.title = '鍵雨 — 英文打字遊戲'
  drawMenu()
}

function drawMenu(): void {
  world.innerHTML = menuHtml(prefs.mode, prefs.difficulty, prefs.scores)
}

function openHelp(): void {
  if (phase !== 'menu') return
  helpOpen = true
  overlay.className = 'show'
  overlay.innerHTML = helpHtml()
}

function closeHelp(): void {
  helpOpen = false
  clearOverlay()
}

function persist(): void {
  savePersisted(prefs)
}

function toggleMute(): void {
  prefs.mute = !prefs.mute
  sfx.muted = prefs.mute
  persist()
  paintMute(muteBtn, prefs.mute)
  if (!prefs.mute) sfx.ui()
}

function setMode(mode: Mode): void {
  if (prefs.mode === mode) return
  prefs.mode = mode
  persist()
  sfx.ui()
  drawMenu()
}

function setDifficulty(difficulty: Difficulty): void {
  if (prefs.difficulty === difficulty) return
  prefs.difficulty = difficulty
  persist()
  sfx.ui()
  drawMenu()
}

function startGame(): void {
  if (helpOpen) return
  sfx.unlock()
  const id = ++runId
  countToken += 1
  window.clearTimeout(countTimer)
  session?.destroy()
  const opts = {
    difficulty: prefs.difficulty,
    sfx,
    onStats: (stats: LiveStats) => paintHud(hud, stats, prefs.mode),
    onToast: showToast,
    onEnd: (stats: LiveStats, reason: EndReason) => {
      if (id !== runId) return
      finish(stats, reason)
    },
  }
  session = prefs.mode === 'arcade' ? new Arcade(opts) : new SprintGame(opts)
  session.mount(world)
  setPhase('countdown')
  paintHud(hud, session.stats, prefs.mode)
  document.title = `鍵雨 — ${MODE_COPY[prefs.mode].label}`
  runCountdown()
}

function runCountdown(): void {
  const token = ++countToken
  const frames = ['3', '2', '1', '開始']
  let step = 0
  const tick = () => {
    if (token !== countToken || phase !== 'countdown') return
    if (step >= frames.length) {
      beginPlay()
      return
    }
    overlay.className = 'show countdown'
    overlay.innerHTML = countdownHtml(frames[step] ?? '3')
    if (step < frames.length - 1) sfx.tick()
    step += 1
    countTimer = window.setTimeout(tick, step === frames.length ? 260 : 460)
  }
  tick()
}

function beginPlay(): void {
  if (phase !== 'countdown' || !session) return
  clearOverlay()
  setPhase('playing')
  session.start()
  sfx.go()
}

function skipCountdown(): void {
  if (phase !== 'countdown') return
  countToken += 1
  window.clearTimeout(countTimer)
  beginPlay()
}

function pause(auto = false): void {
  if (phase !== 'playing' || !session) return
  session.pause()
  setPhase('paused')
  overlay.className = 'show'
  overlay.innerHTML = pauseHtml(auto)
}

function resume(): void {
  if (phase !== 'paused' || !session) return
  clearOverlay()
  setPhase('playing')
  session.resume()
}

function finish(stats: LiveStats, reason: EndReason): void {
  if (phase === 'over') return
  setPhase('over')
  const entry = {
    score: stats.score,
    wpm: Math.round(stats.wpm),
    accuracy: Math.round(stats.accuracy),
    maxCombo: stats.maxCombo,
    mode: prefs.mode,
    difficulty: prefs.difficulty,
    at: new Date().toISOString(),
  }
  const placed = submitScore(prefs, entry)
  sfx.over()
  overlay.className = 'show over'
  overlay.innerHTML = overHtml(
    stats,
    prefs.mode,
    prefs.difficulty,
    reason,
    prefs.scores,
    placed.rank,
    placed.isBest,
    entry.at,
  )
  const place = placed.isBest ? '新紀錄。' : placed.rank ? `排行榜第 ${placed.rank} 名。` : ''
  live.textContent = `${reason === 'time' ? '時間到' : '生命用盡'}。分數 ${formatInt(stats.score)}，每分鐘字數 ${formatWpm(stats.wpm)}，準確率 ${formatAccuracy(stats.accuracy)}。${place}`
}

function showToast(text: string): void {
  document.querySelector('.toast')?.remove()
  const node = document.createElement('div')
  node.className = 'toast'
  node.textContent = text
  document.body.append(node)
  node.addEventListener('animationend', () => node.remove())
}

function onAct(act: string, el: HTMLElement): void {
  if (act === 'mode' && phase === 'menu' && !helpOpen) {
    const mode = el.dataset.mode
    if (mode === 'arcade' || mode === 'sprint') setMode(mode)
    return
  }
  if (act === 'diff' && phase === 'menu' && !helpOpen) {
    const difficulty = el.dataset.diff
    if (difficulty === 'easy' || difficulty === 'medium' || difficulty === 'hard') setDifficulty(difficulty)
    return
  }
  if (act === 'start' && phase === 'menu' && !helpOpen) {
    startGame()
    return
  }
  if (act === 'help' && phase === 'menu') {
    openHelp()
    return
  }
  if (act === 'close' && helpOpen) {
    closeHelp()
    return
  }
  if (act === 'resume' && phase === 'paused') {
    resume()
    return
  }
  if (act === 'retry' && (phase === 'paused' || phase === 'over')) {
    startGame()
    return
  }
  if (act === 'menu' && (phase === 'paused' || phase === 'over')) {
    showMenu()
  }
}

function onKey(event: KeyboardEvent): void {
  if (event.repeat || event.isComposing || event.key === 'Process') return
  if (event.metaKey || event.ctrlKey || event.altKey) return
  sfx.unlock()
  syncCaps(event)

  if (event.key === 'F2') {
    event.preventDefault()
    toggleMute()
    return
  }

  if (phase === 'playing') {
    if (event.key === 'Escape') {
      event.preventDefault()
      pause()
      return
    }
    if (
      event.key === 'Backspace' ||
      event.key === 'Tab' ||
      event.key === ' ' ||
      event.key.startsWith('Arrow') ||
      event.key.length === 1
    ) {
      event.preventDefault()
    }
    session?.key(event.key)
    return
  }

  if (phase === 'paused') {
    event.preventDefault()
    if (event.key === 'Escape' || event.key === 'Enter') resume()
    else if (event.key === 'r' || event.key === 'R') startGame()
    else if (event.key === 'q' || event.key === 'Q') showMenu()
    else if (event.key === 'm' || event.key === 'M') toggleMute()
    return
  }

  if (phase === 'countdown') {
    event.preventDefault()
    if (event.key === 'Escape') showMenu()
    else if (event.key === 'Enter' || event.key === ' ') skipCountdown()
    return
  }

  if (phase === 'over') {
    if (event.key === 'Enter' || event.key === ' ') event.preventDefault()
    if (event.key === 'Enter') startGame()
    else if (event.key === 'Escape' || event.key === 'q' || event.key === 'Q') showMenu()
    else if (event.key === 'm' || event.key === 'M') toggleMute()
    return
  }

  if (helpOpen) {
    if (event.key === 'Escape' || event.key === 'Enter' || event.key === 'h' || event.key === 'H') closeHelp()
    return
  }

  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    event.preventDefault()
    setMode(otherMode(prefs.mode))
    return
  }
  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    setDifficulty(cycleDifficulty(prefs.difficulty, -1))
    return
  }
  if (event.key === 'ArrowRight') {
    event.preventDefault()
    setDifficulty(cycleDifficulty(prefs.difficulty, 1))
    return
  }
  if (event.key === '1') setDifficulty('easy')
  else if (event.key === '2') setDifficulty('medium')
  else if (event.key === '3') setDifficulty('hard')
  else if (event.key === 'Enter') {
    event.preventDefault()
    startGame()
  } else if (event.key === 'h' || event.key === 'H' || event.key === '?') openHelp()
  else if (event.key === 'm' || event.key === 'M') toggleMute()
  else if (event.key === ' ') event.preventDefault()
}

function syncCaps(event: KeyboardEvent): void {
  document.body.dataset.caps = event.getModifierState?.('CapsLock') ? 'on' : 'off'
}
