/** Ruta no indexada del panel de administración (RF-09). */
export const ADMIN_PATH = normalizePath(import.meta.env.VITE_ADMIN_PATH ?? '/panel-sirsg')

/** Minutos de inactividad antes de cerrar sesión (RF-12). */
export const ADMIN_IDLE_MINUTES = Number(import.meta.env.VITE_ADMIN_IDLE_MINUTES ?? 20)

/** Clave pública de Cloudflare Turnstile (CAPTCHA del contacto y del login, RF-08 y RF-11). */
export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? ''

/** Eventos por página en el tablón (RF-05). */
export const EVENTS_PER_PAGE = 5

/**
 * Límite y extensiones permitidas para documentos (RF-21, RF-22).
 * Sin .zip ni otros comprimidos: pueden esconder ejecutables.
 */
export const MAX_FILE_MB = 10
export const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'png', 'jpg', 'jpeg']

function normalizePath(path: string) {
  const p = path.trim()
  return p.startsWith('/') ? p : `/${p}`
}
