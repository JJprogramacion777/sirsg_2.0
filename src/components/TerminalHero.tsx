import { useEffect, useState } from 'react'

const LINES = [
  '$ whoami',
  'sirsg_2.0 — semillero de investigación en ciberseguridad',
  '$ cat mision.txt',
  'Aprender, investigar y compartir seguridad informática.',
  '$ ./unirse --ahora',
]

/** Terminal decorativa que escribe sus líneas una por una. */
export function TerminalHero() {
  const [shown, setShown] = useState<string[]>([])
  const [current, setCurrent] = useState('')

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(LINES)
      return
    }
    let line = 0
    let char = 0
    const id = window.setInterval(() => {
      if (line >= LINES.length) return window.clearInterval(id)
      const text = LINES[line]
      char++
      setCurrent(text.slice(0, char))
      if (char >= text.length) {
        setShown((s) => [...s, text])
        setCurrent('')
        line++
        char = 0
      }
    }, 35)
    return () => window.clearInterval(id)
  }, [])

  const done = shown.length === LINES.length

  return (
    <div className="card overflow-hidden shadow-2xl shadow-neon/5">
      <div className="flex items-center gap-1.5 border-b border-line bg-panel-2 px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-danger/70" />
        <span className="h-3 w-3 rounded-full bg-warn/70" />
        <span className="h-3 w-3 rounded-full bg-neon/70" />
        <span className="ml-3 font-mono text-xs text-muted">sirsg@semillero:~</span>
      </div>
      <pre className="min-h-56 whitespace-pre-wrap p-5 font-mono text-sm leading-relaxed">
        {shown.map((l, i) => (
          <div key={i} className={l.startsWith('$') ? 'text-neon' : 'text-text/80'}>
            {l}
          </div>
        ))}
        {!done && <div className={`caret ${current.startsWith('$') ? 'text-neon' : 'text-text/80'}`}>{current}</div>}
        {done && <div className="caret text-neon">$ </div>}
      </pre>
    </div>
  )
}
