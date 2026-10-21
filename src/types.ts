export type Mode = 'arcade' | 'sprint'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type Phase = 'menu' | 'countdown' | 'playing' | 'paused' | 'over'
export type EndReason = 'lives' | 'time'

export interface LiveStats {
  score: number
  wpm: number
  accuracy: number
  combo: number
  maxCombo: number
  correct: number
  errors: number
  lives: number
  maxLives: number
  elapsedMs: number
  remainingMs: number
  wordsCleared: number
}

export interface ScoreEntry {
  score: number
  wpm: number
  accuracy: number
  maxCombo: number
  mode: Mode
  difficulty: Difficulty
  at: string
}

export interface Rankable {
  score: number
  wpm: number
  accuracy: number
}
