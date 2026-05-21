import { useEffect, useRef, useState } from 'react'
import { preloadBackgroundImage } from '../data/backgrounds'

/** CSS の .vn-bg-img transition と揃える */
const FADE_MS = 400

type Props = {
  src: string
  onError?: () => void
}

/**
 * 背景の二重レイヤー＋クロスフェード（読み込み完了後に切替）。
 */
export function BackgroundLayer({ src, onError }: Props) {
  const [from, setFrom] = useState(src)
  const [to, setTo] = useState<string | null>(null)
  const [fading, setFading] = useState(false)
  const fromRef = useRef(src)

  useEffect(() => {
    if (src === fromRef.current) {
      setTo(null)
      setFading(false)
      return
    }

    let cancelled = false
    const target = src
    let timer = 0
    let raf1 = 0
    let raf2 = 0

    void (async () => {
      await preloadBackgroundImage(target)
      if (cancelled || target !== src) return

      setTo(target)
      setFading(false)

      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          if (cancelled || target !== src) return
          setFading(true)

          timer = window.setTimeout(() => {
            if (cancelled || target !== src) return
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
  }, [src])

  return (
    <div className={`vn-bg-stack${fading ? ' vn-bg-stack--fading' : ''}`}>
      <img
        key={from}
        className="vn-bg-img"
        src={from}
        alt=""
        width={1920}
        height={1080}
        onError={onError}
      />
      {to ? (
        <img
          key={to}
          className="vn-bg-img vn-bg-img--next"
          src={to}
          alt=""
          aria-hidden
          width={1920}
          height={1080}
          onError={onError}
        />
      ) : null}
    </div>
  )
}
