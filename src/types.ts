export type PublishStatus = 'draft' | 'published'

/** Cada guardado crea una versión nueva; el público ve la última publicada (RF-01, RF-15). */
export interface SectionVersion {
  id: string
  slug: string
  title: string
  body: string
  image_url: string | null
  status: PublishStatus
  created_at: string
}

export interface SirsgEvent {
  id: string
  title: string
  description: string
  starts_at: string
  ends_at: string
  location: string | null
  link: string | null
  created_at: string
}

export interface SirsgDocument {
  id: string
  name: string
  path: string
  size_bytes: number
  created_at: string
}

/** Inscripción / mensaje del formulario de contacto (RF-07). */
export interface ContactMessage {
  id: string
  name: string
  last_name: string
  document_type: string
  document_number: string
  email: string
  career: string
  semester: number
  campus: string
  age: number
  subject: string
  message: string
  read: boolean
  /** Seguimiento del admin: nuevo, contactado, aceptado o rechazado. */
  status: string
  /** Notas internas, solo visibles en el panel. */
  notes: string
  created_at: string
}

/** Resultado de una misión del Kali Lab (se guarda en details). */
export interface PracticeMissionResult {
  id: string
  completed: boolean
  hints: number
  wrong: number
  points: number
}

/** Partida del Kali Lab (práctica). El token nunca se lee desde el navegador. */
export interface PracticeAttempt {
  id: string
  player_name: string
  email: string | null
  started_at: string
  finished_at: string | null
  score: number
  max_score: number
  missions_completed: number
  hints_used: number
  duration_seconds: number | null
  grade: string | null
  recommendation: string | null
  details: PracticeMissionResult[]
}
