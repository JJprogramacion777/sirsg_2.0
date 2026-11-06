// Almacenamiento del modo demo: tablas y archivos en IndexedDB del navegador.
import seedSql from '../../../supabase/seed.sql?raw'
import type { ContactMessage, PracticeAttempt, SectionVersion, SirsgDocument, SirsgEvent } from '../../types'

export interface Tables {
  section_versions: SectionVersion[]
  events: SirsgEvent[]
  documents: SirsgDocument[]
  contact_messages: ContactMessage[]
  practice_attempts: (PracticeAttempt & { token: string })[]
}

const DB_NAME = 'sirsg-demo'
let dbPromise: Promise<IDBDatabase> | null = null

function open() {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore('tables')
      req.result.createObjectStore('files')
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

async function run<T>(store: 'tables' | 'files', mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest) {
  const db = await open()
  return new Promise<T>((resolve, reject) => {
    const req = fn(db.transaction(store, mode).objectStore(store))
    req.onsuccess = () => resolve(req.result as T)
    req.onerror = () => reject(req.error)
  })
}

export async function getTable<K extends keyof Tables>(name: K): Promise<Tables[K]> {
  await ensureSeed()
  return ((await run<Tables[K] | undefined>('tables', 'readonly', (s) => s.get(name))) ?? []) as Tables[K]
}

export function setTable<K extends keyof Tables>(name: K, rows: Tables[K]) {
  return run<void>('tables', 'readwrite', (s) => s.put(rows, name))
}

export const getFile = (path: string) => run<Blob | undefined>('files', 'readonly', (s) => s.get(path))
export const putFile = (path: string, blob: Blob) => run<void>('files', 'readwrite', (s) => s.put(blob, path))
export const deleteFile = (path: string) => run<void>('files', 'readwrite', (s) => s.delete(path))

export const uid = () => crypto.randomUUID()

// ---------------------------------------------------------------------------
// Datos de ejemplo la primera vez que se abre el modo demo
// ---------------------------------------------------------------------------
let seeded: Promise<void> | null = null

function ensureSeed() {
  seeded ??= (async () => {
    const done = await run<boolean | undefined>('tables', 'readonly', (s) => s.get('__seeded'))
    // v2: las inscripciones ganaron campos; se reemplazan solo los mensajes de ejemplo.
    const v2 = await run<boolean | undefined>('tables', 'readonly', (s) => s.get('__seeded_v2'))
    if (done && !v2) await setTable('contact_messages', seedMessages())
    await run<void>('tables', 'readwrite', (s) => s.put(true, '__seeded_v2'))
    // v3: partidas de ejemplo del Kali Lab.
    const v3 = await run<boolean | undefined>('tables', 'readonly', (s) => s.get('__seeded_v3'))
    if (!v3) await setTable('practice_attempts', seedPractice())
    await run<void>('tables', 'readwrite', (s) => s.put(true, '__seeded_v3'))
    if (done) return
    await setTable('section_versions', seedSections())
    await setTable('events', seedEvents())
    await setTable('contact_messages', seedMessages())
    await setTable('documents', await seedDocuments())
    await run<void>('tables', 'readwrite', (s) => s.put(true, '__seeded'))
  })()
  return seeded
}

/** Reutiliza el contenido de supabase/seed.sql para no duplicarlo. */
function seedSections(): SectionVersion[] {
  const rows: SectionVersion[] = []
  const re = /\('([a-z-]+)', '([^']+)', \$\$([\s\S]*?)\$\$\)/g
  for (const m of seedSql.matchAll(re)) {
    rows.push({ id: uid(), slug: m[1], title: m[2], body: m[3], image_url: null, status: 'published', created_at: new Date().toISOString() })
  }
  return rows
}

const day = 24 * 60 * 60 * 1000
function at(daysFromNow: number, hour: number, durationH = 2) {
  const d = new Date(Date.now() + daysFromNow * day)
  d.setHours(hour, 0, 0, 0)
  return { starts_at: d.toISOString(), ends_at: new Date(d.getTime() + durationH * 3600_000).toISOString() }
}

function seedEvents(): SirsgEvent[] {
  const now = new Date().toISOString()
  return [
    { title: 'Taller: introducción a OWASP Top 10', description: 'Repasamos las vulnerabilidades web más comunes con ejemplos en laboratorio.', location: 'Laboratorio de redes, sede principal', link: null, ...at(3, 14) },
    { title: 'Reunión general del semillero', description: 'Avances de proyectos y planeación del semestre.', location: null, link: 'https://meet.google.com/abc-defg-hij', ...at(7, 18, 1) },
    { title: 'CTF interno: retos para principiantes', description: 'Competencia por equipos. No se necesita experiencia previa.', location: 'Sede sur, sala 204', link: null, ...at(14, 9, 4) },
    { title: 'Charla: respuesta a incidentes', description: 'Cómo actuar ante un incidente de seguridad, paso a paso.', location: null, link: 'https://meet.google.com/xyz-uvwx-rst', ...at(21, 17) },
    { title: 'Bienvenida a nuevos integrantes', description: 'Presentación del semillero y de sus líneas de investigación.', location: 'Auditorio, sede principal', link: null, ...at(-10, 15) },
    { title: 'Laboratorio de hardening en Linux', description: 'Endurecimiento básico de un servidor Ubuntu.', location: 'Laboratorio de redes', link: null, ...at(-24, 14, 3) },
  ].map((e) => ({ ...e, id: uid(), created_at: now }))
}

function seedMessages(): ContactMessage[] {
  const msgs = [
    { name: 'Laura', last_name: 'Gómez', document_type: 'CC', document_number: '1023456789', email: 'laura.gomez@ejemplo.edu.co', career: 'Ingeniería de sistemas', semester: 4, campus: 'Sede sur', age: 20, subject: 'Quiero unirme al semillero', message: 'Hola, estudio en la sede sur. ¿Cómo puedo participar en las reuniones?', read: false, status: 'nuevo', ago: 0.2 },
    { name: 'Andrés', last_name: 'Pérez', document_type: 'TI', document_number: '1012345678', email: 'andres.perez@ejemplo.edu.co', career: 'Tecnología en desarrollo de software', semester: 1, campus: 'Sede principal', age: 17, subject: 'Inscripción al CTF', message: '¿El CTF interno es individual o por equipos? Me gustaría inscribirme.', read: false, status: 'nuevo', ago: 1.5 },
    { name: 'Camila', last_name: 'Ruiz', document_type: 'CC', document_number: '52345678', email: 'camila.ruiz@ejemplo.edu.co', career: 'Ingeniería electrónica', semester: 6, campus: 'Sede principal', age: 22, subject: 'Quiero unirme', message: 'Me interesa la línea de criptografía y redes.', read: true, status: 'contactado', ago: 4 },
    { name: 'Santiago', last_name: 'Díaz', document_type: 'CC', document_number: '1098765432', email: 'santiago.diaz@ejemplo.edu.co', career: 'Ingeniería de software', semester: 8, campus: 'Sede sur', age: 23, subject: 'Propuesta de proyecto', message: 'Me gustaría proponer un proyecto sobre seguridad en dispositivos IoT.', read: true, status: 'aceptado', ago: 6 },
    { name: 'Valentina', last_name: 'Torres', document_type: 'CE', document_number: '456789', email: 'valentina.torres@ejemplo.edu.co', career: 'Ciencia de datos', semester: 3, campus: 'Otra sede', age: 25, subject: 'Horario de reuniones', message: 'Trabajo en las mañanas, ¿hay reuniones en la tarde o virtuales?', read: true, status: 'aceptado', ago: 9 },
    { name: 'Mateo', last_name: 'Rojas', document_type: 'CC', document_number: '80123456', email: 'mateo.rojas@ejemplo.edu.co', career: 'Ingeniería de telecomunicaciones', semester: 10, campus: 'Sede principal', age: 24, subject: 'Inscripción', message: 'Estoy terminando la carrera, ¿puedo unirme este semestre?', read: true, status: 'rechazado', ago: 12 },
  ]
  return msgs.map(({ ago, ...m }) => ({ ...m, notes: '', id: uid(), created_at: new Date(Date.now() - ago * day).toISOString() }))
}

async function seedDocuments(): Promise<SirsgDocument[]> {
  const files = [
    { name: 'Guia-de-inicio-SIRSG.txt', text: 'Guía de inicio del semillero SIRSG 2.0\n\n1. Lee las líneas de investigación.\n2. Asiste a una reunión.\n3. Practica en PortSwigger Web Security Academy.\n' },
    { name: 'Reglamento-laboratorios.txt', text: 'Reglamento de laboratorios\n\n- Solo se practica en entornos autorizados.\n- No se ataca ningún sistema sin permiso por escrito.\n- Todo hallazgo se documenta y se reporta.\n' },
  ]
  const rows: SirsgDocument[] = []
  for (const f of files) {
    const blob = new Blob([f.text], { type: 'text/plain' })
    const path = `${uid()}.txt`
    await putFile(path, blob)
    rows.push({ id: uid(), name: f.name, path, size_bytes: blob.size, created_at: new Date().toISOString() })
  }
  return rows
}

function seedPractice(): Tables['practice_attempts'] {
  const ids = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6']
  const players = [
    { player_name: 'neo_ecci', email: 'laura.gomez@ejemplo.edu.co', hints: [0, 0, 0, 1, 0, 0], done: 6, ago: 0.1, mins: 14, grade: 'A', rec: 'Tu fuerte: Seguridad web. Te recomendamos esa línea. Repasa: nmap.' },
    { player_name: 'andresp', email: 'andres.perez@ejemplo.edu.co', hints: [1, 1, 2, 1, 0, 0], done: 5, ago: 1.2, mins: 26, grade: 'C', rec: 'Tu fuerte: Criptografía y redes. Te recomendamos esa línea. Repasa: whoami, cd, grep, nmap, curl.' },
    { player_name: 'cami.sec', email: null, hints: [0, 0, 1, 0, 0, 0], done: 6, ago: 2.5, mins: 18, grade: 'A', rec: 'Tu fuerte: Cultura de seguridad. Te recomendamos esa línea. Repasa: grep.' },
    { player_name: 'invitado42', email: null, hints: [2, 1, 0, 0, 0, 0], done: 2, ago: 3, mins: 9, grade: 'D', rec: 'Tu fuerte: Forense y malware. Te recomendamos esa línea. Repasa: whoami, cd, grep, nmap, base64 -d, curl.' },
    { player_name: 'santi_d', email: 'santiago.diaz@ejemplo.edu.co', hints: [0, 0, 0, 0, 0, 0], done: 0, ago: 0.02, mins: 0, grade: null, rec: null },
  ]
  return players.map((p) => {
    const details = ids.map((id, i) => {
      const completed = i < p.done
      const hints = completed ? p.hints[i] : 0
      return { id, completed, hints, wrong: i === 3 ? 1 : 0, points: completed ? Math.max(25, 100 - hints * 25) : 0 }
    })
    const started = new Date(Date.now() - p.ago * day)
    const finished = p.grade ? new Date(started.getTime() + p.mins * 60_000) : null
    return {
      id: uid(),
      token: uid(),
      player_name: p.player_name,
      email: p.email,
      started_at: started.toISOString(),
      finished_at: finished?.toISOString() ?? null,
      score: details.reduce((s, d) => s + d.points, 0),
      max_score: 600,
      missions_completed: p.done,
      hints_used: details.reduce((s, d) => s + d.hints, 0),
      duration_seconds: finished ? p.mins * 60 : null,
      grade: p.grade,
      recommendation: p.rec,
      details: p.grade ? details : [],
    }
  })
}
