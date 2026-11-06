/**
 * Opciones del formulario de inscripción. Si cambias alguna lista, actualiza también
 * los CHECK de contact_messages en supabase/schema.sql y la Edge Function "contact".
 */
export const DOCUMENT_TYPES = [
  { value: 'CC', label: 'Cédula de ciudadanía' },
  { value: 'TI', label: 'Tarjeta de identidad' },
  { value: 'CE', label: 'Cédula de extranjería' },
  { value: 'PA', label: 'Pasaporte' },
  { value: 'PPT', label: 'Permiso por protección temporal' },
] as const

/**
 * Número de documento: solo dígitos (6 a 10; las cédulas antiguas tienen 8) salvo el
 * pasaporte, que admite letras. Debe coincidir con el CHECK de la tabla y la Edge Function.
 */
export const DOCUMENT_NUMBER = /^[0-9]{6,10}$/
export const PASSPORT_NUMBER = /^[A-Z0-9]{5,12}$/

export function isValidDocumentNumber(type: string, value: string) {
  return (type === 'PA' ? PASSPORT_NUMBER : DOCUMENT_NUMBER).test(value)
}

/** Limpia lo que escribe la persona: solo dígitos (o letras y dígitos en pasaporte). */
export function cleanDocumentNumber(type: string, value: string) {
  return type === 'PA' ? value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12) : value.replace(/\D/g, '').slice(0, 10)
}

export const CAMPUSES = ['Sede principal', 'Sede sur', 'Otra sede'] as const

export const SEMESTERS = Array.from({ length: 10 }, (_, i) => i + 1)

/** Sugerencias para el campo carrera (se puede escribir cualquier otra). */
export const CAREER_SUGGESTIONS = [
  'Ingeniería de sistemas',
  'Ingeniería de software',
  'Ingeniería electrónica',
  'Ingeniería de telecomunicaciones',
  'Tecnología en desarrollo de software',
  'Tecnología en redes',
  'Ciencia de datos',
]

export const MIN_AGE = 14
export const MAX_AGE = 80

/** Seguimiento que hace el admin de cada inscripción. */
export const STATUSES = [
  { value: 'nuevo', label: 'Nueva', tone: 'border-cyan/40 text-cyan' },
  { value: 'contactado', label: 'Contactada', tone: 'border-warn/40 text-warn' },
  { value: 'aceptado', label: 'Aceptada', tone: 'border-neon/40 text-neon' },
  { value: 'rechazado', label: 'Rechazada', tone: 'border-danger/40 text-danger' },
] as const

export type RegistrationStatus = (typeof STATUSES)[number]['value']

export const documentLabel = (v: string) => DOCUMENT_TYPES.find((d) => d.value === v)?.label ?? v
export const statusInfo = (v: string) => STATUSES.find((s) => s.value === v) ?? STATUSES[0]
