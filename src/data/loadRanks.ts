import type { ScoreRank } from '../types'
import { DEFAULT_RANKS, normalizeRanks } from './ranks'

export async function loadRanks(): Promise<ScoreRank[]> {
  try {
    const res = await fetch(`/ranks.json?t=${Date.now()}`, { cache: 'no-store' })
    if (res.ok) return normalizeRanks(await res.json())
  } catch {
    /* ignore */
  }
  return [...DEFAULT_RANKS]
}
