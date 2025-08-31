import { PostHog } from 'posthog-node'

class ServerAnalytics {
  private client: PostHog | null = null
  private initialized = false

  constructor() {
    this.initialize()
  }

  private initialize() {
    if (this.initialized) {
      return
    }

    const apiKey = process.env.POSTHOG_API_KEY
    const host = process.env.POSTHOG_HOST || 'https://app.posthog.com'

    if (!apiKey) {
      console.warn('PostHog API key not found for server-side analytics. Analytics will be disabled.')
      return
    }

    this.client = new PostHog(apiKey, {
      host,
      flushAt: 20, // Flush events after 20 events
      flushInterval: 10000, // Flush events every 10 seconds
    })

    this.initialized = true
  }

  async track(
    distinctId: string,
    event: string,
    properties?: Record<string, any>,
    options?: {
      timestamp?: Date
      sendFeatureFlags?: boolean
    }
  ) {
    if (!this.client) {
      return
    }

    this.client.capture({
      distinctId,
      event,
      properties,
      timestamp: options?.timestamp,
      sendFeatureFlags: options?.sendFeatureFlags,
    })
  }

  async identify(
    distinctId: string,
    properties?: Record<string, any>
  ) {
    if (!this.client) {
      return
    }

    this.client.identify({
      distinctId,
      properties,
    })
  }

  async alias(distinctId: string, alias: string) {
    if (!this.client) {
      return
    }

    this.client.alias({
      distinctId,
      alias,
    })
  }

  async group(
    distinctId: string,
    groupType: string,
    groupKey: string,
    properties?: Record<string, any>
  ) {
    if (!this.client) {
      return
    }

    this.client.groupIdentify({
      distinctId,
      groupType,
      groupKey,
      properties,
    })
  }

  // Conversion funnel tracking
  async trackSignup(
    userId: string,
    method: 'email' | 'google' | 'github',
    properties?: Record<string, any>
  ) {
    await this.track(userId, 'user_signup', {
      signup_method: method,
      ...properties,
    })
  }

  async trackFirstGeneration(
    userId: string,
    stackType: string,
    properties?: Record<string, any>
  ) {
    await this.track(userId, 'first_stack_generation', {
      stack_type: stackType,
      ...properties,
    })
  }

  async trackUpgrade(
    userId: string,
    fromTier: string,
    toTier: string,
    properties?: Record<string, any>
  ) {
    await this.track(userId, 'subscription_upgrade', {
      from_tier: fromTier,
      to_tier: toTier,
      ...properties,
    })
  }

  async trackChurn(
    userId: string,
    tier: string,
    reason?: string,
    properties?: Record<string, any>
  ) {
    await this.track(userId, 'subscription_churn', {
      tier,
      churn_reason: reason,
      ...properties,
    })
  }

  // API-specific events
  async trackAPICall(
    userId: string | null,
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number,
    properties?: Record<string, any>
  ) {
    const distinctId = userId || 'anonymous'
    
    await this.track(distinctId, 'api_call', {
      endpoint,
      method,
      status_code: statusCode,
      duration_ms: duration,
      ...properties,
    })
  }

  async trackStackGeneration(
    userId: string,
    selections: Record<string, any>,
    properties?: Record<string, any>
  ) {
    await this.track(userId, 'stack_generated', {
      ...selections,
      ...properties,
    })
  }

  async trackStackDownload(
    userId: string,
    projectName: string,
    stackType: string,
    properties?: Record<string, any>
  ) {
    await this.track(userId, 'stack_downloaded', {
      project_name: projectName,
      stack_type: stackType,
      ...properties,
    })
  }

  async trackError(
    userId: string | null,
    error: Error,
    context?: Record<string, any>
  ) {
    const distinctId = userId || 'anonymous'
    
    await this.track(distinctId, 'error_occurred', {
      error_message: error.message,
      error_stack: error.stack,
      ...context,
    })
  }

  // Usage tracking
  async trackUsageLimit(
    userId: string,
    limitType: 'generation' | 'conversation' | 'message',
    tier: string,
    properties?: Record<string, any>
  ) {
    await this.track(userId, 'usage_limit_reached', {
      limit_type: limitType,
      user_tier: tier,
      ...properties,
    })
  }

  async trackFeatureUsage(
    userId: string,
    feature: string,
    properties?: Record<string, any>
  ) {
    await this.track(userId, 'feature_used', {
      feature_name: feature,
      ...properties,
    })
  }

  // Flush events (useful for serverless functions)
  async flush() {
    if (!this.client) {
      return
    }

    await this.client.flush()
  }

  // Shutdown (cleanup)
  async shutdown() {
    if (!this.client) {
      return
    }

    await this.client.shutdown()
  }
}

// Export singleton instance
export const serverAnalytics = new ServerAnalytics()

// Utility function for API route analytics
export function withAnalytics<T extends (...args: any[]) => any>(
  handler: T,
  eventName?: string
): T {
  return (async (...args: any[]) => {
    const startTime = Date.now()
    let statusCode = 200
    let error: Error | null = null

    try {
      const result = await handler(...args)
      return result
    } catch (err) {
      error = err as Error
      statusCode = 500
      throw err
    } finally {
      const duration = Date.now() - startTime
      
      // Extract request info if available
      const req = args[0]
      const userId = req?.user?.id || null
      const endpoint = req?.url || 'unknown'
      const method = req?.method || 'unknown'

      // Track API call
      await serverAnalytics.trackAPICall(
        userId,
        endpoint,
        method,
        statusCode,
        duration,
        { event_name: eventName }
      )

      // Track error if occurred
      if (error) {
        await serverAnalytics.trackError(userId, error, {
          endpoint,
          method,
          event_name: eventName,
        })
      }
    }
  }) as T
}