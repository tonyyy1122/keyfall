import { LEGACY_SAVE_KEY, SAVE_KEY } from './config.ts'
import { insertScore } from './logic.ts'
import type { Difficulty, Mode, ScoreEntry, Script } from './types.ts'

export interface Persisted {
  scores: ScoreEntry[]
  mute: boolean
  mode: Mode
  difficulty: Difficulty
  script: Script
}

const DEFAULTS: Persisted = {
  scores: [],
  mute: false,
  mode: 'arcade',
  difficulty: 'medium',
  script: 'zh',
}

function isMode(value: unknown): value is Mode {
  return value === 'arcade' || value === 'sprint'
}

function isDifficulty(value: unknown): value is Difficulty {
  return value === 'easy' || value === 'medium' || value === 'hard'
}

function isScript(value: unknown): value is Script {
  return value === 'zh' || value === 'en'
}

function isEntry(value: unknown): value is ScoreEntry {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return (
    isMode(item.mode) &&
    isDifficulty(item.difficulty) &&
    typeof item.score === 'number' &&
    Number.isFinite(item.score) &&
    typeof item.wpm === 'number' &&
    Number.isFinite(item.wpm) &&
    typeof item.accuracy === 'number' &&
    Number.isFinite(item.accuracy) &&
    typeof item.maxCombo === 'number' &&
    Number.isFinite(item.maxCombo) &&
    typeof item.at === 'string' &&
    (item.script === undefined || isScript(item.script))
  )
}

function read(key: string): Persisted | null {
  const raw = localStorage.getItem(key)
  if (!raw) return null
  const parsed = JSON.parse(raw) as Record<string, unknown>
  const scores = Array.isArray(parsed.scores) ? parsed.scores.filter(isEntry).slice(0, 48) : []
  return {
    scores,
    mute: parsed.mute === true,
    mode: isMode(parsed.mode) ? parsed.mode : DEFAULTS.mode,
    difficulty: isDifficulty(parsed.difficulty) ? parsed.difficulty : DEFAULTS.difficulty,
    script: isScript(parsed.script) ? parsed.script : DEFAULTS.script,
  }
}

export function loadPersisted(): Persisted {
  try {
    const current = read(SAVE_KEY)
    if (current) return current
    const legacy = read(LEGACY_SAVE_KEY)
    if (!legacy) return { ...DEFAULTS, scores: [] }
    return {
      ...legacy,
      script: 'zh',
      scores: legacy.scores.map((entry) => ({ ...entry, script: entry.script ?? 'en' })),
    }
  } catch {
    return { ...DEFAULTS, scores: [] }
  }
}

export function savePersisted(data: Persisted): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data))
  } catch {
    // Private mode and full storage can reject writes. The run still plays.
  }
}

export function submitScore(data: Persisted, entry: ScoreEntry): { rank: number | null; isBest: boolean } {
  const placed = insertScore(data.scores, entry)
  data.scores = placed.scores
  savePersisted(data)
  return { rank: placed.rank, isBest: placed.isBest }
}
