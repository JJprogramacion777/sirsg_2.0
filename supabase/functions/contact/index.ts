// RF-07, RF-08: recibe el formulario de contacto, verifica el CAPTCHA y guarda el mensaje.
// Es la única vía de entrada: la tabla contact_messages no acepta inserts del público.
import { corsHeaders, json, readBody, serviceClient, text, verifyCaptcha } from '../_shared/http.ts'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
// Deben coincidir con src/lib/registration.ts y el CHECK de la tabla.
const DOCUMENT_TYPES = ['CC', 'TI', 'CE', 'PA', 'PPT']
const CAMPUSES = ['Sede principal', 'Sede sur', 'Otra sede']

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Método no permitido.' }, 405)

  const body = await readBody(req)
  if (!body) return json({ error: 'Solicitud inválida.' }, 400)

  // Honeypot: si viene lleno es un bot. Se responde igual que un éxito para no darle pistas.
  if (text(body.website)) return json({ ok: true })

  if (!(await verifyCaptcha(body.captchaToken))) {
    return json({ error: 'No se pudo verificar que eres una persona. Vuelve a intentarlo.' }, 400)
  }

  const name = text(body.name)
  const last_name = text(body.last_name)
  const document_type = text(body.document_type)
  const document_number = text(body.document_number).toUpperCase()
  const email = text(body.email).toLowerCase()
  const career = text(body.career)
  const semester = Number(body.semester)
  const campus = text(body.campus)
  const age = Number(body.age)
  const subject = text(body.subject)
  const message = text(body.message)
  if (name.length < 2 || name.length > 100) return json({ error: 'Escribe tu nombre.' }, 400)
  if (last_name.length < 2 || last_name.length > 100) return json({ error: 'Escribe tu apellido.' }, 400)
  if (!DOCUMENT_TYPES.includes(document_type)) return json({ error: 'Elige el tipo de documento.' }, 400)
  const docPattern = document_type === 'PA' ? /^[A-Z0-9]{5,12}$/ : /^[0-9]{6,10}$/
  if (!docPattern.test(document_number)) return json({ error: 'Revisa el número de documento.' }, 400)
  if (!EMAIL.test(email) || email.length > 150) return json({ error: 'Escribe un correo válido.' }, 400)
  if (career.length < 3 || career.length > 120) return json({ error: 'Escribe tu carrera.' }, 400)
  if (!Number.isInteger(semester) || semester < 1 || semester > 10) return json({ error: 'Elige tu semestre.' }, 400)
  if (!CAMPUSES.includes(campus)) return json({ error: 'Elige tu sede.' }, 400)
  if (!Number.isInteger(age) || age < 14 || age > 80) return json({ error: 'La edad debe estar entre 14 y 80 años.' }, 400)
  if (subject.length < 3 || subject.length > 150) return json({ error: 'Escribe el asunto.' }, 400)
  if (message.length < 10 || message.length > 2000) {
    return json({ error: 'El mensaje debe tener entre 10 y 2000 caracteres.' }, 400)
  }

  const { error } = await serviceClient().from('contact_messages').insert({ name, last_name, document_type, document_number, email, career, semester, campus, age, subject, message })
  if (error) {
    if (error.message.includes('rate_limit')) {
      return json({ error: 'Has enviado demasiados mensajes. Intenta más tarde.' }, 429)
    }
    console.error(error)
    return json({ error: 'No se pudo enviar el mensaje.' }, 500)
  }
  return json({ ok: true })
})
