'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  isAdmin: boolean
  isLoading: boolean
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isAdmin: false,
    isLoading: true,
  })

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null
      const isAdmin = user?.user_metadata?.role === 'admin' || user?.app_metadata?.role === 'admin'
      setState({ user, session, isAdmin, isLoading: false })
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null
      const isAdmin = user?.user_metadata?.role === 'admin' || user?.app_metadata?.role === 'admin'
      setState({ user, session, isAdmin, isLoading: false })
    })

    return () => subscription.unsubscribe()
  }, [])

  return state
}
