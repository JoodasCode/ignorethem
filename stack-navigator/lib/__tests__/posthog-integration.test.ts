import { analytics } from '../analytics/posthog-client'
import { serverAnalytics } from '../analytics/server-analytics'
import { FeatureFlagManager, FEATURE_FLAGS } from '../analytics/feature-flags'

// Mock PostHog
jest.mock('posthog-js', () => ({
  init: jest.fn(),
  capture: jest.fn(),
  identify: jest.fn(),
  alias: jest.fn(),
  reset: jest.fn(),
  isFeatureEnabled: jest.fn(),
  getFeatureFlag: jest.fn(),
  group: jest.fn(),
}))

jest.mock('posthog-node', () => ({
  PostHog: jest.fn().mockImplementation(() => ({
    capture: jest.fn(),
    identify: jest.fn(),
    alias: jest.fn(),
    groupIdentify: jest.fn(),
    flush: jest.fn(),
    shutdown: jest.fn(),
  })),
}))

describe('PostHog Analytics Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock environment variables
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'test-key'
    process.env.POSTHOG_API_KEY = 'test-key'
  })

  describe('Client-side Analytics', () => {
    it('should initialize PostHog client', () => {
      analytics.initialize()
      expect(require('posthog-js').init).toHaveBeenCalledWith('test-key', expect.any(Object))
    })

    it('should track events', () => {
      analytics.track('test_event', { property: 'value' })
      expect(require('posthog-js').capture).toHaveBeenCalledWith('test_event', { property: 'value' })
    })

    it('should identify users', () => {
      analytics.identify('user123', { email: 'test@example.com' })
      expect(require('posthog-js').identify).toHaveBeenCalledWith('user123', { email: 'test@example.com' })
    })

    it('should track signup events', () => {
      analytics.trackSignup('email', { source: 'landing_page' })
      expect(require('posthog-js').capture).toHaveBeenCalledWith('user_signup', {
        signup_method: 'email',
        source: 'landing_page',
      })
    })

    it('should track first generation events', () => {
      analytics.trackFirstGeneration('nextjs-clerk-supabase')
      expect(require('posthog-js').capture).toHaveBeenCalledWith('first_stack_generation', {
        stack_type: 'nextjs-clerk-supabase',
      })
    })

    it('should track upgrade events', () => {
      analytics.trackUpgrade('free', 'starter', { plan_duration: 'monthly' })
      expect(require('posthog-js').capture).toHaveBeenCalledWith('subscription_upgrade', {
        from_tier: 'free',
        to_tier: 'starter',
        plan_duration: 'monthly',
      })
    })

    it('should track churn events', () => {
      analytics.trackChurn('starter', 'too_expensive')
      expect(require('posthog-js').capture).toHaveBeenCalledWith('subscription_churn', {
        tier: 'starter',
        churn_reason: 'too_expensive',
      })
    })

    it('should track stack generation', () => {
      const selections = {
        framework: 'nextjs',
        auth: 'clerk',
        database: 'supabase',
      }
      analytics.trackStackGeneration(selections)
      expect(require('posthog-js').capture).toHaveBeenCalledWith('stack_generated', selections)
    })

    it('should track limit reached events', () => {
      analytics.trackLimitReached('generation', 'free')
      expect(require('posthog-js').capture).toHaveBeenCalledWith('limit_reached', {
        limit_type: 'generation',
        user_tier: 'free',
      })
    })

    it('should track upgrade prompt events', () => {
      analytics.trackUpgradePromptShown('generation_limit')
      expect(require('posthog-js').capture).toHaveBeenCalledWith('upgrade_prompt_shown', {
        trigger: 'generation_limit',
      })

      analytics.trackUpgradePromptClicked('upgrade')
      expect(require('posthog-js').capture).toHaveBeenCalledWith('upgrade_prompt_clicked', {
        action: 'upgrade',
      })
    })

    it('should track errors', () => {
      const error = new Error('Test error')
      analytics.trackError(error, { component: 'ChatInterface' })
      expect(require('posthog-js').capture).toHaveBeenCalledWith('error_occurred', {
        error_message: 'Test error',
        error_stack: error.stack,
        component: 'ChatInterface',
      })
    })
  })

  describe('Server-side Analytics', () => {
    let mockClient: any

    beforeEach(() => {
      const PostHogMock = require('posthog-node').PostHog
      mockClient = new PostHogMock()
    })

    it('should track server events', async () => {
      await serverAnalytics.track('user123', 'api_call', { endpoint: '/api/chat' })
      expect(mockClient.capture).toHaveBeenCalledWith({
        distinctId: 'user123',
        event: 'api_call',
        properties: { endpoint: '/api/chat' },
        timestamp: undefined,
        sendFeatureFlags: undefined,
      })
    })

    it('should track API calls with performance metrics', async () => {
      await serverAnalytics.trackAPICall('user123', '/api/generate', 'POST', 200, 1500)
      expect(mockClient.capture).toHaveBeenCalledWith({
        distinctId: 'user123',
        event: 'api_call',
        properties: {
          endpoint: '/api/generate',
          method: 'POST',
          status_code: 200,
          duration_ms: 1500,
        },
        timestamp: undefined,
        sendFeatureFlags: undefined,
      })
    })

    it('should track server-side signup events', async () => {
      await serverAnalytics.trackSignup('user123', 'email', { source: 'api' })
      expect(mockClient.capture).toHaveBeenCalledWith({
        distinctId: 'user123',
        event: 'user_signup',
        properties: {
          signup_method: 'email',
          source: 'api',
        },
        timestamp: undefined,
        sendFeatureFlags: undefined,
      })
    })

    it('should track usage limits', async () => {
      await serverAnalytics.trackUsageLimit('user123', 'generation', 'free')
      expect(mockClient.capture).toHaveBeenCalledWith({
        distinctId: 'user123',
        event: 'usage_limit_reached',
        properties: {
          limit_type: 'generation',
          user_tier: 'free',
        },
        timestamp: undefined,
        sendFeatureFlags: undefined,
      })
    })
  })

  describe('Feature Flags', () => {
    beforeEach(() => {
      const posthogMock = require('posthog-js')
      posthogMock.isFeatureEnabled.mockReturnValue(false)
      posthogMock.getFeatureFlag.mockReturnValue(undefined)
    })

    it('should check if feature is enabled', () => {
      const posthogMock = require('posthog-js')
      posthogMock.isFeatureEnabled.mockReturnValue(true)

      const isEnabled = FeatureFlagManager.isEnabled(FEATURE_FLAGS.SHOW_UPGRADE_BANNER)
      expect(isEnabled).toBe(true)
      expect(posthogMock.isFeatureEnabled).toHaveBeenCalledWith('show-upgrade-banner')
    })

    it('should get feature flag variant', () => {
      const posthogMock = require('posthog-js')
      posthogMock.getFeatureFlag.mockReturnValue('variant-a')

      const variant = FeatureFlagManager.getVariant(FEATURE_FLAGS.LANDING_PAGE_VARIANT)
      expect(variant).toBe('variant-a')
      expect(posthogMock.getFeatureFlag).toHaveBeenCalledWith('landing-page-variant')
    })

    it('should return correct CTA button text based on variant', () => {
      const posthogMock = require('posthog-js')
      
      // Test variant A
      posthogMock.getFeatureFlag.mockReturnValue('variant-a')
      expect(FeatureFlagManager.getCTAButtonText()).toBe('Start Building Free')

      // Test variant B
      posthogMock.getFeatureFlag.mockReturnValue('variant-b')
      expect(FeatureFlagManager.getCTAButtonText()).toBe('Get Your Stack Now')

      // Test default
      posthogMock.getFeatureFlag.mockReturnValue(undefined)
      expect(FeatureFlagManager.getCTAButtonText()).toBe('Get Started Free')
    })

    it('should return correct upgrade prompt timing', () => {
      const posthogMock = require('posthog-js')
      
      posthogMock.getFeatureFlag.mockReturnValue('immediate')
      expect(FeatureFlagManager.getUpgradePromptTiming()).toBe('immediate')

      posthogMock.getFeatureFlag.mockReturnValue('delayed')
      expect(FeatureFlagManager.getUpgradePromptTiming()).toBe('delayed')

      posthogMock.getFeatureFlag.mockReturnValue(undefined)
      expect(FeatureFlagManager.getUpgradePromptTiming()).toBe('on-limit')
    })

    it('should check feature availability', () => {
      const posthogMock = require('posthog-js')
      
      posthogMock.isFeatureEnabled.mockReturnValue(true)
      expect(FeatureFlagManager.canAccessAdvancedTemplates()).toBe(true)
      expect(FeatureFlagManager.canAccessTeamCollaboration()).toBe(true)
      expect(FeatureFlagManager.canAccessAPI()).toBe(true)
    })
  })

  describe('Privacy Compliance', () => {
    it('should respect Do Not Track setting', () => {
      analytics.initialize()
      expect(require('posthog-js').init).toHaveBeenCalledWith(
        'test-key',
        expect.objectContaining({
          respect_dnt: true,
        })
      )
    })

    it('should not capture pageviews automatically', () => {
      analytics.initialize()
      expect(require('posthog-js').init).toHaveBeenCalledWith(
        'test-key',
        expect.objectContaining({
          capture_pageview: false,
        })
      )
    })

    it('should handle missing API key gracefully', () => {
      delete process.env.NEXT_PUBLIC_POSTHOG_KEY
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      analytics.initialize()
      expect(consoleSpy).toHaveBeenCalledWith('PostHog API key not found. Analytics will be disabled.')
      
      consoleSpy.mockRestore()
    })
  })

  describe('Conversion Funnel Tracking', () => {
    it('should track complete signup to upgrade funnel', () => {
      const posthogMock = require('posthog-js')
      
      // Signup
      analytics.trackSignup('email', { source: 'landing_page' })
      expect(posthogMock.capture).toHaveBeenCalledWith('user_signup', {
        signup_method: 'email',
        source: 'landing_page',
      })

      // First generation
      analytics.trackFirstGeneration('nextjs-stack', { complexity: 'simple' })
      expect(posthogMock.capture).toHaveBeenCalledWith('first_stack_generation', {
        stack_type: 'nextjs-stack',
        complexity: 'simple',
      })

      // Limit reached
      analytics.trackLimitReached('generation', 'free')
      expect(posthogMock.capture).toHaveBeenCalledWith('limit_reached', {
        limit_type: 'generation',
        user_tier: 'free',
      })

      // Upgrade
      analytics.trackUpgrade('free', 'starter')
      expect(posthogMock.capture).toHaveBeenCalledWith('subscription_upgrade', {
        from_tier: 'free',
        to_tier: 'starter',
      })
    })
  })
})