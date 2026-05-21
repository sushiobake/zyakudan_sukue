import { useEffect, useState, type RefObject } from 'react'

const MOBILE_MQ = '(max-width: 640px)'
const SCROLL_EDGE = 8

function readScrollState(el: HTMLElement, mobile: boolean) {
  if (!mobile) return false
  const overflow = el.scrollHeight > el.clientHeight + 2
  const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - SCROLL_EDGE
  return overflow && !atBottom
}

function bindScrollMore(
  el: HTMLElement,
  setMore: (v: boolean) => void,
): () => void {
  const mq = window.matchMedia(MOBILE_MQ)
  const update = () => setMore(readScrollState(el, mq.matches))

  update()
  const t1 = window.setTimeout(update, 80)
  const t2 = window.setTimeout(update, 320)
  el.addEventListener('scroll', update, { passive: true })
  const ro = new ResizeObserver(update)
  ro.observe(el)
  for (const child of el.children) ro.observe(child)
  mq.addEventListener('change', update)
  window.addEventListener('resize', update)

  return () => {
    window.clearTimeout(t1)
    window.clearTimeout(t2)
    el.removeEventListener('scroll', update)
    ro.disconnect()
    mq.removeEventListener('change', update)
    window.removeEventListener('resize', update)
  }
}

/** モバイルで下に続きがあるスクロール領域か */
export function useMobileScrollMore(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
  watchKey?: string | number,
): boolean {
  const [more, setMore] = useState(false)

  useEffect(() => {
    if (!enabled) return
    const el = ref.current
    if (!el) return
    el.scrollTop = 0
    return bindScrollMore(el, setMore)
  }, [enabled, ref, watchKey])

  return enabled ? more : false
}
