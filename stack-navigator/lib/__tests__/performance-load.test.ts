/**
 * Performance and Load Testing Suite
 * Tests code generation speed, AI response times, and concurrent operations
 */

import { CodeGenerator } from '../code-generator'
import { ConversationManager } from '../conversation-manager'
import { TemplateRegistry } from '../template-registry'
import { ZipGenerator } from '../zip-generator'
import { PerformanceMonitor, OptimizationUtils } from '../performance-monitor'
import { createClient } from '@supabase/supabase-js'

// Mock Supabase MCP for testing
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

// Mock OpenAI for AI response testing
const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn(() => Promise.resolve({
        choices: [{
          message: {
            content: JSON.stringify({
              stack: {
                framework: 'nextjs',
                authentication: 'clerk',
                database: 'supabase'
              },
              reasoning: {
                framework: 'Next.js chosen for performance',
                authentication: 'Clerk for ease of use',
                database: 'Supabase for real-time features'
              }
            })
          }
        }]
      }))
    }
  }
}

describe('Performance and Load Testing', () => {
  let codeGenerator: CodeGenerator;
  let conversationManager: ConversationManager;
  let templateRegistry: TemplateRegistry;
  let zipGenerator: ZipGenerator;

  beforeAll(() => {
    // Initialize components with mocked dependencies
    templateRegistry = new TemplateRegistry()
    codeGenerator = new CodeGenerator(templateRegistry)
    conversationManager = new ConversationManager(mockOpenAI as any, mockSupabaseClient as any)
    zipGenerator = new ZipGenerator()
    
    // Set memory baseline
    PerformanceMonitor.setMemoryBaseline()
  })

  describe('Code Generation Performance', () => {
    test('should generate simple stack within performance threshold', async () => {
      const selections = {
        framework: 'nextjs' as const,
        authentication: 'clerk' as const,
        database: 'supabase' as const,
        hosting: 'vercel' as const,
        payments: 'none' as const,
        analytics: 'none' as const,
        email: 'none' as const,
        monitoring: 'none' as const
      }

      PerformanceMonitor.startTimer('simple-generation')
      
      const result = await codeGenerator.generateProject(selections)
      
      const duration = PerformanceMonitor.endTimer('simple-generation')
      
      expect(result).toBeDefined()
      expect(duration).toBeLessThan(2000) // Should complete within 2 seconds
      
      PerformanceMonitor.checkMemoryUsage('simple-generation')
    })

    test('should generate complex stack within performance threshold', async () => {
      const selections = {
        framework: 'nextjs' as const,
        authentication: 'clerk' as const,
        database: 'supabase' as const,
        hosting: 'vercel' as const,
        payments: 'stripe' as const,
        analytics: 'posthog' as const,
        email: 'resend' as const,
        monitoring: 'sentry' as const
      }

      PerformanceMonitor.startTimer('complex-generation')
      
      const result = await codeGenerator.generateProject(selections)
      
      const duration = PerformanceMonitor.endTimer('complex-generation')
      
      expect(result).toBeDefined()
      expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
      
      PerformanceMonitor.checkMemoryUsage('complex-generation')
    })

    test('should handle multiple sequential generations efficiently', async () => {
      const selections = [
        {
          framework: 'nextjs' as const,
          authentication: 'clerk' as const,
          database: 'supabase' as const,
          hosting: 'vercel' as const,
          payments: 'none' as const,
          analytics: 'none' as const,
          email: 'none' as const,
          monitoring: 'none' as const
        },
        {
          framework: 'nextjs' as const,
          authentication: 'nextauth' as const,
          database: 'supabase' as const,
          hosting: 'railway' as const,
          payments: 'stripe' as const,
          analytics: 'posthog' as const,
          email: 'resend' as const,
          monitoring: 'sentry' as const
        },
        {
          framework: 'nextjs' as const,
          authentication: 'supabase-auth' as const,
          database: 'supabase' as const,
          hosting: 'render' as const,
          payments: 'paddle' as const,
          analytics: 'none' as const,
          email: 'postmark' as const,
          monitoring: 'none' as const
        }
      ]

      PerformanceMonitor.startTimer('sequential-generations')
      
      const results = []
      for (const selection of selections) {
        const result = await codeGenerator.generateProject(selection)
        results.push(result)
      }
      
      const totalDuration = PerformanceMonitor.endTimer('sequential-generations')
      
      expect(results).toHaveLength(3)
      expect(results.every(r => r !== null)).toBe(true)
      expect(totalDuration).toBeLessThan(10000) // Should complete within 10 seconds
      
      PerformanceMonitor.checkMemoryGrowth('sequential-generations')
    })
  })

  describe('AI Response Performance', () => {
    test('should respond to conversation within acceptable time', async () => {
      const conversationId = 'test-conversation'
      const message = "I'm building a B2B SaaS for project management. Solo founder, need to ship fast."

      PerformanceMonitor.startTimer('ai-response')
      
      const response = await conversationManager.processMessage(conversationId, message)
      
      const duration = PerformanceMonitor.endTimer('ai-response')
      
      expect(response).toBeDefined()
      expect(response.content).toBeTruthy()
      expect(duration).toBeLessThan(3000) // Should respond within 3 seconds
    })

    test('should handle multiple concurrent AI requests', async () => {
      const messages = [
        "I need a simple e-commerce site",
        "Building a social media app with real-time features",
        "Creating an internal tool for team management",
        "Developing a marketplace platform",
        "Building a content management system"
      ]

      PerformanceMonitor.startTimer('concurrent-ai-requests')
      
      const promises = messages.map((message, index) => 
        conversationManager.processMessage(`conversation-${index}`, message)
      )
      
      const responses = await Promise.all(promises)
      
      const duration = PerformanceMonitor.endTimer('concurrent-ai-requests')
      
      expect(responses).toHaveLength(5)
      expect(responses.every(r => r && r.content)).toBe(true)
      expect(duration).toBeLessThan(8000) // Should complete within 8 seconds
      
      PerformanceMonitor.checkMemoryUsage('concurrent-ai-requests')
    })

    test('should optimize prompting for faster responses', async () => {
      const shortMessage = "Next.js + Stripe"
      const longMessage = "I'm building a comprehensive B2B SaaS platform for project management with team collaboration, real-time updates, file sharing, time tracking, reporting, integrations with third-party tools, and advanced analytics. I need authentication, payments, database, hosting, monitoring, and email services."

      // Test short message
      PerformanceMonitor.startTimer('short-prompt')
      const shortResponse = await conversationManager.processMessage('short-test', shortMessage)
      const shortDuration = PerformanceMonitor.endTimer('short-prompt')

      // Test long message
      PerformanceMonitor.startTimer('long-prompt')
      const longResponse = await conversationManager.processMessage('long-test', longMessage)
      const longDuration = PerformanceMonitor.endTimer('long-prompt')

      expect(shortResponse).toBeDefined()
      expect(longResponse).toBeDefined()
      
      // Short prompts should be faster
      expect(shortDuration).toBeLessThan(longDuration)
      expect(shortDuration).toBeLessThan(2000)
      expect(longDuration).toBeLessThan(4000)
    })
  })

  describe('Concurrent Project Generation Load Testing', () => {
    test('should handle 5 concurrent project generations', async () => {
      const selections = Array(5).fill(null).map((_, index) => ({
        framework: 'nextjs' as const,
        authentication: index % 2 === 0 ? 'clerk' as const : 'nextauth' as const,
        database: 'supabase' as const,
        hosting: 'vercel' as const,
        payments: index % 3 === 0 ? 'stripe' as const : 'none' as const,
        analytics: 'none' as const,
        email: 'none' as const,
        monitoring: 'none' as const
      }))

      PerformanceMonitor.startTimer('concurrent-5-generations')
      
      const promises = selections.map((selection, index) => 
        codeGenerator.generateProject(selection)
      )
      
      const results = await Promise.all(promises)
      
      const duration = PerformanceMonitor.endTimer('concurrent-5-generations')
      
      expect(results).toHaveLength(5)
      expect(results.every(r => r !== null)).toBe(true)
      expect(duration).toBeLessThan(8000) // Should complete within 8 seconds
      
      PerformanceMonitor.checkMemoryUsage('concurrent-5-generations')
    })

    test('should handle 10 concurrent project generations with batching', async () => {
      const selections = Array(10).fill(null).map((_, index) => ({
        framework: 'nextjs' as const,
        authentication: ['clerk', 'nextauth', 'supabase-auth'][index % 3] as const,
        database: 'supabase' as const,
        hosting: ['vercel', 'railway', 'render'][index % 3] as const,
        payments: index % 2 === 0 ? 'stripe' as const : 'none' as const,
        analytics: index % 4 === 0 ? 'posthog' as const : 'none' as const,
        email: index % 3 === 0 ? 'resend' as const : 'none' as const,
        monitoring: index % 5 === 0 ? 'sentry' as const : 'none' as const
      }))

      PerformanceMonitor.startTimer('concurrent-10-generations-batched')
      
      // Use batching to prevent overwhelming the system
      const results = await OptimizationUtils.batchProcess(
        selections,
        (selection) => codeGenerator.generateProject(selection),
        3 // Process 3 at a time
      )
      
      const duration = PerformanceMonitor.endTimer('concurrent-10-generations-batched')
      
      expect(results).toHaveLength(10)
      expect(results.every(r => r !== null)).toBe(true)
      expect(duration).toBeLessThan(15000) // Should complete within 15 seconds
      
      PerformanceMonitor.checkMemoryUsage('concurrent-10-generations-batched')
    })

    test('should maintain performance under sustained load', async () => {
      const selections = {
        framework: 'nextjs' as const,
        authentication: 'clerk' as const,
        database: 'supabase' as const,
        hosting: 'vercel' as const,
        payments: 'stripe' as const,
        analytics: 'posthog' as const,
        email: 'resend' as const,
        monitoring: 'sentry' as const
      }

      const durations: number[] = []
      
      // Generate 20 projects sequentially to test sustained performance
      for (let i = 0; i < 20; i++) {
        PerformanceMonitor.startTimer(`sustained-load-${i}`)
        
        const result = await codeGenerator.generateProject(selections)
        
        const duration = PerformanceMonitor.endTimer(`sustained-load-${i}`)
        durations.push(duration)
        
        expect(result).toBeDefined()
        
        // Small delay to simulate real usage
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      // Check that performance doesn't degrade significantly
      const firstFive = durations.slice(0, 5)
      const lastFive = durations.slice(-5)
      
      const avgFirst = firstFive.reduce((a, b) => a + b, 0) / firstFive.length
      const avgLast = lastFive.reduce((a, b) => a + b, 0) / lastFive.length
      
      // Performance shouldn't degrade by more than 50%
      expect(avgLast).toBeLessThan(avgFirst * 1.5)
      
      PerformanceMonitor.checkMemoryGrowth('sustained-load-test')
    })
  })

  describe('ZIP Generation Performance', () => {
    test('should generate ZIP files efficiently', async () => {
      const mockProject = {
        name: 'test-project',
        files: Array(50).fill(null).map((_, index) => ({
          path: `src/components/Component${index}.tsx`,
          content: `export default function Component${index}() { return <div>Component ${index}</div> }`
        })),
        dependencies: { react: '^18.0.0', 'next': '^14.0.0' },
        devDependencies: { typescript: '^5.0.0' }
      }

      PerformanceMonitor.startTimer('zip-generation')
      
      const zipBuffer = await zipGenerator.generateZip(mockProject)
      
      const duration = PerformanceMonitor.endTimer('zip-generation')
      
      expect(zipBuffer).toBeDefined()
      expect(zipBuffer.length).toBeGreaterThan(0)
      expect(duration).toBeLessThan(1000) // Should complete within 1 second
      
      PerformanceMonitor.checkMemoryUsage('zip-generation')
    })

    test('should handle large projects efficiently', async () => {
      const mockLargeProject = {
        name: 'large-project',
        files: Array(200).fill(null).map((_, index) => ({
          path: `src/components/Component${index}.tsx`,
          content: `
            import React from 'react'
            import { useState, useEffect } from 'react'
            
            export default function Component${index}() {
              const [state, setState] = useState(0)
              
              useEffect(() => {
                console.log('Component ${index} mounted')
              }, [])
              
              return (
                <div className="component-${index}">
                  <h1>Component ${index}</h1>
                  <p>State: {state}</p>
                  <button onClick={() => setState(s => s + 1)}>Increment</button>
                </div>
              )
            }
          `.repeat(5) // Make files larger
        })),
        dependencies: { 
          react: '^18.0.0', 
          'next': '^14.0.0',
          '@types/react': '^18.0.0',
          'tailwindcss': '^3.0.0'
        },
        devDependencies: { 
          typescript: '^5.0.0',
          eslint: '^8.0.0',
          prettier: '^3.0.0'
        }
      }

      PerformanceMonitor.startTimer('large-zip-generation')
      
      const zipBuffer = await zipGenerator.generateZip(mockLargeProject)
      
      const duration = PerformanceMonitor.endTimer('large-zip-generation')
      
      expect(zipBuffer).toBeDefined()
      expect(zipBuffer.length).toBeGreaterThan(0)
      expect(duration).toBeLessThan(3000) // Should complete within 3 seconds
      
      PerformanceMonitor.checkMemoryUsage('large-zip-generation')
    })
  })

  describe('Database Performance with Supabase MCP', () => {
    test('should handle database operations efficiently', async () => {
      const operations = [
        () => mockSupabaseClient.from('users').select('*'),
        () => mockSupabaseClient.from('projects').select('*'),
        () => mockSupabaseClient.from('conversations').select('*'),
        () => mockSupabaseClient.from('usage_stats').select('*')
      ]

      PerformanceMonitor.startTimer('database-operations')
      
      const results = await Promise.all(operations.map(op => op()))
      
      const duration = PerformanceMonitor.endTimer('database-operations')
      
      expect(results).toHaveLength(4)
      expect(duration).toBeLessThan(500) // Should complete within 500ms (mocked)
    })

    test('should handle concurrent database writes', async () => {
      const writes = Array(10).fill(null).map((_, index) => 
        mockSupabaseClient.from('projects').insert({
          id: `project-${index}`,
          name: `Test Project ${index}`,
          user_id: 'test-user',
          created_at: new Date().toISOString()
        })
      )

      PerformanceMonitor.startTimer('concurrent-db-writes')
      
      const results = await Promise.all(writes)
      
      const duration = PerformanceMonitor.endTimer('concurrent-db-writes')
      
      expect(results).toHaveLength(10)
      expect(duration).toBeLessThan(1000) // Should complete within 1 second (mocked)
    })
  })

  describe('Memory Management', () => {
    test('should not leak memory during repeated operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed
      
      // Perform 50 operations
      for (let i = 0; i < 50; i++) {
        const selections = {
          framework: 'nextjs' as const,
          authentication: 'clerk' as const,
          database: 'supabase' as const,
          hosting: 'vercel' as const,
          payments: 'none' as const,
          analytics: 'none' as const,
          email: 'none' as const,
          monitoring: 'none' as const
        }
        
        await codeGenerator.generateProject(selections)
        
        // Force garbage collection every 10 operations
        if (i % 10 === 0 && global.gc) {
          global.gc()
        }
      }
      
      // Force final garbage collection
      if (global.gc) {
        global.gc()
      }
      
      const finalMemory = process.memoryUsage().heapUsed
      const memoryGrowthMB = (finalMemory - initialMemory) / 1024 / 1024
      
      // Memory growth should be reasonable (less than 100MB)
      expect(memoryGrowthMB).toBeLessThan(100)
      
      console.log(`Memory growth after 50 operations: ${memoryGrowthMB.toFixed(2)}MB`)
    })
  })

  describe('Performance Optimization Utilities', () => {
    test('should batch process large arrays efficiently', async () => {
      const largeArray = Array(1000).fill(null).map((_, i) => i)
      
      PerformanceMonitor.startTimer('batch-processing')
      
      const results = await OptimizationUtils.batchProcess(
        largeArray,
        (item) => item * 2,
        50 // Process 50 at a time
      )
      
      const duration = PerformanceMonitor.endTimer('batch-processing')
      
      expect(results).toHaveLength(1000)
      expect(results[0]).toBe(0)
      expect(results[999]).toBe(1998)
      expect(duration).toBeLessThan(1000) // Should complete within 1 second
    })

    test('should memoize expensive operations', () => {
      let callCount = 0
      const expensiveFunction = (x: number) => {
        callCount++
        return x * x
      }
      
      const memoized = OptimizationUtils.memoize(expensiveFunction)
      
      // First calls should execute the function
      expect(memoized(5)).toBe(25)
      expect(memoized(10)).toBe(100)
      expect(callCount).toBe(2)
      
      // Repeated calls should use cache
      expect(memoized(5)).toBe(25)
      expect(memoized(10)).toBe(100)
      expect(callCount).toBe(2) // No additional calls
    })

    test('should process large content in chunks', async () => {
      const largeContent = 'x'.repeat(10 * 1024 * 1024) // 10MB string
      
      PerformanceMonitor.startTimer('large-content-processing')
      
      const result = await OptimizationUtils.processLargeContent(
        largeContent,
        (chunk) => chunk.toUpperCase(),
        1024 * 1024 // 1MB chunks
      )
      
      const duration = PerformanceMonitor.endTimer('large-content-processing')
      
      expect(result).toBe('X'.repeat(10 * 1024 * 1024))
      expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
    })
  })
})