import { Fragment, type ReactNode } from 'react'

export type ReviewColorTag = 'rose' | 'gold' | 'warn' | 'mute' | 'accent'

const COLOR_TAGS = new Set<ReviewColorTag>(['rose', 'gold', 'warn', 'mute', 'accent'])

const COLOR_CLASS: Record<ReviewColorTag, string> = {
  rose: 'vn-review-color--rose',
  gold: 'vn-review-color--gold',
  warn: 'vn-review-color--warn',
  mute: 'vn-review-color--mute',
  accent: 'vn-review-color--accent',
}

const COLOR_OPEN_RE = /^\[(rose|gold|warn|mute|accent)\]/
const BOLD_RE = /^\*\*(.+?)\*\*/

/**
 * 講評用インライン（色タグ・太字。色タグの内側にも太字可）
 * - [rose]…[/rose] ほか gold / warn / mute / accent
 * - **太字**
 */
function parseReviewInline(text: string, keyPrefix: string, depth = 0): ReactNode[] {
  if (depth > 16) return [text]

  const parts: ReactNode[] = []
  let i = 0
  let k = 0

  while (i < text.length) {
    const rest = text.slice(i)

    const colorM = rest.match(COLOR_OPEN_RE)
    if (colorM) {
      const tag = colorM[1] as ReviewColorTag
      if (COLOR_TAGS.has(tag)) {
        const openLen = colorM[0].length
        const closeToken = `[/${tag}]`
        const closeAt = text.indexOf(closeToken, i + openLen)
        if (closeAt >= 0) {
          const inner = text.slice(i + openLen, closeAt)
          parts.push(
            <span
              key={`${keyPrefix}-c-${k++}`}
              className={`vn-review-color ${COLOR_CLASS[tag]}`}
            >
              {inner ? parseReviewInline(inner, `${keyPrefix}-ci${k}`, depth + 1) : null}
            </span>,
          )
          i = closeAt + closeToken.length
          continue
        }
      }
    }

    const boldM = rest.match(BOLD_RE)
    if (boldM) {
      parts.push(
        <strong key={`${keyPrefix}-b-${k++}`} className="vn-review-strong">
          {boldM[1]}
        </strong>,
      )
      i += boldM[0].length
      continue
    }

    let j = i + 1
    while (j < text.length) {
      const ch = text[j]
      if (ch === '[') break
      if (ch === '*' && text[j + 1] === '*') break
      j++
    }

    parts.push(<Fragment key={`${keyPrefix}-t-${k++}`}>{text.slice(i, j)}</Fragment>)
    i = j
  }

  return parts.length > 0 ? parts : [text]
}

/** 1行インライン用（選択肢の目的テキストなど） */
export function ReviewInline({ text }: { text: string }) {
  return <span className="vn-review-inline">{parseReviewInline(text, 'in')}</span>
}

/**
 * 評価・講評テキスト（evaluation / commonReview）の表示用。
 * - 行頭 `## ` … 大きめ見出し
 * - `**...**` … 太字
 * - `[rose]…[/rose]` など … 夕方UIに合うアクセント色（真っ赤は使わない）
 */
export function ReviewText({ text }: { text: string }) {
  const lines = text.split('\n')

  return (
    <>
      {lines.map((line, lineIndex) => {
        const isLead = line.startsWith('## ')
        const content = isLead ? line.slice(3) : line
        const isEmpty = content.trim() === '' && !isLead

        if (isEmpty) {
          return <br key={`br-${lineIndex}`} />
        }

        return (
          <p
            key={`line-${lineIndex}`}
            className={isLead ? 'vn-review-line vn-review-line--lead' : 'vn-review-line'}
          >
            {parseReviewInline(content, `l${lineIndex}`)}
          </p>
        )
      })}
    </>
  )
}
