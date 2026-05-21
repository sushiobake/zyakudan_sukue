type Props = {
  onActivate: () => void
}

/** 画面下半分をタップして ADV を進める（見た目はなし。キーボードは親が担当） */
export function AdvHitzone({ onActivate }: Props) {
  return (
    <div
      className="vn-adv-hitzone"
      aria-hidden="true"
      onClick={onActivate}
    />
  )
}
