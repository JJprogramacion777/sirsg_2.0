import { isSupabaseConfigured } from './supabase'

/**
 * Modo demo: solo con `npm run dev` y sin .env de Supabase.
 * Los datos viven en el navegador (IndexedDB) y el login se valida contra
 * credenciales-admin.txt desde el servidor de desarrollo (ver vite.config.ts).
 * En el build de producción vale siempre false.
 */
export const IS_DEMO = import.meta.env.DEV && !isSupabaseConfigured

/** true si hay datos que mostrar: Supabase conectado o modo demo. */
export const HAS_BACKEND = isSupabaseConfigured || IS_DEMO
