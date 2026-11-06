import { useRef, useState } from 'react'
import { Alert } from '../../components/ui/Alert'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Loader } from '../../components/ui/Loader'
import { PageHeader } from '../../components/ui/PageHeader'
import { errorMessage, useAsync } from '../../hooks/useAsync'
import { ALLOWED_EXTENSIONS, MAX_FILE_MB } from '../../lib/config'
import { formatBytes } from '../../lib/format'
import { deleteDocument, downloadUrl, listDocuments, uploadDocument } from '../../services/documents'
import type { SirsgDocument } from '../../types'

/** RF-16, RF-20, RF-21, RF-22 */
export function DocumentsAdminPage() {
  const { data, loading, reload } = useAsync(listDocuments, [])
  const [msg, setMsg] = useState<{ kind: 'error' | 'success'; text: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [toDelete, setToDelete] = useState<SirsgDocument | null>(null)
  const input = useRef<HTMLInputElement>(null)

  async function onFile(file: File | undefined) {
    if (!file) return
    setUploading(true)
    setMsg(null)
    try {
      await uploadDocument(file)
      setMsg({ kind: 'success', text: `"${file.name}" subido. Ya está disponible para descarga.` })
      reload()
    } catch (err) {
      setMsg({ kind: 'error', text: errorMessage(err) })
    } finally {
      setUploading(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <>
      <PageHeader tag="recursos" title="Documentos" subtitle={`Máximo ${MAX_FILE_MB} MB. Extensiones permitidas: ${ALLOWED_EXTENSIONS.join(', ')}.`} />

      <label className="card mb-4 flex cursor-pointer flex-col items-center gap-2 border-dashed p-8 text-center transition hover:border-neon/50">
        <span className="font-mono text-neon">{uploading ? 'Subiendo…' : '+ Seleccionar archivo'}</span>
        <span className="text-xs text-muted">Se rechazan ejecutables y archivos de más de {MAX_FILE_MB} MB</span>
        <input
          ref={input}
          type="file"
          className="sr-only"
          accept={ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(',')}
          disabled={uploading}
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </label>

      {msg && <div className="mb-4"><Alert kind={msg.kind}>{msg.text}</Alert></div>}

      {loading ? (
        <Loader />
      ) : (
        <div className="card divide-y divide-line">
          {data?.length ? (
            data.map((doc) => (
              <div key={doc.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{doc.name}</p>
                  <p className="font-mono text-xs text-muted">{formatBytes(doc.size_bytes)}</p>
                </div>
                <a className="btn btn-ghost" href={downloadUrl(doc)}>Descargar</a>
                <button className="btn btn-danger" onClick={() => setToDelete(doc)}>Eliminar</button>
              </div>
            ))
          ) : (
            <p className="p-6 text-sm text-muted">No hay documentos subidos.</p>
          )}
        </div>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminar documento"
        message={`Se eliminará "${toDelete?.name}" del servidor y su enlace dejará de funcionar.`}
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          try {
            await deleteDocument(toDelete!)
            setMsg({ kind: 'success', text: 'Documento eliminado.' })
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
