import assert from 'node:assert/strict'
import { test } from 'node:test'
import { auditZhLexicon, buildZhPassage } from '../src/lexicon-zh.ts'
import {
  accuracyOf,
  arcadePoints,
  chooseLanes,
  outerLane,
  cpmOf,
  cycleDifficulty,
  derive,
  formatAccuracy,
  freshStats,
  insertScore,
  matchesChar,
  pickChunk,
  pickTarget,
  rampOf,
  wpmOf,
} from '../src/logic.ts'
import { auditSponsors, rollSponsor, sponsorForText } from '../src/sponsors.ts'
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

test('chinese speed is characters per minute', () => {
  assert.equal(cpmOf(10, 500), 0)
  assert.equal(cpmOf(30, 30_000), 60)
  const stats = freshStats(3, 0)
  stats.correct = 120
  stats.elapsedMs = 60_000
  derive(stats, 'zh')
  assert.equal(stats.wpm, 120)
  derive(stats, 'en')
  assert.equal(stats.wpm, 24)
})

test('pickChunk locks the lowest word that starts with the commit', () => {
  const words = [
    { id: 1, text: '慢慢練習', typed: 0, y: 10 },
    { id: 2, text: '慢慢把字打完', typed: 0, y: 50 },
    { id: 3, text: '熱茶', typed: 1, y: 90 },
  ]
  assert.equal(pickChunk(words, '慢慢'), 2)
  assert.equal(pickChunk(words, '熱'), null)
  assert.equal(pickChunk(words, ''), null)
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

test('sponsored words prefer the outer lanes', () => {
  const open = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY]
  assert.equal(outerLane(4, open, 78, () => 0), 0)
  assert.equal(outerLane(4, open, 78, () => 0.9), 3)
  assert.equal(outerLane(4, [20, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, 400], 78, () => 0), 3)
  assert.equal(outerLane(4, [30, 500, 500, 40], 78, () => 0), null)
  assert.equal(outerLane(3, [20, 10, 90], 78, () => 0), 2)
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
  const chinese: ScoreEntry = { ...older, script: 'zh', score: 900, at: '2026-04-01T00:00:00.000Z' }
  const split = insertScore([older], chinese, 1)
  assert.equal(split.scores.length, 2)
  assert.equal(split.isBest, true)
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

test('traditional lexicon, sponsors, and chinese passages', () => {
  assert.deepEqual(auditZhLexicon(), [])
  assert.deepEqual(auditSponsors(), [])
  const passage = buildZhPassage('hard', () => 0.2, 80)
  assert.match(passage, /。/)
  assert.ok(passage.length >= 80)
  assert.equal(rollSponsor(() => 0.99, 0.2), null)
  const seq = [0, 0.99, 0]
  let i = 0
  const rolled = rollSponsor(() => seq[i++] ?? 0, 1, [
    { id: 'a', name: '甲', words: ['甲甲'], weight: 1, example: true },
    { id: 'b', name: '乙', words: ['乙乙乙'], weight: 1, example: true },
  ])
  assert.equal(rolled?.sponsor.id, 'b')
  assert.equal(rolled?.text, '乙乙乙')
  assert.equal(sponsorForText('青山茶行')?.id, 'qingshan')
  assert.equal(sponsorForText('月亮'), null)
})
