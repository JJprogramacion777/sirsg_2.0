import * as demo from '@demo'
import { invokeFunction } from '../lib/functions'
import { IS_DEMO } from '../lib/mode'
import { supabase } from '../lib/supabase'

interface LoginResponse {
  access_token: string
  refresh_token: string
}

/**
 * RF-09, RF-10, RF-11. La Edge Function "admin-login" verifica el CAPTCHA, aplica el bloqueo
 * por intentos fallidos y compara la contraseña con su hash bcrypt; el navegador solo recibe
 * la sesión si todo está en orden.
 */
export async function login(email: string, password: string, captchaToken: string | null) {
  if (IS_DEMO) return demo.login(email.trim().toLowerCase(), password)
  const tokens = await invokeFunction<LoginResponse>('admin-login', {
    email: email.trim().toLowerCase(),
    password,
    captchaToken,
  })
  const { error } = await supabase.auth.setSession(tokens)
  if (error) throw error
}

/** RF-13 */
export async function logout() {
  if (IS_DEMO) return demo.logout()
  await supabase.auth.signOut()
}
