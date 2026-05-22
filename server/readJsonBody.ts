import type { VercelRequest } from '@vercel/node'

/** Vercel / Node で POST body を JSON として読む（req.body 未パース時も対応） */
export async function readJsonBody(req: VercelRequest): Promise<unknown> {
  const body = req.body

  if (body !== undefined && body !== null && body !== '') {
    if (typeof body === 'string') {
      try {
        return JSON.parse(body) as unknown
      } catch {
        return null
      }
    }
    if (Buffer.isBuffer(body)) {
      try {
        return JSON.parse(body.toString('utf8')) as unknown
      } catch {
        return null
      }
    }
    if (typeof body === 'object') {
      return body
    }
  }

  if (req.readable === false) {
    return null
  }

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf8').trim()
        resolve(text ? (JSON.parse(text) as unknown) : null)
      } catch {
        resolve(null)
      }
    })
    req.on('error', reject)
  })
}
