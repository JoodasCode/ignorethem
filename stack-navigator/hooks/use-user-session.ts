import { useState, useEffect } from 'react'
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
  const [session, setSession] = useState<UserSession>({
    user: null,
    subscription: null,
    tier: 'free' as SubscriptionTier,
    usage: null
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSession = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/user/session')
      
      if (!response.ok) {
        throw new Error('Failed to fetch session')
      }

      const data = await response.json()
      setSession({
        user: data.user,
        subscription: data.subscription,
        tier: data.tier,
        usage: data.usage
      })
    } catch (err) {
      console.error('Failed to fetch user session:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch session')
      
      // Reset session on error
      setSession({
        user: null,
        subscription: null,
        tier: 'free' as SubscriptionTier,
        usage: null
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSession()
  }, [])

  return {
    ...session,
    isLoading,
    error,
    isAuthenticated: !!session.user,
    refetch: fetchSession,
  }
}