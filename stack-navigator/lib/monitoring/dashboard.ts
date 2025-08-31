import { logger } from './logger'
import { PerformanceMonitor } from './error-handler'

export interface MetricData {
  name: string
  value: number
  timestamp: Date
  tags?: Record<string, string>
}

export interface HealthCheck {
  service: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime?: number
  error?: string
  lastCheck: Date
}

export class MonitoringDashboard {
  private static instance: MonitoringDashboard
  private metrics: MetricData[] = []
  private healthChecks: Map<string, HealthCheck> = new Map()
  
  private constructor() {}
  
  static getInstance(): MonitoringDashboard {
    if (!MonitoringDashboard.instance) {
      MonitoringDashboard.instance = new MonitoringDashboard()
    }
    return MonitoringDashboard.instance
  }
  
  // Metric collection
  recordMetric(name: string, value: number, tags?: Record<string, string>) {
    const metric: MetricData = {
      name,
      value,
      timestamp: new Date(),
      tags,
    }
    
    this.metrics.push(metric)
    
    // Keep only last 1000 metrics in memory
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }
    
    // Send to Sentry
    PerformanceMonitor.recordMetric(name, value, 'count', tags)
    
    // Log significant metrics
    if (this.isSignificantMetric(name, value)) {
      logger.info(`Metric recorded: ${name} = ${value}`, {
        component: 'monitoring',
        action: 'metric_recorded',
        metadata: { name, value, tags },
      })
    }
  }
  
  private isSignificantMetric(name: string, value: number): boolean {
    // Define which metrics should be logged
    const significantMetrics = [
      'user_signup',
      'stack_generation',
      'subscription_upgrade',
      'error_rate',
      'response_time_p95',
    ]
    
    return significantMetrics.some(metric => name.includes(metric))
  }
  
  // Health checks
  async performHealthCheck(service: string, checkFn: () => Promise<{ status: 'healthy' | 'degraded' | 'unhealthy', responseTime?: number, error?: string }>) {
    const startTime = Date.now()
    
    try {
      const result = await checkFn()
      const responseTime = Date.now() - startTime
      
      const healthCheck: HealthCheck = {
        service,
        status: result.status,
        responseTime: result.responseTime || responseTime,
        error: result.error,
        lastCheck: new Date(),
      }
      
      this.healthChecks.set(service, healthCheck)
      
      // Record metric
      this.recordMetric(`health_check.${service}`, result.status === 'healthy' ? 1 : 0, {
        service,
        status: result.status,
      })
      
      // Log unhealthy services
      if (result.status !== 'healthy') {
        logger.warn(`Health check failed for ${service}`, {
          component: 'monitoring',
          action: 'health_check_failed',
          metadata: {
            service,
            status: result.status,
            responseTime,
            error: result.error,
          },
        })
      }
      
      return healthCheck
    } catch (error) {
      const responseTime = Date.now() - startTime
      const healthCheck: HealthCheck = {
        service,
        status: 'unhealthy',
        responseTime,
        error: (error as Error).message,
        lastCheck: new Date(),
      }
      
      this.healthChecks.set(service, healthCheck)
      
      logger.error(`Health check error for ${service}`, error as Error, {
        component: 'monitoring',
        action: 'health_check_error',
        metadata: { service, responseTime },
      })
      
      return healthCheck
    }
  }
  
  // System health checks
  async checkDatabaseHealth(): Promise<HealthCheck> {
    return this.performHealthCheck('database', async () => {
      try {
        // Simple query to check database connectivity
        const response = await fetch('/api/health/database')
        const responseTime = Date.now()
        
        if (response.ok) {
          return { status: 'healthy', responseTime }
        } else {
          return { 
            status: 'degraded', 
            responseTime,
            error: `HTTP ${response.status}` 
          }
        }
      } catch (error) {
        return { 
          status: 'unhealthy', 
          error: (error as Error).message 
        }
      }
    })
  }
  
  async checkAIServiceHealth(): Promise<HealthCheck> {
    return this.performHealthCheck('ai_service', async () => {
      try {
        const response = await fetch('/api/health/ai')
        const responseTime = Date.now()
        
        if (response.ok) {
          return { status: 'healthy', responseTime }
        } else {
          return { 
            status: 'degraded', 
            responseTime,
            error: `HTTP ${response.status}` 
          }
        }
      } catch (error) {
        return { 
          status: 'unhealthy', 
          error: (error as Error).message 
        }
      }
    })
  }
  
  async checkStripeHealth(): Promise<HealthCheck> {
    return this.performHealthCheck('stripe', async () => {
      try {
        const response = await fetch('/api/health/stripe')
        const responseTime = Date.now()
        
        if (response.ok) {
          return { status: 'healthy', responseTime }
        } else {
          return { 
            status: 'degraded', 
            responseTime,
            error: `HTTP ${response.status}` 
          }
        }
      } catch (error) {
        return { 
          status: 'unhealthy', 
          error: (error as Error).message 
        }
      }
    })
  }
  
  // Performance tracking
  trackResponseTime(endpoint: string, duration: number, statusCode: number) {
    this.recordMetric('response_time', duration, {
      endpoint,
      status_code: statusCode.toString(),
    })
    
    // Track slow requests
    if (duration > 5000) { // 5 seconds
      logger.performanceIssue('response_time', duration, 5000, {
        component: 'api',
        action: 'slow_request',
        metadata: { endpoint, statusCode },
      })
    }
  }
  
  trackErrorRate(endpoint: string, isError: boolean) {
    this.recordMetric('request_count', 1, {
      endpoint,
      error: isError.toString(),
    })
  }
  
  trackUserAction(action: string, userId?: string) {
    this.recordMetric('user_action', 1, {
      action,
      user_id: userId || 'anonymous',
    })
  }
  
  // Data retrieval
  getMetrics(name?: string, since?: Date): MetricData[] {
    let filtered = this.metrics
    
    if (name) {
      filtered = filtered.filter(m => m.name === name)
    }
    
    if (since) {
      filtered = filtered.filter(m => m.timestamp >= since)
    }
    
    return filtered
  }
  
  getHealthChecks(): HealthCheck[] {
    return Array.from(this.healthChecks.values())
  }
  
  getSystemHealth(): { status: 'healthy' | 'degraded' | 'unhealthy', services: HealthCheck[] } {
    const services = this.getHealthChecks()
    
    if (services.length === 0) {
      return { status: 'healthy', services: [] }
    }
    
    const unhealthyServices = services.filter(s => s.status === 'unhealthy')
    const degradedServices = services.filter(s => s.status === 'degraded')
    
    let status: 'healthy' | 'degraded' | 'unhealthy'
    
    if (unhealthyServices.length > 0) {
      status = 'unhealthy'
    } else if (degradedServices.length > 0) {
      status = 'degraded'
    } else {
      status = 'healthy'
    }
    
    return { status, services }
  }
  
  // Alerting
  checkAlerts() {
    const recentMetrics = this.getMetrics(undefined, new Date(Date.now() - 5 * 60 * 1000)) // Last 5 minutes
    
    // Check error rate
    const errorMetrics = recentMetrics.filter(m => m.name === 'request_count' && m.tags?.error === 'true')
    const totalMetrics = recentMetrics.filter(m => m.name === 'request_count')
    
    if (totalMetrics.length > 0) {
      const errorRate = errorMetrics.length / totalMetrics.length
      if (errorRate > 0.1) { // 10% error rate
        logger.warn(`High error rate detected: ${(errorRate * 100).toFixed(2)}%`, {
          component: 'monitoring',
          action: 'alert_triggered',
          metadata: {
            alert_type: 'high_error_rate',
            error_rate: errorRate,
            total_requests: totalMetrics.length,
            error_requests: errorMetrics.length,
          },
        })
      }
    }
    
    // Check response times
    const responseTimeMetrics = recentMetrics.filter(m => m.name === 'response_time')
    if (responseTimeMetrics.length > 0) {
      const avgResponseTime = responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length
      if (avgResponseTime > 3000) { // 3 seconds
        logger.warn(`High average response time: ${avgResponseTime.toFixed(0)}ms`, {
          component: 'monitoring',
          action: 'alert_triggered',
          metadata: {
            alert_type: 'high_response_time',
            avg_response_time: avgResponseTime,
            sample_count: responseTimeMetrics.length,
          },
        })
      }
    }
  }
}

// Export singleton instance
export const monitoringDashboard = MonitoringDashboard.getInstance()

// Utility functions
export function recordMetric(name: string, value: number, tags?: Record<string, string>) {
  monitoringDashboard.recordMetric(name, value, tags)
}

export function trackResponseTime(endpoint: string, duration: number, statusCode: number) {
  monitoringDashboard.trackResponseTime(endpoint, duration, statusCode)
}

export function trackUserAction(action: string, userId?: string) {
  monitoringDashboard.trackUserAction(action, userId)
}