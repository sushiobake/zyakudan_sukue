import { useEffect, useRef, useState } from 'react'
import { CHARA_POSE_SRC, preloadCharaPoses, type CharaPose } from '../data/sprite'

/** CSS の transition と揃える */
const FADE_MS = 320

function loadPose(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image()
    img.src = src
    if (img.complete) {
      resolve()
      return
    }
    img.onload = () => resolve()
    img.onerror = () => resolve()
  })
}

type Props = {
  pose: CharaPose
  alt: string
}

/**
 * 旧→新を同時にフェード（読み込み完了後にだけ開始）。
 * overlay を effect 依存に入れないことで、途中でキャンセルされるのを防ぐ。
 */
export function CharaSprite({ pose, alt }: Props) {
  const [from, setFrom] = useState(pose)
  const [to, setTo] = useState<CharaPose | null>(null)
  const [fading, setFading] = useState(false)
  const fromRef = useRef(pose)

  useEffect(() => {
    preloadCharaPoses()
  }, [])

  useEffect(() => {
    if (pose === fromRef.current) {
      setTo(null)
      setFading(false)
      return
    }

    let cancelled = false
    const target = pose
    let timer = 0
    let raf1 = 0
    let raf2 = 0

    void (async () => {
      await loadPose(CHARA_POSE_SRC[target])
      if (cancelled || target !== pose) return

      setTo(target)
      setFading(false)

      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          if (cancelled || target !== pose) return
          setFading(true)

          timer = window.setTimeout(() => {
            if (cancelled || target !== pose) return
            fromRef.current = target
            setFrom(target)
            setTo(null)
            setFading(false)
          }, FADE_MS + 90)
        })
      })
    })()

    return () => {
      cancelled = true
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      window.clearTimeout(timer)
    }
  }, [pose])

  return (
    <div className={`vn-sprite-stack${fading ? ' vn-sprite-stack--fading' : ''}`}>
      <img
        key={from}
        className="vn-sprite-img"
        src={CHARA_POSE_SRC[from]}
        alt={alt}
        decoding="async"
      />
      {to ? (
        <img
          key={to}
          className="vn-sprite-img vn-sprite-img--next"
          src={CHARA_POSE_SRC[to]}
          alt=""
          aria-hidden
          decoding="async"
        />
      ) : null}
    </div>
  )
}
