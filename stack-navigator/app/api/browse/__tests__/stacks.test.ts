import { GET } from '../stacks/route'
import { BrowseStacksService } from '@/lib/browse-stacks-service'

// Mock the BrowseStacksService
jest.mock('@/lib/browse-stacks-service', () => ({
  BrowseStacksService: {
    getPopularStacks: jest.fn()
  }
}))

const mockBrowseStacksService = BrowseStacksService as any

describe('/api/browse/stacks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return popular stacks with default parameters', async () => {
    const mockStacks = [
      {
        id: '1',
        name: 'Next.js + Supabase',
        description: 'Full-stack starter',
        category: 'SaaS',
        technologies: ['Next.js', 'Supabase'],
        usage_count: 100,
        rating: 4.5
      }
    ]

    mockBrowseStacksService.getPopularStacks.mockResolvedValue({
      stacks: mockStacks,
      total: 1
    })

    const request = new Request('http://localhost:3000/api/browse/stacks')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.stacks).toEqual(mockStacks)
    expect(data.data.total).toBe(1)
  })

  it('should parse and apply filters from query parameters', async () => {
    mockBrowseStacksService.getPopularStacks.mockResolvedValue({
      stacks: [],
      total: 0
    })

    const url = new URL('http://localhost:3000/api/browse/stacks')
    url.searchParams.set('category', 'SaaS')
    url.searchParams.set('technologies', 'Next.js,Supabase')
    url.searchParams.set('complexity', 'medium')
    url.searchParams.set('rating_min', '4.0')
    url.searchParams.set('setup_time_max', '20')
    url.searchParams.set('search', 'react')

    const request = new Request(url.toString())
    await GET(request)

    expect(mockBrowseStacksService.getPopularStacks).toHaveBeenCalledWith(
      {
        category: 'SaaS',
        technologies: ['Next.js', 'Supabase'],
        complexity: 'medium',
        rating_min: 4.0,
        setup_time_max: 20,
        search: 'react'
      },
      {}
    )
  })

  it('should parse and apply options from query parameters', async () => {
    mockBrowseStacksService.getPopularStacks.mockResolvedValue({
      stacks: [],
      total: 0
    })

    const url = new URL('http://localhost:3000/api/browse/stacks')
    url.searchParams.set('limit', '10')
    url.searchParams.set('offset', '20')
    url.searchParams.set('sort_by', 'rating')
    url.searchParams.set('sort_order', 'asc')

    const request = new Request(url.toString())
    await GET(request)

    expect(mockBrowseStacksService.getPopularStacks).toHaveBeenCalledWith(
      {},
      {
        limit: 10,
        offset: 20,
        sort_by: 'rating',
        sort_order: 'asc'
      }
    )
  })

  it('should handle service errors gracefully', async () => {
    mockBrowseStacksService.getPopularStacks.mockRejectedValue(
      new Error('Database connection failed')
    )

    const request = new Request('http://localhost:3000/api/browse/stacks')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Failed to fetch stacks')
  })

  it('should handle empty query parameters', async () => {
    mockBrowseStacksService.getPopularStacks.mockResolvedValue({
      stacks: [],
      total: 0
    })

    const request = new Request('http://localhost:3000/api/browse/stacks?category=&search=')
    await GET(request)

    expect(mockBrowseStacksService.getPopularStacks).toHaveBeenCalledWith({}, {})
  })
})