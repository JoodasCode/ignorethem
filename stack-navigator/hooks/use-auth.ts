import { useState, useEffect } from 'react'
import { supabase, type User } from '@/lib/supabase'
import { UserService } from '@/lib/user-service'
import type { AuthError, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: AuthError | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setState(prev => ({ ...prev, error, loading: false }))
        return
      }

      if (session?.user) {
        // Get or create user profile
        UserService.upsertUserProfile(session.user).then(user => {
          setState({
            user,
            session,
            loading: false,
            error: null
          })
        })
      } else {
        setState({
          user: null,
          session: null,
          loading: false,
          error: null
        })
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const user = await UserService.upsertUserProfile(session.user)
          setState({
            user,
            session,
            loading: false,
            error: null
          })
        } else if (event === 'SIGNED_OUT') {
          setState({
            user: null,
            session: null,
            loading: false,
            error: null
          })
        } else if (event === 'TOKEN_REFRESHED' && session) {
          setState(prev => ({
            ...prev,
            session,
            error: null
          }))
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, name?: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0]
        }
      }
    })

    if (error) {
      setState(prev => ({ ...prev, error, loading: false }))
      return { data: null, error }
    }

    return { data, error: null }
  }

  const signIn = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      setState(prev => ({ ...prev, error, loading: false }))
      return { data: null, error }
    }

    return { data, error: null }
  }

  const signOut = async () => {
    setState(prev => ({ ...prev, loading: true }))
    
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      setState(prev => ({ ...prev, error, loading: false }))
    }
    
    return { error }
  }

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })

    return { data, error }
  }

  const signInWithMagicLink = async (email: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })

    return { data, error }
  }

  const signInWithGoogle = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      setState(prev => ({ ...prev, error, loading: false }))
    }

    return { data, error }
  }

  const updatePassword = async (password: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password
    })

    return { data, error }
  }

  const updateProfile = async (updates: Partial<User>) => {
    if (!state.user) return { data: null, error: new Error('No user logged in') }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', state.user.id)
      .select()
      .single()

    if (!error && data) {
      setState(prev => ({ ...prev, user: data }))
    }

    return { data, error }
  }

  return {
    ...state,
    signUp,
    signIn,
    signOut,
    resetPassword,
    signInWithMagicLink,
    signInWithGoogle,
    updatePassword,
    updateProfile,
    isAuthenticated: !!state.user
  }
}