import { type FormEvent, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Alert } from '../../components/ui/Alert'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Loader } from '../../components/ui/Loader'
import { PageHeader } from '../../components/ui/PageHeader'
import { errorMessage, useAsync } from '../../hooks/useAsync'
import { uploadSectionImage } from '../../services/documents'
import {
  deleteSection,
  listLatestSections,
  PUBLIC_SECTIONS,
  saveSection,
  type SectionInput,
  slugify,
} from '../../services/sections'
import type { PublishStatus } from '../../types'

const EMPTY: SectionInput = { slug: '', title: '', body: '', image_url: null, status: 'draft' }

/** RF-14, RF-15, RF-16 */
export function SectionsAdminPage() {
  const { data, loading, reload } = useAsync(listLatestSections, [])
  // ?nuevo=1 (desde el resumen) abre directamente el formulario de creación.
  const [params] = useSearchParams()
  const [form, setForm] = useState<SectionInput | null>(params.has('nuevo') ? EMPTY : null)
  const [isNew, setIsNew] = useState(params.has('nuevo'))
  const [toDelete, setToDelete] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ kind: 'error' | 'success'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const existing = new Set(data?.map((s) => s.slug))
  const missing = PUBLIC_SECTIONS.filter((s) => !existing.has(s.slug))

  function edit(input: SectionInput, creating: boolean) {
    setForm(input)
    setIsNew(creating)
    setMsg(null)
  }

  async function submit(e: FormEvent, status: PublishStatus) {
    e.preventDefault()
    if (!form) return
    const slug = isNew ? slugify(form.slug || form.title) : form.slug
    if (!slug || !form.title.trim()) return setMsg({ kind: 'error', text: 'El título es obligatorio.' })
    setBusy(true)
    try {
      await saveSection({ ...form, slug, status })
      setMsg({ kind: 'success', text: status === 'published' ? 'Sección publicada.' : 'Borrador guardado.' })
      setForm(null)
      reload()
    } catch (err) {
      setMsg({ kind: 'error', text: errorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  async function onImage(file: File | undefined) {
    if (!file || !form) return
    try {
      const url = await uploadSectionImage(file)
      setForm({ ...form, image_url: url })
    } catch (err) {
      setMsg({ kind: 'error', text: errorMessage(err) })
    }
  }

  return (
    <>
      <PageHeader tag="contenido" title="Secciones informativas" subtitle="Cada guardado crea una versión nueva. El público solo ve la última versión publicada." />
      {msg && !form && <div className="mb-4"><Alert kind={msg.kind}>{msg.text}</Alert></div>}

      {form ? (
        <form className="card max-w-3xl space-y-4 p-6" onSubmit={(e) => submit(e, 'published')}>
          <h2 className="font-mono text-neon">{isNew ? 'Nueva sección' : `Editando: ${form.slug}`}</h2>
          <div>
            <label className="label" htmlFor="title">Título</label>
            <input id="title" className="field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={150} />
          </div>
          {isNew && (
            <div>
              <label className="label" htmlFor="slug">Identificador en la URL</label>
              <input id="slug" className="field font-mono" placeholder={slugify(form.title)} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              <p className="mt-1 font-mono text-xs text-muted">/seccion/{slugify(form.slug || form.title) || '…'}</p>
            </div>
          )}
          <div>
            <label className="label" htmlFor="body">Contenido</label>
            <textarea id="body" rows={12} className="field resize-y" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
            <p className="mt-1 font-mono text-xs text-muted">
              Formato: "## Subtítulo", "- elemento de lista" y una línea en blanco entre párrafos.
            </p>
          </div>
          <div>
            <label className="label" htmlFor="image">Imagen (opcional)</label>
            {form.image_url && (
              <div className="mb-2 flex items-center gap-3">
                <img src={form.image_url} alt="" className="h-20 rounded-lg border border-line object-cover" />
                <button type="button" className="btn btn-ghost" onClick={() => setForm({ ...form, image_url: null })}>Quitar</button>
              </div>
            )}
            <input id="image" type="file" accept=".png,.jpg,.jpeg,.webp" className="text-sm text-muted" onChange={(e) => onImage(e.target.files?.[0])} />
          </div>
          {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary" disabled={busy}>Publicar</button>
            <button type="button" className="btn btn-ghost" disabled={busy} onClick={(e) => submit(e, 'draft')}>Guardar borrador</button>
            <button type="button" className="btn btn-ghost" onClick={() => setForm(null)}>Cancelar</button>
          </div>
        </form>
      ) : loading ? (
        <Loader />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <button className="btn btn-primary" onClick={() => edit(EMPTY, true)}>+ Nueva sección</button>
            {missing.map((s) => (
              <button key={s.slug} className="btn btn-ghost" onClick={() => edit({ ...EMPTY, slug: s.slug, title: s.label }, true)}>
                + {s.label}
              </button>
            ))}
          </div>
          <div className="card divide-y divide-line">
            {data?.length ? (
              data.map((s) => (
                <div key={s.slug} className="flex flex-wrap items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{s.title}</p>
                    <p className="font-mono text-xs text-muted">/seccion/{s.slug} · {new Date(s.created_at).toLocaleString('es-CO')}</p>
                  </div>
                  <span className={`tag ${s.status === 'published' ? 'border-neon/40 text-neon' : 'border-warn/40 text-warn'}`}>
                    {s.status === 'published' ? 'Publicado' : 'Borrador'}
                  </span>
                  <button className="btn btn-ghost" onClick={() => edit({ slug: s.slug, title: s.title, body: s.body, image_url: s.image_url, status: s.status }, false)}>Editar</button>
                  <button className="btn btn-danger" onClick={() => setToDelete(s.slug)}>Eliminar</button>
                </div>
              ))
            ) : (
              <p className="p-6 text-sm text-muted">Aún no hay secciones. Crea la primera.</p>
            )}
          </div>
        </>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminar sección"
        message={`Se eliminará "${toDelete}" con todas sus versiones. Esta acción no se puede deshacer.`}
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          try {
            await deleteSection(toDelete!)
            setMsg({ kind: 'success', text: 'Sección eliminada.' })
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
