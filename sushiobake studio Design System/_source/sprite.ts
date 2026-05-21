/**
 * chara3_touka.png（2×2スプライト）の並び仕様：
 * 画像は public/chara3_touka.png に置く（アルファ付き PNG 推奨）
 * ┌─────────┬─────────┐
 * │ ① 通常   │ ② 微笑み │
 * ├─────────┼─────────┤
 * │ ③ 照れ   │ ④ 驚き   │
 * └─────────┴─────────┘
 */
export type CharaPose = 1 | 2 | 3 | 4

export const CHARA_SHEET_SRC = '/chara3_touka.png'

/** ソース画像の総ピクセル（並び検証用・ドキュメント） */
export const CHARA_SHEET_SIZE = { w: 1254, h: 1254 }
