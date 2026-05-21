import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import { BACKGROUND_FALLBACK, HAIKEI_BACKGROUNDS } from '../data/backgrounds'
import { loadLevels } from '../data/loadLevels'
import { getScoreRank } from '../data/ranks'
import { shuffle } from '../data/shuffle'
import { CHARA_SHEET_SIZE, CHARA_SHEET_SRC, type CharaPose } from '../data/sprite'
import type { LevelPack, QuizOption, QuizQuestion } from '../types'
import '../App.css'

type QuizPhase = 'situation' | 'choices' | 'reaction' | 'score'
type Screen = 'title' | 'quiz' | 'final' | 'loading'

const QUESTIONS_PER_RUN = 5
const HEROINE_NAME = '由良 さくら'

function resolveCharaPose(
  screen: Screen,
  quizPhase: QuizPhase,
  picked: QuizOption | null,
): CharaPose {
  if (screen !== 'quiz') return 1
  if (quizPhase === 'situation' || quizPhase === 'choices') return 1
  const s = picked?.score
  if (s == null) return 1
  if (s >= 80) return 2
  if (s >= 60) return 3
  return 4
}

function buildShareText(level: LevelPack, total: number, max: number): string {
  const pct = max > 0 ? Math.round((total / max) * 100) : 0
  const rank = getScoreRank(total, max)
  return `弱者男性を救え！（神視点）\n${level.title}\n${rank.title}：${total} / ${max} 点（${pct}%）\n#弱者男性を救え`
}

function pickRunQuestions(questions: QuizQuestion[]): QuizQuestion[] {
  const pool = shuffle(questions)
  return pool.slice(0, QUESTIONS_PER_RUN)
}

type ActiveLevel = LevelPack & { runQuestions: QuizQuestion[] }

export default function GameApp() {
  const [levels, setLevels] = useState<LevelPack[]>([])
  const [screen, setScreen] = useState<Screen>('loading')
  const [level, setLevel] = useState<ActiveLevel | null>(null)
  const [qIndex, setQIndex] = useState(0)
  const [quizPhase, setQuizPhase] = useState<QuizPhase>('situation')
  const [picked, setPicked] = useState<QuizOption | null>(null)
  const [scores, setScores] = useState<number[]>([])

  useEffect(() => {
    let cancelled = false
    loadLevels().then((data) => {
      if (cancelled) return
      setLevels(data)
      setScreen('title')
    })
    return () => {
      cancelled = true
    }
  }, [])

  const question = useMemo(() => {
    if (!level) return null
    return level.runQuestions[qIndex] ?? null
  }, [level, qIndex])

  const resetToTitle = useCallback(() => {
    setScreen('title')
    setLevel(null)
    setQIndex(0)
    setQuizPhase('situation')
    setPicked(null)
    setScores([])
  }, [])

  const startLevel = useCallback((pack: LevelPack) => {
    const runQuestions = pickRunQuestions(pack.questions)
    setLevel({ ...pack, runQuestions })
    setQIndex(0)
    setQuizPhase('situation')
    setPicked(null)
    setScores([])
    setScreen('quiz')
  }, [])

  const advanceFromSituation = useCallback(() => {
    setQuizPhase('choices')
  }, [])

  const pickOption = useCallback((opt: QuizOption) => {
    setPicked(opt)
    setQuizPhase('reaction')
  }, [])

  const advanceFromReaction = useCallback(() => {
    setQuizPhase('score')
  }, [])

  const advanceFromScore = useCallback(() => {
    if (!picked) return
    setScores((prev) => [...prev, picked.score])
    if (qIndex + 1 < QUESTIONS_PER_RUN) {
      setQIndex((i) => i + 1)
      setPicked(null)
      setQuizPhase('situation')
    } else {
      setScreen('final')
    }
  }, [picked, qIndex])

  const totalScore = useMemo(() => scores.reduce((a, b) => a + b, 0), [scores])
  const maxScore = QUESTIONS_PER_RUN * 100
  const rank = useMemo(
    () => getScoreRank(totalScore, maxScore),
    [totalScore, maxScore],
  )

  const shareUrl = useMemo(() => {
    const origin =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : ''
    const text =
      level != null ? buildShareText(level, totalScore, maxScore) : ''
    const params = new URLSearchParams({ text, url: origin })
    return `https://twitter.com/intent/tweet?${params.toString()}`
  }, [level, totalScore, maxScore])

  const charaPose = useMemo(
    () => resolveCharaPose(screen, quizPhase, picked),
    [screen, quizPhase, picked],
  )
  const advClickable =
    screen === 'quiz' &&
    (quizPhase === 'situation' ||
      quizPhase === 'reaction' ||
      quizPhase === 'score')

  const onAdvActivate = useCallback(() => {
    if (quizPhase === 'situation') advanceFromSituation()
    else if (quizPhase === 'reaction') advanceFromReaction()
    else if (quizPhase === 'score') advanceFromScore()
  }, [quizPhase, advanceFromSituation, advanceFromReaction, advanceFromScore])

  const speakerName = useMemo(() => {
    if (screen !== 'quiz' || !question) return ''
    switch (quizPhase) {
      case 'situation':
        return 'ナレーション'
      case 'choices':
        return 'プレイヤー（神）'
      case 'reaction':
        return HEROINE_NAME
      case 'score':
        return '講評'
      default:
        return ''
    }
  }, [screen, quizPhase, question])

  const advBodyText = useMemo(() => {
    if (screen !== 'quiz' || !question) return ''
    switch (quizPhase) {
      case 'situation':
        return question.situation
      case 'choices':
        return '彼に言わせる台詞を選ぶ。'
      case 'reaction':
        return picked ? `「${picked.reaction}」` : ''
      case 'score':
        return picked ? picked.afterScoreLine : ''
      default:
        return ''
    }
  }, [screen, quizPhase, question, picked])

  const showScoreBig = quizPhase === 'score' && picked

  const desiredBackground = useMemo(() => {
    if (screen === 'title' || screen === 'loading') return HAIKEI_BACKGROUNDS[0]
    if (screen === 'quiz')
      return HAIKEI_BACKGROUNDS[qIndex % HAIKEI_BACKGROUNDS.length]
    if (screen === 'final')
      return HAIKEI_BACKGROUNDS[qIndex % HAIKEI_BACKGROUNDS.length]
    return HAIKEI_BACKGROUNDS[0]
  }, [screen, qIndex])

  const [bgFailedUrl, setBgFailedUrl] = useState<string | null>(null)
  const bgSrc =
    bgFailedUrl === desiredBackground
      ? BACKGROUND_FALLBACK
      : desiredBackground

  const onBgError = useCallback(() => {
    setBgFailedUrl(desiredBackground)
  }, [desiredBackground])

  const onAdvKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!advClickable) return
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onAdvActivate()
      }
    },
    [advClickable, onAdvActivate],
  )

  if (screen === 'loading') {
    return (
      <div className="vn-root vn-root--loading">
        <p className="vn-loading-text">読み込み中…</p>
      </div>
    )
  }

  return (
    <div
      className={`vn-root vn-root--${screen}`}
      data-phase={screen === 'quiz' ? quizPhase : undefined}
      data-score={screen === 'quiz' && picked ? picked.score : undefined}
    >
      <div className="vn-bg" aria-hidden>
        <img
          className="vn-bg-img"
          src={bgSrc}
          alt=""
          width={1920}
          height={1080}
          decoding="async"
          onError={onBgError}
        />
        <div className="vn-bg-bloom" />
        <div className="vn-bg-vignette" />
        <div className="vn-bg-scanlines" />
        <div className="vn-bg-grain" />
      </div>

      {screen === 'title' && (
        <div className="vn-title-screen">
          <div className="vn-title-brand">
            <p className="vn-title-eyebrow">恋愛クイズADV / ブラウザ版</p>
            <h1 className="vn-title-heading">
              弱者男性を救え！
              <span className="vn-title-subheading">
                “リアル”恋愛シミュレーション
              </span>
            </h1>
            <p className="vn-title-lead">
              あなたは神視点。目の前の彼を、現場の空気ごとひっくり返す。
              <br />
              選択 → 彼女の反応 → 採点、を5シーン繰り返す短編ADVだ。
            </p>
          </div>
          <nav className="vn-title-menu" aria-label="章の選択">
            {levels.map((pack, i) => (
              <button
                key={pack.id}
                type="button"
                className="vn-menu-btn"
                onClick={() => startLevel(pack)}
              >
                <span className="vn-menu-btn__k">{String(i + 1).padStart(2, '0')}</span>
                <span className="vn-menu-btn__t">{pack.title}</span>
                <span className="vn-menu-btn__d">{pack.tagline}</span>
              </button>
            ))}
            <p className="vn-title-foot">
              クリックで開始 · 音声なし · フィクション作品です
              <br />
              <a className="vn-title-admin-link" href="#/admin">
                管理画面（シチュ・選択肢の編集）
              </a>
            </p>
            <p className="vn-title-disclaimer">
              特定の個人・集団を揶揄する意図はありません。恋愛コミュニケーション学習を目的としたフィクションです。
            </p>
          </nav>
        </div>
      )}

      {screen === 'quiz' && level && question && (
        <>
          <div className="vn-sprite-layer">
            <div className="vn-sprite-shadow" aria-hidden />
            <div className="vn-sprite-glow">
              <div className="vn-sprite-frame">
                <img
                  className={`vn-sprite-sheet vn-sprite-sheet--${charaPose}`}
                  src={CHARA_SHEET_SRC}
                  alt={`${HEROINE_NAME}（表情差分 ${charaPose}）`}
                  width={CHARA_SHEET_SIZE.w}
                  height={CHARA_SHEET_SIZE.h}
                  decoding="async"
                />
              </div>
            </div>
          </div>

          <div className="vn-hud vn-hud--tr" aria-label="システム">
            <div className="vn-hud-pill">
              <span className="vn-hud-pill__scene">
                SCENE {qIndex + 1}/{QUESTIONS_PER_RUN}
              </span>
              <span className="vn-hud-pill__chapter">{level.title}</span>
            </div>
          </div>

          <div className="vn-hud vn-hud--br" aria-label="操作">
            {advClickable ? (
              <span className="vn-hud-hint">
                <span className="vn-hud-hint__key">▼</span>
                {quizPhase === 'score'
                  ? qIndex + 1 < QUESTIONS_PER_RUN
                    ? 'NEXT'
                    : 'RESULT'
                  : 'CLICK'}
              </span>
            ) : null}
            <button type="button" className="vn-hud-hint vn-hud-hint--btn" onClick={resetToTitle}>
              TITLE
            </button>
          </div>

          <div className="vn-adv-stack">
            {quizPhase === 'choices' && (
              <div className="vn-choice-overlay" role="dialog" aria-label="選択肢">
                <p className="vn-choice-overlay__caption">COMMAND SELECT</p>
                <ul className="vn-choice-list">
                  {question.options.map((opt, i) => (
                    <li key={`${qIndex}-${i}-${opt.text.slice(0, 12)}`}>
                      <button
                        type="button"
                        className="vn-choice-row"
                        onClick={() => pickOption(opt)}
                      >
                        <span className="vn-choice-row__idx">{i + 1}</span>
                        <span className="vn-choice-row__txt">{opt.text}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="vn-adv-anchor">
              <div
                className={`vn-adv-window vn-adv-window--${quizPhase} ${advClickable ? 'vn-adv-window--clickable' : ''}`}
                role={advClickable ? 'button' : undefined}
                tabIndex={advClickable ? 0 : undefined}
                onClick={advClickable ? onAdvActivate : undefined}
                onKeyDown={advClickable ? onAdvKeyDown : undefined}
              >
                {speakerName ? (
                  <div className="vn-name-tag">
                    <span className="vn-name-tag__inner">{speakerName}</span>
                  </div>
                ) : null}
                <div className="vn-adv-window__body">
                  {showScoreBig && picked ? (
                    <div className="vn-score-inline">
                      <p className="vn-score-inline__num">{picked.score}</p>
                      <p className="vn-score-inline__unit">点</p>
                    </div>
                  ) : null}
                  <p className="vn-dialog-text">{advBodyText}</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {screen === 'final' && level && (
        <div className="vn-ending-screen">
          <div className="vn-ending-card">
            <p className="vn-ending-ribbon">ENDING</p>
            <p className="vn-ending-rank">{rank.title}</p>
            <h2 className="vn-ending-score">
              {totalScore}
              <span className="vn-ending-score__slash">/</span>
              {maxScore}
              <span className="vn-ending-score__suffix"> score</span>
            </h2>
            <p className="vn-ending-copy">
              {level.title}
              {' — '}
              {rank.comment}
            </p>
            <div className="vn-ending-actions">
              <a className="vn-ending-primary" href={shareUrl} target="_blank" rel="noreferrer">
                X で結果をポスト
              </a>
              <button type="button" className="vn-ending-secondary" onClick={resetToTitle}>
                タイトルへ戻る
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
