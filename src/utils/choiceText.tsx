import { ReviewInline } from './reviewText'
import { splitChoiceText } from './choiceTextParts'

type ChoiceTextProps = {
  text: string
}

/** コマンドセレクト：前（小）・台詞（大・1行）・後（小）最大3行 */
export function ChoiceText({ text }: ChoiceTextProps) {
  const parts = splitChoiceText(text)

  if (!parts) {
    return <span className="vn-choice-plain">{text}</span>
  }

  return (
    <span className="vn-choice-copy">
      {parts.before ? (
        <span className="vn-choice-line vn-choice-line--intent">
          <ReviewInline text={parts.before} />
        </span>
      ) : null}
      <span className="vn-choice-line vn-choice-line--dialogue">{parts.dialogue}</span>
      {parts.after ? (
        <span className="vn-choice-line vn-choice-line--intent">
          <ReviewInline text={parts.after} />
        </span>
      ) : null}
    </span>
  )
}
