/** シチュエーション表示用（最大5行想定） */
export const SITUATION_MAX_LINES = 5

export function situationLines(text: string): string[] {
  return text.replace(/\r\n/g, '\n').split('\n')
}

export function situationPreview(text: string, maxLines = SITUATION_MAX_LINES): string {
  const lines = situationLines(text).filter((l, i, arr) => l.trim() || i < arr.length - 1)
  if (lines.length <= maxLines) return lines.join('\n')
  return lines.slice(0, maxLines).join('\n')
}

export function situationSidebarLabel(text: string): string {
  const first = situationLines(text).find((l) => l.trim())?.trim() ?? ''
  if (!first) return '（未入力）'
  return first.length > 32 ? `${first.slice(0, 32)}…` : first
}
