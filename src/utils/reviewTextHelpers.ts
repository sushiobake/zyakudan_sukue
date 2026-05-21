/** 先頭の `## 見出し` 行を除く（画面ラベルと二重表示を防ぐ） */
export function stripReviewLeadHeading(text: string): string {
  const trimmed = text.trimStart()
  if (!trimmed.startsWith('## ')) return text
  const nl = trimmed.indexOf('\n')
  if (nl === -1) return ''
  return trimmed.slice(nl + 1).replace(/^\n+/, '')
}
