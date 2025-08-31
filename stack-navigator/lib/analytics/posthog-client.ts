import posthog from 'posthog-js'

export class PostHogClient {
  private static instance: PostHogClient
  private initialized = false

  private constructor() {}

  static getInstance(): PostHogClient {
    if (!PostHogClient.instance) {
      PostHogClient.instance = new PostHogClient()
    }
    return PostHogClient.instance
  }

  initialize() {
    if (this.initialized || typeof window === 'undefined') {
      return
    }

    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'

    if (!apiKey) {
      console.warn('PostHog API key not found. Analytics will be disabled.')
      return
    }

    posthog.init(apiKey, {
      api_host: host,
      // Privacy-compliant settings
      capture_pageview: false, // We'll manually track pageviews
      capture_pageleave: true,
      disable_session_recording: false, // Can be enabled for debugging
      respect_dnt: true, // Respect Do Not Track
      opt_out_capturing_by_default: false,
      // Feature flags
      bootstrap: {
        featureFlags: {},
      },
      // Performance optimizations
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('PostHog loaded successfully')
        }
      }
    })

    this.initialized = true
  }

  // Core tracking methods
  track(event: string, properties?: Record<string, any>) {
    if (!this.initialized || typeof window === 'undefined') {
      return
    }
    posthog.capture(event, properties)
  }

  identify(userId: string, properties?: Record<string, any>) {
    if (!this.initialized || typeof window === 'undefined') {
      return
    }
    posthog.identify(userId, properties)
  }

  alias(alias: string) {
    if (!this.initialized || typeof window === 'undefined') {
      return
    }
    posthog.alias(alias)
  }

  reset() {
    if (!this.initialized || typeof window === 'undefined') {
      return
    }
    posthog.reset()
  }

  // Feature flags
  isFeatureEnabled(flag: string): boolean {
    if (!this.initialized || typeof window === 'undefined') {
      return false
    }
    return posthog.isFeatureEnabled(flag) || false
  }

  getFeatureFlag(flag: string): string | boolean | undefined {
    if (!this.initialized || typeof window === 'undefined') {
      return undefined
    }
    return posthog.getFeatureFlag(flag)
  }

  // Group analytics (for B2B features)
  group(groupType: string, groupKey: string, properties?: Record<string, any>) {
    if (!this.initialized || typeof window === 'undefined') {
      return
    }
    posthog.group(groupType, groupKey, properties)
  }

  // Page tracking
  trackPageView(path?: string, properties?: Record<string, any>) {
    if (!this.initialized || typeof window === 'undefined') {
      return
    }
    posthog.capture('$pageview', {
      $current_url: path || window.location.href,
      ...properties
    })
  }

  // Conversion funnel events
  trackSignup(method: 'email' | 'google' | 'github', properties?: Record<string, any>) {
    this.track('user_signup', {
      signup_method: method,
      ...properties
    })
  }

  trackFirstGeneration(stackType: string, properties?: Record<string, any>) {
    this.track('first_stack_generation', {
      stack_type: stackType,
      ...properties
    })
  }

  trackUpgrade(fromTier: string, toTier: string, properties?: Record<string, any>) {
    this.track('subscription_upgrade', {
      from_tier: fromTier,
      to_tier: toTier,
      ...properties
    })
  }

  trackChurn(tier: string, reason?: string, properties?: Record<string, any>) {
    this.track('subscription_churn', {
      tier,
      churn_reason: reason,
      ...properties
    })
  }

  // Stack generation events
  trackStackGeneration(selections: Record<string, any>, properties?: Record<string, any>) {
    this.track('stack_generated', {
      ...selections,
      ...properties
    })
  }

  trackStackDownload(projectName: string, stackType: string, properties?: Record<string, any>) {
    this.track('stack_downloaded', {
      project_name: projectName,
      stack_type: stackType,
      ...properties
    })
  }

  // Conversation events
  trackConversationStart(properties?: Record<string, any>) {
    this.track('conversation_started', properties)
  }

  trackConversationComplete(messageCount: number, properties?: Record<string, any>) {
    this.track('conversation_completed', {
      message_count: messageCount,
      ...properties
    })
  }

  // Limit reached events
  trackLimitReached(limitType: 'generation' | 'conversation' | 'message', tier: string, properties?: Record<string, any>) {
    this.track('limit_reached', {
      limit_type: limitType,
      user_tier: tier,
      ...properties
    })
  }

  trackUpgradePromptShown(trigger: string, properties?: Record<string, any>) {
    this.track('upgrade_prompt_shown', {
      trigger,
      ...properties
    })
  }

  trackUpgradePromptClicked(action: 'upgrade' | 'dismiss', properties?: Record<string, any>) {
    this.track('upgrade_prompt_clicked', {
      action,
      ...properties
    })
  }

  // Error tracking
  trackError(error: Error, context?: Record<string, any>) {
    this.track('error_occurred', {
      error_message: error.message,
      error_stack: error.stack,
      ...context
    })
  }
}

// Export singleton instance
export const analytics = PostHogClient.getInstance()