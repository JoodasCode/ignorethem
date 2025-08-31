import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Environment configuration
  environment: process.env.NODE_ENV,
  
  // Release tracking
  release: process.env.APP_VERSION,
  
  // Error filtering
  beforeSend(event, hint) {
    // Filter out development errors
    if (process.env.NODE_ENV === 'development') {
      console.error('Sentry Server Error:', hint.originalException || hint.syntheticException)
    }
    
    // Filter out known non-critical errors
    const error = hint.originalException
    if (error && error instanceof Error) {
      // Skip database connection timeouts (handled gracefully)
      if (error.message.includes('connection timeout') ||
          error.message.includes('ECONNRESET')) {
        return null
      }
      
      // Skip rate limiting errors (expected behavior)
      if (error.message.includes('Rate limit exceeded')) {
        return null
      }
    }
    
    return event
  },
  
  // User context
  initialScope: {
    tags: {
      component: 'server',
    },
  },
})