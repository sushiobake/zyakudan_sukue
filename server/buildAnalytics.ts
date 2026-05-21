import type { ZyakudanEventRow } from './eventTypes'

const LOW_SCORE_THRESHOLD = 10

function payloadText(row: ZyakudanEventRow): string | null {
  const p = row.payload
  if (!p || typeof p !== 'object') return null
  const t = (p as { choiceText?: unknown }).choiceText
  return typeof t === 'string' && t.trim() ? t.slice(0, 120) : null
}

export function buildZyakudanAnalytics(rows: ZyakudanEventRow[]) {
  const visitors = new Set<string>()
  const plays = new Map<
    string,
    {
      playId: string
      visitorId: string | null
      levelId: string | null
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

    if (row.play_id) {
      const p = plays.get(row.play_id) ?? {
        playId: row.play_id,
        visitorId: row.visitor_id,
        levelId: row.level_id,
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
        answers: [],
      }
      p.firstAt = row.created_at < p.firstAt ? row.created_at : p.firstAt
      p.lastAt = row.created_at > p.lastAt ? row.created_at : p.lastAt
      p.eventCount += 1
      if (!p.visitorId && row.visitor_id) p.visitorId = row.visitor_id
      if (row.level_id) p.levelId = row.level_id
      if (row.event_type === 'chapter_start') {
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
      }
      if (row.event_type === 'chapter_abandon') {
        p.endReason = row.end_reason ?? 'abandon'
      }
      plays.set(row.play_id, p)
    }

    if (row.event_type === 'answer' || row.event_type === 'chapter_abandon') {
      const qIndex = row.question_index ?? 0
      const key = `${row.level_id ?? ''}:${row.level_index ?? ''}:${qIndex}`
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
    daily,
    questions,
    plays: playRows.slice(0, 500),
    events: rows.slice(0, 300),
  }
}
