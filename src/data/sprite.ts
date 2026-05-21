import { scoreToTier } from './scores'

/** chara3_split 内の立ち絵差分 */
export type CharaPose = 'normal' | 'happy' | 'smile' | 'shy' | 'angly' | 'surprise'

export const CHARA_POSE_SRC: Record<CharaPose, string> = {
  normal: '/chara3_split/chara3_normal.png',
  happy: '/chara3_split/chara3_happy.png',
  smile: '/chara3_split/chara3_smile.png',
  shy: '/chara3_split/chara3_shy.png',
  angly: '/chara3_split/chara3_angly.png',
  surprise: '/chara3_split/chara3_surprise.png',
}

/** 立ち絵の代表サイズ（chara3_normal.png 実寸・縦長） */
export const CHARA_IMAGE_SIZE = { w: 863, h: 1823 }

/** 選択肢の点数 → 表情（暫定） */
/** 表情差分を先読み（切り替え時のぶつ切りを減らす） */
export function preloadCharaPoses(): void {
  for (const src of Object.values(CHARA_POSE_SRC)) {
    const img = new Image()
    img.src = src
  }
}

export function charaPoseFromScore(score: number | null | undefined): CharaPose {
  switch (scoreToTier(score ?? 0)) {
    case '100':
      return 'happy'
    case '80':
      return 'smile'
    case '60':
      return 'shy'
    case '20':
      return 'angly'
    default:
      return 'normal'
  }
}
