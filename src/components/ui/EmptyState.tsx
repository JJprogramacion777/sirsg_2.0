import { HAS_BACKEND } from '../../lib/mode'

interface Props {
  title?: string
  message?: string
}

/** RF-02: se muestra en lugar de una página en blanco o un error. */
export function EmptyState({ title = 'Contenido aún no disponible', message }: Props) {
  return (
    <div className="card rise flex flex-col items-center gap-3 px-6 py-14 text-center">
      <div className="font-mono text-3xl text-neon-dim">[ _ ]</div>
      <h3 className="font-mono text-lg text-neon">{title}</h3>
      <p className="max-w-md text-sm text-muted">
        {message ??
          (HAS_BACKEND
            ? 'Estamos preparando esta sección. Vuelve pronto.'
            : 'Falta conectar Supabase: crea el archivo .env a partir de .env.example.')}
      </p>
    </div>
  )
}
