import { AnalyticsMCPService } from '../analytics-mcp'
import { TechSelections } from '../types/template'

// Mock PostHog
jest.mock('posthog-node', () => ({
  PostHog: jest.fn().mockImplementation(() => ({
    capture: jest.fn(),
    shutdown: jest.fn()
  }))
}))

describe('AnalyticsMCPService', () => {
  const mockSelections: TechSelections = {
    framework: 'nextjs',
    authentication: 'clerk',
    database: 'supabase',
    hosting: 'vercel',
    payments: 'stripe',
    analytics: 'posthog',
    email: 'resend',
    monitoring: 'sentry',
    ui: 'shadcn'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock console.log to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('trackDownload', () => {
    it('should track download events successfully', async () => {
      const downloadEvent = {
        userId: 'test-user-id',
        projectName: 'test-project',
        selections: mockSelections,
        fileCount: 25,
        zipSize: 2048000,
        generationTime: 5500,
        downloadedAt: new Date(),
        userTier: 'free' as const
      }

      await expect(AnalyticsMCPService.trackDownload(downloadEvent)).resolves.not.toThrow()
      
      // Verify console.log was called with the insert query
      expect(console.log).toHaveBeenCalledWith(
        'Tracking download event:',
        expect.stringContaining('INSERT INTO download_events')
      )
    })

    it('should handle errors gracefully', async () => {
      const downloadEvent = {
        userId: 'test-user-id',
        projectName: "test'project", // Contains single quote to test SQL injection protection
        selections: mockSelections,
        fileCount: 25,
        zipSize: 2048000,
        generationTime: 5500,
        downloadedAt: new Date(),
        userTier: 'free' as const
      }

      await expect(AnalyticsMCPService.trackDownload(downloadEvent)).resolves.not.toThrow()
      
      // Should escape single quotes in project name
      expect(console.log).toHaveBeenCalledWith(
        'Tracking download event:',
        expect.stringContaining("test''project")
      )
    })

    it('should track technology popularity', async () => {
      const downloadEvent = {
        userId: 'test-user-id',
        projectName: 'test-project',
        selections: mockSelections,
        fileCount: 25,
        zipSize: 2048000,
        generationTime: 5500,
        downloadedAt: new Date(),
        userTier: 'pro' as const
      }

      await AnalyticsMCPService.trackDownload(downloadEvent)
      
      // Should log technology popularity updates
      expect(console.log).toHaveBeenCalledWith(
        'Incrementing popularity for framework: nextjs'
      )
      expect(console.log).toHaveBeenCalledWith(
        'Incrementing popularity for authentication: clerk'
      )
      expect(console.log).toHaveBeenCalledWith(
        'Incrementing popularity for database: supabase'
      )
    })
  })

  describe('trackConversion', () => {
    it('should track conversion events successfully', async () => {
      const conversionEvent = {
        userId: 'test-user-id',
        eventType: 'first_generation' as const,
        metadata: { project_name: 'test-project' },
        timestamp: new Date()
      }

      await expect(AnalyticsMCPService.trackConversion(conversionEvent)).resolves.not.toThrow()
      
      expect(console.log).toHaveBeenCalledWith(
        'Tracking conversion event:',
        expect.stringContaining('INSERT INTO conversion_events')
      )
    })

    it('should track upgrade conversions with tier changes', async () => {
      const conversionEvent = {
        userId: 'test-user-id',
        eventType: 'upgrade' as const,
        fromTier: 'free' as const,
        toTier: 'starter' as const,
        metadata: { plan: 'starter-monthly' },
        timestamp: new Date()
      }

      await AnalyticsMCPService.trackConversion(conversionEvent)
      
      expect(console.log).toHaveBeenCalledWith(
        'Tracking conversion event:',
        expect.stringContaining("'free'")
      )
      expect(console.log).toHaveBeenCalledWith(
        'Tracking conversion event:',
        expect.stringContaining("'starter'")
      )
    })
  })

  describe('trackUpgradePrompt', () => {
    it('should track upgrade prompt interactions', async () => {
      await AnalyticsMCPService.trackUpgradePrompt(
        'test-user-id',
        'stack_limit',
        'shown',
        { remaining_count: 0 }
      )

      expect(console.log).toHaveBeenCalledWith(
        'Tracking upgrade prompt:',
        expect.stringContaining('INSERT INTO upgrade_prompts')
      )
    })

    it('should track different prompt types and actions', async () => {
      const testCases = [
        { promptType: 'stack_limit' as const, action: 'shown' as const },
        { promptType: 'conversation_limit' as const, action: 'clicked' as const },
        { promptType: 'message_limit' as const, action: 'converted' as const }
      ]

      for (const testCase of testCases) {
        await AnalyticsMCPService.trackUpgradePrompt(
          'test-user-id',
          testCase.promptType,
          testCase.action
        )

        expect(console.log).toHaveBeenCalledWith(
          'Tracking upgrade prompt:',
          expect.stringContaining(testCase.promptType)
        )
      }
    })
  })

  describe('getAnalyticsMetrics', () => {
    it('should return analytics metrics', async () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      const metrics = await AnalyticsMCPService.getAnalyticsMetrics(startDate, endDate)

      expect(metrics).toHaveProperty('totalDownloads')
      expect(metrics).toHaveProperty('uniqueUsers')
      expect(metrics).toHaveProperty('averageGenerationTime')
      expect(metrics).toHaveProperty('averageZipSize')
      expect(metrics).toHaveProperty('popularTechCombinations')
      expect(metrics).toHaveProperty('conversionFunnel')
      expect(metrics).toHaveProperty('performanceMetrics')

      expect(typeof metrics.totalDownloads).toBe('number')
      expect(typeof metrics.uniqueUsers).toBe('number')
      expect(Array.isArray(metrics.popularTechCombinations)).toBe(true)
    })

    it('should handle errors and return default metrics', async () => {
      // Mock console.error to simulate an error
      jest.spyOn(console, 'error').mockImplementation(() => {})
      
      // Force an error by passing invalid dates
      const metrics = await AnalyticsMCPService.getAnalyticsMetrics()

      expect(metrics.totalDownloads).toBe(250) // Mock data
      expect(metrics.uniqueUsers).toBe(180) // Mock data
    })
  })

  describe('getTechnologyPopularity', () => {
    it('should return technology popularity data', async () => {
      const popularity = await AnalyticsMCPService.getTechnologyPopularity('framework', 5)

      expect(Array.isArray(popularity)).toBe(true)
      expect(popularity.length).toBeGreaterThan(0)
      
      if (popularity.length > 0) {
        expect(popularity[0]).toHaveProperty('technology')
        expect(popularity[0]).toHaveProperty('category')
        expect(popularity[0]).toHaveProperty('usageCount')
        expect(popularity[0]).toHaveProperty('percentage')
        expect(popularity[0]).toHaveProperty('trend')
      }
    })

    it('should handle different categories', async () => {
      const categories = ['framework', 'authentication', 'database']
      
      for (const category of categories) {
        const popularity = await AnalyticsMCPService.getTechnologyPopularity(category)
        expect(Array.isArray(popularity)).toBe(true)
      }
    })
  })

  describe('getConversionFunnel', () => {
    it('should return conversion funnel data', async () => {
      const funnel = await AnalyticsMCPService.getConversionFunnel()

      expect(funnel).toHaveProperty('signups')
      expect(funnel).toHaveProperty('firstGeneration')
      expect(funnel).toHaveProperty('upgrades')
      expect(funnel).toHaveProperty('stages')

      expect(typeof funnel.signups).toBe('number')
      expect(typeof funnel.firstGeneration).toBe('number')
      expect(typeof funnel.upgrades).toBe('number')
      expect(Array.isArray(funnel.stages)).toBe(true)

      // Verify stage structure
      if (funnel.stages.length > 0) {
        expect(funnel.stages[0]).toHaveProperty('stage')
        expect(funnel.stages[0]).toHaveProperty('count')
        expect(funnel.stages[0]).toHaveProperty('conversionRate')
        expect(funnel.stages[0]).toHaveProperty('dropoffRate')
      }
    })

    it('should calculate conversion rates correctly', async () => {
      const funnel = await AnalyticsMCPService.getConversionFunnel()

      // First stage should always be 100% conversion rate
      expect(funnel.stages[0].conversionRate).toBe(100)
      expect(funnel.stages[0].dropoffRate).toBe(0)

      // Subsequent stages should have realistic conversion rates
      if (funnel.stages.length > 1) {
        expect(funnel.stages[1].conversionRate).toBeLessThan(100)
        expect(funnel.stages[1].conversionRate).toBeGreaterThan(0)
      }
    })
  })

  describe('generateAnalyticsReport', () => {
    it('should generate comprehensive analytics report', async () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      const report = await AnalyticsMCPService.generateAnalyticsReport(startDate, endDate)

      expect(report).toHaveProperty('summary')
      expect(report).toHaveProperty('trends')
      expect(report).toHaveProperty('insights')

      expect(Array.isArray(report.insights)).toBe(true)
      expect(report.trends).toHaveProperty('dailyDownloads')
      expect(report.trends).toHaveProperty('dailySignups')
      expect(report.trends).toHaveProperty('dailyUpgrades')
    })

    it('should generate meaningful insights', async () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      const report = await AnalyticsMCPService.generateAnalyticsReport(startDate, endDate)

      expect(report.insights.length).toBeGreaterThan(0)
      
      // Should contain at least one insight
      const hasConversionInsight = report.insights.some(insight => 
        insight.includes('conversion rate')
      )
      const hasPopularityInsight = report.insights.some(insight => 
        insight.includes('popular stack')
      )
      
      expect(hasConversionInsight || hasPopularityInsight).toBe(true)
    })
  })

  describe('error handling', () => {
    it('should handle PostHog errors gracefully', async () => {
      // Mock PostHog to throw an error
      const mockPostHog = require('posthog-node').PostHog
      mockPostHog.mockImplementation(() => {
        throw new Error('PostHog connection failed')
      })

      const downloadEvent = {
        userId: 'test-user-id',
        projectName: 'test-project',
        selections: mockSelections,
        fileCount: 25,
        zipSize: 2048000,
        generationTime: 5500,
        downloadedAt: new Date(),
        userTier: 'free' as const
      }

      // Should not throw even if PostHog fails
      await expect(AnalyticsMCPService.trackDownload(downloadEvent)).resolves.not.toThrow()
    })

    it('should handle database errors gracefully', async () => {
      // All methods should handle errors gracefully and not throw
      await expect(AnalyticsMCPService.getAnalyticsMetrics()).resolves.not.toThrow()
      await expect(AnalyticsMCPService.getTechnologyPopularity()).resolves.not.toThrow()
      await expect(AnalyticsMCPService.getConversionFunnel()).resolves.not.toThrow()
    })
  })
})