import { CompareStacksService } from '../compare-stacks-service'
import { BrowseStacksService } from '../browse-stacks-service'
import { UsageTrackingService } from '../usage-tracking'

// Integration test for compare stacks functionality
describe('Compare Stacks Integration', () => {
  const mockUserId = 'test-user-123'
  const mockStackIds = ['stack-1', 'stack-2']

  // Mock the external dependencies
  beforeAll(() => {
    // Mock UsageTrackingService
    jest.spyOn(UsageTrackingService, 'getUserTier').mockResolvedValue('starter')
    
    // Mock BrowseStacksService
    jest.spyOn(BrowseStacksService, 'getStackById').mockImplementation(async (id) => ({
      id,
      name: `Test Stack ${id}`,
      description: `Description for ${id}`,
      category: 'fullstack',
      technologies: ['nextjs', 'typescript'],
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
      usage_count: 100,
      rating: 4.5,
      rating_count: 20,
      setup_time_minutes: 45,
      is_featured: true,
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }))

    // Mock database operations
    jest.spyOn(CompareStacksService, 'recordComparisonUsage').mockResolvedValue(undefined)
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  it('should complete full comparison workflow', async () => {
    // Test tier validation
    const tierCheck = await CompareStacksService.validateComparisonAccess(mockUserId, 2)
    expect(tierCheck.allowed).toBe(true)

    // Test stack comparison
    const comparison = await CompareStacksService.compareStacks(mockStackIds, mockUserId)
    
    expect(comparison).toBeDefined()
    expect(comparison?.stacks).toHaveLength(2)
    expect(comparison?.stacks[0].id).toBe('stack-1')
    expect(comparison?.stacks[1].id).toBe('stack-2')
    
    // Verify comparison structure
    expect(comparison?.comparison_categories).toBeDefined()
    expect(comparison?.recommendations).toBeDefined()
    expect(comparison?.summary).toBeDefined()
    
    // Verify performance metrics are calculated
    expect(comparison?.stacks[0].performance_metrics.build_time_seconds).toBeGreaterThan(0)
    expect(comparison?.stacks[0].compatibility_score).toBeGreaterThan(0)
    
    // Verify pros/cons are generated
    expect(comparison?.stacks[0].pros.length).toBeGreaterThan(0)
    expect(comparison?.stacks[0].cons.length).toBeGreaterThan(0)
  })

  it('should handle tier restrictions properly', async () => {
    // Mock free tier user
    jest.spyOn(UsageTrackingService, 'getUserTier').mockResolvedValueOnce('free')

    await expect(
      CompareStacksService.compareStacks(mockStackIds, mockUserId)
    ).rejects.toThrow('Starter tier and above')
  })

  it('should validate stack count limits', async () => {
    // Test minimum stacks
    await expect(
      CompareStacksService.compareStacks(['stack-1'], mockUserId)
    ).rejects.toThrow('At least 2 stacks are required')

    // Test maximum stacks
    await expect(
      CompareStacksService.compareStacks(['stack-1', 'stack-2', 'stack-3', 'stack-4'], mockUserId)
    ).rejects.toThrow('up to 3 stacks')
  })

  it('should generate contextual recommendations', async () => {
    const userContext = {
      experience_level: 'beginner' as const,
      project_type: 'mvp' as const,
      team_size: 'solo' as const,
      budget_range: 'minimal' as const
    }

    const comparison = await CompareStacksService.compareStacks(mockStackIds, mockUserId, userContext)
    
    expect(comparison?.recommendations.length).toBeGreaterThan(0)
    
    // Should have beginner-friendly recommendation
    const beginnerRec = comparison?.recommendations.find(r => 
      r.reason.toLowerCase().includes('beginner') || 
      r.use_case.toLowerCase().includes('learning')
    )
    expect(beginnerRec).toBeDefined()
  })

  it('should calculate performance differences correctly', async () => {
    const comparison = await CompareStacksService.compareStacks(mockStackIds, mockUserId)
    
    const stack1 = comparison?.stacks[0]
    const stack2 = comparison?.stacks[1]
    
    expect(stack1?.performance_metrics).toBeDefined()
    expect(stack2?.performance_metrics).toBeDefined()
    
    // Metrics should be within reasonable ranges
    expect(stack1?.performance_metrics.lighthouse_score).toBeLessThanOrEqual(100)
    expect(stack1?.performance_metrics.developer_experience_rating).toBeLessThanOrEqual(10)
    expect(stack1?.performance_metrics.scalability_rating).toBeLessThanOrEqual(10)
  })
})