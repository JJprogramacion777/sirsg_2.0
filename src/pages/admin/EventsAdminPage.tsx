import { type FormEvent, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Alert } from '../../components/ui/Alert'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Loader } from '../../components/ui/Loader'
import { PageHeader } from '../../components/ui/PageHeader'
import { errorMessage, useAsync } from '../../hooks/useAsync'
import { formatDateTime, toLocalInput } from '../../lib/format'
import { deleteEvent, type EventInput, listAllEvents, saveEvent, validateEvent } from '../../services/events'
import type { SirsgEvent } from '../../types'

interface FormState {
  id?: string
  title: string
  description: string
  starts_at: string
  ends_at: string
  location: string
  link: string
}

const EMPTY: FormState = { title: '', description: '', starts_at: '', ends_at: '', location: '', link: '' }

/** RF-16, RF-17, RF-18, RF-19 */
export function EventsAdminPage() {
  const { data, loading, reload } = useAsync(listAllEvents, [])
  // ?nuevo=1 (desde el resumen) abre directamente el formulario de creación.
  const [params] = useSearchParams()
  const [form, setForm] = useState<FormState | null>(params.has('nuevo') ? EMPTY : null)
  const [toDelete, setToDelete] = useState<SirsgEvent | null>(null)
  const [msg, setMsg] = useState<{ kind: 'error' | 'success'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const set = (key: keyof FormState) => (e: { target: { value: string } }) =>
    setForm((f) => f && { ...f, [key]: e.target.value })

  function edit(ev: SirsgEvent) {
    setMsg(null)
    setForm({
      id: ev.id,
      title: ev.title,
      description: ev.description,
      starts_at: toLocalInput(ev.starts_at),
      ends_at: toLocalInput(ev.ends_at),
      location: ev.location ?? '',
      link: ev.link ?? '',
    })
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!form) return
    const input: EventInput = {
      title: form.title.trim(),
      description: form.description.trim(),
      starts_at: form.starts_at && new Date(form.starts_at).toISOString(),
      ends_at: form.ends_at && new Date(form.ends_at).toISOString(),
      location: form.location.trim() || null,
      link: form.link.trim() || null,
    }
    const problem = validateEvent(input)
    if (problem) return setMsg({ kind: 'error', text: problem })
    setBusy(true)
    try {
      await saveEvent(input, form.id)
      setMsg({ kind: 'success', text: form.id ? 'Evento actualizado.' : 'Evento programado.' })
      setForm(null)
      reload()
    } catch (err) {
      setMsg({ kind: 'error', text: errorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  const now = Date.now()

  return (
    <>
      <PageHeader tag="cartelera" title="Eventos" subtitle="Reuniones, proyectos y eventos del tablón público." />
      {msg && !form && <div className="mb-4"><Alert kind={msg.kind}>{msg.text}</Alert></div>}

      {form ? (
        <form className="card max-w-3xl space-y-4 p-6" onSubmit={submit} noValidate>
          <h2 className="font-mono text-neon">{form.id ? 'Editar evento' : 'Nuevo evento'}</h2>
          <div>
            <label className="label" htmlFor="title">Título</label>
            <input id="title" className="field" value={form.title} onChange={set('title')} maxLength={150} />
          </div>
          <div>
            <label className="label" htmlFor="description">Descripción</label>
            <textarea id="description" rows={4} className="field resize-y" value={form.description} onChange={set('description')} maxLength={2000} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="starts">Inicio</label>
              <input id="starts" type="datetime-local" className="field" value={form.starts_at} onChange={set('starts_at')} />
            </div>
            <div>
              <label className="label" htmlFor="ends">Finalización</label>
              <input id="ends" type="datetime-local" className="field" value={form.ends_at} min={form.starts_at} onChange={set('ends_at')} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="location">Lugar (presencial)</label>
              <input id="location" className="field" placeholder="Sala 301, sede norte" value={form.location} onChange={set('location')} maxLength={200} />
            </div>
            <div>
              <label className="label" htmlFor="link">Enlace (virtual)</label>
              <input id="link" type="url" className="field" placeholder="https://meet.google.com/…" value={form.link} onChange={set('link')} />
            </div>
          </div>
          {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
          <div className="flex gap-2">
            <button className="btn btn-primary" disabled={busy}>{form.id ? 'Guardar cambios' : 'Programar evento'}</button>
            <button type="button" className="btn btn-ghost" onClick={() => setForm(null)}>Cancelar</button>
          </div>
        </form>
      ) : loading ? (
        <Loader />
      ) : (
        <>
          <button className="btn btn-primary mb-4" onClick={() => { setMsg(null); setForm(EMPTY) }}>+ Nuevo evento</button>
          <div className="card divide-y divide-line">
            {data?.length ? (
              data.map((ev) => {
                const past = new Date(ev.ends_at).getTime() < now
                return (
                  <div key={ev.id} className="flex flex-wrap items-center gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{ev.title}</p>
                      <p className="font-mono text-xs text-muted">{formatDateTime(ev.starts_at)}</p>
                    </div>
                    <span className={`tag ${past ? 'border-line text-muted' : 'border-neon/40 text-neon'}`}>{past ? 'Historial' : 'Vigente'}</span>
                    <button className="btn btn-ghost" onClick={() => edit(ev)}>Editar</button>
                    <button className="btn btn-danger" onClick={() => setToDelete(ev)}>Eliminar</button>
                  </div>
                )
              })
            ) : (
              <p className="p-6 text-sm text-muted">No hay eventos todavía.</p>
            )}
          </div>
        </>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminar evento"
        message={`Se eliminará "${toDelete?.title}". Esta acción no se puede deshacer.`}
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          try {
            await deleteEvent(toDelete!.id)
            setMsg({ kind: 'success', text: 'Evento eliminado.' })
            reload()
          } catch (err) {
            setMsg({ kind: 'error', text: errorMessage(err) })
          }
          setToDelete(null)
        }}
      />
    </>
  )
}
