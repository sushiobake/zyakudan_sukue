/**
 * 誤って 20 のまま残った「旧20点（＝新4点）」を修正。
 * 同一設問に score:20 が2つあるとき、後ろ側を 4 にする。
 */
import { readFileSync, writeFileSync } from 'node:fs'

type Option = { score: number }
type Question = { options: Option[] }
type Level = { questions: Question[] }

function fixFile(path: string) {
  const raw = JSON.parse(readFileSync(path, 'utf8')) as Level[]
  let fixed = 0
  for (const level of raw) {
    for (const q of level.questions ?? []) {
      const opts = q.options ?? []
      const idx = opts
        .map((o, i) => (o.score === 20 ? i : -1))
        .filter((i) => i >= 0)
      if (idx.length > 1) {
        const last = idx[idx.length - 1]
        opts[last].score = 4
        fixed++
      }
    }
  }
  writeFileSync(path, JSON.stringify(raw, null, 2) + '\n', 'utf8')
  console.log(`${path}: fixed ${fixed} questions`)
}

for (const p of ['public/content.json', 'content.json']) {
  try {
    fixFile(p)
  } catch (e) {
    console.warn(`${p}: ${(e as Error).message}`)
  }
}
