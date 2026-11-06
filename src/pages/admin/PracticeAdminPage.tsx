import { Fragment, useMemo, useState } from 'react'
import { Alert } from '../../components/ui/Alert'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Icon } from '../../components/ui/Icon'
import { Loader } from '../../components/ui/Loader'
import { errorMessage, useAsync } from '../../hooks/useAsync'
import { downloadCsv, toCsv } from '../../lib/csv'
import { formatDateTime } from '../../lib/format'
import { gradeFor, MISSIONS } from '../../lib/practice/missions'
import { deleteAttempt, listAttempts } from '../../services/practice'
import type { PracticeAttempt } from '../../types'

/** Una partida sin terminar después de 2 horas se considera abandonada. */
const ABANDON_MS = 2 * 60 * 60 * 1000

function stateOf(a: PracticeAttempt) {
  if (a.finished_at) return { id: 'terminada', label: 'Terminada', tone: 'border-neon/40 text-neon' }
  if (Date.now() - new Date(a.started_at).getTime() < ABANDON_MS) return { id: 'jugando', label: 'Jugando', tone: 'border-cyan/40 text-cyan' }
  return { id: 'abandonada', label: 'Sin terminar', tone: 'border-line text-muted' }
}

const GRADE_TONE: Record<string, string> = {
  A: 'border-neon/50 bg-neon/10 text-neon',
  B: 'border-cyan/50 bg-cyan/10 text-cyan',
  C: 'border-warn/50 bg-warn/10 text-warn',
  D: 'border-danger/50 bg-danger/10 text-danger',
}

const shortDate = (iso: string) =>
  new Date(iso).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

const fmtTime = (s: number | null) => (s == null ? '—' : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`)

const FILTERS = [
  { id: 'todas', label: 'Todas' },
  { id: 'terminada', label: 'Terminadas' },
  { id: 'jugando', label: 'Jugando' },
  { id: 'abandonada', label: 'Sin terminar' },
]

/** Panel de la práctica (Kali Lab): quién juega y cómo le va. */
export function PracticeAdminPage() {
  const { data, loading, reload } = useAsync(listAttempts, [])
  const [filter, setFilter] = useState('todas')
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<PracticeAttempt | null>(null)
  const [error, setError] = useState<string | null>(null)

  const rows = useMemo(() => data ?? [], [data])
  const finished = rows.filter((a) => a.finished_at)
  const visible = rows.filter((a) => {
    const q = query.trim().toLowerCase()
    return (filter === 'todas' || stateOf(a).id === filter) && (!q || `${a.player_name} ${a.email ?? ''}`.toLowerCase().includes(q))
  })

  const players = new Set(rows.map((a) => (a.email ?? a.player_name).toLowerCase())).size
  const avg = finished.length ? Math.round(finished.reduce((s, a) => s + a.score, 0) / finished.length) : 0
  const best = [...finished].sort((a, b) => b.score - a.score || (a.duration_seconds ?? 0) - (b.duration_seconds ?? 0))[0]
  const completion = rows.length ? Math.round((finished.length / rows.length) * 100) : 0

  const grades = ['A', 'B', 'C', 'D'].map((g) => ({ g, n: finished.filter((a) => a.grade === g).length }))
  const maxGrade = Math.max(1, ...grades.map((x) => x.n))
  const missionStats = MISSIONS.map((m) => {
    const res = finished.map((a) => a.details.find((d) => d.id === m.id)).filter((d) => d != null)
    const solved = res.filter((d) => d.completed).length
    return { m, rate: res.length ? Math.round((solved / res.length) * 100) : 0, hints: res.reduce((s, d) => s + d.hints, 0) }
  })

  function exportCsv() {
    const csv = toCsv(
      ['Jugador', 'Correo', 'Inicio', 'Estado', 'Puntaje', 'Máximo', 'Nota', 'Misiones', 'Pistas', 'Tiempo (min:seg)', 'Recomendación'],
      visible.map((a) => [a.player_name, a.email ?? '', formatDateTime(a.started_at), stateOf(a).label, a.score, a.max_score, a.grade ?? '', a.missions_completed, a.hints_used, fmtTime(a.duration_seconds), a.recommendation ?? '']),
    )
    downloadCsv(`kali-lab-${new Date().toISOString().slice(0, 10)}.csv`, csv)
  }

  if (loading && !data) return <Loader />

  return (
    <div className="space-y-6">
      <header className="rise flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neon">// práctica</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Kali Lab</h1>
          <p className="mt-1 text-muted">Quién entra al juego, cómo le va y qué le recomendamos.</p>
        </div>
        <button className="btn btn-primary" onClick={exportCsv} disabled={!visible.length}>
          <Icon name="documents" className="h-4 w-4" /> Exportar CSV
        </button>
      </header>

      {error && <Alert>{error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Jugadores" value={players} note={`${rows.length} partidas en total`} />
        <Kpi label="Terminan el reto" value={`${completion}%`} note={`${finished.length} partidas terminadas`} />
        <Kpi label="Puntaje promedio" value={avg} note="de 600 posibles" />
        <Kpi label="Mejor puntaje" value={best?.score ?? '—'} note={best ? `${best.player_name} · ${fmtTime(best.duration_seconds)}` : 'aún nadie termina'} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-4 font-semibold">Distribución de notas</h2>
          <ul className="space-y-3">
            {grades.map(({ g, n }) => (
              <li key={g} className="flex items-center gap-3">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border font-mono text-sm ${GRADE_TONE[g]}`}>{g}</span>
                <div className="h-3 flex-1 rounded-full bg-panel-2" title={`${n} partidas`}>
                  <div className="h-full rounded-full bg-neon transition-all duration-700" style={{ width: `${(n / maxGrade) * 100}%` }} />
                </div>
                <span className="w-8 text-right font-mono text-sm text-text">{n}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted">A ≥ 90 % · B ≥ 75 % · C ≥ 50 % · D por debajo</p>
        </section>

        <section className="card p-5">
          <h2 className="mb-4 font-semibold">Misiones: cuántos la resuelven</h2>
          <ul className="space-y-3">
            {missionStats.map(({ m, rate, hints }, i) => (
              <li key={m.id} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
                <span className="truncate text-sm">
                  <span className="font-mono text-muted">{i + 1}.</span> {m.title}
                </span>
                <span className="font-mono text-xs text-text">
                  {rate}% <span className="text-muted">· {hints} pistas</span>
                </span>
                <div className="col-span-2 h-2 rounded-full bg-panel-2" title={`${rate}% la resuelve`}>
                  <div className="h-full rounded-full bg-neon transition-all duration-700" style={{ width: `${rate}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted">Las de porcentaje bajo y muchas pistas son buenos temas para un taller.</p>
        </section>
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-3">
          <div className="flex flex-wrap gap-1" role="tablist">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                role="tab"
                aria-selected={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={`rounded-md px-3 py-1.5 text-sm transition ${filter === f.id ? 'bg-neon/10 text-neon' : 'text-muted hover:text-text'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <input type="search" className="field ml-auto w-full rounded-full sm:w-64" placeholder="Buscar jugador o correo…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar jugadores" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-line bg-panel-2/60 font-mono text-[11px] uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-2 font-normal">Jugador</th>
                <th className="px-4 py-2 font-normal">Inicio</th>
                <th className="px-4 py-2 font-normal">Estado</th>
                <th className="px-4 py-2 font-normal">Puntaje</th>
                <th className="px-4 py-2 font-normal">Nota</th>
                <th className="px-4 py-2 font-normal">Misiones</th>
                <th className="px-4 py-2 font-normal">Pistas</th>
                <th className="px-4 py-2 font-normal">Tiempo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.map((a) => {
                const st = stateOf(a)
                const open = openId === a.id
                return (
                  <Fragment key={a.id}>
                    <tr className={`cursor-pointer transition hover:bg-panel-2/70 ${open ? 'bg-panel-2/70' : ''}`} onClick={() => setOpenId(open ? null : a.id)}>
                      <td className="px-4 py-3">
                        <p className="font-medium">{a.player_name}</p>
                        <p className="font-mono text-xs text-muted">{a.email ?? 'sin correo'}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted" title={formatDateTime(a.started_at)}>
                        {shortDate(a.started_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`tag ${st.tone}`}>{st.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-10 font-mono">{a.score}</span>
                          <div className="h-1.5 w-16 rounded-full bg-panel-2">
                            <div className="h-full rounded-full bg-neon" style={{ width: `${(a.score / a.max_score) * 100}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {a.grade ? <span className={`rounded-md border px-2 py-0.5 font-mono text-xs ${GRADE_TONE[a.grade]}`}>{a.grade}</span> : <span className="text-muted">—</span>}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {a.missions_completed}/{MISSIONS.length}
                      </td>
                      <td className="px-4 py-3 font-mono">{a.hints_used}</td>
                      <td className="px-4 py-3 font-mono">{fmtTime(a.duration_seconds)}</td>
                    </tr>
                    {open && (
                      <tr className="bg-panel-2/40">
                        <td colSpan={8} className="px-4 py-4">
                          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
                            <div>
                              <p className="label">Misiones</p>
                              {a.details.length ? (
                                <ul className="mt-2 flex flex-wrap gap-2">
                                  {MISSIONS.map((m, i) => {
                                    const d = a.details.find((x) => x.id === m.id)
                                    return (
                                      <li
                                        key={m.id}
                                        title={`${m.title}: ${d?.points ?? 0} pts, ${d?.hints ?? 0} pistas, ${d?.wrong ?? 0} errores`}
                                        className={`rounded-lg border px-2.5 py-1.5 text-xs ${d?.completed ? 'border-neon/40 text-neon' : 'border-line text-muted'}`}
                                      >
                                        {d?.completed ? '✓' : '✗'} {i + 1}. {m.title}
                                        {!!d?.hints && <span className="ml-1 text-warn">· {d.hints}💡</span>}
                                      </li>
                                    )
                                  })}
                                </ul>
                              ) : (
                                <p className="mt-2 text-sm text-muted">La partida no se terminó, no hay detalle por misión.</p>
                              )}
                            </div>
                            <div>
                              <p className="label">Recomendación que recibió</p>
                              <p className="mt-2 text-sm text-text/85">{a.recommendation ?? '—'}</p>
                              {a.grade && <p className="mt-2 text-xs text-muted">Nota {a.grade}: {gradeFor(a.score).label}</p>}
                            </div>
                            <div className="flex items-start gap-2">
                              {a.email && (
                                <a className="btn btn-ghost" href={`mailto:${encodeURIComponent(a.email)}?subject=${encodeURIComponent('Tu resultado en el Kali Lab de SIRSG 2.0')}`}>
                                  Escribirle
                                </a>
                              )}
                              <button className="btn btn-danger" onClick={() => setToDelete(a)}>
                                Eliminar
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
          {!visible.length && <p className="p-8 text-center text-sm text-muted">No hay partidas con estos filtros.</p>}
        </div>
      </section>

      <p className="text-xs text-muted">
        El puntaje lo calcula el navegador del jugador: sirve para ver el progreso, no como evaluación oficial.
      </p>

      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminar partida"
        message={`Se eliminará la partida de ${toDelete?.player_name}.`}
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          try {
            await deleteAttempt(toDelete!.id)
            setOpenId(null)
            reload()
          } catch (err) {
            setError(errorMessage(err))
          }
          setToDelete(null)
        }}
      />
    </div>
  )
}

function Kpi({ label, value, note }: { label: string; value: string | number; note: string }) {
  return (
    <div className="card p-5">
      <p className="label !mb-0">{label}</p>
      <p className="mt-3 font-mono text-4xl font-semibold text-text">{value}</p>
      <p className="mt-1 truncate text-xs text-muted">{note}</p>
    </div>
  )
}
