import { Link } from 'react-router-dom'
import { MessagesChart } from '../../components/admin/MessagesChart'
import { Icon, type IconName } from '../../components/ui/Icon'
import { Loader } from '../../components/ui/Loader'
import { useAsync } from '../../hooks/useAsync'
import { useSession } from '../../hooks/useSession'
import { ADMIN_IDLE_MINUTES, ADMIN_PATH, MAX_FILE_MB } from '../../lib/config'
import { formatBytes } from '../../lib/format'
import { IS_DEMO } from '../../lib/mode'
import { listMessages } from '../../services/contact'
import { listDocuments } from '../../services/documents'
import { listAllEvents } from '../../services/events'
import { listLatestSections } from '../../services/sections'

const QUICK: { label: string; to: string; icon: IconName }[] = [
  { label: 'Nueva sección', to: 'secciones?nuevo=1', icon: 'sections' },
  { label: 'Nuevo evento', to: 'eventos?nuevo=1', icon: 'events' },
  { label: 'Subir documento', to: 'documentos', icon: 'upload' },
  { label: 'Ver inscripciones', to: 'inscripciones', icon: 'messages' },
]

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
}

function daysUntil(iso: string) {
  const d = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
  return d <= 0 ? 'hoy' : d === 1 ? 'mañana' : `en ${d} días`
}

export function DashboardPage() {
  const session = useSession()
  const { data, loading } = useAsync(
    () => Promise.all([listLatestSections(), listAllEvents(), listDocuments(), listMessages()]),
    [],
  )

  if (loading || !data) return <Loader />
  const [sections, events, docs, messages] = data
  const now = Date.now()
  const upcoming = events
    .filter((e) => new Date(e.ends_at).getTime() >= now)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
  const unread = messages.filter((m) => !m.read)
  const drafts = sections.filter((s) => s.status === 'draft').length
  const totalBytes = docs.reduce((sum, d) => sum + d.size_bytes, 0)

  const kpis: { label: string; value: number; note: string; to: string; icon: IconName; warn?: boolean }[] = [
    { label: 'Secciones publicadas', value: sections.length - drafts, note: drafts ? `${drafts} en borrador` : 'todo publicado', to: 'secciones', icon: 'sections', warn: drafts > 0 },
    { label: 'Próximos eventos', value: upcoming.length, note: upcoming[0] ? `el siguiente ${daysUntil(upcoming[0].starts_at)}` : 'ninguno programado', to: 'eventos', icon: 'events' },
    { label: 'Documentos', value: docs.length, note: `${formatBytes(totalBytes)} en total`, to: 'documentos', icon: 'documents' },
    { label: 'Inscripciones sin leer', value: unread.length, note: `${messages.length} en total`, to: 'inscripciones', icon: 'messages', warn: unread.length > 0 },
  ]

  return (
    <div className="space-y-6">
      <div className="rise flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neon">// panel</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            {greeting()}, <span className="text-neon">{session?.email.split('@')[0]}</span>
          </h1>
          <p className="mt-1 text-sm text-muted first-letter:uppercase">
            {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK.map((q, i) => (
            <Link key={q.to} to={`${ADMIN_PATH}/${q.to}`} className={`btn ${i === 0 ? 'btn-primary' : 'btn-ghost'}`}>
              <Icon name={q.icon} className="h-4 w-4" />
              {q.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k, i) => (
          <Link
            key={k.label}
            to={`${ADMIN_PATH}/${k.to}`}
            className="card rise group relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:border-neon/50"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-neon/5 blur-2xl transition group-hover:bg-neon/15" />
            <div className="flex items-center justify-between">
              <p className="label !mb-0">{k.label}</p>
              <span className="rounded-lg border border-line bg-panel-2 p-2 text-neon">
                <Icon name={k.icon} className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 font-mono text-4xl font-semibold text-text">{k.value}</p>
            <p className={`mt-1 text-xs ${k.warn ? 'text-warn' : 'text-muted'}`}>{k.note}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-semibold">Inscripciones recibidas</h2>
            <span className="font-mono text-xs text-muted">últimos 14 días</span>
          </div>
          <MessagesChart messages={messages} />
        </section>

        <section className="card p-5">
          <h2 className="mb-4 font-semibold">Estado del contenido</h2>
          {sections.length ? (
            <ul className="space-y-3">
              {sections.map((s) => (
                <li key={s.slug} className="flex items-center gap-3">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${s.status === 'published' ? 'bg-neon' : 'bg-warn'}`} />
                  <span className="min-w-0 flex-1 truncate text-sm">{s.title}</span>
                  <span className={`font-mono text-[11px] ${s.status === 'published' ? 'text-muted' : 'text-warn'}`}>
                    {s.status === 'published' ? 'publicado' : 'borrador'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Aún no hay secciones.</p>
          )}
          <Link to={`${ADMIN_PATH}/secciones`} className="mt-5 inline-block text-sm text-neon hover:underline">
            Gestionar secciones →
          </Link>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card p-5">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-semibold">Próximos eventos</h2>
            <Link to={`${ADMIN_PATH}/eventos`} className="text-xs text-neon hover:underline">
              Ver todos
            </Link>
          </div>
          {upcoming.length ? (
            <ul className="space-y-3">
              {upcoming.slice(0, 4).map((e) => {
                const d = new Date(e.starts_at)
                return (
                  <li key={e.id} className="flex gap-3">
                    <div className="flex w-12 shrink-0 flex-col items-center rounded-lg border border-line bg-panel-2 py-1.5 font-mono">
                      <span className="text-lg font-semibold leading-none text-neon">{d.getDate()}</span>
                      <span className="text-[10px] uppercase text-muted">{d.toLocaleDateString('es-CO', { month: 'short' })}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{e.title}</p>
                      <p className="font-mono text-[11px] text-muted">
                        {daysUntil(e.starts_at)} · {e.link ? 'virtual' : 'presencial'}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted">No hay eventos programados.</p>
          )}
        </section>

        <section className="card p-5">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-semibold">Últimas inscripciones</h2>
            <Link to={`${ADMIN_PATH}/inscripciones`} className="text-xs text-neon hover:underline">
              Ver listado
            </Link>
          </div>
          {messages.length ? (
            <ul className="space-y-3">
              {messages.slice(0, 4).map((m) => (
                <li key={m.id} className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-panel-2 font-mono text-xs uppercase text-muted">
                    {m.name.charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm ${m.read ? 'text-text/80' : 'font-semibold'}`}>
                      {m.name} {m.last_name}
                    </p>
                    <p className="truncate font-mono text-[11px] text-muted">
                      {m.career} · {m.campus}
                    </p>
                  </div>
                  {!m.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-neon" aria-label="Sin leer" />}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No hay inscripciones.</p>
          )}
        </section>

        <section className="card p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <Icon name="shield" className="h-5 w-5 text-neon" /> Seguridad activa
          </h2>
          <ul className="space-y-2.5 text-sm">
            {[
              IS_DEMO ? 'Login validado en el servidor de desarrollo' : 'Contraseña con hash bcrypt (Supabase Auth)',
              'Bloqueo de 15 min tras 5 intentos fallidos',
              `Cierre de sesión tras ${ADMIN_IDLE_MINUTES} min de inactividad`,
              IS_DEMO ? 'CAPTCHA listo para activar con Supabase' : 'CAPTCHA en contacto y login',
              `Archivos: sin ejecutables, máximo ${MAX_FILE_MB} MB`,
              'Contenido mostrado como texto (anti-XSS)',
            ].map((t) => (
              <li key={t} className="flex gap-2">
                <span className="font-mono text-neon">✓</span>
                <span className="text-text/85">{t}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
