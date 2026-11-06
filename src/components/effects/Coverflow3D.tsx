import { type KeyboardEvent, type PointerEvent, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

export interface CoverItem {
  id: string
  glyph: string
  title: string
  text: string
  from: string
  to: string
}

const AUTOPLAY_MS = 4000

/** Carrusel en abanico 3D: la tarjeta activa al frente y las demás giradas hacia el centro. */
export function Coverflow3D({ items, linkTo }: { items: readonly CoverItem[]; linkTo?: (item: CoverItem) => string }) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const dragX = useRef<number | null>(null)
  /** Tras un arrastre se ignora el clic que lo acompaña. */
  const dragged = useRef(false)
  const n = items.length

  const go = (i: number) => setActive(((i % n) + n) % n)

  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => setActive((a) => (a + 1) % n), AUTOPLAY_MS)
    return () => window.clearInterval(id)
  }, [paused, n])

  function onKey(e: KeyboardEvent) {
    if (e.key === 'ArrowRight') go(active + 1)
    if (e.key === 'ArrowLeft') go(active - 1)
  }

  function onPointerDown(e: PointerEvent) {
    dragX.current = e.clientX
    dragged.current = false
  }
  function onPointerUp(e: PointerEvent) {
    if (dragX.current === null) return
    const dx = e.clientX - dragX.current
    dragX.current = null
    if (Math.abs(dx) > 40) {
      dragged.current = true
      go(active + (dx < 0 ? 1 : -1))
    }
  }

  return (
    <div
      className="relative select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        className="relative mx-auto h-[380px] overflow-hidden [perspective:1200px] sm:h-[420px]"
        role="region"
        aria-roledescription="carrusel"
        aria-label="Líneas de investigación"
        tabIndex={0}
        onKeyDown={onKey}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        {items.map((item, i) => {
          // Distancia circular a la tarjeta activa, en el rango [-n/2, n/2].
          let off = i - active
          if (off > n / 2) off -= n
          if (off < -n / 2) off += n
          const abs = Math.abs(off)
          const side = Math.sign(off)
          const x = side === 0 ? 0 : side * (58 + (abs - 1) * 22)
          const transform = `translate(-50%, -50%) translateX(${x}%) translateZ(${-abs * 140}px) rotateY(${-side * 42}deg)`

          return (
            <article
              key={item.title}
              aria-hidden={off !== 0}
              onClick={() => !dragged.current && off !== 0 && go(i)}
              className="absolute left-1/2 top-1/2 w-[220px] cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-panel shadow-2xl transition-[transform,filter,opacity] duration-700 ease-[cubic-bezier(.2,.8,.2,1)] sm:w-[260px]"
              style={{
                transform,
                zIndex: 100 - abs,
                opacity: abs > 3 ? 0 : 1,
                filter: `brightness(${1 - abs * 0.22})`,
                pointerEvents: abs > 3 ? 'none' : undefined,
              }}
            >
              <div
                className="relative flex h-[200px] items-center justify-center overflow-hidden sm:h-[230px]"
                style={{ background: `radial-gradient(circle at 30% 20%, ${item.from}, ${item.to} 70%)` }}
              >
                <div className="grid-bg absolute inset-0 opacity-40 [mask-image:none]" />
                <span className="relative font-mono text-6xl font-semibold text-white/90 drop-shadow-[0_6px_24px_rgba(0,0,0,.45)]">
                  {item.glyph}
                </span>
              </div>
              <div className="p-5">
                <p className="font-mono text-[11px] text-muted">
                  {String(i + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
                </p>
                <h3 className="mt-1 font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-muted">{item.text}</p>
                {linkTo && off === 0 && (
                  <Link to={linkTo(item)} className="mt-3 inline-block text-sm font-medium text-neon hover:underline">
                    Ver detalle →
                  </Link>
                )}
              </div>
            </article>
          )
        })}
      </div>

      <div className="mt-2 flex items-center justify-center gap-4">
        <button className="btn btn-ghost !px-3" onClick={() => go(active - 1)} aria-label="Anterior">
          ←
        </button>
        <div className="flex gap-2">
          {items.map((item, i) => (
            <button
              key={item.title}
              onClick={() => go(i)}
              aria-label={item.title}
              aria-current={i === active}
              className={`h-1.5 rounded-full transition-all ${i === active ? 'w-6 bg-neon' : 'w-1.5 bg-line hover:bg-muted'}`}
            />
          ))}
        </div>
        <button className="btn btn-ghost !px-3" onClick={() => go(active + 1)} aria-label="Siguiente">
          →
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        {items[active].title}: {items[active].text}
      </p>
    </div>
  )
}
