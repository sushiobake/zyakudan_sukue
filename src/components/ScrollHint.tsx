import { useRef, type ReactNode } from 'react'
import { useMobileScrollMore } from '../utils/useMobileScrollMore'

export function ScrollHintOverlay() {
  return (
    <div className="vn-scroll-hint__overlay" aria-hidden="true">
      <span className="vn-scroll-hint__cue">
        <span className="vn-scroll-hint__chev vn-scroll-hint__chev--a" />
        <span className="vn-scroll-hint__chev vn-scroll-hint__chev--b" />
      </span>
    </div>
  )
}

/** シチュ・反応窓内の縦スクロール用（モバイルのみヒント表示） */
export function ScrollHint({
  children,
  className = '',
  watchKey,
}: {
  children: ReactNode
  className?: string
  watchKey?: string | number
}) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const more = useMobileScrollMore(viewportRef, true, watchKey)

  return (
    <div
      className={`vn-scroll-hint${more ? ' vn-scroll-hint--more' : ''}${className ? ` ${className}` : ''}`}
    >
      <div ref={viewportRef} className="vn-scroll-hint__viewport">
        {children}
      </div>
      {more ? <ScrollHintOverlay /> : null}
    </div>
  )
}
