import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createBackup,
  deleteBackup,
  listBackups,
  loadBackup,
  type BackupEntry,
} from '../data/backups'
import { loadBundledLevels, saveEditorContent } from '../data/loadLevels'
import { loadRanks } from '../data/loadRanks'
import { normalizeLevels } from '../data/normalizeLevels'
import { DEFAULT_RANKS, RANK_MIN_VALUES, normalizeRanks } from '../data/ranks'
import { LEVELS as DEFAULT_LEVELS } from '../data/questions'
import {
  BACKGROUND_SCENE_IDS,
  BACKGROUND_SCENES,
  inferBackgroundFromSituation,
} from '../data/backgrounds'
import { SCORE_VALUES, type ScoreValue } from '../data/scores'
import type {
  BackgroundSceneId,
  LevelPack,
  QuizOption,
  QuizQuestion,
  ScoreRank,
} from '../types'
import AdminAnalyticsPage from './AdminAnalyticsPage'
import AdminPromoPage from './AdminPromoPage'
import './Admin.css'

type AdminTab = 'edit' | 'ranks' | 'analytics' | 'promo'

function cloneRanks(ranks: ScoreRank[]): ScoreRank[] {
  return structuredClone(ranks)
}

function cloneLevels(levels: LevelPack[]): LevelPack[] {
  return structuredClone(levels)
}

function emptyOption(): QuizOption {
  return { text: '', score: 12, reaction: '', evaluation: '' }
}

function emptyQuestion(): QuizQuestion {
  return {
    background: 'station',
    situation: '',
    commonReview: '',
    options: [emptyOption(), emptyOption(), emptyOption(), emptyOption()],
    needsCheck: false,
  }
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminApp() {
  const [levels, setLevels] = useState<LevelPack[]>(() =>
    cloneLevels(normalizeLevels(DEFAULT_LEVELS)),
  )
  const [levelIndex, setLevelIndex] = useState(0)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [status, setStatus] = useState('')
  const [backups, setBackups] = useState<BackupEntry[]>(() => listBackups())
  const [ranks, setRanks] = useState<ScoreRank[]>(() => cloneRanks(DEFAULT_RANKS))
  const [adminTab, setAdminTab] = useState<AdminTab>('edit')
  const [ready, setReady] = useState(false)

  const level = levels[levelIndex]
  const question = level?.questions[questionIndex]

  const setStatusMsg = useCallback((msg: string) => {
    setStatus(msg)
    window.setTimeout(() => setStatus(''), 5000)
  }, [])

  const refreshBackups = useCallback(() => {
    setBackups(listBackups())
  }, [])

  useEffect(() => {
    void (async () => {
      const [bundled, rankData] = await Promise.all([loadBundledLevels(), loadRanks()])
      setLevels(cloneLevels(bundled))
      setRanks(cloneRanks(rankData))
      refreshBackups()
      setReady(true)
    })()
  }, [refreshBackups])

  const updateLevel = useCallback(
    (patch: Partial<LevelPack>) => {
      setLevels((prev) => {
        const next = cloneLevels(prev)
        next[levelIndex] = { ...next[levelIndex], ...patch }
        return next
      })
    },
    [levelIndex],
  )

  const updateQuestion = useCallback(
    (patch: Partial<QuizQuestion>) => {
      setLevels((prev) => {
        const next = cloneLevels(prev)
        const qs = [...next[levelIndex].questions]
        qs[questionIndex] = { ...qs[questionIndex], ...patch }
        next[levelIndex] = { ...next[levelIndex], questions: qs }
        return next
      })
    },
    [levelIndex, questionIndex],
  )

  const setQuestionNeedsCheck = useCallback(
    (li: number, qi: number, needsCheck: boolean) => {
      setLevels((prev) => {
        const next = cloneLevels(prev)
        const qs = [...next[li].questions]
        qs[qi] = { ...qs[qi], needsCheck }
        next[li] = { ...next[li], questions: qs }
        return next
      })
    },
    [],
  )

  const needsCheckCount = useMemo(
    () => levels.reduce((n, lv) => n + lv.questions.filter((q) => q.needsCheck).length, 0),
    [levels],
  )

  const updateOption = useCallback(
    (optIndex: number, patch: Partial<QuizOption>) => {
      setLevels((prev) => {
        const next = cloneLevels(prev)
        const q = { ...next[levelIndex].questions[questionIndex] }
        const opts = [...q.options] as QuizOption[]
        opts[optIndex] = { ...opts[optIndex], ...patch }
        q.options = opts as QuizQuestion['options']
        const qs = [...next[levelIndex].questions]
        qs[questionIndex] = q
        next[levelIndex] = { ...next[levelIndex], questions: qs }
        return next
      })
    },
    [levelIndex, questionIndex],
  )

  const addQuestion = useCallback(() => {
    setLevels((prev) => {
      const next = cloneLevels(prev)
      next[levelIndex].questions = [...next[levelIndex].questions, emptyQuestion()]
      return next
    })
    setQuestionIndex(level?.questions.length ?? 0)
  }, [level?.questions.length, levelIndex])

  const removeQuestion = useCallback(() => {
    if (!level || level.questions.length <= 1) return
    setLevels((prev) => {
      const next = cloneLevels(prev)
      next[levelIndex].questions = next[levelIndex].questions.filter(
        (_, i) => i !== questionIndex,
      )
      return next
    })
    setQuestionIndex((i) => Math.max(0, i - 1))
  }, [level, levelIndex, questionIndex])

  const addLevel = useCallback(() => {
    const id = `lv${levels.length + 1}`
    const newLevel: LevelPack = {
      id,
      title: `第${levels.length + 1}章：新しい章`,
      tagline: '',
      accent: '#ff7eb3',
      questions: [emptyQuestion()],
    }
    setLevels((prev) => [...prev, newLevel])
    setLevelIndex(levels.length)
    setQuestionIndex(0)
  }, [levels.length])

  const handleSave = useCallback(() => {
    void (async () => {
      const { backupLabel, published } = await saveEditorContent(levels, ranks)
      refreshBackups()
      if (published) {
        setStatusMsg(
          `保存しました。ゲームをリロード（F5）すると反映されます（バックアップ: ${backupLabel}）`,
        )
      } else {
        setStatusMsg(
          `バックアップのみ作成: ${backupLabel}（開発サーバー起動中に保存すると自動反映）`,
        )
      }
    })()
  }, [levels, ranks, refreshBackups, setStatusMsg])

  const updateRank = useCallback((index: number, patch: Partial<ScoreRank>) => {
    setRanks((prev) => {
      const next = cloneRanks(prev)
      next[index] = { ...next[index], ...patch }
      return normalizeRanks(next)
    })
  }, [])

  const addRank = useCallback(() => {
    setRanks((prev) =>
      normalizeRanks([...prev, { min: 0, title: '新しい称号', comment: '' }]),
    )
  }, [])

  const removeRank = useCallback((index: number) => {
    setRanks((prev) => {
      if (prev.length <= 1) return prev
      return normalizeRanks(prev.filter((_, i) => i !== index))
    })
  }, [])

  const handleBackupOnly = useCallback(() => {
    const label = createBackup(levels)
    refreshBackups()
    setStatusMsg(`バックアップを作成しました: ${label}`)
  }, [levels, refreshBackups, setStatusMsg])

  const restoreBackup = useCallback(
    (entry: BackupEntry) => {
      const data = loadBackup(entry.id)
      if (!data?.length) {
        setStatusMsg('バックアップの読み込みに失敗しました')
        refreshBackups()
        return
      }
      if (
        !window.confirm(
          `${entry.label} の内容を編集画面に戻しますか？\n（戻したあと「保存」→ ゲームをリロードで反映）`,
        )
      ) {
        return
      }
      setLevels(cloneLevels(data))
      setLevelIndex(0)
      setQuestionIndex(0)
      setStatusMsg(`${entry.label} を編集画面に読み込みました`)
    },
    [refreshBackups, setStatusMsg],
  )

  const handleDeleteBackup = useCallback(
    (entry: BackupEntry) => {
      if (!window.confirm(`${entry.label} のバックアップを削除しますか？`)) return
      deleteBackup(entry.id)
      refreshBackups()
      setStatusMsg('バックアップを削除しました')
    },
    [refreshBackups, setStatusMsg],
  )

  const exportJson = useCallback(() => {
    downloadJson('content.json', levels)
    downloadJson('ranks.json', ranks)
    setStatusMsg('content.json と ranks.json をダウンロードしました')
  }, [levels, ranks, setStatusMsg])

  const importJson = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json,.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const data = JSON.parse(text) as LevelPack[]
        if (!Array.isArray(data) || data.length === 0) throw new Error('empty')
        setLevels(cloneLevels(normalizeLevels(data)))
        setLevelIndex(0)
        setQuestionIndex(0)
        setStatusMsg('JSON を編集画面に読み込みました（反映は「保存」→ ゲームをリロード）')
      } catch {
        setStatusMsg('JSON の読み込みに失敗しました')
      }
    }
    input.click()
  }, [setStatusMsg])

  if (!ready) {
    return (
      <div className="admin-root">
        <p className="admin-loading">読み込み中…</p>
      </div>
    )
  }

  if (adminTab !== 'analytics' && (!level || !question)) {
    return (
      <div className="admin-root">
        <p>データがありません。「章を追加」してください。</p>
      </div>
    )
  }

  const backupPanel = (
    <section className="admin-backups admin-backups--compact" aria-label="バックアップ">
      {backups.length === 0 ? (
        <p className="admin-backups__line">バックアップなし（保存で自動作成）</p>
      ) : (
        <ul className="admin-backups__list">
          {backups.slice(0, 3).map((entry) => (
            <li key={entry.id} className="admin-backups__line">
              <span className="admin-backups__date">{entry.label}</span>
              <button
                type="button"
                className="admin-btn admin-btn--tiny"
                onClick={() => restoreBackup(entry)}
              >
                戻す
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--tiny admin-btn--danger"
                onClick={() => handleDeleteBackup(entry)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )

  return (
    <div className="admin-root">
      <header className="admin-header">
        <h1 className="admin-title">弱者男性を救え — 管理</h1>

        <nav className="admin-tabs" aria-label="管理メニュー">
          <button
            type="button"
            className={`admin-tab ${adminTab === 'edit' ? 'admin-tab--active' : ''}`}
            onClick={() => setAdminTab('edit')}
          >
            問題設定
          </button>
          <button
            type="button"
            className={`admin-tab ${adminTab === 'ranks' ? 'admin-tab--active' : ''}`}
            onClick={() => setAdminTab('ranks')}
          >
            称号設定
          </button>
          <button
            type="button"
            className={`admin-tab ${adminTab === 'analytics' ? 'admin-tab--active' : ''}`}
            onClick={() => setAdminTab('analytics')}
          >
            プレイ履歴
          </button>
          <button
            type="button"
            className={`admin-tab ${adminTab === 'promo' ? 'admin-tab--active' : ''}`}
            onClick={() => setAdminTab('promo')}
          >
            流入元 / URL
          </button>
        </nav>

        {adminTab === 'edit' ? (
          <div className="admin-toolbar">
            <p className="admin-toolbar__hint">
              保存で content.json / ranks.json を更新。ゲーム確認は別タブで localhost を開いて F5。
            </p>
            <div className="admin-toolbar__actions">
              <button type="button" className="admin-btn admin-btn--primary" onClick={handleSave}>
                保存
              </button>
              <button type="button" className="admin-btn" onClick={handleBackupOnly}>
                バックアップ
              </button>
              <button type="button" className="admin-btn" onClick={exportJson}>
                JSON エクスポート
              </button>
              <button type="button" className="admin-btn" onClick={importJson}>
                JSON インポート
              </button>
            </div>
            {backupPanel}
          </div>
        ) : null}

        {adminTab === 'ranks' ? (
          <div className="admin-toolbar">
            <p className="admin-toolbar__hint">称号は ranks.json に保存されます。保存で本番データに反映。</p>
            <div className="admin-toolbar__actions">
              <button type="button" className="admin-btn admin-btn--primary" onClick={handleSave}>
                保存
              </button>
              <button type="button" className="admin-btn" onClick={handleBackupOnly}>
                バックアップ
              </button>
            </div>
            {backupPanel}
          </div>
        ) : null}

        {status ? <p className="admin-status">{status}</p> : null}
      </header>

      {adminTab === 'analytics' ? (
        <main className="admin-main admin-main--full">
          <AdminAnalyticsPage />
        </main>
      ) : adminTab === 'promo' ? (
        <main className="admin-main admin-main--full">
          <AdminPromoPage />
        </main>
      ) : adminTab === 'ranks' ? (
        <main className="admin-main admin-main--full">
          <section className="admin-card">
            <div className="admin-card-head">
              <h2>章末称号（5問合計100点満点）</h2>
              <button type="button" className="admin-btn admin-btn--small" onClick={addRank}>
                ＋ 称号を追加
              </button>
            </div>
            <p className="admin-field-hint">
              章の5問<strong>合計点（0〜100・10点刻み）</strong>が「下限」以上のとき、その称号になります。合計の大きい称号から判定（エンディングで「あなたは〜」と表示）。
            </p>
            <ul className="admin-rank-list">
              {[...ranks]
                .sort((a, b) => a.min - b.min)
                .map((row) => {
                  const index = ranks.indexOf(row)
                  return (
                    <li key={`${row.min}-${row.title}-${index}`} className="admin-rank-row">
                      <label className="admin-field admin-field--rank-min">
                        <span>下限（合計）</span>
                        <select
                          className="admin-input--compact"
                          value={row.min}
                          onChange={(e) =>
                            updateRank(index, { min: Number(e.target.value) })
                          }
                        >
                          {RANK_MIN_VALUES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="admin-field admin-field--grow">
                        <span>称号</span>
                        <input
                          className="admin-input--compact"
                          value={row.title}
                          onChange={(e) => updateRank(index, { title: e.target.value })}
                        />
                      </label>
                      <label className="admin-field admin-field--grow2">
                        <span>コメント（エンディング）</span>
                        <input
                          className="admin-input--compact"
                          value={row.comment}
                          onChange={(e) => updateRank(index, { comment: e.target.value })}
                        />
                      </label>
                      <button
                        type="button"
                        className="admin-btn admin-btn--small admin-btn--danger"
                        onClick={() => removeRank(index)}
                        disabled={ranks.length <= 1}
                      >
                        削除
                      </button>
                    </li>
                  )
                })}
            </ul>
          </section>
        </main>
      ) : (
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-head">
            <h2>
              目次
              {needsCheckCount > 0 ? (
                <span className="admin-sidebar-head__flag">要{needsCheckCount}</span>
              ) : null}
            </h2>
            <button
              type="button"
              className="admin-btn admin-btn--small"
              title="章を追加"
              onClick={addLevel}
            >
              ＋章
            </button>
          </div>

          <nav className="admin-tree" aria-label="章と問題">
            {levels.map((lv, li) => (
              <div key={lv.id} className="admin-tree-chapter">
                <p className="admin-tree-chapter__title">{li + 1}章</p>
                <ul className="admin-tree-questions">
                  {lv.questions.map((q, qi) => {
                    const active = li === levelIndex && qi === questionIndex
                    return (
                      <li key={qi} className="admin-tree-q">
                        <label
                          className="admin-q-check"
                          title="要チェック"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(q.needsCheck)}
                            onChange={(e) => {
                              setQuestionNeedsCheck(li, qi, e.target.checked)
                            }}
                          />
                          <span className="admin-q-check__mark" aria-hidden />
                        </label>
                        <button
                          type="button"
                          className={`admin-tree-q__btn ${active ? 'admin-tree-q__btn--active' : ''} ${
                            q.needsCheck ? 'admin-tree-q__btn--needs-check' : ''
                          }`}
                          onClick={() => {
                            setLevelIndex(li)
                            setQuestionIndex(qi)
                          }}
                        >
                          Q{li + 1}-{qi + 1}
                        </button>
                      </li>
                    )
                  })}
                </ul>
                {li === levelIndex ? (
                  <button
                    type="button"
                    className="admin-tree-add-q"
                    onClick={addQuestion}
                  >
                    ＋ Q{li + 1}-{lv.questions.length + 1}
                  </button>
                ) : null}
              </div>
            ))}
          </nav>
        </aside>

        <main className="admin-main">
          {level && question ? (
            <>
          <section className="admin-card admin-card--compact">
            <div className="admin-level-row">
              <label className="admin-field admin-field--inline">
                <span>ID</span>
                <input
                  className="admin-input--compact"
                  value={level.id}
                  onChange={(e) => updateLevel({ id: e.target.value })}
                />
              </label>
              <label className="admin-field admin-field--inline admin-field--grow">
                <span>タイトル</span>
                <input
                  className="admin-input--compact"
                  value={level.title}
                  onChange={(e) => updateLevel({ title: e.target.value })}
                />
              </label>
              <label className="admin-field admin-field--inline admin-field--grow2">
                <span>タグライン</span>
                <input
                  className="admin-input--compact"
                  value={level.tagline}
                  onChange={(e) => updateLevel({ tagline: e.target.value })}
                />
              </label>
              <label className="admin-field admin-field--inline admin-field--color">
                <span>色</span>
                <input
                  type="color"
                  value={level.accent}
                  onChange={(e) => updateLevel({ accent: e.target.value })}
                />
              </label>
              <label className="admin-field admin-field--inline admin-field--diff">
                <span>難易度</span>
                <select
                  className="admin-input--compact"
                  value={level.difficulty ?? 2}
                  onChange={(e) =>
                    updateLevel({ difficulty: Number(e.target.value) })
                  }
                >
                  {[0, 0.5, 1, 1.5, 2, 2.5, 3].map((d) => (
                    <option key={d} value={d}>
                      {d}/3
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="admin-card admin-card--compact">
            <div className="admin-card-head">
              <h2>
                Q{levelIndex + 1}-{questionIndex + 1}
                <span className="admin-card-head__sub">
                  （{level.title}・{questionIndex + 1}/{level.questions.length}）
                </span>
                {question.needsCheck ? (
                  <span className="admin-needs-check-badge">要チェック</span>
                ) : null}
              </h2>
              <button
                type="button"
                className="admin-btn admin-btn--danger admin-btn--small"
                onClick={removeQuestion}
                disabled={level.questions.length <= 1}
              >
                削除
              </button>
            </div>

            <label className="admin-field admin-field--background">
              <span>背景</span>
              <select
                className="admin-input admin-input--compact"
                value={question.background}
                onChange={(e) =>
                  updateQuestion({ background: e.target.value as BackgroundSceneId })
                }
              >
                {BACKGROUND_SCENE_IDS.map((id) => (
                  <option key={id} value={id}>
                    {BACKGROUND_SCENES[id].label}
                  </option>
                ))}
              </select>
              <p className="admin-field-hint">
                プレイ画面の背景画像。シチュ変更時は
                <button
                  type="button"
                  className="admin-link-btn"
                  onClick={() =>
                    updateQuestion({
                      background: inferBackgroundFromSituation(question.situation),
                    })
                  }
                >
                  文面から推定
                </button>
              </p>
            </label>

            <label className="admin-field admin-field--full">
              <span>シチュエーション（最大5行）</span>
              <p className="admin-field-hint">1行＝ナレーション1行。Enterで改行</p>
              <textarea
                className="admin-textarea--situation"
                rows={5}
                value={question.situation}
                onChange={(e) => updateQuestion({ situation: e.target.value })}
              />
            </label>

            <div className="admin-options-grid" role="group" aria-label="選択肢4つ">
              {question.options.map((opt, i) => (
                <div key={i} className="admin-option-col">
                  <p className="admin-option-col__label">選択肢 {i + 1}</p>
                  <label className="admin-field admin-field--full">
                    <span>台詞</span>
                    <p className="admin-field-hint">
                      文中の「台詞」で最大3行（前・台詞・後）。前後の強調は{' '}
                      <code>[gold]いまに戻す[/gold]</code>
                    </p>
                    <textarea
                      className="admin-textarea--choice"
                      rows={2}
                      value={opt.text}
                      onChange={(e) => updateOption(i, { text: e.target.value })}
                    />
                  </label>
                  <label className="admin-field admin-field--score">
                    <span>点数</span>
                    <select
                      className="admin-input--compact"
                      value={opt.score}
                      onChange={(e) =>
                        updateOption(i, { score: Number(e.target.value) as ScoreValue })
                      }
                    >
                      {SCORE_VALUES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="admin-field admin-field--full">
                    <span>終わった後のセリフ</span>
                    <textarea
                      className="admin-textarea--short"
                      rows={2}
                      value={opt.reaction}
                      onChange={(e) => updateOption(i, { reaction: e.target.value })}
                    />
                  </label>
                  <label className="admin-field admin-field--full">
                    <span>回答の評価</span>
                    <textarea
                      className="admin-textarea--evaluation"
                      rows={4}
                      value={opt.evaluation}
                      onChange={(e) => updateOption(i, { evaluation: e.target.value })}
                      placeholder="短く（例：自売りに見える）"
                    />
                  </label>
                </div>
              ))}
            </div>

            <label className="admin-field admin-field--full admin-field--review">
              <span>講評（4択共通・先頭の ## 見出しは表示時に省略可）</span>
              <p className="admin-field-hint">
                長文OK。書式: <code>## </code>見出し / <code>**太字**</code> /{' '}
                <code>[rose]…[/rose]</code> など
              </p>
              <textarea
                className="admin-textarea--review"
                rows={10}
                value={question.commonReview}
                onChange={(e) => updateQuestion({ commonReview: e.target.value })}
                placeholder={'4択に共通する学び（任意で ## 見出しから始めても可）'}
              />
            </label>
          </section>
            </>
          ) : null}
        </main>
      </div>
      )}
    </div>
  )
}
