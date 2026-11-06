import { type ReactNode, useMemo, useState } from 'react'
import { Alert } from '../../components/ui/Alert'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Icon } from '../../components/ui/Icon'
import { Loader } from '../../components/ui/Loader'
import { errorMessage, useAsync } from '../../hooks/useAsync'
import { downloadCsv, toCsv } from '../../lib/csv'
import { formatDateTime } from '../../lib/format'
import { CAMPUSES, documentLabel, STATUSES, statusInfo } from '../../lib/registration'
import { deleteMessage, listMessages, updateRegistration } from '../../services/contact'
import type { ContactMessage } from '../../types'

const ALL = 'todas'

const fullName = (r: ContactMessage) => `${r.name} ${r.last_name}`.trim()
const initials = (r: ContactMessage) => `${r.name.charAt(0)}${r.last_name.charAt(0)}`.toUpperCase()

/** Listado de inscripción (RF-07): filtros, exportación y ficha de cada inscrito. */
export function RegistrationsAdminPage() {
  const { data, loading, reload } = useAsync(listMessages, [])
  const [openId, setOpenId] = useState<string | null>(null)
  const [status, setStatus] = useState<string>(ALL)
  const [campus, setCampus] = useState<string>(ALL)
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  const rows = useMemo(() => data ?? [], [data])
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter(
      (r) =>
        (status === ALL || r.status === status) &&
        (campus === ALL || r.campus === campus) &&
        (!q || `${fullName(r)} ${r.email} ${r.career} ${r.document_number ?? ''}`.toLowerCase().includes(q)),
    )
  }, [rows, status, campus, query])

  const open = rows.find((r) => r.id === openId)

  async function openRow(r: ContactMessage) {
    setOpenId(r.id)
    if (!r.read) {
      await updateRegistration(r.id, { read: true }).catch((e) => setError(errorMessage(e)))
      reload()
    }
  }

  function exportCsv() {
    const csv = toCsv(
      ['Nombre', 'Apellido', 'Tipo de documento', 'Número de documento', 'Correo', 'Carrera', 'Semestre', 'Sede', 'Edad', 'Estado', 'Asunto', 'Mensaje', 'Fecha'],
      visible.map((r) => [r.name, r.last_name, documentLabel(r.document_type), r.document_number ?? '', r.email, r.career, r.semester, r.campus, r.age, statusInfo(r.status).label, r.subject, r.message, formatDateTime(r.created_at)]),
    )
    downloadCsv(`inscripciones-${new Date().toISOString().slice(0, 10)}.csv`, csv)
  }

  if (loading && !data) return <Loader />

  if (open) {
    return (
      <RegistrationDetail
        key={open.id}
        reg={open}
        duplicates={open.document_number ? rows.filter((r) => r.id !== open.id && r.document_number === open.document_number).length : 0}
        onBack={() => setOpenId(null)}
        onChanged={reload}
        onDeleted={() => {
          setOpenId(null)
          reload()
        }}
      />
    )
  }

  const unread = rows.filter((r) => !r.read).length
  const avgAge = rows.length ? Math.round(rows.reduce((s, r) => s + r.age, 0) / rows.length) : 0

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
      <div className="min-w-0">
        <header className="rise mb-6">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neon">// inscripciones</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Listado de inscripción</h1>
          <p className="mt-2 text-muted">Estudiantes que se inscribieron o escribieron desde el formulario público.</p>
        </header>

        {error && (
          <div className="mb-4">
            <Alert>{error}</Alert>
          </div>
        )}

        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 border-b border-line p-3">
            <div className="flex flex-wrap gap-1" role="tablist">
              {[{ value: ALL, label: 'Todas' }, ...STATUSES].map((s) => {
                const count = s.value === ALL ? rows.length : rows.filter((r) => r.status === s.value).length
                return (
                  <button
                    key={s.value}
                    role="tab"
                    aria-selected={status === s.value}
                    onClick={() => setStatus(s.value)}
                    className={`rounded-md px-3 py-1.5 text-sm transition ${status === s.value ? 'bg-neon/10 text-neon' : 'text-muted hover:text-text'}`}
                  >
                    {s.label} <span className="font-mono text-xs opacity-70">{count}</span>
                  </button>
                )
              })}
            </div>
            <input
              type="search"
              className="field ml-auto w-full rounded-full sm:w-64"
              placeholder="Buscar nombre, correo, carrera o documento…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Buscar inscripciones"
            />
          </div>

          <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)_120px_60px_110px] gap-4 border-b border-line bg-panel-2/60 px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-muted lg:grid">
            <span>Inscrito</span>
            <span>Carrera</span>
            <span>Sede</span>
            <span>Edad</span>
            <span>Estado</span>
          </div>

          {visible.length ? (
            <ul className="divide-y divide-line">
              {visible.map((r) => {
                const st = statusInfo(r.status)
                return (
                  <li key={r.id}>
                    <button
                      onClick={() => openRow(r)}
                      className="grid w-full gap-2 px-4 py-3 text-left transition hover:bg-panel-2/70 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)_120px_60px_110px] lg:items-center lg:gap-4"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-panel-2 font-mono text-xs text-neon">
                          {initials(r)}
                          {!r.read && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-panel bg-neon" aria-label="Sin leer" />}
                        </span>
                        <span className="min-w-0">
                          <span className={`block truncate ${r.read ? '' : 'font-semibold'}`}>{fullName(r)}</span>
                          <span className="block truncate font-mono text-xs text-muted">{r.email}</span>
                        </span>
                      </span>
                      <span className="min-w-0 text-sm">
                        <span className="block truncate">{r.career}</span>
                        <span className="font-mono text-xs text-muted">{r.semester}.º semestre</span>
                      </span>
                      <span className="text-sm text-text/85">{r.campus}</span>
                      <span className="font-mono text-sm text-text/85">{r.age}</span>
                      <span>
                        <span className={`tag ${st.tone}`}>{st.label}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="p-8 text-center text-sm text-muted">No hay inscripciones con estos filtros.</p>
          )}
        </div>
      </div>

      {/* Panel lateral: acciones, filtro por sede y metadatos */}
      <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
        <div className="overflow-hidden rounded-xl border border-line bg-[#070a0f]">
          <p className="px-5 pt-4 font-mono text-[10px] uppercase tracking-[0.25em] text-muted">Acciones</p>
          <div className="space-y-2 p-4">
            <button className="btn btn-primary w-full" onClick={exportCsv} disabled={!visible.length}>
              <Icon name="documents" className="h-4 w-4" /> Exportar a Excel (CSV)
            </button>
            <p className="text-center font-mono text-[11px] text-muted">{visible.length} filas con los filtros actuales</p>
          </div>
          <p className="border-t border-line px-5 pt-4 font-mono text-[10px] uppercase tracking-[0.25em] text-muted">Filtrar por sede</p>
          <nav className="p-2">
            {[ALL, ...CAMPUSES].map((c) => {
              const count = c === ALL ? rows.length : rows.filter((r) => r.campus === c).length
              return (
                <button
                  key={c}
                  onClick={() => setCampus(c)}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition ${campus === c ? 'bg-panel-2 text-text' : 'text-muted hover:text-text'}`}
                >
                  {c === ALL ? 'Todas las sedes' : c}
                  <span className="font-mono text-xs">{count}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="card p-5">
          <p className="label">Metadatos</p>
          <dl className="mt-3 space-y-3 text-sm">
            <Meta label="Inscripciones" value={rows.length} />
            <Meta label="Sin leer" value={unread} />
            <Meta label="Edad promedio" value={rows.length ? `${avgAge} años` : '—'} />
            <Meta label="Última" value={rows[0] ? formatDateTime(rows[0].created_at) : '—'} />
          </dl>
        </div>
      </aside>
    </div>
  )
}

function Meta({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="font-mono text-[11px] text-muted">{label}</dt>
      <dd className="text-text">{value}</dd>
    </div>
  )
}

interface DetailProps {
  reg: ContactMessage
  /** Otras inscripciones con el mismo número de documento. */
  duplicates: number
  onBack: () => void
  onChanged: () => void
  onDeleted: () => void
}

/** Ficha de una inscripción: perfil, datos personales y seguimiento. */
function RegistrationDetail({ reg, duplicates, onBack, onChanged, onDeleted }: DetailProps) {
  const [status, setStatus] = useState(reg.status)
  const [notes, setNotes] = useState(reg.notes)
  const [unread, setUnread] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'error' | 'success'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const days = Math.max(0, Math.floor((Date.now() - new Date(reg.created_at).getTime()) / 86_400_000))
  const st = statusInfo(reg.status)
  const dirty = status !== reg.status || notes !== reg.notes || unread

  async function save() {
    setBusy(true)
    setMsg(null)
    try {
      await updateRegistration(reg.id, { status, notes: notes.trim(), ...(unread ? { read: false } : {}) })
      setMsg({ kind: 'success', text: 'Cambios guardados.' })
      onChanged()
      // Si se marcó como no leída, se vuelve al listado; al reabrirla se marcaría leída otra vez.
      if (unread) onBack()
    } catch (err) {
      setMsg({ kind: 'error', text: errorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rise">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <button onClick={onBack} className="font-mono text-sm text-neon hover:underline">
            ← Listado de inscripción
          </button>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">{fullName(reg)}</h1>
        </div>
        <span className={`tag ${st.tone}`}>{st.label}</span>
      </div>

      <div className="card grid overflow-hidden lg:grid-cols-[260px_1fr_1fr] lg:divide-x lg:divide-line">
        {/* Perfil */}
        <section className="border-b border-line p-6 text-center lg:border-b-0">
          <p className="label text-left">Perfil</p>
          <div className="mx-auto mt-4 flex h-24 w-24 items-center justify-center rounded-full bg-[linear-gradient(150deg,#22d3a6,#0e5a73)] font-mono text-3xl font-semibold text-white ring-4 ring-neon/15">
            {initials(reg)}
          </div>
          <p className="mt-4 font-semibold">{fullName(reg)}</p>
          <p className="text-sm text-muted">{reg.career}</p>

          <div className="mt-5 grid grid-cols-3 gap-2 border-y border-line py-4">
            <Stat value={`${reg.semester}.º`} label="semestre" />
            <Stat value={reg.age} label="años" />
            <Stat value={days} label={days === 1 ? 'día' : 'días'} />
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <a className="btn btn-primary rounded-full" href={`mailto:${encodeURIComponent(reg.email)}?subject=${encodeURIComponent(`Re: ${reg.subject}`)}`}>
              Responder por correo
            </a>
            <button className="btn btn-danger rounded-full" onClick={() => setConfirmDelete(true)}>
              Eliminar
            </button>
          </div>

          <figure className="mt-6 text-left">
            <p className="font-mono text-4xl leading-none text-neon/40">“</p>
            <figcaption className="text-sm font-semibold">{reg.subject}</figcaption>
            <blockquote className="mt-1 whitespace-pre-line text-sm text-muted">{reg.message}</blockquote>
          </figure>
        </section>

        {/* Datos personales */}
        <section className="border-b border-line p-6 lg:border-b-0">
          <p className="label">Datos personales</p>
          {duplicates > 0 && (
            <p className="mt-3 rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-xs text-warn">
              Este documento aparece en {duplicates} {duplicates === 1 ? 'inscripción más' : 'inscripciones más'}. Puede ser un registro repetido.
            </p>
          )}
          <dl className="mt-4 space-y-3">
            <Row label="Nombre" value={reg.name} />
            <Row label="Apellido" value={reg.last_name} />
            <Row label="Documento" value={documentLabel(reg.document_type)} />
            <Row label="Número" value={reg.document_number || '—'} mono />
            <Row label="Correo" value={reg.email} mono />
            <Row label="Carrera" value={reg.career} />
            <Row label="Semestre" value={`${reg.semester}.º semestre`} />
            <Row label="Sede" value={reg.campus} />
            <Row label="Edad" value={`${reg.age} años`} />
          </dl>
        </section>

        {/* Seguimiento */}
        <section className="flex flex-col p-6">
          <p className="label">Seguimiento</p>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 ml-4 block text-xs text-muted" htmlFor="status">
                Estado
              </label>
              <select id="status" className="field-pill" value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 ml-4 block text-xs text-muted" htmlFor="notes">
                Notas internas
              </label>
              <textarea
                id="notes"
                rows={6}
                className="field-pill resize-y"
                placeholder="Solo las ve el administrador. Ej. «Se le envió el enlace de la reunión»."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={2000}
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
              <input type="checkbox" className="h-4 w-4 accent-[var(--color-neon)]" checked={unread} onChange={(e) => setUnread(e.target.checked)} />
              Marcar como no leída al guardar
            </label>
          </div>

          {msg && (
            <div className="mt-4">
              <Alert kind={msg.kind}>{msg.text}</Alert>
            </div>
          )}

          <div className="mt-6 lg:mt-auto lg:pt-6">
            <button className="btn btn-primary w-full rounded-full" onClick={save} disabled={busy || !dirty}>
              {busy ? 'Guardando…' : 'Guardar cambios'}
            </button>
            <dl className="mt-5 space-y-1 font-mono text-[11px] text-muted">
              <div>Recibida: {formatDateTime(reg.created_at)}</div>
              <div className="truncate">ID: {reg.id}</div>
            </dl>
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Eliminar inscripción"
        message={`Se eliminará la inscripción de ${fullName(reg)}. Esta acción no se puede deshacer.`}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          try {
            await deleteMessage(reg.id)
            setConfirmDelete(false)
            onDeleted()
          } catch (err) {
            setMsg({ kind: 'error', text: errorMessage(err) })
            setConfirmDelete(false)
          }
        }}
      />
    </div>
  )
}

function Stat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div>
      <p className="font-mono text-lg font-semibold text-neon">{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  )
}

function Row({ label, value, mono = false }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[90px_1fr] items-center gap-3">
      <dt className="text-right text-xs text-muted">{label}</dt>
      <dd className={`truncate rounded-full border border-line bg-panel-2 px-4 py-2 text-sm ${mono ? 'font-mono text-xs' : ''}`} title={String(value)}>
        {value}
      </dd>
    </div>
  )
}
