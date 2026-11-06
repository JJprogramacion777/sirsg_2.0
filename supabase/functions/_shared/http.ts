// Utilidades compartidas por las Edge Functions (Deno).
import { createClient } from 'npm:@supabase/supabase-js@2'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

/** Cliente con service role: ignora RLS, nunca sale del servidor. */
export function serviceClient() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** Cliente con la anon key, para iniciar sesión como lo haría el navegador. */
export function anonClient() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** Verifica el token de Cloudflare Turnstile contra la clave secreta (RF-08, RF-11). */
export async function verifyCaptcha(token: unknown) {
  const secret = Deno.env.get('TURNSTILE_SECRET_KEY')
  if (!secret) throw new Error('Falta el secreto TURNSTILE_SECRET_KEY')
  if (typeof token !== 'string' || !token) return false

  const form = new FormData()
  form.append('secret', secret)
  form.append('response', token)
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form })
  const data = await res.json()
  return data.success === true
}

export async function readBody(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.json()
    return body && typeof body === 'object' ? body : null
  } catch {
    return null
  }
}

export function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}
