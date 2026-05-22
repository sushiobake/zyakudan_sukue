import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readJsonBody } from '../server/readJsonBody'
import { insertAnalyticsEvent } from '../server/supabaseRest'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ success: false, error: 'MethodNotAllowed' })
      return
    }

    const raw = await readJsonBody(req)
    const result = await insertAnalyticsEvent(raw, {
      referrer: typeof req.headers.referer === 'string' ? req.headers.referer : null,
      userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null,
    })

    if (result.skipped) {
      res.status(200).json({ success: false, skipped: true })
      return
    }
    if (!result.ok) {
      res.status(result.status === 400 ? 400 : 200).json({
        success: false,
        status: result.status,
        message: result.body,
      })
      return
    }
    res.status(200).json({ success: true })
  } catch (err) {
    console.error('[api/analytics]', err)
    res.status(500).json({
      success: false,
      error: 'InternalError',
      message: err instanceof Error ? err.message : String(err),
    })
  }
}
