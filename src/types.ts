import type { BackgroundSceneId } from './data/backgrounds'
import type { ScoreValue } from './data/scores'

export type { BackgroundSceneId }

export type { ScoreValue }

/** 章末称号（5問合計100点満点・下限以上で適用） */
export type ScoreRank = {
  /** 章内5問の合計点の下限（0〜100） */
  min: number
  title: string
  comment: string
}

export type QuizOption = {
  text: string
  score: ScoreValue
  /** キャラのセリフ（選択直後） */
  reaction: string
  /**
   * 回答に対する評価（点数表示直後・選択肢ごと）。改行可。
   * 書式: `## ` 見出し / `**` 太字 / `[rose|gold|warn|mute|accent]…[/…]` 色
   */
  evaluation: string
}

export type QuizQuestion = {
  /** プレイ画面の背景（駅・店内など） */
  background: BackgroundSceneId
  /** シチュ説明 */
  situation: string
  /**
   * 講評（4択共通・「評価」の次に表示）。改行可。書式は evaluation と同じ。
   */
  commonReview: string
  options: [QuizOption, QuizOption, QuizOption, QuizOption]
  /** 管理画面のみ：要チェック（メモ・AI確認用。ゲームでは未使用） */
  needsCheck?: boolean
}

export type LevelPack = {
  id: string
  title: string
  tagline: string
  accent: string
  /** 難易度 0〜3（0.5刻み）。未設定時は章IDから補完 */
  difficulty?: number
  questions: QuizQuestion[]
}
