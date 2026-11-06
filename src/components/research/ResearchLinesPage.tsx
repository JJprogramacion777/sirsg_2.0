import { useRef } from 'react'
import { Link, NavLink, useSearchParams } from 'react-router-dom'
import { RESEARCH_LINES } from '../../lib/research'
import { PUBLIC_SECTIONS } from '../../services/sections'
import type { SectionVersion } from '../../types'
import { RichText } from '../RichText'
import { LineQuiz } from './LineQuiz'
import { ResearchExplorer } from './ResearchExplorer'

/**
 * Página interactiva de "Líneas de investigación". El texto publicado desde el panel
 * (RF-01) se muestra como introducción y completo al final; las fichas salen de src/lib/research.ts.
 */
export function ResearchLinesPage({ section }: { section: SectionVersion | null }) {
  const [params, setParams] = useSearchParams()
  const explorer = useRef<HTMLDivElement>(null)
  const activeId = RESEARCH_LINES.some((l) => l.id === params.get('linea')) ? params.get('linea')! : RESEARCH_LINES[0].id

  const select = (id: string) => setParams({ linea: id }, { replace: true, preventScrollReset: true })
  const pick = (id: string) => {
    select(id)
    explorer.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const intro = section?.body.split(/\n\s*\n/)[0]
  const topics = RESEARCH_LINES.reduce((n, l) => n + l.topics.length, 0)
  const tools = new Set(RESEARCH_LINES.flatMap((l) => l.tools)).size

  return (
    <div className="pb-8">
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
          <p className="mt-8 font-mono text-xs uppercase tracking-[0.25em] text-neon">// investigación</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">{section?.title ?? 'Líneas de investigación'}</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            {intro ?? 'Organizamos el trabajo del semillero en líneas. Cada integrante puede elegir la que más le interese y moverse entre ellas.'}
          </p>
          <dl className="mt-8 grid max-w-xl grid-cols-3 gap-3">
            {[
              { value: RESEARCH_LINES.length, label: 'líneas' },
              { value: topics, label: 'temas' },
              { value: tools, label: 'herramientas' },
            ].map((s) => (
              <div key={s.label} className="card px-4 py-3">
                <dt className="sr-only">{s.label}</dt>
                <dd className="font-mono text-2xl font-semibold text-neon">{s.value}</dd>
                <dd className="text-xs text-muted">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section ref={explorer} className="container-page scroll-mt-24 py-16">
        <ResearchExplorer lines={RESEARCH_LINES} activeId={activeId} onSelect={select} />
      </section>

      <section className="container-page">
        <div className="mb-6">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neon">// test</p>
          <h2 className="mt-1 text-2xl font-bold">¿Qué línea va contigo?</h2>
          <p className="mt-1 text-muted">Responde 3 preguntas rápidas y te recomendamos por dónde empezar.</p>
        </div>
        <LineQuiz lines={RESEARCH_LINES} onPick={pick} />
      </section>

      {section && (
        <section className="container-page mt-16">
          <details className="card group p-6">
            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
              Descripción completa de las líneas
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
            <h2 className="text-2xl font-bold">¿Ya sabes cuál es la tuya?</h2>
            <p className="mx-auto mt-2 max-w-lg text-muted">Inscríbete y te contamos cuándo es la próxima reunión de tu línea.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link to="/contacto" className="btn btn-primary rounded-full">
                Inscribirme
              </Link>
              <Link to="/eventos" className="btn btn-ghost rounded-full">
                Ver la cartelera
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
