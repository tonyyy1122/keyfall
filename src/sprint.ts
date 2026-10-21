import { DIFFICULTIES, SPRINT_MS } from './config.ts'
import { derive, freshStats, matchesChar } from './logic.ts'
import type { LiveStats } from './types.ts'
import { buildPassage } from './words.ts'
import type { EngineOpts } from './arcade.ts'

interface Glyph {
  ch: string
  el: HTMLSpanElement
}

export class SprintGame {
  readonly stats: LiveStats
  private readonly scale: number
  private readonly sensitive: boolean
  private desk!: HTMLDivElement
  private paper!: HTMLDivElement
  private passage!: HTMLDivElement
  private meter!: HTMLSpanElement
  private text = ''
  private glyphs: Glyph[] = []
  private index = 0
  private wordDirty = false
  private activeWord: HTMLElement | null = null
  private raf = 0
  private last = 0
  private running = false
  private ended = false
  private dead = false
  private readonly onFrame: (now: number) => void
  private readonly opts: EngineOpts

  constructor(opts: EngineOpts) {
    this.opts = opts
    const cfg = DIFFICULTIES[opts.difficulty]
    this.scale = cfg.sprintScale
    this.sensitive = opts.difficulty === 'hard'
    this.stats = freshStats(0, SPRINT_MS)
    this.onFrame = (now) => this.frame(now)
  }

  mount(world: HTMLElement): void {
    world.replaceChildren()
    const desk = document.createElement('div')
    desk.className = 'desk waiting'
    desk.innerHTML = `
      <div class="meter" aria-hidden="true"><span></span></div>
      <div class="paper">
        <p class="caps">大寫鎖定開著。這個難度要分大小寫。</p>
        <p class="passage" lang="en" translate="no"></p>
        <p class="field-hint">照順序打，空白也要打。</p>
      </div>
    `
    world.append(desk)
    this.desk = desk
    this.paper = desk.querySelector('.paper') as HTMLDivElement
    this.passage = desk.querySelector('.passage') as HTMLDivElement
    this.meter = desk.querySelector('.meter span') as HTMLSpanElement
    this.append(buildPassage(this.opts.difficulty, Math.random, 1000))
    this.paintCaret(-1)
    this.paintMeter()
  }

  start(): void {
    if (this.running || this.ended || this.dead) return
    this.desk.classList.remove('waiting')
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
    this.desk?.remove()
  }

  key(key: string): void {
    if (!this.running || this.ended) return
    if (key.length !== 1) return
    if (this.index >= this.text.length) return
    const expected = this.text[this.index] ?? ''
    if (matchesChar(expected, key, this.sensitive)) this.commit()
    else this.miss()
  }

  private commit(): void {
    const ch = this.text[this.index] ?? ''
    const finishing = ch !== ' ' && (this.text[this.index + 1] === ' ' || this.index + 1 >= this.text.length)
    const glyph = this.glyphs[this.index]
    glyph?.el.classList.add('done')
    glyph?.el.classList.remove('caret', 'bad')
    const prev = this.index
    this.index += 1
    this.stats.correct += 1
    this.stats.score += this.scale

    if (ch === ' ') this.wordDirty = false

    if (finishing) {
      this.stats.wordsCleared += 1
      if (!this.wordDirty) {
        this.stats.combo += 1
        this.stats.score += 8 * this.stats.combo
        if (this.stats.combo % 5 === 0) {
          this.opts.sfx.combo()
          this.opts.onToast(`${this.stats.combo} 連擊`)
        } else {
          this.opts.sfx.word(this.stats.combo)
        }
      } else {
        this.stats.combo = 0
        this.wordDirty = false
        this.opts.sfx.word(0)
      }
    } else if (ch !== ' ') {
      this.opts.sfx.tick()
    }

    if (this.text.length - this.index < 180) {
      this.append(buildPassage(this.opts.difficulty, Math.random, 500))
    }
    this.paintCaret(prev)
    this.pushStats()
  }

  private miss(): void {
    this.stats.errors += 1
    this.stats.combo = 0
    if ((this.text[this.index] ?? '') !== ' ') this.wordDirty = true
    this.opts.sfx.error()
    const el = this.glyphs[this.index]?.el
    el?.classList.add('bad')
    this.paper.classList.remove('shake')
    void this.paper.offsetWidth
    this.paper.classList.add('shake')
    this.pushStats()
  }

  private pushStats(): void {
    derive(this.stats)
    this.opts.onStats(this.stats)
  }

  private frame(now: number): void {
    if (!this.running) return
    const dt = Math.min(0.05, (now - this.last) / 1000)
    this.last = now
    this.stats.elapsedMs += dt * 1000
    this.stats.remainingMs = Math.max(0, SPRINT_MS - this.stats.elapsedMs)
    this.paintMeter()
    if (this.stats.remainingMs <= 0) {
      this.stats.remainingMs = 0
      this.stats.elapsedMs = SPRINT_MS
      derive(this.stats)
      this.end()
      return
    }
    if (Math.floor(now / 100) !== Math.floor((now - dt * 1000) / 100)) this.pushStats()
    this.raf = requestAnimationFrame(this.onFrame)
  }

  private paintMeter(): void {
    const ratio = Math.max(0, Math.min(1, this.stats.remainingMs / SPRINT_MS))
    this.meter.style.transform = `scaleX(${ratio})`
  }

  private end(): void {
    if (this.dead || this.ended) return
    this.ended = true
    this.pause()
    this.opts.onEnd(this.stats, 'time')
  }

  private append(chunk: string): void {
    let extra = chunk.trim()
    if (!extra) return
    if (this.text.length > 0 && !this.text.endsWith(' ') && !extra.startsWith(' ')) extra = ` ${extra}`
    const start = this.text.length
    this.text += extra
    let i = start
    while (i < this.text.length) {
      const ch = this.text[i] ?? ''
      if (ch === ' ') {
        const space = document.createElement('span')
        space.className = 'sp'
        space.textContent = ' '
        this.glyphs.push({ ch, el: space })
        this.passage.append(space)
        i += 1
        continue
      }
      const word = document.createElement('span')
      word.className = 'w'
      while (i < this.text.length && this.text[i] !== ' ') {
        const letter = this.text[i] ?? ''
        const span = document.createElement('span')
        span.textContent = letter
        word.append(span)
        this.glyphs.push({ ch: letter, el: span })
        i += 1
      }
      this.passage.append(word)
    }
  }

  private paintCaret(prev: number): void {
    if (prev >= 0) this.glyphs[prev]?.el.classList.remove('caret')
    const glyph = this.glyphs[this.index]
    if (!glyph) return
    glyph.el.classList.add('caret')
    const word = glyph.ch === ' ' ? glyph.el.nextElementSibling : glyph.el.parentElement
    if (this.activeWord && this.activeWord !== word) this.activeWord.classList.remove('active')
    if (word instanceof HTMLElement && word.classList.contains('w')) {
      word.classList.add('active')
      this.activeWord = word
    }
    const box = this.passage.getBoundingClientRect()
    const rect = glyph.el.getBoundingClientRect()
    if (rect.top < box.top + 28 || rect.bottom > box.bottom - 36) {
      this.passage.scrollTop += rect.top - box.top - this.passage.clientHeight * 0.35
    }
  }
}

export type { EngineOpts }
