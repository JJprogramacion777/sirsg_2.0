import { ALLOWED_EXTENSIONS, MAX_FILE_MB } from './config'

/** RF-19: el enlace debe empezar por https:// y tener un dominio válido. */
const HTTPS_URL = /^https:\/\/([a-z0-9-]+\.)+[a-z]{2,}(:\d{2,5})?(\/[^\s<>"']*)?$/i

export function isValidHttpsUrl(value: string) {
  return HTTPS_URL.test(value.trim())
}

/** RF-18: la fecha de fin debe ser posterior a la de inicio. */
export function isValidRange(startsAt: string, endsAt: string) {
  return new Date(endsAt).getTime() > new Date(startsAt).getTime()
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function isValidEmail(value: string) {
  return EMAIL.test(value.trim())
}

export function fileExtension(name: string) {
  const dot = name.lastIndexOf('.')
  return dot === -1 ? '' : name.slice(dot + 1).toLowerCase()
}

/** RF-21 y RF-22: devuelve un mensaje de error o null si el archivo es aceptable. */
export function validateUpload(file: File): string | null {
  const ext = fileExtension(file.name)
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return `Extensión ".${ext || '?'}" no permitida. Solo se aceptan: ${ALLOWED_EXTENSIONS.join(', ')}.`
  }
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    return `LÍMITE EXCEDIDO: el archivo pesa ${(file.size / 1024 / 1024).toFixed(1)} MB y el máximo es ${MAX_FILE_MB} MB.`
  }
  return null
}
