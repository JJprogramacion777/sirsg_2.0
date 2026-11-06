import { type FormEvent, type ReactNode, useCallback, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { WelcomeIntro } from '../../components/WelcomeIntro'
import { Alert } from '../../components/ui/Alert'
import { Turnstile } from '../../components/ui/Turnstile'
import { errorMessage } from '../../hooks/useAsync'
import { HAS_BACKEND, IS_DEMO } from '../../lib/mode'
import { CAMPUSES, CAREER_SUGGESTIONS, cleanDocumentNumber, DOCUMENT_TYPES, MAX_AGE, MIN_AGE, SEMESTERS } from '../../lib/registration'
import { checkSpam, type ContactInput, sendContact, validateContact } from '../../services/contact'

const EMPTY: ContactInput = {
  name: '',
  last_name: '',
  document_type: '',
  document_number: '',
  email: '',
  career: '',
  semester: '',
  campus: '',
  age: '',
  subject: 'Quiero inscribirme en el semillero',
  message: '',
}

/** RF-07 y RF-08: inscripción y contacto. */
export function ContactPage() {
  // ?linea=… llega desde "Quiero unirme a esta línea" y rellena el asunto.
  const [params] = useSearchParams()
  const line = params.get('linea')?.slice(0, 100)
  const [form, setForm] = useState<ContactInput>(() => (line ? { ...EMPTY, subject: `Quiero unirme a la línea: ${line}` } : EMPTY))
  const [consent, setConsent] = useState(false)
  const [honeypot, setHoneypot] = useState('')
  const [status, setStatus] = useState<{ kind: 'error' | 'success'; text: string } | null>(null)
  const [sending, setSending] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaKey, setCaptchaKey] = useState(0)
  const openedAt = useRef(Date.now())
  /** Nombre de quien se acaba de inscribir: abre la bienvenida con la intro. */
  const [welcomeName, setWelcomeName] = useState<string | null>(null)
  const closeWelcome = useCallback(() => setWelcomeName(null), [])

  const set = (key: keyof ContactInput) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  async function submit(e: FormEvent) {
    e.preventDefault()
    const problem =
      checkSpam(honeypot, openedAt.current) ??
      validateContact(form) ??
      (consent ? null : 'Debes autorizar el tratamiento de tus datos para inscribirte.')
    if (problem) return setStatus({ kind: 'error', text: problem })
    if (!HAS_BACKEND) return setStatus({ kind: 'error', text: 'El formulario aún no está conectado.' })
    if (!IS_DEMO && !captchaToken) return setStatus({ kind: 'error', text: 'Completa la verificación antes de enviar.' })

    setSending(true)
    try {
      await sendContact(form, honeypot, captchaToken)
      setWelcomeName(form.name.trim())
      setForm(EMPTY)
      setConsent(false)
      setStatus({ kind: 'success', text: '¡Inscripción enviada! Te escribiremos a tu correo.' })
    } catch (err) {
      setStatus({ kind: 'error', text: errorMessage(err) })
    } finally {
      setSending(false)
      // El token ya se gastó: se pide uno nuevo.
      setCaptchaToken(null)
      setCaptchaKey((k) => k + 1)
    }
  }

  return (
    <div className="container-page py-12 sm:py-16">
      {welcomeName !== null && <WelcomeIntro name={welcomeName} onClose={closeWelcome} />}
      <div className="rise overflow-hidden rounded-3xl border border-line bg-panel shadow-2xl shadow-black/40 lg:grid lg:grid-cols-[1.4fr_1fr]">
        <WelcomePanel />

        <form onSubmit={submit} className="space-y-7 p-6 sm:p-10 lg:order-first" noValidate>
          <header>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-neon">// inscripción</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Inscríbete en <span className="text-neon">SIRSG 2.0</span>
            </h1>
            <p className="mt-2 text-sm text-muted">
              Estudiantes de todas las carreras y sedes, incluida la sede sur. También puedes usarlo para enviarnos dudas.
            </p>
          </header>

          <Group title="Datos personales">
            <Field id="name" label="Nombre">
              <input id="name" className="field-pill" placeholder="Tu nombre" value={form.name} onChange={set('name')} maxLength={100} autoComplete="given-name" />
            </Field>
            <Field id="last_name" label="Apellido">
              <input id="last_name" className="field-pill" placeholder="Tu apellido" value={form.last_name} onChange={set('last_name')} maxLength={100} autoComplete="family-name" />
            </Field>
            <Field id="document_type" label="Tipo de documento">
              <select
                id="document_type"
                className="field-pill"
                value={form.document_type}
                onChange={(e) => {
                  const type = e.target.value
                  setForm((f) => ({ ...f, document_type: type, document_number: cleanDocumentNumber(type, f.document_number) }))
                }}
              >
                <option value="" disabled>
                  Elige uno
                </option>
                {DOCUMENT_TYPES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="document_number" label="Número de documento">
              <div className="relative">
                <input
                  id="document_number"
                  className="field-pill pr-16 font-mono tracking-wider"
                  inputMode={form.document_type === 'PA' ? 'text' : 'numeric'}
                  placeholder={form.document_type === 'PA' ? 'Ej. AB1234567' : 'Ej. 1023456789'}
                  value={form.document_number}
                  onChange={(e) => setForm((f) => ({ ...f, document_number: cleanDocumentNumber(f.document_type, e.target.value) }))}
                  maxLength={form.document_type === 'PA' ? 12 : 10}
                  autoComplete="off"
                  aria-describedby="document_number_hint"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[11px] text-muted">
                  {form.document_number.length}/{form.document_type === 'PA' ? 12 : 10}
                </span>
              </div>
              <p id="document_number_hint" className="ml-4 mt-1 text-[11px] text-muted">
                {form.document_type === 'PA' ? 'Letras y números, sin espacios.' : 'Solo números, sin puntos ni espacios.'}
              </p>
            </Field>
            <Field id="age" label="Edad (años)">
              <input id="age" type="number" inputMode="numeric" className="field-pill" placeholder="18" min={MIN_AGE} max={MAX_AGE} value={form.age} onChange={set('age')} />
            </Field>
            <Field id="email" label="Correo">
              <input id="email" type="email" className="field-pill" placeholder="tu.correo@ejemplo.edu.co" value={form.email} onChange={set('email')} maxLength={150} autoComplete="email" />
            </Field>
          </Group>

          <Group title="Datos académicos">
            <Field id="career" label="Carrera" wide>
              <input id="career" list="careers" className="field-pill" placeholder="Ej. Ingeniería de sistemas" value={form.career} onChange={set('career')} maxLength={120} />
              <datalist id="careers">
                {CAREER_SUGGESTIONS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <Field id="semester" label="Semestre">
              <select id="semester" className="field-pill" value={form.semester} onChange={set('semester')}>
                <option value="" disabled>
                  Elige uno
                </option>
                {SEMESTERS.map((s) => (
                  <option key={s} value={s}>
                    {s}.º semestre
                  </option>
                ))}
              </select>
            </Field>
            <Field id="campus" label="Sede">
              <select id="campus" className="field-pill" value={form.campus} onChange={set('campus')}>
                <option value="" disabled>
                  Elige una
                </option>
                {CAMPUSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          </Group>

          <Group title="Tu mensaje">
            <Field id="subject" label="Asunto" wide>
              <input id="subject" className="field-pill" value={form.subject} onChange={set('subject')} maxLength={150} />
            </Field>
            <Field id="message" label="Mensaje" wide>
              <textarea
                id="message"
                rows={4}
                className="field-pill resize-y"
                placeholder="Cuéntanos qué te interesa o qué dudas tienes (mínimo 10 caracteres)."
                value={form.message}
                onChange={set('message')}
                maxLength={2000}
              />
            </Field>
          </Group>

          {/* Honeypot: invisible para personas, los bots lo llenan (RF-08). */}
          <div className="absolute -left-[9999px]" aria-hidden="true">
            <label htmlFor="website">No llenar</label>
            <input id="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
          </div>

          <label className="flex cursor-pointer items-start gap-3 text-sm text-muted">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[var(--color-neon)]" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>Autorizo el tratamiento de mis datos personales para gestionar mi inscripción en el semillero.</span>
          </label>

          {!IS_DEMO && <Turnstile key={captchaKey} onToken={setCaptchaToken} />}

          {status && <Alert kind={status.kind}>{status.text}</Alert>}

          <div className="flex flex-wrap items-center gap-4">
            <button className="btn btn-primary rounded-full px-8 py-2.5" disabled={sending}>
              {sending ? 'Enviando…' : 'Enviar inscripción'}
            </button>
            <p className="text-sm text-muted">
              ¿Ya eres parte?{' '}
              <Link to="/eventos" className="text-neon hover:underline">
                Mira la cartelera
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-neon-dim">{title}</legend>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  )
}

function Field({ id, label, wide = false, children }: { id: string; label: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <label className="mb-1.5 ml-4 block text-xs text-muted" htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  )
}

/** Panel decorativo con onda: a la derecha en escritorio, arriba en móvil. */
function WelcomePanel() {
  return (
    <aside className="relative overflow-hidden bg-[linear-gradient(160deg,#0f7a61_0%,#0e5a73_55%,#0b2a3f_100%)] px-8 pb-16 pt-10 text-center lg:flex lg:flex-col lg:items-center lg:justify-center lg:px-12 lg:py-16 lg:pl-20">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-30" />
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-neon/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-10 h-56 w-56 rounded-full bg-cyan/20 blur-3xl" />

      {/* Onda que separa el panel del formulario */}
      <svg className="absolute inset-y-0 left-0 hidden h-full w-16 lg:block" viewBox="0 0 64 400" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 0H38C66 70 12 130 32 200C52 270 10 330 40 400H0Z" fill="var(--color-panel)" />
      </svg>
      <svg className="absolute inset-x-0 bottom-0 h-10 w-full lg:hidden" viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 40V22C70 2 130 38 200 20C270 2 330 30 400 14V40Z" fill="var(--color-panel)" />
      </svg>

      <div className="relative">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white/10 ring-8 ring-white/5 backdrop-blur">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ink/80">
            <img src="/brand/sirsg-mark.png" alt="Logo SIRSG 2.0" className="h-11 w-11" />
          </div>
        </div>
        <p className="mt-6 text-sm text-white/70">Bienvenido a</p>
        <h2 className="font-mono text-2xl font-semibold text-white">
          SIRSG<span className="text-neon">_2.0</span>
        </h2>
        <p className="mx-auto mt-3 max-w-xs text-sm text-white/75">
          Aprende ciberseguridad haciendo: talleres, laboratorios, retos CTF y proyectos de investigación.
        </p>
        <ul className="mx-auto mt-6 hidden max-w-xs space-y-2 text-left text-sm text-white/80 lg:block">
          {['Sin experiencia previa', 'Todas las carreras y sedes', 'Reuniones presenciales y virtuales'].map((t) => (
            <li key={t} className="flex gap-2">
              <span className="font-mono text-neon">✓</span>
              {t}
            </li>
          ))}
        </ul>
        <div className="mt-8 flex justify-center gap-2" aria-hidden="true">
          <span className="h-2 w-6 rounded-full bg-white/80" />
          <span className="h-2 w-2 rounded-full bg-white/40" />
          <span className="h-2 w-2 rounded-full bg-white/40" />
        </div>
      </div>
    </aside>
  )
}
