import { DashboardService } from '../dashboard-service'

// Mock dependencies
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn()
    }
  }
}))

jest.mock('../user-service', () => ({
  UserService: {
    getCurrentUser: jest.fn(),
    getUserUsage: jest.fn(),
    getDashboardStats: jest.fn()
  }
}))

jest.mock('../subscription-service', () => ({
  subscriptionService: {
    getSubscription: jest.fn()
  }
}))

const { supabase: mockSupabase } = require('../supabase')
const { UserService: mockUserService } = require('../user-service')
const { subscriptionService: mockSubscriptionService } = require('../subscription-service')

describe('DashboardService', () => {
  const mockUserId = 'user-123'
  
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getDashboardData', () => {
    it('should return comprehensive dashboard data', async () => {
      // Mock user profile
      const mockUser = {
        id: mockUserId,
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        last_active_at: '2024-01-01T00:00:00Z',
        theme: 'light' as const,
        email_notifications: true,
        total_projects: 5,
        total_downloads: 10
      }

      // Mock subscription
      const mockSubscription = {
        id: 'sub-123',
        userId: mockUserId,
        stripeCustomerId: 'cus-123',
        stripeSubscriptionId: 'sub-stripe-123',
        tier: 'starter' as const,
        status: 'active' as const,
        currentPeriodStart: new Date('2024-01-01'),
        currentPeriodEnd: new Date('2024-02-01'),
        cancelAtPeriodEnd: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      }

      // Mock usage
      const mockUsage = {
        id: 'usage-123',
        user_id: mockUserId,
        period_start: '2024-01-01T00:00:00Z',
        period_end: '2024-02-01T00:00:00Z',
        stack_generations_used: 2,
        stack_generations_limit: 5,
        conversations_saved: 3,
        conversations_limit: -1,
        messages_sent: 50,
        messages_limit: -1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      // Mock stats
      const mockStats = {
        totalProjects: 5,
        totalDownloads: 10,
        totalConversations: 3,
        averageGenerationTime: 45,
        popularTechnologies: [
          { name: 'nextjs', count: 3, percentage: 60 },
          { name: 'supabase', count: 2, percentage: 40 }
        ],
        recentActivity: [
          {
            type: 'project_created' as const,
            description: 'Created project "My SaaS"',
            timestamp: '2024-01-01T00:00:00Z'
          }
        ]
      }

      // Mock recent projects
      const mockRecentProjects = [
        {
          id: 'proj-1',
          name: 'My SaaS',
          description: 'A great SaaS app',
          status: 'completed' as const,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          downloadCount: 2,
          stackTechnologies: ['nextjs', 'supabase']
        }
      ]

      // Mock recent conversations
      const mockRecentConversations = [
        {
          id: 'conv-1',
          title: 'SaaS Architecture Discussion',
          phase: 'completed',
          status: 'completed',
          messageCount: 15,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          hasGeneratedProject: true
        }
      ]

      // Setup mocks
      mockUserService.getCurrentUser.mockResolvedValue(mockUser)
      mockSubscriptionService.getSubscription.mockResolvedValue(mockSubscription)
      mockUserService.getUserUsage.mockResolvedValue(mockUsage)
      
      // Mock the static methods
      jest.spyOn(DashboardService, 'getDashboardStats').mockResolvedValue(mockStats)
      jest.spyOn(DashboardService, 'getRecentProjects').mockResolvedValue(mockRecentProjects)
      jest.spyOn(DashboardService, 'getRecentConversations').mockResolvedValue(mockRecentConversations)

      const result = await DashboardService.getDashboardData(mockUserId)

      expect(result).toEqual({
        user: mockUser,
        subscription: {
          tier: 'starter',
          status: 'active',
          currentPeriodEnd: mockSubscription.currentPeriodEnd,
          cancelAtPeriodEnd: false
        },
        usage: {
          stackGenerationsUsed: 2,
          stackGenerationsLimit: 5,
          conversationsSaved: 3,
          conversationsLimit: -1,
          messagesUsed: 50,
          messagesLimit: -1,
          periodStart: '2024-01-01T00:00:00Z',
          periodEnd: '2024-02-01T00:00:00Z'
        },
        stats: mockStats,
        recentProjects: mockRecentProjects,
        recentConversations: mockRecentConversations
      })
    })

    it('should handle null subscription', async () => {
      mockUserService.getCurrentUser.mockResolvedValue({
        id: mockUserId,
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        last_active_at: '2024-01-01T00:00:00Z',
        theme: 'light' as const,
        email_notifications: true,
        total_projects: 0,
        total_downloads: 0
      })
      mockSubscriptionService.getSubscription.mockResolvedValue(null)
      mockUserService.getUserUsage.mockResolvedValue(null)
      
      jest.spyOn(DashboardService, 'getDashboardStats').mockResolvedValue({
        totalProjects: 0,
        totalDownloads: 0,
        totalConversations: 0,
        averageGenerationTime: 0,
        popularTechnologies: [],
        recentActivity: []
      })
      jest.spyOn(DashboardService, 'getRecentProjects').mockResolvedValue([])
      jest.spyOn(DashboardService, 'getRecentConversations').mockResolvedValue([])

      const result = await DashboardService.getDashboardData(mockUserId)

      expect(result.subscription).toBeNull()
      expect(result.usage).toBeNull()
    })
  })

  describe('getDashboardStats', () => {
    it('should calculate correct statistics', async () => {
      const mockProjects = [
        {
          id: 'proj-1',
          download_count: 5,
          stack_selections: { framework: 'nextjs', database: 'supabase' },
          generation_started_at: '2024-01-01T00:00:00Z',
          generation_completed_at: '2024-01-01T00:00:45Z' // 45 seconds
        },
        {
          id: 'proj-2',
          download_count: 3,
          stack_selections: { framework: 'nextjs', auth: 'clerk' },
          generation_started_at: '2024-01-01T00:01:00Z',
          generation_completed_at: '2024-01-01T00:01:15Z' // 15 seconds
        }
      ]

      const mockConversations = [
        { id: 'conv-1' },
        { id: 'conv-2' },
        { id: 'conv-3' }
      ]

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'projects') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: mockProjects,
                error: null
              })
            })
          } as any
        }
        if (table === 'conversations') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: mockConversations,
                error: null
              })
            })
          } as any
        }
        return {} as any
      })

      jest.spyOn(DashboardService, 'getRecentActivity').mockResolvedValue([])

      const result = await DashboardService.getDashboardStats(mockUserId)

      expect(result.totalProjects).toBe(2)
      expect(result.totalDownloads).toBe(8)
      expect(result.totalConversations).toBe(3)
      expect(result.averageGenerationTime).toBe(30) // (45 + 15) / 2 = 30 seconds
      expect(result.popularTechnologies).toEqual([
        { name: 'nextjs', count: 2, percentage: 100 },
        { name: 'supabase', count: 1, percentage: 50 },
        { name: 'clerk', count: 1, percentage: 50 }
      ])
    })
  })

  describe('deleteProject', () => {
    it('should delete project successfully', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'projects') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: 'proj-1' },
                    error: null
                  })
                })
              })
            }),
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  error: null
                })
              })
            })
          } as any
        }
        return {} as any
      })

      const result = await DashboardService.deleteProject(mockUserId, 'proj-1')
      expect(result).toBe(true)
    })

    it('should fail when project not found', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'projects') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' }
                  })
                })
              })
            })
          } as any
        }
        return {} as any
      })

      const result = await DashboardService.deleteProject(mockUserId, 'nonexistent')
      expect(result).toBe(false)
    })
  })

  describe('updateConversationTitle', () => {
    it('should update conversation title successfully', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'conversations') {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  error: null
                })
              })
            })
          } as any
        }
        return {} as any
      })

      const result = await DashboardService.updateConversationTitle(
        mockUserId, 
        'conv-1', 
        'New Title'
      )
      expect(result).toBe(true)
    })
  })
})