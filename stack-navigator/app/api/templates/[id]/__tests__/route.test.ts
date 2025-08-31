import { GET } from '../route'
import { templatesService } from '@/lib/templates-service'
import { NextRequest } from 'next/server'

// Mock the templates service
jest.mock('@/lib/templates-service', () => ({
  templatesService: {
    getTemplate: jest.fn(),
    recordTemplateView: jest.fn()
  }
}))

// Mock headers
jest.mock('next/headers', () => ({
  headers: () => ({
    get: jest.fn((name: string) => {
      switch (name) {
        case 'user-agent':
          return 'Mozilla/5.0 Test Browser'
        case 'x-forwarded-for':
          return '127.0.0.1'
        case 'referer':
          return 'https://example.com'
        default:
          return null
      }
    })
  })
}))

describe('/api/templates/[id]', () => {
  const mockTemplatesService = templatesService as jest.Mocked<typeof templatesService>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return template and record view', async () => {
      const mockTemplate = {
        id: '1',
        name: 'Test Template',
        slug: 'test-template',
        description: 'A test template',
        category: 'test'
      }

      mockTemplatesService.getTemplate.mockResolvedValue(mockTemplate as any)
      mockTemplatesService.recordTemplateView.mockResolvedValue()

      const request = new NextRequest('http://localhost:3000/api/templates/1')
      const response = await GET(request, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockTemplate)
      expect(mockTemplatesService.getTemplate).toHaveBeenCalledWith('1')
      expect(mockTemplatesService.recordTemplateView).toHaveBeenCalledWith({
        template_id: '1',
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla/5.0 Test Browser',
        referrer: 'https://example.com'
      })
    })

    it('should return 404 for non-existent template', async () => {
      mockTemplatesService.getTemplate.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/templates/non-existent')
      const response = await GET(request, { params: { id: 'non-existent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Template not found')
    })

    it('should handle service errors', async () => {
      mockTemplatesService.getTemplate.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/templates/1')
      const response = await GET(request, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to fetch template')
    })
  })
})