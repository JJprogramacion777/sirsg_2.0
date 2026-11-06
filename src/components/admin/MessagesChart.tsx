import { useState } from 'react'
import type { ContactMessage } from '../../types'

const DAYS = 14
const W = 560
const H = 180
const PAD = { top: 12, right: 8, bottom: 26, left: 26 }

/** Barras: inscripciones recibidas por día en las últimas 2 semanas (una sola serie). */
export function MessagesChart({ messages }: { messages: ContactMessage[] }) {
  const [hover, setHover] = useState<number | null>(null)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Array.from({ length: DAYS }, (_, i) => {
    const date = new Date(today.getTime() - (DAYS - 1 - i) * 86_400_000)
    const next = date.getTime() + 86_400_000
    const count = messages.filter((m) => {
      const t = new Date(m.created_at).getTime()
      return t >= date.getTime() && t < next
    }).length
    return { date, count }
  })

  const max = Math.max(4, ...days.map((d) => d.count))
  const ticks = [0, Math.round(max / 2), max]
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom
  const slot = plotW / DAYS
  const barW = Math.min(22, slot - 6)
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH
  const label = (d: Date) => d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Inscripciones recibidas por día en los últimos 14 días">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeDasharray={t ? '2 4' : undefined} />
            <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" className="fill-muted font-mono text-[10px]">
              {t}
            </text>
          </g>
        ))}
        {days.map((d, i) => {
          const x = PAD.left + i * slot + (slot - barW) / 2
          const h = y(0) - y(d.count)
          const r = Math.min(4, h)
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              {/* Zona de hover más grande que la barra */}
              <rect x={PAD.left + i * slot} y={PAD.top} width={slot} height={plotH} fill="transparent" />
              {d.count > 0 && (
                <path
                  d={`M${x},${y(0)} V${y(d.count) + r} Q${x},${y(d.count)} ${x + r},${y(d.count)} H${x + barW - r} Q${x + barW},${y(d.count)} ${x + barW},${y(d.count) + r} V${y(0)} Z`}
                  fill="var(--color-neon)"
                  opacity={hover === null || hover === i ? 1 : 0.45}
                />
              )}
              {(i % 2 === 1 || i === DAYS - 1) && (
                <text x={x + barW / 2} y={H - 8} textAnchor="middle" className="fill-muted font-mono text-[10px]">
                  {i === DAYS - 1 ? 'hoy' : label(d.date)}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 rounded-lg border border-line bg-panel-2 px-3 py-1.5 text-xs shadow-lg"
          style={{ left: `${((PAD.left + hover * slot + slot / 2) / W) * 100}%`, top: 0 }}
        >
          <p className="font-mono text-muted">{label(days[hover].date)}</p>
          <p className="font-semibold text-text">
            {days[hover].count} {days[hover].count === 1 ? 'inscripción' : 'inscripciones'}
          </p>
        </div>
      )}
      <table className="sr-only">
        <caption>Inscripciones por día</caption>
        <tbody>
          {days.map((d) => (
            <tr key={d.date.toISOString()}>
              <td>{label(d.date)}</td>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
