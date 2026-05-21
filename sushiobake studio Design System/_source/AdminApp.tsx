import { useCallback, useState } from 'react'
import {
  clearPreviewLevels,
  loadPreviewLevels,
  savePreviewLevels,
} from '../data/loadLevels'
import { LEVELS as DEFAULT_LEVELS } from '../data/questions'
import type { LevelPack, QuizOption, QuizQuestion, ScoreValue } from '../types'
import './Admin.css'

const SCORE_OPTIONS: ScoreValue[] = [100, 80, 60, 20]

function cloneLevels(levels: LevelPack[]): LevelPack[] {
  return structuredClone(levels)
}

function emptyOption(): QuizOption {
  return { text: '', score: 60, reaction: '', afterScoreLine: '' }
}

function emptyQuestion(): QuizQuestion {
  return {
    situation: '',
    options: [emptyOption(), emptyOption(), emptyOption(), emptyOption()],
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
    cloneLevels(loadPreviewLevels() ?? DEFAULT_LEVELS),
  )
  const [levelIndex, setLevelIndex] = useState(0)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [status, setStatus] = useState('')
  const [previewActive, setPreviewActive] = useState(() => !!loadPreviewLevels())

  const level = levels[levelIndex]
  const question = level?.questions[questionIndex]

  const setStatusMsg = useCallback((msg: string) => {
    setStatus(msg)
    window.setTimeout(() => setStatus(''), 4000)
  }, [])

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

  const applyPreview = useCallback(() => {
    savePreviewLevels(levels)
    setPreviewActive(true)
    setStatusMsg('プレビューを保存しました。ゲームを別タブで開いて確認してください')
  }, [levels, setStatusMsg])

  const exportJson = useCallback(() => {
    downloadJson('content.json', levels)
    setStatusMsg('content.json をダウンロードしました → public/ に置くと本番に反映されます')
  }, [levels, setStatusMsg])

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
        setLevels(cloneLevels(data))
        setLevelIndex(0)
        setQuestionIndex(0)
        setStatusMsg('JSON を読み込みました')
      } catch {
        setStatusMsg('JSON の読み込みに失敗しました')
      }
    }
    input.click()
  }, [setStatusMsg])

  const resetDefault = useCallback(() => {
    if (!window.confirm('編集内容を破棄して、同梱のデフォルトデータに戻しますか？')) return
    setLevels(cloneLevels(DEFAULT_LEVELS))
    clearPreviewLevels()
    setPreviewActive(false)
    setLevelIndex(0)
    setQuestionIndex(0)
    setStatusMsg('デフォルトに戻しました')
  }, [setStatusMsg])

  const clearPreview = useCallback(() => {
    clearPreviewLevels()
    setPreviewActive(false)
    setStatusMsg('プレビュー（localStorage）をクリアしました')
  }, [setStatusMsg])

  if (!level || !question) {
    return (
      <div className="admin-root">
        <p>データがありません。「章を追加」してください。</p>
      </div>
    )
  }

  return (
    <div className="admin-root">
      <header className="admin-header">
        <div>
          <h1 className="admin-title">弱者男性を救え — 管理画面</h1>
          <p className="admin-subtitle">
            シチュエーション・選択肢を編集 → プレビュー → JSON を public/content.json に配置
          </p>
        </div>
        <nav className="admin-header-actions">
          <a className="admin-btn admin-btn--ghost" href="#/">
            ゲームへ
          </a>
          <button type="button" className="admin-btn admin-btn--primary" onClick={applyPreview}>
            ゲームでプレビュー
          </button>
          <button type="button" className="admin-btn" onClick={exportJson}>
            JSON エクスポート
          </button>
          <button type="button" className="admin-btn" onClick={importJson}>
            JSON インポート
          </button>
          <button type="button" className="admin-btn" onClick={resetDefault}>
            デフォルトに戻す
          </button>
          <button type="button" className="admin-btn admin-btn--muted" onClick={clearPreview}>
            プレビュー解除
          </button>
        </nav>
        {status ? <p className="admin-status">{status}</p> : null}
        {previewActive ? (
          <p className="admin-badge">プレビューデータが有効です（ゲームは localStorage を優先）</p>
        ) : null}
      </header>

      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-section">
            <div className="admin-sidebar-head">
              <h2>章</h2>
              <button type="button" className="admin-btn admin-btn--small" onClick={addLevel}>
                ＋
              </button>
            </div>
            <ul className="admin-list">
              {levels.map((lv, i) => (
                <li key={lv.id}>
                  <button
                    type="button"
                    className={`admin-list-btn ${i === levelIndex ? 'admin-list-btn--active' : ''}`}
                    onClick={() => {
                      setLevelIndex(i)
                      setQuestionIndex(0)
                    }}
                  >
                    {lv.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="admin-sidebar-section">
            <div className="admin-sidebar-head">
              <h2>問題（{level.questions.length}）</h2>
              <button type="button" className="admin-btn admin-btn--small" onClick={addQuestion}>
                ＋
              </button>
            </div>
            <ul className="admin-list">
              {level.questions.map((q, i) => (
                <li key={i}>
                  <button
                    type="button"
                    className={`admin-list-btn ${i === questionIndex ? 'admin-list-btn--active' : ''}`}
                    onClick={() => setQuestionIndex(i)}
                  >
                    Q{i + 1}: {q.situation.slice(0, 28) || '（未入力）'}
                    {q.situation.length > 28 ? '…' : ''}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className="admin-main">
          <section className="admin-card">
            <h2>章の設定</h2>
            <div className="admin-grid">
              <label className="admin-field">
                <span>ID</span>
                <input
                  value={level.id}
                  onChange={(e) => updateLevel({ id: e.target.value })}
                />
              </label>
              <label className="admin-field">
                <span>タイトル</span>
                <input
                  value={level.title}
                  onChange={(e) => updateLevel({ title: e.target.value })}
                />
              </label>
              <label className="admin-field admin-field--full">
                <span>タグライン</span>
                <input
                  value={level.tagline}
                  onChange={(e) => updateLevel({ tagline: e.target.value })}
                />
              </label>
              <label className="admin-field">
                <span>アクセント色</span>
                <input
                  type="color"
                  value={level.accent}
                  onChange={(e) => updateLevel({ accent: e.target.value })}
                />
              </label>
            </div>
          </section>

          <section className="admin-card">
            <div className="admin-card-head">
              <h2>
                問題 {questionIndex + 1} / {level.questions.length}
              </h2>
              <button
                type="button"
                className="admin-btn admin-btn--danger admin-btn--small"
                onClick={removeQuestion}
                disabled={level.questions.length <= 1}
              >
                この問題を削除
              </button>
            </div>
            <label className="admin-field admin-field--full">
              <span>シチュエーション（ナレーション）</span>
              <textarea
                rows={4}
                value={question.situation}
                onChange={(e) => updateQuestion({ situation: e.target.value })}
              />
            </label>
          </section>

          <section className="admin-card">
            <h2>選択肢（4つ）</h2>
            <div className="admin-options">
              {question.options.map((opt, i) => (
                <div key={i} className="admin-option-block">
                  <h3>選択肢 {i + 1}</h3>
                  <label className="admin-field admin-field--full">
                    <span>台詞（彼に言わせる）</span>
                    <textarea
                      rows={2}
                      value={opt.text}
                      onChange={(e) => updateOption(i, { text: e.target.value })}
                    />
                  </label>
                  <label className="admin-field">
                    <span>点数</span>
                    <select
                      value={opt.score}
                      onChange={(e) =>
                        updateOption(i, { score: Number(e.target.value) as ScoreValue })
                      }
                    >
                      {SCORE_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s} 点
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="admin-field admin-field--full">
                    <span>彼女の反応（セリフ）</span>
                    <textarea
                      rows={2}
                      value={opt.reaction}
                      onChange={(e) => updateOption(i, { reaction: e.target.value })}
                    />
                  </label>
                  <label className="admin-field admin-field--full">
                    <span>講評（点数表示後）</span>
                    <textarea
                      rows={2}
                      value={opt.afterScoreLine}
                      onChange={(e) => updateOption(i, { afterScoreLine: e.target.value })}
                    />
                  </label>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
