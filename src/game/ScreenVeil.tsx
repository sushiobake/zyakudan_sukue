type Props = {
  active: boolean
}

/** 画面切替用の暗転ベール（タイトル→プレイなど） */
export function ScreenVeil({ active }: Props) {
  return <div className={`vn-screen-veil${active ? ' vn-screen-veil--active' : ''}`} aria-hidden />
}
