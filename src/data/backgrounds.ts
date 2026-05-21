/**
 * プレイ画面の背景（public/ 直下を / から参照）
 */
export type BackgroundSceneId =
  | 'station'
  | 'riverside'
  | 'residential'
  | 'cafe_street'
  | 'cafe_interior'

export const BACKGROUND_SCENES: Record<
  BackgroundSceneId,
  { label: string; path: string }
> = {
  station: { label: '駅', path: '/haikei_ai_station.png' },
  riverside: { label: '川沿い', path: '/haikei_ai_riverside.png' },
  residential: { label: '住宅街', path: '/haikei_ai_residential.png' },
  cafe_street: { label: '店外', path: '/haikei_ai_cafe_street.png' },
  cafe_interior: { label: '店内', path: '/haikei_ai_cafe_interior.png' },
}

export const BACKGROUND_SCENE_IDS = Object.keys(
  BACKGROUND_SCENES,
) as BackgroundSceneId[]

export const TITLE_BACKGROUND = '/title_candidates/title_bg_b_ordinary_center.png'

/** 画像が無い・読み込み失敗時 */
export const BACKGROUND_FALLBACK = '/bg-classroom.svg'

/** @deprecated 互換用。順序は BACKGROUND_SCENE_IDS と同じ */
export const HAIKEI_BACKGROUNDS = BACKGROUND_SCENE_IDS.map(
  (id) => BACKGROUND_SCENES[id].path,
)

export function isBackgroundSceneId(value: unknown): value is BackgroundSceneId {
  return typeof value === 'string' && value in BACKGROUND_SCENES
}

export function backgroundPath(id: BackgroundSceneId): string {
  return BACKGROUND_SCENES[id].path
}

/** シチュ文から背景を推定（JSON に background が無い旧データ用） */
export function inferBackgroundFromSituation(text: string): BackgroundSceneId {
  const t = text.replace(/\r\n/g, '\n')
  if (/改札|駅前|駅まで|待ち合わせ|電車が/.test(t)) return 'station'
  if (
    /店に入|店内|注文|おしぼり|テーブル|伝票|料理|グラス|二杯|バーに入|一軒目を終え|食事を終え|席で|カフェに着|二件目のバー/.test(
      t,
    )
  ) {
    return 'cafe_interior'
  }
  if (/川|河|リバー|水辺|川沿い/.test(t)) return 'riverside'
  if (/住宅|マンション|ホテル街|アパート|角を曲がる/.test(t)) return 'residential'
  if (/徒歩|夜の街|店をどう|一軒目を出|夜道|歩い|並んで.*歩|駅から数分/.test(t)) {
    return 'cafe_street'
  }
  return 'cafe_street'
}

export function resolveQuestionBackground(question: {
  situation: string
  background?: BackgroundSceneId
}): BackgroundSceneId {
  if (question.background && isBackgroundSceneId(question.background)) {
    return question.background
  }
  return inferBackgroundFromSituation(question.situation)
}
