import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'
import {
  BACKGROUND_FALLBACK,
  TITLE_BACKGROUND,
  backgroundPath,
  resolveQuestionBackground,
} from '../data/backgrounds'
import DifficultyMeter from '../components/DifficultyMeter'
import { resolveSiteUrl } from '../utils/siteUrl'
import { loadLevels } from '../data/loadLevels'
import { loadRanks } from '../data/loadRanks'
import { getScoreRank, totalRunScore } from '../data/ranks'
import { shuffle } from '../data/shuffle'
import { CHAPTER_SCORE_MAX, QUESTION_SCORE_MAX, scoreToTier } from '../data/scores'
import { charaPoseFromScore, preloadCharaPoses, type CharaPose } from '../data/sprite'
import { AdvHitzone } from './AdvHitzone'
import { CharaSprite } from './CharaSprite'
import { ScreenVeil } from './ScreenVeil'
import { ScrollHint } from '../components/ScrollHint'
import { SituationText } from '../components/SituationText'
import { ChoiceText } from '../utils/choiceText'
import { ReviewText } from '../utils/reviewText'
import { stripReviewLeadHeading } from '../utils/reviewTextHelpers'
import {
  createAnalyticsPlayId,
  trackAnalyticsEvent,
} from '../analytics/analyticsClient'
import type { LevelPack, QuizOption, QuizQuestion, ScoreRank } from '../types'
import '../App.css'
import '../title.css'

type QuizPhase = 'situation' | 'choices' | 'reaction' | 'result'
type Screen = 'title' | 'quiz' | 'final' | 'loading'

const QUESTIONS_PER_RUN = 5
const HEROINE_NAME = '由良 さくら'

function resolveCharaPose(
  screen: Screen,
  quizPhase: QuizPhase,
  picked: QuizOption | null,
): CharaPose {
  if (screen !== 'quiz') return 'normal'
  if (quizPhase === 'situation' || quizPhase === 'choices') return 'normal'
  return charaPoseFromScore(picked?.score)
}

function buildShareText(
  level: LevelPack,
  total: number,
  rank: ScoreRank,
): string {
  return `弱者男性を救え！\nあなたは${rank.title}\n${level.title} · 合計 ${total} / ${CHAPTER_SCORE_MAX} 点\n#弱者男性を救え`
}

/** 章内の問題順は配列順のまま（先頭5問）。シャッフルしない */
function pickRunQuestions(questions: QuizQuestion[]): QuizQuestion[] {
  return questions.slice(0, QUESTIONS_PER_RUN)
}

type ActiveLevel = LevelPack & { runQuestions: QuizQuestion[] }

export default function GameApp() {
  const [levels, setLevels] = useState<LevelPack[]>([])
  const [ranks, setRanks] = useState<ScoreRank[]>([])
  const [screen, setScreen] = useState<Screen>('loading')
  const [level, setLevel] = useState<ActiveLevel | null>(null)
  const [qIndex, setQIndex] = useState(0)
  const [quizPhase, setQuizPhase] = useState<QuizPhase>('situation')
  const [picked, setPicked] = useState<QuizOption | null>(null)
  const [scores, setScores] = useState<number[]>([])
  const [screenVeil, setScreenVeil] = useState(false)
  const transitionTimer = useRef<number | null>(null)
  const playIdRef = useRef<string | null>(null)
  const titleVisitSent = useRef(false)
  const chapterFinishSent = useRef(false)
  const clearTransitionTimer = useCallback(() => {
    if (transitionTimer.current != null) {
      window.clearTimeout(transitionTimer.current)
      transitionTimer.current = null
    }
  }, [])

  useEffect(() => () => clearTransitionTimer(), [clearTransitionTimer])

  useEffect(() => {
    if (screen === 'quiz') preloadCharaPoses()
  }, [screen])

  useEffect(() => {
    let cancelled = false
    Promise.all([loadLevels(), loadRanks()]).then(([data, rankData]) => {
      if (cancelled) return
      setLevels(data)
      setRanks(rankData)
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

  /** プレイ画面のみ4択をランダム表示（管理画面の並び＝点数順はそのまま） */
  const shuffledOptions = useMemo(() => {
    if (!question) return []
    return shuffle(question.options)
  }, [question])

  const resetToTitle = useCallback(() => {
    setScreen('title')
    setLevel(null)
    setQIndex(0)
    setQuizPhase('situation')
    setPicked(null)
    setScores([])
  }, [])

  useEffect(() => {
    if (screen === 'title' && !titleVisitSent.current) {
      titleVisitSent.current = true
      trackAnalyticsEvent('title_visit')
    }
  }, [screen])

  const startLevel = useCallback(
    (pack: LevelPack) => {
      clearTransitionTimer()
      setScreenVeil(true)
      chapterFinishSent.current = false
      playIdRef.current = createAnalyticsPlayId()
      const chapterIndex = levels.findIndex((lv) => lv.id === pack.id)
      trackAnalyticsEvent('chapter_start', {
        playId: playIdRef.current,
        levelId: pack.id,
        levelIndex: chapterIndex >= 0 ? chapterIndex : undefined,
        payload: { levelTitle: pack.title },
      })

      transitionTimer.current = window.setTimeout(() => {
        const runQuestions = pickRunQuestions(pack.questions)
        setLevel({ ...pack, runQuestions })
        setQIndex(0)
        setQuizPhase('situation')
        setPicked(null)
        setScores([])
        setScreen('quiz')

        transitionTimer.current = window.setTimeout(() => {
          setScreenVeil(false)
          transitionTimer.current = null
        }, 60)
      }, 480)
    },
    [clearTransitionTimer, levels],
  )

  const advanceFromSituation = useCallback(() => {
    setQuizPhase('choices')
  }, [])

  const pickOption = useCallback(
    (opt: QuizOption, optionIndex: number, e: MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      setPicked(opt)
      setQuizPhase('reaction')
      if (playIdRef.current && level) {
        trackAnalyticsEvent('answer', {
          playId: playIdRef.current,
          levelId: level.id,
          levelIndex: levels.findIndex((lv) => lv.id === level.id),
          questionIndex: qIndex + 1,
          optionIndex,
          score: opt.score,
          payload: { choiceText: opt.text.slice(0, 200) },
        })
      }
    },
    [level, levels, qIndex],
  )

  const advanceFromReaction = useCallback(() => {
    setQuizPhase('result')
  }, [])

  const finishQuestion = useCallback(() => {
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

  const advanceFromResult = useCallback(() => {
    finishQuestion()
  }, [finishQuestion])

  const totalScore = useMemo(() => totalRunScore(scores), [scores])
  const rank = useMemo(() => getScoreRank(totalScore, ranks), [totalScore, ranks])

  useEffect(() => {
    if (screen !== 'final' || !level || !playIdRef.current || chapterFinishSent.current) return
    chapterFinishSent.current = true
    trackAnalyticsEvent('chapter_finish', {
      playId: playIdRef.current,
      levelId: level.id,
      levelIndex: levels.findIndex((lv) => lv.id === level.id),
      totalScore,
      rankTitle: rank.title,
      endReason: 'completed',
      payload: { levelTitle: level.title },
    })
  }, [screen, level, levels, totalScore, rank.title])

  const latestPlayStateRef = useRef({
    screen,
    levelId: null as string | null,
    playId: null as string | null,
    qIndex: 0,
    answerCount: 0,
  })

  useEffect(() => {
    latestPlayStateRef.current = {
      screen,
      levelId: level?.id ?? null,
      playId: playIdRef.current,
      qIndex,
      answerCount: scores.length,
    }
  }, [screen, level, qIndex, scores.length])

  useEffect(() => {
    const onPageHide = () => {
      const s = latestPlayStateRef.current
      if (s.screen !== 'quiz' || !s.playId || !s.levelId) return
      trackAnalyticsEvent(
        'chapter_abandon',
        {
          playId: s.playId,
          levelId: s.levelId,
          questionIndex: s.qIndex + 1,
          endReason: 'pagehide',
          payload: { answerCount: s.answerCount },
        },
        { beacon: true },
      )
    }
    window.addEventListener('pagehide', onPageHide)
    return () => window.removeEventListener('pagehide', onPageHide)
  }, [])

  const shareUrl = useMemo(() => {
    const pageUrl = resolveSiteUrl()
    const text = level != null ? buildShareText(level, totalScore, rank) : ''
    const params = new URLSearchParams({ text, url: pageUrl })
    return `https://twitter.com/intent/tweet?${params.toString()}`
  }, [level, totalScore, rank])

  const charaPose = useMemo(
    () => resolveCharaPose(screen, quizPhase, picked),
    [screen, quizPhase, picked],
  )
  const advClickable =
    screen === 'quiz' &&
    (quizPhase === 'situation' ||
      quizPhase === 'reaction' ||
      quizPhase === 'result')

  const onAdvActivate = useCallback(() => {
    if (quizPhase === 'situation') advanceFromSituation()
    else if (quizPhase === 'reaction') advanceFromReaction()
    else if (quizPhase === 'result') advanceFromResult()
  }, [quizPhase, advanceFromSituation, advanceFromReaction, advanceFromResult])

  const speakerName = useMemo(() => {
    if (screen !== 'quiz' || !question) return ''
    switch (quizPhase) {
      case 'situation':
        return 'ナレーション'
      case 'choices':
        return ''
      case 'reaction':
        return HEROINE_NAME
      case 'result':
        return ''
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
        return ''
      case 'reaction':
        return picked ? `「${picked.reaction}」` : ''
      default:
        return ''
    }
  }, [screen, quizPhase, question, picked])

  const hasCommonReview = Boolean(question?.commonReview?.trim())

  const desiredBackground = useMemo(() => {
    if (screen === 'title') return TITLE_BACKGROUND
    if (screen === 'loading') return backgroundPath('station')
    const q = level?.runQuestions[qIndex]
    if ((screen === 'quiz' || screen === 'final') && q) {
      return backgroundPath(resolveQuestionBackground(q))
    }
    return backgroundPath('station')
  }, [screen, level, qIndex])

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
      className={`vn-root vn-root--${screen}${screen === 'title' ? ' vn-root--title-paper' : ''}`}
      data-phase={screen === 'quiz' ? quizPhase : undefined}
      data-score={screen === 'quiz' && picked ? scoreToTier(picked.score) : undefined}
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

      <ScreenVeil active={screenVeil} />

      {screen === 'title' && (
        <div className="tps-screen">
          <header className="tps-top">
            <a className="tps-studio" href="#" aria-label="sushiobake studio" onClick={(e) => e.preventDefault()}>
              <img className="tps-studio__mark" src="/mark.svg" alt="" width={34} height={34} />
              <span className="tps-studio__name">
                <b>sushiobake</b>
                <span>STUDIO</span>
              </span>
            </a>
            {import.meta.env.DEV ? (
              <a className="tps-admin" href="#/admin">
                管理 / ADMIN
              </a>
            ) : null}
          </header>

          <section className="tps-center">
            <div className="tps-hero">
              <div className="tps-lockup">
                <h1 className="tps-title">
                  <span className="tps-title__line">弱者男性を</span>
                  <span className="tps-title__line tps-title__line--bang">
                    <span className="tps-title__verb">救え</span>
                    <span className="tps-title__bang">！</span>
                  </span>
                </h1>
                <span className="tps-rule" aria-hidden />
                <p className="tps-subtitle">“リアル”恋愛シミュレーション</p>
                <p className="tps-lead">
                  あなたは、弱者男性を救える神。
                  <br />
                  目の前の男を、ほんの少しだけ操って——彼の恋愛を、成就させてくれ。
                </p>
              </div>
            </div>

            <div className="tps-menu-panel">
              <p className="tps-menu-label">CHAPTER SELECT</p>
              <ul className="tps-menu" aria-label="章の選択">
                {levels.map((pack, i) => (
                  <li key={pack.id}>
                    <button
                      type="button"
                      className="tps-menu-btn"
                      onClick={() => startLevel(pack)}
                    >
                      <span className="tps-menu-btn__k">{String(i + 1).padStart(2, '0')}</span>
                      <span className="tps-menu-btn__t">
                        <b>{pack.title}</b>
                        <span>{pack.tagline}</span>
                      </span>
                      <DifficultyMeter level={pack} className="tps-menu-btn__diff" />
                      <span className="tps-menu-btn__arrow" aria-hidden>
                        →
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <footer className="tps-bottom">
            <p className="tps-bottom__meta">CLICK TO BEGIN · NO AUDIO · FICTION</p>
            <p className="tps-bottom__note">本作品はフィクションです。実在の人物・団体とは関係ありません。</p>
          </footer>
        </div>
      )}

      {screen === 'quiz' && level && question && (
        <>
          <div className="vn-sprite-layer">
            <div className="vn-sprite-shadow" aria-hidden />
            <div className="vn-sprite-glow">
              <div className="vn-sprite-frame">
                <CharaSprite
                  pose={charaPose}
                  alt={`${HEROINE_NAME}（表情 ${charaPose}）`}
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
                {quizPhase === 'result'
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

          {advClickable ? <AdvHitzone onActivate={onAdvActivate} /> : null}

          <div className="vn-adv-stack">
            {quizPhase === 'choices' && question && (
              <>
                <aside className="vn-choice-recap" aria-label="シチュエーション（参照）">
                  <SituationText
                    text={question.situation}
                    full
                    className="vn-choice-recap__text"
                  />
                </aside>
                <div className="vn-choice-overlay" role="dialog" aria-label="選択肢">
                <p className="vn-choice-overlay__caption">COMMAND SELECT</p>
                <ul className="vn-choice-list">
                  {shuffledOptions.map((opt, i) => (
                    <li key={`${qIndex}-opt-${opt.score}-${i}`}>
                      <button
                        type="button"
                        className="vn-choice-row"
                        onClick={(e) => pickOption(opt, i, e)}
                      >
                        <span className="vn-choice-row__idx">{i + 1}</span>
                        <span className="vn-choice-row__txt">
                          <ChoiceText text={opt.text} />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                </div>
              </>
            )}

            {quizPhase !== 'choices' ? (
              quizPhase === 'result' ? (
                <ScrollHint
                  className="vn-result-scroll-hint"
                  watchKey={`${qIndex}-${picked?.score ?? 0}`}
                >
                  <div className="vn-adv-anchor">
                    <div
                      className={`vn-adv-window vn-adv-window--result ${advClickable ? 'vn-adv-window--clickable' : ''}`}
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
                        <div className="vn-result-panel">
                          <div className="vn-score-inline">
                            <p className="vn-score-inline__num">{picked!.score}</p>
                            <p className="vn-score-inline__per">
                              点／{QUESTION_SCORE_MAX}点
                            </p>
                          </div>
                          {picked!.evaluation.trim() ? (
                            <div className="vn-result-row">
                              <p className="vn-result-row__label">評価</p>
                              <div className="vn-dialog-text vn-dialog-text--review vn-result-row__body">
                                <ReviewText text={picked!.evaluation} />
                              </div>
                            </div>
                          ) : null}
                          {hasCommonReview ? (
                            <div className="vn-result-row vn-result-row--insight">
                              <p className="vn-result-row__label">講評</p>
                              <div className="vn-dialog-text vn-dialog-text--review vn-result-row__body">
                                <ReviewText
                                  text={stripReviewLeadHeading(question!.commonReview)}
                                />
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollHint>
              ) : (
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
                      {quizPhase === 'situation' ? (
                        <ScrollHint watchKey={advBodyText}>
                          <SituationText text={advBodyText} full />
                        </ScrollHint>
                      ) : (
                        <ScrollHint watchKey={advBodyText}>
                          <p className="vn-dialog-text">{advBodyText}</p>
                        </ScrollHint>
                      )}
                    </div>
                  </div>
                </div>
              )
            ) : null}
          </div>
        </>
      )}

      {screen === 'final' && level && (
        <div className="vn-ending-screen">
          <div className="vn-ending-card">
            <p className="vn-ending-ribbon">ENDING</p>
            <div className="vn-ending-rank-block" aria-label="称号">
              <p className="vn-ending-rank__prefix">あなたは</p>
              <p className="vn-ending-rank">{rank.title}</p>
            </div>
            <h2
              className="vn-ending-score"
              aria-label={`合計 ${totalScore} 点 / ${CHAPTER_SCORE_MAX} 点満点`}
            >
              <span className="vn-ending-score__value">{totalScore}</span>
              <span className="vn-ending-score__slash">/</span>
              <span className="vn-ending-score__max">{CHAPTER_SCORE_MAX}</span>
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
