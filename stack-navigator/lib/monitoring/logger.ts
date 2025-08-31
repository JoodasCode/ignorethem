import { ErrorHandler } from './error-handler'

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogContext {
  userId?: string
  component?: string
  action?: string
  requestId?: string
  metadata?: Record<string, any>
}

export class Logger {
  private static instance: Logger
  private logLevel: LogLevel
  
  private constructor() {
    this.logLevel = this.getLogLevel()
  }
  
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }
  
  private getLogLevel(): LogLevel {
    const level = process.env.LOG_LEVEL?.toUpperCase() || 'INFO'
    switch (level) {
      case 'DEBUG':
        return LogLevel.DEBUG
      case 'INFO':
        return LogLevel.INFO
      case 'WARN':
        return LogLevel.WARN
      case 'ERROR':
        return LogLevel.ERROR
      default:
        return LogLevel.INFO
    }
  }
  
  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel
  }
  
  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` [${JSON.stringify(context)}]` : ''
    return `[${timestamp}] ${level}: ${message}${contextStr}`
  }
  
  private log(level: LogLevel, levelName: string, message: string, context?: LogContext, error?: Error) {
    if (!this.shouldLog(level)) {
      return
    }
    
    const formattedMessage = this.formatMessage(levelName, message, context)
    
    // Console output
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage)
        break
      case LogLevel.INFO:
        console.info(formattedMessage)
        break
      case LogLevel.WARN:
        console.warn(formattedMessage)
        break
      case LogLevel.ERROR:
        console.error(formattedMessage, error)
        break
    }
    
    // Add breadcrumb for Sentry
    ErrorHandler.addBreadcrumb(message, context?.component, levelName.toLowerCase() as any, {
      ...context,
      level: levelName,
    })
    
    // Send to Sentry for warnings and errors
    if (level >= LogLevel.WARN) {
      if (error) {
        ErrorHandler.captureException(error, context)
      } else {
        ErrorHandler.captureMessage(message, levelName.toLowerCase() as any, context)
      }
    }
  }
  
  debug(message: string, context?: LogContext) {
    this.log(LogLevel.DEBUG, 'DEBUG', message, context)
  }
  
  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, 'INFO', message, context)
  }
  
  warn(message: string, context?: LogContext) {
    this.log(LogLevel.WARN, 'WARN', message, context)
  }
  
  error(message: string, error?: Error, context?: LogContext) {
    this.log(LogLevel.ERROR, 'ERROR', message, context, error)
  }
  
  // Specific logging methods for common scenarios
  apiCall(method: string, url: string, statusCode: number, duration: number, context?: LogContext) {
    this.info(`API ${method} ${url} - ${statusCode} (${duration}ms)`, {
      ...context,
      component: 'api',
      action: 'request',
      metadata: {
        method,
        url,
        statusCode,
        duration,
        ...context?.metadata,
      },
    })
  }
  
  userAction(action: string, userId: string, context?: LogContext) {
    this.info(`User action: ${action}`, {
      ...context,
      userId,
      component: 'user',
      action,
    })
  }
  
  stackGeneration(userId: string, selections: Record<string, any>, duration: number, context?: LogContext) {
    this.info('Stack generation completed', {
      ...context,
      userId,
      component: 'generator',
      action: 'generate',
      metadata: {
        selections,
        duration,
        ...context?.metadata,
      },
    })
  }
  
  subscriptionEvent(event: string, userId: string, tier: string, context?: LogContext) {
    this.info(`Subscription event: ${event}`, {
      ...context,
      userId,
      component: 'subscription',
      action: event,
      metadata: {
        tier,
        ...context?.metadata,
      },
    })
  }
  
  aiInteraction(userId: string, messageCount: number, duration: number, context?: LogContext) {
    this.info('AI conversation completed', {
      ...context,
      userId,
      component: 'ai',
      action: 'conversation',
      metadata: {
        messageCount,
        duration,
        ...context?.metadata,
      },
    })
  }
  
  securityEvent(event: string, userId?: string, context?: LogContext) {
    this.warn(`Security event: ${event}`, {
      ...context,
      userId,
      component: 'security',
      action: event,
    })
  }
  
  performanceIssue(metric: string, value: number, threshold: number, context?: LogContext) {
    this.warn(`Performance issue: ${metric} (${value}) exceeded threshold (${threshold})`, {
      ...context,
      component: 'performance',
      action: 'threshold_exceeded',
      metadata: {
        metric,
        value,
        threshold,
        ...context?.metadata,
      },
    })
  }
}

// Export singleton instance
export const logger = Logger.getInstance()

// Utility functions for common logging patterns
export function logApiCall(method: string, url: string, statusCode: number, duration: number, context?: LogContext) {
  logger.apiCall(method, url, statusCode, duration, context)
}

export function logUserAction(action: string, userId: string, context?: LogContext) {
  logger.userAction(action, userId, context)
}

export function logError(message: string, error?: Error, context?: LogContext) {
  logger.error(message, error, context)
}

export function logInfo(message: string, context?: LogContext) {
  logger.info(message, context)
}

export function logWarn(message: string, context?: LogContext) {
  logger.warn(message, context)
}

export function logDebug(message: string, context?: LogContext) {
  logger.debug(message, context)
}

// Request logging middleware
export function createRequestLogger(component: string) {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now()
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Add request ID to headers
    res.setHeader('x-request-id', requestId)
    
    // Log request start
    logger.debug(`Request started: ${req.method} ${req.url}`, {
      component,
      action: 'request_start',
      requestId,
      metadata: {
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection.remoteAddress,
      },
    })
    
    // Override res.end to log completion
    const originalEnd = res.end
    res.end = function(...args: any[]) {
      const duration = Date.now() - startTime
      
      logger.apiCall(req.method, req.url, res.statusCode, duration, {
        component,
        requestId,
        userId: req.user?.id,
      })
      
      originalEnd.apply(res, args)
    }
    
    next()
  }
}