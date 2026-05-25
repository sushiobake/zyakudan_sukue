/** 4択の固定スロット（管理画面の並び＝A〜D。プレイ時はシャッフル表示） */
export const OPTION_SLOT_LABELS = ['A', 'B', 'C', 'D'] as const

export type OptionSlotLabel = (typeof OPTION_SLOT_LABELS)[number]

export function optionIndexToLetter(optionIndex: number | null | undefined): string {
  if (optionIndex == null || !Number.isFinite(optionIndex)) return '—'
  const i = Math.round(optionIndex)
  if (i < 0 || i >= OPTION_SLOT_LABELS.length) return '—'
  return OPTION_SLOT_LABELS[i]!
}
