import { useCallback, useEffect, useMemo, useState } from 'react'
import { PRODUCTION_SITE_URL } from '../utils/siteUrl'
import {
  PROMO_CHANNELS,
  PROMO_CHANNELS_STORAGE_KEY,
  PROMO_URL_HISTORY_STORAGE_KEY,
  buildPromoUrl,
  cloneDefaultPromoChannels,
  formatTrafficInflowLines,
  getPostTemplatesForChannel,
  type PromoChannelDef,
} from '../analytics/promoTracking'

export default function AdminPromoPage() {
  const [channels, setChannels] = useState<PromoChannelDef[]>(() => cloneDefaultPromoChannels())
  const [channel, setChannel] = useState('x')
  const [ct, setCt] = useState('')
  const [baseUrl, setBaseUrl] = useState(
    () =>
      (import.meta.env.VITE_SITE_URL as string | undefined)?.trim().replace(/\/$/, '') ||
      PRODUCTION_SITE_URL,
  )
  const [includeUtm, setIncludeUtm] = useState(false)
  const [templateId, setTemplateId] = useState('')
  const [copied, setCopied] = useState<'url' | 'template' | null>(null)
  const [history, setHistory] = useState<
    Array<{ url: string; channel: string; ct: string; savedAt: string }>
  >([])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PROMO_CHANNELS_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as PromoChannelDef[]
        if (Array.isArray(parsed) && parsed.length > 0) setChannels(parsed)
      }
      const historyRaw = window.localStorage.getItem(PROMO_URL_HISTORY_STORAGE_KEY)
      if (historyRaw) {
        const parsedHistory = JSON.parse(historyRaw) as Array<{
          url: string
          channel: string
          ct: string
          savedAt: string
        }>
        if (Array.isArray(parsedHistory)) setHistory(parsedHistory.slice(0, 10))
      }
    } catch {
      // localStorage 破損時も続行
    }
  }, [])

  const templates = useMemo(() => getPostTemplatesForChannel(channel, channels), [channel, channels])

  useEffect(() => {
    setTemplateId(templates[0]?.id ?? '')
  }, [templates])

  const fullUrl = useMemo(
    () => buildPromoUrl(baseUrl, channel, ct, channels, includeUtm),
    [baseUrl, channel, channels, ct, includeUtm],
  )

  const template = templates.find((item) => item.id === templateId) ?? templates[0]
  const renderedTemplate = template?.body.replace(/\{url\}/g, fullUrl) ?? fullUrl

  const saveHistory = useCallback(
    (url: string) => {
      const next = [
        { url, channel, ct: ct.trim(), savedAt: new Date().toISOString() },
        ...history.filter((item) => item.url !== url),
      ].slice(0, 10)
      setHistory(next)
      window.localStorage.setItem(PROMO_URL_HISTORY_STORAGE_KEY, JSON.stringify(next))
    },
    [channel, ct, history],
  )

  const copyText = async (kind: 'url' | 'template', text: string) => {
    await navigator.clipboard.writeText(text)
    saveHistory(fullUrl)
    setCopied(kind)
    window.setTimeout(() => setCopied(null), 1600)
  }

  const resetChannels = () => {
    const next = cloneDefaultPromoChannels()
    setChannels(next)
    window.localStorage.setItem(PROMO_CHANNELS_STORAGE_KEY, JSON.stringify(next))
  }

  return (
    <div className="admin-promo">
      <p className="admin-field-hint">
        配布用 URL（<code>?r=</code> / <code>ct=</code>）の生成。流入の集計は「プレイ履歴」タブで確認できます。
      </p>

      <section className="admin-card admin-promo__builder">
        <h3>配布用 URL を作る</h3>
        <div className="admin-promo__builder-grid">
          <div className="admin-promo__col">
            <label className="admin-field">
              <span className="admin-field-label">配布先</span>
              <select
                className="admin-input"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
              >
                {channels.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}（{item.hint ?? `r=${item.id}`}）
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-field">
              <span className="admin-field-label">ct（任意・投稿ごとの識別）</span>
              <input
                className="admin-input"
                value={ct}
                onChange={(e) => setCt(e.target.value)}
                placeholder="例: launch / note-01"
              />
            </label>
            <label className="admin-field">
              <span className="admin-field-label">公開ドメイン</span>
              <input
                className="admin-input"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
            </label>
            <label className="admin-promo__check">
              <input
                type="checkbox"
                checked={includeUtm}
                onChange={(e) => setIncludeUtm(e.target.checked)}
              />
              UTM も付ける（通常は OFF で短い URL）
            </label>
            <div className="admin-promo__url-box">{fullUrl}</div>
            <div className="admin-toolbar__actions">
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                onClick={() => void copyText('url', fullUrl)}
              >
                {copied === 'url' ? 'コピー済み' : 'URL コピー'}
              </button>
              <a
                className="admin-btn"
                href={fullUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => saveHistory(fullUrl)}
              >
                開く
              </a>
              <button type="button" className="admin-btn" onClick={resetChannels}>
                チャネル定義を既定に戻す
              </button>
            </div>
          </div>

          <div className="admin-promo__col">
            <label className="admin-field">
              <span className="admin-field-label">投稿テンプレ</span>
              <select
                className="admin-input"
                value={template?.id ?? ''}
                onChange={(e) => setTemplateId(e.target.value)}
              >
                {templates.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <textarea className="admin-input admin-promo__template" readOnly value={renderedTemplate} rows={6} />
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              onClick={() => void copyText('template', renderedTemplate)}
            >
              {copied === 'template' ? 'コピー済み' : 'テンプレをコピー'}
            </button>
            <p className="admin-field-hint">
              ハッシュ（<code>#/</code>）の前に <code>?r=</code> を付けます。例:{' '}
              <code>https://zyakudan-sukue.vercel.app/?r=n&ct=article1</code>
            </p>
          </div>
        </div>

        {history.length > 0 ? (
          <div className="admin-promo__history">
            <strong>最近作った URL</strong>
            <ul>
              {history.map((item) => {
                const formatted = formatTrafficInflowLines(item.channel, item.ct || null, channels)
                return (
                  <li key={`${item.url}-${item.savedAt}`}>
                    <button
                      type="button"
                      className="admin-promo__history-btn"
                      onClick={() => {
                        setChannel(item.channel)
                        setCt(item.ct)
                      }}
                      title={item.url}
                    >
                      <span>{formatted.cell}</span>
                      <code>{item.url}</code>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="admin-card">
        <h3>チャネル一覧（r コード）</h3>
        <div className="admin-analytics__table-wrap">
          <table className="admin-analytics__table">
            <thead>
              <tr>
                <th>r</th>
                <th>名前</th>
                <th>UTM source</th>
                <th>メモ</th>
              </tr>
            </thead>
            <tbody>
              {PROMO_CHANNELS.map((ch) => (
                <tr key={ch.id}>
                  <td>
                    <code>{ch.id}</code>
                  </td>
                  <td>{ch.snsName}</td>
                  <td>{ch.utm.source}</td>
                  <td>{ch.hint ?? `?r=${ch.id}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  )
}
