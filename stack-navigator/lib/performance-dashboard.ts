/**
 * Performance Dashboard and Monitoring
 * Provides real-time performance metrics and monitoring capabilities
 */

export interface PerformanceMetric {
  operation: string
  duration: number
  timestamp: Date
  memoryUsage?: number
  success: boolean
  metadata?: Record<string, any>
}

export interface PerformanceReport {
  totalOperations: number
  averageDuration: number
  medianDuration: number
  p95Duration: number
  p99Duration: number
  successRate: number
  memoryUsage: {
    average: number
    peak: number
    growth: number
  }
  slowestOperations: PerformanceMetric[]
  failedOperations: PerformanceMetric[]
  recommendations: string[]
}

export class PerformanceDashboard {
  private metrics: PerformanceMetric[] = []
  private maxMetrics: number = 10000
  private baselineMemory: number = 0

  constructor(maxMetrics: number = 10000) {
    this.maxMetrics = maxMetrics
    this.setBaselineMemory()
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric)
    
    // Prevent memory leaks by limiting stored metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }
  }

  /**
   * Record operation timing
   */
  recordOperation(
    operation: string,
    duration: number,
    success: boolean = true,
    metadata?: Record<string, any>
  ): void {
    const memoryUsage = this.getCurrentMemoryUsage()
    
    this.recordMetric({
      operation,
      duration,
      timestamp: new Date(),
      memoryUsage,
      success,
      metadata
    })
  }

  /**
   * Generate comprehensive performance report
   */
  generateReport(timeWindow?: { start: Date; end: Date }): PerformanceReport {
    let filteredMetrics = this.metrics
    
    if (timeWindow) {
      filteredMetrics = this.metrics.filter(m => 
        m.timestamp >= timeWindow.start && m.timestamp <= timeWindow.end
      )
    }

    if (filteredMetrics.length === 0) {
      return this.getEmptyReport()
    }

    const durations = filteredMetrics.map(m => m.duration).sort((a, b) => a - b)
    const successfulOperations = filteredMetrics.filter(m => m.success)
    const failedOperations = filteredMetrics.filter(m => !m.success)
    const memoryUsages = filteredMetrics
      .map(m => m.memoryUsage)
      .filter(m => m !== undefined) as number[]

    return {
      totalOperations: filteredMetrics.length,
      averageDuration: this.calculateAverage(durations),
      medianDuration: this.calculatePercentile(durations, 50),
      p95Duration: this.calculatePercentile(durations, 95),
      p99Duration: this.calculatePercentile(durations, 99),
      successRate: (successfulOperations.length / filteredMetrics.length) * 100,
      memoryUsage: {
        average: this.calculateAverage(memoryUsages),
        peak: Math.max(...memoryUsages, 0),
        growth: this.calculateMemoryGrowth(memoryUsages)
      },
      slowestOperations: this.getSlowestOperations(filteredMetrics, 10),
      failedOperations: failedOperations.slice(-10),
      recommendations: this.generateRecommendations(filteredMetrics)
    }
  }

  /**
   * Get real-time performance statistics
   */
  getRealTimeStats(): {
    recentOperations: number
    averageResponseTime: number
    currentThroughput: number
    errorRate: number
  } {
    const now = new Date()
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000)
    
    const recentMetrics = this.metrics.filter(m => m.timestamp >= oneMinuteAgo)
    const recentDurations = recentMetrics.map(m => m.duration)
    const recentErrors = recentMetrics.filter(m => !m.success)

    return {
      recentOperations: recentMetrics.length,
      averageResponseTime: this.calculateAverage(recentDurations),
      currentThroughput: recentMetrics.length / 60, // operations per second
      errorRate: recentMetrics.length > 0 ? (recentErrors.length / recentMetrics.length) * 100 : 0
    }
  }

  /**
   * Get performance trends over time
   */
  getPerformanceTrends(intervalMinutes: number = 5): {
    timestamps: Date[]
    averageDurations: number[]
    throughput: number[]
    errorRates: number[]
  } {
    const now = new Date()
    const intervals: Date[] = []
    const averageDurations: number[] = []
    const throughput: number[] = []
    const errorRates: number[] = []

    // Generate time intervals
    for (let i = 12; i >= 0; i--) {
      const intervalStart = new Date(now.getTime() - i * intervalMinutes * 60 * 1000)
      const intervalEnd = new Date(now.getTime() - (i - 1) * intervalMinutes * 60 * 1000)
      
      const intervalMetrics = this.metrics.filter(m => 
        m.timestamp >= intervalStart && m.timestamp < intervalEnd
      )

      intervals.push(intervalStart)
      
      if (intervalMetrics.length > 0) {
        const durations = intervalMetrics.map(m => m.duration)
        const errors = intervalMetrics.filter(m => !m.success)
        
        averageDurations.push(this.calculateAverage(durations))
        throughput.push(intervalMetrics.length / (intervalMinutes * 60))
        errorRates.push((errors.length / intervalMetrics.length) * 100)
      } else {
        averageDurations.push(0)
        throughput.push(0)
        errorRates.push(0)
      }
    }

    return {
      timestamps: intervals,
      averageDurations,
      throughput,
      errorRates
    }
  }

  /**
   * Detect performance anomalies
   */
  detectAnomalies(): {
    slowOperations: PerformanceMetric[]
    memoryLeaks: boolean
    highErrorRate: boolean
    degradingPerformance: boolean
  } {
    const recentMetrics = this.getRecentMetrics(300) // Last 5 minutes
    const historicalMetrics = this.getHistoricalMetrics(1800, 300) // 30 minutes ago to 5 minutes ago

    return {
      slowOperations: this.detectSlowOperations(recentMetrics),
      memoryLeaks: this.detectMemoryLeaks(recentMetrics),
      highErrorRate: this.detectHighErrorRate(recentMetrics),
      degradingPerformance: this.detectPerformanceDegradation(recentMetrics, historicalMetrics)
    }
  }

  /**
   * Export performance data for analysis
   */
  exportData(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      return this.exportToCsv()
    }
    
    return JSON.stringify({
      metrics: this.metrics,
      report: this.generateReport(),
      realTimeStats: this.getRealTimeStats(),
      trends: this.getPerformanceTrends(),
      anomalies: this.detectAnomalies()
    }, null, 2)
  }

  /**
   * Clear old metrics to free memory
   */
  cleanup(olderThanHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000)
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoffTime)
  }

  // Private helper methods

  private setBaselineMemory(): void {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      this.baselineMemory = process.memoryUsage().heapUsed
    }
  }

  private getCurrentMemoryUsage(): number | undefined {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return Math.round(process.memoryUsage().heapUsed / 1024 / 1024) // MB
    }
    return undefined
  }

  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0
    return numbers.reduce((a, b) => a + b, 0) / numbers.length
  }

  private calculatePercentile(sortedNumbers: number[], percentile: number): number {
    if (sortedNumbers.length === 0) return 0
    const index = Math.ceil((percentile / 100) * sortedNumbers.length) - 1
    return sortedNumbers[Math.max(0, index)]
  }

  private calculateMemoryGrowth(memoryUsages: number[]): number {
    if (memoryUsages.length < 2) return 0
    const first = memoryUsages[0]
    const last = memoryUsages[memoryUsages.length - 1]
    return last - first
  }

  private getSlowestOperations(metrics: PerformanceMetric[], count: number): PerformanceMetric[] {
    return metrics
      .sort((a, b) => b.duration - a.duration)
      .slice(0, count)
  }

  private generateRecommendations(metrics: PerformanceMetric[]): string[] {
    const recommendations: string[] = []
    const durations = metrics.map(m => m.duration)
    const avgDuration = this.calculateAverage(durations)
    const p95Duration = this.calculatePercentile(durations.sort((a, b) => a - b), 95)
    const errorRate = (metrics.filter(m => !m.success).length / metrics.length) * 100

    if (avgDuration > 2000) {
      recommendations.push('Average response time is high (>2s). Consider optimizing slow operations.')
    }

    if (p95Duration > 5000) {
      recommendations.push('95th percentile response time is very high (>5s). Investigate slowest operations.')
    }

    if (errorRate > 5) {
      recommendations.push(`Error rate is high (${errorRate.toFixed(1)}%). Review failed operations and implement better error handling.`)
    }

    const memoryUsages = metrics
      .map(m => m.memoryUsage)
      .filter(m => m !== undefined) as number[]
    
    if (memoryUsages.length > 0) {
      const memoryGrowth = this.calculateMemoryGrowth(memoryUsages)
      if (memoryGrowth > 100) {
        recommendations.push(`Memory usage increased by ${memoryGrowth}MB. Check for memory leaks.`)
      }
    }

    // Operation-specific recommendations
    const operationStats = this.getOperationStats(metrics)
    for (const [operation, stats] of Object.entries(operationStats)) {
      if (stats.averageDuration > 3000) {
        recommendations.push(`Operation "${operation}" is consistently slow (${stats.averageDuration.toFixed(0)}ms avg). Consider optimization.`)
      }
      if (stats.errorRate > 10) {
        recommendations.push(`Operation "${operation}" has high error rate (${stats.errorRate.toFixed(1)}%). Review implementation.`)
      }
    }

    return recommendations
  }

  private getOperationStats(metrics: PerformanceMetric[]): Record<string, {
    count: number
    averageDuration: number
    errorRate: number
  }> {
    const stats: Record<string, {
      durations: number[]
      errors: number
      total: number
    }> = {}

    for (const metric of metrics) {
      if (!stats[metric.operation]) {
        stats[metric.operation] = { durations: [], errors: 0, total: 0 }
      }
      
      stats[metric.operation].durations.push(metric.duration)
      stats[metric.operation].total++
      
      if (!metric.success) {
        stats[metric.operation].errors++
      }
    }

    const result: Record<string, {
      count: number
      averageDuration: number
      errorRate: number
    }> = {}

    for (const [operation, data] of Object.entries(stats)) {
      result[operation] = {
        count: data.total,
        averageDuration: this.calculateAverage(data.durations),
        errorRate: (data.errors / data.total) * 100
      }
    }

    return result
  }

  private getRecentMetrics(seconds: number): PerformanceMetric[] {
    const cutoff = new Date(Date.now() - seconds * 1000)
    return this.metrics.filter(m => m.timestamp >= cutoff)
  }

  private getHistoricalMetrics(secondsAgo: number, duration: number): PerformanceMetric[] {
    const end = new Date(Date.now() - secondsAgo * 1000)
    const start = new Date(end.getTime() - duration * 1000)
    return this.metrics.filter(m => m.timestamp >= start && m.timestamp <= end)
  }

  private detectSlowOperations(metrics: PerformanceMetric[]): PerformanceMetric[] {
    const durations = metrics.map(m => m.duration).sort((a, b) => a - b)
    const p95 = this.calculatePercentile(durations, 95)
    return metrics.filter(m => m.duration > Math.max(p95, 5000))
  }

  private detectMemoryLeaks(metrics: PerformanceMetric[]): boolean {
    const memoryUsages = metrics
      .map(m => m.memoryUsage)
      .filter(m => m !== undefined) as number[]
    
    if (memoryUsages.length < 10) return false
    
    const growth = this.calculateMemoryGrowth(memoryUsages)
    return growth > 200 // More than 200MB growth
  }

  private detectHighErrorRate(metrics: PerformanceMetric[]): boolean {
    if (metrics.length === 0) return false
    const errorRate = (metrics.filter(m => !m.success).length / metrics.length) * 100
    return errorRate > 10
  }

  private detectPerformanceDegradation(
    recentMetrics: PerformanceMetric[],
    historicalMetrics: PerformanceMetric[]
  ): boolean {
    if (recentMetrics.length === 0 || historicalMetrics.length === 0) return false
    
    const recentAvg = this.calculateAverage(recentMetrics.map(m => m.duration))
    const historicalAvg = this.calculateAverage(historicalMetrics.map(m => m.duration))
    
    return recentAvg > historicalAvg * 1.5 // 50% slower than historical average
  }

  private getEmptyReport(): PerformanceReport {
    return {
      totalOperations: 0,
      averageDuration: 0,
      medianDuration: 0,
      p95Duration: 0,
      p99Duration: 0,
      successRate: 0,
      memoryUsage: { average: 0, peak: 0, growth: 0 },
      slowestOperations: [],
      failedOperations: [],
      recommendations: ['No performance data available. Start recording metrics to see recommendations.']
    }
  }

  private exportToCsv(): string {
    const headers = ['timestamp', 'operation', 'duration', 'success', 'memoryUsage', 'metadata']
    const rows = this.metrics.map(m => [
      m.timestamp.toISOString(),
      m.operation,
      m.duration.toString(),
      m.success.toString(),
      m.memoryUsage?.toString() || '',
      JSON.stringify(m.metadata || {})
    ])

    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }
}

// Global performance dashboard instance
export const performanceDashboard = new PerformanceDashboard()

// Helper function to wrap operations with performance monitoring
export function withPerformanceMonitoring<T extends (...args: any[]) => Promise<any>>(
  operation: string,
  fn: T
): T {
  return (async (...args: any[]) => {
    const startTime = Date.now()
    let success = true
    let result: any
    let error: any

    try {
      result = await fn(...args)
      return result
    } catch (e) {
      success = false
      error = e
      throw e
    } finally {
      const duration = Date.now() - startTime
      performanceDashboard.recordOperation(operation, duration, success, {
        args: args.length,
        error: error?.message
      })
    }
  }) as T
}