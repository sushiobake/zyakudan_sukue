import type { LevelPack, ScoreRank } from '../types'
import { normalizeLevels } from './normalizeLevels'
import { normalizeRanks } from './ranks'

export type GamePublishPayload = {
  levels: LevelPack[]
  ranks: ScoreRank[]
}

/** 開発サーバーが content.json / ranks.json に書き込む */
export async function publishGameData(payload: GamePublishPayload): Promise<boolean> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    const token = import.meta.env.VITE_SAVE_CONTENT_TOKEN
    if (token) headers['X-Save-Content-Token'] = token

    const res = await fetch('/api/save-content', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        levels: normalizeLevels(payload.levels),
        ranks: normalizeRanks(payload.ranks),
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

/** @deprecated */
export async function publishContentJson(levels: LevelPack[]): Promise<boolean> {
  const { DEFAULT_RANKS } = await import('./ranks')
  return publishGameData({ levels, ranks: DEFAULT_RANKS })
}
