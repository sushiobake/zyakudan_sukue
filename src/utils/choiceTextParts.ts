export type ChoiceTextParts = {
  /** 「」の前（あれば小さめ1行） */
  before: string
  /** 「」含む台詞（強調・1行固定） */
  dialogue: string
  /** 「」の後（あれば小さめ1行） */
  after: string
}

/** 最初の「…」で前・台詞・後に分割。鍵括弧が無いときは null */
export function splitChoiceText(text: string): ChoiceTextParts | null {
  const trimmed = text.trim()
  const open = trimmed.indexOf('「')
  if (open < 0) return null

  const close = trimmed.indexOf('」', open + 1)
  if (close < 0) return null

  const before = trimmed.slice(0, open).trim()
  const dialogue = trimmed.slice(open, close + 1)
  const after = trimmed.slice(close + 1).trim()

  if (!dialogue) return null

  return { before, dialogue, after }
}
