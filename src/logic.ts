import { DIFFICULTY_ORDER, SCORE_LIMIT } from './config.ts'
import type { Difficulty, LiveStats, Mode, Rankable, ScoreEntry, Script } from './types.ts'

export function accuracyOf(correct: number, errors: number): number {
  const total = correct + errors
  if (total <= 0) return 100
  return (correct / total) * 100
}

export function wpmOf(correctChars: number, elapsedMs: number): number {
  if (elapsedMs < 1000 || correctChars <= 0) return 0
  const minutes = elapsedMs / 60_000
  return correctChars / 5 / minutes
}

/** Characters per minute. Used for Chinese; English keeps words-per-minute. */
export function cpmOf(correctChars: number, elapsedMs: number): number {
  if (elapsedMs < 1000 || correctChars <= 0) return 0
  return correctChars / (elapsedMs / 60_000)
}

export function speedOf(correctChars: number, elapsedMs: number, script: Script): number {
  return script === 'zh' ? cpmOf(correctChars, elapsedMs) : wpmOf(correctChars, elapsedMs)
}

export function rampOf(elapsedMs: number, factor: number): number {
  const t = Math.min(Math.max(elapsedMs, 0) / 40_000, 2)
  return 1 + t * factor
}

export function arcadePoints(length: number, comboAfter: number, scale: number, closeCall: boolean): number {
  const comboMult = 1 + Math.min(Math.max(comboAfter - 1, 0), 24) * 0.1
  const close = closeCall ? 1.5 : 1
  return Math.max(1, Math.round(length * scale * comboMult * close))
}

export function freshStats(lives: number, remainingMs: number): LiveStats {
  return {
    score: 0,
    wpm: 0,
    accuracy: 100,
    combo: 0,
    maxCombo: 0,
    correct: 0,
    errors: 0,
    lives,
    maxLives: lives,
    elapsedMs: 0,
    remainingMs,
    wordsCleared: 0,
  }
}

export function derive(stats: LiveStats, script: Script = 'en'): void {
  stats.accuracy = accuracyOf(stats.correct, stats.errors)
  stats.wpm = speedOf(stats.correct, stats.elapsedMs, script)
  stats.maxCombo = Math.max(stats.maxCombo, stats.combo)
}

export interface TargetCandidate {
  id: number
  text: string
  typed: number
  y: number
}

export function chunkFits(rest: string, chunk: string): boolean {
  return chunk.length > 0 && rest.startsWith(chunk)
}

/** Lock the lowest not-yet-typed word whose text starts with the committed chunk. */
export function pickChunk(words: readonly TargetCandidate[], chunk: string): number | null {
  if (!chunk) return null
  let best: TargetCandidate | null = null
  for (const word of words) {
    if (word.typed !== 0) continue
    if (!word.text.startsWith(chunk)) continue
    if (!best || word.y > best.y || (word.y === best.y && word.id < best.id)) best = word
  }
  return best?.id ?? null
}

export function pickTarget(words: readonly TargetCandidate[], key: string): number | null {
  const k = key.toLowerCase()
  let best: TargetCandidate | null = null
  for (const word of words) {
    if (word.typed !== 0) continue
    if (word.text[0]?.toLowerCase() !== k) continue
    if (!best || word.y > best.y || (word.y === best.y && word.id < best.id)) best = word
  }
  return best?.id ?? null
}

export function chooseLanes(width: number, difficulty: Difficulty): number {
  if (width < 560) return 2
  if (difficulty === 'easy') return width < 800 ? 2 : 3
  if (difficulty === 'hard') return width < 900 ? 3 : 4
  if (width < 820) return 3
  return 4
}

/**
 * Lane for a sponsored word: the left or right edge, whichever has room.
 * Returns null when both edges are crowded so the caller can use any open lane.
 */
export function outerLane(
  lanes: number,
  room: readonly number[],
  minRoom: number,
  rng: () => number,
): number | null {
  if (lanes <= 0) return null
  const edges = lanes === 1 ? [0] : [0, lanes - 1]
  const open = edges.filter((lane) => (room[lane] ?? 0) > minRoom)
  if (open.length === 0) return null
  if (open.length === 1) return open[0]!
  const left = open[0]!
  const right = open[1]!
  const leftRoom = room[left] ?? 0
  const rightRoom = room[right] ?? 0
  const bothClear = !Number.isFinite(leftRoom) && !Number.isFinite(rightRoom)
  if (bothClear || Math.abs(leftRoom - rightRoom) < 48) return rng() < 0.5 ? left : right
  return leftRoom > rightRoom ? left : right
}

export function compareRank(a: Rankable, b: Rankable): number {
  if (a.score !== b.score) return b.score - a.score
  if (a.wpm !== b.wpm) return b.wpm - a.wpm
  return b.accuracy - a.accuracy
}

export function isBetter(a: Rankable, b: Rankable): boolean {
  if (a.score !== b.score) return a.score > b.score
  if (a.wpm !== b.wpm) return a.wpm > b.wpm
  return a.accuracy > b.accuracy
}

export function scriptOf(entry: ScoreEntry): Script {
  return entry.script === 'zh' ? 'zh' : 'en'
}

function sameBucket(a: ScoreEntry, b: ScoreEntry): boolean {
  return a.mode === b.mode && a.difficulty === b.difficulty && scriptOf(a) === scriptOf(b)
}

export function insertScore(
  all: readonly ScoreEntry[],
  entry: ScoreEntry,
  limit = SCORE_LIMIT,
): { scores: ScoreEntry[]; rank: number | null; isBest: boolean } {
  const same = all.filter((item) => sameBucket(item, entry))
  const rest = all.filter((item) => !sameBucket(item, entry))
  const prevBest = same.slice().sort(compareRank)[0]
  const better = !prevBest || isBetter(entry, prevBest)
  const merged = same.concat(entry).sort(compareRank).slice(0, limit)
  const rankIndex = merged.indexOf(entry)
  return {
    scores: rest.concat(merged),
    rank: rankIndex === -1 ? null : rankIndex + 1,
    isBest: better && rankIndex === 0,
  }
}

export function cycleDifficulty(current: Difficulty, direction: 1 | -1): Difficulty {
  const index = DIFFICULTY_ORDER.indexOf(current)
  const next = (index + direction + DIFFICULTY_ORDER.length) % DIFFICULTY_ORDER.length
  return DIFFICULTY_ORDER[next] ?? current
}

export function otherMode(mode: Mode): Mode {
  return mode === 'arcade' ? 'sprint' : 'arcade'
}

export function formatInt(value: number): string {
  return Math.round(value).toLocaleString('zh-TW')
}

export function formatWpm(value: number): string {
  return Math.round(value).toString()
}

export function formatAccuracy(value: number): string {
  if (value >= 100) return '100%'
  return `${Math.floor(value)}%`
}

export function formatSeconds(ms: number): string {
  return (Math.max(0, ms) / 1000).toFixed(1)
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function formatWhen(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })
}

export function matchesChar(expected: string, typed: string, sensitive: boolean): boolean {
  if (sensitive) return expected === typed
  return expected.toLowerCase() === typed.toLowerCase()
}

export function esc(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return map[ch] ?? ch
  })
}
