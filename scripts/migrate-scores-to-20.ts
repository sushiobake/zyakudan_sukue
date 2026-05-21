/**
 * 選択肢 score を 0〜100 → 0〜20（÷5）に一括変換。
 * public/content.json と content.json を更新する。
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { clampScore } from '../src/data/scores'

type Option = { score: number; [k: string]: unknown }
type Question = { options: Option[]; [k: string]: unknown }
type Level = { questions: Question[]; [k: string]: unknown }

function migrateFile(path: string) {
  const raw = JSON.parse(readFileSync(path, 'utf8')) as Level[]
  let changed = 0
  for (const level of raw) {
    for (const q of level.questions ?? []) {
      for (const opt of q.options ?? []) {
        const before = Number(opt.score)
        const scaled = before > 20 ? Math.round(before / 5) : before
        const after = clampScore(scaled)
        if (before !== after) changed++
        opt.score = after
      }
    }
  }
  writeFileSync(path, JSON.stringify(raw, null, 2) + '\n', 'utf8')
  console.log(`${path}: updated (${changed} option scores changed)`)
}

for (const p of ['public/content.json', 'content.json']) {
  try {
    migrateFile(p)
  } catch (e) {
    console.warn(`${p}: skip (${(e as Error).message})`)
  }
}
