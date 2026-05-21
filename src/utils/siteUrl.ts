/** 共有・OGP用の公開URL（未設定時はブラウザの origin + base） */
export function resolveSiteUrl(): string {
  const configured = import.meta.env.VITE_SITE_URL?.trim().replace(/\/$/, '')
  if (configured) return configured

  if (typeof window === 'undefined') return ''

  const origin = window.location.origin
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
