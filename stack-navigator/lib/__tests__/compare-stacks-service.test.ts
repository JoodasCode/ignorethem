import { CompareStacksService } from '../compare-stacks-service'
import { BrowseStacksService } from '../browse-stacks-service'
import { UsageTrackingService } from '../usage-tracking'

// Mock dependencies
jest.mock('../browse-stacks-service')
jest.mock('../usage-tracking')
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ error: null }),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ error: null })
        }))
      }))
    }))
  }
}))

describe('CompareStacksService', () => {
  const mockUserId = 'user-123'
  
  const mockStack = {
    id: 'stack-1',
    name: 'NextJS + Supabase Stack',
    description: 'Full-stack web app with authentication',
    category: 'fullstack',
    technologies: ['nextjs', 'supabase', 'typescript'],
    stack_config: {
      framework: 'nextjs',
      authentication: 'supabase-auth',
      database: 'supabase',
      hosting: 'vercel',
      payments: 'none',
      analytics: 'none',
      email: 'none',
      monitoring: 'none',
      ui: 'shadcn'
    },
    usage_count: 150,
    rating: 4.5,
    rating_count: 30,
    setup_time_minutes: 45,
    is_featured: true,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('validateComparisonAccess', () => {
    it('should deny access for free tier users', async () => {
      (UsageTrackingService.getUserTier as jest.Mock).mockResolvedValue('free')

      const result = await CompareStacksService.validateComparisonAccess(mockUserId, 2)

      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Starter tier and above')
    })

    it('should allow access for starter tier users with <= 3 stacks', async () => {
      (UsageTrackingService.getUserTier as jest.Mock).mockResolvedValue('starter')

      const result = await CompareStacksService.validateComparisonAccess(mockUserId, 3)

      expect(result.allowed).toBe(true)
      expect(result.reason).toBeUndefined()
    })

    it('should deny access for starter tier users with > 3 stacks', async () => {
      (UsageTrackingService.getUserTier as jest.Mock).mockResolvedValue('starter')

      const result = await CompareStacksService.validateComparisonAccess(mockUserId, 4)

      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('up to 3 stacks')
    })

    it('should allow unlimited access for pro tier users', async () => {
      (UsageTrackingService.getUserTier as jest.Mock).mockResolvedValue('pro')

      const result = await CompareStacksService.validateComparisonAccess(mockUserId, 5)

      expect(result.allowed).toBe(true)
      expect(result.reason).toBeUndefined()
    })
  })

  describe('buildStackComparison', () => {
    it('should build comprehensive comparison data', async () => {
      const result = await CompareStacksService.buildStackComparison(mockStack)

      expect(result.id).toBe('stack-1')
      expect(result.name).toBe('NextJS + Supabase Stack')
      expect(result.performance_metrics).toBeDefined()
      expect(result.compatibility_score).toBeGreaterThan(0)
      expect(result.pros).toBeInstanceOf(Array)
      expect(result.cons).toBeInstanceOf(Array)
      expect(result.use_cases).toBeInstanceOf(Array)
      expect(['simple', 'moderate', 'complex']).toContain(result.setup_complexity)
      expect(result.monthly_cost_estimate).toBeDefined()
      expect(result.migration_difficulty).toBeDefined()
    })
  })

  describe('getPerformanceMetrics', () => {
    it('should return realistic performance metrics for NextJS stack', async () => {
      const stackConfig = {
        framework: 'nextjs' as const,
        authentication: 'supabase-auth' as const,
        database: 'supabase' as const,
        hosting: 'vercel' as const,
        payments: 'none' as const,
        analytics: 'none' as const,
        email: 'none' as const,
        monitoring: 'none' as const,
        ui: 'shadcn' as const
      }

      const metrics = await CompareStacksService.getPerformanceMetrics(stackConfig)

      expect(metrics.build_time_seconds).toBeGreaterThan(0)
      expect(metrics.bundle_size_kb).toBeGreaterThan(0)
      expect(metrics.lighthouse_score).toBeLessThanOrEqual(100)
      expect(metrics.scalability_rating).toBeLessThanOrEqual(10)
      expect(metrics.developer_experience_rating).toBeLessThanOrEqual(10)
    })
  })

  describe('calculateCompatibilityScore', () => {
    it('should return high score for well-matched technologies', async () => {
      const goodConfig = {
        framework: 'nextjs' as const,
        authentication: 'supabase-auth' as const,
        database: 'supabase' as const,
        hosting: 'vercel' as const,
        payments: 'stripe' as const,
        analytics: 'posthog' as const,
        email: 'resend' as const,
        monitoring: 'sentry' as const,
        ui: 'shadcn' as const
      }

      const score = await CompareStacksService.calculateCompatibilityScore(goodConfig)
      expect(score).toBeGreaterThan(90)
    })

    it('should return lower score for conflicting technologies', async () => {
      const conflictConfig = {
        framework: 'nextjs' as const,
        authentication: 'nextauth' as const,
        database: 'supabase' as const,
        hosting: 'vercel' as const,
        payments: 'none' as const,
        analytics: 'none' as const,
        email: 'none' as const,
        monitoring: 'none' as const,
        ui: 'none' as const
      }

      const score = await CompareStacksService.calculateCompatibilityScore(conflictConfig)
      expect(score).toBeLessThan(100)
    })
  })

  describe('chooseStackFromComparison', () => {
    beforeEach(() => {
      (BrowseStacksService.getStackById as jest.Mock).mockResolvedValue(mockStack);
      (BrowseStacksService.recordStackUsage as jest.Mock).mockResolvedValue(undefined);
      (BrowseStacksService.useStack as jest.Mock).mockResolvedValue('project-123')
    })

    it('should successfully choose a stack and create project', async () => {
      const result = await CompareStacksService.chooseStackFromComparison(
        'stack-1',
        mockUserId,
        'conversation-123',
        'My New Project'
      )

      expect(result.success).toBe(true)
      expect(result.projectId).toBe('project-123')
      expect(BrowseStacksService.useStack).toHaveBeenCalledWith(
        'stack-1',
        'My New Project',
        mockUserId,
        'conversation-123'
      )
    })

    it('should handle stack not found error', async () => {
      (BrowseStacksService.getStackById as jest.Mock).mockResolvedValue(null)

      const result = await CompareStacksService.chooseStackFromComparison(
        'invalid-stack',
        mockUserId
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Stack not found')
    })
  })
})