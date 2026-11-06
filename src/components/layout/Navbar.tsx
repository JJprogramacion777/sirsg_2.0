import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { PUBLIC_SECTIONS } from '../../services/sections'

const LINKS = [
  { to: '/', label: 'Inicio' },
  ...PUBLIC_SECTIONS.slice(0, 1).map((s) => ({ to: `/seccion/${s.slug}`, label: s.label })),
  { to: '/eventos', label: 'Eventos' },
  { to: '/documentos', label: 'Documentos' },
  { to: '/practica', label: 'Práctica' },
  { to: '/contacto', label: 'Contacto' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/80 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-mono font-semibold" onClick={() => setOpen(false)}>
          <img src="/brand/sirsg-mark.png" alt="" className="h-8 w-8" />
          <span>
            SIRSG<span className="text-neon">_2.0</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <NavItem key={l.to} {...l} />
          ))}
        </nav>

        <button
          className="rounded-lg border border-line px-3 py-1.5 font-mono text-sm md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="Abrir menú"
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {open && (
        <nav className="container-page flex flex-col gap-1 pb-4 md:hidden">
          {LINKS.map((l) => (
            <NavItem key={l.to} {...l} onClick={() => setOpen(false)} />
          ))}
        </nav>
      )}
    </header>
  )
}

function NavItem({ to, label, onClick }: { to: string; label: string; onClick?: () => void }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        `rounded-md px-3 py-2 text-sm transition ${isActive ? 'bg-neon/10 text-neon' : 'text-muted hover:text-text'}`
      }
    >
      {label}
    </NavLink>
  )
}
