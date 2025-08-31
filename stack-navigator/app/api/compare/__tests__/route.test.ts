import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { POST, GET } from '../route'
import { CompareStacksService } from '@/lib/compare-stacks-service'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

// Mock dependencies
vi.mock('@/lib/compare-stacks-service')
vi.mock('@supabase/auth-helpers-nextjs')
vi.mock('next/headers', () => ({
  cookies: vi.fn()
}))

describe('/api/compare', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' }
  const mockSupabase = {
    auth: {
      getUser: vi.fn()
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createRouteHandlerClient).mockReturnValue(mockSupabase as any)
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('POST /api/compare', () => {
    const mockComparisonMatrix = {
      stacks: [
        {
          id: 'stack-1',
          name: 'Test Stack 1',
          description: 'Test description',
          technologies: ['nextjs', 'supabase'],
          stack_config: {},
          performance_metrics: {
            build_time_seconds: 30,
            bundle_size_kb: 200,
            lighthouse_score: 95,
            time_to_interactive_ms: 1200,
            first_contentful_paint_ms: 600,
            scalability_rating: 8,
            developer_experience_rating: 9,
            community_support_rating: 8
          },
          compatibility_score: 95,
          pros: ['Easy to use'],
          cons: ['Limited customization'],
          use_cases: ['MVP development'],
          setup_complexity: 'simple' as const,
          monthly_cost_estimate: {
            free_tier: '$0',
            low_usage: '$0-25',
            medium_usage: '$25-100',
            high_usage: '$100-500'
          },
          migration_difficulty: {
            from: {},
            to: {}
          }
        }
      ],
      comparison_categories: [],
      recommendations: [],
      summary: {
        best_overall: 'stack-1',
        best_for_beginners: 'stack-1',
        best_for_performance: 'stack-1',
        best_for_cost: 'stack-1',
        best_for_scalability: 'stack-1'
      }
    }

    it('should successfully compare stacks', async () => {
      vi.mocked(CompareStacksService.compareStacks).mockResolvedValue(mockComparisonMatrix)

      const request = new Request('http://localhost:3000/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stack_ids: ['stack-1', 'stack-2'],
          user_context: {
            experience_level: 'beginner',
            project_type: 'mvp',
            team_size: 'solo',
            budget_range: 'minimal'
          }
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.comparison).toEqual(mockComparisonMatrix)
      expect(CompareStacksService.compareStacks).toHaveBeenCalledWith(
        ['stack-1', 'stack-2'],
        mockUser.id,
        {
          experience_level: 'beginner',
          project_type: 'mvp',
          team_size: 'solo',
          budget_range: 'minimal'
        }
      )
    })

    it('should return 401 for unauthenticated users', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })

      const request = new Request('http://localhost:3000/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stack_ids: ['stack-1', 'stack-2']
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })

    it('should return 400 for missing stack_ids', async () => {
      const request = new Request('http://localhost:3000/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('stack_ids array is required')
    })

    it('should return 400 for less than 2 stacks', async () => {
      const request = new Request('http://localhost:3000/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stack_ids: ['stack-1']
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('At least 2 stacks are required for comparison')
    })

    it('should return 400 for more than 3 stacks', async () => {
      const request = new Request('http://localhost:3000/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stack_ids: ['stack-1', 'stack-2', 'stack-3', 'stack-4']
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Maximum 3 stacks can be compared at once')
    })

    it('should return 403 for tier restriction errors', async () => {
      vi.mocked(CompareStacksService.compareStacks).mockRejectedValue(
        new Error('Stack comparison is available for Starter tier and above. Upgrade to compare stacks side-by-side.')
      )

      const request = new Request('http://localhost:3000/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stack_ids: ['stack-1', 'stack-2']
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toContain('Starter tier and above')
      expect(data.upgrade_required).toBe(true)
      expect(data.feature).toBe('stack_comparison')
    })

    it('should return 404 for stack not found errors', async () => {
      vi.mocked(CompareStacksService.compareStacks).mockRejectedValue(
        new Error('One or more stacks not found')
      )

      const request = new Request('http://localhost:3000/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stack_ids: ['invalid-stack', 'stack-2']
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('not found')
    })

    it('should return 500 for service returning null', async () => {
      vi.mocked(CompareStacksService.compareStacks).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stack_ids: ['stack-1', 'stack-2']
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to generate comparison')
    })

    it('should return 500 for unexpected errors', async () => {
      vi.mocked(CompareStacksService.compareStacks).mockRejectedValue(
        new Error('Unexpected database error')
      )

      const request = new Request('http://localhost:3000/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stack_ids: ['stack-1', 'stack-2']
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('GET /api/compare', () => {
    const mockComparisonHistory = {
      comparisons: [
        {
          id: 'comp-1',
          user_id: 'user-123',
          stack_ids: ['stack-1', 'stack-2'],
          comparison_count: 2,
          created_at: '2024-01-01T00:00:00Z'
        }
      ],
      total: 1
    }

    it('should successfully fetch comparison history', async () => {
      vi.mocked(CompareStacksService.getComparisonHistory).mockResolvedValue(mockComparisonHistory)

      const request = new Request('http://localhost:3000/api/compare?limit=10&offset=0')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.comparisons).toEqual(mockComparisonHistory.comparisons)
      expect(data.total).toBe(1)
      expect(data.pagination).toEqual({
        limit: 10,
        offset: 0,
        has_more: false
      })
      expect(CompareStacksService.getComparisonHistory).toHaveBeenCalledWith(
        mockUser.id,
        10,
        0
      )
    })

    it('should use default pagination parameters', async () => {
      vi.mocked(CompareStacksService.getComparisonHistory).mockResolvedValue(mockComparisonHistory)

      const request = new Request('http://localhost:3000/api/compare')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(CompareStacksService.getComparisonHistory).toHaveBeenCalledWith(
        mockUser.id,
        10,
        0
      )
    })

    it('should return 401 for unauthenticated users', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })

      const request = new Request('http://localhost:3000/api/compare')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })

    it('should handle service errors gracefully', async () => {
      vi.mocked(CompareStacksService.getComparisonHistory).mockRejectedValue(
        new Error('Database connection failed')
      )

      const request = new Request('http://localhost:3000/api/compare')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should calculate has_more correctly', async () => {
      const largeHistory = {
        comparisons: Array(10).fill(mockComparisonHistory.comparisons[0]),
        total: 25
      }
      vi.mocked(CompareStacksService.getComparisonHistory).mockResolvedValue(largeHistory)

      const request = new Request('http://localhost:3000/api/compare?limit=10&offset=0')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.pagination.has_more).toBe(true)
    })
  })
})