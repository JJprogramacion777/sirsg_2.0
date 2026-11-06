type Block = { kind: 'h2' | 'p'; text: string } | { kind: 'ul'; items: string[] }

/**
 * Formato mínimo para el contenido de las secciones:
 *   "## Título"  → subtítulo
 *   "- elemento" → lista
 *   línea en blanco → nuevo párrafo
 */
function parse(body: string): Block[] {
  const blocks: Block[] = []
  for (const chunk of body.replace(/\r\n/g, '\n').split(/\n\s*\n/)) {
    const lines = chunk.split('\n').filter((l) => l.trim())
    let para: string[] = []
    let list: string[] = []
    const flush = () => {
      if (para.length) blocks.push({ kind: 'p', text: para.join('\n') })
      if (list.length) blocks.push({ kind: 'ul', items: list })
      para = []
      list = []
    }
    for (const line of lines) {
      const t = line.trim()
      if (t.startsWith('## ')) {
        flush()
        blocks.push({ kind: 'h2', text: t.slice(3) })
      } else if (/^[-*•] /.test(t)) {
        if (para.length) flush()
        list.push(t.slice(2))
      } else {
        if (list.length) flush()
        para.push(t)
      }
    }
    flush()
  }
  return blocks
}

/** Siempre texto: React escapa el contenido, así se evita XSS (nada de dangerouslySetInnerHTML). */
export function RichText({ body }: { body: string }) {
  return (
    <div className="space-y-5 text-lg leading-relaxed text-text/85">
      {parse(body).map((b, i) =>
        b.kind === 'h2' ? (
          <h2 key={i} className="pt-4 text-2xl font-bold tracking-tight text-text">
            {b.text}
          </h2>
        ) : b.kind === 'ul' ? (
          <ul key={i} className="space-y-2">
            {b.items.map((item, j) => (
              <li key={j} className="flex gap-3">
                <span className="mt-1 font-mono text-sm text-neon">▸</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p key={i} className="whitespace-pre-line">
            {b.text}
          </p>
        ),
      )}
    </div>
  )
}
