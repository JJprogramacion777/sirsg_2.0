import { useEffect, useState } from 'react'
import { getDemoSession, onDemoSession } from '@demo'
import { IS_DEMO } from '../lib/mode'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

export interface AdminSession {
  email: string
}

/** undefined mientras se comprueba; null si no hay sesión. */
export function useSession() {
  const [session, setSession] = useState<AdminSession | null | undefined>(() =>
    IS_DEMO ? getDemoSession() : isSupabaseConfigured ? undefined : null,
  )

  useEffect(() => {
    if (IS_DEMO) {
      const off = onDemoSession(() => setSession(getDemoSession()))
      return () => {
        off()
      }
    }
    if (!isSupabaseConfigured) return
    const toAdmin = (s: { user: { email?: string } } | null) => (s ? { email: s.user.email ?? '' } : null)
    supabase.auth.getSession().then(({ data }) => setSession(toAdmin(data.session)))
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(toAdmin(s)))
    return () => data.subscription.unsubscribe()
  }, [])

  return session
}
