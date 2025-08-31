'use client'

import React, { createContext, useContext, useEffect, ReactNode } from 'react'
import { analytics } from '@/lib/analytics/posthog-client'
import { useAuth } from '@/hooks/use-auth'

interface AnalyticsContextType {
  initialized: boolean
}

const AnalyticsContext = createContext<AnalyticsContextType>({
  initialized: false,
})

export function useAnalyticsContext() {
  return useContext(AnalyticsContext)
}

interface AnalyticsProviderProps {
  children: ReactNode
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const { user } = useAuth()

  useEffect(() => {
    // Initialize PostHog
    analytics.initialize()
  }, [])

  useEffect(() => {
    // Identify user when they sign in
    if (user) {
      analytics.identify(user.id, {
        email: user.email,
        created_at: user.created_at,
      })
    } else {
      // Reset analytics when user signs out
      analytics.reset()
    }
  }, [user])

  return (
    <AnalyticsContext.Provider value={{ initialized: true }}>
      {children}
    </AnalyticsContext.Provider>
  )
}

// Error boundary with analytics
interface AnalyticsErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

export class AnalyticsErrorBoundary extends React.Component<
  AnalyticsErrorBoundaryProps,
  { hasError: boolean }
> {
  constructor(props: AnalyticsErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Track error with PostHog
    analytics.trackError(error, {
      component_stack: errorInfo.componentStack,
      error_boundary: 'AnalyticsErrorBoundary',
    })
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4">
              We've been notified and are working on a fix.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}