import { useCallback, useEffect, useState } from 'react'
import { HAS_BACKEND } from '../lib/mode'

interface AsyncState<T> {
  data: T | undefined
  error: string | null
  loading: boolean
  reload: () => void
}

/** Ejecuta una consulta y expone carga, error y recarga. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [data, setData] = useState<T>()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps)

  useEffect(() => {
    let cancelled = false
    if (!HAS_BACKEND) {
      setLoading(false)
      setError('not_configured')
      return
    }
    setLoading(true)
    setError(null)
    run()
      .then((result) => !cancelled && setData(result))
      .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [run, tick])

  return { data, error, loading, reload: () => setTick((t) => t + 1) }
}

export function errorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}
