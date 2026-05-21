import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

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

/** OGP 画像を絶対URLに差し替え（VITE_SITE_URL 設定時） */
function absoluteOgMeta(siteUrl: string): Plugin {
  return {
    name: 'absolute-og-meta',
    transformIndexHtml(html) {
      if (!siteUrl) return html
      const base = siteUrl.replace(/\/$/, '')
      const imageUrl = `${base}/og-image.png`
      return html
        .replace(/content="\/og-image\.png"/g, `content="${imageUrl}"`)
        .replace(/content='\/og-image\.png'/g, `content='${imageUrl}'`)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const siteUrl = (env.VITE_SITE_URL || '').trim().replace(/\/$/, '')

  return {
    plugins: [react(), saveContentApi(env.SAVE_CONTENT_TOKEN), absoluteOgMeta(siteUrl)],
  }
})
