import { Link, NavLink, useParams } from 'react-router-dom'
import { RichText } from '../../components/RichText'
import { AboutPage } from '../../components/about/AboutPage'
import { ResearchLinesPage } from '../../components/research/ResearchLinesPage'
import { EmptyState } from '../../components/ui/EmptyState'
import { Loader } from '../../components/ui/Loader'
import { PageHeader } from '../../components/ui/PageHeader'
import { useAsync } from '../../hooks/useAsync'
import { getPublishedSection, PUBLIC_SECTIONS } from '../../services/sections'

/** RF-01 y RF-02 */
export function SectionPage() {
  const { slug = '' } = useParams()
  const { data: section, loading, error } = useAsync(() => getPublishedSection(slug), [slug])
  const fallbackTitle = PUBLIC_SECTIONS.find((s) => s.slug === slug)?.label ?? 'Sección'

  // Estas secciones tienen su propia página interactiva.
  if (slug === 'lineas-investigacion') {
    return loading ? <Loader /> : <ResearchLinesPage section={error ? null : (section ?? null)} />
  }
  if (slug === 'quienes-somos') {
    return loading ? <Loader /> : <AboutPage section={error ? null : (section ?? null)} />
  }

  return (
    <div className="container-page py-16">
      <div className="grid gap-10 lg:grid-cols-[1fr_17rem]">
        <div className="min-w-0">
          {loading ? (
            <Loader />
          ) : !section || error ? (
            <>
              <PageHeader tag="semillero" title={fallbackTitle} />
              <EmptyState />
            </>
          ) : (
            <article>
              <PageHeader tag="semillero" title={section.title} />
              {section.image_url && (
                <img src={section.image_url} alt="" className="rise mb-8 max-h-96 w-full rounded-xl border border-line object-cover" />
              )}
              <div className="rise max-w-3xl">
                <RichText body={section.body} />
              </div>
            </article>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <nav className="card p-5">
            <p className="label">El semillero</p>
            <ul className="mt-2 space-y-1">
              {PUBLIC_SECTIONS.map((s) => (
                <li key={s.slug}>
                  <NavLink
                    to={`/seccion/${s.slug}`}
                    className={({ isActive }) =>
                      `block rounded-md px-3 py-2 text-sm transition ${isActive ? 'bg-neon/10 text-neon' : 'text-muted hover:text-text'}`
                    }
                  >
                    {s.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="card p-5">
            <p className="font-mono text-sm text-neon">$ ./unirse</p>
            <p className="mt-2 text-sm text-muted">
              ¿Te interesa la ciberseguridad? Estudiantes de todas las carreras y sedes son bienvenidos.
            </p>
            <Link to="/contacto" className="btn btn-primary mt-4 w-full">
              Quiero unirme
            </Link>
            <Link to="/eventos" className="btn btn-ghost mt-2 w-full">
              Ver reuniones
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
