import { eventToRow, parseAnalyticsBody } from './validateEvent'
import type { AnalyticsEventInput, ZyakudanEventRow } from './eventTypes'
import { supabaseHeaders, supabaseRestTableUrl } from './env'

export async function insertAnalyticsEvent(
  raw: unknown,
  meta: { referrer?: string | null; userAgent?: string | null },
): Promise<{ ok: boolean; skipped?: boolean; status?: number; body?: string }> {
  const event = parseAnalyticsBody(raw)
  if (!event) return { ok: false, status: 400, body: 'BadRequest' }

  const url = supabaseRestTableUrl()
  const headers = supabaseHeaders()
  if (!url || !headers) return { ok: false, skipped: true }

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(eventToRow(event, meta)),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, status: 500, body: `fetch failed: ${message}` }
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    return { ok: false, status: res.status, body: body.slice(0, 700) }
  }
  return { ok: true }
}

const SELECT_COLUMNS = [
  'id',
  'created_at',
  'event_type',
  'visitor_id',
  'play_id',
  'level_id',
  'level_index',
  'question_index',
  'option_index',
  'score',
  'total_score',
  'rank_title',
  'end_reason',
  'href',
  'referrer',
  'path',
  'user_agent',
  'payload',
].join(',')

export function rangeToFromIso(range: string | null): string | null {
  const now = Date.now()
  if (range === 'today') {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d.toISOString()
  }
  if (range === '7d') return new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()
  if (range === '30d') return new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()
  return null
}

export async function fetchAnalyticsRows(
  range: string,
  limit: number,
): Promise<{ ok: boolean; rows?: ZyakudanEventRow[]; status?: number; body?: string; skipped?: boolean }> {
  const base = supabaseRestTableUrl()
  const headers = supabaseHeaders()
  if (!base || !headers) return { ok: false, skipped: true }

  let url: URL
  try {
    url = new URL(base)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, status: 500, body: `Invalid SUPABASE_URL: ${message}` }
  }

  const fromIso = rangeToFromIso(range)
  url.searchParams.set('select', SELECT_COLUMNS)
  url.searchParams.set('order', 'created_at.desc')
  url.searchParams.set('limit', String(limit))
  if (fromIso) url.searchParams.set('created_at', `gte.${fromIso}`)

  const readHeaders = { ...headers }
  delete readHeaders['Content-Type']
  delete readHeaders.Prefer

  let res: Response
  try {
    res = await fetch(url, { method: 'GET', headers: readHeaders, cache: 'no-store' })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, status: 500, body: `fetch failed: ${message}` }
  }

  const text = await res.text()
  if (!res.ok) return { ok: false, status: res.status, body: text.slice(0, 700) }
  try {
    return { ok: true, rows: JSON.parse(text) as ZyakudanEventRow[] }
  } catch {
    return { ok: false, status: 500, body: 'Invalid JSON from Supabase' }
  }
}

export type { AnalyticsEventInput }
