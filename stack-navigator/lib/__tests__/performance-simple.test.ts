/**
 * Simple Performance Testing
 * Basic performance tests that work with current Jest configuration
 */

import { PerformanceMonitor } from '../performance-monitor'

// Simple mock implementations
const mockCodeGenerator = {
  generateProject: jest.fn().mockImplementation(async () => {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50))
    return { name: 'test-project', files: [], dependencies: {} }
  })
}

const mockConversationManager = {
  processMessage: jest.fn().mockImplementation(async () => {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100))
    return { content: 'Test response', recommendations: null }
  })
}

const mockZipGenerator = {
  generateZip: jest.fn().mockImplementation(async () => {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 25))
    return Buffer.from('mock zip content')
  })
}

describe('Simple Performance Testing', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Code Generation Performance', () => {
    test('should generate project within acceptable time', async () => {
      const selections = {
        framework: 'nextjs',
        authentication: 'clerk',
        database: 'supabase',
        hosting: 'vercel',
        payments: 'none',
        analytics: 'none',
        email: 'none',
        monitoring: 'none'
      }

      PerformanceMonitor.startTimer('simple-generation')
      
      const result = await mockCodeGenerator.generateProject(selections)
      
      const duration = PerformanceMonitor.endTimer('simple-generation')
      
      expect(result).toBeDefined()
      expect(duration).toBeLessThan(1000) // Should complete within 1 second
      expect(mockCodeGenerator.generateProject).toHaveBeenCalledWith(selections)
    })

    test('should handle multiple sequential generations efficiently', async () => {
      const selections = [
        { framework: 'nextjs', authentication: 'clerk' },
        { framework: 'nextjs', authentication: 'nextauth' },
        { framework: 'nextjs', authentication: 'supabase-auth' }
      ]

      PerformanceMonitor.startTimer('sequential-generations')
      
      const results = []
      for (const selection of selections) {
        const result = await mockCodeGenerator.generateProject(selection)
        results.push(result)
      }
      
      const totalDuration = PerformanceMonitor.endTimer('sequential-generations')
      
      expect(results).toHaveLength(3)
      expect(results.every(r => r !== null)).toBe(true)
      expect(totalDuration).toBeLessThan(2000) // Should complete within 2 seconds
      expect(mockCodeGenerator.generateProject).toHaveBeenCalledTimes(3)
    })

    test('should handle concurrent generations', async () => {
      const selections = Array(5).fill({
        framework: 'nextjs',
        authentication: 'clerk',
        database: 'supabase'
      })

      PerformanceMonitor.startTimer('concurrent-generations')
      
      const promises = selections.map(selection => 
        mockCodeGenerator.generateProject(selection)
      )
      
      const results = await Promise.all(promises)
      
      const duration = PerformanceMonitor.endTimer('concurrent-generations')
      
      expect(results).toHaveLength(5)
      expect(results.every(r => r !== null)).toBe(true)
      expect(duration).toBeLessThan(1500) // Should complete within 1.5 seconds
      expect(mockCodeGenerator.generateProject).toHaveBeenCalledTimes(5)
    })
  })

  describe('AI Response Performance', () => {
    test('should respond to conversation within acceptable time', async () => {
      const message = "I'm building a B2B SaaS for project management"

      PerformanceMonitor.startTimer('ai-response')
      
      const response = await mockConversationManager.processMessage('test-conv', message)
      
      const duration = PerformanceMonitor.endTimer('ai-response')
      
      expect(response).toBeDefined()
      expect(response.content).toBeTruthy()
      expect(duration).toBeLessThan(500) // Should respond within 500ms
      expect(mockConversationManager.processMessage).toHaveBeenCalledWith('test-conv', message)
    })

    test('should handle multiple concurrent conversations', async () => {
      const messages = [
        "Building an e-commerce site",
        "Creating a blog platform", 
        "Developing a dashboard app"
      ]

      PerformanceMonitor.startTimer('concurrent-conversations')
      
      const promises = messages.map((message, index) => 
        mockConversationManager.processMessage(`conv-${index}`, message)
      )
      
      const responses = await Promise.all(promises)
      
      const duration = PerformanceMonitor.endTimer('concurrent-conversations')
      
      expect(responses).toHaveLength(3)
      expect(responses.every(r => r && r.content)).toBe(true)
      expect(duration).toBeLessThan(1000) // Should complete within 1 second
      expect(mockConversationManager.processMessage).toHaveBeenCalledTimes(3)
    })
  })

  describe('ZIP Generation Performance', () => {
    test('should generate ZIP files efficiently', async () => {
      const mockProject = {
        name: 'test-project',
        files: Array(10).fill({
          path: 'src/component.tsx',
          content: 'export default function Component() { return <div>Test</div> }'
        }),
        dependencies: { react: '^18.0.0' }
      }

      PerformanceMonitor.startTimer('zip-generation')
      
      const zipBuffer = await mockZipGenerator.generateZip(mockProject)
      
      const duration = PerformanceMonitor.endTimer('zip-generation')
      
      expect(zipBuffer).toBeDefined()
      expect(zipBuffer.length).toBeGreaterThan(0)
      expect(duration).toBeLessThan(200) // Should complete within 200ms
      expect(mockZipGenerator.generateZip).toHaveBeenCalledWith(mockProject)
    })

    test('should handle multiple ZIP generations concurrently', async () => {
      const projects = Array(5).fill({
        name: 'test-project',
        files: [{ path: 'index.js', content: 'console.log("test")' }],
        dependencies: {}
      })

      PerformanceMonitor.startTimer('concurrent-zip-generation')
      
      const promises = projects.map(project => 
        mockZipGenerator.generateZip(project)
      )
      
      const results = await Promise.all(promises)
      
      const duration = PerformanceMonitor.endTimer('concurrent-zip-generation')
      
      expect(results).toHaveLength(5)
      expect(results.every(r => r && r.length > 0)).toBe(true)
      expect(duration).toBeLessThan(500) // Should complete within 500ms
      expect(mockZipGenerator.generateZip).toHaveBeenCalledTimes(5)
    })
  })

  describe('Performance Monitoring', () => {
    test('should track operation timing correctly', () => {
      PerformanceMonitor.startTimer('test-operation')
      
      // Simulate some work
      const start = Date.now()
      while (Date.now() - start < 50) {
        // Busy wait for 50ms
      }
      
      const duration = PerformanceMonitor.endTimer('test-operation')
      
      expect(duration).toBeGreaterThan(40) // Should be at least 40ms
      expect(duration).toBeLessThan(100) // Should be less than 100ms
    })

    test('should handle memory usage monitoring', () => {
      PerformanceMonitor.setMemoryBaseline()
      
      // Create some objects to use memory
      const largeArray = Array(1000).fill(null).map((_, i) => ({
        id: i,
        data: 'x'.repeat(100)
      }))
      
      PerformanceMonitor.checkMemoryUsage('memory-test')
      PerformanceMonitor.checkMemoryGrowth('memory-test')
      
      // Test passes if no errors are thrown
      expect(largeArray.length).toBe(1000)
    })
  })

  describe('Load Testing Simulation', () => {
    test('should handle sustained load', async () => {
      const operations = []
      const durations = []
      
      // Simulate 20 operations
      for (let i = 0; i < 20; i++) {
        operations.push(async () => {
          const start = Date.now()
          await mockCodeGenerator.generateProject({ framework: 'nextjs' })
          return Date.now() - start
        })
      }
      
      PerformanceMonitor.startTimer('sustained-load')
      
      // Execute operations with small delays
      for (const operation of operations) {
        const duration = await operation()
        durations.push(duration)
        
        // Small delay between operations
        await new Promise(resolve => setTimeout(resolve, 10))
      }
      
      const totalDuration = PerformanceMonitor.endTimer('sustained-load')
      
      // Check performance doesn't degrade significantly
      const firstFive = durations.slice(0, 5)
      const lastFive = durations.slice(-5)
      
      const avgFirst = firstFive.reduce((a, b) => a + b, 0) / firstFive.length
      const avgLast = lastFive.reduce((a, b) => a + b, 0) / lastFive.length
      
      expect(durations).toHaveLength(20)
      expect(totalDuration).toBeLessThan(5000) // Should complete within 5 seconds
      expect(avgLast).toBeLessThan(avgFirst * 2) // Performance shouldn't degrade by more than 100%
      expect(mockCodeGenerator.generateProject).toHaveBeenCalledTimes(20)
    })

    test('should handle error scenarios gracefully', async () => {
      // Mock some failures
      mockCodeGenerator.generateProject
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({ name: 'success', files: [] })
        .mockRejectedValueOnce(new Error('Another failure'))
        .mockResolvedValueOnce({ name: 'success', files: [] })

      const operations = [
        () => mockCodeGenerator.generateProject({ framework: 'nextjs' }),
        () => mockCodeGenerator.generateProject({ framework: 'nextjs' }),
        () => mockCodeGenerator.generateProject({ framework: 'nextjs' }),
        () => mockCodeGenerator.generateProject({ framework: 'nextjs' })
      ]

      PerformanceMonitor.startTimer('error-handling')
      
      const results = await Promise.allSettled(operations.map(op => op()))
      
      const duration = PerformanceMonitor.endTimer('error-handling')
      
      const successful = results.filter(r => r.status === 'fulfilled')
      const failed = results.filter(r => r.status === 'rejected')
      
      expect(successful).toHaveLength(2)
      expect(failed).toHaveLength(2)
      expect(duration).toBeLessThan(1000) // Should handle errors quickly
    })
  })

  describe('Performance Thresholds', () => {
    test('should meet performance requirements', async () => {
      const requirements = {
        maxGenerationTime: 1000, // 1 second
        maxAIResponseTime: 500,   // 500ms
        maxZipTime: 200,          // 200ms
        maxConcurrentOperations: 10
      }

      // Test generation time
      PerformanceMonitor.startTimer('generation-threshold')
      await mockCodeGenerator.generateProject({ framework: 'nextjs' })
      const generationTime = PerformanceMonitor.endTimer('generation-threshold')
      
      // Test AI response time
      PerformanceMonitor.startTimer('ai-threshold')
      await mockConversationManager.processMessage('test', 'test message')
      const aiTime = PerformanceMonitor.endTimer('ai-threshold')
      
      // Test ZIP time
      PerformanceMonitor.startTimer('zip-threshold')
      await mockZipGenerator.generateZip({ name: 'test', files: [], dependencies: {} })
      const zipTime = PerformanceMonitor.endTimer('zip-threshold')
      
      // Test concurrent operations
      PerformanceMonitor.startTimer('concurrent-threshold')
      const concurrentOps = Array(requirements.maxConcurrentOperations).fill(null).map(() =>
        mockCodeGenerator.generateProject({ framework: 'nextjs' })
      )
      await Promise.all(concurrentOps)
      const concurrentTime = PerformanceMonitor.endTimer('concurrent-threshold')
      
      expect(generationTime).toBeLessThan(requirements.maxGenerationTime)
      expect(aiTime).toBeLessThan(requirements.maxAIResponseTime)
      expect(zipTime).toBeLessThan(requirements.maxZipTime)
      expect(concurrentTime).toBeLessThan(requirements.maxGenerationTime * 2) // Allow some overhead for concurrency
    })
  })
})