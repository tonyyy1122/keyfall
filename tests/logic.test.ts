import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  accuracyOf,
  arcadePoints,
  chooseLanes,
  cycleDifficulty,
  formatAccuracy,
  insertScore,
  matchesChar,
  pickTarget,
  rampOf,
  wpmOf,
} from '../src/logic.ts'
import { auditLexicon, buildPassage, wordsFor } from '../src/words.ts'
import type { ScoreEntry } from '../src/types.ts'

test('accuracy treats an empty run as perfect', () => {
  assert.equal(accuracyOf(0, 0), 100)
  assert.equal(accuracyOf(8, 2), 80)
})

test('wpm waits for a second of real typing', () => {
  assert.equal(wpmOf(25, 500), 0)
  assert.equal(wpmOf(50, 60_000), 10)
})

test('ramp starts at 1 and caps after 80 seconds', () => {
  assert.equal(rampOf(0, 0.5), 1)
  assert.equal(rampOf(40_000, 0.5), 1.5)
  assert.equal(rampOf(200_000, 0.5), 2)
})

test('arcade points reward combo and close calls', () => {
  assert.equal(arcadePoints(4, 1, 10, false), 40)
  assert.equal(arcadePoints(4, 2, 10, false), 44)
  assert.equal(arcadePoints(4, 1, 10, true), 60)
})

test('pickTarget locks the lower matching word', () => {
  const words = [
    { id: 1, text: 'cat', typed: 0, y: 10 },
    { id: 2, text: 'cup', typed: 0, y: 80 },
    { id: 3, text: 'dog', typed: 0, y: 200 },
    { id: 4, text: 'cap', typed: 2, y: 300 },
  ]
  assert.equal(pickTarget(words, 'c'), 2)
  assert.equal(pickTarget(words, 'C'), 2)
  assert.equal(pickTarget(words, 'z'), null)
})

test('lane count follows width and difficulty', () => {
  assert.equal(chooseLanes(400, 'easy'), 2)
  assert.equal(chooseLanes(1000, 'easy'), 3)
  assert.equal(chooseLanes(1000, 'hard'), 4)
})

test('difficulty cycles and high scores stay in their bucket', () => {
  assert.equal(cycleDifficulty('easy', -1), 'hard')
  assert.equal(cycleDifficulty('hard', 1), 'easy')
  const older: ScoreEntry = {
    score: 100,
    wpm: 40,
    accuracy: 90,
    maxCombo: 3,
    mode: 'arcade',
    difficulty: 'easy',
    at: '2026-01-01T00:00:00.000Z',
  }
  const other: ScoreEntry = { ...older, mode: 'sprint', score: 5, at: '2026-01-02T00:00:00.000Z' }
  const newbie: ScoreEntry = { ...older, score: 140, wpm: 50, accuracy: 99, at: '2026-02-01T00:00:00.000Z' }
  const placed = insertScore([older, other], newbie, 1)
  assert.equal(placed.isBest, true)
  assert.equal(placed.rank, 1)
  assert.equal(placed.scores.length, 2)
  assert.equal(placed.scores.some((entry) => entry.mode === 'sprint'), true)
  const tie = insertScore([older], { ...older, at: '2026-03-01T00:00:00.000Z' })
  assert.equal(tie.isBest, false)
})

test('case matching follows difficulty', () => {
  assert.equal(matchesChar('A', 'a', false), true)
  assert.equal(matchesChar('A', 'a', true), false)
  assert.equal(matchesChar('.', '.', true), true)
})

test('accuracy display does not round a near miss up to perfect', () => {
  assert.equal(formatAccuracy(100), '100%')
  assert.equal(formatAccuracy(99.9), '99%')
})

test('lexicon and passages stay typeable', () => {
  assert.deepEqual(auditLexicon(), [])
  assert.ok(wordsFor('easy').length > 40)
  const easy = buildPassage('easy', () => 0.2, 80)
  const hard = buildPassage('hard', () => 0.2, 80)
  assert.match(easy, /^[a-z ]+$/)
  assert.match(hard, /[A-Z]/)
  assert.match(hard, /[.,]/)
  assert.ok(easy.length >= 80)
  assert.ok(hard.length >= 80)
})
