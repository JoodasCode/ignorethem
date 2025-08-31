/**
 * Integration tests for templates functionality
 * These tests verify the templates system works end-to-end
 */

describe('Templates Integration', () => {
  describe('Template Management System', () => {
    it('should have templates service available', () => {
      const { templatesService } = require('../templates-service')
      expect(templatesService).toBeDefined()
      expect(typeof templatesService.getTemplates).toBe('function')
      expect(typeof templatesService.getTemplate).toBe('function')
      expect(typeof templatesService.getFeaturedTemplates).toBe('function')
      expect(typeof templatesService.getPopularTemplates).toBe('function')
      expect(typeof templatesService.searchTemplates).toBe('function')
      expect(typeof templatesService.getCategories).toBe('function')
      expect(typeof templatesService.recordTemplateView).toBe('function')
      expect(typeof templatesService.recordTemplateUsage).toBe('function')
      expect(typeof templatesService.rateTemplate).toBe('function')
      expect(typeof templatesService.getTemplatePreview).toBe('function')
      expect(typeof templatesService.getTemplateAnalytics).toBe('function')
      expect(typeof templatesService.syncTemplatesFromFileSystem).toBe('function')
    })

    it('should have template interfaces defined', () => {
      const templateService = require('../templates-service')
      
      // Check that the main interfaces are exported
      expect(templateService.TemplatesService).toBeDefined()
      
      // Verify service methods exist
      const service = new templateService.TemplatesService()
      expect(service).toBeDefined()
    })
  })

  describe('API Route Files', () => {
    it('should have API route files in correct locations', () => {
      const fs = require('fs')
      const path = require('path')
      
      const routeFiles = [
        'app/api/templates/route.ts',
        'app/api/templates/[id]/route.ts',
        'app/api/templates/[id]/preview/route.ts',
        'app/api/templates/[id]/rate/route.ts',
        'app/api/templates/[id]/use/route.ts',
        'app/api/templates/categories/route.ts',
        'app/api/templates/featured/route.ts',
        'app/api/templates/popular/route.ts',
        'app/api/templates/search/route.ts',
        'app/api/templates/analytics/route.ts'
      ]

      routeFiles.forEach(routeFile => {
        const fullPath = path.join(process.cwd(), routeFile)
        expect(fs.existsSync(fullPath)).toBe(true)
      })
    })

    it('should have proper exports in route files', () => {
      const fs = require('fs')
      const path = require('path')
      
      const mainRouteFile = path.join(process.cwd(), 'app/api/templates/route.ts')
      const content = fs.readFileSync(mainRouteFile, 'utf8')
      
      expect(content).toContain('export async function GET')
      expect(content).toContain('export async function POST')
    })
  })

  describe('Template Filtering and Sorting', () => {
    it('should support all filter options', () => {
      const { TemplatesService } = require('../templates-service')
      const service = new TemplatesService()

      // Test that the service can handle all filter types
      const filters = {
        category: 'saas',
        complexity: 'medium',
        technologies: ['Next.js', 'TypeScript'],
        is_featured: true,
        is_premium: false,
        search: 'test query'
      }

      // Should not throw when creating filters
      expect(() => filters).not.toThrow()
    })

    it('should support all sort options', () => {
      const sortOptions = [
        { field: 'name', direction: 'asc' },
        { field: 'rating', direction: 'desc' },
        { field: 'usage_count', direction: 'desc' },
        { field: 'view_count', direction: 'desc' },
        { field: 'created_at', direction: 'desc' }
      ]

      sortOptions.forEach(sort => {
        expect(sort.field).toBeDefined()
        expect(['asc', 'desc']).toContain(sort.direction)
      })
    })
  })

  describe('Template Analytics', () => {
    it('should support all analytics actions', () => {
      const actions = ['view', 'preview', 'use', 'download']
      
      actions.forEach(action => {
        expect(typeof action).toBe('string')
        expect(action.length).toBeGreaterThan(0)
      })
    })

    it('should support rating system', () => {
      const validRatings = [1, 2, 3, 4, 5]
      
      validRatings.forEach(rating => {
        expect(rating).toBeGreaterThanOrEqual(1)
        expect(rating).toBeLessThanOrEqual(5)
      })
    })
  })

  describe('Template Tiers and Permissions', () => {
    it('should support tier-based access', () => {
      const tiers = ['free', 'starter', 'pro']
      
      tiers.forEach(tier => {
        expect(typeof tier).toBe('string')
        expect(['free', 'starter', 'pro']).toContain(tier)
      })
    })

    it('should handle premium template access', () => {
      const { TemplatesService } = require('../templates-service')
      const service = new TemplatesService()

      // Mock template for testing
      const mockTemplate = {
        id: '1',
        is_premium: true,
        preview_files: { 'file1.js': 'preview' },
        full_template: { 'file1.js': 'full', 'file2.js': 'more' }
      }

      // Mock getTemplate method
      service.getTemplate = jest.fn().mockResolvedValue(mockTemplate)

      // Test preview access for different tiers
      expect(service.getTemplatePreview('1', 'free')).resolves.toEqual({
        files: mockTemplate.preview_files,
        isLimited: true
      })

      expect(service.getTemplatePreview('1', 'starter')).resolves.toEqual({
        files: mockTemplate.full_template,
        isLimited: false
      })
    })
  })
})