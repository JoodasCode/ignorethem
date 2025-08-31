import { ConversationManager } from '../conversation-manager'

// Define interfaces locally for testing
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  recommendations?: any;
}

describe('ConversationManager - Core Functionality', () => {
  let conversationManager: ConversationManager

  beforeEach(() => {
    conversationManager = new ConversationManager()
  })

  describe('Message Management', () => {
    it('should add and retrieve messages', () => {
      const message: ChatMessage = {
        id: '1',
        role: 'user',
        content: 'I want to build a SaaS application',
        timestamp: new Date()
      }

      conversationManager.addMessage(message)
      const messages = conversationManager.getMessages()

      expect(messages).toHaveLength(1)
      expect(messages[0]).toEqual(message)
    })

    it('should maintain message order', () => {
      const messages: ChatMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'First message',
          timestamp: new Date()
        },
        {
          id: '2',
          role: 'assistant',
          content: 'Second message',
          timestamp: new Date()
        },
        {
          id: '3',
          role: 'user',
          content: 'Third message',
          timestamp: new Date()
        }
      ]

      messages.forEach(msg => conversationManager.addMessage(msg))
      const retrievedMessages = conversationManager.getMessages()

      expect(retrievedMessages).toHaveLength(3)
      expect(retrievedMessages[0].content).toBe('First message')
      expect(retrievedMessages[1].content).toBe('Second message')
      expect(retrievedMessages[2].content).toBe('Third message')
    })
  })

  describe('Context Extraction', () => {
    it('should extract project type from user messages', () => {
      const message: ChatMessage = {
        id: '1',
        role: 'user',
        content: 'I want to build a SaaS application for project management',
        timestamp: new Date()
      }

      conversationManager.addMessage(message)
      const context = conversationManager.getContext()

      expect(context.projectType).toBe('saas')
    })

    it('should extract team size from user messages', () => {
      const message: ChatMessage = {
        id: '1',
        role: 'user',
        content: 'I am a solo founder working alone on this project',
        timestamp: new Date()
      }

      conversationManager.addMessage(message)
      const context = conversationManager.getContext()

      expect(context.teamSize).toBe('solo')
    })

    it('should extract timeline from user messages', () => {
      const message: ChatMessage = {
        id: '1',
        role: 'user',
        content: 'I need to ship this ASAP to validate my idea',
        timestamp: new Date()
      }

      conversationManager.addMessage(message)
      const context = conversationManager.getContext()

      expect(context.timeline).toBe('urgent')
    })

    it('should extract technical background from user messages', () => {
      const message: ChatMessage = {
        id: '1',
        role: 'user',
        content: 'I am a beginner developer new to web development',
        timestamp: new Date()
      }

      conversationManager.addMessage(message)
      const context = conversationManager.getContext()

      expect(context.technicalBackground).toBe('beginner')
    })

    it('should extract specific requirements from user messages', () => {
      const message: ChatMessage = {
        id: '1',
        role: 'user',
        content: 'I need user authentication, payment processing, and real-time features',
        timestamp: new Date()
      }

      conversationManager.addMessage(message)
      const context = conversationManager.getContext()

      expect(context.specificRequirements).toContain('authentication')
      expect(context.specificRequirements).toContain('payments')
      expect(context.specificRequirements).toContain('realtime')
    })

    it('should extract concerns from user messages', () => {
      const message: ChatMessage = {
        id: '1',
        role: 'user',
        content: 'I am worried about vendor lock-in and high costs',
        timestamp: new Date()
      }

      conversationManager.addMessage(message)
      const context = conversationManager.getContext()

      expect(context.concerns).toContain('vendor-lock-in')
      expect(context.concerns).toContain('cost')
    })

    it('should handle case-insensitive extraction', () => {
      const message: ChatMessage = {
        id: '1',
        role: 'user',
        content: 'I WANT TO BUILD A SAAS APPLICATION',
        timestamp: new Date()
      }

      conversationManager.addMessage(message)
      const context = conversationManager.getContext()

      expect(context.projectType).toBe('saas')
    })

    it('should accumulate requirements from multiple messages', () => {
      const messages: ChatMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'I need authentication',
          timestamp: new Date()
        },
        {
          id: '2',
          role: 'user',
          content: 'I also need user authentication and payment processing',
          timestamp: new Date()
        }
      ]

      messages.forEach(msg => conversationManager.addMessage(msg))
      const context = conversationManager.getContext()

      expect(context.specificRequirements).toContain('authentication')
      expect(context.specificRequirements).toContain('payments')
      expect(context.specificRequirements?.length).toBeGreaterThan(1)
    })
  })

  describe('Project Analysis', () => {
    it('should analyze simple project correctly', () => {
      const message: ChatMessage = {
        id: '1',
        role: 'user',
        content: 'I want to build a simple blog with authentication',
        timestamp: new Date()
      }

      conversationManager.addMessage(message)
      const analysis = conversationManager.analyzeProject()

      expect(analysis.complexity).toBe('simple')
      expect(analysis.businessModel).toBe('other')
    })

    it('should analyze complex project correctly', () => {
      const message: ChatMessage = {
        id: '1',
        role: 'user',
        content: 'I need a SaaS with authentication, payments, real-time features, analytics, and email notifications',
        timestamp: new Date()
      }

      conversationManager.addMessage(message)
      const analysis = conversationManager.analyzeProject()

      expect(analysis.complexity).toBe('complex')
      expect(analysis.businessModel).toBe('saas')
    })

    it('should determine time constraints from timeline', () => {
      const message: ChatMessage = {
        id: '1',
        role: 'user',
        content: 'I need to ship this quickly and urgently',
        timestamp: new Date()
      }

      conversationManager.addMessage(message)
      const analysis = conversationManager.analyzeProject()

      expect(analysis.timeConstraints).toBe('tight')
    })

    it('should determine budget constraints from concerns', () => {
      const message: ChatMessage = {
        id: '1',
        role: 'user',
        content: 'I am concerned about costs and have a tight budget',
        timestamp: new Date()
      }

      conversationManager.addMessage(message)
      const analysis = conversationManager.analyzeProject()

      expect(analysis.budgetConstraints).toBe('minimal')
    })

    it('should determine technical expertise from background', () => {
      const message: ChatMessage = {
        id: '1',
        role: 'user',
        content: 'I am an experienced developer with years of React experience',
        timestamp: new Date()
      }

      conversationManager.addMessage(message)
      const analysis = conversationManager.analyzeProject()

      expect(analysis.technicalExpertise).toBe('advanced')
    })
  })

  describe('Recommendation Readiness', () => {
    it('should not be ready for recommendations with minimal context', () => {
      const message: ChatMessage = {
        id: '1',
        role: 'user',
        content: 'Hello',
        timestamp: new Date()
      }

      conversationManager.addMessage(message)
      const ready = conversationManager.shouldGenerateRecommendations()

      expect(ready).toBe(false)
    })

    it('should be ready with project type and team info', () => {
      const message: ChatMessage = {
        id: '1',
        role: 'user',
        content: 'I want to build a SaaS application as a solo founder',
        timestamp: new Date()
      }

      conversationManager.addMessage(message)
      const ready = conversationManager.shouldGenerateRecommendations()

      expect(ready).toBe(true)
    })

    it('should be ready with project type and timeline', () => {
      const message: ChatMessage = {
        id: '1',
        role: 'user',
        content: 'I want to build a SaaS application and need to ship it quickly',
        timestamp: new Date()
      }

      conversationManager.addMessage(message)
      const ready = conversationManager.shouldGenerateRecommendations()

      expect(ready).toBe(true)
    })

    it('should be ready with project type and requirements', () => {
      const message: ChatMessage = {
        id: '1',
        role: 'user',
        content: 'I want to build a SaaS application with user authentication',
        timestamp: new Date()
      }

      conversationManager.addMessage(message)
      const ready = conversationManager.shouldGenerateRecommendations()

      expect(ready).toBe(true)
    })
  })

  describe('Conversation Summary', () => {
    it('should generate empty summary for no context', () => {
      const summary = conversationManager.getConversationSummary()
      expect(summary).toBe('')
    })

    it('should generate comprehensive summary with full context', () => {
      const message: ChatMessage = {
        id: '1',
        role: 'user',
        content: 'I am a solo founder building a SaaS application. I need to ship quickly and need authentication and payments. I am worried about costs.',
        timestamp: new Date()
      }

      conversationManager.addMessage(message)
      const summary = conversationManager.getConversationSummary()

      expect(summary).toContain('Project type: saas')
      expect(summary).toContain('Team size: solo')
      expect(summary).toContain('Timeline: urgent')
      expect(summary).toContain('Requirements: authentication, payments')
      expect(summary).toContain('Concerns: cost')
    })

    it('should handle partial context gracefully', () => {
      const message: ChatMessage = {
        id: '1',
        role: 'user',
        content: 'I want to build a marketplace',
        timestamp: new Date()
      }

      conversationManager.addMessage(message)
      const summary = conversationManager.getConversationSummary()

      expect(summary).toBe('Project type: marketplace')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty messages', () => {
      const message: ChatMessage = {
        id: '1',
        role: 'user',
        content: '',
        timestamp: new Date()
      }

      conversationManager.addMessage(message)
      const context = conversationManager.getContext()

      // Empty messages still initialize arrays
      expect(context.specificRequirements).toEqual([])
      expect(context.concerns).toEqual([])
    })

    it('should handle assistant messages without extracting context', () => {
      const message: ChatMessage = {
        id: '1',
        role: 'assistant',
        content: 'I recommend building a SaaS application',
        timestamp: new Date()
      }

      conversationManager.addMessage(message)
      const context = conversationManager.getContext()

      expect(context.projectType).toBeUndefined()
    })
  })
})