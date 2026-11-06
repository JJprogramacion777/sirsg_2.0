import type { ReactNode } from 'react'

interface Props {
  kind?: 'error' | 'success' | 'warn'
  children: ReactNode
}

const STYLES = {
  error: 'border-danger/40 bg-danger/10 text-danger',
  success: 'border-neon/40 bg-neon/10 text-neon',
  warn: 'border-warn/40 bg-warn/10 text-warn',
}

export function Alert({ kind = 'error', children }: Props) {
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-3 py-2 text-sm ${STYLES[kind]}`}>
      {children}
    </div>
  )
}
