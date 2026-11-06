/**
 * Logo de la Universidad ECCI. Tiene fondo blanco y letras azul oscuro, que se pierden
 * sobre el fondo negro del sitio; por eso va siempre dentro de una tarjeta blanca.
 */
export function UniversityBadge({ size = 'md' }: { size?: 'sm' | 'md' }) {
  return (
    <a
      href="https://www.ecci.edu.co"
      target="_blank"
      rel="noopener noreferrer"
      title="Universidad ECCI"
      className={`inline-flex shrink-0 items-center rounded-lg bg-white shadow-lg shadow-black/30 ring-1 ring-white/10 transition hover:-translate-y-0.5 ${
        size === 'sm' ? 'px-2.5 py-1.5' : 'px-3.5 py-2'
      }`}
    >
      <img src="/brand/ecci-logo.png" alt="Universidad ECCI" className={size === 'sm' ? 'h-7 w-auto' : 'h-10 w-auto'} />
    </a>
  )
}
