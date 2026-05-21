/** 本番の公開URL（ローカル開発時の X 共有などのフォールバック） */
export const PRODUCTION_SITE_URL = 'https://zyakudan-sukue.vercel.app'

/** 共有・OGP用の公開URL（未設定時はブラウザの origin + base） */
export function resolveSiteUrl(): string {
  const configured = import.meta.env.VITE_SITE_URL?.trim().replace(/\/$/, '')
  if (configured) return configured

  if (typeof window === 'undefined') return PRODUCTION_SITE_URL

  const origin = window.location.origin
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
    return PRODUCTION_SITE_URL
  }
  const base = import.meta.env.BASE_URL || '/'
  try {
    return new URL(base, origin).href.replace(/\/$/, '')
  } catch {
    return origin
  }
}

/** ルート相対パスを絶対URLに（OGP・シェア用） */
export function absolutePublicUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  const site = resolveSiteUrl()
  return site ? `${site}${normalized}` : normalized
}
