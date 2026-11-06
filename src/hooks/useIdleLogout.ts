import { useEffect } from 'react'

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'] as const

/** RF-12: llama a onIdle tras `minutes` sin actividad del usuario. */
export function useIdleLogout(minutes: number, onIdle: () => void) {
  useEffect(() => {
    let timer = window.setTimeout(onIdle, minutes * 60_000)
    const reset = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(onIdle, minutes * 60_000)
    }
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, reset, { passive: true }))
    return () => {
      window.clearTimeout(timer)
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, reset))
    }
  }, [minutes, onIdle])
}
