'use client'

import React, { Component, ReactNode } from 'react'
import { ErrorHandler } from '@/lib/monitoring/error-handler'
import { logger } from '@/lib/monitoring/logger'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  component?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error
    logger.error('React Error Boundary caught error', error, {
      component: this.props.component || 'ErrorBoundary',
      action: 'component_error',
      metadata: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
      },
    })

    // Capture in Sentry
    ErrorHandler.captureException(error, {
      component: this.props.component || 'ErrorBoundary',
      action: 'component_error',
      metadata: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
      },
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    this.setState({ errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <DefaultErrorFallback
          error={this.state.error}
          resetError={this.handleReset}
          component={this.props.component}
        />
      )
    }

    return this.props.children
  }
}

interface DefaultErrorFallbackProps {
  error?: Error
  resetError: () => void
  component?: string
}

function DefaultErrorFallback({ error, resetError, component }: DefaultErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
        </div>
        
        <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
        
        <p className="text-muted-foreground mb-4">
          {component 
            ? `There was an error in the ${component} component.`
            : 'An unexpected error occurred.'
          } We've been notified and are working on a fix.
        </p>

        {isDevelopment && error && (
          <details className="mb-4 text-left">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              Error details (development only)
            </summary>
            <div className="mt-2 p-3 bg-muted rounded-md">
              <pre className="text-xs overflow-auto whitespace-pre-wrap">
                <strong>Error:</strong> {error.message}
                {error.stack && (
                  <>
                    <br />
                    <strong>Stack:</strong>
                    <br />
                    {error.stack}
                  </>
                )}
              </pre>
            </div>
          </details>
        )}

        <div className="flex gap-2 justify-center">
          <Button onClick={resetError} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try again
          </Button>
          
          <Button 
            onClick={() => window.location.reload()} 
            variant="default"
          >
            Reload page
          </Button>
        </div>
      </div>
    </div>
  )
}

// Specific error boundaries for different parts of the app
export function ChatErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      component="ChatInterface"
      fallback={
        <div className="flex items-center justify-center h-64 border rounded-lg">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Chat interface encountered an error. Please refresh to continue.
            </p>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

export function GeneratorErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      component="CodeGenerator"
      fallback={
        <div className="flex items-center justify-center h-64 border rounded-lg">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Code generator encountered an error. Please try generating again.
            </p>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

export function DashboardErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      component="Dashboard"
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Dashboard encountered an error. Please refresh to continue.
            </p>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}