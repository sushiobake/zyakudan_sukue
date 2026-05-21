export type AnalyticsEventType =
  | 'title_visit'
  | 'chapter_start'
  | 'answer'
  | 'chapter_finish'
  | 'chapter_abandon'

export type AnalyticsPayload = {
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

const VISITOR_STORAGE_KEY = 'zyakudan.visitorId.v1'

function makeId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

export function getAnalyticsVisitorId(): string {
  if (typeof window === 'undefined') return makeId('visitor')
  try {
    const current = window.localStorage.getItem(VISITOR_STORAGE_KEY)
    if (current) return current
    const next = makeId('visitor')
    window.localStorage.setItem(VISITOR_STORAGE_KEY, next)
    return next
  } catch {
    return makeId('visitor')
  }
}

export function createAnalyticsPlayId(): string {
  return makeId('play')
}

function withPageContext(payload: AnalyticsPayload): AnalyticsPayload {
  if (typeof window === 'undefined') return payload
  return {
    ...payload,
    visitorId: payload.visitorId || getAnalyticsVisitorId(),
    path: payload.path || `${window.location.pathname}${window.location.search}${window.location.hash}`,
    referrer: payload.referrer === undefined ? document.referrer || null : payload.referrer,
    payload: payload.payload ?? {},
  }
}

export function trackAnalyticsEvent(
  eventType: AnalyticsEventType,
  payload: AnalyticsPayload = {},
  options?: { beacon?: boolean },
): void {
  if (typeof window === 'undefined') return
  const body = JSON.stringify({ eventType, ...withPageContext(payload) })

  try {
    if (options?.beacon && typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon('/api/analytics', new Blob([body], { type: 'application/json' }))
      return
    }
  } catch {
    // fall through
  }

  void fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {
    // ログ失敗でゲームを止めない
  })
}
