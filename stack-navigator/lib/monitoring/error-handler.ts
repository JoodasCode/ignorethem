import * as Sentry from '@sentry/nextjs'
import { analytics } from '@/lib/analytics/posthog-client'
import { serverAnalytics } from '@/lib/analytics/server-analytics'

export interface ErrorContext {
  userId?: string
  component?: string
  action?: string
  metadata?: Record<string, any>
}

export class ErrorHandler {
  static captureException(error: Error, context?: ErrorContext) {
    // Set user context if available
    if (context?.userId) {
      Sentry.setUser({ id: context.userId })
    }
    
    // Set additional context
    Sentry.setContext('error_context', {
      component: context?.component,
      action: context?.action,
      timestamp: new Date().toISOString(),
      ...context?.metadata,
    })
    
    // Set tags for better filtering
    Sentry.setTags({
      component: context?.component || 'unknown',
      action: context?.action || 'unknown',
    })
    
    // Capture the exception
    const eventId = Sentry.captureException(error)
    
    // Also track in PostHog for analytics
    if (typeof window !== 'undefined') {
      analytics.trackError(error, context)
    }
    
    return eventId
  }
  
  static captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext) {
    // Set user context if available
    if (context?.userId) {
      Sentry.setUser({ id: context.userId })
    }
    
    // Set additional context
    Sentry.setContext('message_context', {
      component: context?.component,
      action: context?.action,
      timestamp: new Date().toISOString(),
      ...context?.metadata,
    })
    
    const eventId = Sentry.captureMessage(message, level)
    
    return eventId
  }
  
  static async captureServerException(error: Error, context?: ErrorContext) {
    // Set user context if available
    if (context?.userId) {
      Sentry.setUser({ id: context.userId })
    }
    
    // Set additional context
    Sentry.setContext('server_error_context', {
      component: context?.component,
      action: context?.action,
      timestamp: new Date().toISOString(),
      ...context?.metadata,
    })
    
    // Capture the exception
    const eventId = Sentry.captureException(error)
    
    // Also track in PostHog server analytics
    await serverAnalytics.trackError(context?.userId || null, error, context)
    
    return eventId
  }
  
  static setUserContext(userId: string, email?: string, tier?: string) {
    Sentry.setUser({
      id: userId,
      email,
      subscription_tier: tier,
    })
  }
  
  static clearUserContext() {
    Sentry.setUser(null)
  }
  
  static addBreadcrumb(message: string, category?: string, level?: 'info' | 'warning' | 'error', data?: Record<string, any>) {
    Sentry.addBreadcrumb({
      message,
      category: category || 'custom',
      level: level || 'info',
      data,
      timestamp: Date.now() / 1000,
    })
  }
  
  static startTransaction(name: string, op?: string) {
    return Sentry.startTransaction({
      name,
      op: op || 'custom',
    })
  }
  
  static withErrorBoundary<T extends React.ComponentType<any>>(
    Component: T,
    errorBoundaryOptions?: {
      fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
      onError?: (error: Error, errorInfo: React.ErrorInfo) => void
    }
  ): T {
    return Sentry.withErrorBoundary(Component, {
      fallback: errorBoundaryOptions?.fallback || DefaultErrorFallback,
      beforeCapture: (scope, error, errorInfo) => {
        scope.setContext('react_error_info', errorInfo)
        scope.setTag('error_boundary', 'react')
      },
      onError: errorBoundaryOptions?.onError,
    })
  }
}

// Default error fallback component
function DefaultErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="text-center max-w-md">
        <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground mb-4">
          We've been notified about this error and are working on a fix.
        </p>
        <details className="mb-4 text-left">
          <summary className="cursor-pointer text-sm text-muted-foreground">
            Error details
          </summary>
          <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
            {error.message}
          </pre>
        </details>
        <button
          onClick={resetError}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    </div>
  )
}

// API route error handler
export function withErrorHandling<T extends (...args: any[]) => any>(
  handler: T,
  context?: Omit<ErrorContext, 'userId'>
): T {
  return (async (...args: any[]) => {
    try {
      return await handler(...args)
    } catch (error) {
      const req = args[0]
      const userId = req?.user?.id || req?.headers?.['x-user-id']
      
      await ErrorHandler.captureServerException(error as Error, {
        ...context,
        userId,
        metadata: {
          url: req?.url,
          method: req?.method,
          userAgent: req?.headers?.['user-agent'],
          ...context?.metadata,
        },
      })
      
      throw error
    }
  }) as T
}

// Performance monitoring utilities
export class PerformanceMonitor {
  static startSpan(name: string, op?: string) {
    return Sentry.startSpan({
      name,
      op: op || 'custom',
    }, () => {})
  }
  
  static measureAsync<T>(name: string, fn: () => Promise<T>, op?: string): Promise<T> {
    return Sentry.startSpan({
      name,
      op: op || 'function',
    }, fn)
  }
  
  static measure<T>(name: string, fn: () => T, op?: string): T {
    return Sentry.startSpan({
      name,
      op: op || 'function',
    }, fn)
  }
  
  static recordMetric(name: string, value: number, unit?: string, tags?: Record<string, string>) {
    Sentry.metrics.gauge(name, value, {
      unit: unit || 'none',
      tags,
    })
  }
  
  static recordTiming(name: string, duration: number, tags?: Record<string, string>) {
    Sentry.metrics.timing(name, duration, 'millisecond', tags)
  }
  
  static recordCounter(name: string, value: number = 1, tags?: Record<string, string>) {
    Sentry.metrics.increment(name, value, tags)
  }
}