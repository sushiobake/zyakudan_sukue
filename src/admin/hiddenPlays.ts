const STORAGE_KEY = 'zyakudan.hiddenPlays.v1'

function readSet(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((id): id is string => typeof id === 'string' && id.length > 0))
  } catch {
    return new Set()
  }
}

function writeSet(ids: Set<string>): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
}

/** このブラウザのプレイ履歴一覧から非表示にした play_id */
export function getHiddenPlayIds(): Set<string> {
  return readSet()
}

export function hidePlayId(playId: string): void {
  const id = playId.trim()
  if (!id) return
  const next = readSet()
  next.add(id)
  writeSet(next)
}

export function clearHiddenPlayIds(): void {
  window.localStorage.removeItem(STORAGE_KEY)
}
