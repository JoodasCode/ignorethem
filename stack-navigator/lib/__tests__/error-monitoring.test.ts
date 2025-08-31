import { ErrorHandler, PerformanceMonitor } from '../monitoring/error-handler'
import { logger, Logger } from '../monitoring/logger'
import { monitoringDashboard } from '../monitoring/dashboard'

// Mock Sentry
jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn().mockReturnValue('test-event-id'),
  captureMessage: jest.fn().mockReturnValue('test-event-id'),
  setUser: jest.fn(),
  setContext: jest.fn(),
  setTags: jest.fn(),
  addBreadcrumb: jest.fn(),
  startTransaction: jest.fn().mockReturnValue({
    finish: jest.fn(),
    setStatus: jest.fn(),
  }),
  startSpan: jest.fn().mockImplementation((options, fn) => {
    if (fn) return fn()
    return { finish: jest.fn() }
  }),
  metrics: {
    gauge: jest.fn(),
    timing: jest.fn(),
    increment: jest.fn(),
  },
}))

describe('Error Monitoring System', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset console methods
    jest.spyOn(console, 'error').mockImplementation()
    jest.spyOn(console, 'warn').mockImplementation()
    jest.spyOn(console, 'info').mockImplementation()
    jest.spyOn(console, 'debug').mockImplementation()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('ErrorHandler', () => {
    it('should capture exceptions with context', () => {
      const error = new Error('Test error')
      const context = {
        userId: 'user123',
        component: 'ChatInterface',
        action: 'send_message',
        metadata: { messageId: 'msg123' },
      }

      const eventId = ErrorHandler.captureException(error, context)

      expect(eventId).toBe('test-event-id')
      expect(require('@sentry/nextjs').setUser).toHaveBeenCalledWith({ id: 'user123' })
      expect(require('@sentry/nextjs').setContext).toHaveBeenCalledWith('error_context', {
        component: 'ChatInterface',
        action: 'send_message',
        timestamp: expect.any(String),
        messageId: 'msg123',
      })
      expect(require('@sentry/nextjs').captureException).toHaveBeenCalledWith(error)
    })

    it('should capture messages with different levels', () => {
      const context = { component: 'API', action: 'validation' }

      ErrorHandler.captureMessage('Test warning', 'warning', context)

      expect(require('@sentry/nextjs').captureMessage).toHaveBeenCalledWith('Test warning', 'warning')
      expect(require('@sentry/nextjs').setContext).toHaveBeenCalledWith('message_context', {
        component: 'API',
        action: 'validation',
        timestamp: expect.any(String),
      })
    })

    it('should set and clear user context', () => {
      ErrorHandler.setUserContext('user123', 'test@example.com', 'starter')

      expect(require('@sentry/nextjs').setUser).toHaveBeenCalledWith({
        id: 'user123',
        email: 'test@example.com',
        subscription_tier: 'starter',
      })

      ErrorHandler.clearUserContext()

      expect(require('@sentry/nextjs').setUser).toHaveBeenCalledWith(null)
    })

    it('should add breadcrumbs', () => {
      ErrorHandler.addBreadcrumb('User clicked button', 'ui', 'info', { buttonId: 'submit' })

      expect(require('@sentry/nextjs').addBreadcrumb).toHaveBeenCalledWith({
        message: 'User clicked button',
        category: 'ui',
        level: 'info',
        data: { buttonId: 'submit' },
        timestamp: expect.any(Number),
      })
    })
  })

  describe('Logger', () => {
    it('should log messages at different levels', () => {
      const context = { component: 'TestComponent', userId: 'user123' }

      logger.debug('Debug message', context)
      logger.info('Info message', context)
      logger.warn('Warning message', context)
      logger.error('Error message', new Error('Test error'), context)

      expect(console.debug).toHaveBeenCalled()
      expect(console.info).toHaveBeenCalled()
      expect(console.warn).toHaveBeenCalled()
      expect(console.error).toHaveBeenCalled()
    })

    it('should respect log level configuration', () => {
      // Create new logger instance with WARN level
      process.env.LOG_LEVEL = 'WARN'
      const warnLogger = Logger.getInstance()

      warnLogger.debug('Debug message')
      warnLogger.info('Info message')
      warnLogger.warn('Warning message')

      // Debug and info should not be logged
      expect(console.debug).not.toHaveBeenCalled()
      expect(console.info).not.toHaveBeenCalled()
      expect(console.warn).toHaveBeenCalled()
    })

    it('should log API calls with performance metrics', () => {
      logger.apiCall('POST', '/api/generate', 200, 1500, {
        component: 'API',
        userId: 'user123',
      })

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('API POST /api/generate - 200 (1500ms)')
      )
    })

    it('should log user actions', () => {
      logger.userAction('stack_generation', 'user123', {
        component: 'Generator',
        metadata: { stackType: 'nextjs' },
      })

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('User action: stack_generation')
      )
    })

    it('should log security events as warnings', () => {
      logger.securityEvent('rate_limit_exceeded', 'user123', {
        component: 'RateLimit',
        metadata: { endpoint: '/api/chat' },
      })

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Security event: rate_limit_exceeded')
      )
    })

    it('should log performance issues', () => {
      logger.performanceIssue('response_time', 6000, 5000, {
        component: 'API',
        metadata: { endpoint: '/api/generate' },
      })

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Performance issue: response_time (6000) exceeded threshold (5000)')
      )
    })
  })

  describe('PerformanceMonitor', () => {
    it('should record metrics', () => {
      PerformanceMonitor.recordMetric('test_metric', 100, 'count', { tag: 'value' })

      expect(require('@sentry/nextjs').metrics.gauge).toHaveBeenCalledWith(
        'test_metric',
        100,
        {
          unit: 'count',
          tags: { tag: 'value' },
        }
      )
    })

    it('should record timing metrics', () => {
      PerformanceMonitor.recordTiming('api_response_time', 1500, { endpoint: '/api/chat' })

      expect(require('@sentry/nextjs').metrics.timing).toHaveBeenCalledWith(
        'api_response_time',
        1500,
        'millisecond',
        { endpoint: '/api/chat' }
      )
    })

    it('should record counter metrics', () => {
      PerformanceMonitor.recordCounter('user_signup', 1, { method: 'email' })

      expect(require('@sentry/nextjs').metrics.increment).toHaveBeenCalledWith(
        'user_signup',
        1,
        { method: 'email' }
      )
    })

    it('should measure async functions', async () => {
      const mockFn = jest.fn().mockResolvedValue('result')
      
      const result = await PerformanceMonitor.measureAsync('test_operation', mockFn, 'database')

      expect(result).toBe('result')
      expect(mockFn).toHaveBeenCalled()
      expect(require('@sentry/nextjs').startSpan).toHaveBeenCalledWith(
        {
          name: 'test_operation',
          op: 'database',
        },
        mockFn
      )
    })
  })

  describe('MonitoringDashboard', () => {
    it('should record metrics', () => {
      monitoringDashboard.recordMetric('test_metric', 42, { tag: 'test' })

      const metrics = monitoringDashboard.getMetrics('test_metric')
      expect(metrics).toHaveLength(1)
      expect(metrics[0]).toMatchObject({
        name: 'test_metric',
        value: 42,
        tags: { tag: 'test' },
      })
    })

    it('should track response times', () => {
      monitoringDashboard.trackResponseTime('/api/chat', 1200, 200)

      const metrics = monitoringDashboard.getMetrics('response_time')
      expect(metrics).toHaveLength(1)
      expect(metrics[0]).toMatchObject({
        name: 'response_time',
        value: 1200,
        tags: {
          endpoint: '/api/chat',
          status_code: '200',
        },
      })
    })

    it('should track user actions', () => {
      monitoringDashboard.trackUserAction('stack_generation', 'user123')

      const metrics = monitoringDashboard.getMetrics('user_action')
      expect(metrics).toHaveLength(1)
      expect(metrics[0]).toMatchObject({
        name: 'user_action',
        value: 1,
        tags: {
          action: 'stack_generation',
          user_id: 'user123',
        },
      })
    })

    it('should perform health checks', async () => {
      const mockHealthCheck = jest.fn().mockResolvedValue({
        status: 'healthy',
        responseTime: 100,
      })

      const result = await monitoringDashboard.performHealthCheck('test_service', mockHealthCheck)

      expect(result).toMatchObject({
        service: 'test_service',
        status: 'healthy',
        responseTime: 100,
        lastCheck: expect.any(Date),
      })
      expect(mockHealthCheck).toHaveBeenCalled()
    })

    it('should handle health check failures', async () => {
      const mockHealthCheck = jest.fn().mockRejectedValue(new Error('Service unavailable'))

      const result = await monitoringDashboard.performHealthCheck('test_service', mockHealthCheck)

      expect(result).toMatchObject({
        service: 'test_service',
        status: 'unhealthy',
        error: 'Service unavailable',
        lastCheck: expect.any(Date),
      })
    })

    it('should get system health status', () => {
      // Add some health checks
      monitoringDashboard.performHealthCheck('service1', () => Promise.resolve({ status: 'healthy' }))
      monitoringDashboard.performHealthCheck('service2', () => Promise.resolve({ status: 'degraded' }))

      setTimeout(() => {
        const systemHealth = monitoringDashboard.getSystemHealth()
        expect(systemHealth.status).toBe('degraded') // Degraded because one service is degraded
        expect(systemHealth.services).toHaveLength(2)
      }, 100)
    })

    it('should filter metrics by name and date', () => {
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

      monitoringDashboard.recordMetric('metric1', 10)
      monitoringDashboard.recordMetric('metric2', 20)

      const metric1Results = monitoringDashboard.getMetrics('metric1')
      expect(metric1Results).toHaveLength(1)
      expect(metric1Results[0].name).toBe('metric1')

      const recentResults = monitoringDashboard.getMetrics(undefined, oneHourAgo)
      expect(recentResults.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Integration', () => {
    it('should integrate error handling with analytics', () => {
      const error = new Error('Integration test error')
      const context = {
        userId: 'user123',
        component: 'Integration',
        action: 'test',
      }

      ErrorHandler.captureException(error, context)

      // Should capture in Sentry
      expect(require('@sentry/nextjs').captureException).toHaveBeenCalledWith(error)
      
      // Should set user context
      expect(require('@sentry/nextjs').setUser).toHaveBeenCalledWith({ id: 'user123' })
    })

    it('should log performance issues and send to monitoring', () => {
      const slowResponseTime = 6000
      
      monitoringDashboard.trackResponseTime('/api/slow', slowResponseTime, 200)
      
      // Should record metric
      const metrics = monitoringDashboard.getMetrics('response_time')
      expect(metrics).toHaveLength(1)
      
      // Should log performance warning
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('High average response time')
      )
    })
  })
})