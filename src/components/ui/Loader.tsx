export function Loader({ label = 'Cargando' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-10 font-mono text-sm text-muted" role="status">
      <span className="caret">{label}…</span>
    </div>
  )
}
