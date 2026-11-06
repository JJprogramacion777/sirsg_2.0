import { formatDateTime } from '../lib/format'
import type { SirsgEvent } from '../types'

export function EventCard({ event, past = false }: { event: SirsgEvent; past?: boolean }) {
  const start = new Date(event.starts_at)
  const live = !past && start.getTime() <= Date.now()

  return (
    <article className={`card rise flex gap-5 p-5 ${past ? 'opacity-70' : ''}`}>
      <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-lg border border-line bg-panel-2 py-2 font-mono">
        <span className="text-2xl font-semibold text-neon">{start.getDate()}</span>
        <span className="text-[11px] uppercase text-muted">
          {start.toLocaleDateString('es-CO', { month: 'short' })}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold">{event.title}</h3>
          {live && <span className="tag border-neon/40 text-neon">En curso</span>}
          {past && <span className="tag border-line text-muted">Finalizado</span>}
        </div>
        <p className="mt-1 font-mono text-xs text-muted">
          {formatDateTime(event.starts_at)} → {formatDateTime(event.ends_at)}
        </p>
        {event.description && <p className="mt-2 whitespace-pre-line text-sm text-text/80">{event.description}</p>}
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          {event.location && <span className="text-muted">📍 {event.location}</span>}
          {event.link && !past && (
            <a href={event.link} target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">
              Unirse a la reunión ↗
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
