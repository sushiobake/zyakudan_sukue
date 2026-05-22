import { supabaseHeaders, supabaseRestTableUrl } from './env'
import { eventToRow, parseAnalyticsBody } from './validateEvent'

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
