import { type FormEvent, type KeyboardEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import {
  createFileSystem,
  currentStep,
  HINT_PENALTY,
  HOME,
  MAX_SCORE,
  type Mission,
  missionPoints,
  MISSIONS,
  type MissionResult,
  type PlayerContext,
  stepsDone,
} from '../../lib/practice/missions'
import { COMMANDS, complete, type Line, prettyPath, run, type ShellState } from '../../lib/practice/shell'

type TermLine = Line | { kind: 'prompt'; cwd: string; text: string } | { kind: 'coach'; text: string }

interface Progress {
  completed: boolean
  /** Pasos por los que ya pagó pista (volver a verla es gratis). */
  hintSteps: number[]
  wrong: number
}

const FLAG_RE = /FLAG\{[^}]+\}/g

const BOOT: TermLine[] = [
  { kind: 'info', text: '[*] Iniciando Kali Lab de SIRSG 2.0 (entorno simulado y seguro)…' },
  { kind: 'ok', text: '[+] Sistema listo. Escribe "mision" para ver tu objetivo o "help" para ver los comandos.' },
  { kind: 'coach', text: 'Soy tu asistente: te aviso cuando avances y te ayudo si algo falla. "pista" te dice el siguiente paso (−25 pts).' },
]

/** Distancia de edición, para sugerir comandos mal escritos. */
function distance(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return d[a.length][b.length]
}

/** Ayuda gratuita cuando un comando falla. */
function coachForErrors(events: string[], cwd: string): string | null {
  for (const e of events) {
    const [type, ...rest] = e.split(':')
    const arg = rest.join(':')
    if (type === 'unknown') {
      const all = [...COMMANDS, 'mision', 'pista', 'enviar']
      const guess = all.map((c) => [c, distance(arg, c)] as const).sort((x, y) => x[1] - y[1])[0]
      return guess && guess[1] <= 2 ? `¿Quisiste decir "${guess[0]}"?` : 'Ese comando no existe aquí. Escribe "help" para ver la lista.'
    }
    if (type === 'err') {
      const [cmd, target] = [rest[0], rest.slice(1).join(':')]
      if (cmd === 'pipe') return 'En este laboratorio la tubería | solo funciona con grep.'
      return `"${target}" no existe en ${prettyPath(cwd)}. Usa ls para ver qué hay aquí${cmd === 'cd' ? ' o cd ~ para volver a tu carpeta' : ''}.`
    }
    if (type === 'curl404') return 'Esa página no existe en el servidor. Revisa la URL: las rutas se escriben después de http://10.10.10.5/'
    if (type === 'nmap' && arg !== '10.10.10.5') return 'El único servidor que tienes autorizado auditar es 10.10.10.5.'
  }
  return null
}

interface Props {
  onFinish: (results: MissionResult[]) => void
}

/** El juego: terminal tipo Kali, marcador y panel de misiones con pistas según el avance. */
export function KaliLab({ onFinish }: Props) {
  const shell = useRef<ShellState>({ cwd: HOME, fs: createFileSystem() })
  const [lines, setLines] = useState<TermLine[]>(BOOT)
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [cursor, setCursor] = useState(-1)
  const [progress, setProgress] = useState<Record<string, Progress>>(() =>
    Object.fromEntries(MISSIONS.map((m) => [m.id, { completed: false, hintSteps: [], wrong: 0 }])),
  )
  const [ctx, setCtx] = useState<PlayerContext>({ events: new Set(), flagsSeen: new Set(), cwd: HOME })
  const [selected, setSelected] = useState(MISSIONS[0].id)
  const [flagInput, setFlagInput] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const screen = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const finished = useRef(false)

  const results: MissionResult[] = useMemo(
    () =>
      MISSIONS.map((m) => {
        const p = progress[m.id]
        return { id: m.id, completed: p.completed, hints: p.hintSteps.length, wrong: p.wrong, points: missionPoints(p.completed, p.hintSteps.length) }
      }),
    [progress],
  )
  const score = results.reduce((s, r) => s + r.points, 0)
  const done = results.filter((r) => r.completed).length
  const mission = MISSIONS.find((m) => m.id === selected)!
  const mp = progress[selected]
  const stepIdx = currentStep(mission, ctx, mp.completed)

  useEffect(() => {
    const start = Date.now()
    const id = window.setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (screen.current) screen.current.scrollTop = screen.current.scrollHeight
  }, [lines])

  // Al completar todas, cierra la partida.
  useEffect(() => {
    if (done === MISSIONS.length && !finished.current) {
      finished.current = true
      window.setTimeout(() => onFinish(results), 1400)
    }
  }, [done, results, onFinish])

  const print = (...ls: TermLine[]) => setLines((l) => [...l, ...ls].slice(-400))

  function describe(m: Mission): TermLine[] {
    const idx = currentStep(m, ctx, progress[m.id].completed)
    return [
      { kind: 'info', text: `[Misión ${MISSIONS.indexOf(m) + 1}/${MISSIONS.length}] ${m.title}` },
      { kind: 'out', text: m.story },
      { kind: 'ok', text: `Objetivo: ${m.objective}` },
      ...(idx < m.steps.length ? [{ kind: 'coach' as const, text: `Vas en el paso ${idx + 1}/${m.steps.length}: ${m.steps[idx].label}.` }] : []),
    ]
  }

  /** Pista del paso en el que va el jugador en la misión elegida. */
  function takeHint(id: string): TermLine {
    const m = MISSIONS.find((x) => x.id === id)!
    const p = progress[id]
    if (p.completed) return { kind: 'info', text: 'Esta misión ya está completada. Elige otra en el panel.' }
    const idx = currentStep(m, ctx, false)
    const step = m.steps[idx]
    if (p.hintSteps.includes(idx)) return { kind: 'info', text: `💡 (repetida, sin costo) ${step.hint}` }
    setProgress((pr) => ({ ...pr, [id]: { ...pr[id], hintSteps: [...pr[id].hintSteps, idx] } }))
    return { kind: 'info', text: `💡 Pista para "${step.label}" (−${HINT_PENALTY} pts): ${step.hint}` }
  }

  function submitFlag(raw: string): TermLine[] {
    const flag = raw.trim()
    if (!flag) return [{ kind: 'err', text: 'uso: enviar FLAG{...}' }]
    const target = MISSIONS.find((m) => m.flag === flag)
    if (!target) {
      setProgress((pr) => ({ ...pr, [selected]: { ...pr[selected], wrong: pr[selected].wrong + 1 } }))
      const close = [...ctx.flagsSeen].find((f) => distance(f.toLowerCase(), flag.toLowerCase()) <= 3)
      return [
        { kind: 'err', text: '✘ Bandera incorrecta.' },
        {
          kind: 'coach',
          text: close
            ? 'Casi: compárala letra por letra con la que salió en pantalla (mayúsculas, guiones bajos y llaves).'
            : 'Las banderas aparecen en la salida de algún comando. Aún no has visto esa en pantalla.',
        },
      ]
    }
    if (progress[target.id].completed) return [{ kind: 'info', text: 'Esa bandera ya la habías enviado.' }]
    const pts = missionPoints(true, progress[target.id].hintSteps.length)
    const next = { ...progress, [target.id]: { ...progress[target.id], completed: true } }
    setProgress(next)
    // La siguiente pendiente después de esta; si no hay, la primera pendiente.
    const from = MISSIONS.indexOf(target)
    const upcoming = [...MISSIONS.slice(from + 1), ...MISSIONS.slice(0, from)].find((m) => !next[m.id].completed)
    if (upcoming && target.id === selected) setSelected(upcoming.id)
    return [
      { kind: 'ok', text: `✔ Misión "${target.title}" completada (+${pts} pts)` },
      ...(upcoming && target.id === selected ? [{ kind: 'coach' as const, text: `Siguiente misión: ${upcoming.title}. Escribe "mision" para ver el objetivo.` }] : []),
    ]
  }

  function execute(raw: string) {
    const cmd = raw.trim()
    const promptLine: TermLine = { kind: 'prompt', cwd: shell.current.cwd, text: cmd }
    if (!cmd) return print(promptLine)
    setHistory((h) => [...h, cmd].slice(-100))
    setCursor(-1)

    const [word, ...rest] = cmd.split(/\s+/)
    if (word === 'mision' || word === 'misión') return print(promptLine, ...describe(mission))
    if (word === 'pista') return print(promptLine, takeHint(selected))
    if (word === 'enviar' || word === 'submit') return print(promptLine, ...submitFlag(rest.join(' ')))
    if (word === 'terminar') {
      print(promptLine, { kind: 'info', text: 'Cerrando la partida…' })
      finished.current = true
      return void window.setTimeout(() => onFinish(results), 600)
    }

    const result = run(shell.current, cmd, history)
    if (result.clear) return setLines([])

    // Nuevo contexto del jugador: eventos, banderas vistas y carpeta actual.
    const seen = new Set(ctx.flagsSeen)
    const newFlags: string[] = []
    for (const l of result.lines)
      for (const f of l.text.match(FLAG_RE) ?? [])
        if (!seen.has(f) && MISSIONS.some((m) => m.flag === f)) {
          seen.add(f)
          newFlags.push(f)
        }
    const nextCtx: PlayerContext = { events: new Set([...ctx.events, ...result.events]), flagsSeen: seen, cwd: shell.current.cwd }
    setCtx(nextCtx)

    const extra: TermLine[] = []
    for (const f of newFlags) {
      const owner = MISSIONS.find((m) => m.flag === f)!
      if (!progress[owner.id].completed) extra.push({ kind: 'ok', text: `🚩 ¡Encontraste una bandera! Envíala con: enviar ${f}` })
    }

    // Avances en tiempo real: qué misión progresó con este comando.
    const advanced = MISSIONS.filter((m) => !progress[m.id].completed && stepsDone(m, nextCtx) > stepsDone(m, ctx))
    const focus = advanced.find((m) => m.id === selected) ?? advanced[0]
    if (focus) {
      if (focus.id !== selected) {
        setSelected(focus.id)
        extra.push({ kind: 'coach', text: `🎯 Veo que vas por la misión "${focus.title}". Cambié el panel a esa misión.` })
      }
      const idx = currentStep(focus, nextCtx, false)
      const justDone = focus.steps.filter((s) => s.done(nextCtx) && !s.done(ctx)).map((s) => s.label)
      for (const label of justDone) extra.push({ kind: 'coach', text: `✓ ${label}.` })
      if (!newFlags.length) extra.push({ kind: 'coach', text: `Siguiente: ${focus.steps[idx].label.toLowerCase()}.` })
    } else {
      const help = coachForErrors(result.events, shell.current.cwd)
      if (help) extra.push({ kind: 'coach', text: help })
    }

    print(promptLine, ...result.lines, ...extra)
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    execute(input)
    setInput('')
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Tab') {
      e.preventDefault()
      setInput((v) => complete(shell.current, v))
    } else if (e.key === 'ArrowUp' && history.length) {
      e.preventDefault()
      const next = cursor < 0 ? history.length - 1 : Math.max(0, cursor - 1)
      setCursor(next)
      setInput(history[next])
    } else if (e.key === 'ArrowDown' && cursor >= 0) {
      e.preventDefault()
      const next = cursor + 1
      setCursor(next >= history.length ? -1 : next)
      setInput(next >= history.length ? '' : history[next])
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault()
      setLines([])
    }
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')
  const paidHere = mp.hintSteps.includes(stepIdx)

  return (
    <div className="space-y-4">
      {/* Marcador */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Hud label="Puntaje" value={`${score}`} sub={`de ${MAX_SCORE}`} />
        <Hud label="Misiones" value={`${done}/${MISSIONS.length}`} sub="completadas" />
        <Hud label="Tiempo" value={`${mm}:${ss}`} sub="min:seg" />
        <div className="card flex items-center justify-center p-3">
          <button className="btn btn-ghost w-full rounded-full" onClick={() => execute('terminar')}>
            Terminar partida
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        {/* Terminal */}
        <div className="overflow-hidden rounded-xl border border-[#2a3a4f] bg-[#0b0f14] shadow-2xl shadow-black/50" onClick={() => inputRef.current?.focus({ preventScroll: true })}>
          <div className="flex items-center gap-2 border-b border-[#2a3a4f] bg-[#161b22] px-4 py-2">
            <span className="h-3 w-3 rounded-full bg-danger/70" />
            <span className="h-3 w-3 rounded-full bg-warn/70" />
            <span className="h-3 w-3 rounded-full bg-neon/70" />
            <span className="ml-2 font-mono text-xs text-muted">kali@sirsg: {prettyPath(shell.current.cwd)}</span>
          </div>
          <div ref={screen} className="h-[460px] overflow-y-auto p-4 font-mono text-[13px] leading-relaxed" aria-live="polite">
            {lines.map((l, i) =>
              l.kind === 'prompt' ? (
                <Prompt key={i} cwd={l.cwd} text={l.text} />
              ) : l.kind === 'coach' ? (
                <div key={i} className="my-1 border-l-2 border-warn/60 pl-2 text-warn/90">
                  🤖 {l.text}
                </div>
              ) : (
                <div key={i} className={`whitespace-pre-wrap break-words ${TONE[l.kind]}`}>
                  {l.text || ' '}
                </div>
              ),
            )}
            <form onSubmit={onSubmit}>
              <Prompt cwd={shell.current.cwd}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKey}
                  maxLength={200}
                  spellCheck={false}
                  autoComplete="off"
                  autoCapitalize="off"
                  aria-label="Comando"
                  className="min-w-0 flex-1 bg-transparent text-text caret-neon outline-none"
                />
              </Prompt>
            </form>
          </div>
        </div>

        {/* Misiones */}
        <aside className="space-y-4">
          <div className="card p-4">
            <p className="label">Misiones</p>
            <ol className="mt-2 space-y-1">
              {MISSIONS.map((m, i) => {
                const p = progress[m.id]
                const partial = !p.completed && stepsDone(m, ctx) > 0
                return (
                  <li key={m.id}>
                    <button
                      onClick={() => setSelected(m.id)}
                      className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition ${selected === m.id ? 'bg-panel-2' : 'hover:bg-panel-2/60'}`}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-xs ${
                          p.completed ? 'bg-neon text-ink' : selected === m.id ? 'border border-neon text-neon' : 'border border-line text-muted'
                        }`}
                      >
                        {p.completed ? '✓' : i + 1}
                      </span>
                      <span className={`flex-1 ${p.completed ? 'text-muted line-through' : ''}`}>{m.title}</span>
                      {p.completed && <span className="font-mono text-xs text-neon">+{missionPoints(true, p.hintSteps.length)}</span>}
                      {partial && <span className="font-mono text-[11px] text-warn">en curso</span>}
                    </button>
                  </li>
                )
              })}
            </ol>
          </div>

          <div key={mission.id} className="card rise p-4">
            <p className="font-mono text-xs text-neon">misión {MISSIONS.indexOf(mission) + 1}</p>
            <h3 className="mt-1 font-semibold">{mission.title}</h3>
            <p className="mt-1 text-sm text-muted">{mission.story}</p>
            <p className="mt-2 text-sm">{mission.objective}</p>

            {/* Progreso en tiempo real */}
            <p className="label mt-4">Tu progreso</p>
            <ol className="mt-2 space-y-1.5">
              {mission.steps.map((s, i) => {
                const isDone = mp.completed || (i < mission.steps.length - 1 && s.done(ctx))
                const isNow = !mp.completed && i === stepIdx
                return (
                  <li key={s.label} className={`flex items-start gap-2 text-sm transition-colors ${isDone ? 'text-neon' : isNow ? 'text-text' : 'text-muted'}`}>
                    <span className="mt-0.5 font-mono text-xs">{isDone ? '✓' : isNow ? '▶' : '○'}</span>
                    <span className={isNow ? 'font-medium' : ''}>{s.label}</span>
                  </li>
                )
              })}
            </ol>

            {mp.completed ? (
              <p className="mt-4 rounded-lg border border-neon/40 bg-neon/10 px-3 py-2 text-sm text-neon">✔ Completada · +{missionPoints(true, mp.hintSteps.length)} pts</p>
            ) : (
              <>
                <div className="mt-4 space-y-2">
                  {mp.hintSteps.map((idx) => (
                    <p key={idx} className={`rounded-lg border px-3 py-2 text-xs ${idx === stepIdx ? 'border-warn/40 bg-warn/10 text-warn' : 'border-line text-muted line-through'}`}>
                      💡 {mission.steps[idx].hint}
                    </p>
                  ))}
                  {!paidHere && (
                    <button className="font-mono text-xs text-warn hover:underline" onClick={() => print(takeHint(mission.id))}>
                      Pista para el paso {stepIdx + 1} (−{HINT_PENALTY} pts)
                    </button>
                  )}
                </div>
                <form
                  className="mt-4 flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    print(...submitFlag(flagInput))
                    setFlagInput('')
                  }}
                >
                  <input
                    className="field min-w-0 flex-1 rounded-full font-mono text-xs"
                    placeholder="FLAG{...}"
                    value={flagInput}
                    onChange={(e) => setFlagInput(e.target.value)}
                    maxLength={60}
                    aria-label="Bandera"
                  />
                  <button className="btn btn-primary rounded-full !px-4">Enviar</button>
                </form>
              </>
            )}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {mission.skills.map((s) => (
                <span key={s} className="rounded border border-line bg-panel-2 px-1.5 py-0.5 font-mono text-[11px] text-muted">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

const TONE: Record<Line['kind'], string> = {
  out: 'text-text/85',
  err: 'text-danger',
  info: 'text-cyan',
  ok: 'text-neon',
  dir: 'text-[#5c9cff]',
}

function Prompt({ cwd, text, children }: { cwd: string; text?: string; children?: ReactNode }) {
  return (
    <div className="mt-1">
      <div className="text-neon">
        ┌──(<span className="font-semibold text-[#5c9cff]">kali㉿sirsg</span>)-[<span className="text-text">{prettyPath(cwd)}</span>]
      </div>
      <div className="flex items-center gap-2">
        <span className="text-neon">└─$</span>
        {children ?? <span className="text-text">{text}</span>}
      </div>
    </div>
  )
}

function Hud({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="card p-3">
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted">{label}</p>
      <p className="font-mono text-2xl font-semibold text-neon">{value}</p>
      <p className="text-[11px] text-muted">{sub}</p>
    </div>
  )
}
