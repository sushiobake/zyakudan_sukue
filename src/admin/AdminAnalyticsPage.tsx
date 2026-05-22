import { useCallback, useEffect, useState } from 'react'
import { formatQuestionLabel } from './analyticsFormat'

type RangeKey = 'today' | '7d' | '30d' | 'all'

type SourceRow = {
  key: string
  r: string | null
  ct: string | null
  label: string
  title: string
  titleVisits: number
  plays: number
  visitors: number
  starts: number
  finishes: number
  abandons: number
  finishRate: number
}

type AnalyticsResponse = {
  success: boolean
  error?: string
  message?: string
  range?: string
  loaded?: number
  excludedLocal?: number
  generatedAt?: string
  summary?: {
    events: number
    visitors: number
    plays: number
    titleVisits: number
    starts: number
    finishes: number
    abandons: number
    answers: number
    finishRate: number
  }
  sources?: SourceRow[]
  questions?: Array<{
    levelId: string | null
    levelIndex: number | null
    questionIndex: number
    answers: number
    avgScore: number | null
    abandonsHere: number
    topLowOption: { optionIndex: number; count: number } | null
    topOption: { optionIndex: number; count: number } | null
  }>
  plays?: Array<{
    playId: string
    visitorId: string | null
    levelId: string | null
    levelIndex: number | null
    levelTitle: string | null
    firstAt: string
    lastAt: string
    answerCount: number
    reachedQuestion: number
    finished: boolean
    totalScore: number | null
    rankTitle: string | null
    endReason: string | null
    sourceLabel?: string | null
    sourceTitle?: string | null
    answers: Array<{
      questionIndex: number
      optionIndex: number | null
      score: number | null
      choiceText: string | null
    }>
  }>
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function formatDt(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ja-JP', { hour12: false })
  } catch {
    return iso
  }
}

function optionNum(optionIndex: number | null): string {
  return optionIndex != null ? String(optionIndex + 1) : '—'
}

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState<RangeKey>('7d')
  const [adminPassword, setAdminPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [payload, setPayload] = useState<AnalyticsResponse | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const headers: Record<string, string> = {}
      if (adminPassword) headers['x-zyakudan-admin-password'] = adminPassword
      const res = await fetch(`/api/admin/analytics?range=${range}&limit=5000`, {
        headers,
        cache: 'no-store',
      })
      const json = (await res.json()) as AnalyticsResponse
      setPayload(json)
    } catch (e) {
      setPayload({
        success: false,
        message: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setLoading(false)
    }
  }, [adminPassword, range])

  const deletePlay = useCallback(
    async (playId: string) => {
      if (!window.confirm('このプレイのログをすべて削除します。よろしいですか？')) return
      setDeletingId(playId)
      try {
        const headers: Record<string, string> = {}
        if (adminPassword) headers['x-zyakudan-admin-password'] = adminPassword
        const res = await fetch(
          `/api/admin/analytics?playId=${encodeURIComponent(playId)}`,
          { method: 'DELETE', headers },
        )
        const json = (await res.json()) as { success?: boolean; message?: string }
        if (!json.success) {
          window.alert(json.message ?? '削除に失敗しました')
          return
        }
        await load()
      } catch (e) {
        window.alert(e instanceof Error ? e.message : String(e))
      } finally {
        setDeletingId(null)
      }
    },
    [adminPassword, load],
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load は adminPassword/range を内包
  }, [range, adminPassword])

  const summary = payload?.summary
  const sources = payload?.sources ?? []

  return (
    <div className="admin-analytics">
      <header className="admin-analytics__head">
        <p className="admin-field-hint">
          本番プレイヤーのログ（Supabase）。localhost のテストは集計から除外しています。
        </p>
        <div className="admin-analytics__toolbar">
          <select
            className="admin-input--compact"
            value={range}
            onChange={(e) => setRange(e.target.value as RangeKey)}
          >
            <option value="today">今日</option>
            <option value="7d">直近7日</option>
            <option value="30d">直近30日</option>
            <option value="all">全期間</option>
          </select>
          <input
            type="password"
            className="admin-input--compact admin-analytics__password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            placeholder="管理パスワード（ローカルは未設定で可）"
          />
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={() => void load()}
            disabled={loading}
          >
            {loading ? '読込中…' : '再読込'}
          </button>
          {payload?.success ? (
            <button
              type="button"
              className="admin-btn"
              onClick={() =>
                downloadJson(`zyakudan-analytics-${range}-${Date.now()}.json`, payload)
              }
            >
              JSON
            </button>
          ) : null}
        </div>
      </header>

      {payload && !payload.success ? (
        <p className="admin-status admin-status--error">
          {payload.error ?? '取得失敗'} — {payload.message ?? 'Vercel の環境変数またはパスワードを確認'}
        </p>
      ) : null}

      {summary ? (
        <>
          <section className="admin-analytics__summary">
            <div className="admin-analytics__stat">
              <span>イベント</span>
              <strong>{summary.events}</strong>
            </div>
            <div className="admin-analytics__stat">
              <span>訪問者</span>
              <strong>{summary.visitors}</strong>
            </div>
            <div className="admin-analytics__stat">
              <span>タイトル</span>
              <strong>{summary.titleVisits}</strong>
            </div>
            <div className="admin-analytics__stat">
              <span>章開始</span>
              <strong>{summary.starts}</strong>
            </div>
            <div className="admin-analytics__stat">
              <span>完了</span>
              <strong>{summary.finishes}</strong>
            </div>
            <div className="admin-analytics__stat">
              <span>離脱</span>
              <strong>{summary.abandons}</strong>
            </div>
            <div className="admin-analytics__stat">
              <span>完了率</span>
              <strong>{summary.finishRate}%</strong>
            </div>
          </section>

          {(payload?.excludedLocal ?? 0) > 0 ? (
            <p className="admin-field-hint">
              localhost 由来 {payload?.excludedLocal} 件は集計・一覧から除外済み
            </p>
          ) : null}

          <section className="admin-card admin-card--compact">
            <h3 className="admin-card__title-sm">流入元集計</h3>
            {sources.length === 0 ? (
              <p className="admin-field-hint">
                <code>?r=</code> 付き URL からのアクセスがまだありません。
              </p>
            ) : (
              <div className="admin-analytics__table-wrap">
                <table className="admin-analytics__table admin-analytics__table--dense">
                  <thead>
                    <tr>
                      <th>流入</th>
                      <th>r</th>
                      <th>ct</th>
                      <th>訪問</th>
                      <th>開始</th>
                      <th>完了</th>
                      <th>率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sources.map((row) => (
                      <tr key={row.key} title={row.title}>
                        <td>{row.label}</td>
                        <td>{row.r ?? '—'}</td>
                        <td>{row.ct ?? '—'}</td>
                        <td>{row.titleVisits}</td>
                        <td>{row.starts}</td>
                        <td>{row.finishes}</td>
                        <td>{row.finishRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="admin-card admin-card--compact">
            <h3 className="admin-card__title-sm">プレイ一覧</h3>
            <div className="admin-analytics__table-wrap">
              <table className="admin-analytics__table admin-analytics__table--dense admin-analytics__table--plays">
                <thead>
                  <tr>
                    <th>日時</th>
                    <th>流入</th>
                    <th>章</th>
                    <th>点</th>
                    <th>完</th>
                    <th>選択</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {(payload?.plays ?? []).map((play) => (
                    <tr key={play.playId} title={play.sourceTitle ?? play.playId}>
                      <td className="admin-analytics__nowrap">{formatDt(play.lastAt)}</td>
                      <td>{play.sourceLabel ?? '—'}</td>
                      <td>{play.levelTitle ?? play.levelId ?? '—'}</td>
                      <td>{play.totalScore ?? '—'}</td>
                      <td>{play.finished ? '○' : `×${play.reachedQuestion}`}</td>
                      <td>
                        <span className="admin-analytics__choice-pills">
                          {play.answers.map((a) => (
                            <span
                              key={`${play.playId}-${a.questionIndex}`}
                              className="admin-analytics__choice-pill"
                              title={`${formatQuestionLabel(play.levelIndex, a.questionIndex)} → 選択${optionNum(a.optionIndex)}`}
                            >
                              {formatQuestionLabel(play.levelIndex, a.questionIndex)}:
                              {optionNum(a.optionIndex)}
                            </span>
                          ))}
                        </span>
                      </td>
                      <td className="admin-analytics__actions">
                        <button
                          type="button"
                          className="admin-btn admin-btn--danger admin-btn--xs"
                          disabled={deletingId === play.playId}
                          onClick={() => void deletePlay(play.playId)}
                        >
                          {deletingId === play.playId ? '…' : '削除'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="admin-card admin-card--compact">
            <h3 className="admin-card__title-sm">問題別</h3>
            <div className="admin-analytics__table-wrap">
              <table className="admin-analytics__table admin-analytics__table--dense">
                <thead>
                  <tr>
                    <th>問</th>
                    <th>n</th>
                    <th>均</th>
                    <th>低↑</th>
                    <th>離</th>
                  </tr>
                </thead>
                <tbody>
                  {(payload?.questions ?? []).map((q) => (
                    <tr key={`${q.levelId}-${q.questionIndex}`}>
                      <td>{formatQuestionLabel(q.levelIndex, q.questionIndex)}</td>
                      <td>{q.answers}</td>
                      <td>{q.avgScore ?? '—'}</td>
                      <td>
                        {q.topLowOption
                          ? `${q.topLowOption.optionIndex + 1}(${q.topLowOption.count})`
                          : '—'}
                      </td>
                      <td>{q.abandonsHere}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}

      {payload?.success && !summary ? (
        <p className="admin-field-hint">まだログがありません。本番 URL で1章プレイするとここに表示されます。</p>
      ) : null}
    </div>
  )
}
