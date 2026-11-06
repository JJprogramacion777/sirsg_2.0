import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from './supabase'

/** Llama a una Edge Function y convierte sus respuestas { error } en excepciones legibles. */
export async function invokeFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body })
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const payload = await error.context.json().catch(() => null)
      if (typeof payload?.error === 'string') throw new Error(payload.error)
    }
    throw new Error('No se pudo conectar con el servidor. Intenta de nuevo.')
  }
  return data as T
}
