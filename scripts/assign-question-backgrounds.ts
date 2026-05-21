/**
 * 全設問に background を付与（章内シチュに合わせた初期値）
 */
import { readFileSync, writeFileSync } from 'node:fs'
import type { BackgroundSceneId } from '../src/data/backgrounds'

type Question = { background?: BackgroundSceneId; situation: string }
type Level = { questions: Question[] }

/** 第1章5問 + 第2章5問 + 第3章5問 */
const ASSIGNMENTS: BackgroundSceneId[] = [
  'station',
  'cafe_street',
  'cafe_interior',
  'cafe_interior',
  'cafe_interior',
  'station',
  'cafe_street',
  'cafe_interior',
  'cafe_interior',
  'cafe_street',
  'station',
  'cafe_interior',
  'cafe_interior',
  'residential',
  'residential',
]

function assignFile(path: string) {
  const raw = JSON.parse(readFileSync(path, 'utf8')) as Level[]
  let qi = 0
  for (const level of raw) {
    for (const q of level.questions ?? []) {
      q.background = ASSIGNMENTS[qi] ?? 'cafe_street'
      qi++
    }
  }
  writeFileSync(path, JSON.stringify(raw, null, 2) + '\n', 'utf8')
  console.log(`${path}: ${qi} questions assigned`)
}

for (const p of ['public/content.json', 'content.json']) {
  try {
    assignFile(p)
  } catch (e) {
    console.warn(`${p}: ${(e as Error).message}`)
  }
}
