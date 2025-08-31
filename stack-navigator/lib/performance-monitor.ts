/**
 * Performance monitoring and optimization for code generation
 */

export class PerformanceMonitor {
  private static timers: Map<string, number> = new Map()
  private static memoryBaseline: number = 0

  /**
   * Start timing an operation
   */
  static startTimer(operation: string): void {
    this.timers.set(operation, Date.now())
  }

  /**
   * End timing and log result
   */
  static endTimer(operation: string): number {
    const startTime = this.timers.get(operation)
    if (!startTime) {
      console.warn(`Timer for ${operation} was not started`)
      return 0
    }

    const duration = Date.now() - startTime
    this.timers.delete(operation)
    
    console.log(`⏱️ ${operation}: ${duration}ms`)
    
    // Warn about slow operations
    if (duration > 5000) {
      console.warn(`🐌 Slow operation detected: ${operation} took ${duration}ms`)
    }

    return duration
  }

  /**
   * Get timer duration without ending it
   */
  static getTimerDuration(operation: string): number {
    const startTime = this.timers.get(operation)
    if (!startTime) {
      return 0
    }
    return Date.now() - startTime
  }

  /**
   * Monitor memory usage
   */
  static checkMemoryUsage(operation: string): void {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage()
      const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024)
      
      console.log(`💾 ${operation} - Heap used: ${heapUsedMB}MB`)
      
      // Warn about high memory usage
      if (heapUsedMB > 500) {
        console.warn(`🚨 High memory usage detected: ${heapUsedMB}MB`)
      }
    }
  }

  /**
   * Set memory baseline
   */
  static setMemoryBaseline(): void {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      this.memoryBaseline = process.memoryUsage().heapUsed
    }
  }

  /**
   * Check memory growth since baseline
   */
  static checkMemoryGrowth(operation: string): void {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const current = process.memoryUsage().heapUsed
      const growthMB = Math.round((current - this.memoryBaseline) / 1024 / 1024)
      
      if (growthMB > 0) {
        console.log(`📈 ${operation} - Memory growth: +${growthMB}MB`)
      }
    }
  }

  /**
   * Get current memory usage in MB
   */
  static getCurrentMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
    }
    return 0
  }
}

/**
 * Optimization utilities
 */
export class OptimizationUtils {
  /**
   * Batch process large arrays to prevent blocking
   */
  static async batchProcess<T, R>(
    items: T[],
    processor: (item: T) => Promise<R> | R,
    batchSize: number = 10
  ): Promise<R[]> {
    const results: R[] = []
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)
      const batchResults = await Promise.all(
        batch.map(item => processor(item))
      )
      results.push(...batchResults)
      
      // Allow event loop to process other tasks
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, 0))
      }
    }
    
    return results
  }

  /**
   * Debounce function calls
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null
    
    return (...args: Parameters<T>) => {
      if (timeout) {
        clearTimeout(timeout)
      }
      
      timeout = setTimeout(() => {
        func(...args)
      }, wait)
    }
  }

  /**
   * Memoize expensive operations
   */
  static memoize<T extends (...args: any[]) => any>(
    func: T,
    keyGenerator?: (...args: Parameters<T>) => string
  ): T {
    const cache = new Map<string, ReturnType<T>>()
    
    return ((...args: Parameters<T>) => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args)
      
      if (cache.has(key)) {
        return cache.get(key)!
      }
      
      const result = func(...args)
      cache.set(key, result)
      
      // Limit cache size to prevent memory leaks
      if (cache.size > 1000) {
        const firstKey = cache.keys().next().value
        if (firstKey !== undefined) {
          cache.delete(firstKey)
        }
      }
      
      return result
    }) as T
  }

  /**
   * Stream large file processing
   */
  static async processLargeContent(
    content: string,
    processor: (chunk: string) => string,
    chunkSize: number = 1024 * 1024 // 1MB chunks
  ): Promise<string> {
    if (content.length <= chunkSize) {
      return processor(content)
    }

    let result = ''
    for (let i = 0; i < content.length; i += chunkSize) {
      const chunk = content.slice(i, i + chunkSize)
      result += processor(chunk)
      
      // Allow garbage collection
      if (i % (chunkSize * 10) === 0) {
        await new Promise(resolve => setTimeout(resolve, 0))
      }
    }
    
    return result
  }
}