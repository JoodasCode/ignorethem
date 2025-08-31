import { useState, useEffect } from 'react'
import { useAuth } from './use-auth'
import { subscriptionService, type SubscriptionData } from '@/lib/subscription-service'
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from '@/lib/stripe'

interface UseSubscriptionReturn {
  subscription: SubscriptionData | null
  tier: SubscriptionTier
  isLoading: boolean
  error: string | null
  hasActiveSubscription: boolean
  createCheckoutSession: (tier: 'starter') => Promise<void>
  createBillingPortalSession: () => Promise<void>
  cancelSubscription: () => Promise<void>
  reactivateSubscription: () => Promise<void>
  refetch: () => Promise<void>
}

export function useSubscription(): UseSubscriptionReturn {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [tier, setTier] = useState<SubscriptionTier>(SUBSCRIPTION_TIERS.FREE)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscription = async () => {
    if (!user) {
      setSubscription(null)
      setTier(SUBSCRIPTION_TIERS.FREE)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const subscriptionData = await subscriptionService.getSubscription(user.id)
      const userTier = await subscriptionService.getUserTier(user.id)
      
      setSubscription(subscriptionData)
      setTier(userTier)
    } catch (err) {
      console.error('Failed to fetch subscription:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscription()
  }, [user])

  const createCheckoutSession = async (subscriptionTier: 'starter') => {
    try {
      setError(null)
      
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tier: subscriptionTier }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (err) {
      console.error('Failed to create checkout session:', err)
      setError(err instanceof Error ? err.message : 'Failed to create checkout session')
    }
  }

  const createBillingPortalSession = async () => {
    try {
      setError(null)
      
      const response = await fetch('/api/billing-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create billing portal session')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (err) {
      console.error('Failed to create billing portal session:', err)
      setError(err instanceof Error ? err.message : 'Failed to create billing portal session')
    }
  }

  const cancelSubscription = async () => {
    if (!user) return

    try {
      setError(null)
      await subscriptionService.cancelSubscription(user.id)
      await fetchSubscription() // Refresh subscription data
    } catch (err) {
      console.error('Failed to cancel subscription:', err)
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription')
    }
  }

  const reactivateSubscription = async () => {
    if (!user) return

    try {
      setError(null)
      await subscriptionService.reactivateSubscription(user.id)
      await fetchSubscription() // Refresh subscription data
    } catch (err) {
      console.error('Failed to reactivate subscription:', err)
      setError(err instanceof Error ? err.message : 'Failed to reactivate subscription')
    }
  }

  const hasActiveSubscription = subscription?.status === 'active' || subscription?.status === 'trialing'

  return {
    subscription,
    tier,
    isLoading,
    error,
    hasActiveSubscription,
    createCheckoutSession,
    createBillingPortalSession,
    cancelSubscription,
    reactivateSubscription,
    refetch: fetchSubscription,
  }
}