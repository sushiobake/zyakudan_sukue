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

export type ZyakudanEventRow = {
  id: string
  created_at: string
  event_type: string
  visitor_id: string | null
  play_id: string | null
  level_id: string | null
  level_index: number | null
  question_index: number | null
  option_index: number | null
  score: number | null
  total_score: number | null
  rank_title: string | null
  end_reason: string | null
  href: string | null
  referrer: string | null
  path: string | null
  user_agent: string | null
  payload: unknown
}
