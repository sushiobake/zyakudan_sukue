import { useCallback, useEffect, useState } from 'react'

type RangeKey = 'today' | '7d' | '30d' | 'all'

type AnalyticsResponse = {
  success: boolean
  error?: string
  message?: string
  range?: string
  loaded?: number
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
  daily?: Array<{
    day: string
    events: number
    visitors: number
    plays: number
    titleVisits: number
    starts: number
    finishes: number
    abandons: number
    finishRate: number
  }>
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
    levelTitle: string | null
    firstAt: string
    lastAt: string
    answerCount: number
    reachedQuestion: number
    finished: boolean
    totalScore: number | null
    rankTitle: string | null
    endReason: string | null
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

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState<RangeKey>('7d')
  const [adminPassword, setAdminPassword] = useState('')
  const [loading, setLoading] = useState(false)
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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(timer)
    // フィルタ変更時の再取得。setTimeout で lint の同期 setState 警告を避ける
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load は adminPassword/range を内包
  }, [range, adminPassword])

  const summary = payload?.summary

  return (
    <div className="admin-analytics">
      <header className="admin-analytics__head">
        <div>
          <h2>プレイ履歴 / 分析</h2>
          <p className="admin-field-hint">
            本番プレイヤーのログ（Supabase）。.env.local に SUPABASE_URL と service_role 鍵を設定してください。
          </p>
        </div>
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
          <button type="button" className="admin-btn admin-btn--primary" onClick={() => void load()} disabled={loading}>
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
              JSON エクスポート
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
              <span>タイトル訪問</span>
              <strong>{summary.titleVisits}</strong>
            </div>
            <div className="admin-analytics__stat">
              <span>章開始</span>
              <strong>{summary.starts}</strong>
            </div>
            <div className="admin-analytics__stat">
              <span>章完了</span>
              <strong>{summary.finishes}</strong>
            </div>
            <div className="admin-analytics__stat">
              <span>途中離脱</span>
              <strong>{summary.abandons}</strong>
            </div>
            <div className="admin-analytics__stat">
              <span>完了率</span>
              <strong>{summary.finishRate}%</strong>
            </div>
          </section>

          <section className="admin-card">
            <h3>問題別（平均点・低得点で多い選択肢）</h3>
            <div className="admin-analytics__table-wrap">
              <table className="admin-analytics__table">
                <thead>
                  <tr>
                    <th>章</th>
                    <th>問</th>
                    <th>回答数</th>
                    <th>平均点</th>
                    <th>低得点↑選択</th>
                    <th>離脱</th>
                  </tr>
                </thead>
                <tbody>
                  {(payload?.questions ?? []).map((q) => (
                    <tr key={`${q.levelId}-${q.questionIndex}`}>
                      <td>{q.levelId ?? '—'}</td>
                      <td>{q.questionIndex}</td>
                      <td>{q.answers}</td>
                      <td>{q.avgScore ?? '—'}</td>
                      <td>
                        {q.topLowOption
                          ? `#${q.topLowOption.optionIndex + 1}（${q.topLowOption.count}回）`
                          : '—'}
                      </td>
                      <td>{q.abandonsHere}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="admin-card">
            <h3>プレイ一覧（新しい順・最大500件）</h3>
            <div className="admin-analytics__table-wrap">
              <table className="admin-analytics__table admin-analytics__table--plays">
                <thead>
                  <tr>
                    <th>日時</th>
                    <th>章</th>
                    <th>合計</th>
                    <th>称号</th>
                    <th>完了</th>
                    <th>各問</th>
                  </tr>
                </thead>
                <tbody>
                  {(payload?.plays ?? []).map((play) => (
                    <tr key={play.playId}>
                      <td>{formatDt(play.lastAt)}</td>
                      <td>{play.levelTitle ?? play.levelId ?? '—'}</td>
                      <td>{play.totalScore ?? '—'}</td>
                      <td>{play.rankTitle ?? '—'}</td>
                      <td>{play.finished ? '○' : `×（${play.reachedQuestion}問まで）`}</td>
                      <td>
                        <ul className="admin-analytics__answers">
                          {play.answers.map((a) => (
                            <li key={`${play.playId}-q${a.questionIndex}`}>
                              Q{a.questionIndex}: {a.score ?? '—'}点
                              {a.optionIndex != null ? ` / 選択${a.optionIndex + 1}` : ''}
                              {a.choiceText ? (
                                <span className="admin-analytics__choice-snippet"> {a.choiceText}</span>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </td>
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
