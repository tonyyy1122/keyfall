import type { Sfx } from './audio.ts'
import { DIFFICULTIES } from './config.ts'
import { arcadePoints, chooseLanes, derive, freshStats, pickTarget, rampOf } from './logic.ts'
import type { Difficulty, EndReason, LiveStats } from './types.ts'
import { pickWord, wordsFor } from './words.ts'

export interface EngineOpts {
  difficulty: Difficulty
  sfx: Sfx
  onStats: (stats: LiveStats) => void
  onToast: (text: string) => void
  onEnd: (stats: LiveStats, reason: EndReason) => void
}

interface FallWord {
  id: number
  text: string
  lane: number
  x: number
  y: number
  typed: number
  width: number
  height: number
  el: HTMLDivElement
  glyphs: HTMLSpanElement
}

export class ArcadeGame {
  readonly stats: LiveStats
  private readonly cfg: (typeof DIFFICULTIES)[Difficulty]
  private readonly bank: readonly string[]
  private field!: HTMLDivElement
  private rampEl!: HTMLDivElement
  private words: FallWord[] = []
  private nextId = 1
  private activeId: number | null = null
  private raf = 0
  private last = 0
  private spawnAcc = 0
  private running = false
  private ended = false
  private dead = false
  private lanes = 4
  private lanesReady = false
  private fieldWidth = 0
  private fieldHeight = 0
  private baseSpeed = 40
  private rampShown = ''
  private observer: ResizeObserver | null = null
  private readonly onFrame: (now: number) => void
  private readonly opts: EngineOpts

  constructor(opts: EngineOpts) {
    this.opts = opts
    this.cfg = DIFFICULTIES[opts.difficulty]
    this.bank = wordsFor(opts.difficulty)
    this.stats = freshStats(this.cfg.lives, 0)
    this.onFrame = (now) => this.frame(now)
  }

  mount(world: HTMLElement): void {
    world.replaceChildren()
    const field = document.createElement('div')
    field.className = 'field'
    field.translate = false
    field.innerHTML = `
      <div class="wash" aria-hidden="true"></div>
      <p class="field-hint">單字即將落下</p>
      <div class="ramp" aria-hidden="true">落速 ×1.0</div>
      <div class="ground" aria-hidden="true"></div>
    `
    world.append(field)
    this.field = field
    this.rampEl = field.querySelector('.ramp') as HTMLDivElement
    this.observer = new ResizeObserver(() => this.layout())
    this.observer.observe(field)
    this.layout()
  }

  start(): void {
    if (this.running || this.ended || this.dead) return
    this.layout()
    this.ensureLanes()
    this.field.style.setProperty('--word-size', this.opts.difficulty === 'easy' ? '32px' : this.opts.difficulty === 'hard' ? '22px' : '26px')
    this.trySpawn()
    if (this.opts.difficulty === 'hard') this.trySpawn()
    this.running = true
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.onFrame)
  }

  pause(): void {
    this.running = false
    cancelAnimationFrame(this.raf)
  }

  resume(): void {
    if (this.ended || this.dead) return
    this.running = true
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.onFrame)
  }

  destroy(): void {
    this.dead = true
    this.pause()
    this.observer?.disconnect()
    this.field?.remove()
  }

  key(key: string): void {
    if (!this.running || this.ended) return
    if (!/^[a-zA-Z]$/.test(key)) return
    const ch = key.toLowerCase()

    if (this.activeId == null) {
      const id = pickTarget(
        this.words.map((word) => ({ id: word.id, text: word.text, typed: word.typed, y: word.y })),
        ch,
      )
      if (id == null) {
        this.missKey()
        return
      }
      this.activeId = id
    }

    const word = this.words.find((item) => item.id === this.activeId)
    if (!word) {
      this.activeId = null
      return
    }
    if (word.text[word.typed]?.toLowerCase() !== ch) {
      this.missKey(word)
      return
    }

    word.typed += 1
    this.stats.correct += 1
    this.paintWord(word)
    this.opts.sfx.tick()
    if (word.typed >= word.text.length) this.clearWord(word)
    else this.pushStats()
  }

  private pushStats(): void {
    derive(this.stats)
    this.opts.onStats(this.stats)
  }

  private missKey(word?: FallWord): void {
    this.stats.errors += 1
    this.stats.combo = 0
    this.opts.sfx.error()
    if (word) {
      word.el.classList.remove('shake')
      void word.el.offsetWidth
      word.el.classList.add('shake')
    } else {
      this.flashField()
    }
    this.pushStats()
  }

  private flashField(): void {
    this.field.classList.remove('hurt')
    void this.field.offsetWidth
    this.field.classList.add('hurt')
  }

  private clearWord(word: FallWord): void {
    this.stats.combo += 1
    this.stats.wordsCleared += 1
    const ratio = this.fieldHeight > 0 ? (word.y + word.height) / this.fieldHeight : 0
    const close = ratio > 0.68
    const points = arcadePoints(word.text.length, this.stats.combo, this.cfg.pointScale, close)
    this.stats.score += points
    this.opts.sfx.word(this.stats.combo)
    if (this.stats.combo % 5 === 0) {
      this.opts.sfx.combo()
      this.opts.onToast(`${this.stats.combo} 連擊`)
    }
    this.floater(word, points, close)
    word.el.classList.add('gone')
    word.el.classList.remove('active', 'shake')
    const el = word.el
    window.setTimeout(() => el.remove(), 280)
    this.words = this.words.filter((item) => item.id !== word.id)
    this.activeId = null
    this.pushStats()
  }

  private floater(word: FallWord, points: number, close: boolean): void {
    const node = document.createElement('div')
    node.className = 'floater'
    node.style.left = `${word.x}px`
    node.style.top = `${Math.max(8, word.y)}px`
    const score = document.createElement('b')
    score.textContent = `+${points}`
    node.append(score)
    if (close) {
      const tag = document.createElement('i')
      tag.textContent = '驚險'
      node.append(tag)
    }
    this.field.append(node)
    node.addEventListener('animationend', () => node.remove())
  }

  private lose(word: FallWord): void {
    if (this.activeId === word.id) this.activeId = null
    word.el.classList.add('crash')
    const el = word.el
    window.setTimeout(() => el.remove(), 240)
    this.words = this.words.filter((item) => item.id !== word.id)
    this.stats.lives -= 1
    this.stats.combo = 0
    this.opts.sfx.life()
    this.flashField()
    this.pushStats()
    if (this.stats.lives <= 0) this.end('lives')
  }

  private end(reason: EndReason): void {
    if (this.dead || this.ended) return
    this.ended = true
    this.pause()
    derive(this.stats)
    this.opts.onEnd(this.stats, reason)
  }

  private frame(now: number): void {
    if (!this.running) return
    const dt = Math.min(0.05, (now - this.last) / 1000)
    this.last = now
    this.stats.elapsedMs += dt * 1000
    const ramp = rampOf(this.stats.elapsedMs, this.cfg.ramp)
    this.paintRamp(ramp)

    const fallen: FallWord[] = []
    const speed = this.baseSpeed * ramp
    for (const word of this.words) {
      word.y += speed * dt
      if (word.y + word.height >= this.fieldHeight - 2) {
        fallen.push(word)
        continue
      }
      const ratio = this.fieldHeight > 0 ? (word.y + word.height) / this.fieldHeight : 0
      word.el.classList.toggle('low', ratio > 0.68)
      word.el.classList.toggle('peril', ratio > 0.86)
      word.el.style.transform = `translate3d(${word.x}px, ${word.y}px, 0)`
    }
    for (const word of fallen) {
      this.lose(word)
      if (this.ended) return
    }

    this.spawnAcc += dt * 1000
    const interval = this.cfg.spawnMs / ramp
    if (this.spawnAcc >= interval && this.words.length < this.cfg.maxWords) {
      if (this.trySpawn()) this.spawnAcc = 0
    }

    if (Math.floor(now / 120) !== Math.floor((now - dt * 1000) / 120)) this.pushStats()
    this.raf = requestAnimationFrame(this.onFrame)
  }

  private paintRamp(ramp: number): void {
    const shown = ramp.toFixed(1)
    if (shown === this.rampShown) return
    this.rampShown = shown
    this.rampEl.textContent = `落速 ×${shown}`
  }

  private layout(): void {
    if (!this.field) return
    this.fieldWidth = this.field.clientWidth
    this.fieldHeight = this.field.clientHeight
    if (this.fieldHeight > 40) this.baseSpeed = (this.fieldHeight - 28) / this.cfg.fallSeconds
    this.ensureLanes()
    for (const word of this.words) {
      word.x = this.laneX(word.lane, word.width)
      word.el.style.transform = `translate3d(${word.x}px, ${word.y}px, 0)`
    }
  }

  private ensureLanes(): void {
    if (this.lanesReady || this.fieldWidth < 40) return
    this.lanes = chooseLanes(this.fieldWidth, this.opts.difficulty)
    this.lanesReady = true
  }

  private laneX(lane: number, width: number): number {
    const slot = this.fieldWidth / this.lanes
    const raw = lane * slot + (slot - width) / 2
    return Math.max(8, Math.min(raw, Math.max(8, this.fieldWidth - width - 8)))
  }

  private trySpawn(): boolean {
    this.ensureLanes()
    if (!this.lanesReady || this.fieldHeight < 80 || !this.hasRoom()) return false
    const avoid = new Set(this.words.map((word) => word.text))
    const text = pickWord(this.bank, Math.random, avoid)
    const el = document.createElement('div')
    el.className = 'fallword'
    el.lang = 'en'
    el.translate = false
    const glyphs = document.createElement('span')
    glyphs.className = 'glyphs'
    el.append(glyphs)
    this.field.append(el)
    const word: FallWord = {
      id: this.nextId++,
      text,
      lane: 0,
      x: 0,
      y: 0,
      typed: 0,
      width: 0,
      height: 0,
      el,
      glyphs,
    }
    this.paintWord(word)
    word.width = el.offsetWidth
    word.height = el.offsetHeight
    const lane = this.pickLane()
    if (lane == null) {
      el.remove()
      return false
    }
    word.lane = lane
    word.x = this.laneX(lane, word.width)
    word.y = -word.height - 6
    el.style.transform = `translate3d(${word.x}px, ${word.y}px, 0)`
    this.words.push(word)
    this.field.querySelector('.field-hint')?.remove()
    return true
  }

  private hasRoom(): boolean {
    for (let lane = 0; lane < this.lanes; lane++) {
      let top = Number.POSITIVE_INFINITY
      for (const word of this.words) {
        if (word.lane === lane) top = Math.min(top, word.y)
      }
      if (top > 78) return true
    }
    return false
  }

  private pickLane(): number | null {
    let best = -1
    let bestRoom = 78
    for (let lane = 0; lane < this.lanes; lane++) {
      let top = Number.POSITIVE_INFINITY
      for (const word of this.words) {
        if (word.lane === lane) top = Math.min(top, word.y)
      }
      if (top > bestRoom) {
        bestRoom = top
        best = lane
      }
    }
    return best < 0 ? null : best
  }

  private paintWord(word: FallWord): void {
    word.glyphs.replaceChildren()
    const typed = document.createElement('span')
    typed.className = 'typed'
    typed.textContent = word.text.slice(0, word.typed)
    const next = document.createElement('span')
    next.className = 'next'
    next.textContent = word.text[word.typed] ?? ''
    const rest = document.createElement('span')
    rest.className = 'rest'
    rest.textContent = word.text.slice(word.typed + 1)
    word.glyphs.append(typed, next, rest)
    word.el.classList.toggle('active', word.id === this.activeId)
  }
}
