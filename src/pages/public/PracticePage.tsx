import { type FormEvent, useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { KaliLab } from '../../components/practice/KaliLab'
import { Alert } from '../../components/ui/Alert'
import { errorMessage } from '../../hooks/useAsync'
import { HAS_BACKEND } from '../../lib/mode'
import { gradeFor, HINT_PENALTY, MAX_SCORE, MISSIONS, type MissionResult, recommendationFor } from '../../lib/practice/missions'
import { isValidEmail } from '../../lib/validators'
import { finishPractice, type PracticeSession, startPractice } from '../../services/practice'

type Phase = 'intro' | 'playing' | 'done'

/** Práctica: Kali Lab, un juego de retos en una terminal Linux simulada. */
export function PracticePage() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [session, setSession] = useState<PracticeSession | null>(null)
  const [results, setResults] = useState<MissionResult[]>([])
  const [startedAt, setStartedAt] = useState(0)
  const [game, setGame] = useState(0)

  async function start(e: FormEvent) {
    e.preventDefault()
    const alias = name.trim()
    if (alias.length < 2 || alias.length > 60) return setError('Escribe un nombre o alias de 2 a 60 caracteres.')
    if (email.trim() && !isValidEmail(email)) return setError('El correo no es válido (o déjalo vacío).')
    setError(null)
    setBusy(true)
    try {
      // Sin backend se juega igual, solo que el resultado no se guarda.
      setSession(HAS_BACKEND ? await startPractice(alias, email.trim() || null) : null)
      setStartedAt(Date.now())
      setGame((g) => g + 1)
      setPhase('playing')
      window.scrollTo({ top: 0 })
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const finish = useCallback(
    (r: MissionResult[]) => {
      setResults(r)
      setPhase('done')
      window.scrollTo({ top: 0 })
      if (!session) return
      const score = r.reduce((s, x) => s + x.points, 0)
      finishPractice(session, {
        score,
        missions: r.filter((x) => x.completed).length,
        hints: r.reduce((s, x) => s + x.hints, 0),
        grade: gradeFor(score).letter,
        recommendation: recommendationFor(r),
        details: r,
      }).catch(() => setError('No se pudo guardar tu resultado, pero puedes verlo aquí.'))
    },
    [session],
  )

  return (
    <div className="container-page py-12">
      {phase === 'intro' && (
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div className="rise">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-neon">// práctica</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
              Kali <span className="text-neon">Lab</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted">
              Resuelve {MISSIONS.length} retos en una terminal de Kali Linux simulada. Encuentra las banderas <code className="font-mono text-neon">FLAG{'{…}'}</code> usando
              comandos reales de Linux. Todo pasa dentro de tu navegador: es 100 % seguro.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ['🎯', `${MISSIONS.length} misiones`, 'Una por cada línea de investigación.'],
                ['💡', 'Pistas', `Si te atascas, pide una (−${HINT_PENALTY} pts).`],
                ['🏆', 'Nota y consejo', 'Al final recibes tu nota y una recomendación.'],
              ].map(([icon, title, text]) => (
                <li key={title} className="card p-4">
                  <span className="text-xl">{icon}</span>
                  <p className="mt-2 text-sm font-semibold">{title}</p>
                  <p className="text-xs text-muted">{text}</p>
                </li>
              ))}
            </ul>
          </div>

          <form onSubmit={start} className="card rise space-y-4 p-6 sm:p-8 [animation-delay:120ms]" noValidate>
            <div className="rounded-lg border border-[#2a3a4f] bg-[#0b0f14] p-4 font-mono text-xs leading-relaxed">
              <p className="text-neon">┌──(<span className="text-[#5c9cff]">kali㉿sirsg</span>)-[~]</p>
              <p className="text-neon">
                └─$ <span className="text-text">./kali-lab --iniciar</span>
              </p>
              <p className="text-cyan">[*] Identifícate para guardar tu progreso…</p>
            </div>
            <div>
              <label className="mb-1.5 ml-4 block text-xs text-muted" htmlFor="alias">
                Nombre o alias
              </label>
              <input id="alias" className="field-pill" placeholder="Ej. neo_ecci" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoComplete="nickname" />
            </div>
            <div>
              <label className="mb-1.5 ml-4 block text-xs text-muted" htmlFor="practice-email">
                Correo (opcional)
              </label>
              <input id="practice-email" type="email" className="field-pill" placeholder="Para relacionarlo con tu inscripción" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={150} autoComplete="email" />
            </div>
            <p className="text-xs text-muted">Guardamos tu alias, correo (si lo pones) y resultado para que el semillero vea tu progreso.</p>
            {error && <Alert>{error}</Alert>}
            <button className="btn btn-primary w-full rounded-full py-3" disabled={busy}>
              {busy ? 'Preparando el laboratorio…' : 'Empezar el reto →'}
            </button>
          </form>
        </div>
      )}

      {phase === 'playing' && (
        <div className="rise">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-neon">// kali lab</p>
              <h1 className="mt-1 text-2xl font-bold">Hola, {name.trim()}. ¡A cazar banderas!</h1>
            </div>
            <p className="font-mono text-xs text-muted">Tip: Tab autocompleta · ↑ repite comandos · "help" lista todo</p>
          </div>
          <KaliLab key={game} onFinish={finish} />
        </div>
      )}

      {phase === 'done' && <Results name={name.trim()} results={results} seconds={Math.round((Date.now() - startedAt) / 1000)} error={error} onReplay={() => setPhase('intro')} />}
    </div>
  )
}

function Results({ name, results, seconds, error, onReplay }: { name: string; results: MissionResult[]; seconds: number; error: string | null; onReplay: () => void }) {
  const score = results.reduce((s, r) => s + r.points, 0)
  const grade = gradeFor(score)
  const done = results.filter((r) => r.completed).length
  const hints = results.reduce((s, r) => s + r.hints, 0)

  return (
    <div className="rise mx-auto max-w-3xl">
      <div className="card relative overflow-hidden p-8 text-center">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative">
          <p className="font-mono text-xs text-neon">$ ./kali-lab --resultado</p>
          <div className="mx-auto mt-4 flex h-28 w-28 items-center justify-center rounded-full border-4 border-neon/60 bg-neon/10 font-mono text-6xl font-bold text-neon shadow-[0_0_60px_rgba(34,211,166,0.35)]">
            {grade.letter}
          </div>
          <h1 className="mt-4 text-3xl font-bold">
            ¡{grade.label}, {name}!
          </h1>
          <p className="mt-1 text-muted">
            {score} de {MAX_SCORE} puntos
          </p>
          <div className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-3">
            <Stat value={`${done}/${MISSIONS.length}`} label="misiones" />
            <Stat value={hints} label="pistas" />
            <Stat value={`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`} label="tiempo" />
          </div>
          <p className="mx-auto mt-6 max-w-lg rounded-xl border border-cyan/30 bg-cyan/10 px-4 py-3 text-sm text-cyan">🧭 {recommendationFor(results)}</p>
          {error && (
            <div className="mt-4">
              <Alert kind="warn">{error}</Alert>
            </div>
          )}
        </div>
      </div>

      <div className="card mt-4 divide-y divide-line">
        {MISSIONS.map((m, i) => {
          const r = results.find((x) => x.id === m.id)
          return (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3 text-sm">
              <span className={`flex h-6 w-6 items-center justify-center rounded-md font-mono text-xs ${r?.completed ? 'bg-neon text-ink' : 'border border-line text-muted'}`}>
                {r?.completed ? '✓' : i + 1}
              </span>
              <span className="flex-1">{m.title}</span>
              {!!r?.hints && <span className="font-mono text-xs text-warn">{r.hints} pista(s)</span>}
              <span className="w-16 text-right font-mono text-neon">{r?.points ?? 0} pts</span>
            </div>
          )
        })}
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button className="btn btn-primary rounded-full" onClick={onReplay}>
          Jugar otra vez
        </button>
        <Link to="/seccion/lineas-investigacion" className="btn btn-ghost rounded-full">
          Ver líneas de investigación
        </Link>
        <Link to="/contacto" className="btn btn-ghost rounded-full">
          Inscribirme
        </Link>
      </div>
    </div>
  )
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-lg border border-line bg-panel-2 p-3">
      <p className="font-mono text-xl font-semibold text-neon">{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  )
}
