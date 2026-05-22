export interface PromoPostTemplate {
  id: string
  label: string
  body: string
}

export interface PromoChannelDef {
  id: string
  label: string
  hint?: string
  snsName: string
  utm: { source: string; medium: string }
  postTemplates?: PromoPostTemplate[]
  inheritTemplatesFrom?: string
}

export interface TrafficSource {
  r: string | null
  ct: string | null
  utm: Record<string, string> | null
}

const GENERIC_POST_TEMPLATES: PromoPostTemplate[] = [
  {
    id: 'generic',
    label: '汎用',
    body: '弱者男性を救え！\n“リアル”恋愛シミュレーション\n{url}',
  },
]

/** 配布チャネル定義（URL の ?r= に対応） */
export const PROMO_CHANNELS: PromoChannelDef[] = [
  {
    id: 'x',
    label: 'X',
    hint: 'r=x',
    snsName: 'X',
    utm: { source: 'twitter', medium: 'sns' },
    postTemplates: [
      {
        id: 'x-share',
        label: '告知',
        body: '弱者男性を救え！\n“リアル”恋愛シミュレーション\n神視点で彼の恋愛を成就させる短編クイズ。\n\n{url}',
      },
    ],
  },
  {
    id: 'n',
    label: 'note',
    hint: 'r=n',
    snsName: 'note',
    utm: { source: 'note', medium: 'blog' },
    postTemplates: [
      {
        id: 'note-article',
        label: '記事用',
        body: '「弱者男性を救え！」を公開しました。\n“リアル”恋愛シミュレーションの神視点クイズです。\n\n{url}',
      },
    ],
  },
  {
    id: 't',
    label: 'tsukutta',
    hint: 'r=t',
    snsName: 'tsukutta',
    utm: { source: 'tsukutta', medium: 'listing' },
    postTemplates: [
      {
        id: 'tsukutta',
        label: 'tsukutta用',
        body: '弱者男性を救え！ — “リアル”恋愛シミュレーション（ブラウザ無料）\n{url}',
      },
    ],
  },
  {
    id: 'c',
    label: 'ci-en',
    hint: 'r=c',
    snsName: 'ci-en',
    utm: { source: 'ci-en', medium: 'blog' },
    postTemplates: [
      {
        id: 'cien',
        label: 'Ci-en記事',
        body: '新作「弱者男性を救え！」を公開しました。\n{url}',
      },
    ],
  },
  {
    id: 'b',
    label: 'Bluesky',
    hint: 'r=b',
    snsName: 'Bluesky',
    utm: { source: 'bluesky', medium: 'sns' },
    inheritTemplatesFrom: 'x',
  },
  {
    id: 'm',
    label: 'Misskey',
    hint: 'r=m',
    snsName: 'Misskey',
    utm: { source: 'misskey', medium: 'sns' },
    inheritTemplatesFrom: 'x',
  },
]

export const TRAFFIC_STORAGE_KEY = 'zyakudan.traffic.v1'
export const PROMO_CHANNELS_STORAGE_KEY = 'zyakudan.promoChannels.v1'
export const PROMO_URL_HISTORY_STORAGE_KEY = 'zyakudan.promoUrlHistory.v1'

export function cloneDefaultPromoChannels(): PromoChannelDef[] {
  return JSON.parse(JSON.stringify(PROMO_CHANNELS)) as PromoChannelDef[]
}

export function getPromoChannelById(
  id: string,
  channels: PromoChannelDef[] = PROMO_CHANNELS,
): PromoChannelDef | undefined {
  const key = id.trim().toLowerCase()
  return channels.find((channel) => channel.id.toLowerCase() === key)
}

export function getPromoUtm(
  id: string,
  channels: PromoChannelDef[] = PROMO_CHANNELS,
): { source: string; medium: string } {
  const channel = getPromoChannelById(id, channels)
  return channel?.utm ?? { source: 'zyakudan', medium: 'promo' }
}

export function getPostTemplatesForChannel(
  channelId: string,
  channels: PromoChannelDef[] = PROMO_CHANNELS,
): PromoPostTemplate[] {
  const channel = getPromoChannelById(channelId, channels)
  if (!channel) return GENERIC_POST_TEMPLATES
  const sourceId = channel.inheritTemplatesFrom ?? channel.id
  const source = getPromoChannelById(sourceId, channels)
  if (channel.postTemplates?.length) return channel.postTemplates
  if (source?.postTemplates?.length) return source.postTemplates
  return GENERIC_POST_TEMPLATES
}

export function formatTrafficInflowLines(
  rRaw: string | null | undefined,
  ctRaw: string | null | undefined,
  channels: PromoChannelDef[] = PROMO_CHANNELS,
): { line1: string; line2: string | null; title: string; cell: string } {
  const raw = (rRaw ?? '').trim().toLowerCase()
  const ct = (ctRaw ?? '').trim()
  if (!raw) {
    return { line1: '直接/不明', line2: null, title: 'r がありません', cell: '直接/不明' }
  }
  const channel = getPromoChannelById(raw, channels)
  const snsName = channel?.snsName ?? raw
  const line1 = `${snsName}（r=${raw}）`
  const line2 = ct ? `ct=${ct}` : null
  const title = line2 ? `${line1} / ${line2}` : line1
  return { line1, line2, title, cell: line2 ? `${line1} ${line2}` : line1 }
}

export function readTrafficSourceFromUrl(urlLike: string): TrafficSource {
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

export function trafficHasSignal(traffic: TrafficSource): boolean {
  return Boolean(traffic.r || traffic.ct || (traffic.utm && Object.keys(traffic.utm).length > 0))
}

export function readTrafficFromWindowSearch(search: string): TrafficSource {
  return readTrafficSourceFromUrl(`https://local/${search.startsWith('?') ? search : `?${search}`}`)
}

export function buildPromoUrl(
  origin: string,
  channelId: string,
  ct: string,
  channels: PromoChannelDef[],
  includeUtm: boolean,
): string {
  let base = origin.replace(/\/$/, '')
  try {
    base = new URL(origin.includes('://') ? origin : `https://${origin}`).origin
  } catch {
    base = origin.replace(/\/$/, '')
  }
  const params = new URLSearchParams()
  params.set('r', channelId)
  if (ct.trim()) params.set('ct', ct.trim())
  if (includeUtm) {
    const utm = getPromoUtm(channelId, channels)
    params.set('utm_source', utm.source)
    params.set('utm_medium', utm.medium)
    if (ct.trim()) params.set('utm_campaign', ct.trim())
  }
  return `${base}/?${params.toString()}`
}
