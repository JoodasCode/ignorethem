import { GET } from '../stacks/[id]/route'
import { POST } from '../stacks/[id]/use/route'
import { BrowseStacksService } from '@/lib/browse-stacks-service'

// Mock the BrowseStacksService
jest.mock('@/lib/browse-stacks-service', () => ({
  BrowseStacksService: {
    getStackById: jest.fn(),
    getSimilarStacks: jest.fn(),
    getStackStats: jest.fn(),
    recordStackUsage: jest.fn(),
    useStack: jest.fn()
  }
}))

// Mock Clerk auth
jest.mock('@clerk/nextjs', () => ({
  auth: jest.fn(() => ({ userId: 'user-123' }))
}))

const mockBrowseStacksService = BrowseStacksService as any

describe('/api/browse/stacks/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/browse/stacks/[id]', () => {
    it('should return stack details with similar stacks and stats', async () => {
      const mockStack = {
        id: 'stack-1',
        name: 'Next.js + Supabase',
        description: 'Full-stack starter'
      }
      const mockSimilarStacks = [
        { id: 'stack-2', name: 'Similar Stack' }
      ]
      const mockStats = {
        usage_count: 100,
        rating: 4.5,
        rating_count: 20,
        recent_usage: 15
      }

      mockBrowseStacksService.getStackById.mockResolvedValue(mockStack)
      mockBrowseStacksService.getSimilarStacks.mockResolvedValue(mockSimilarStacks)
      mockBrowseStacksService.getStackStats.mockResolvedValue(mockStats)

      const request = new Request('http://localhost:3000/api/browse/stacks/stack-1')
      const response = await GET(request, { params: { id: 'stack-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.stack).toEqual(mockStack)
      expect(data.data.similar_stacks).toEqual(mockSimilarStacks)
      expect(data.data.stats).toEqual(mockStats)
    })

    it('should return 404 for non-existent stack', async () => {
      mockBrowseStacksService.getStackById.mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/browse/stacks/999')
      const response = await GET(request, { params: { id: '999' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Stack not found')
    })

    it('should handle service errors', async () => {
      mockBrowseStacksService.getStackById.mockRejectedValue(
        new Error('Database error')
      )

      const request = new Request('http://localhost:3000/api/browse/stacks/stack-1')
      const response = await GET(request, { params: { id: 'stack-1' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to fetch stack details')
    })
  })

  describe('POST /api/browse/stacks/[id]/use', () => {
    it('should create project from stack', async () => {
      mockBrowseStacksService.recordStackUsage.mockResolvedValue(undefined)
      mockBrowseStacksService.useStack.mockResolvedValue('project-123')

      const request = new Request('http://localhost:3000/api/browse/stacks/stack-1/use', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-agent': 'Mozilla/5.0',
          'x-forwarded-for': '192.168.1.1'
        },
        body: JSON.stringify({
          projectName: 'My New Project',
          conversationId: 'conv-123'
        })
      })

      const response = await POST(request, { params: { id: 'stack-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.project_id).toBe('project-123')

      expect(mockBrowseStacksService.recordStackUsage).toHaveBeenCalledWith(
        'stack-1',
        'user-123',
        '192.168.1.1',
        'Mozilla/5.0'
      )

      expect(mockBrowseStacksService.useStack).toHaveBeenCalledWith(
        'stack-1',
        'My New Project',
        'user-123',
        'conv-123'
      )
    })

    it('should return 400 for missing project name', async () => {
      const request = new Request('http://localhost:3000/api/browse/stacks/stack-1/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      const response = await POST(request, { params: { id: 'stack-1' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Project name is required')
    })

    it('should handle stack not found error', async () => {
      mockBrowseStacksService.recordStackUsage.mockResolvedValue(undefined)
      mockBrowseStacksService.useStack.mockRejectedValue(
        new Error('Stack not found')
      )

      const request = new Request('http://localhost:3000/api/browse/stacks/999/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName: 'Test Project' })
      })

      const response = await POST(request, { params: { id: '999' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Stack not found')
    })

    it('should handle project creation failure', async () => {
      mockBrowseStacksService.recordStackUsage.mockResolvedValue(undefined)
      mockBrowseStacksService.useStack.mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/browse/stacks/stack-1/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName: 'Test Project' })
      })

      const response = await POST(request, { params: { id: 'stack-1' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to create project from stack')
    })
  })
})