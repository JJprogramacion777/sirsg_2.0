import { type PointerEvent, useRef, useState } from 'react'

export interface FloatingItem {
  name: string
  url: string
  text: string
  group: string
}

interface Props {
  items: readonly FloatingItem[]
  groups: readonly { id: string; label: string; from: string; to: string }[]
}

/** Posición de cada tarjeta en el escenario: x/y en %, profundidad y giro en grados. */
const SLOTS = [
  [11, 22, -40, 25, -6], [30, 18, 40, 12, 4], [50, 24, -120, -4, 6], [70, 17, 20, -14, -4], [89, 25, -60, -26, 5],
  [19, 52, 60, 22, 3], [40, 50, -160, 8, -5], [61, 53, 80, -10, 4], [81, 55, -20, -22, -3],
  [28, 80, -80, 16, 6], [50, 78, 30, 0, -4], [72, 81, -140, -16, 5],
] as const

const ALL = 'todos'

/**
 * Tarjetas que flotan en 3D. Al elegir una pestaña, las del grupo pasan al frente
 * y el resto se aleja y se oscurece. El escenario se inclina siguiendo al cursor.
 */
export function FloatingCards3D({ items, groups }: Props) {
  const [filter, setFilter] = useState(ALL)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const stage = useRef<HTMLDivElement>(null)
  const groupOf = (id: string) => groups.find((g) => g.id === id)!

  function onMove(e: PointerEvent) {
    const r = stage.current?.getBoundingClientRect()
    if (!r) return
    setTilt({ x: ((e.clientY - r.top) / r.height - 0.5) * -8, y: ((e.clientX - r.left) / r.width - 0.5) * 10 })
  }

  const tabs = [{ id: ALL, label: 'Todos' }, ...groups]
  const tabBar = (
    <div className="flex flex-wrap justify-center gap-1 font-mono text-xs uppercase tracking-wider" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={filter === t.id}
          onClick={() => setFilter(t.id)}
          className={`rounded-md px-3 py-1.5 transition ${filter === t.id ? 'bg-text text-ink' : 'text-muted hover:text-text'}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )

  return (
    <div>
      {/* Escritorio: escenario 3D */}
      <div
        ref={stage}
        className="relative hidden h-[640px] overflow-hidden rounded-2xl border border-line bg-[#07090d] [perspective:1100px] md:block"
        onPointerMove={onMove}
        onPointerLeave={() => setTilt({ x: 0, y: 0 })}
      >
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-60" />
        <div
          className="absolute inset-0 transition-transform duration-300 ease-out [transform-style:preserve-3d]"
          style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
        >
          {items.map((item, i) => {
            const [x, y, z, ry, rx] = SLOTS[i % SLOTS.length]
            const on = filter === ALL || item.group === filter
            const focus = filter !== ALL && on
            const g = groupOf(item.group)
            return (
              <a
                key={item.url}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={on ? 0 : -1}
                aria-hidden={!on}
                className="absolute w-[150px] transition-[transform,filter,opacity] duration-700 ease-[cubic-bezier(.2,.8,.2,1)] [transform-style:preserve-3d]"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: `translate(-50%, -50%) translateZ(${focus ? z + 160 : on ? z : z - 260}px) rotateY(${focus ? ry * 0.4 : ry}deg) rotateX(${rx}deg)`,
                  filter: `brightness(${on ? 1 : 0.28}) saturate(${on ? 1 : 0.5})`,
                  pointerEvents: on ? undefined : 'none',
                  zIndex: focus ? 2 : 1,
                }}
              >
                <div className="float-card group" style={{ animationDelay: `${-i * 0.7}s`, animationDuration: `${5 + (i % 4)}s` }}>
                  <div
                    className="flex h-[110px] items-center justify-center rounded-t-xl font-mono text-3xl font-semibold text-white/90"
                    style={{ background: `linear-gradient(150deg, ${g.from}, ${g.to})` }}
                  >
                    {item.name
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join('')}
                  </div>
                  <div className="rounded-b-xl border border-t-0 border-white/10 bg-panel p-3">
                    <p className="truncate text-sm font-semibold group-hover:text-neon">{item.name} ↗</p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted">{item.text}</p>
                  </div>
                </div>
              </a>
            )
          })}
        </div>
      </div>
      <div className="mt-4 hidden justify-center md:flex">
        <div className="rounded-lg border border-line bg-panel p-1">{tabBar}</div>
      </div>

      {/* Móvil: lista filtrable */}
      <div className="md:hidden">
        <div className="mb-4">{tabBar}</div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {items
            .filter((item) => filter === ALL || item.group === filter)
            .map((item) => {
              const g = groupOf(item.group)
              return (
                <li key={item.url}>
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="card flex items-center gap-3 p-3">
                    <span className="h-10 w-10 shrink-0 rounded-lg" style={{ background: `linear-gradient(150deg, ${g.from}, ${g.to})` }} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-cyan">{item.name} ↗</span>
                      <span className="block truncate text-xs text-muted">{item.text}</span>
                    </span>
                  </a>
                </li>
              )
            })}
        </ul>
      </div>
    </div>
  )
}
