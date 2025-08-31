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
        console.error('Auth session error:', error)
        // If it's a refresh token error, clear the session and continue
        if (error.message.includes('refresh_token_not_found') || error.message.includes('Invalid Refresh Token')) {
          supabase.auth.signOut().then(() => {
            setState({
              user: null,
              session: null,
              loading: false,
              error: null
            })
          })
        } else {
          setState(prev => ({ ...prev, error, loading: false }))
        }
        return
      }

      if (session?.user) {
        // For now, just use the auth user directly to avoid database dependency issues
        const user: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          avatar_url: session.user.user_metadata?.avatar_url,
          created_at: session.user.created_at,
          updated_at: new Date().toISOString(),
          last_active_at: new Date().toISOString(),
          theme: 'system',
          email_notifications: true,
          total_projects: 0,
          total_downloads: 0
        }
        
        setState({
          user,
          session,
          loading: false,
          error: null
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
        console.log('Auth state change:', event, session?.user?.id)
        
        if (event === 'SIGNED_IN' && session?.user) {
          // For now, just use the auth user directly to avoid database dependency issues
          const user: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            avatar_url: session.user.user_metadata?.avatar_url,
            created_at: session.user.created_at,
            updated_at: new Date().toISOString(),
            last_active_at: new Date().toISOString(),
            theme: 'system',
            email_notifications: true,
            total_projects: 0,
            total_downloads: 0
          }
          
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
        } else if (event === 'TOKEN_REFRESH_FAILED') {
          console.error('Token refresh failed, signing out')
          setState({
            user: null,
            session: null,
            loading: false,
            error: null
          })
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
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    })

    if (error) {
      setState(prev => ({ ...prev, error, loading: false }))
    } else {
      // For OAuth, we don't set loading to false here because the redirect happens
      // The loading state will be reset when the user returns from the OAuth flow
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