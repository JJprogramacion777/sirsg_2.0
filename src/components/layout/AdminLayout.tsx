import { useCallback, useState } from 'react'
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAsync } from '../../hooks/useAsync'
import { useIdleLogout } from '../../hooks/useIdleLogout'
import { useNoIndex } from '../../hooks/useNoIndex'
import { useSession } from '../../hooks/useSession'
import { ADMIN_IDLE_MINUTES, ADMIN_PATH } from '../../lib/config'
import { IS_DEMO } from '../../lib/mode'
import { logout } from '../../services/auth'
import { listMessages } from '../../services/contact'
import { Icon, type IconName } from '../ui/Icon'
import { Loader } from '../ui/Loader'

const LINKS: { to: string; label: string; icon: IconName }[] = [
  { to: '', label: 'Resumen', icon: 'dashboard' },
  { to: 'secciones', label: 'Secciones', icon: 'sections' },
  { to: 'eventos', label: 'Eventos', icon: 'events' },
  { to: 'documentos', label: 'Documentos', icon: 'documents' },
  { to: 'inscripciones', label: 'Inscripciones', icon: 'messages' },
  { to: 'practica', label: 'Práctica', icon: 'terminal' },
]

/** Protege todas las rutas del panel. Sin sesión, redirige al login. */
export function AdminLayout() {
  useNoIndex()
  const session = useSession()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const { data: messages } = useAsync(listMessages, [pathname])
  const unread = messages?.filter((m) => !m.read).length ?? 0

  // RF-12 y RF-13: replace evita volver al panel con el botón "atrás".
  const endSession = useCallback(
    async (reason?: string) => {
      await logout()
      navigate(`${ADMIN_PATH}/login${reason ? `?motivo=${reason}` : ''}`, { replace: true })
    },
    [navigate],
  )
  const onIdle = useCallback(() => endSession('inactividad'), [endSession])
  useIdleLogout(ADMIN_IDLE_MINUTES, onIdle)

  if (session === undefined) return <Loader label="Verificando sesión" />
  if (session === null) return <Navigate to={`${ADMIN_PATH}/login`} replace />

  const current = LINKS.find((l) => (l.to ? pathname.endsWith(`/${l.to}`) : pathname === ADMIN_PATH)) ?? LINKS[0]

  const nav = (
    <nav className="flex flex-col gap-1 px-3">
      {LINKS.map((l) => (
        <NavLink
          key={l.to}
          to={l.to ? `${ADMIN_PATH}/${l.to}` : ADMIN_PATH}
          end
          onClick={() => setMenuOpen(false)}
          className={({ isActive }) =>
            `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
              isActive ? 'bg-neon/10 text-neon' : 'text-muted hover:bg-panel-2 hover:text-text'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-neon" />}
              <Icon name={l.icon} className="h-[18px] w-[18px]" />
              <span className="flex-1">{l.label}</span>
              {l.to === 'inscripciones' && unread > 0 && (
                <span className="rounded-full bg-neon px-1.5 font-mono text-[11px] font-semibold text-ink">{unread}</span>
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div className="min-h-screen md:grid md:grid-cols-[250px_1fr]">
      {/* Barra lateral (escritorio) */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-line bg-panel/90 backdrop-blur md:flex">
        <div className="flex items-center gap-2 px-6 py-6 font-mono font-semibold">
          <img src="/brand/sirsg-mark.png" alt="" className="h-8 w-8" />
          SIRSG<span className="text-neon">_admin</span>
        </div>
        <p className="px-6 pb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-muted/70">Gestión</p>
        {nav}
        <div className="mt-auto space-y-3 p-4">
          {IS_DEMO && (
            <div className="rounded-lg border border-warn/30 bg-warn/10 px-3 py-2 text-xs text-warn">
              Modo demo: los datos se guardan en este navegador.
            </div>
          )}
          <div className="card flex items-center gap-3 p-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neon/15 font-mono font-semibold uppercase text-neon">
              {session.email.charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{session.email}</p>
              <p className="font-mono text-[11px] text-muted">administrador</p>
            </div>
            <button className="rounded-md p-2 text-muted transition hover:bg-danger/15 hover:text-danger" onClick={() => endSession()} title="Cerrar sesión" aria-label="Cerrar sesión">
              <Icon name="logout" className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </aside>

      {/* Barra superior (móvil) */}
      <div className="sticky top-0 z-30 border-b border-line bg-panel/95 backdrop-blur md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="flex items-center gap-2 font-mono font-semibold">
            <img src="/brand/sirsg-mark.png" alt="" className="h-7 w-7" />
            SIRSG<span className="text-neon">_admin</span>
          </span>
          <button className="rounded-lg border border-line p-2" onClick={() => setMenuOpen((o) => !o)} aria-expanded={menuOpen} aria-label="Menú">
            <Icon name={menuOpen ? 'close' : 'menu'} />
          </button>
        </div>
        {menuOpen && (
          <div className="space-y-3 pb-4">
            {nav}
            <div className="px-3">
              <button className="btn btn-ghost w-full" onClick={() => endSession()}>
                Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="min-w-0">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-8">
          <p className="font-mono text-sm text-muted">
            <span className="text-neon">~/panel</span> / {current.label.toLowerCase()}
          </p>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 font-mono text-xs text-muted sm:flex">
              <Icon name="shield" className="h-4 w-4 text-neon" />
              sesión segura · cierre a los {ADMIN_IDLE_MINUTES} min
            </span>
            <Link to="/" target="_blank" className="btn btn-ghost !py-1.5">
              Ver sitio <Icon name="external" className="h-4 w-4" />
            </Link>
          </div>
        </header>
        <main className="p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
