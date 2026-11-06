import { useEffect, useRef } from 'react'
import { TURNSTILE_SITE_KEY } from '../../lib/config'
import { Alert } from './Alert'

interface TurnstileApi {
  render: (el: HTMLElement, options: Record<string, unknown>) => string
  remove: (id: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
let scriptPromise: Promise<void> | null = null

function loadScript() {
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('No se pudo cargar el CAPTCHA.'))
    }
    document.head.appendChild(script)
  })
  return scriptPromise
}

interface Props {
  /** Recibe el token cuando la persona pasa la verificación, o null si caduca o falla. */
  onToken: (token: string | null) => void
}

/**
 * CAPTCHA de Cloudflare Turnstile (RF-08, RF-11). Cada token sirve una sola vez:
 * para pedir otro, vuelve a montar el componente cambiando su `key`.
 */
export function Turnstile({ onToken }: Props) {
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return
    let cancelled = false
    let widgetId: string | null = null
    loadScript()
      .then(() => {
        if (cancelled || !box.current || !window.turnstile) return
        widgetId = window.turnstile.render(box.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: 'dark',
          language: 'es',
          callback: (token: string) => onToken(token),
          'expired-callback': () => onToken(null),
          'error-callback': () => onToken(null),
        })
      })
      .catch(() => onToken(null))
    return () => {
      cancelled = true
      if (widgetId) window.turnstile?.remove(widgetId)
    }
  }, [onToken])

  if (!TURNSTILE_SITE_KEY) return <Alert kind="warn">El CAPTCHA no está configurado (VITE_TURNSTILE_SITE_KEY).</Alert>
  return <div ref={box} className="min-h-[65px]" />
}
