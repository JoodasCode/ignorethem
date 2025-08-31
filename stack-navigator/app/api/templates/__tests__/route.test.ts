import { GET, POST } from '../route'
import { templatesService } from '@/lib/templates-service'
import { NextRequest } from 'next/server'

// Mock the templates service
jest.mock('@/lib/templates-service', () => ({
  templatesService: {
    getTemplates: jest.fn(),
    syncTemplatesFromFileSystem: jest.fn()
  }
}))

describe('/api/templates', () => {
  const mockTemplatesService = templatesService as jest.Mocked<typeof templatesService>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return templates with default parameters', async () => {
      const mockTemplates = [
        {
          id: '1',
          name: 'Test Template',
          slug: 'test-template',
          description: 'A test template',
          category: 'test',
          rating: 4.5
        }
      ]

      mockTemplatesService.getTemplates.mockResolvedValue({
        templates: mockTemplates,
        total: 1
      })

      const request = new NextRequest('http://localhost:3000/api/templates')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockTemplates)
      expect(data.total).toBe(1)
      expect(mockTemplatesService.getTemplates).toHaveBeenCalledWith(
        {},
        { field: 'rating', direction: 'desc' },
        20,
        0
      )
    })

    it('should apply filters from query parameters', async () => {
      mockTemplatesService.getTemplates.mockResolvedValue({
        templates: [],
        total: 0
      })

      const url = 'http://localhost:3000/api/templates?category=saas&complexity=medium&featured=true&search=nextjs&technologies=Next.js,TypeScript&limit=10&offset=20&sort=usage_count&order=asc'
      const request = new NextRequest(url)
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockTemplatesService.getTemplates).toHaveBeenCalledWith(
        {
          category: 'saas',
          complexity: 'medium',
          is_featured: true,
          search: 'nextjs',
          technologies: ['Next.js', 'TypeScript']
        },
        { field: 'usage_count', direction: 'asc' },
        10,
        20
      )
    })

    it('should handle service errors', async () => {
      mockTemplatesService.getTemplates.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/templates')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to fetch templates')
    })
  })

  describe('POST', () => {
    it('should sync templates successfully', async () => {
      mockTemplatesService.syncTemplatesFromFileSystem.mockResolvedValue()

      const request = new NextRequest('http://localhost:3000/api/templates', {
        method: 'POST'
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Templates synced successfully')
      expect(mockTemplatesService.syncTemplatesFromFileSystem).toHaveBeenCalled()
    })

    it('should handle sync errors', async () => {
      mockTemplatesService.syncTemplatesFromFileSystem.mockRejectedValue(
        new Error('Sync failed')
      )

      const request = new NextRequest('http://localhost:3000/api/templates', {
        method: 'POST'
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to sync templates')
    })
  })
})