interface Props {
  tag: string
  title: string
  subtitle?: string
}

export function PageHeader({ tag, title, subtitle }: Props) {
  return (
    <header className="rise mb-10">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-neon">// {tag}</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      {subtitle && <p className="mt-3 max-w-2xl text-muted">{subtitle}</p>}
    </header>
  )
}
