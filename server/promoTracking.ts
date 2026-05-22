/** サーバー集計用（Vercel Functions は src/ を import しない） */

export interface PromoChannelDef {
  id: string
  label: string
  snsName: string
}

export interface TrafficSource {
  r: string | null
  ct: string | null
  utm: Record<string, string> | null
}

const PROMO_CHANNELS: PromoChannelDef[] = [
  { id: 'x', label: 'X', snsName: 'X' },
  { id: 'n', label: 'note', snsName: 'note' },
  { id: 't', label: 'tsukutta', snsName: 'tsukutta' },
  { id: 'c', label: 'ci-en', snsName: 'ci-en' },
  { id: 'b', label: 'Bluesky', snsName: 'Bluesky' },
  { id: 'm', label: 'Misskey', snsName: 'Misskey' },
]

function getPromoChannelById(id: string): PromoChannelDef | undefined {
  const key = id.trim().toLowerCase()
  return PROMO_CHANNELS.find((channel) => channel.id === key)
}

export function formatTrafficInflowLines(
  rRaw: string | null | undefined,
  ctRaw: string | null | undefined,
): { line1: string; line2: string | null; title: string; cell: string } {
  const raw = (rRaw ?? '').trim().toLowerCase()
  const ct = (ctRaw ?? '').trim()
  if (!raw) {
    return { line1: '直接/不明', line2: null, title: 'r がありません', cell: '直接/不明' }
  }
  const channel = getPromoChannelById(raw)
  const snsName = channel?.snsName ?? raw
  const line1 = `${snsName}（r=${raw}）`
  const line2 = ct ? `ct=${ct}` : null
  const title = line2 ? `${line1} / ${line2}` : line1
  return { line1, line2, title, cell: line2 ? `${line1} ${line2}` : line1 }
}

function readTrafficSourceFromUrl(urlLike: string): TrafficSource {
  try {
    const url = new URL(urlLike, 'https://zyakudan.local')
    const params = url.searchParams
    const r = params.get('r')?.trim().slice(0, 32).toLowerCase() || null
    const ct = params.get('ct')?.trim().slice(0, 128) || null
    const utm: Record<string, string> = {}
    for (const [param, key] of [
      ['utm_source', 'source'],
      ['utm_medium', 'medium'],
      ['utm_campaign', 'campaign'],
      ['utm_content', 'content'],
      ['utm_term', 'term'],
    ] as const) {
      const value = params.get(param)?.trim().slice(0, 128)
      if (value) utm[key] = value
    }
    return {
      r,
      ct,
      utm: Object.keys(utm).length > 0 ? utm : null,
    }
  } catch {
    return { r: null, ct: null, utm: null }
  }
}

export function readTrafficSourceFromPayload(
  value: unknown,
  path?: string | null,
): TrafficSource {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const payload = value as Record<string, unknown>
    const traffic = payload.traffic
    if (traffic && typeof traffic === 'object' && !Array.isArray(traffic)) {
      const obj = traffic as Record<string, unknown>
      const r =
        typeof obj.r === 'string' && obj.r.trim()
          ? obj.r.trim().slice(0, 32).toLowerCase()
          : null
      const ct =
        typeof obj.ct === 'string' && obj.ct.trim() ? obj.ct.trim().slice(0, 128) : null
      const utm =
        obj.utm && typeof obj.utm === 'object' && !Array.isArray(obj.utm)
          ? Object.fromEntries(
              Object.entries(obj.utm as Record<string, unknown>)
                .filter(([, v]) => typeof v === 'string' && v.trim())
                .map(([k, v]) => [k, String(v).trim().slice(0, 128)]),
            )
          : {}
      return { r, ct, utm: Object.keys(utm).length > 0 ? utm : null }
    }
  }
  return path ? readTrafficSourceFromUrl(path) : { r: null, ct: null, utm: null }
}
