import type { VercelRequest, VercelResponse } from '@vercel/node'
import { buildZyakudanAnalytics } from '../../server/buildAnalytics'
import { adminPassword } from '../../server/env'
import { fetchAnalyticsRows } from '../../server/supabaseRest'

function assertAdmin(req: VercelRequest, res: VercelResponse): boolean {
  const password = adminPassword()
  if (!password) {
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') {
      res.status(503).json({
        success: false,
        error: 'AdminDisabled',
        message: 'ZYAKUDAN_ADMIN_PASSWORD を Vercel に設定してください。',
      })
      return false
    }
    return true
  }
  const provided = req.headers['x-zyakudan-admin-password']
  const value = Array.isArray(provided) ? provided[0] : provided
  if (value !== password) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: '管理パスワードが違います。',
    })
    return false
  }
  return true
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, error: 'MethodNotAllowed' })
    return
  }
  if (!assertAdmin(req, res)) return

  const range = typeof req.query.range === 'string' ? req.query.range : '7d'
  const limitRaw = Number(req.query.limit ?? 5000)
  const limit = Math.min(10000, Math.max(100, Number.isFinite(limitRaw) ? limitRaw : 5000))

  const fetched = await fetchAnalyticsRows(range, limit)
  if (fetched.skipped) {
    res.status(200).json({
      success: false,
      error: 'SupabaseNotConfigured',
      message: 'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY を設定してください。',
    })
    return
  }
  if (!fetched.ok || !fetched.rows) {
    res.status(200).json({
      success: false,
      error: 'SupabaseReadFailed',
      status: fetched.status,
      message: fetched.body,
    })
    return
  }

  res.status(200).json({
    success: true,
    range,
    limit,
    loaded: fetched.rows.length,
    generatedAt: new Date().toISOString(),
    ...buildZyakudanAnalytics(fetched.rows),
  })
}
