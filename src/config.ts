import type { Difficulty, Mode, Script } from './types.ts'

export interface DifficultyConfig {
  id: Difficulty
  label: string
  hint: string
  fallSeconds: number
  spawnMs: number
  lives: number
  ramp: number
  maxWords: number
  pointScale: number
  sprintScale: number
  hintZh: string
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: {
    id: 'easy',
    label: '簡單',
    hint: '常見短字，落得慢，五條命。適合先暖手。',
    fallSeconds: 16,
    spawnMs: 3800,
    lives: 5,
    ramp: 0.25,
    maxWords: 3,
    pointScale: 10,
    sprintScale: 8,
    hintZh: '兩個字的詞，落得慢，五條命。適合先暖手。',
  },
  medium: {
    id: 'medium',
    label: '普通',
    hint: '稍長的單字，四條命，速度會穩定加快。',
    fallSeconds: 10.5,
    spawnMs: 2300,
    lives: 4,
    ramp: 0.42,
    maxWords: 5,
    pointScale: 14,
    sprintScale: 12,
    hintZh: '三到四個字，四條命，速度會穩定加快。',
  },
  hard: {
    id: 'hard',
    label: '困難',
    hint: '長字，或要連大小寫與標點一起打的句子。街機只剩三條命。',
    fallSeconds: 7.2,
    spawnMs: 1650,
    lives: 3,
    ramp: 0.58,
    maxWords: 5,
    pointScale: 18,
    sprintScale: 16,
    hintZh: '較長的詞，或要連標點一起打的句子。街機只剩三條命。',
  },
}

export const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard']

const MODE_ZH: Record<Mode, { label: string; kicker: string; blurb: string; mark: string }> = {
  arcade: {
    label: '字雨',
    kicker: '街機',
    blurb: '詞語不斷落下。用輸入法打完就消去，碰到紅線就失去一條命，而且會愈落愈快。',
    mark: '落下',
  },
  sprint: {
    label: '競速',
    kicker: '六十秒',
    blurb: '限時六十秒。用輸入法照順序把中文打完，選字送出後才算數。比的是字數、準確率和連擊。',
    mark: '限時',
  },
}

export function modeCopy(script: Script, mode: Mode): { label: string; kicker: string; blurb: string; mark: string } {
  return script === 'zh' ? MODE_ZH[mode] : MODE_COPY[mode]
}

export function difficultyHint(script: Script, difficulty: Difficulty): string {
  const item = DIFFICULTIES[difficulty]
  return script === 'zh' ? item.hintZh : item.hint
}

export const MODE_COPY: Record<Mode, { label: string; kicker: string; blurb: string; mark: string }> = {
  arcade: {
    label: '字雨',
    kicker: '街機',
    blurb: '單字不斷落下。打完就消去，碰到紅線就失去一條命，而且會愈落愈快。',
    mark: '落下',
  },
  sprint: {
    label: '競速',
    kicker: '六十秒',
    blurb: '限時六十秒。照順序把英文打完，比的是速度、準確率，還有沒斷掉的連擊。',
    mark: '限時',
  },
}

export const SPRINT_MS = 60_000
export const SCORE_LIMIT = 6
export const SAVE_KEY = 'keyfall-v2'
export const LEGACY_SAVE_KEY = 'keyfall-v1'
