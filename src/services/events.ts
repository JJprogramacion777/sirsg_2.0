import { EVENTS_PER_PAGE } from '../lib/config'
import * as demo from '@demo'
import { IS_DEMO } from '../lib/mode'
import { supabase } from '../lib/supabase'
import { isValidHttpsUrl, isValidRange } from '../lib/validators'
import type { SirsgEvent } from '../types'

export type EventBoard = 'upcoming' | 'past'

/**
 * RF-03, RF-04, RF-05: los vigentes van del más próximo al más lejano;
 * los que ya terminaron pasan al historial (del más reciente al más antiguo).
 */
export async function listEvents(board: EventBoard, page: number) {
  if (IS_DEMO) return demo.listEvents(board, page)
  const now = new Date().toISOString()
  const from = (page - 1) * EVENTS_PER_PAGE
  let query = supabase.from('events').select('*', { count: 'exact' })
  query =
    board === 'upcoming'
      ? query.gte('ends_at', now).order('starts_at', { ascending: true })
      : query.lt('ends_at', now).order('starts_at', { ascending: false })
  const { data, error, count } = await query.range(from, from + EVENTS_PER_PAGE - 1)
  if (error) throw error
  return {
    events: data as SirsgEvent[],
    totalPages: Math.max(1, Math.ceil((count ?? 0) / EVENTS_PER_PAGE)),
  }
}

export async function listAllEvents() {
  if (IS_DEMO) return demo.listAllEvents()
  const { data, error } = await supabase.from('events').select('*').order('starts_at', { ascending: false })
  if (error) throw error
  return data as SirsgEvent[]
}

export type EventInput = Omit<SirsgEvent, 'id' | 'created_at'>

/** RF-18 y RF-19. La base de datos repite estas reglas con CHECK constraints. */
export function validateEvent(input: EventInput): string | null {
  if (!input.title.trim()) return 'El título es obligatorio.'
  if (!input.starts_at || !input.ends_at) return 'Debes indicar fecha y hora de inicio y de fin.'
  if (!isValidRange(input.starts_at, input.ends_at)) {
    return 'La fecha y hora de finalización debe ser posterior a la de inicio.'
  }
  if (input.link && !isValidHttpsUrl(input.link)) {
    return 'El enlace debe ser una URL válida que empiece por https://'
  }
  if (!input.link && !input.location?.trim()) return 'Indica un lugar o un enlace de la reunión.'
  return null
}

export async function saveEvent(input: EventInput, id?: string) {
  if (IS_DEMO) return demo.saveEvent(input, id)
  const { error } = id
    ? await supabase.from('events').update(input).eq('id', id)
    : await supabase.from('events').insert(input)
  if (error) throw error
}

export async function deleteEvent(id: string) {
  if (IS_DEMO) return demo.deleteEvent(id)
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) throw error
}
