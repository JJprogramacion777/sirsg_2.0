interface Props {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

/** RF-05 */
export function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null
  return (
    <nav className="mt-6 flex items-center justify-center gap-2 font-mono text-sm" aria-label="Paginación">
      <button className="btn btn-ghost" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        ← Anterior
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          aria-current={n === page ? 'page' : undefined}
          className={`h-9 w-9 rounded-lg border ${
            n === page ? 'border-neon bg-neon/10 text-neon' : 'border-line text-muted hover:text-text'
          }`}
        >
          {n}
        </button>
      ))}
      <button className="btn btn-ghost" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Siguiente →
      </button>
    </nav>
  )
}
