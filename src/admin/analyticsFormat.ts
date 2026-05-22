/** 章・問を Q1-1 形式で表示（levelIndex は 0 始まり、questionIndex は 1 始まり） */
export function formatQuestionLabel(
  levelIndex: number | null | undefined,
  questionIndex: number,
): string {
  const ch = (levelIndex ?? 0) + 1
  return `Q${ch}-${questionIndex}`
}
