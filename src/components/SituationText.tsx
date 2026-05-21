import { situationLines, situationPreview } from '../utils/situationDisplay'

/** ゲーム・管理のシチュエーション表示（改行・最大5行） */
export function SituationText({
  text,
  className = 'vn-dialog-text vn-dialog-text--situation',
  maxLines,
  full = false,
}: {
  text: string
  className?: string
  maxLines?: number
  /** true のとき行数制限なし（選択肢画面の参照用など） */
  full?: boolean
}) {
  const shown = full
    ? situationLines(text).join('\n')
    : situationPreview(text, maxLines)
  return <p className={className}>{shown}</p>
}
