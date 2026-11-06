import { useState } from 'react'
import { EventCard } from '../../components/EventCard'
import { EmptyState } from '../../components/ui/EmptyState'
import { Loader } from '../../components/ui/Loader'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pagination } from '../../components/ui/Pagination'
import { useAsync } from '../../hooks/useAsync'
import { type EventBoard, listEvents } from '../../services/events'

const TABS: { id: EventBoard; label: string }[] = [
  { id: 'upcoming', label: 'Vigentes' },
  { id: 'past', label: 'Historial' },
]

/** RF-03, RF-04, RF-05 */
export function EventsPage() {
  const [board, setBoard] = useState<EventBoard>('upcoming')
  const [page, setPage] = useState(1)
  const { data, loading, error } = useAsync(() => listEvents(board, page), [board, page])

  return (
    <div className="container-page py-16">
      <PageHeader
        tag="cartelera"
        title="Tablón de eventos"
        subtitle="Reuniones, proyectos y eventos del semillero, del más próximo al más lejano."
      />

      <div className="mb-6 inline-flex rounded-lg border border-line p-1" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={board === t.id}
            onClick={() => {
              setBoard(t.id)
              setPage(1)
            }}
            className={`rounded-md px-4 py-1.5 text-sm ${board === t.id ? 'bg-neon text-ink' : 'text-muted hover:text-text'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Loader />
      ) : error || !data || data.events.length === 0 ? (
        <EmptyState
          title={board === 'upcoming' ? 'No hay eventos programados' : 'El historial está vacío'}
          message={error === 'not_configured' ? undefined : 'Cuando haya eventos aparecerán aquí.'}
        />
      ) : (
        <>
          <div className="grid gap-4">
            {data.events.map((e) => (
              <EventCard key={e.id} event={e} past={board === 'past'} />
            ))}
          </div>
          <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  )
}
