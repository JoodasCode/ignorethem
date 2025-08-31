import { useState, useEffect } from 'react'
import { useAuth } from './use-auth'
import type { User, Subscription, UsageTracking } from '@/lib/supabase'
import type { SubscriptionTier } from '@/lib/stripe'

interface UserSession {
  user: User | null
  subscription: Subscription | null
  tier: SubscriptionTier
  usage: UsageTracking | null
}

interface UseUserSessionReturn extends UserSession {
  isLoading: boolean
  error: string | null
  isAuthenticated: boolean
  refetch: () => Promise<void>
}

export function useUserSession(): UseUserSessionReturn {
  const { user: authUser, loading: authLoading, isAuthenticated } = useAuth()
  const [session, setSession] = useState<UserSession>({
    user: null,
    subscription: null,
    tier: 'free' as SubscriptionTier,
    usage: null
  })
  const [additionalLoading, setAdditionalLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAdditionalUserData = async (userId: string) => {
    try {
      setAdditionalLoading(true)
      setError(null)

      const response = await fetch('/api/user/session')
      
      if (!response.ok) {
        // If API fails, just use basic user data from auth
        console.warn('Session API failed, using basic auth data')
        setSession({
          user: authUser,
          subscription: null,
          tier: 'free' as SubscriptionTier,
          usage: null
        })
        return
      }

      const data = await response.json()
      setSession({
        user: data.user || authUser,
        subscription: data.subscription,
        tier: data.tier || 'free',
        usage: data.usage
      })
    } catch (err) {
      console.warn('Failed to fetch additional user data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch session')
      
      // Fallback to basic auth user data
      setSession({
        user: authUser,
        subscription: null,
        tier: 'free' as SubscriptionTier,
        usage: null
      })
    } finally {
      setAdditionalLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated && authUser) {
      fetchAdditionalUserData(authUser.id)
    } else {
      // Reset session when not authenticated
      setSession({
        user: null,
        subscription: null,
        tier: 'free' as SubscriptionTier,
        usage: null
      })
      setError(null)
    }
  }, [isAuthenticated, authUser])

  return {
    ...session,
    isLoading: authLoading || additionalLoading,
    error,
    isAuthenticated,
    refetch: () => authUser ? fetchAdditionalUserData(authUser.id) : Promise.resolve(),
  }
}