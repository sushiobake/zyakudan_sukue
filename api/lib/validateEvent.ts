import { ANALYTICS_EVENT_TYPES, type AnalyticsEventInput } from './eventTypes'

function clampStr(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string') return undefined
  const t = value.trim()
  return t ? t.slice(0, max) : undefined
}

function clampInt(value: unknown, min: number, max: number): number | undefined {
  const n = Number(value)
  if (!Number.isFinite(n)) return undefined
  const i = Math.round(n)
  if (i < min || i > max) return undefined
  return i
}

export function parseAnalyticsBody(raw: unknown): AnalyticsEventInput | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const eventType = o.eventType
  if (
    typeof eventType !== 'string' ||
    !ANALYTICS_EVENT_TYPES.includes(eventType as AnalyticsEventInput['eventType'])
  ) {
    return null
  }

  const payload =
    o.payload && typeof o.payload === 'object' && !Array.isArray(o.payload)
      ? (o.payload as Record<string, unknown>)
      : undefined

  return {
    eventType: eventType as AnalyticsEventInput['eventType'],
    visitorId: clampStr(o.visitorId, 160),
    playId: clampStr(o.playId, 160),
    levelId: clampStr(o.levelId, 80),
    levelIndex: clampInt(o.levelIndex, 0, 50),
    questionIndex: clampInt(o.questionIndex, 1, 50),
    optionIndex: clampInt(o.optionIndex, 0, 10),
    score: clampInt(o.score, 0, 20),
    totalScore: clampInt(o.totalScore, 0, 100),
    rankTitle: clampStr(o.rankTitle, 120),
    endReason: clampStr(o.endReason, 80),
    href: clampStr(o.href, 2000),
    path: clampStr(o.path, 1500),
    referrer: o.referrer === null ? null : clampStr(o.referrer, 1500),
    payload,
  }
}

export function eventToRow(
  event: AnalyticsEventInput,
  meta: { referrer?: string | null; userAgent?: string | null },
): Record<string, unknown> {
  return {
    event_type: event.eventType,
    visitor_id: event.visitorId ?? null,
    play_id: event.playId ?? null,
    level_id: event.levelId ?? null,
    level_index: event.levelIndex ?? null,
    question_index: event.questionIndex ?? null,
    option_index: event.optionIndex ?? null,
    score: event.score ?? null,
    total_score: event.totalScore ?? null,
    rank_title: event.rankTitle ?? null,
    end_reason: event.endReason ?? null,
    href: event.href ?? null,
    referrer: event.referrer === undefined ? (meta.referrer ?? null) : event.referrer,
    path: event.path ?? null,
    user_agent: meta.userAgent ?? null,
    payload: event.payload ?? {},
  }
}
