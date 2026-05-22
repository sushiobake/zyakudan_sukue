export function supabaseUrl(): string | null {
  const raw = process.env.SUPABASE_URL?.trim()
  if (!raw) return null
  return raw.replace(/\/+$/, '').replace(/\/rest\/v1$/i, '')
}

export function supabaseEventsTable(): string {
  return process.env.SUPABASE_EVENTS_TABLE?.trim() || 'zyakudan_events'
}

export function supabaseRestTableUrl(): string | null {
  const base = supabaseUrl()
  if (!base) return null
  const table = supabaseEventsTable()
  return `${base}/rest/v1/${encodeURIComponent(table)}`
}

export function supabaseServiceRoleKey(): string | null {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null
}

export function supabaseHeaders(): Record<string, string> | null {
  const key = supabaseServiceRoleKey()
  if (!key) return null
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal',
  }
}
