import { supabase, type UsageTracking, type Subscription } from './supabase'
import { FreemiumLimits, type UserTier, type UserUsage } from './freemium-limits'

export interface UsageCheckResult {
  allowed: boolean
  reason?: string
  upgradeRequired?: boolean
  remainingCount?: number
  resetDate?: Date
}

export interface UpgradePrompt {
  title: string
  message: string
  benefits: string[]
  ctaText: string
  targetTier: UserTier
  pricing: { monthly: number }
}

export class UsageTrackingService {
  /**
   * Get current usage period for a user
   */
  static async getCurrentUsagePeriod(userId: string): Promise<UsageTracking | null> {
    const { data, error } = await supabase
      .rpc('get_current_usage_period', { p_user_id: userId })

    if (error) {
      console.error('Error fetching current usage period:', error)
      return null
    }

    return data
  }

  /**
   * Get user's subscription tier
   */
  static async getUserTier(userId: string): Promise<UserTier> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('tier, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (error || !data) {
      return 'free'
    }

    return data.tier as UserTier
  }

  /**
   * Check if user can generate a stack
   */
  static async checkStackGeneration(userId: string): Promise<UsageCheckResult> {
    const [tier, usage] = await Promise.all([
      this.getUserTier(userId),
      this.getCurrentUsagePeriod(userId)
    ])

    if (!usage) {
      // Create initial usage period if none exists
      await this.initializeUsagePeriod(userId)
      return { allowed: true, remainingCount: tier === 'free' ? 1 : 5 }
    }

    const userUsage: UserUsage = {
      userId,
      stackGenerationsUsed: usage.stack_generations_used,
      conversationsSaved: usage.conversations_saved,
      currentPeriodStart: new Date(usage.period_start),
      currentPeriodEnd: new Date(usage.period_end),
      lastResetAt: new Date(usage.updated_at)
    }

    const result = FreemiumLimits.canGenerateStack(tier, userUsage)
    
    if (!result.allowed) {
      return {
        allowed: false,
        reason: result.reason,
        upgradeRequired: result.upgradeRequired,
        resetDate: tier === 'starter' ? userUsage.currentPeriodEnd : undefined
      }
    }

    // Calculate remaining count
    const limits = FreemiumLimits.getTierLimits(tier)
    let remainingCount: number | undefined

    if (tier === 'free') {
      remainingCount = Math.max(0, limits.MAX_STACK_GENERATIONS_LIFETIME - usage.stack_generations_used)
    } else if (tier === 'starter') {
      remainingCount = Math.max(0, limits.MAX_STACK_GENERATIONS_MONTHLY - usage.stack_generations_used)
    }

    return {
      allowed: true,
      remainingCount,
      resetDate: tier === 'starter' ? userUsage.currentPeriodEnd : undefined
    }
  }

  /**
   * Check if user can save a conversation
   */
  static async checkConversationSave(userId: string): Promise<UsageCheckResult> {
    const [tier, usage] = await Promise.all([
      this.getUserTier(userId),
      this.getCurrentUsagePeriod(userId)
    ])

    if (!usage) {
      await this.initializeUsagePeriod(userId)
      return { allowed: true, remainingCount: tier === 'free' ? 1 : undefined }
    }

    const result = FreemiumLimits.canSaveConversation(tier, usage.conversations_saved)
    
    if (!result.allowed) {
      return {
        allowed: false,
        reason: result.reason,
        upgradeRequired: result.upgradeRequired
      }
    }

    // Calculate remaining count for free tier
    let remainingCount: number | undefined
    if (tier === 'free') {
      const limits = FreemiumLimits.getTierLimits(tier)
      remainingCount = Math.max(0, limits.MAX_SAVED_CONVERSATIONS - usage.conversations_saved)
    }

    return {
      allowed: true,
      remainingCount
    }
  }

  /**
   * Check if user can send a message in a conversation
   */
  static async checkMessageSend(userId: string, conversationId: string): Promise<UsageCheckResult> {
    const tier = await this.getUserTier(userId)
    
    // Get message count for this conversation
    const { data: messageCount, error } = await supabase
      .from('messages')
      .select('id', { count: 'exact' })
      .eq('conversation_id', conversationId)

    if (error) {
      console.error('Error fetching message count:', error)
      return { allowed: false, reason: 'Unable to check message limits' }
    }

    const currentMessageCount = messageCount?.length || 0
    const result = FreemiumLimits.canSendMessage(tier, currentMessageCount)
    
    return {
      allowed: result.allowed,
      reason: result.reason,
      remainingCount: result.remainingMessages,
      upgradeRequired: !result.allowed && tier === 'free'
    }
  }

  /**
   * Increment stack generation usage
   */
  static async incrementStackGeneration(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('increment_stack_generation', { p_user_id: userId })

    if (error) {
      console.error('Error incrementing stack generation:', error)
      return false
    }

    return data
  }

  /**
   * Increment conversation save count
   */
  static async incrementConversationSave(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('increment_conversation_save', { p_user_id: userId })

    if (error) {
      console.error('Error incrementing conversation save:', error)
      return false
    }

    return data
  }

  /**
   * Initialize usage period for new user
   */
  static async initializeUsagePeriod(userId: string): Promise<UsageTracking | null> {
    const tier = await this.getUserTier(userId)
    const limits = FreemiumLimits.getTierLimits(tier)
    
    const now = new Date()
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1) // First day of next month

    const { data, error } = await supabase
      .from('usage_tracking')
      .insert({
        user_id: userId,
        period_start: now.toISOString(),
        period_end: periodEnd.toISOString(),
        stack_generations_used: 0,
        stack_generations_limit: tier === 'free' ? limits.MAX_STACK_GENERATIONS_LIFETIME : limits.MAX_STACK_GENERATIONS_MONTHLY,
        conversations_saved: 0,
        conversations_limit: limits.MAX_SAVED_CONVERSATIONS,
        messages_sent: 0,
        messages_limit: limits.MAX_MESSAGES_PER_CONVERSATION
      })
      .select()
      .single()

    if (error) {
      console.error('Error initializing usage period:', error)
      return null
    }

    return data
  }

  /**
   * Reset monthly usage for subscription tiers
   */
  static async resetMonthlyUsage(userId: string): Promise<boolean> {
    const tier = await this.getUserTier(userId)
    
    // Only reset for subscription tiers (starter, pro)
    if (tier === 'free') {
      return false
    }

    const limits = FreemiumLimits.getTierLimits(tier)
    const now = new Date()
    const nextPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    const { error } = await supabase
      .from('usage_tracking')
      .update({
        period_start: now.toISOString(),
        period_end: nextPeriodEnd.toISOString(),
        stack_generations_used: 0,
        stack_generations_limit: limits.MAX_STACK_GENERATIONS_MONTHLY,
        messages_sent: 0,
        updated_at: now.toISOString()
      })
      .eq('user_id', userId)

    if (error) {
      console.error('Error resetting monthly usage:', error)
      return false
    }

    return true
  }

  /**
   * Get upgrade prompt based on current tier and limit reached
   */
  static getUpgradePrompt(currentTier: UserTier, limitType: 'stack' | 'conversation' | 'message'): UpgradePrompt {
    if (currentTier === 'free') {
      const benefits = FreemiumLimits.getUpgradeBenefits('free', 'starter')
      const pricing = FreemiumLimits.getTierPricing('starter')

      switch (limitType) {
        case 'stack':
          return {
            title: '🚀 Ready for More Stacks?',
            message: "You've used your free stack generation! Upgrade to keep building amazing projects.",
            benefits,
            ctaText: 'Upgrade to Starter',
            targetTier: 'starter',
            pricing
          }
        case 'conversation':
          return {
            title: '💬 Save More Conversations',
            message: "You can only save 1 conversation on the free tier. Upgrade for unlimited saves!",
            benefits,
            ctaText: 'Upgrade to Starter',
            targetTier: 'starter',
            pricing
          }
        case 'message':
          return {
            title: '✨ Unlimited Conversations',
            message: "You've reached the 20 message limit. Upgrade for unlimited messages per conversation!",
            benefits,
            ctaText: 'Upgrade to Starter',
            targetTier: 'starter',
            pricing
          }
      }
    }

    if (currentTier === 'starter') {
      const benefits = FreemiumLimits.getUpgradeBenefits('starter', 'pro')
      const pricing = FreemiumLimits.getTierPricing('pro')

      return {
        title: '🎯 Unlock Pro Features',
        message: "You've reached your Starter tier limits. Upgrade to Pro for unlimited everything!",
        benefits,
        ctaText: 'Upgrade to Pro',
        targetTier: 'pro',
        pricing
      }
    }

    // Fallback (shouldn't happen for Pro tier)
    return {
      title: 'Upgrade Available',
      message: 'Consider upgrading for more features.',
      benefits: [],
      ctaText: 'Learn More',
      targetTier: 'pro',
      pricing: { monthly: 0 }
    }
  }

  /**
   * Get usage summary for dashboard
   */
  static async getUsageSummary(userId: string) {
    const [tier, usage] = await Promise.all([
      this.getUserTier(userId),
      this.getCurrentUsagePeriod(userId)
    ])

    if (!usage) {
      return {
        tier,
        stackGenerations: { used: 0, limit: tier === 'free' ? 1 : 5, unlimited: tier === 'pro' },
        conversations: { used: 0, limit: tier === 'free' ? 1 : -1, unlimited: tier !== 'free' },
        resetDate: tier !== 'free' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null
      }
    }

    const limits = FreemiumLimits.getTierLimits(tier)
    
    return {
      tier,
      stackGenerations: {
        used: usage.stack_generations_used,
        limit: tier === 'free' ? limits.MAX_STACK_GENERATIONS_LIFETIME : limits.MAX_STACK_GENERATIONS_MONTHLY,
        unlimited: tier === 'pro'
      },
      conversations: {
        used: usage.conversations_saved,
        limit: limits.MAX_SAVED_CONVERSATIONS,
        unlimited: limits.MAX_SAVED_CONVERSATIONS === -1
      },
      resetDate: tier !== 'free' ? new Date(usage.period_end) : null,
      periodStart: new Date(usage.period_start),
      periodEnd: new Date(usage.period_end)
    }
  }

  /**
   * Check if usage period needs reset (for cron jobs)
   */
  static async checkAndResetExpiredPeriods(): Promise<number> {
    const { data: expiredUsers, error } = await supabase
      .from('usage_tracking')
      .select('user_id')
      .lt('period_end', new Date().toISOString())

    if (error || !expiredUsers) {
      console.error('Error fetching expired usage periods:', error)
      return 0
    }

    let resetCount = 0
    for (const user of expiredUsers) {
      const success = await this.resetMonthlyUsage(user.user_id)
      if (success) resetCount++
    }

    return resetCount
  }
}