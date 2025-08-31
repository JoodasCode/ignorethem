import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Session replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Environment configuration
  environment: process.env.NODE_ENV,
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION,
  
  // Error filtering
  beforeSend(event, hint) {
    // Filter out development errors
    if (process.env.NODE_ENV === 'development') {
      console.error('Sentry Error:', hint.originalException || hint.syntheticException)
    }
    
    // Filter out known non-critical errors
    const error = hint.originalException
    if (error && error instanceof Error) {
      // Skip network errors that are likely user-related
      if (error.message.includes('NetworkError') || 
          error.message.includes('Failed to fetch') ||
          error.message.includes('Load failed')) {
        return null
      }
      
      // Skip ResizeObserver errors (common browser quirk)
      if (error.message.includes('ResizeObserver loop limit exceeded')) {
        return null
      }
    }
    
    return event
  },
  
  // User context
  initialScope: {
    tags: {
      component: 'client',
    },
  },
  
  // Integration configuration
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
})