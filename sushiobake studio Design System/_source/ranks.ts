export type ScoreRank = {
  min: number
  title: string
  comment: string
}

/** 5問×100点満点 = 500点想定 */
export const SCORE_RANKS: ScoreRank[] = [
  { min: 0, title: '見守るしかない神', comment: '彼はまだ、自分の言葉に溺れている。' },
  { min: 201, title: '人類補完計画見習い', comment: '少しずつ、現場の空気が読めるようになってきた。' },
  { min: 301, title: '救世主見習い', comment: '彼女の表情が、少し柔らかくなった。' },
  { min: 401, title: '現場の神', comment: '弱者男性を、穏やかに救えた。' },
  { min: 481, title: '全知の恋愛神', comment: '完璧に近い。あとは本人に任せよう。' },
]

export function getScoreRank(total: number, max: number): ScoreRank {
  const pct = max > 0 ? total / max : 0
  if (pct >= 481 / 500) return SCORE_RANKS[4]
  if (pct >= 401 / 500) return SCORE_RANKS[3]
  if (pct >= 301 / 500) return SCORE_RANKS[2]
  if (pct >= 201 / 500) return SCORE_RANKS[1]
  return SCORE_RANKS[0]
}
