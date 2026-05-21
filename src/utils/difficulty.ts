const DEFAULT_BY_ID: Record<string, number> = {
  lv1: 2,
  lv2: 2.5,
  lv3: 3,
}

/** 章の難易度（0〜3・0.5刻み） */
export function resolveDifficulty(level: { id: string; difficulty?: number }): number {
  const raw = level.difficulty ?? DEFAULT_BY_ID[level.id] ?? 2
  const stepped = Math.round(raw * 2) / 2
  return Math.min(3, Math.max(0, stepped))
}

export function formatDifficulty(value: number): string {
  const v = resolveDifficulty({ id: '', difficulty: value })
  return `${Number.isInteger(v) ? v : v.toFixed(1)}/3`
}
