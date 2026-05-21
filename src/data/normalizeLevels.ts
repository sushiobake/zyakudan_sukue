import type { LevelPack, QuizOption, QuizQuestion } from '../types'
import {
  inferBackgroundFromSituation,
  isBackgroundSceneId,
  type BackgroundSceneId,
} from './backgrounds'
import { resolveDifficulty } from '../utils/difficulty'
import { clampScore, type ScoreValue } from './scores'

type LegacyOption = {
  text: string
  score: ScoreValue
  reaction: string
  evaluation?: string
  afterScoreLine?: string
}

type LegacyQuestion = {
  situation: string
  background?: BackgroundSceneId
  commonReview?: string
  needsCheck?: boolean
  options: LegacyOption[]
}

function normalizeOption(o: LegacyOption): QuizOption {
  return {
    text: o.text,
    score: clampScore(Number(o.score)),
    reaction: o.reaction,
    evaluation: (o.evaluation ?? o.afterScoreLine ?? '').trim(),
  }
}

function normalizeQuestion(raw: LegacyQuestion): QuizQuestion {
  const options = raw.options.map(normalizeOption) as QuizQuestion['options']
  const commonReview = (raw.commonReview ?? '').trim()
  const situation = raw.situation
  const background: BackgroundSceneId =
    raw.background && isBackgroundSceneId(raw.background)
      ? raw.background
      : inferBackgroundFromSituation(situation)

  return {
    background,
    situation,
    commonReview,
    options,
    needsCheck: Boolean(raw.needsCheck),
  }
}

/** 旧 JSON（afterScoreLine のみ）や欠損 commonReview を補正 */
export function normalizeLevels(levels: LevelPack[]): LevelPack[] {
  return levels.map((level) => ({
    ...level,
    difficulty: resolveDifficulty(level),
    questions: (level.questions as LegacyQuestion[]).map(normalizeQuestion),
  }))
}
