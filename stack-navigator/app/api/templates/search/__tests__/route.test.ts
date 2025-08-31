import { GET } from '../route'
import { templatesService } from '@/lib/templates-service'
import { NextRequest } from 'next/server'

// Mock the templates service
jest.mock('@/lib/templates-service', () => ({
  templatesService: {
    searchTemplates: jest.fn()
  }
}))

describe('/api/templates/search', () => {
  const mockTemplatesService = templatesService as jest.Mocked<typeof templatesService>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should search templates successfully', async () => {
      const mockTemplates = [
        {
          id: '1',
          name: 'Next.js Template',
          slug: 'nextjs-template',
          description: 'A Next.js template',
          category: 'saas'
        }
      ]

      mockTemplatesService.searchTemplates.mockResolvedValue(mockTemplates as any)

      const url = 'http://localhost:3000/api/templates/search?q=nextjs&category=saas&limit=10'
      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockTemplates)
      expect(data.query).toBe('nextjs')
      expect(data.total).toBe(1)
      expect(mockTemplatesService.searchTemplates).toHaveBeenCalledWith(
        'nextjs',
        { category: 'saas' },
        10
      )
    })

    it('should return 400 for empty query', async () => {
      const url = 'http://localhost:3000/api/templates/search?q='
      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Search query is required')
    })

    it('should apply additional filters', async () => {
      mockTemplatesService.searchTemplates.mockResolvedValue([])

      const url = 'http://localhost:3000/api/templates/search?q=test&category=saas&complexity=medium&technologies=Next.js,TypeScript'
      const request = new NextRequest(url)
      const response = await GET(request)

      expect(mockTemplatesService.searchTemplates).toHaveBeenCalledWith(
        'test',
        {
          category: 'saas',
          complexity: 'medium',
          technologies: ['Next.js', 'TypeScript']
        },
        20
      )
    })

    it('should handle service errors', async () => {
      mockTemplatesService.searchTemplates.mockRejectedValue(new Error('Search failed'))

      const url = 'http://localhost:3000/api/templates/search?q=test'
      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to search templates')
    })
  })
})