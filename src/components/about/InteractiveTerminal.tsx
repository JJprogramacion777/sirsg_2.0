import { type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TERMINAL_COMMANDS } from '../../lib/about'

type Line = { kind: 'in' | 'out' | 'err'; text: string }

const DESTINATIONS: Record<string, string> = {
  contacto: '/contacto',
  lineas: '/seccion/lineas-investigacion',
  eventos: '/eventos',
  documentos: '/documentos',
  proyectos: '/seccion/proyectos',
}

const QUICK = ['whoami', 'mision', 'valores', 'requisitos', 'unirse']

const WELCOME: Line[] = [
  { kind: 'out', text: 'Bienvenido a la terminal de SIRSG 2.0.' },
  { kind: 'out', text: 'Escribe "help" o toca un comando de abajo.' },
]

/** Terminal donde el visitante escribe comandos para conocer el semillero. Todo es texto: sin HTML. */
export function InteractiveTerminal() {
  const [lines, setLines] = useState<Line[]>(WELCOME)
  const [value, setValue] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [cursor, setCursor] = useState(-1)
  const screen = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  // Desplaza solo la pantalla de la terminal, no la página.
  useEffect(() => {
    if (screen.current) screen.current.scrollTop = screen.current.scrollHeight
  }, [lines])

  function run(raw: string) {
    const cmd = raw.trim().toLowerCase().slice(0, 60)
    if (!cmd) return
    setHistory((h) => [...h, cmd])
    setCursor(-1)

    if (cmd === 'clear') return setLines([])
    const echo: Line = { kind: 'in', text: cmd }

    if (cmd === 'help') {
      const out = Object.entries(TERMINAL_COMMANDS).map(([k, v]) => `${k.padEnd(11)} ${v.help}`)
      return setLines((l) => [...l, echo, ...[...out, 'ir <destino> abre contacto, lineas, eventos, documentos o proyectos', 'clear       limpia la pantalla'].map((text) => ({ kind: 'out' as const, text }))])
    }

    if (cmd.startsWith('ir ') || cmd.startsWith('cd ')) {
      const dest = DESTINATIONS[cmd.slice(3).trim()]
      if (dest) {
        setLines((l) => [...l, echo, { kind: 'out', text: `abriendo ${dest}…` }])
        window.setTimeout(() => navigate(dest), 400)
        return
      }
      return setLines((l) => [...l, echo, { kind: 'err', text: `destino desconocido. Opciones: ${Object.keys(DESTINATIONS).join(', ')}` }])
    }

    const found = TERMINAL_COMMANDS[cmd]
    if (found) return setLines((l) => [...l, echo, ...found.output.map((text) => ({ kind: 'out' as const, text }))])
    if (cmd === 'sudo' || cmd.startsWith('sudo ')) return setLines((l) => [...l, echo, { kind: 'err', text: 'buen intento 😉 aquí todo se hace con autorización.' }])
    setLines((l) => [...l, echo, { kind: 'err', text: `comando no encontrado: ${cmd}. Escribe "help".` }])
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    run(value)
    setValue('')
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (!history.length) return
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const next = cursor < 0 ? history.length - 1 : Math.max(0, cursor - 1)
      setCursor(next)
      setValue(history[next])
    } else if (e.key === 'ArrowDown' && cursor >= 0) {
      e.preventDefault()
      const next = cursor + 1
      setCursor(next >= history.length ? -1 : next)
      setValue(next >= history.length ? '' : history[next])
    }
  }

  return (
    <div className="card overflow-hidden shadow-2xl shadow-neon/5" onClick={() => input.current?.focus({ preventScroll: true })}>
      <div className="flex items-center gap-1.5 border-b border-line bg-panel-2 px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-danger/70" />
        <span className="h-3 w-3 rounded-full bg-warn/70" />
        <span className="h-3 w-3 rounded-full bg-neon/70" />
        <span className="ml-3 font-mono text-xs text-muted">visitante@sirsg:~</span>
      </div>

      <div ref={screen} className="h-64 overflow-y-auto p-4 font-mono text-sm leading-relaxed" aria-live="polite">
        {lines.map((l, i) => (
          <div key={i} className={`whitespace-pre-wrap ${l.kind === 'in' ? 'text-neon' : l.kind === 'err' ? 'text-danger' : 'text-text/80'}`}>
            {l.kind === 'in' ? `$ ${l.text}` : l.text}
          </div>
        ))}
        <form onSubmit={submit} className="flex items-center gap-2 text-neon">
          <span>$</span>
          <input
            ref={input}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKey}
            maxLength={60}
            spellCheck={false}
            autoComplete="off"
            aria-label="Escribe un comando"
            className="min-w-0 flex-1 bg-transparent text-text caret-neon outline-none"
          />
        </form>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-line bg-panel-2/50 p-3">
        {QUICK.map((c) => (
          <button
            key={c}
            onClick={(e) => {
              e.stopPropagation()
              run(c)
            }}
            className="rounded-md border border-line px-2.5 py-1 font-mono text-xs text-muted transition hover:border-neon/50 hover:text-neon"
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  )
}
