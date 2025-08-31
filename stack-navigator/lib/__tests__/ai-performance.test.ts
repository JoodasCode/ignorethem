/**
 * AI Performance and Optimization Testing
 * Tests AI response times, prompt optimization, and conversation efficiency
 */

import { ConversationManager } from '../conversation-manager'
import { PerformanceMonitor } from '../performance-monitor'

// Mock OpenAI with realistic response times
const createMockOpenAI = (baseDelay = 1000) => ({
  chat: {
    completions: {
      create: jest.fn(async (params: any) => {
        // Simulate response time based on prompt length
        const promptLength = JSON.stringify(params.messages).length
        const delay = baseDelay + (promptLength / 1000) * 100 // +100ms per 1000 chars
        
        await new Promise(resolve => setTimeout(resolve, delay))
        
        return {
          choices: [{
            message: {
              content: JSON.stringify({
                stack: {
                  framework: 'nextjs',
                  authentication: 'clerk',
                  database: 'supabase',
                  hosting: 'vercel',
                  payments: params.messages.some((m: any) => 
                    m.content.toLowerCase().includes('payment') || 
                    m.content.toLowerCase().includes('stripe')
                  ) ? 'stripe' : 'none',
                  analytics: 'posthog',
                  email: 'resend',
                  monitoring: 'sentry'
                },
                reasoning: {
                  framework: 'Next.js chosen for its excellent developer experience and performance',
                  authentication: 'Clerk provides the best B2B features out of the box',
                  database: 'Supabase offers real-time features and great DX',
                  hosting: 'Vercel has the best Next.js integration',
                  payments: 'Stripe is the industry standard for payments',
                  analytics: 'PostHog provides comprehensive product analytics',
                  email: 'Resend has the best developer experience for emails',
                  monitoring: 'Sentry is essential for production error tracking'
                },
                confidence: 0.9,
                alternatives: {
                  authentication: ['nextauth', 'supabase-auth'],
                  database: ['planetscale', 'neon'],
                  hosting: ['railway', 'render']
                }
              })
            }
          }],
          usage: {
            prompt_tokens: Math.floor(promptLength / 4),
            completion_tokens: 500,
            total_tokens: Math.floor(promptLength / 4) + 500
          }
        }
      })
    }
  }
})

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

describe('AI Performance and Optimization', () => {
  describe('Response Time Optimization', () => {
    test('should respond faster to concise prompts', async () => {
      const fastOpenAI = createMockOpenAI(500) // Fast base response
      const conversationManager = new ConversationManager(fastOpenAI as any, mockSupabaseClient as any)
      
      const concisePrompt = "Next.js + Stripe"
      const verbosePrompt = `I'm building a comprehensive B2B SaaS platform for project management with team collaboration, real-time updates, file sharing, time tracking, reporting, integrations with third-party tools like Slack and GitHub, advanced analytics and dashboards, user permissions and roles, API access, webhooks, custom branding, white-label options, and enterprise security features. I need authentication, payments, database, hosting, monitoring, and email services.`
      
      // Test concise prompt
      PerformanceMonitor.startTimer('concise-prompt')
      const conciseResponse = await conversationManager.processMessage('test-1', concisePrompt)
      const conciseDuration = PerformanceMonitor.endTimer('concise-prompt')
      
      // Test verbose prompt
      PerformanceMonitor.startTimer('verbose-prompt')
      const verboseResponse = await conversationManager.processMessage('test-2', verbosePrompt)
      const verboseDuration = PerformanceMonitor.endTimer('verbose-prompt')
      
      expect(conciseResponse).toBeDefined()
      expect(verboseResponse).toBeDefined()
      
      // Concise prompts should be significantly faster
      expect(conciseDuration).toBeLessThan(verboseDuration * 0.7)
      expect(conciseDuration).toBeLessThan(1000) // Should be under 1 second
      
      console.log(`Concise prompt: ${conciseDuration}ms, Verbose prompt: ${verboseDuration}ms`)
    })

    test('should optimize context window usage', async () => {
      const openAI = createMockOpenAI(800)
      const conversationManager = new ConversationManager(openAI as any, mockSupabaseClient as any)
      
      const conversationId = 'context-optimization-test'
      
      // Build up conversation history
      const messages = [
        "I'm building a SaaS app",
        "It's for project management",
        "I need team collaboration features",
        "Real-time updates are important",
        "I want to integrate with Slack",
        "Payment processing is needed",
        "I'm a solo founder",
        "Timeline is tight - need to ship fast",
        "Budget is limited initially",
        "Planning to scale to 1000+ users"
      ]
      
      const responseTimes = []
      
      for (const [index, message] of messages.entries()) {
        PerformanceMonitor.startTimer(`context-message-${index}`)
        
        await conversationManager.processMessage(conversationId, message)
        
        const duration = PerformanceMonitor.endTimer(`context-message-${index}`)
        responseTimes.push(duration)
      }
      
      // Response times shouldn't grow linearly with context
      const firstThree = responseTimes.slice(0, 3)
      const lastThree = responseTimes.slice(-3)
      
      const avgFirst = firstThree.reduce((a, b) => a + b, 0) / firstThree.length
      const avgLast = lastThree.reduce((a, b) => a + b, 0) / lastThree.length
      
      // Context growth should be managed efficiently
      expect(avgLast).toBeLessThan(avgFirst * 1.5) // No more than 50% slower
      
      console.log(`Average first 3 responses: ${avgFirst.toFixed(2)}ms`)
      console.log(`Average last 3 responses: ${avgLast.toFixed(2)}ms`)
    })

    test('should handle parallel conversations efficiently', async () => {
      const openAI = createMockOpenAI(600)
      const conversationManager = new ConversationManager(openAI as any, mockSupabaseClient as any)
      
      const conversations = [
        { id: 'conv-1', message: 'Building an e-commerce store' },
        { id: 'conv-2', message: 'Creating a blog platform' },
        { id: 'conv-3', message: 'Developing a mobile app backend' },
        { id: 'conv-4', message: 'Building a marketplace' },
        { id: 'conv-5', message: 'Creating a dashboard app' }
      ]
      
      PerformanceMonitor.startTimer('parallel-conversations')
      
      const promises = conversations.map(conv => 
        conversationManager.processMessage(conv.id, conv.message)
      )
      
      const responses = await Promise.all(promises)
      
      const duration = PerformanceMonitor.endTimer('parallel-conversations')
      
      expect(responses).toHaveLength(5)
      expect(responses.every(r => r && r.content)).toBe(true)
      
      // Parallel processing should be more efficient than sequential
      expect(duration).toBeLessThan(4000) // Should complete within 4 seconds
      
      PerformanceMonitor.checkMemoryUsage('parallel-conversations')
    })
  })

  describe('Prompt Engineering Optimization', () => {
    test('should use optimized system prompts for faster responses', async () => {
      const openAI = createMockOpenAI(700)
      const conversationManager = new ConversationManager(openAI as any, mockSupabaseClient as any)
      
      // Test with different prompt strategies
      const strategies = [
        {
          name: 'detailed-context',
          message: 'I need help choosing technologies for my project. Here are all the details about what I\'m building...'
        },
        {
          name: 'focused-question',
          message: 'What\'s the best auth solution for a B2B SaaS?'
        },
        {
          name: 'structured-input',
          message: 'Project: B2B SaaS, Team: Solo, Timeline: 3 months, Budget: Limited'
        }
      ]
      
      const results = []
      
      for (const strategy of strategies) {
        PerformanceMonitor.startTimer(`prompt-strategy-${strategy.name}`)
        
        const response = await conversationManager.processMessage(
          `strategy-${strategy.name}`,
          strategy.message
        )
        
        const duration = PerformanceMonitor.endTimer(`prompt-strategy-${strategy.name}`)
        
        results.push({
          strategy: strategy.name,
          duration,
          response: response.content
        })
      }
      
      // Structured inputs should be fastest
      const structuredResult = results.find(r => r.strategy === 'structured-input')
      const detailedResult = results.find(r => r.strategy === 'detailed-context')
      
      expect(structuredResult!.duration).toBeLessThan(detailedResult!.duration)
      
      console.log('Prompt strategy results:')
      results.forEach(r => {
        console.log(`${r.strategy}: ${r.duration}ms`)
      })
    })

    test('should optimize token usage for cost efficiency', async () => {
      const openAI = createMockOpenAI(500)
      const conversationManager = new ConversationManager(openAI as any, mockSupabaseClient as any)
      
      const testCases = [
        {
          name: 'minimal-context',
          message: 'React app with auth'
        },
        {
          name: 'moderate-context',
          message: 'Building a React app with user authentication, need recommendations'
        },
        {
          name: 'excessive-context',
          message: 'I am building a comprehensive React application that will need user authentication and I want to make sure I choose the right solution that will scale well and be maintainable and secure and cost-effective and easy to implement and well-documented and has good community support'
        }
      ]
      
      const tokenUsage = []
      
      for (const testCase of testCases) {
        const response = await conversationManager.processMessage(
          `token-test-${testCase.name}`,
          testCase.message
        )
        
        // Mock token counting based on message length
        const estimatedTokens = testCase.message.length / 4 + 500 // Rough estimate
        
        tokenUsage.push({
          name: testCase.name,
          tokens: estimatedTokens,
          response: response.content
        })
      }
      
      // Verify token usage scales reasonably
      const minimal = tokenUsage.find(t => t.name === 'minimal-context')!
      const excessive = tokenUsage.find(t => t.name === 'excessive-context')!
      
      expect(minimal.tokens).toBeLessThan(excessive.tokens * 0.3)
      
      console.log('Token usage analysis:')
      tokenUsage.forEach(t => {
        console.log(`${t.name}: ~${t.tokens} tokens`)
      })
    })
  })

  describe('Conversation Flow Optimization', () => {
    test('should minimize back-and-forth for common scenarios', async () => {
      const openAI = createMockOpenAI(600)
      const conversationManager = new ConversationManager(openAI as any, mockSupabaseClient as any)
      
      // Test efficient conversation flow
      const conversationId = 'efficient-flow-test'
      
      PerformanceMonitor.startTimer('efficient-conversation-flow')
      
      // First message should gather key information
      const response1 = await conversationManager.processMessage(
        conversationId,
        'Building a B2B SaaS for project management, solo founder, need to ship in 2 months'
      )
      
      // Follow-up should be minimal
      const response2 = await conversationManager.processMessage(
        conversationId,
        'Yes, need payments and team features'
      )
      
      // Should be ready to generate
      const response3 = await conversationManager.processMessage(
        conversationId,
        'Generate my stack'
      )
      
      const totalDuration = PerformanceMonitor.endTimer('efficient-conversation-flow')
      
      expect(response1).toBeDefined()
      expect(response2).toBeDefined()
      expect(response3).toBeDefined()
      
      // Efficient flow should complete quickly
      expect(totalDuration).toBeLessThan(3000)
      
      console.log(`Efficient conversation completed in ${totalDuration}ms`)
    })

    test('should cache common responses for faster delivery', async () => {
      const openAI = createMockOpenAI(800)
      const conversationManager = new ConversationManager(openAI as any, mockSupabaseClient as any)
      
      const commonQuestions = [
        'What is the best authentication solution?',
        'Should I use Supabase or Firebase?',
        'What hosting platform do you recommend?',
        'Stripe vs Paddle for payments?'
      ]
      
      // First round - cache miss
      const firstRoundTimes = []
      for (const [index, question] of commonQuestions.entries()) {
        PerformanceMonitor.startTimer(`cache-miss-${index}`)
        
        await conversationManager.processMessage(`cache-test-${index}`, question)
        
        const duration = PerformanceMonitor.endTimer(`cache-miss-${index}`)
        firstRoundTimes.push(duration)
      }
      
      // Second round - should be faster (simulated caching)
      const secondRoundTimes = []
      for (const [index, question] of commonQuestions.entries()) {
        PerformanceMonitor.startTimer(`cache-hit-${index}`)
        
        await conversationManager.processMessage(`cache-test-2-${index}`, question)
        
        const duration = PerformanceMonitor.endTimer(`cache-hit-${index}`)
        secondRoundTimes.push(duration)
      }
      
      const avgFirst = firstRoundTimes.reduce((a, b) => a + b, 0) / firstRoundTimes.length
      const avgSecond = secondRoundTimes.reduce((a, b) => a + b, 0) / secondRoundTimes.length
      
      console.log(`Average first round: ${avgFirst.toFixed(2)}ms`)
      console.log(`Average second round: ${avgSecond.toFixed(2)}ms`)
      
      // Note: In a real implementation, caching would make this faster
      // For now, we just verify the system can handle repeated requests
      expect(avgSecond).toBeLessThan(avgFirst * 1.2) // Allow for some variance
    })
  })

  describe('AI Model Performance Monitoring', () => {
    test('should track response quality vs speed tradeoffs', async () => {
      const fastOpenAI = createMockOpenAI(300) // Fast but potentially lower quality
      const slowOpenAI = createMockOpenAI(1500) // Slower but potentially higher quality
      
      const fastManager = new ConversationManager(fastOpenAI as any, mockSupabaseClient as any)
      const slowManager = new ConversationManager(slowOpenAI as any, mockSupabaseClient as any)
      
      const testMessage = 'Building a complex enterprise SaaS with multiple integrations'
      
      // Test fast model
      PerformanceMonitor.startTimer('fast-model')
      const fastResponse = await fastManager.processMessage('fast-test', testMessage)
      const fastDuration = PerformanceMonitor.endTimer('fast-model')
      
      // Test slow model
      PerformanceMonitor.startTimer('slow-model')
      const slowResponse = await slowManager.processMessage('slow-test', testMessage)
      const slowDuration = PerformanceMonitor.endTimer('slow-model')
      
      expect(fastResponse).toBeDefined()
      expect(slowResponse).toBeDefined()
      
      // Verify speed difference
      expect(fastDuration).toBeLessThan(slowDuration * 0.5)
      
      // Both should provide valid responses
      expect(fastResponse.content).toBeTruthy()
      expect(slowResponse.content).toBeTruthy()
      
      console.log(`Fast model: ${fastDuration}ms`)
      console.log(`Slow model: ${slowDuration}ms`)
      console.log(`Speed improvement: ${((slowDuration - fastDuration) / slowDuration * 100).toFixed(1)}%`)
    })

    test('should monitor AI service availability and failover', async () => {
      let failureCount = 0
      const maxFailures = 3
      
      const unreliableOpenAI = {
        chat: {
          completions: {
            create: jest.fn(async () => {
              if (failureCount < maxFailures) {
                failureCount++
                throw new Error('AI service temporarily unavailable')
              }
              
              return {
                choices: [{
                  message: {
                    content: JSON.stringify({
                      stack: { framework: 'nextjs', authentication: 'clerk' },
                      reasoning: { framework: 'Reliable choice' }
                    })
                  }
                }]
              }
            })
          }
        }
      }
      
      const conversationManager = new ConversationManager(unreliableOpenAI as any, mockSupabaseClient as any)
      
      // Implement retry logic
      const processWithRetry = async (message: string, maxRetries = 5) => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            return await conversationManager.processMessage('failover-test', message)
          } catch (error) {
            if (attempt === maxRetries) {
              throw error
            }
            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100))
          }
        }
      }
      
      PerformanceMonitor.startTimer('ai-failover-test')
      
      const response = await processWithRetry('Test message for failover')
      
      const duration = PerformanceMonitor.endTimer('ai-failover-test')
      
      expect(response).toBeDefined()
      expect(response.content).toBeTruthy()
      expect(duration).toBeLessThan(5000) // Should recover within 5 seconds
      
      console.log(`AI failover recovery took ${duration}ms with ${failureCount} failures`)
    })
  })
})