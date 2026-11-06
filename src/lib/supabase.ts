import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** false mientras no exista un .env con los datos de Supabase. */
export const isSupabaseConfigured = Boolean(url && anonKey && !url.includes('xxxxxxxx'))

export const supabase = createClient(
  isSupabaseConfigured ? url! : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? anonKey! : 'placeholder-key',
)

export const DOCUMENTS_BUCKET = 'documentos'
export const IMAGES_BUCKET = 'imagenes'
