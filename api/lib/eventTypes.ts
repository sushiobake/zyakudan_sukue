export const ANALYTICS_EVENT_TYPES = [
  'title_visit',
  'chapter_start',
  'answer',
  'chapter_finish',
  'chapter_abandon',
] as const

export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number]

export type AnalyticsEventInput = {
  eventType: AnalyticsEventType
  visitorId?: string
  playId?: string
  levelId?: string
  levelIndex?: number
  questionIndex?: number
  optionIndex?: number
  score?: number
  totalScore?: number
  rankTitle?: string
  endReason?: string
  href?: string
  path?: string
  referrer?: string | null
  payload?: Record<string, unknown>
}
