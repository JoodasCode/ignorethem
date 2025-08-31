import { analytics } from './posthog-client'

// Feature flag definitions
export const FEATURE_FLAGS = {
  // Freemium optimization flags
  SHOW_UPGRADE_BANNER: 'show-upgrade-banner',
  UPGRADE_PROMPT_TIMING: 'upgrade-prompt-timing',
  PRICING_TEST: 'pricing-test',
  
  // UI/UX improvements
  NEW_CHAT_INTERFACE: 'new-chat-interface',
  ENHANCED_ONBOARDING: 'enhanced-onboarding',
  STACK_COMPARISON_UI: 'stack-comparison-ui',
  
  // Feature rollouts
  ADVANCED_TEMPLATES: 'advanced-templates',
  TEAM_COLLABORATION: 'team-collaboration',
  API_ACCESS: 'api-access',
  
  // A/B tests
  LANDING_PAGE_VARIANT: 'landing-page-variant',
  CTA_BUTTON_TEXT: 'cta-button-text',
  SIGNUP_FLOW_VARIANT: 'signup-flow-variant',
} as const

export type FeatureFlag = typeof FEATURE_FLAGS[keyof typeof FEATURE_FLAGS]

// Feature flag utilities
export class FeatureFlagManager {
  static isEnabled(flag: FeatureFlag): boolean {
    return analytics.isFeatureEnabled(flag)
  }

  static getVariant(flag: FeatureFlag): string | boolean | undefined {
    return analytics.getFeatureFlag(flag)
  }

  // Specific feature checks
  static shouldShowUpgradeBanner(): boolean {
    return this.isEnabled(FEATURE_FLAGS.SHOW_UPGRADE_BANNER)
  }

  static getUpgradePromptTiming(): 'immediate' | 'delayed' | 'on-limit' {
    const variant = this.getVariant(FEATURE_FLAGS.UPGRADE_PROMPT_TIMING)
    return (variant as string) || 'on-limit'
  }

  static getPricingVariant(): 'standard' | 'discount' | 'annual' {
    const variant = this.getVariant(FEATURE_FLAGS.PRICING_TEST)
    return (variant as string) || 'standard'
  }

  static shouldUseNewChatInterface(): boolean {
    return this.isEnabled(FEATURE_FLAGS.NEW_CHAT_INTERFACE)
  }

  static shouldShowEnhancedOnboarding(): boolean {
    return this.isEnabled(FEATURE_FLAGS.ENHANCED_ONBOARDING)
  }

  static getLandingPageVariant(): 'original' | 'variant-a' | 'variant-b' {
    const variant = this.getVariant(FEATURE_FLAGS.LANDING_PAGE_VARIANT)
    return (variant as string) || 'original'
  }

  static getCTAButtonText(): string {
    const variant = this.getVariant(FEATURE_FLAGS.CTA_BUTTON_TEXT)
    
    switch (variant) {
      case 'variant-a':
        return 'Start Building Free'
      case 'variant-b':
        return 'Get Your Stack Now'
      default:
        return 'Get Started Free'
    }
  }

  static getSignupFlowVariant(): 'standard' | 'simplified' | 'social-first' {
    const variant = this.getVariant(FEATURE_FLAGS.SIGNUP_FLOW_VARIANT)
    return (variant as string) || 'standard'
  }

  // Feature availability checks
  static canAccessAdvancedTemplates(): boolean {
    return this.isEnabled(FEATURE_FLAGS.ADVANCED_TEMPLATES)
  }

  static canAccessTeamCollaboration(): boolean {
    return this.isEnabled(FEATURE_FLAGS.TEAM_COLLABORATION)
  }

  static canAccessAPI(): boolean {
    return this.isEnabled(FEATURE_FLAGS.API_ACCESS)
  }
}

// React hook for feature flags
export function useFeatureFlag(flag: FeatureFlag): boolean {
  return FeatureFlagManager.isEnabled(flag)
}

export function useFeatureVariant(flag: FeatureFlag): string | boolean | undefined {
  return FeatureFlagManager.getVariant(flag)
}

// A/B test tracking utilities
export function trackFeatureFlagExposure(flag: FeatureFlag, variant?: string | boolean) {
  analytics.track('feature_flag_exposure', {
    flag_name: flag,
    variant: variant || 'default',
  })
}

export function trackABTestConversion(testName: string, variant: string, conversionEvent: string) {
  analytics.track('ab_test_conversion', {
    test_name: testName,
    variant,
    conversion_event: conversionEvent,
  })
}