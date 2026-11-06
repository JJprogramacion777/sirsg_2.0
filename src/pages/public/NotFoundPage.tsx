import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="container-page flex flex-col items-center py-28 text-center">
      <p className="font-mono text-6xl font-bold text-neon">404</p>
      <p className="mt-4 font-mono text-muted">$ cd ruta-desconocida: No such file or directory</p>
      <Link to="/" className="btn btn-primary mt-8">
        Volver al inicio
      </Link>
    </div>
  )
}
