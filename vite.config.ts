import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { buildZyakudanAnalytics } from './server/buildAnalytics'
import { adminPassword } from './server/env'
import { fetchAnalyticsRows, insertAnalyticsEvent } from './server/supabaseRest'

/** 管理画面の「保存」→ public/content.json / ranks.json を即更新（開発サーバーのみ） */
function saveContentApi(saveToken: string | undefined): Plugin {
  return {
    name: 'save-content-api',
    configureServer(server) {
      server.middlewares.use('/api/save-content', (req, res, next) => {
        if (req.method !== 'POST') {
          next()
          return
        }

        if (saveToken) {
          const header = req.headers['x-save-content-token']
          const provided = Array.isArray(header) ? header[0] : header
          if (provided !== saveToken) {
            res.statusCode = 401
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: false, error: 'unauthorized' }))
            return
          }
        }

        const chunks: Buffer[] = []
        req.on('data', (chunk: Buffer) => chunks.push(chunk))
        req.on('end', () => {
          try {
            const body = Buffer.concat(chunks).toString('utf8')
            const parsed = JSON.parse(body) as unknown
            const publicContent = path.resolve('public/content.json')
            const rootContent = path.resolve('content.json')
            const publicRanks = path.resolve('public/ranks.json')
            const rootRanks = path.resolve('ranks.json')

            if (Array.isArray(parsed)) {
              fs.writeFileSync(publicContent, JSON.stringify(parsed, null, 2), 'utf8')
              fs.writeFileSync(rootContent, JSON.stringify(parsed, null, 2), 'utf8')
            } else if (parsed && typeof parsed === 'object') {
              const obj = parsed as { levels?: unknown; ranks?: unknown }
              if (Array.isArray(obj.levels)) {
                const levelsJson = JSON.stringify(obj.levels, null, 2)
                fs.writeFileSync(publicContent, levelsJson, 'utf8')
                fs.writeFileSync(rootContent, levelsJson, 'utf8')
              }
              if (Array.isArray(obj.ranks)) {
                const ranksJson = JSON.stringify(obj.ranks, null, 2)
                fs.writeFileSync(publicRanks, ranksJson, 'utf8')
                fs.writeFileSync(rootRanks, ranksJson, 'utf8')
              }
            } else {
              throw new Error('invalid payload')
            }

            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true }))
          } catch {
            res.statusCode = 500
            res.end(JSON.stringify({ ok: false }))
          }
        })
        req.on('error', () => {
          res.statusCode = 500
          res.end()
        })
      })
    },
  }
}

/** 開発サーバー用 analytics API（本番は Vercel api/） */
function analyticsDevApi(): Plugin {
  return {
    name: 'analytics-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/analytics', async (req, res, next) => {
        if (req.method !== 'POST') {
          next()
          return
        }
        const chunks: Buffer[] = []
        req.on('data', (chunk: Buffer) => chunks.push(chunk))
        req.on('end', async () => {
          try {
            const raw = JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown
            const result = await insertAnalyticsEvent(raw, {
              referrer: typeof req.headers.referer === 'string' ? req.headers.referer : null,
              userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null,
            })
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(result.ok ? { success: true } : { success: false, skipped: result.skipped }))
          } catch {
            res.statusCode = 500
            res.end(JSON.stringify({ success: false }))
          }
        })
      })

      server.middlewares.use('/api/admin/analytics', async (req, res, next) => {
        if (req.method !== 'GET') {
          next()
          return
        }
        const password = adminPassword()
        if (password) {
          const provided = req.headers['x-zyakudan-admin-password']
          const value = Array.isArray(provided) ? provided[0] : provided
          if (value !== password) {
            res.statusCode = 401
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: false, error: 'Unauthorized' }))
            return
          }
        }
        const url = new URL(req.url ?? '/', 'http://local')
        const range = url.searchParams.get('range') ?? '7d'
        const limit = Math.min(10000, Math.max(100, Number(url.searchParams.get('limit') ?? 5000)))
        const fetched = await fetchAnalyticsRows(range, limit)
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        if (!fetched.ok || !fetched.rows) {
          res.end(
            JSON.stringify({
              success: false,
              error: fetched.skipped ? 'SupabaseNotConfigured' : 'SupabaseReadFailed',
            }),
          )
          return
        }
        res.end(
          JSON.stringify({
            success: true,
            range,
            limit,
            loaded: fetched.rows.length,
            generatedAt: new Date().toISOString(),
            ...buildZyakudanAnalytics(fetched.rows),
          }),
        )
      })
    },
  }
}

const DEFAULT_SITE_URL = 'https://zyakudan-sukue.vercel.app'

/** OGP / Twitter カード用に公開URLを絶対パスへ差し替え */
function absoluteOgMeta(siteUrl: string): Plugin {
  return {
    name: 'absolute-og-meta',
    transformIndexHtml(html) {
      const base = (siteUrl || DEFAULT_SITE_URL).replace(/\/$/, '')
      const imageUrl = `${base}/og-image.png`
      return html
        .replace(/content="\/og-image\.png"/g, `content="${imageUrl}"`)
        .replace(/content='\/og-image\.png'/g, `content='${imageUrl}'`)
        .replace(/content="__SITE_URL__\/"/g, `content="${base}/"`)
        .replace(/content='__SITE_URL__\/'/g, `content='${base}/'`)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // サーバー用ミドルウェア（Supabase 等）が .env.local を読めるようにする
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) process.env[key] = value
  }
  const siteUrl = (env.VITE_SITE_URL || '').trim().replace(/\/$/, '') || DEFAULT_SITE_URL

  return {
    plugins: [
      react(),
      saveContentApi(env.SAVE_CONTENT_TOKEN),
      analyticsDevApi(),
      absoluteOgMeta(siteUrl),
    ],
  }
})
