import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const NEXT_STEPS = [
  { to: '/eventos', title: 'Mira la cartelera', text: 'Elige la próxima reunión.' },
  { to: '/seccion/lineas-investigacion', title: 'Haz el test de líneas', text: 'Descubre por dónde empezar.' },
  { to: '/documentos', title: 'Revisa el material', text: 'Guías y recursos del semillero.' },
]

interface Props {
  name: string
  onClose: () => void
}

/**
 * Bienvenida tras inscribirse: reproduce la intro del logo (saltable) y luego
 * muestra los siguientes pasos. Con "reducir movimiento" va directo al mensaje.
 */
export function WelcomeIntro({ name, onClose }: Props) {
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [phase, setPhase] = useState<'video' | 'welcome'>(reduced ? 'welcome' : 'video')
  const [muted, setMuted] = useState(false)
  const video = useRef<HTMLVideoElement>(null)
  const firstButton = useRef<HTMLButtonElement>(null)

  // Bloquea el scroll de la página y cierra con Escape.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  // El foco va al botón principal de cada fase ("Saltar intro" o "Listo").
  useEffect(() => {
    firstButton.current?.focus()
  }, [phase])

  // Intenta reproducir con sonido; si el navegador lo bloquea, sigue en silencio.
  useEffect(() => {
    const v = video.current
    if (phase !== 'video' || !v) return
    v.muted = false
    v.play().catch(() => {
      v.muted = true
      setMuted(true)
      v.play().catch(() => setPhase('welcome'))
    })
  }, [phase])

  function toggleSound() {
    if (!video.current) return
    video.current.muted = !muted
    setMuted(!muted)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Bienvenida a SIRSG 2.0">
      {phase === 'video' ? (
        <div className="rise relative w-full max-w-4xl">
          <video
            ref={video}
            src="/brand/sirsg-intro.mp4"
            playsInline
            preload="auto"
            onEnded={() => setPhase('welcome')}
            onError={() => setPhase('welcome')}
            className="aspect-video w-full rounded-2xl border border-neon/20 bg-black shadow-[0_0_80px_rgba(34,211,166,0.25)]"
          />
          <div className="mt-4 flex items-center justify-between gap-3">
            <button className="btn btn-ghost rounded-full" onClick={toggleSound}>
              {muted ? '🔇 Activar sonido' : '🔊 Silenciar'}
            </button>
            <button ref={firstButton} className="btn btn-primary rounded-full" onClick={() => setPhase('welcome')}>
              Saltar intro →
            </button>
          </div>
        </div>
      ) : (
        <div className="rise relative w-full max-w-xl overflow-hidden rounded-3xl border border-line bg-panel p-8 text-center shadow-2xl">
          <div className="grid-bg pointer-events-none absolute inset-0 opacity-50" />
          <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-neon/25 blur-3xl" />
          <div className="relative">
            <img src="/brand/sirsg-mark.png" alt="" className="mx-auto h-20 w-20 drop-shadow-[0_0_30px_rgba(110,252,174,0.4)]" />
            <p className="mt-4 font-mono text-xs text-neon">$ ./unirse --exito</p>
            <h2 className="mt-2 text-3xl font-bold">
              ¡Bienvenido a SIRSG 2.0{name ? `, ${name}` : ''}!
            </h2>
            <p className="mt-2 text-muted">Recibimos tu inscripción. Te escribiremos a tu correo con los detalles.</p>

            <ul className="mt-6 grid gap-2 text-left">
              {NEXT_STEPS.map((s, i) => (
                <li key={s.to}>
                  <Link to={s.to} onClick={onClose} className="flex items-center gap-3 rounded-xl border border-line bg-panel-2 p-3 transition hover:border-neon/50">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neon/10 font-mono text-sm text-neon">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{s.title}</span>
                      <span className="block text-xs text-muted">{s.text}</span>
                    </span>
                    <span className="text-neon">→</span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <button ref={phase === 'welcome' ? firstButton : undefined} className="btn btn-primary rounded-full" onClick={onClose}>
                Listo
              </button>
              {!reduced && (
                <button className="btn btn-ghost rounded-full" onClick={() => setPhase('video')}>
                  Ver la intro otra vez
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
