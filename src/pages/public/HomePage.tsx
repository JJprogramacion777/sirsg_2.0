import { Link } from 'react-router-dom'
import { EventCard } from '../../components/EventCard'
import { TerminalHero } from '../../components/TerminalHero'
import { UniversityBadge } from '../../components/UniversityBadge'
import { Coverflow3D } from '../../components/effects/Coverflow3D'
import { FloatingCards3D } from '../../components/effects/FloatingCards3D'
import { ParticleGlobe } from '../../components/effects/ParticleGlobe'
import { useAsync } from '../../hooks/useAsync'
import { formatBytes } from '../../lib/format'
import { RESEARCH_LINES } from '../../lib/research'
import { RESOURCE_GROUPS, RESOURCES } from '../../lib/resources'
import { fileExtension } from '../../lib/validators'
import { downloadUrl, listDocuments } from '../../services/documents'
import { listEvents } from '../../services/events'
import { PUBLIC_SECTIONS } from '../../services/sections'

const PILLARS = [
  { icon: '🛡️', title: 'Seguridad defensiva', text: 'Hardening, monitoreo y respuesta ante incidentes.' },
  { icon: '🔍', title: 'Pentesting ético', text: 'Retos CTF y laboratorios controlados para aprender atacando.' },
  { icon: '🧪', title: 'Investigación', text: 'Proyectos y publicaciones del semillero.' },
]

const SECTION_BLURBS: Record<string, string> = {
  'quienes-somos': 'Quiénes somos, qué hacemos y quién puede participar.',
  'mision-vision': 'Hacia dónde vamos y los objetivos que nos guían.',
  'lineas-investigacion': 'Web, defensa, pentesting, forense, criptografía y más.',
  proyectos: 'Lo que estamos construyendo y los resultados obtenidos.',
}

const STEPS = [
  { cmd: 'contactar', title: 'Escríbenos', text: 'Cuéntanos tu nombre, carrera y sede desde el formulario de contacto.' },
  { cmd: 'asistir', title: 'Ven a una reunión', text: 'Revisa la cartelera y acompáñanos en la próxima sesión, presencial o virtual.' },
  { cmd: 'investigar', title: 'Elige tu línea', text: 'Súmate a una línea de investigación y a un proyecto del semillero.' },
]

export function HomePage() {
  const { data } = useAsync(() => listEvents('upcoming', 1), [])
  const next = data?.events.slice(0, 2) ?? []
  const { data: docs } = useAsync(listDocuments, [])
  const latestDocs = docs?.slice(0, 3) ?? []

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="grid-bg pointer-events-none absolute inset-0" />
        <div className="container-page relative grid items-center gap-6 py-14 lg:grid-cols-2 lg:py-20">
          <div className="rise">
            <span className="tag border-neon/40 text-neon">Semillero de investigación</span>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Ciberseguridad que se <span className="text-neon">aprende haciendo</span>.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted">
              SIRSG 2.0 reúne a estudiantes que quieren investigar, practicar y compartir conocimiento en seguridad
              informática.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/eventos" className="btn btn-primary">
                Ver próximos eventos
              </Link>
              <Link to={`/seccion/${PUBLIC_SECTIONS[0].slug}`} className="btn btn-ghost">
                Conócenos
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-4 border-t border-line pt-6">
              <UniversityBadge size="sm" />
              <p className="text-sm text-muted">
                Semillero de investigación de la <span className="text-text">Universidad ECCI</span>
              </p>
            </div>
          </div>
          <div className="rise relative h-[340px] [animation-delay:150ms] sm:h-[440px] lg:h-[520px]">
            <div className="pointer-events-none absolute inset-[15%] rounded-full bg-neon/10 blur-3xl" />
            <ParticleGlobe />
            <p className="pointer-events-none absolute bottom-2 right-2 font-mono text-[11px] text-muted/70">
              // pasa el cursor sobre la esfera
            </p>
          </div>
        </div>
      </section>

      <section className="container-page grid gap-4 sm:grid-cols-3">
        {PILLARS.map((p, i) => (
          <div key={p.title} className="card rise p-6" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="text-2xl">{p.icon}</div>
            <h3 className="mt-3 font-semibold">{p.title}</h3>
            <p className="mt-1 text-sm text-muted">{p.text}</p>
          </div>
        ))}
      </section>

      <section className="container-page mt-20">
        <SectionTitle tag="el semillero" title="Explora el semillero" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PUBLIC_SECTIONS.map((s, i) => (
            <Link
              key={s.slug}
              to={`/seccion/${s.slug}`}
              className="card rise group p-5 transition hover:border-neon/50"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <p className="font-mono text-xs text-neon-dim">0{i + 1}</p>
              <h3 className="mt-2 font-semibold group-hover:text-neon">{s.label}</h3>
              <p className="mt-1 text-sm text-muted">{SECTION_BLURBS[s.slug]}</p>
              <p className="mt-4 text-sm text-neon">Leer más →</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-24">
        <div className="container-page">
          <SectionTitle tag="investigación" title="Líneas de investigación" />
          <p className="-mt-3 mb-4 max-w-2xl text-muted">
            Arrastra, usa las flechas o haz clic en una tarjeta. Cada integrante elige la línea que más le interesa.
          </p>
        </div>
        <Coverflow3D items={RESEARCH_LINES} linkTo={(l) => `/seccion/lineas-investigacion?linea=${l.id}`} />
        <div className="mt-4 text-center">
          <Link to="/seccion/lineas-investigacion" className="text-sm text-neon hover:underline">
            Conoce cada línea en detalle →
          </Link>
        </div>
      </section>

      <section className="container-page mt-24">
        <SectionTitle tag="participa" title="Cómo unirte" />
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <TerminalHero />
          <ol className="space-y-4">
            {STEPS.map((step, i) => (
              <li key={step.cmd} className="card flex gap-4 p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-neon/30 bg-neon/10 font-mono text-neon">
                  {i + 1}
                </span>
                <div>
                  <p className="font-mono text-xs text-neon">$ ./{step.cmd}</p>
                  <h3 className="mt-1 font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm text-muted">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-page mt-20">
        <div className="mb-6 flex items-end justify-between">
          <SectionTitle tag="próximamente" title="Próximos eventos" inline />
          <Link to="/eventos" className="text-sm text-neon hover:underline">
            Ver todos →
          </Link>
        </div>
        {next.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {next.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        ) : (
          <p className="card p-6 text-sm text-muted">No hay eventos programados por ahora.</p>
        )}
      </section>

      <section className="container-page mt-20">
        <SectionTitle tag="recursos" title="Recursos para empezar" />
        <FloatingCards3D items={RESOURCES} groups={RESOURCE_GROUPS} />
        <p className="mt-3 text-xs text-muted">
          Practica solo en plataformas y laboratorios autorizados. Atacar sistemas sin permiso es ilegal.
        </p>
      </section>

      <section className="container-page mt-20">
        <div className="mb-6 flex items-end justify-between">
          <SectionTitle tag="material" title="Últimos documentos" inline />
          <Link to="/documentos" className="text-sm text-neon hover:underline">
            Ver todos →
          </Link>
        </div>
        {latestDocs.length > 0 ? (
          <ul className="grid gap-3 md:grid-cols-3">
            {latestDocs.map((doc) => (
              <li key={doc.id} className="card flex items-center gap-3 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-panel-2 font-mono text-[10px] uppercase text-neon">
                  {fileExtension(doc.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" title={doc.name}>
                    {doc.name}
                  </p>
                  <p className="font-mono text-xs text-muted">{formatBytes(doc.size_bytes)}</p>
                </div>
                <a href={downloadUrl(doc)} download={doc.name} className="text-sm text-neon hover:underline">
                  Descargar
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="card p-6 text-sm text-muted">Pronto compartiremos guías, presentaciones y material de estudio.</p>
        )}
      </section>

      <section className="container-page mt-20">
        <div className="card relative overflow-hidden p-8 text-center sm:p-12">
          <div className="grid-bg pointer-events-none absolute inset-0" />
          <div className="relative">
            <p className="font-mono text-sm text-neon">$ ./unirse --semillero</p>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">¿Listo para empezar?</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted">
              No necesitas experiencia previa. Estudiantes de todas las carreras y sedes, incluida la sede sur, son
              bienvenidos.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/contacto" className="btn btn-primary">
                Quiero unirme
              </Link>
              <Link to="/eventos" className="btn btn-ghost">
                Ver la cartelera
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function SectionTitle({ tag, title, inline = false }: { tag: string; title: string; inline?: boolean }) {
  return (
    <div className={inline ? '' : 'mb-6'}>
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-neon">// {tag}</p>
      <h2 className="mt-1 text-2xl font-bold">{title}</h2>
    </div>
  )
}
