import { type PointerEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ResearchLine } from '../../lib/research'

const TABS = [
  { id: 'topics', label: 'Qué estudiamos' },
  { id: 'tools', label: 'Herramientas' },
  { id: 'projects', label: 'Proyectos' },
  { id: 'resources', label: 'Recursos' },
] as const
type Tab = (typeof TABS)[number]['id']

interface Props {
  lines: ResearchLine[]
  activeId: string
  onSelect: (id: string) => void
}

/** Mapa orbital de las líneas + ficha 3D de la línea elegida. */
export function ResearchExplorer({ lines, activeId, onSelect }: Props) {
  const index = Math.max(0, lines.findIndex((l) => l.id === activeId))
  const line = lines[index]
  const [tab, setTab] = useState<Tab>('topics')
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  const step = (d: number) => onSelect(lines[(index + d + lines.length) % lines.length].id)

  function onTilt(e: PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    setTilt({ x: ((e.clientY - r.top) / r.height - 0.5) * -6, y: ((e.clientX - r.left) / r.width - 0.5) * 8 })
  }

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,440px)_1fr]">
      {/* Mapa orbital */}
      <div className="group relative mx-auto aspect-square w-[88%] max-w-[440px] sm:w-full">
        <div className="absolute inset-[8%] rounded-full border border-line" />
        <div className="absolute inset-[22%] rounded-full border border-dashed border-line/70" />
        <div className="pointer-events-none absolute inset-[30%] rounded-full blur-3xl transition-colors duration-700" style={{ background: `${line.from}33` }} />

        <div className="orbit-spin absolute inset-0 group-hover:[animation-play-state:paused]">
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
            {lines.map((l, i) => {
              const a = (i / lines.length) * Math.PI * 2 - Math.PI / 2
              const on = l.id === line.id
              return (
                <line
                  key={l.id}
                  x1="50"
                  y1="50"
                  x2={50 + Math.cos(a) * 42}
                  y2={50 + Math.sin(a) * 42}
                  stroke={on ? l.from : 'var(--color-line)'}
                  strokeWidth={on ? 0.6 : 0.3}
                  strokeDasharray={on ? undefined : '1 1.5'}
                  className="transition-all duration-500"
                />
              )
            })}
          </svg>

          {lines.map((l, i) => {
            const a = (i / lines.length) * Math.PI * 2 - Math.PI / 2
            const on = l.id === line.id
            return (
              <button
                key={l.id}
                onClick={() => onSelect(l.id)}
                aria-pressed={on}
                aria-label={l.title}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${50 + Math.cos(a) * 42}%`, top: `${50 + Math.sin(a) * 42}%` }}
              >
                <span
                  className={`orbit-counter flex h-12 w-12 items-center justify-center rounded-2xl border font-mono text-xs font-semibold text-white transition-all duration-500 group-hover:[animation-play-state:paused] sm:h-16 sm:w-16 sm:text-sm ${
                    on ? 'scale-110 border-white/40' : 'border-white/10 opacity-70 hover:scale-105 hover:opacity-100'
                  }`}
                  style={{
                    background: `linear-gradient(150deg, ${l.from}, ${l.to})`,
                    boxShadow: on ? `0 0 0 6px ${l.from}22, 0 0 40px ${l.from}88` : undefined,
                  }}
                >
                  {l.glyph}
                </span>
              </button>
            )
          })}
        </div>

        {/* Núcleo */}
        <div className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-line bg-panel text-center shadow-2xl">
          <img src="/brand/sirsg-mark.png" alt="" className="h-8 w-8" />
          <span className="mt-1 font-mono text-[10px] text-muted">SIRSG_2.0</span>
        </div>
        <p className="absolute -bottom-8 left-0 right-0 px-4 text-center font-mono text-[11px] text-muted">
          // toca una línea para ver su ficha
        </p>
      </div>

      {/* Ficha de la línea */}
      <div className="[perspective:1200px]" onPointerMove={onTilt} onPointerLeave={() => setTilt({ x: 0, y: 0 })}>
        <article
          key={line.id}
          className="rise overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl shadow-black/40 transition-transform duration-200 ease-out"
          style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
        >
          <header className="relative overflow-hidden p-6 sm:p-8" style={{ background: `radial-gradient(circle at 15% 0%, ${line.from}, ${line.to} 75%)` }}>
            <div className="grid-bg pointer-events-none absolute inset-0 opacity-40 [mask-image:none]" />
            <span className="pointer-events-none absolute -right-2 -top-6 font-mono text-[120px] font-bold leading-none text-white/10">{line.glyph}</span>
            <div className="relative">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-black/30 px-2 py-0.5 font-mono text-[11px] text-white/90">
                  {String(index + 1).padStart(2, '0')} / {String(lines.length).padStart(2, '0')}
                </span>
                <span className="rounded-md bg-white/15 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-white">
                  Nivel {line.level.toLowerCase()}
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">{line.title}</h2>
              <p className="mt-2 max-w-lg text-white/85">{line.text}</p>
            </div>
          </header>

          <div className="flex gap-1 overflow-x-auto border-b border-line px-3 pt-3" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`whitespace-nowrap rounded-t-lg border-b-2 px-3 py-2 text-sm transition ${
                  tab === t.id ? 'text-text' : 'border-transparent text-muted hover:text-text'
                }`}
                style={tab === t.id ? { borderColor: line.from } : undefined}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div key={`${line.id}-${tab}`} className="rise min-h-[150px] p-6">
            {tab === 'topics' && (
              <ul className="flex flex-wrap gap-2">
                {line.topics.map((t, i) => (
                  <li key={t} className="rise rounded-full border border-line bg-panel-2 px-3 py-1.5 text-sm" style={{ animationDelay: `${i * 50}ms` }}>
                    {t}
                  </li>
                ))}
              </ul>
            )}
            {tab === 'tools' && (
              <ul className="grid gap-2 sm:grid-cols-2">
                {line.tools.map((t, i) => (
                  <li key={t} className="rise flex items-center gap-3 rounded-lg border border-line bg-panel-2 px-3 py-2 font-mono text-sm" style={{ animationDelay: `${i * 50}ms` }}>
                    <span style={{ color: line.from }}>$</span> {t}
                  </li>
                ))}
              </ul>
            )}
            {tab === 'projects' && (
              <ol className="space-y-3">
                {line.projects.map((p, i) => (
                  <li key={p} className="rise flex gap-3 text-sm" style={{ animationDelay: `${i * 60}ms` }}>
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-xs text-ink" style={{ background: line.from }}>
                      {i + 1}
                    </span>
                    <span className="text-text/85">{p}</span>
                  </li>
                ))}
              </ol>
            )}
            {tab === 'resources' && (
              <ul className="grid gap-2 sm:grid-cols-2">
                {line.resources.map((r) => (
                  <li key={r.url}>
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-lg border border-line bg-panel-2 px-4 py-3 text-sm transition hover:border-white/30">
                      {r.name} <span style={{ color: line.from }}>↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line p-4">
            <div className="flex gap-2">
              <button className="btn btn-ghost !px-3" onClick={() => step(-1)} aria-label="Línea anterior">
                ←
              </button>
              <button className="btn btn-ghost !px-3" onClick={() => step(1)} aria-label="Línea siguiente">
                →
              </button>
            </div>
            <Link to={`/contacto?linea=${encodeURIComponent(line.title)}`} className="btn btn-primary rounded-full">
              Quiero unirme a esta línea
            </Link>
          </footer>
        </article>
      </div>
    </div>
  )
}
