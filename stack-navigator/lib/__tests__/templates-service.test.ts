import { TemplatesService } from '../templates-service'

// Mock Supabase
const mockSupabaseQuery = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  contains: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  upsert: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis()
}

const mockSupabase = {
  from: jest.fn(() => mockSupabaseQuery)
}

jest.mock('../supabase', () => ({
  supabase: mockSupabase
}))

// Mock template registry
const mockTemplateRegistry = {
  initialize: jest.fn(),
  getAllTemplates: jest.fn(() => [
    {
      metadata: {
        id: 'test-template',
        name: 'Test Template',
        description: 'A test template',
        category: 'test',
        setupTime: 15,
        complexity: 'simple',
        pricing: 'free',
        tags: ['test', 'example']
      },
      files: [
        {
          path: 'package.json',
          content: '{"name": "test"}',
          executable: false
        }
      ],
      packageDependencies: {
        'react': '^18.0.0'
      },
      setupInstructions: [
        {
          category: 'setup'
        }
      ]
    }
  ])
}

jest.mock('../template-registry', () => ({
  templateRegistry: mockTemplateRegistry
}))

describe('TemplatesService', () => {
  let service: TemplatesService

  beforeEach(() => {
    service = new TemplatesService()
    jest.clearAllMocks()
  })

  describe('getTemplates', () => {
    it('should fetch templates with default parameters', async () => {
      const mockData = [
        {
          id: '1',
          name: 'Test Template',
          slug: 'test-template',
          description: 'A test template',
          category: 'test',
          rating: 4.5,
          usage_count: 100
        }
      ]

      mockSupabaseQuery.range.mockReturnValue({
        data: mockData,
        error: null,
        count: 1
      })

      const result = await service.getTemplates()

      expect(result.templates).toEqual(mockData)
      expect(result.total).toBe(1)
      expect(mockSupabase.from).toHaveBeenCalledWith('templates')
    })

    it('should apply category filter', async () => {
      mockSupabaseQuery.range.mockReturnValue({
        data: [],
        error: null,
        count: 0
      })

      await service.getTemplates({ category: 'saas' })

      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('category', 'saas')
    })

    it('should apply search filter', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnValue({
          data: [],
          error: null,
          count: 0
        })
      }

      mockSupabaseQuery.mockReturnValue(mockQuery)

      await service.getTemplates({ search: 'nextjs' })

      expect(mockQuery.or).toHaveBeenCalledWith('name.ilike.%nextjs%,description.ilike.%nextjs%')
    })

    it('should apply technology filter', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        contains: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnValue({
          data: [],
          error: null,
          count: 0
        })
      }

      mockSupabaseQuery.mockReturnValue(mockQuery)

      await service.getTemplates({ technologies: ['Next.js', 'TypeScript'] })

      expect(mockQuery.contains).toHaveBeenCalledWith('technologies', ['Next.js'])
      expect(mockQuery.contains).toHaveBeenCalledWith('technologies', ['TypeScript'])
    })

    it('should handle errors gracefully', async () => {
      mockSupabaseQuery.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnValue({
          data: null,
          error: { message: 'Database error' },
          count: null
        })
      })

      await expect(service.getTemplates()).rejects.toThrow()
    })
  })

  describe('getTemplate', () => {
    it('should fetch template by ID', async () => {
      const mockTemplate = {
        id: '1',
        name: 'Test Template',
        slug: 'test-template'
      }

      mockSupabaseQuery.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnValue({
          data: mockTemplate,
          error: null
        })
      })

      const result = await service.getTemplate('1')

      expect(result).toEqual(mockTemplate)
    })

    it('should return null for non-existent template', async () => {
      mockSupabaseQuery.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnValue({
          data: null,
          error: { code: 'PGRST116' }
        })
      })

      const result = await service.getTemplate('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('getFeaturedTemplates', () => {
    it('should fetch featured templates', async () => {
      const mockTemplates = [
        { id: '1', name: 'Featured 1', is_featured: true },
        { id: '2', name: 'Featured 2', is_featured: true }
      ]

      mockSupabaseQuery.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue({
          data: mockTemplates,
          error: null
        })
      })

      const result = await service.getFeaturedTemplates(2)

      expect(result).toEqual(mockTemplates)
    })
  })

  describe('getPopularTemplates', () => {
    it('should fetch popular templates ordered by usage count', async () => {
      const mockTemplates = [
        { id: '1', name: 'Popular 1', usage_count: 100 },
        { id: '2', name: 'Popular 2', usage_count: 50 }
      ]

      mockSupabaseQuery.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue({
          data: mockTemplates,
          error: null
        })
      })

      const result = await service.getPopularTemplates(2)

      expect(result).toEqual(mockTemplates)
    })
  })

  describe('recordTemplateView', () => {
    it('should record template view', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        error: null
      })

      mockSupabaseQuery.mockReturnValue({
        insert: mockInsert
      })

      const view = {
        template_id: '1',
        user_id: 'user1',
        ip_address: '127.0.0.1'
      }

      await service.recordTemplateView(view)

      expect(mockInsert).toHaveBeenCalledWith([view])
    })
  })

  describe('recordTemplateUsage', () => {
    it('should record template usage', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        error: null
      })

      mockSupabaseQuery.mockReturnValue({
        insert: mockInsert
      })

      const usage = {
        template_id: '1',
        user_id: 'user1',
        action: 'use' as const,
        ip_address: '127.0.0.1'
      }

      await service.recordTemplateUsage(usage)

      expect(mockInsert).toHaveBeenCalledWith([usage])
    })
  })

  describe('rateTemplate', () => {
    it('should rate template', async () => {
      const mockUpsert = jest.fn().mockReturnValue({
        error: null
      })

      mockSupabaseQuery.mockReturnValue({
        upsert: mockUpsert
      })

      const rating = {
        template_id: '1',
        user_id: 'user1',
        rating: 5,
        review: 'Great template!'
      }

      await service.rateTemplate(rating)

      expect(mockUpsert).toHaveBeenCalledWith([rating], { onConflict: 'template_id,user_id' })
    })
  })

  describe('getTemplatePreview', () => {
    it('should return limited preview for free tier premium template', async () => {
      const mockTemplate = {
        id: '1',
        is_premium: true,
        preview_files: { 'file1.js': 'preview content' },
        full_template: { 'file1.js': 'full content', 'file2.js': 'more content' }
      }

      // Mock getTemplate method
      jest.spyOn(service, 'getTemplate').mockResolvedValue(mockTemplate as any)

      const result = await service.getTemplatePreview('1', 'free')

      expect(result.files).toEqual(mockTemplate.preview_files)
      expect(result.isLimited).toBe(true)
    })

    it('should return full preview for paid tier', async () => {
      const mockTemplate = {
        id: '1',
        is_premium: true,
        preview_files: { 'file1.js': 'preview content' },
        full_template: { 'file1.js': 'full content', 'file2.js': 'more content' }
      }

      jest.spyOn(service, 'getTemplate').mockResolvedValue(mockTemplate as any)

      const result = await service.getTemplatePreview('1', 'starter')

      expect(result.files).toEqual(mockTemplate.full_template)
      expect(result.isLimited).toBe(false)
    })
  })

  describe('getCategories', () => {
    it('should return categories with counts', async () => {
      const mockData = [
        { category: 'saas' },
        { category: 'saas' },
        { category: 'ecommerce' },
        { category: 'blog' }
      ]

      mockSupabaseQuery.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnValue({
          data: mockData,
          error: null
        })
      })

      const result = await service.getCategories()

      expect(result).toEqual([
        { category: 'saas', count: 2 },
        { category: 'ecommerce', count: 1 },
        { category: 'blog', count: 1 }
      ])
    })
  })

  describe('syncTemplatesFromFileSystem', () => {
    it('should sync templates from file system', async () => {
      const mockUpsert = jest.fn().mockReturnValue({
        error: null
      })

      mockSupabaseQuery.mockReturnValue({
        upsert: mockUpsert
      })

      await service.syncTemplatesFromFileSystem()

      expect(mockUpsert).toHaveBeenCalled()
    })
  })

  describe('extractTechnologies', () => {
    it('should extract technologies from template', () => {
      const template = {
        metadata: { category: 'saas' },
        packageDependencies: { 'react': '^18.0.0', 'next': '^13.0.0' }
      }

      const result = (service as any).extractTechnologies(template)

      expect(result).toContain('saas')
      expect(result).toContain('react')
      expect(result).toContain('next')
    })
  })

  describe('extractFeatures', () => {
    it('should extract features from template', () => {
      const template = {
        metadata: { tags: ['auth', 'payments'] },
        setupInstructions: [{ category: 'database' }]
      }

      const result = (service as any).extractFeatures(template)

      expect(result).toContain('auth')
      expect(result).toContain('payments')
      expect(result).toContain('database')
    })
  })

  describe('mapComplexity', () => {
    it('should map complexity correctly', () => {
      expect((service as any).mapComplexity('simple')).toBe('simple')
      expect((service as any).mapComplexity('complex')).toBe('complex')
      expect((service as any).mapComplexity('medium')).toBe('medium')
      expect((service as any).mapComplexity('unknown')).toBe('medium')
    })
  })
})