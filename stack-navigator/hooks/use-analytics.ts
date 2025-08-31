'use client'

import { useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { analytics } from '@/lib/analytics/posthog-client'

export function useAnalytics() {
  const pathname = usePathname()

  // Initialize PostHog on mount
  useEffect(() => {
    analytics.initialize()
  }, [])

  // Track page views
  useEffect(() => {
    analytics.trackPageView(pathname)
  }, [pathname])

  // Tracking methods
  const track = useCallback((event: string, properties?: Record<string, any>) => {
    analytics.track(event, properties)
  }, [])

  const identify = useCallback((userId: string, properties?: Record<string, any>) => {
    analytics.identify(userId, properties)
  }, [])

  const trackSignup = useCallback((method: 'email' | 'google' | 'github', properties?: Record<string, any>) => {
    analytics.trackSignup(method, properties)
  }, [])

  const trackFirstGeneration = useCallback((stackType: string, properties?: Record<string, any>) => {
    analytics.trackFirstGeneration(stackType, properties)
  }, [])

  const trackUpgrade = useCallback((fromTier: string, toTier: string, properties?: Record<string, any>) => {
    analytics.trackUpgrade(fromTier, toTier, properties)
  }, [])

  const trackChurn = useCallback((tier: string, reason?: string, properties?: Record<string, any>) => {
    analytics.trackChurn(tier, reason, properties)
  }, [])

  const trackStackGeneration = useCallback((selections: Record<string, any>, properties?: Record<string, any>) => {
    analytics.trackStackGeneration(selections, properties)
  }, [])

  const trackStackDownload = useCallback((projectName: string, stackType: string, properties?: Record<string, any>) => {
    analytics.trackStackDownload(projectName, stackType, properties)
  }, [])

  const trackConversationStart = useCallback((properties?: Record<string, any>) => {
    analytics.trackConversationStart(properties)
  }, [])

  const trackConversationComplete = useCallback((messageCount: number, properties?: Record<string, any>) => {
    analytics.trackConversationComplete(messageCount, properties)
  }, [])

  const trackLimitReached = useCallback((limitType: 'generation' | 'conversation' | 'message', tier: string, properties?: Record<string, any>) => {
    analytics.trackLimitReached(limitType, tier, properties)
  }, [])

  const trackUpgradePromptShown = useCallback((trigger: string, properties?: Record<string, any>) => {
    analytics.trackUpgradePromptShown(trigger, properties)
  }, [])

  const trackUpgradePromptClicked = useCallback((action: 'upgrade' | 'dismiss', properties?: Record<string, any>) => {
    analytics.trackUpgradePromptClicked(action, properties)
  }, [])

  const trackError = useCallback((error: Error, context?: Record<string, any>) => {
    analytics.trackError(error, context)
  }, [])

  // Feature flags
  const isFeatureEnabled = useCallback((flag: string): boolean => {
    return analytics.isFeatureEnabled(flag)
  }, [])

  const getFeatureFlag = useCallback((flag: string): string | boolean | undefined => {
    return analytics.getFeatureFlag(flag)
  }, [])

  return {
    track,
    identify,
    trackSignup,
    trackFirstGeneration,
    trackUpgrade,
    trackChurn,
    trackStackGeneration,
    trackStackDownload,
    trackConversationStart,
    trackConversationComplete,
    trackLimitReached,
    trackUpgradePromptShown,
    trackUpgradePromptClicked,
    trackError,
    isFeatureEnabled,
    getFeatureFlag,
  }
}

// Server-side analytics for API routes
export function useServerAnalytics() {
  const track = useCallback((event: string, properties?: Record<string, any>) => {
    // For server-side tracking, we'll use PostHog Node.js client
    // This will be implemented in the server analytics utility
    console.log('Server analytics:', event, properties)
  }, [])

  return {
    track,
  }
}