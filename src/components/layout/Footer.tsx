import { Link } from 'react-router-dom'
import { PUBLIC_SECTIONS } from '../../services/sections'
import { UniversityBadge } from '../UniversityBadge'

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="container-page grid gap-8 py-10 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <img src="/brand/sirsg-mark.png" alt="" className="h-9 w-9" />
            <p className="font-mono font-semibold">
              SIRSG<span className="text-neon">_2.0</span>
            </p>
          </div>
          <p className="mt-2 text-sm text-muted">Semillero de Investigación en Ciberseguridad.</p>
          <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted/70">Universidad</p>
          <div className="mt-2">
            <UniversityBadge />
          </div>
        </div>
        <div>
          <p className="label">El semillero</p>
          <ul className="space-y-1 text-sm">
            {PUBLIC_SECTIONS.map((s) => (
              <li key={s.slug}>
                <Link to={`/seccion/${s.slug}`} className="text-muted hover:text-neon">
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="label">Participa</p>
          <ul className="space-y-1 text-sm">
            <li>
              <Link to="/eventos" className="text-muted hover:text-neon">
                Cartelera de eventos
              </Link>
            </li>
            <li>
              <Link to="/practica" className="text-muted hover:text-neon">
                Práctica: Kali Lab
              </Link>
            </li>
            <li>
              <Link to="/documentos" className="text-muted hover:text-neon">
                Documentos
              </Link>
            </li>
            <li>
              <Link to="/contacto" className="text-muted hover:text-neon">
                Contacto
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <p className="border-t border-line py-4 text-center font-mono text-xs text-muted">
        © {new Date().getFullYear()} SIRSG 2.0 · Universidad ECCI
      </p>
    </footer>
  )
}
