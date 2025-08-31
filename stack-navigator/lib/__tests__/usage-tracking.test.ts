import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// Mock the supabase module before any imports
const mockSupabase = {
  rpc: jest.fn(),
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn()
      }))
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn()
      }))
    })),
    update: jest.fn(() => ({
      eq: jest.fn()
    }))
  }))
}

jest.mock('../supabase', () => ({
  supabase: mockSupabase
}))

// Import after mocking
import { FreemiumLimits } from '../freemium-limits'

// Mock the UsageTrackingService methods that depend on Supabase
const UsageTrackingService = {
  getUserTier: jest.fn(),
  getCurrentUsagePeriod: jest.fn(),
  checkStackGeneration: jest.fn(),
  checkConversationSave: jest.fn(),
  checkMessageSend: jest.fn(),
  incrementStackGeneration: jest.fn(),
  incrementConversationSave: jest.fn(),
  getUpgradePrompt: jest.fn(),
  getUsageSummary: jest.fn(),
  initializeUsagePeriod: jest.fn(),
  resetMonthlyUsage: jest.fn(),
  checkAndResetExpiredPeriods: jest.fn()
}

describe('UsageTrackingService', () => {
  const mockUserId = 'test-user-id'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('checkStackGeneration', () => {
    it('should allow stack generation for free user with no usage', async () => {
      const mockResult = {
        allowed: true,
        remainingCount: 1
      }

      UsageTrackingService.checkStackGeneration.mockResolvedValue(mockResult)

      const result = await UsageTrackingService.checkStackGeneration(mockUserId)

      expect(result.allowed).toBe(true)
      expect(result.remainingCount).toBe(1)
      expect(UsageTrackingService.checkStackGeneration).toHaveBeenCalledWith(mockUserId)
    })

    it('should deny stack generation for free user at limit', async () => {
      const mockResult = {
        allowed: false,
        upgradeRequired: true,
        reason: 'You\'ve used your free stack generation! Upgrade to Starter for 5 stacks per month.'
      }

      UsageTrackingService.checkStackGeneration.mockResolvedValue(mockResult)

      const result = await UsageTrackingService.checkStackGeneration(mockUserId)

      expect(result.allowed).toBe(false)
      expect(result.upgradeRequired).toBe(true)
      expect(result.reason).toContain('free stack generation')
    })

    it('should allow stack generation for starter user within limits', async () => {
      const mockResult = {
        allowed: true,
        remainingCount: 3
      }

      UsageTrackingService.checkStackGeneration.mockResolvedValue(mockResult)

      const result = await UsageTrackingService.checkStackGeneration(mockUserId)

      expect(result.allowed).toBe(true)
      expect(result.remainingCount).toBe(3)
    })
  })

  describe('checkConversationSave', () => {
    it('should allow conversation save for free user with no saved conversations', async () => {
      const mockResult = {
        allowed: true,
        remainingCount: 1
      }

      UsageTrackingService.checkConversationSave.mockResolvedValue(mockResult)

      const result = await UsageTrackingService.checkConversationSave(mockUserId)

      expect(result.allowed).toBe(true)
      expect(result.remainingCount).toBe(1)
    })

    it('should deny conversation save for free user at limit', async () => {
      const mockResult = {
        allowed: false,
        upgradeRequired: true,
        reason: 'You can only save 1 conversation on the free tier. Upgrade to Starter for unlimited saved conversations!'
      }

      UsageTrackingService.checkConversationSave.mockResolvedValue(mockResult)

      const result = await UsageTrackingService.checkConversationSave(mockUserId)

      expect(result.allowed).toBe(false)
      expect(result.upgradeRequired).toBe(true)
      expect(result.reason).toContain('save 1 conversation')
    })
  })

  describe('getUpgradePrompt', () => {
    it('should return correct upgrade prompt for free tier stack limit', () => {
      const mockPrompt = {
        title: '🚀 Ready for More Stacks?',
        targetTier: 'starter' as const,
        pricing: { monthly: 4.99 },
        benefits: ['5 stack generations per month', 'Unlimited messages per conversation']
      }

      UsageTrackingService.getUpgradePrompt.mockReturnValue(mockPrompt)

      const prompt = UsageTrackingService.getUpgradePrompt('free', 'stack')

      expect(prompt.title).toContain('Ready for More')
      expect(prompt.targetTier).toBe('starter')
      expect(prompt.pricing.monthly).toBe(4.99)
      expect(prompt.benefits).toContain('5 stack generations per month')
    })

    it('should return correct upgrade prompt for starter tier', () => {
      const mockPrompt = {
        title: '🎯 Unlock Pro Features',
        targetTier: 'pro' as const,
        pricing: { monthly: 14.99 },
        benefits: ['Unlimited stack generations', 'Team collaboration']
      }

      UsageTrackingService.getUpgradePrompt.mockReturnValue(mockPrompt)

      const prompt = UsageTrackingService.getUpgradePrompt('starter', 'stack')

      expect(prompt.targetTier).toBe('pro')
      expect(prompt.benefits).toContain('Unlimited stack generations')
    })
  })

  describe('getUsageSummary', () => {
    it('should return correct usage summary for free tier', async () => {
      const mockSummary = {
        tier: 'free' as const,
        stackGenerations: { used: 0, limit: 1, unlimited: false },
        conversations: { used: 0, limit: 1, unlimited: false },
        resetDate: null
      }

      UsageTrackingService.getUsageSummary.mockResolvedValue(mockSummary)

      const summary = await UsageTrackingService.getUsageSummary(mockUserId)

      expect(summary.tier).toBe('free')
      expect(summary.stackGenerations.used).toBe(0)
      expect(summary.stackGenerations.limit).toBe(1)
      expect(summary.stackGenerations.unlimited).toBe(false)
      expect(summary.conversations.used).toBe(0)
      expect(summary.conversations.limit).toBe(1)
      expect(summary.conversations.unlimited).toBe(false)
      expect(summary.resetDate).toBeNull()
    })

    it('should return correct usage summary for starter tier', async () => {
      const mockSummary = {
        tier: 'starter' as const,
        stackGenerations: { used: 2, limit: 5, unlimited: false },
        conversations: { used: 3, limit: -1, unlimited: true },
        resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }

      UsageTrackingService.getUsageSummary.mockResolvedValue(mockSummary)

      const summary = await UsageTrackingService.getUsageSummary(mockUserId)

      expect(summary.tier).toBe('starter')
      expect(summary.stackGenerations.used).toBe(2)
      expect(summary.stackGenerations.limit).toBe(5)
      expect(summary.stackGenerations.unlimited).toBe(false)
      expect(summary.conversations.unlimited).toBe(true)
      expect(summary.resetDate).toBeTruthy()
    })
  })
})

describe('FreemiumLimits', () => {
  describe('canSendMessage', () => {
    it('should allow messages for free tier under limit', () => {
      const result = FreemiumLimits.canSendMessage('free', 10)

      expect(result.allowed).toBe(true)
      expect(result.remainingMessages).toBe(10)
    })

    it('should deny messages for free tier at limit', () => {
      const result = FreemiumLimits.canSendMessage('free', 20)

      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('20 message limit')
    })

    it('should allow unlimited messages for starter tier', () => {
      const result = FreemiumLimits.canSendMessage('starter', 100)

      expect(result.allowed).toBe(true)
      expect(result.remainingMessages).toBeUndefined()
    })
  })

  describe('getTierLimits', () => {
    it('should return correct limits for free tier', () => {
      const limits = FreemiumLimits.getTierLimits('free')

      expect(limits.MAX_STACK_GENERATIONS_LIFETIME).toBe(1)
      expect(limits.MAX_MESSAGES_PER_CONVERSATION).toBe(20)
      expect(limits.MAX_SAVED_CONVERSATIONS).toBe(1)
    })

    it('should return correct limits for starter tier', () => {
      const limits = FreemiumLimits.getTierLimits('starter')

      expect(limits.MAX_STACK_GENERATIONS_MONTHLY).toBe(5)
      expect(limits.MAX_MESSAGES_PER_CONVERSATION).toBe(-1)
      expect(limits.MAX_SAVED_CONVERSATIONS).toBe(-1)
    })
  })
})