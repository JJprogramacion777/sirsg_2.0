import { useState } from 'react'
import { QUIZ, type ResearchLine } from '../../lib/research'

interface Props {
  lines: ResearchLine[]
  /** Muestra la línea recomendada en el explorador. */
  onPick: (id: string) => void
}

/** Mini test de 3 preguntas que recomienda una línea de investigación. */
export function LineQuiz({ lines, onPick }: Props) {
  const [answers, setAnswers] = useState<number[]>([])
  const step = answers.length
  const done = step === QUIZ.length

  const scores = new Map<string, number>()
  answers.forEach((opt, q) => QUIZ[q].options[opt].lines.forEach((id) => scores.set(id, (scores.get(id) ?? 0) + 1)))
  const best = lines.reduce((a, b) => ((scores.get(b.id) ?? 0) > (scores.get(a.id) ?? 0) ? b : a), lines[0])

  return (
    <div className="card overflow-hidden">
      <div className="h-1 bg-panel-2">
        <div className="h-full bg-neon transition-all duration-500" style={{ width: `${(step / QUIZ.length) * 100}%` }} />
      </div>

      <div className="p-6 sm:p-8">
        {!done ? (
          <div key={step} className="rise">
            <p className="font-mono text-xs text-neon">
              pregunta {step + 1} / {QUIZ.length}
            </p>
            <h3 className="mt-2 text-xl font-semibold">{QUIZ[step].question}</h3>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {QUIZ[step].options.map((o, i) => (
                <button
                  key={o.label}
                  onClick={() => setAnswers([...answers, i])}
                  className="group flex items-center gap-3 rounded-xl border border-line bg-panel-2 p-4 text-left text-sm transition hover:-translate-y-0.5 hover:border-neon/60"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-line font-mono text-xs text-muted group-hover:border-neon group-hover:text-neon">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {o.label}
                </button>
              ))}
            </div>
            {step > 0 && (
              <button className="mt-4 font-mono text-xs text-muted hover:text-text" onClick={() => setAnswers(answers.slice(0, -1))}>
                ← volver
              </button>
            )}
          </div>
        ) : (
          <div className="rise flex flex-wrap items-center gap-6">
            <span
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl font-mono text-2xl font-semibold text-white"
              style={{ background: `linear-gradient(150deg, ${best.from}, ${best.to})`, boxShadow: `0 0 40px ${best.from}66` }}
            >
              {best.glyph}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-xs text-neon">$ ./recomendar --resultado</p>
              <h3 className="mt-1 text-xl font-semibold">Tu línea ideal: {best.title}</h3>
              <p className="mt-1 text-sm text-muted">{best.text}</p>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-primary rounded-full" onClick={() => onPick(best.id)}>
                Ver esta línea
              </button>
              <button className="btn btn-ghost rounded-full" onClick={() => setAnswers([])}>
                Repetir
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
