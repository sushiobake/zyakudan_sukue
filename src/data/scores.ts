/** 1問あたりの満点 */
export const QUESTION_SCORE_MAX = 20

/** 章内5問の合計満点 */
export const CHAPTER_SCORE_MAX = 100

/** 管理画面・データで使える点数（0〜20・2点刻み） */
export const SCORE_VALUES = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20] as const

export type ScoreValue = (typeof SCORE_VALUES)[number]

/** 旧データ（0〜100）を1問20点満点へ */
export function scaleLegacyScore(value: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  if (n <= QUESTION_SCORE_MAX) return n
  return Math.round(n / 5)
}

/** 読み込み時など：レガシー換算のうえ最も近い2点単位に丸める */
export function clampScore(value: number): ScoreValue {
  const scaled = scaleLegacyScore(value)
  const stepped = Math.round(scaled / 2) * 2
  const clamped = Math.min(QUESTION_SCORE_MAX, Math.max(0, stepped))
  return clamped as ScoreValue
}

/** ゲームUIの色分け用（既存CSSの4段階・満点20基準） */
export type ScoreTier = '100' | '80' | '60' | '20'

export function scoreToTier(score: number): ScoreTier {
  if (score >= 18) return '100'
  if (score >= 14) return '80'
  if (score >= 10) return '60'
  return '20'
}
