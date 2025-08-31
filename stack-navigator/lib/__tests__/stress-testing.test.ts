/**
 * Stress Testing Suite
 * Tests system behavior under extreme load conditions
 */

import { CodeGenerator } from '../code-generator'
import { ConversationManager } from '../conversation-manager'
import { TemplateRegistry } from '../template-registry'
import { ZipGenerator } from '../zip-generator'
import { PerformanceMonitor } from '../performance-monitor'

// Mock implementations for stress testing
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => Promise.resolve({ data: [], error: null })),
    insert: jest.fn(() => Promise.resolve({ data: [], error: null })),
    update: jest.fn(() => Promise.resolve({ data: [], error: null })),
    delete: jest.fn(() => Promise.resolve({ data: [], error: null }))
  })),
  auth: {
    getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null }))
  }
}

const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn(() => {
        // Simulate variable response times
        const delay = Math.random() * 1000 + 500 // 500-1500ms
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              choices: [{
                message: {
                  content: JSON.stringify({
                    stack: {
                      framework: 'nextjs',
                      authentication: 'clerk',
                      database: 'supabase'
                    },
                    reasoning: {
                      framework: 'Next.js for performance',
                      authentication: 'Clerk for ease',
                      database: 'Supabase for features'
                    }
                  })
                }
              }]
            })
          }, delay)
        })
      })
    }
  }
}

describe('Stress Testing', () => {
  let codeGenerator: CodeGenerator
  let conversationManager: ConversationManager
  let templateRegistry: TemplateRegistry
  let zipGenerator: ZipGenerator

  beforeAll(() => {
    templateRegistry = new TemplateRegistry()
    codeGenerator = new CodeGenerator(templateRegistry)
    conversationManager = new ConversationManager(mockOpenAI as any, mockSupabaseClient as any)
    zipGenerator = new ZipGenerator()
  })

  describe('High Concurrency Stress Tests', () => {
    test('should handle 50 concurrent project generations', async () => {
      const concurrentRequests = 50
      const selections = Array(concurrentRequests).fill(null).map((_, index) => ({
        framework: 'nextjs' as const,
        authentication: ['clerk', 'nextauth', 'supabase-auth'][index % 3] as const,
        database: 'supabase' as const,
        hosting: ['vercel', 'railway', 'render'][index % 3] as const,
        payments: index % 2 === 0 ? 'stripe' as const : 'none' as const,
        analytics: index % 3 === 0 ? 'posthog' as const : 'none' as const,
        email: index % 4 === 0 ? 'resend' as const : 'none' as const,
        monitoring: index % 5 === 0 ? 'sentry' as const : 'none' as const
      }))

      PerformanceMonitor.startTimer('stress-50-concurrent')
      
      const promises = selections.map((selection, index) => 
        codeGenerator.generateProject(selection).catch(error => {
          console.error(`Generation ${index} failed:`, error)
          return null
        })
      )
      
      const results = await Promise.allSettled(promises)
      
      const duration = PerformanceMonitor.endTimer('stress-50-concurrent')
      
      const successful = results.filter(r => r.status === 'fulfilled' && r.value !== null)
      const failed = results.filter(r => r.status === 'rejected' || r.value === null)
      
      console.log(`Stress test results: ${successful.length} successful, ${failed.length} failed`)
      
      // At least 80% should succeed under stress
      expect(successful.length / concurrentRequests).toBeGreaterThan(0.8)
      expect(duration).toBeLessThan(30000) // Should complete within 30 seconds
      
      PerformanceMonitor.checkMemoryUsage('stress-50-concurrent')
    }, 35000) // Extended timeout for stress test

    test('should handle 100 concurrent AI conversations', async () => {
      const concurrentConversations = 100
      const messages = [
        "I need a simple blog",
        "Building an e-commerce store",
        "Creating a SaaS dashboard",
        "Developing a mobile app backend",
        "Building a marketplace platform"
      ]

      PerformanceMonitor.startTimer('stress-100-ai-conversations')
      
      const promises = Array(concurrentConversations).fill(null).map((_, index) => 
        conversationManager.processMessage(
          `stress-conversation-${index}`,
          messages[index % messages.length]
        ).catch(error => {
          console.error(`Conversation ${index} failed:`, error)
          return null
        })
      )
      
      const results = await Promise.allSettled(promises)
      
      const duration = PerformanceMonitor.endTimer('stress-100-ai-conversations')
      
      const successful = results.filter(r => r.status === 'fulfilled' && r.value !== null)
      const failed = results.filter(r => r.status === 'rejected' || r.value === null)
      
      console.log(`AI stress test results: ${successful.length} successful, ${failed.length} failed`)
      
      // At least 70% should succeed under high AI load
      expect(successful.length / concurrentConversations).toBeGreaterThan(0.7)
      expect(duration).toBeLessThan(45000) // Should complete within 45 seconds
      
      PerformanceMonitor.checkMemoryUsage('stress-100-ai-conversations')
    }, 50000) // Extended timeout for AI stress test

    test('should handle mixed concurrent operations', async () => {
      const operations = []
      
      // Add 20 project generations
      for (let i = 0; i < 20; i++) {
        operations.push({
          type: 'generation',
          operation: () => codeGenerator.generateProject({
            framework: 'nextjs' as const,
            authentication: 'clerk' as const,
            database: 'supabase' as const,
            hosting: 'vercel' as const,
            payments: 'stripe' as const,
            analytics: 'none' as const,
            email: 'none' as const,
            monitoring: 'none' as const
          })
        })
      }
      
      // Add 30 AI conversations
      for (let i = 0; i < 30; i++) {
        operations.push({
          type: 'conversation',
          operation: () => conversationManager.processMessage(
            `mixed-conversation-${i}`,
            `Building project ${i}`
          )
        })
      }
      
      // Add 10 ZIP generations
      for (let i = 0; i < 10; i++) {
        operations.push({
          type: 'zip',
          operation: () => zipGenerator.generateZip({
            name: `stress-project-${i}`,
            files: Array(20).fill(null).map((_, j) => ({
              path: `src/component-${j}.tsx`,
              content: `export default function Component${j}() { return <div>Component ${j}</div> }`
            })),
            dependencies: { react: '^18.0.0' },
            devDependencies: { typescript: '^5.0.0' }
          })
        })
      }
      
      // Shuffle operations to simulate real-world mixed load
      const shuffled = operations.sort(() => Math.random() - 0.5)
      
      PerformanceMonitor.startTimer('stress-mixed-operations')
      
      const promises = shuffled.map((op, index) => 
        op.operation().catch(error => {
          console.error(`Mixed operation ${index} (${op.type}) failed:`, error)
          return null
        })
      )
      
      const results = await Promise.allSettled(promises)
      
      const duration = PerformanceMonitor.endTimer('stress-mixed-operations')
      
      const successful = results.filter(r => r.status === 'fulfilled' && r.value !== null)
      const failed = results.filter(r => r.status === 'rejected' || r.value === null)
      
      console.log(`Mixed stress test results: ${successful.length} successful, ${failed.length} failed`)
      
      // At least 75% should succeed under mixed load
      expect(successful.length / operations.length).toBeGreaterThan(0.75)
      expect(duration).toBeLessThan(60000) // Should complete within 60 seconds
      
      PerformanceMonitor.checkMemoryUsage('stress-mixed-operations')
    }, 65000) // Extended timeout for mixed operations
  })

  describe('Resource Exhaustion Tests', () => {
    test('should handle memory pressure gracefully', async () => {
      const largeProjects = Array(20).fill(null).map((_, index) => ({
        name: `large-project-${index}`,
        files: Array(500).fill(null).map((_, j) => ({
          path: `src/components/Component${j}.tsx`,
          content: `
            import React from 'react'
            import { useState, useEffect, useCallback, useMemo } from 'react'
            
            interface Props {
              id: number
              title: string
              description: string
              data: any[]
            }
            
            export default function Component${j}({ id, title, description, data }: Props) {
              const [state, setState] = useState(0)
              const [loading, setLoading] = useState(false)
              
              const processedData = useMemo(() => {
                return data.map(item => ({ ...item, processed: true }))
              }, [data])
              
              const handleClick = useCallback(() => {
                setLoading(true)
                setTimeout(() => {
                  setState(s => s + 1)
                  setLoading(false)
                }, 100)
              }, [])
              
              useEffect(() => {
                console.log('Component ${j} mounted with id:', id)
                return () => console.log('Component ${j} unmounted')
              }, [id])
              
              return (
                <div className="component-${j} p-4 border rounded">
                  <h2 className="text-xl font-bold">{title}</h2>
                  <p className="text-gray-600">{description}</p>
                  <div className="mt-4">
                    <p>State: {state}</p>
                    <p>Data items: {processedData.length}</p>
                    <button 
                      onClick={handleClick}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
                    >
                      {loading ? 'Loading...' : 'Increment'}
                    </button>
                  </div>
                </div>
              )
            }
          `.repeat(3) // Make files even larger
        })),
        dependencies: { 
          react: '^18.0.0', 
          'next': '^14.0.0',
          '@types/react': '^18.0.0'
        },
        devDependencies: { typescript: '^5.0.0' }
      }))

      PerformanceMonitor.startTimer('memory-pressure-test')
      
      const results = []
      for (const project of largeProjects) {
        try {
          const zipBuffer = await zipGenerator.generateZip(project)
          results.push(zipBuffer)
          
          // Force garbage collection if available
          if (global.gc) {
            global.gc()
          }
        } catch (error) {
          console.error('Memory pressure caused failure:', error)
          results.push(null)
        }
      }
      
      const duration = PerformanceMonitor.endTimer('memory-pressure-test')
      
      const successful = results.filter(r => r !== null)
      
      // Should handle at least 50% under memory pressure
      expect(successful.length / largeProjects.length).toBeGreaterThan(0.5)
      expect(duration).toBeLessThan(120000) // Should complete within 2 minutes
      
      PerformanceMonitor.checkMemoryUsage('memory-pressure-test')
    }, 130000) // Extended timeout for memory pressure test

    test('should recover from temporary failures', async () => {
      let failureCount = 0
      const maxFailures = 5
      
      // Mock a service that fails intermittently
      const unreliableService = {
        process: async () => {
          if (failureCount < maxFailures) {
            failureCount++
            throw new Error(`Temporary failure ${failureCount}`)
          }
          return { success: true, data: 'processed' }
        }
      }
      
      // Retry logic
      const retryOperation = async (operation: () => Promise<any>, maxRetries = 3) => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            return await operation()
          } catch (error) {
            if (attempt === maxRetries) {
              throw error
            }
            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100))
          }
        }
      }
      
      PerformanceMonitor.startTimer('failure-recovery-test')
      
      const operations = Array(10).fill(null).map(() => 
        retryOperation(() => unreliableService.process())
      )
      
      const results = await Promise.allSettled(operations)
      
      const duration = PerformanceMonitor.endTimer('failure-recovery-test')
      
      const successful = results.filter(r => r.status === 'fulfilled')
      
      // Should eventually succeed after retries
      expect(successful.length).toBeGreaterThan(5)
      expect(duration).toBeLessThan(10000)
    })
  })

  describe('Database Stress Tests with Supabase MCP', () => {
    test('should handle high-frequency database operations', async () => {
      const operations = []
      
      // Simulate 200 database operations
      for (let i = 0; i < 200; i++) {
        operations.push(
          mockSupabaseClient.from('projects').insert({
            id: `stress-project-${i}`,
            name: `Stress Project ${i}`,
            user_id: `user-${i % 10}`, // 10 different users
            created_at: new Date().toISOString()
          })
        )
      }
      
      PerformanceMonitor.startTimer('db-stress-operations')
      
      const results = await Promise.allSettled(operations)
      
      const duration = PerformanceMonitor.endTimer('db-stress-operations')
      
      const successful = results.filter(r => r.status === 'fulfilled')
      
      // All operations should succeed (mocked)
      expect(successful.length).toBe(200)
      expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
    })

    test('should handle connection pool exhaustion gracefully', async () => {
      // Simulate many concurrent connections
      const connections = Array(100).fill(null).map((_, index) => 
        Promise.all([
          mockSupabaseClient.from('users').select('*'),
          mockSupabaseClient.from('projects').select('*'),
          mockSupabaseClient.from('conversations').select('*')
        ]).catch(error => {
          console.error(`Connection ${index} failed:`, error)
          return null
        })
      )
      
      PerformanceMonitor.startTimer('connection-pool-stress')
      
      const results = await Promise.allSettled(connections)
      
      const duration = PerformanceMonitor.endTimer('connection-pool-stress')
      
      const successful = results.filter(r => r.status === 'fulfilled' && r.value !== null)
      
      // Most connections should succeed
      expect(successful.length / connections.length).toBeGreaterThan(0.8)
      expect(duration).toBeLessThan(10000)
    })
  })

  describe('Performance Degradation Tests', () => {
    test('should maintain acceptable performance under sustained load', async () => {
      const measurements = []
      const iterations = 100
      
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now()
        
        await codeGenerator.generateProject({
          framework: 'nextjs' as const,
          authentication: 'clerk' as const,
          database: 'supabase' as const,
          hosting: 'vercel' as const,
          payments: 'none' as const,
          analytics: 'none' as const,
          email: 'none' as const,
          monitoring: 'none' as const
        })
        
        const duration = Date.now() - startTime
        measurements.push(duration)
        
        // Small delay between operations
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      
      // Analyze performance trends
      const firstQuarter = measurements.slice(0, 25)
      const lastQuarter = measurements.slice(-25)
      
      const avgFirst = firstQuarter.reduce((a, b) => a + b, 0) / firstQuarter.length
      const avgLast = lastQuarter.reduce((a, b) => a + b, 0) / lastQuarter.length
      
      const degradationPercent = ((avgLast - avgFirst) / avgFirst) * 100
      
      console.log(`Performance degradation: ${degradationPercent.toFixed(2)}%`)
      console.log(`Average first quarter: ${avgFirst.toFixed(2)}ms`)
      console.log(`Average last quarter: ${avgLast.toFixed(2)}ms`)
      
      // Performance shouldn't degrade by more than 25%
      expect(degradationPercent).toBeLessThan(25)
      
      // No single operation should take more than 10 seconds
      expect(Math.max(...measurements)).toBeLessThan(10000)
    }, 180000) // 3 minute timeout for sustained load test
  })
})