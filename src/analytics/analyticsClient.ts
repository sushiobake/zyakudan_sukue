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

import {
  TRAFFIC_STORAGE_KEY,
  readTrafficFromWindowSearch,
  trafficHasSignal,
  type TrafficSource,
} from './promoTracking'

const VISITOR_STORAGE_KEY = 'zyakudan.visitorId.v1'
const TRAFFIC_PARAM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const

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

/** 初回 URL の r/ct を sessionStorage に保持（ハッシュ遷移後も追跡） */
function getEffectiveTraffic(): TrafficSource {
  const fromUrl = readTrafficFromWindowSearch(window.location.search)
  if (trafficHasSignal(fromUrl)) {
    try {
      window.sessionStorage.setItem(TRAFFIC_STORAGE_KEY, JSON.stringify(fromUrl))
    } catch {
      // ignore
    }
    return fromUrl
  }

  try {
    const raw = window.sessionStorage.getItem(TRAFFIC_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as TrafficSource
      if (parsed && typeof parsed === 'object') return parsed
    }
  } catch {
    // ignore
  }

  return fromUrl
}

function withPageContext(payload: AnalyticsPayload): AnalyticsPayload {
  if (typeof window === 'undefined') return payload

  const trafficRaw = getEffectiveTraffic()
  const utmFromUrl: Record<string, string> = {}
  for (const key of TRAFFIC_PARAM_KEYS) {
    const value = new URLSearchParams(window.location.search).get(key)?.trim().slice(0, 128)
    if (value) utmFromUrl[key.replace(/^utm_/, '')] = value
  }
  const traffic = trafficHasSignal(trafficRaw)
    ? {
        ...(trafficRaw.r ? { r: trafficRaw.r } : {}),
        ...(trafficRaw.ct ? { ct: trafficRaw.ct } : {}),
        ...(trafficRaw.utm && Object.keys(trafficRaw.utm).length > 0
          ? { utm: trafficRaw.utm }
          : Object.keys(utmFromUrl).length > 0
            ? { utm: utmFromUrl }
            : {}),
      }
    : null

  const nextPayload = {
    ...(traffic ? { traffic } : {}),
    ...(payload.payload ?? {}),
  }

  return {
    ...payload,
    visitorId: payload.visitorId || getAnalyticsVisitorId(),
    path: payload.path || `${window.location.pathname}${window.location.search}${window.location.hash}`,
    referrer: payload.referrer === undefined ? document.referrer || null : payload.referrer,
    payload: nextPayload,
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
