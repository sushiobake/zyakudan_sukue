import type { ScoreRank } from '../types'

/** 章末称号の下限（5問合計・10点刻み） */
export const RANK_MIN_VALUES = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100] as const

export type RankMinValue = (typeof RANK_MIN_VALUES)[number]

/** 章末称号の初期値（5問合計100点満点・下限） */
export const DEFAULT_RANKS: ScoreRank[] = [
  { min: 0, title: '見守るしかない神', comment: '彼はまだ、自分の言葉に溺れている。' },
  { min: 40, title: '人類補完計画見習い', comment: '少しずつ、現場の空気が読めるようになってきた。' },
  { min: 60, title: '救世主見習い', comment: '彼女の表情が、少し柔らかくなった。' },
  { min: 80, title: '現場の神', comment: '弱者男性を、穏やかに救えた。' },
  { min: 90, title: '全知の恋愛神', comment: '完璧に近い。あとは本人に任せよう。' },
]

export function clampRankMin(value: number): RankMinValue {
  const stepped = Math.round(Number(value) / 10) * 10
  const clamped = Math.min(100, Math.max(0, stepped))
  return clamped as RankMinValue
}

/** 5問の合計点（0〜100） */
export function totalRunScore(scores: number[]): number {
  return scores.reduce((a, b) => a + b, 0)
}

export function normalizeRanks(raw: unknown): ScoreRank[] {
  if (!Array.isArray(raw) || raw.length === 0) return [...DEFAULT_RANKS]
  const rows = raw
    .filter(
      (r): r is ScoreRank =>
        r != null &&
        typeof r === 'object' &&
        typeof (r as ScoreRank).title === 'string' &&
        typeof (r as ScoreRank).comment === 'string',
    )
    .map((r) => ({
      min: clampRankMin(Number((r as ScoreRank).min)),
      title: String((r as ScoreRank).title).trim(),
      comment: String((r as ScoreRank).comment).trim(),
    }))
    .filter((r) => r.title.length > 0)
    .sort((a, b) => a.min - b.min)
  return rows.length > 0 ? rows : [...DEFAULT_RANKS]
}

/** 章合計点に応じた称号（ranks は min 昇順想定） */
export function getScoreRank(totalScore: number, ranks: ScoreRank[]): ScoreRank {
  const sorted = [...ranks].sort((a, b) => b.min - a.min)
  for (const r of sorted) {
    if (totalScore >= r.min) return r
  }
  return sorted[sorted.length - 1] ?? ranks[0] ?? DEFAULT_RANKS[0]
}
