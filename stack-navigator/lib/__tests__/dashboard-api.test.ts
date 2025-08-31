import { NextRequest } from "next/server"

import { NextRequest } from "next/server"

import { NextRequest } from "next/server"

import { NextRequest } from "next/server"

import { NextRequest } from "next/server"

import { NextRequest } from "next/server"

import { NextRequest } from "next/server"

import { NextRequest } from "next/server"

import { NextRequest } from "next/server"

// Mock dependencies first
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn()
    }
  }
}))

jest.mock('../dashboard-service', () => ({
  DashboardService: {
    getDashboardData: jest.fn()
  }
}))

// Mock Next.js Request
class MockNextRequest {
  constructor(public url: string, public options: any = {}) {}
  
  async json() {
    return JSON.parse(this.options.body || '{}')
  }
}

const { supabase: mockSupabase } = require('../supabase')
const { DashboardService: mockDashboardService } = require('../dashboard-service')

describe('Dashboard API Endpoints', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock auth by default
    mockSupabase.auth = {
      getUser: jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null
      })
    } as any
  })

  describe('/api/dashboard', () => {
    it('should return dashboard data for authenticated user', async () => {
      const mockDashboardData = {
        user: mockUser,
        subscription: {
          tier: 'starter',
          status: 'active',
          currentPeriodEnd: new Date('2024-02-01'),
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
        stats: {
          totalProjects: 5,
          totalDownloads: 10,
          totalConversations: 3,
          averageGenerationTime: 45,
          popularTechnologies: [],
          recentActivity: []
        },
        recentProjects: [],
        recentConversations: []
      }

      mockDashboardService.getDashboardData.mockResolvedValue(mockDashboardData)

      const request = new NextRequest('http://localhost:3000/api/dashboard')
      const response = await dashboardGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockDashboardData)
      expect(mockDashboardService.getDashboardData).toHaveBeenCalledWith(mockUser.id)
    })

    it('should return 401 for unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/dashboard')
      const response = await dashboardGET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })
  })

  describe('/api/dashboard/projects', () => {
    it('should return paginated projects', async () => {
      const mockProjects = [
        {
          id: 'proj-1',
          name: 'My SaaS',
          description: 'A great app',
          generation_status: 'completed',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          download_count: 5
        }
      ]

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'projects') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  range: jest.fn().mockResolvedValue({
                    data: mockProjects,
                    error: null,
                    count: 1
                  })
                })
              })
            })
          } as any
        }
        return {} as any
      })

      const request = new NextRequest('http://localhost:3000/api/dashboard/projects?page=1&limit=10')
      const response = await projectsGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.projects).toEqual(mockProjects)
      expect(data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1
      })
    })

    it('should delete project successfully', async () => {
      // Mock project ownership verification
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

      const request = new NextRequest('http://localhost:3000/api/dashboard/projects', {
        method: 'DELETE',
        body: JSON.stringify({ projectId: 'proj-1' })
      })
      const response = await projectsDELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return 404 for non-existent project deletion', async () => {
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

      const request = new NextRequest('http://localhost:3000/api/dashboard/projects', {
        method: 'DELETE',
        body: JSON.stringify({ projectId: 'nonexistent' })
      })
      const response = await projectsDELETE(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Project not found or access denied')
    })
  })

  describe('/api/dashboard/conversations', () => {
    it('should return paginated conversations', async () => {
      const mockConversations = [
        {
          id: 'conv-1',
          title: 'SaaS Discussion',
          phase: 'completed',
          status: 'completed',
          message_count: 15,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'conversations') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  range: jest.fn().mockResolvedValue({
                    data: mockConversations,
                    error: null,
                    count: 1
                  })
                })
              })
            })
          } as any
        }
        return {} as any
      })

      const request = new NextRequest('http://localhost:3000/api/dashboard/conversations?page=1&limit=10')
      const response = await conversationsGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.conversations).toEqual(mockConversations)
      expect(data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1
      })
    })

    it('should delete conversation successfully', async () => {
      // Mock conversation ownership verification
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'conversations') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: 'conv-1' },
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

      const request = new NextRequest('http://localhost:3000/api/dashboard/conversations', {
        method: 'DELETE',
        body: JSON.stringify({ conversationId: 'conv-1' })
      })
      const response = await conversationsDELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('/api/dashboard/usage', () => {
    it('should return usage statistics', async () => {
      const mockUsage = {
        id: 'usage-1',
        user_id: mockUser.id,
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

      const mockHistoricalUsage = [mockUsage]

      // Mock UserService methods
      const mockUserService = require('../user-service').UserService
      mockUserService.getUserUsage = jest.fn().mockResolvedValue(mockUsage)
      mockUserService.canGenerateStack = jest.fn().mockResolvedValue(true)
      mockUserService.canSaveConversation = jest.fn().mockResolvedValue(true)

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'usage_tracking') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({
                    data: mockHistoricalUsage,
                    error: null
                  })
                })
              })
            })
          } as any
        }
        return {} as any
      })

      const request = new NextRequest('http://localhost:3000/api/dashboard/usage')
      const response = await usageGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.current).toEqual({
        stackGenerationsUsed: 2,
        stackGenerationsLimit: 5,
        stackUsagePercent: 40,
        conversationsSaved: 3,
        conversationsLimit: -1,
        conversationUsagePercent: 0,
        messagesUsed: 50,
        messagesLimit: -1,
        messageUsagePercent: 0,
        periodStart: '2024-01-01T00:00:00Z',
        periodEnd: '2024-02-01T00:00:00Z'
      })
      expect(data.historical).toEqual(mockHistoricalUsage)
      expect(data.canGenerateStack).toBe(true)
      expect(data.canSaveConversation).toBe(true)
    })

    it('should return 404 when usage data not found', async () => {
      const mockUserService = require('../user-service').UserService
      mockUserService.getUserUsage = jest.fn().mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/dashboard/usage')
      const response = await usageGET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Usage data not found')
    })
  })
})