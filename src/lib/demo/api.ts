// Implementación del modo demo con la misma forma que los servicios de Supabase.
import { EVENTS_PER_PAGE } from '../config'
import type { ContactMessage, PracticeAttempt, PracticeMissionResult, SectionVersion, SirsgDocument, SirsgEvent } from '../../types'
import { deleteFile, getFile, getTable, putFile, setTable, uid } from './db'

const now = () => new Date().toISOString()

// ----------------------------- Secciones -----------------------------
export async function getPublishedSection(slug: string) {
  const rows = await getTable('section_versions')
  return (
    rows
      .filter((r) => r.slug === slug && r.status === 'published')
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null
  )
}

export async function listLatestSections() {
  const rows = [...(await getTable('section_versions'))].sort((a, b) => b.created_at.localeCompare(a.created_at))
  const latest = new Map<string, SectionVersion>()
  for (const r of rows) if (!latest.has(r.slug)) latest.set(r.slug, r)
  return [...latest.values()].sort((a, b) => a.slug.localeCompare(b.slug))
}

export async function saveSection(input: Omit<SectionVersion, 'id' | 'created_at'>) {
  const rows = await getTable('section_versions')
  await setTable('section_versions', [...rows, { ...input, id: uid(), created_at: now() }])
}

export async function deleteSection(slug: string) {
  const rows = await getTable('section_versions')
  await setTable('section_versions', rows.filter((r) => r.slug !== slug))
}

// ----------------------------- Eventos -----------------------------
export async function listEvents(board: 'upcoming' | 'past', page: number) {
  const t = Date.now()
  const all = await getTable('events')
  const events =
    board === 'upcoming'
      ? all.filter((e) => new Date(e.ends_at).getTime() >= t).sort((a, b) => a.starts_at.localeCompare(b.starts_at))
      : all.filter((e) => new Date(e.ends_at).getTime() < t).sort((a, b) => b.starts_at.localeCompare(a.starts_at))
  const from = (page - 1) * EVENTS_PER_PAGE
  return {
    events: events.slice(from, from + EVENTS_PER_PAGE),
    totalPages: Math.max(1, Math.ceil(events.length / EVENTS_PER_PAGE)),
  }
}

export async function listAllEvents() {
  return [...(await getTable('events'))].sort((a, b) => b.starts_at.localeCompare(a.starts_at))
}

export async function saveEvent(input: Omit<SirsgEvent, 'id' | 'created_at'>, id?: string) {
  const rows = await getTable('events')
  await setTable(
    'events',
    id ? rows.map((r) => (r.id === id ? { ...r, ...input } : r)) : [...rows, { ...input, id: uid(), created_at: now() }],
  )
}

export async function deleteEvent(id: string) {
  await setTable('events', (await getTable('events')).filter((r) => r.id !== id))
}

// ----------------------------- Documentos -----------------------------
/** downloadUrl es síncrona: listDocuments deja preparadas las URLs de los blobs. */
const blobUrls = new Map<string, string>()

export async function listDocuments() {
  const docs = [...(await getTable('documents'))].sort((a, b) => b.created_at.localeCompare(a.created_at))
  for (const d of docs) {
    if (blobUrls.has(d.path)) continue
    const blob = await getFile(d.path)
    if (blob) blobUrls.set(d.path, URL.createObjectURL(blob))
  }
  return docs
}

export function downloadUrl(doc: SirsgDocument) {
  return blobUrls.get(doc.path) ?? '#'
}

export async function uploadDocument(file: File, path: string) {
  await putFile(path, file)
  const rows = await getTable('documents')
  await setTable('documents', [...rows, { id: uid(), name: file.name, path, size_bytes: file.size, created_at: now() }])
}

export async function deleteDocument(doc: SirsgDocument) {
  await deleteFile(doc.path)
  const url = blobUrls.get(doc.path)
  if (url) URL.revokeObjectURL(url)
  blobUrls.delete(doc.path)
  await setTable('documents', (await getTable('documents')).filter((d) => d.id !== doc.id))
}

/** Las imágenes se guardan como data URL para que sobrevivan a una recarga. */
export function uploadSectionImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

// ----------------------------- Mensajes -----------------------------
export async function sendContact(input: Omit<ContactMessage, 'id' | 'read' | 'status' | 'notes' | 'created_at'>) {
  const rows = await getTable('contact_messages')
  const lastHour = rows.filter((m) => m.email === input.email && Date.now() - new Date(m.created_at).getTime() < 3600_000)
  if (lastHour.length >= 3) throw new Error('Has enviado demasiados mensajes. Intenta más tarde.')
  await setTable('contact_messages', [...rows, { ...input, id: uid(), read: false, status: 'nuevo', notes: '', created_at: now() }])
}

export async function listMessages() {
  return [...(await getTable('contact_messages'))].sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export async function updateRegistration(id: string, changes: Partial<Pick<ContactMessage, 'status' | 'notes' | 'read'>>) {
  await setTable('contact_messages', (await getTable('contact_messages')).map((m) => (m.id === id ? { ...m, ...changes } : m)))
}

export async function deleteMessage(id: string) {
  await setTable('contact_messages', (await getTable('contact_messages')).filter((m) => m.id !== id))
}

// ----------------------------- Práctica (Kali Lab) -----------------------------
export async function startPractice(name: string, email: string | null) {
  const rows = await getTable('practice_attempts')
  const row = {
    id: uid(), token: uid(), player_name: name, email, started_at: now(), finished_at: null, score: 0, max_score: 600,
    missions_completed: 0, hints_used: 0, duration_seconds: null, grade: null, recommendation: null, details: [],
  }
  await setTable('practice_attempts', [...rows, row])
  return { id: row.id, token: row.token }
}

export async function finishPractice(
  session: { id: string; token: string },
  r: { score: number; missions: number; hints: number; grade: string; recommendation: string; details: PracticeMissionResult[] },
) {
  const rows = await getTable('practice_attempts')
  await setTable(
    'practice_attempts',
    rows.map((a) =>
      a.id === session.id && a.token === session.token && !a.finished_at
        ? {
            ...a,
            score: r.score, missions_completed: r.missions, hints_used: r.hints, grade: r.grade,
            recommendation: r.recommendation, details: r.details, finished_at: now(),
            duration_seconds: Math.round((Date.now() - new Date(a.started_at).getTime()) / 1000),
          }
        : a,
    ),
  )
}

export async function listAttempts(): Promise<PracticeAttempt[]> {
  return [...(await getTable('practice_attempts'))]
    .sort((a, b) => b.started_at.localeCompare(a.started_at))
    .map(({ token: _token, ...a }) => a)
}

export async function deleteAttempt(id: string) {
  await setTable('practice_attempts', (await getTable('practice_attempts')).filter((a) => a.id !== id))
}

// ----------------------------- Sesión -----------------------------
const SESSION_KEY = 'sirsg-demo-session'
const listeners = new Set<() => void>()

export function getDemoSession(): { email: string } | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function onDemoSession(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function setDemoSession(value: { email: string } | null) {
  try {
    if (value) sessionStorage.setItem(SESSION_KEY, JSON.stringify(value))
    else sessionStorage.removeItem(SESSION_KEY)
  } catch {
    /* sin almacenamiento: la sesión dura lo que la pestaña */
  }
  listeners.forEach((fn) => fn())
}

/** El servidor de desarrollo compara contra credenciales-admin.txt y aplica el bloqueo (RF-11). */
export async function login(email: string, password: string) {
  const res = await fetch('/__demo/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? 'No se pudo iniciar sesión.')
  setDemoSession({ email: data.email })
}

export async function logout() {
  setDemoSession(null)
}
