import { type PointerEvent, useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAsync } from '../../hooks/useAsync'
import { useInView } from '../../hooks/useInView'
import { ACTIVITIES, JOIN_STEPS, VALUES } from '../../lib/about'
import { RESEARCH_LINES } from '../../lib/research'
import { RESOURCES } from '../../lib/resources'
import { listAllEvents } from '../../services/events'
import { PUBLIC_SECTIONS } from '../../services/sections'
import type { SectionVersion } from '../../types'
import { RichText } from '../RichText'
import { UniversityBadge } from '../UniversityBadge'
import { InteractiveTerminal } from './InteractiveTerminal'

/**
 * Página interactiva de "Quiénes somos". El texto publicado desde el panel (RF-01)
 * se usa como introducción y aparece completo al final.
 */
export function AboutPage({ section }: { section: SectionVersion | null }) {
  const { data: events } = useAsync(listAllEvents, [])
  const upcoming = events?.filter((e) => new Date(e.ends_at).getTime() >= Date.now()).length ?? 0
  const intro = section?.body.split(/\n\s*\n/)[0]

  return (
    <div className="pb-8">
      {/* Héroe */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="grid-bg pointer-events-none absolute inset-0" />
        <div className="container-page relative py-12">
          <nav className="flex flex-wrap gap-2" aria-label="Secciones del semillero">
            {PUBLIC_SECTIONS.map((s) => (
              <NavLink
                key={s.slug}
                to={`/seccion/${s.slug}`}
                className={({ isActive }) =>
                  `rounded-full border px-3 py-1 text-xs transition ${isActive ? 'border-neon/50 bg-neon/10 text-neon' : 'border-line text-muted hover:text-text'}`
                }
              >
                {s.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-10 grid items-center gap-10 lg:grid-cols-[1fr_1.05fr]">
            <div className="rise">
              <div className="scan relative inline-block">
                <img src="/brand/sirsg-mark.png" alt="Logo SIRSG 2.0" className="h-24 w-24 drop-shadow-[0_0_30px_rgba(110,252,174,0.35)]" />
              </div>
              <p className="mt-6 font-mono text-xs uppercase tracking-[0.25em] text-neon">// semillero</p>
              <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">{section?.title ?? 'Quiénes somos'}</h1>
              <p className="mt-4 max-w-xl text-lg text-muted">
                {intro ??
                  'SIRSG 2.0 es el Semillero de Investigación en Ciberseguridad: estudiantes y docentes que aprenden, practican e investigan seguridad informática más allá del aula.'}
              </p>
              <div className="mt-6 flex items-center gap-4">
                <UniversityBadge size="sm" />
                <span className="text-sm text-muted">Universidad ECCI</span>
              </div>
            </div>
            <div className="rise [animation-delay:150ms]">
              <InteractiveTerminal />
            </div>
          </div>
        </div>
      </section>

      {/* Cifras */}
      <section className="container-page -mt-px py-12">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Counter value={RESEARCH_LINES.length} label="líneas de investigación" />
          <Counter value={upcoming} label="eventos próximos" />
          <Counter value={RESOURCES.length} label="recursos recomendados" />
          <Counter value={0} label="experiencia previa requerida" />
        </div>
      </section>

      {/* Qué hacemos */}
      <section className="container-page py-8">
        <Heading tag="actividades" title="Qué hacemos" text="Pasa el cursor o toca una tarjeta para darle la vuelta." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {ACTIVITIES.map((a, i) => (
            <FlipCard key={a.title} index={i} {...a} />
          ))}
        </div>
      </section>

      {/* Valores */}
      <section className="container-page py-12">
        <Heading tag="valores" title="En qué creemos" />
        <div className="grid gap-4 sm:grid-cols-2">
          {VALUES.map((v, i) => (
            <SpotlightCard key={v.title} index={i} {...v} />
          ))}
        </div>
      </section>

      {/* Cómo unirte */}
      <section className="container-page py-8">
        <Heading tag="participa" title="Cómo unirte" text="Estudiantes de todas las carreras y sedes, incluida la sede sur." />
        <ol className="relative space-y-6 border-l border-line pl-8 sm:ml-4">
          {JOIN_STEPS.map((s, i) => (
            <Step key={s.title} index={i} {...s} />
          ))}
        </ol>
      </section>

      {section && (
        <section className="container-page mt-12">
          <details className="card group p-6">
            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
              Leer el texto completo
              <span className="font-mono text-neon transition group-open:rotate-45">+</span>
            </summary>
            <div className="mt-6 max-w-3xl">
              <RichText body={section.body} />
            </div>
          </details>
        </section>
      )}

      <section className="container-page mt-16">
        <div className="card relative overflow-hidden p-8 text-center">
          <div className="grid-bg pointer-events-none absolute inset-0" />
          <div className="relative">
            <p className="font-mono text-sm text-neon">$ ./unirse --semillero</p>
            <h2 className="mt-2 text-2xl font-bold">¿Te sumas?</h2>
            <p className="mx-auto mt-2 max-w-lg text-muted">No necesitas experiencia previa: solo curiosidad y ganas de aprender.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link to="/contacto" className="btn btn-primary rounded-full">
                Inscribirme
              </Link>
              <Link to="/seccion/mision-vision" className="btn btn-ghost rounded-full">
                Misión y visión →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function Heading({ tag, title, text }: { tag: string; title: string; text?: string }) {
  return (
    <div className="mb-6">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-neon">// {tag}</p>
      <h2 className="mt-1 text-2xl font-bold">{title}</h2>
      {text && <p className="mt-1 text-muted">{text}</p>}
    </div>
  )
}

/** Número que cuenta desde 0 cuando entra en pantalla. */
function Counter({ value, label }: { value: number; label: string }) {
  const [ref, inView] = useInView<HTMLDivElement>(0.5)
  const [shown, setShown] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || value === 0) return setShown(value)
    const start = performance.now()
    let frame = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 1200)
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))))
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [inView, value])

  return (
    <div ref={ref} className="card p-5">
      <p className="font-mono text-4xl font-semibold text-neon">{shown}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  )
}

/** Tarjeta que se voltea con hover (escritorio) o con un toque (móvil). */
function FlipCard({ glyph, title, front, back, index }: { glyph: string; title: string; front: string; back: string; index: number }) {
  const [flipped, setFlipped] = useState(false)
  return (
    <button
      onClick={() => setFlipped((f) => !f)}
      aria-pressed={flipped}
      aria-label={`${title}: ${back}`}
      className="group rise h-56 text-left [perspective:1000px]"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <span
        className={`relative block h-full w-full transition-transform duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] ${flipped ? '[transform:rotateY(180deg)]' : ''}`}
      >
        <span className="card absolute inset-0 flex flex-col p-5 [backface-visibility:hidden]">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-neon/30 bg-neon/10 text-xl text-neon">{glyph}</span>
          <span className="mt-auto block font-semibold">{title}</span>
          <span className="mt-1 block text-sm text-muted">{front}</span>
          <span className="mt-3 block font-mono text-[11px] text-neon-dim">voltear ↻</span>
        </span>
        <span className="absolute inset-0 flex flex-col justify-center rounded-xl border border-neon/40 bg-[linear-gradient(150deg,#0f7a61,#0b2a3f)] p-5 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <span className="font-mono text-xs text-neon">$ cat {title.toLowerCase().split(' ')[0]}.txt</span>
          <span className="mt-2 block text-sm text-white/90">{back}</span>
        </span>
      </span>
    </button>
  )
}

/** Tarjeta con un brillo que sigue al cursor. */
function SpotlightCard({ title, text, color, index }: { title: string; text: string; color: string; index: number }) {
  const [pos, setPos] = useState({ x: -400, y: -400 })
  function onMove(e: PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    setPos({ x: e.clientX - r.left, y: e.clientY - r.top })
  }
  return (
    <div
      onPointerMove={onMove}
      onPointerLeave={() => setPos({ x: -400, y: -400 })}
      className="card group relative overflow-hidden p-6 transition hover:border-white/20"
      style={{ background: `radial-gradient(280px circle at ${pos.x}px ${pos.y}px, ${color}26, transparent 70%)` }}
    >
      <div className="flex items-start gap-4">
        <span className="font-mono text-3xl font-semibold" style={{ color }}>
          0{index + 1}
        </span>
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="mt-1 text-muted">{text}</p>
        </div>
      </div>
      <span className="absolute bottom-0 left-0 h-0.5 w-0 transition-all duration-500 group-hover:w-full" style={{ background: color }} />
    </div>
  )
}

/** Paso de la línea de tiempo que aparece al hacer scroll. */
function Step({ title, text, to, cta, index }: { title: string; text: string; to: string; cta: string; index: number }) {
  const [ref, inView] = useInView<HTMLLIElement>(0.4)
  return (
    <li
      ref={ref}
      className={`relative transition-all duration-700 ${inView ? 'translate-x-0 opacity-100' : 'translate-x-6 opacity-0'}`}
      style={{ transitionDelay: `${index * 120}ms` }}
    >
      <span
        className={`absolute -left-[49px] top-1 flex h-8 w-8 items-center justify-center rounded-full border font-mono text-sm transition-colors duration-700 ${
          inView ? 'border-neon bg-neon text-ink' : 'border-line bg-panel text-muted'
        }`}
      >
        {index + 1}
      </span>
      <div className="card p-5">
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted">{text}</p>
        <Link to={to} className="mt-3 inline-block text-sm text-neon hover:underline">
          {cta} →
        </Link>
      </div>
    </li>
  )
}
