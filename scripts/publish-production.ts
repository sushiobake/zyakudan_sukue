/**
 * 同梱データを本番ファイルへ反映（content.json・ranks.json）
 * ranks は public/ranks.json を正とする（DEFAULT_RANKS で上書きしない）
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { normalizeLevels } from '../src/data/normalizeLevels'
import { normalizeRanks } from '../src/data/ranks'
import { LEVELS } from '../src/data/questions'

const levelsJson = JSON.stringify(normalizeLevels(LEVELS), null, 2)

let ranksRaw: unknown
try {
  ranksRaw = JSON.parse(readFileSync('public/ranks.json', 'utf8'))
} catch {
  ranksRaw = JSON.parse(readFileSync('ranks.json', 'utf8'))
}
const ranksJson = JSON.stringify(normalizeRanks(ranksRaw), null, 2)

writeFileSync('public/content.json', levelsJson, 'utf8')
writeFileSync('content.json', levelsJson, 'utf8')
writeFileSync('public/ranks.json', ranksJson, 'utf8')
writeFileSync('ranks.json', ranksJson, 'utf8')
console.log('Wrote public/content.json, content.json, public/ranks.json, ranks.json')
