import { useState, useEffect } from 'react'

/**
 * Returns responsive chart height — smaller on mobile, larger on desktop.
 * Uses matchMedia instead of window.innerWidth for SSR safety.
 */
export function useChartHeight(mobileHeight: number, desktopHeight: number): number {
  const [height, setHeight] = useState(desktopHeight)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const update = () => setHeight(mq.matches ? mobileHeight : desktopHeight)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [mobileHeight, desktopHeight])

  return height
}
