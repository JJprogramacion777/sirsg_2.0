import * as demo from '@demo'
import { IS_DEMO } from '../lib/mode'
import { supabase } from '../lib/supabase'
import type { PracticeAttempt, PracticeMissionResult } from '../types'

/** Identifica la partida en curso; el token prueba que el resultado viene de quien la empezó. */
export interface PracticeSession {
  id: string
  token: string
}

export interface PracticeResult {
  score: number
  missions: number
  hints: number
  grade: string
  recommendation: string
  details: PracticeMissionResult[]
}

/** Registra que alguien entró al Kali Lab. */
export async function startPractice(name: string, email: string | null): Promise<PracticeSession> {
  if (IS_DEMO) return demo.startPractice(name, email)
  const { data, error } = await supabase.rpc('start_practice', { p_name: name, p_email: email ?? '' })
  if (error) throw new Error(error.message.includes('rate_limit') ? 'Hay demasiadas partidas nuevas. Intenta en un minuto.' : 'No se pudo iniciar la partida.')
  const row = (data as PracticeSession[])[0]
  return { id: row.id, token: row.token }
}

export async function finishPractice(session: PracticeSession, result: PracticeResult) {
  if (IS_DEMO) return demo.finishPractice(session, result)
  const { error } = await supabase.rpc('finish_practice', {
    p_id: session.id,
    p_token: session.token,
    p_score: result.score,
    p_missions: result.missions,
    p_hints: result.hints,
    p_grade: result.grade,
    p_recommendation: result.recommendation,
    p_details: result.details,
  })
  if (error) throw error
}

/** Admin: todas las partidas, la más reciente primero (sin el token). */
export async function listAttempts(): Promise<PracticeAttempt[]> {
  if (IS_DEMO) return demo.listAttempts()
  const { data, error } = await supabase
    .from('practice_attempts')
    .select('id, player_name, email, started_at, finished_at, score, max_score, missions_completed, hints_used, duration_seconds, grade, recommendation, details')
    .order('started_at', { ascending: false })
  if (error) throw error
  return data as PracticeAttempt[]
}

export async function deleteAttempt(id: string) {
  if (IS_DEMO) return demo.deleteAttempt(id)
  const { error } = await supabase.from('practice_attempts').delete().eq('id', id)
  if (error) throw error
}
