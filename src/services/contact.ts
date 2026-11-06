import * as demo from '@demo'
import { invokeFunction } from '../lib/functions'
import { IS_DEMO } from '../lib/mode'
import { CAMPUSES, DOCUMENT_TYPES, isValidDocumentNumber, MAX_AGE, MIN_AGE } from '../lib/registration'
import { supabase } from '../lib/supabase'
import { isValidEmail } from '../lib/validators'
import type { ContactMessage } from '../types'

/** Valores tal como salen del formulario (semestre y edad como texto). */
export interface ContactInput {
  name: string
  last_name: string
  document_type: string
  document_number: string
  email: string
  career: string
  semester: string
  campus: string
  age: string
  subject: string
  message: string
}

export type RegistrationUpdate = Partial<Pick<ContactMessage, 'status' | 'notes' | 'read'>>

const COOLDOWN_KEY = 'sirsg-contact-last'
const COOLDOWN_MS = 60_000
/** Un humano tarda más de esto en llenar el formulario. */
const MIN_FILL_MS = 3_000

/**
 * RF-08: capas anti-spam del lado del cliente (honeypot, tiempo mínimo, espera entre envíos).
 * Lo que de verdad protege está en el servidor: la Edge Function "contact" exige el CAPTCHA
 * y la base de datos limita los envíos por correo (ver supabase/).
 */
export function checkSpam(honeypot: string, openedAt: number): string | null {
  if (honeypot) return 'No se pudo enviar el mensaje.'
  if (Date.now() - openedAt < MIN_FILL_MS) return 'Espera un momento antes de enviar.'
  try {
    const last = Number(localStorage.getItem(COOLDOWN_KEY) ?? 0)
    if (Date.now() - last < COOLDOWN_MS) return 'Ya enviaste un mensaje hace poco. Intenta de nuevo en un minuto.'
  } catch {
    /* almacenamiento no disponible: se confía en el límite del servidor */
  }
  return null
}

export function validateContact(input: ContactInput): string | null {
  if (input.name.trim().length < 2) return 'Escribe tu nombre.'
  if (input.last_name.trim().length < 2) return 'Escribe tu apellido.'
  if (!DOCUMENT_TYPES.some((d) => d.value === input.document_type)) return 'Elige el tipo de documento.'
  if (!isValidDocumentNumber(input.document_type, input.document_number.trim())) {
    return input.document_type === 'PA'
      ? 'El pasaporte debe tener entre 5 y 12 letras o números.'
      : 'El número de documento debe tener entre 6 y 10 dígitos, sin puntos ni espacios.'
  }
  if (!isValidEmail(input.email)) return 'Escribe un correo válido.'
  if (input.career.trim().length < 3) return 'Escribe tu carrera.'
  const semester = Number(input.semester)
  if (!Number.isInteger(semester) || semester < 1 || semester > 10) return 'Elige tu semestre.'
  if (!(CAMPUSES as readonly string[]).includes(input.campus)) return 'Elige tu sede.'
  const age = Number(input.age)
  if (!Number.isInteger(age) || age < MIN_AGE || age > MAX_AGE) return `La edad debe estar entre ${MIN_AGE} y ${MAX_AGE} años.`
  if (input.subject.trim().length < 3) return 'Escribe el asunto.'
  if (input.message.trim().length < 10) return 'El mensaje debe tener al menos 10 caracteres.'
  return null
}

export async function sendContact(input: ContactInput, honeypot: string, captchaToken: string | null) {
  const clean = {
    name: input.name.trim(),
    last_name: input.last_name.trim(),
    document_type: input.document_type,
    document_number: input.document_number.trim(),
    email: input.email.trim().toLowerCase(),
    career: input.career.trim(),
    semester: Number(input.semester),
    campus: input.campus,
    age: Number(input.age),
    subject: input.subject.trim(),
    message: input.message.trim(),
  }
  if (IS_DEMO) await demo.sendContact(clean)
  else await invokeFunction('contact', { ...clean, website: honeypot, captchaToken })
  try {
    localStorage.setItem(COOLDOWN_KEY, String(Date.now()))
  } catch {
    /* sin almacenamiento */
  }
}

export async function listMessages() {
  if (IS_DEMO) return demo.listMessages()
  const { data, error } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data as ContactMessage[]
}

export async function markMessageRead(id: string, read: boolean) {
  return updateRegistration(id, { read })
}

/** Seguimiento del admin: estado, notas internas y leído. */
export async function updateRegistration(id: string, changes: RegistrationUpdate) {
  if (IS_DEMO) return demo.updateRegistration(id, changes)
  const { error } = await supabase.from('contact_messages').update(changes).eq('id', id)
  if (error) throw error
}

export async function deleteMessage(id: string) {
  if (IS_DEMO) return demo.deleteMessage(id)
  const { error } = await supabase.from('contact_messages').delete().eq('id', id)
  if (error) throw error
}
