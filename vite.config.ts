import { createHash, timingSafeEqual } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const CREDENTIALS_FILE = resolve(import.meta.dirname, 'credenciales-admin.txt')
const MAX_ATTEMPTS = 5
const LOCK_MS = 15 * 60_000

/**
 * Login del modo demo (solo `npm run dev`, nunca en el build).
 * Las credenciales se leen de credenciales-admin.txt aquí, en el servidor:
 * el navegador nunca las recibe. Incluye el bloqueo de RF-11.
 */
function demoLogin(): Plugin {
  const attempts = new Map<string, { count: number; lockedUntil: number }>()
  const digest = (s: string) => createHash('sha256').update(s).digest()
  const same = (a: string, b: string) => timingSafeEqual(digest(a), digest(b))

  function readCredentials() {
    if (!existsSync(CREDENTIALS_FILE)) return null
    const text = readFileSync(CREDENTIALS_FILE, 'utf8')
    const email = text.match(/^Correo:\s*(\S+)/m)?.[1]
    const password = text.match(/^Contraseña:\s*(\S+)/m)?.[1]
    return email && password ? { email: email.toLowerCase(), password } : null
  }

  return {
    name: 'sirsg-demo-login',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__demo/login', (req, res) => {
        const send = (status: number, body: object) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(body))
        }
        if (req.method !== 'POST') return send(405, { error: 'Método no permitido.' })

        let raw = ''
        req.on('data', (chunk) => (raw += chunk))
        req.on('end', () => {
          const creds = readCredentials()
          if (!creds) return send(500, { error: 'Falta credenciales-admin.txt en la raíz del proyecto.' })

          let body: { email?: unknown; password?: unknown } = {}
          try {
            body = JSON.parse(raw)
          } catch {
            return send(400, { error: 'Solicitud inválida.' })
          }
          const email = String(body.email ?? '').trim().toLowerCase()
          const password = String(body.password ?? '')

          const entry = attempts.get(email) ?? { count: 0, lockedUntil: 0 }
          if (entry.lockedUntil > Date.now()) {
            const minutes = Math.ceil((entry.lockedUntil - Date.now()) / 60_000)
            return send(423, { error: `Cuenta bloqueada por demasiados intentos. Intenta de nuevo en ${minutes} min.` })
          }

          if (same(email, creds.email) && same(password, creds.password)) {
            attempts.delete(email)
            return send(200, { email: creds.email })
          }

          entry.count += 1
          if (entry.count >= MAX_ATTEMPTS) {
            attempts.set(email, { count: 0, lockedUntil: Date.now() + LOCK_MS })
            return send(423, { error: 'Demasiados intentos fallidos. Acceso bloqueado por 15 minutos.' })
          }
          attempts.set(email, entry)
          const left = MAX_ATTEMPTS - entry.count
          return send(401, { error: `Correo o contraseña incorrectos. Te quedan ${left} intentos.` })
        })
      })
    },
  }
}

export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss(), demoLogin()],
  resolve: {
    alias: {
      // En el build, el modo demo se cambia por un módulo vacío (src/lib/demo/stub.ts).
      '@demo': resolve(import.meta.dirname, command === 'build' ? 'src/lib/demo/stub.ts' : 'src/lib/demo/api.ts'),
    },
  },
}))
