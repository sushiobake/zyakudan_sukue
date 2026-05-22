import type { ZyakudanEventRow } from './eventTypes'

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1'])

function hostLooksLocal(host: string): boolean {
  const h = host.replace(/^www\./, '').toLowerCase()
  return LOCAL_HOSTS.has(h)
}

/** 開発環境（localhost）からのログか */
export function isLocalAnalyticsRow(row: ZyakudanEventRow): boolean {
  for (const raw of [row.referrer, row.href]) {
    if (!raw) continue
    try {
      if (hostLooksLocal(new URL(raw).hostname)) return true
    } catch {
      const lower = raw.toLowerCase()
      if (lower.includes('localhost') || lower.includes('127.0.0.1')) return true
    }
  }
  const path = row.path?.toLowerCase() ?? ''
  if (path.includes('localhost') || path.includes('127.0.0.1')) return true
  return false
}

export function filterProductionAnalyticsRows(rows: ZyakudanEventRow[]): {
  rows: ZyakudanEventRow[]
  excludedLocal: number
} {
  const prod: ZyakudanEventRow[] = []
  let excludedLocal = 0
  for (const row of rows) {
    if (isLocalAnalyticsRow(row)) {
      excludedLocal += 1
    } else {
      prod.push(row)
    }
  }
  return { rows: prod, excludedLocal }
}
