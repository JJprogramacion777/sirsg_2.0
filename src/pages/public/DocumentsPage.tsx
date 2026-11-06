import { EmptyState } from '../../components/ui/EmptyState'
import { Loader } from '../../components/ui/Loader'
import { PageHeader } from '../../components/ui/PageHeader'
import { useAsync } from '../../hooks/useAsync'
import { formatBytes } from '../../lib/format'
import { fileExtension } from '../../lib/validators'
import { downloadUrl, listDocuments } from '../../services/documents'

/** RF-06 */
export function DocumentsPage() {
  const { data, loading, error } = useAsync(listDocuments, [])

  return (
    <div className="container-page py-16">
      <PageHeader tag="recursos" title="Documentos" subtitle="Material compartido por el semillero. Descárgalo con un clic." />
      {loading ? (
        <Loader />
      ) : error || !data?.length ? (
        <EmptyState
          title="Aún no hay documentos"
          message={error === 'not_configured' ? undefined : 'Cuando se compartan archivos aparecerán aquí.'}
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {data.map((doc) => (
            <li key={doc.id} className="card rise flex items-center gap-4 p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-line bg-panel-2 font-mono text-[11px] uppercase text-neon">
                {fileExtension(doc.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium" title={doc.name}>
                  {doc.name}
                </p>
                <p className="font-mono text-xs text-muted">
                  {formatBytes(doc.size_bytes)} · {new Date(doc.created_at).toLocaleDateString('es-CO')}
                </p>
              </div>
              <a href={downloadUrl(doc)} download={doc.name} className="btn btn-ghost">
                Descargar
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
