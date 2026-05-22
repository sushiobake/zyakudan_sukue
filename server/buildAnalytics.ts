import { filterProductionAnalyticsRows } from './localTraffic'
import { formatTrafficInflowLines, readTrafficSourceFromPayload } from './promoTracking'
import type { ZyakudanEventRow } from './eventTypes'

const LOW_SCORE_THRESHOLD = 10

type SourceInfo = {
  key: string
  r: string | null
  ct: string | null
  label: string
  title: string
}

function hostFromReferrer(referrer: string | null): string | null {
  if (!referrer) return null
  try {
    return new URL(referrer).hostname.replace(/^www\./, '')
  } catch {
    return referrer.slice(0, 80)
  }
}

function sourceFromRow(row: ZyakudanEventRow): SourceInfo {
  const traffic = readTrafficSourceFromPayload(row.payload, row.path)
  if (traffic.r) {
    const formatted = formatTrafficInflowLines(traffic.r, traffic.ct)
    return {
      key: `${traffic.r}:${traffic.ct ?? ''}`,
      r: traffic.r,
      ct: traffic.ct,
      label: formatted.cell,
      title: formatted.title,
    }
  }
  const refHost = hostFromReferrer(row.referrer)
  if (refHost) {
    return {
      key: `referrer:${refHost}`,
      r: null,
      ct: null,
      label: `外部参照: ${refHost}`,
      title: row.referrer ?? refHost,
    }
  }
  return {
    key: 'direct:',
    r: null,
    ct: null,
    label: '直接/不明',
    title: 'r/ct と referrer がありません',
  }
}

function payloadText(row: ZyakudanEventRow): string | null {
  const p = row.payload
  if (!p || typeof p !== 'object') return null
  const t = (p as { choiceText?: unknown }).choiceText
  return typeof t === 'string' && t.trim() ? t.slice(0, 120) : null
}

export function formatQuestionLabel(
  levelIndex: number | null | undefined,
  questionIndex: number,
): string {
  const ch = (levelIndex ?? 0) + 1
  return `Q${ch}-${questionIndex}`
}

export function buildZyakudanAnalytics(allRows: ZyakudanEventRow[]) {
  const { rows, excludedLocal } = filterProductionAnalyticsRows(allRows)
  const visitors = new Set<string>()
  const plays = new Map<
    string,
    {
      playId: string
      visitorId: string | null
      levelId: string | null
      levelIndex: number | null
      levelTitle: string | null
      firstAt: string
      lastAt: string
      eventCount: number
      answerCount: number
      reachedQuestion: number
      finished: boolean
      totalScore: number | null
      rankTitle: string | null
      endReason: string | null
      source: SourceInfo
      answers: Array<{
        questionIndex: number
        optionIndex: number | null
        score: number | null
        choiceText: string | null
      }>
    }
  >()

  const questionMap = new Map<
    string,
    {
      levelId: string | null
      levelIndex: number | null
      questionIndex: number
      answers: number
      scoreSum: number
      abandonsHere: number
      optionCounts: Map<number, number>
      lowOptionCounts: Map<number, number>
    }
  >()

  const dailyMap = new Map<
    string,
    {
      day: string
      events: number
      visitors: Set<string>
      plays: Set<string>
      titleVisits: number
      starts: number
      finishes: number
      abandons: number
    }
  >()

  const sourceMap = new Map<
    string,
    {
      key: string
      r: string | null
      ct: string | null
      label: string
      title: string
      titleVisits: number
      plays: number
      visitors: Set<string>
      starts: number
      finishes: number
      abandons: number
    }
  >()

  function bumpSource(source: SourceInfo, patch: {
    titleVisit?: boolean
    play?: boolean
    visitorId?: string | null
    start?: boolean
    finish?: boolean
    abandon?: boolean
  }) {
    const current = sourceMap.get(source.key) ?? {
      key: source.key,
      r: source.r,
      ct: source.ct,
      label: source.label,
      title: source.title,
      titleVisits: 0,
      plays: 0,
      visitors: new Set<string>(),
      starts: 0,
      finishes: 0,
      abandons: 0,
    }
    if (patch.titleVisit) current.titleVisits += 1
    if (patch.play) current.plays += 1
    if (patch.visitorId) current.visitors.add(patch.visitorId)
    if (patch.start) current.starts += 1
    if (patch.finish) current.finishes += 1
    if (patch.abandon) current.abandons += 1
    sourceMap.set(source.key, current)
  }

  for (const row of rows) {
    if (row.visitor_id) visitors.add(row.visitor_id)
    const day = row.created_at.slice(0, 10)
    const daily = dailyMap.get(day) ?? {
      day,
      events: 0,
      visitors: new Set<string>(),
      plays: new Set<string>(),
      titleVisits: 0,
      starts: 0,
      finishes: 0,
      abandons: 0,
    }
    daily.events += 1
    if (row.visitor_id) daily.visitors.add(row.visitor_id)
    if (row.play_id) daily.plays.add(row.play_id)
    if (row.event_type === 'title_visit') daily.titleVisits += 1
    if (row.event_type === 'chapter_start') daily.starts += 1
    if (row.event_type === 'chapter_finish') daily.finishes += 1
    if (row.event_type === 'chapter_abandon') daily.abandons += 1
    dailyMap.set(day, daily)

    const rowSource = sourceFromRow(row)
    if (row.event_type === 'title_visit') {
      bumpSource(rowSource, { titleVisit: true, visitorId: row.visitor_id })
    }

    if (row.play_id) {
      const p = plays.get(row.play_id) ?? {
        playId: row.play_id,
        visitorId: row.visitor_id,
        levelId: row.level_id,
        levelIndex: row.level_index,
        levelTitle: null,
        firstAt: row.created_at,
        lastAt: row.created_at,
        eventCount: 0,
        answerCount: 0,
        reachedQuestion: 0,
        finished: false,
        totalScore: null,
        rankTitle: null,
        endReason: null,
        source: rowSource,
        answers: [],
      }
      p.firstAt = row.created_at < p.firstAt ? row.created_at : p.firstAt
      p.lastAt = row.created_at > p.lastAt ? row.created_at : p.lastAt
      p.eventCount += 1
      if (p.source.key === 'direct:' && rowSource.key !== 'direct:') p.source = rowSource
      if (!p.visitorId && row.visitor_id) p.visitorId = row.visitor_id
      if (row.level_id) p.levelId = row.level_id
      if (row.level_index != null) p.levelIndex = row.level_index
      if (row.event_type === 'chapter_start') {
        bumpSource(p.source, {
          play: true,
          visitorId: p.visitorId,
          start: true,
        })
        const title = payloadText(row)
        if (title) p.levelTitle = title.replace(/^章:\s*/, '')
        const pl = row.payload as { levelTitle?: string }
        if (pl?.levelTitle && typeof pl.levelTitle === 'string') p.levelTitle = pl.levelTitle
      }
      if (row.question_index != null) {
        p.reachedQuestion = Math.max(p.reachedQuestion, row.question_index)
      }
      if (row.event_type === 'answer') {
        p.answerCount += 1
        p.answers.push({
          questionIndex: row.question_index ?? 0,
          optionIndex: row.option_index,
          score: row.score,
          choiceText: payloadText(row),
        })
      }
      if (row.event_type === 'chapter_finish') {
        p.finished = true
        p.totalScore = row.total_score
        p.rankTitle = row.rank_title
        p.endReason = row.end_reason
        bumpSource(p.source, { finish: true })
      }
      if (row.event_type === 'chapter_abandon') {
        p.endReason = row.end_reason ?? 'abandon'
        bumpSource(p.source, { abandon: true })
      }
      plays.set(row.play_id, p)
    }

    if (row.event_type === 'answer' || row.event_type === 'chapter_abandon') {
      const qIndex = row.question_index ?? 0
      // level_id / level_index の片方だけ入っている行を同一問にまとめる（表示は Q1-1 形式）
      const key = formatQuestionLabel(row.level_index, qIndex)
      const q = questionMap.get(key) ?? {
        levelId: row.level_id,
        levelIndex: row.level_index,
        questionIndex: qIndex,
        answers: 0,
        scoreSum: 0,
        abandonsHere: 0,
        optionCounts: new Map(),
        lowOptionCounts: new Map(),
      }
      if (row.event_type === 'answer') {
        q.answers += 1
        q.scoreSum += row.score ?? 0
        const opt = row.option_index
        if (opt != null) {
          q.optionCounts.set(opt, (q.optionCounts.get(opt) ?? 0) + 1)
          if ((row.score ?? 0) <= LOW_SCORE_THRESHOLD) {
            q.lowOptionCounts.set(opt, (q.lowOptionCounts.get(opt) ?? 0) + 1)
          }
        }
      }
      if (row.event_type === 'chapter_abandon') q.abandonsHere += 1
      if (row.level_index != null) q.levelIndex = row.level_index
      if (row.level_id) q.levelId = row.level_id
      questionMap.set(key, q)
    }
  }

  function topOption(map: Map<number, number>): { optionIndex: number; count: number } | null {
    let best: { optionIndex: number; count: number } | null = null
    for (const [optionIndex, count] of map) {
      if (!best || count > best.count) best = { optionIndex, count }
    }
    return best
  }

  const questions = [...questionMap.values()]
    .map((q) => ({
      levelId: q.levelId,
      levelIndex: q.levelIndex,
      questionIndex: q.questionIndex,
      answers: q.answers,
      avgScore: q.answers > 0 ? Math.round((q.scoreSum / q.answers) * 10) / 10 : null,
      abandonsHere: q.abandonsHere,
      topLowOption: topOption(q.lowOptionCounts),
      topOption: topOption(q.optionCounts),
    }))
    .sort((a, b) => {
      const la = a.levelIndex ?? 0
      const lb = b.levelIndex ?? 0
      if (la !== lb) return la - lb
      return a.questionIndex - b.questionIndex
    })

  const playRows = [...plays.values()].sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1))

  const sources = [...sourceMap.values()]
    .map((source) => ({
      key: source.key,
      r: source.r,
      ct: source.ct,
      label: source.label,
      title: source.title,
      titleVisits: source.titleVisits,
      plays: source.plays,
      visitors: source.visitors.size,
      starts: source.starts,
      finishes: source.finishes,
      abandons: source.abandons,
      finishRate:
        source.starts > 0 ? Math.round((source.finishes / source.starts) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.titleVisits + b.starts - (a.titleVisits + a.starts))

  const daily = [...dailyMap.values()]
    .map((d) => ({
      day: d.day,
      events: d.events,
      visitors: d.visitors.size,
      plays: d.plays.size,
      titleVisits: d.titleVisits,
      starts: d.starts,
      finishes: d.finishes,
      abandons: d.abandons,
      finishRate: d.starts > 0 ? Math.round((d.finishes / d.starts) * 1000) / 10 : 0,
    }))
    .sort((a, b) => (a.day < b.day ? 1 : -1))

  const eventCounts = rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.event_type] = (acc[row.event_type] ?? 0) + 1
    return acc
  }, {})

  const summary = {
    events: rows.length,
    visitors: visitors.size,
    plays: playRows.length,
    titleVisits: eventCounts.title_visit ?? 0,
    starts: eventCounts.chapter_start ?? 0,
    finishes: eventCounts.chapter_finish ?? 0,
    abandons: eventCounts.chapter_abandon ?? 0,
    answers: eventCounts.answer ?? 0,
    finishRate:
      (eventCounts.chapter_start ?? 0) > 0
        ? Math.round(((eventCounts.chapter_finish ?? 0) / (eventCounts.chapter_start ?? 0)) * 1000) / 10
        : 0,
  }

  return {
    summary,
    excludedLocal,
    daily,
    sources,
    questions,
    plays: playRows.slice(0, 500).map((p) => ({
      playId: p.playId,
      visitorId: p.visitorId,
      levelId: p.levelId,
      levelIndex: p.levelIndex,
      levelTitle: p.levelTitle,
      firstAt: p.firstAt,
      lastAt: p.lastAt,
      answerCount: p.answerCount,
      reachedQuestion: p.reachedQuestion,
      finished: p.finished,
      totalScore: p.totalScore,
      rankTitle: p.rankTitle,
      endReason: p.endReason,
      sourceLabel: p.source.label,
      sourceTitle: p.source.title,
      answers: p.answers,
    })),
    events: rows.slice(0, 300),
  }
}
