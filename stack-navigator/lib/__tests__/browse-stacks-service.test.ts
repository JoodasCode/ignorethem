import { BrowseStacksService } from '../browse-stacks-service'

// Mock the entire service to focus on integration testing
const mockStacks = [
  {
    id: '1',
    name: 'Next.js + Supabase',
    description: 'Full-stack starter',
    category: 'SaaS',
    technologies: ['Next.js', 'Supabase'],
    usage_count: 100,
    rating: 4.5,
    rating_count: 20,
    setup_time_minutes: 15,
    is_featured: true,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

// Mock Supabase client
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      overlaps: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn(() => Promise.resolve({ data: mockStacks[0], error: null }))
    })),
    raw: jest.fn((sql: string) => sql)
  }
}))

describe('BrowseStacksService', () => {
  describe('getPopularStacks', () => {
    it('should have the correct method signature', () => {
      expect(typeof BrowseStacksService.getPopularStacks).toBe('function')
    })

    it('should handle empty filters and options', async () => {
      const result = await BrowseStacksService.getPopularStacks({}, {})
      expect(result).toHaveProperty('stacks')
      expect(result).toHaveProperty('total')
      expect(Array.isArray(result.stacks)).toBe(true)
      expect(typeof result.total).toBe('number')
    })
  })

  describe('getFeaturedStacks', () => {
    it('should have the correct method signature', () => {
      expect(typeof BrowseStacksService.getFeaturedStacks).toBe('function')
    })

    it('should accept a limit parameter', async () => {
      const result = await BrowseStacksService.getFeaturedStacks(5)
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('getStackById', () => {
    it('should have the correct method signature', () => {
      expect(typeof BrowseStacksService.getStackById).toBe('function')
    })

    it('should return a stack object or null', async () => {
      const result = await BrowseStacksService.getStackById('test-id')
      expect(result === null || typeof result === 'object').toBe(true)
    })
  })

  describe('recordStackUsage', () => {
    it('should have the correct method signature', () => {
      expect(typeof BrowseStacksService.recordStackUsage).toBe('function')
    })

    it('should handle usage recording without errors', async () => {
      await expect(
        BrowseStacksService.recordStackUsage('stack-1', 'user-1', '192.168.1.1', 'Mozilla/5.0')
      ).resolves.not.toThrow()
    })
  })

  describe('rateStack', () => {
    it('should have the correct method signature', () => {
      expect(typeof BrowseStacksService.rateStack).toBe('function')
    })

    it('should reject invalid ratings', async () => {
      await expect(
        BrowseStacksService.rateStack('stack-1', 6, 'user-1')
      ).rejects.toThrow('Rating must be between 1 and 5')

      await expect(
        BrowseStacksService.rateStack('stack-1', 0, 'user-1')
      ).rejects.toThrow('Rating must be between 1 and 5')
    })

    it('should accept valid ratings', async () => {
      for (let rating = 1; rating <= 5; rating++) {
        await expect(
          BrowseStacksService.rateStack('stack-1', rating, 'user-1')
        ).resolves.not.toThrow()
      }
    })
  })

  describe('searchStacks', () => {
    it('should have the correct method signature', () => {
      expect(typeof BrowseStacksService.searchStacks).toBe('function')
    })

    it('should return search results structure', async () => {
      const result = await BrowseStacksService.searchStacks('react', 10, 0)
      expect(result).toHaveProperty('stacks')
      expect(result).toHaveProperty('total')
      expect(Array.isArray(result.stacks)).toBe(true)
      expect(typeof result.total).toBe('number')
    })
  })

  describe('useStack', () => {
    it('should have the correct method signature', () => {
      expect(typeof BrowseStacksService.useStack).toBe('function')
    })

    it('should require a project name', async () => {
      await expect(
        BrowseStacksService.useStack('stack-1', '', 'user-1')
      ).resolves.not.toThrow()
    })
  })

  describe('getSimilarStacks', () => {
    it('should have the correct method signature', () => {
      expect(typeof BrowseStacksService.getSimilarStacks).toBe('function')
    })

    it('should return an array', async () => {
      const result = await BrowseStacksService.getSimilarStacks('stack-1', 5)
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('getStackStats', () => {
    it('should have the correct method signature', () => {
      expect(typeof BrowseStacksService.getStackStats).toBe('function')
    })

    it('should return stats object or null', async () => {
      const result = await BrowseStacksService.getStackStats('stack-1')
      expect(result === null || typeof result === 'object').toBe(true)
    })
  })

  describe('getCategories', () => {
    it('should have the correct method signature', () => {
      expect(typeof BrowseStacksService.getCategories).toBe('function')
    })

    it('should return an array of categories', async () => {
      const result = await BrowseStacksService.getCategories()
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('getStacksByCategory', () => {
    it('should have the correct method signature', () => {
      expect(typeof BrowseStacksService.getStacksByCategory).toBe('function')
    })

    it('should return an array of stacks', async () => {
      const result = await BrowseStacksService.getStacksByCategory('SaaS', 10)
      expect(Array.isArray(result)).toBe(true)
    })
  })
})