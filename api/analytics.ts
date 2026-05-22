export const config = { runtime: 'edge' }

const EVENT_TYPES = [
  'title_visit',
  'chapter_start',
  'answer',
  'chapter_finish',
  'chapter_abandon',
] as const

type AnalyticsEventType = (typeof EVENT_TYPES)[number]

type AnalyticsEventInput = {
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

function parseBody(raw: unknown): AnalyticsEventInput | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const eventType = o.eventType
  if (typeof eventType !== 'string' || !EVENT_TYPES.includes(eventType as AnalyticsEventType)) {
    return null
  }
  const payload =
    o.payload && typeof o.payload === 'object' && !Array.isArray(o.payload)
      ? (o.payload as Record<string, unknown>)
      : undefined
  return {
    eventType: eventType as AnalyticsEventType,
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

function supabaseUrl(): string | null {
  const raw = process.env.SUPABASE_URL?.trim()
  if (!raw) return null
  return raw.replace(/\/+$/, '').replace(/\/rest\/v1$/i, '')
}

function supabaseRestTableUrl(): string | null {
  const base = supabaseUrl()
  if (!base) return null
  const table = process.env.SUPABASE_EVENTS_TABLE?.trim() || 'zyakudan_events'
  return `${base}/rest/v1/${encodeURIComponent(table)}`
}

function supabaseHeaders(): Record<string, string> | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!key) return null
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal',
  }
}

function eventToRow(
  event: AnalyticsEventInput,
  meta: { referrer: string | null; userAgent: string | null },
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
    referrer: event.referrer === undefined ? meta.referrer : event.referrer,
    path: event.path ?? null,
    user_agent: meta.userAgent,
    payload: event.payload ?? {},
  }
}

export default async function handler(request: Request): Promise<Response> {
  try {
    if (request.method !== 'POST') {
      return Response.json({ success: false, error: 'MethodNotAllowed' }, { status: 405 })
    }

    const raw = await request.json().catch(() => null)
    const event = parseBody(raw)
    if (!event) {
      return Response.json({ success: false, error: 'BadRequest' }, { status: 400 })
    }

    const url = supabaseRestTableUrl()
    const headers = supabaseHeaders()
    if (!url || !headers) {
      return Response.json({
        success: false,
        skipped: true,
        hint: 'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing on Vercel',
      })
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(
        eventToRow(event, {
          referrer: request.headers.get('referer'),
          userAgent: request.headers.get('user-agent'),
        }),
      ),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return Response.json({
        success: false,
        status: res.status,
        message: body.slice(0, 700),
      })
    }

    return Response.json({ success: true })
  } catch (err) {
    console.error('[api/analytics]', err)
    return Response.json(
      {
        success: false,
        error: 'InternalError',
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    )
  }
}
