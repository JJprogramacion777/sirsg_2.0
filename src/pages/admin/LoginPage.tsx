import { type FormEvent, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Alert } from '../../components/ui/Alert'
import { Turnstile } from '../../components/ui/Turnstile'
import { errorMessage } from '../../hooks/useAsync'
import { useNoIndex } from '../../hooks/useNoIndex'
import { useSession } from '../../hooks/useSession'
import { ADMIN_PATH } from '../../lib/config'
import { HAS_BACKEND, IS_DEMO } from '../../lib/mode'
import { login } from '../../services/auth'

/** RF-09, RF-10, RF-11 */
export function LoginPage() {
  useNoIndex()
  const session = useSession()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaKey, setCaptchaKey] = useState(0)

  if (session) return <Navigate to={ADMIN_PATH} replace />

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!IS_DEMO && !captchaToken) return setError('Completa la verificación antes de ingresar.')
    setBusy(true)
    try {
      await login(email, password, captchaToken)
      navigate(ADMIN_PATH, { replace: true })
    } catch (err) {
      setError(errorMessage(err))
      setPassword('')
      // El token ya se gastó: se pide uno nuevo.
      setCaptchaToken(null)
      setCaptchaKey((k) => k + 1)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="grid-bg pointer-events-none fixed inset-0" />
      <form onSubmit={submit} className="card rise relative w-full max-w-sm space-y-4 p-7">
        <div className="text-center">
          <img src="/brand/sirsg-mark.png" alt="Logo SIRSG 2.0" className="mx-auto h-16 w-16 drop-shadow-[0_0_24px_rgba(110,252,174,0.35)]" />
          <h1 className="mt-3 font-mono text-lg font-semibold">
            Acceso <span className="text-neon">restringido</span>
          </h1>
          <p className="mt-1 text-xs text-muted">Panel de administración SIRSG 2.0</p>
        </div>

        {params.get('motivo') === 'inactividad' && (
          <Alert kind="warn">Tu sesión se cerró por inactividad.</Alert>
        )}
        {IS_DEMO && (
          <Alert kind="warn">Modo demo local: entra con las credenciales de credenciales-admin.txt.</Alert>
        )}
        {!HAS_BACKEND && <Alert kind="warn">Supabase no está configurado (.env).</Alert>}

        <div>
          <label className="label" htmlFor="email">
            Correo
          </label>
          <input id="email" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            className="field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        {!IS_DEMO && <Turnstile key={captchaKey} onToken={setCaptchaToken} />}

        {error && <Alert>{error}</Alert>}

        <button className="btn btn-primary w-full" disabled={busy || !HAS_BACKEND}>
          {busy ? 'Verificando…' : 'Ingresar'}
        </button>
      </form>
    </div>
  )
}
