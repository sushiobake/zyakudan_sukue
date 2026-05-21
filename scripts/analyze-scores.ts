import { readFileSync } from 'node:fs'
import type { LevelPack } from '../src/types'

const levels = JSON.parse(readFileSync('public/content.json', 'utf8')) as LevelPack[]

for (const lv of levels) {
  const perQ = lv.questions.map((q, i) => {
    const scores = q.options.map((o) => o.score)
    return {
      q: i + 1,
      min: Math.min(...scores),
      max: Math.max(...scores),
      scores: [...scores].sort((a, b) => b - a),
    }
  })
  const allOpts = lv.questions.flatMap((q) => q.options.map((o) => o.score))
  const runMin = perQ.reduce((s, p) => s + p.min, 0)
  const runMax = perQ.reduce((s, p) => s + p.max, 0)
  const avgOpt = allOpts.reduce((a, b) => a + b, 0) / allOpts.length
  const expectedTotal = perQ.reduce(
    (s, p) => s + p.scores.reduce((a, b) => a + b, 0) / p.scores.length,
    0,
  )

  console.log('---', lv.id, lv.title.trim(), '---')
  console.log('選択肢の点数レンジ（章内）:', Math.min(...allOpts), '~', Math.max(...allOpts))
  for (const p of perQ) {
    console.log(
      `  Q${p.q}: 4択 ${p.min}~${p.max}点 [${p.scores.join(', ')}] → この問の最低=${p.min}`,
    )
  }
  console.log('5問合計（毎問いちばん低い選択）:', runMin, '/ 100')
  console.log('5問合計（毎問いちばん高い選択）:', runMax, '/ 100')
  console.log('全選択肢の平均:', avgOpt.toFixed(1), '点/択')
  console.log(
    '参考: 各問ランダム1択の期待章合計:',
    expectedTotal.toFixed(1),
    '/ 100',
  )
  console.log('')
}

const allOpts = levels.flatMap((lv) =>
  lv.questions.flatMap((q) => q.options.map((o) => o.score)),
)
console.log('=== 全体 ===')
console.log('データ上の最低単点（1択）:', Math.min(...allOpts), '点')
console.log('データ上の最高単点（1択）:', Math.max(...allOpts), '点')
console.log('章は5問の合計で0〜100（平均表示は廃止・合計表示）')
