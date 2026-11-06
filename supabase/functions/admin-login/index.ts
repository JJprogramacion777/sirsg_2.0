// RF-09, RF-10, RF-11: inicio de sesión del administrador.
// El bloqueo por intentos fallidos se decide aquí, en el servidor: el navegador solo recibe
// los tokens de sesión si el CAPTCHA, el bloqueo, la contraseña y el rol de admin están en orden.
import { anonClient, corsHeaders, json, readBody, serviceClient, text, verifyCaptcha } from '../_shared/http.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Método no permitido.' }, 405)

  const body = await readBody(req)
  const email = text(body?.email).toLowerCase()
  const password = typeof body?.password === 'string' ? body.password : ''
  if (!email || !password) return json({ error: 'Escribe tu correo y contraseña.' }, 400)

  if (!(await verifyCaptcha(body?.captchaToken))) {
    return json({ error: 'No se pudo verificar que eres una persona. Vuelve a intentarlo.' }, 400)
  }

  const service = serviceClient()

  const { data: lockedUntil, error: lockError } = await service.rpc('login_locked_until', { p_email: email })
  if (lockError) {
    console.error(lockError)
    return json({ error: 'Error del servidor.' }, 500)
  }
  if (lockedUntil) {
    const minutes = Math.ceil((new Date(lockedUntil).getTime() - Date.now()) / 60_000)
    return json({ error: `Cuenta bloqueada por demasiados intentos. Intenta de nuevo en ${minutes} min.` }, 423)
  }

  // Supabase Auth compara la contraseña con su hash bcrypt (RF-10).
  const { data, error } = await anonClient().auth.signInWithPassword({ email, password })
  if (error || !data.session) {
    const { data: remaining } = await service.rpc('register_failed_login', { p_email: email })
    if (remaining === 0) return json({ error: 'Demasiados intentos fallidos. Acceso bloqueado por 15 minutos.' }, 423)
    return json({ error: `Correo o contraseña incorrectos.${remaining ? ` Te quedan ${remaining} intentos.` : ''}` }, 401)
  }

  const { data: admin } = await service.from('admins').select('user_id').eq('user_id', data.user.id).maybeSingle()
  if (!admin) {
    await service.auth.admin.signOut(data.session.access_token)
    return json({ error: 'Esta cuenta no tiene permisos de administración.' }, 403)
  }

  await service.from('login_attempts').delete().eq('email', email)
  return json({ access_token: data.session.access_token, refresh_token: data.session.refresh_token })
})
