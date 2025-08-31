import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './use-auth'
import { UsageTrackingService, type UsageCheckResult, type UpgradePrompt } from '@/lib/usage-tracking'
import { FreemiumLimits, type UserTier } from '@/lib/freemium-limits'
import type { UsageTracking, Subscription } from '@/lib/supabase'

interface UsageState {
  usage: UsageTracking | null
  subscription: Subscription | null
  loading: boolean
  error: string | null
}

interface UsageHookReturn extends UsageState {
  tier: UserTier
  
  // Usage limits and remaining counts
  stackGenerationsRemaining: number
  conversationsRemaining: number
  isAtStackLimit: boolean
  isAtConversationLimit: boolean
  
  // Usage period info
  resetDate: Date | null
  periodStart: Date | null
  periodEnd: Date | null
  
  // Check functions that return detailed results
  checkStackGeneration: () => Promise<UsageCheckResult>
  checkConversationSave: () => Promise<UsageCheckResult>
  checkMessageSend: (conversationId: string) => Promise<UsageCheckResult>
  
  // Action functions
  incrementStackGeneration: () => Promise<boolean>
  incrementConversationSave: () => Promise<boolean>
  refreshUsage: () => Promise<void>
  
  // Upgrade prompts
  getUpgradePrompt: (limitType: 'stack' | 'conversation' | 'message') => UpgradePrompt
  
  // Usage summary for dashboard
  usageSummary: {
    stackGenerations: { used: number; limit: number; unlimited: boolean }
    conversations: { used: number; limit: number; unlimited: boolean }
    resetDate: Date | null
  } | null
}

export function useUsage(): UsageHookReturn {
  const { user } = useAuth()
  const [state, setState] = useState<UsageState>({
    usage: null,
    subscription: null,
    loading: true,
    error: null
  })

  const fetchUsageData = useCallback(async () => {
    if (!user) {
      setState({
        usage: null,
        subscription: null,
        loading: false,
        error: null
      })
      return
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const [usage, tier] = await Promise.all([
        UsageTrackingService.getCurrentUsagePeriod(user.id),
        UsageTrackingService.getUserTier(user.id)
      ])

      // Get subscription info if not free tier
      let subscription = null
      if (tier !== 'free') {
        // This would come from the subscription table
        subscription = {
          id: 'temp',
          user_id: user.id,
          tier,
          status: 'active' as const,
          cancel_at_period_end: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }

      setState({
        usage,
        subscription,
        loading: false,
        error: null
      })
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch usage data'
      }))
    }
  }, [user])

  useEffect(() => {
    fetchUsageData()
  }, [fetchUsageData])

  // Check functions that return detailed results
  const checkStackGeneration = useCallback(async (): Promise<UsageCheckResult> => {
    if (!user) return { allowed: false, reason: 'Not authenticated' }
    return UsageTrackingService.checkStackGeneration(user.id)
  }, [user])

  const checkConversationSave = useCallback(async (): Promise<UsageCheckResult> => {
    if (!user) return { allowed: false, reason: 'Not authenticated' }
    return UsageTrackingService.checkConversationSave(user.id)
  }, [user])

  const checkMessageSend = useCallback(async (conversationId: string): Promise<UsageCheckResult> => {
    if (!user) return { allowed: false, reason: 'Not authenticated' }
    return UsageTrackingService.checkMessageSend(user.id, conversationId)
  }, [user])

  // Action functions
  const incrementStackGeneration = useCallback(async (): Promise<boolean> => {
    if (!user) return false
    
    const success = await UsageTrackingService.incrementStackGeneration(user.id)
    
    if (success) {
      // Refresh usage data to get updated counts
      await fetchUsageData()
    }
    
    return success
  }, [user, fetchUsageData])

  const incrementConversationSave = useCallback(async (): Promise<boolean> => {
    if (!user) return false
    
    const success = await UsageTrackingService.incrementConversationSave(user.id)
    
    if (success) {
      // Refresh usage data to get updated counts
      await fetchUsageData()
    }
    
    return success
  }, [user, fetchUsageData])

  const refreshUsage = useCallback(async () => {
    await fetchUsageData()
  }, [fetchUsageData])

  // Computed values
  const tier: UserTier = state.subscription?.tier || 'free'
  const limits = FreemiumLimits.getTierLimits(tier)
  
  const stackGenerationsRemaining = state.usage 
    ? 'MAX_STACK_GENERATIONS_MONTHLY' in limits
      ? limits.MAX_STACK_GENERATIONS_MONTHLY === -1
        ? Infinity
        : Math.max(0, limits.MAX_STACK_GENERATIONS_MONTHLY - state.usage.stack_generations_used)
      : Math.max(0, (limits as any).MAX_STACK_GENERATIONS_LIFETIME - state.usage.stack_generations_used)
    : tier === 'free' ? 1 : 5

  const conversationsRemaining = state.usage
    ? limits.MAX_SAVED_CONVERSATIONS === -1
      ? Infinity
      : Math.max(0, limits.MAX_SAVED_CONVERSATIONS - state.usage.conversations_saved)
    : tier === 'free' ? 1 : Infinity

  const isAtStackLimit = stackGenerationsRemaining === 0
  const isAtConversationLimit = conversationsRemaining === 0

  // Usage period info
  const resetDate = state.usage && tier !== 'free' ? new Date(state.usage.period_end) : null
  const periodStart = state.usage ? new Date(state.usage.period_start) : null
  const periodEnd = state.usage ? new Date(state.usage.period_end) : null

  // Upgrade prompt function
  const getUpgradePrompt = useCallback((limitType: 'stack' | 'conversation' | 'message'): UpgradePrompt => {
    return UsageTrackingService.getUpgradePrompt(tier, limitType)
  }, [tier])

  // Usage summary for dashboard
  const usageSummary = state.usage ? {
    stackGenerations: {
      used: state.usage.stack_generations_used,
      limit: tier === 'free' 
        ? (limits as any).MAX_STACK_GENERATIONS_LIFETIME || 1
        : (limits as any).MAX_STACK_GENERATIONS_MONTHLY || 5,
      unlimited: tier === 'pro'
    },
    conversations: {
      used: state.usage.conversations_saved,
      limit: limits.MAX_SAVED_CONVERSATIONS,
      unlimited: limits.MAX_SAVED_CONVERSATIONS === -1
    },
    resetDate
  } : null

  return {
    ...state,
    tier,
    stackGenerationsRemaining,
    conversationsRemaining,
    isAtStackLimit,
    isAtConversationLimit,
    resetDate,
    periodStart,
    periodEnd,
    checkStackGeneration,
    checkConversationSave,
    checkMessageSend,
    incrementStackGeneration,
    incrementConversationSave,
    refreshUsage,
    getUpgradePrompt,
    usageSummary
  }
}