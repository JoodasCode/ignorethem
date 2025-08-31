import { TemplateRegistry } from '../template-registry'
import { Template, TemplateMetadata, TechSelections, ValidationResult } from '../types/template'

// Mock fs module
jest.mock('fs/promises', () => ({
  readdir: jest.fn(),
  readFile: jest.fn(),
  stat: jest.fn()
}))

// Mock path module
jest.mock('path', () => ({
  resolve: jest.fn(),
  join: jest.fn(),
  basename: jest.fn(),
  extname: jest.fn()
}))

const mockFs = require('fs/promises')

describe('TemplateRegistry', () => {
  let templateRegistry: TemplateRegistry
  let mockTemplate: Template

  beforeEach(() => {
    templateRegistry = new TemplateRegistry('test-templates')
    
    // Create mock template
    mockTemplate = {
      metadata: {
        id: 'test-template',
        name: 'Test Template',
        description: 'A test template',
        category: 'auth',
        version: '1.0.0',
        complexity: 'simple',
        pricing: 'free',
        setupTime: 5,
        dependencies: [],
        conflicts: [],
        requiredEnvVars: ['TEST_API_KEY'],
        optionalEnvVars: ['TEST_OPTIONAL'],
        documentation: 'Test documentation',
        tags: ['test', 'auth'],
        popularity: 100,
        lastUpdated: new Date()
      },
      files: [
        {
          path: 'test-file.ts',
          content: 'export const test = "{{projectName}}"'
        }
      ],
      envVars: [
        {
          key: 'TEST_API_KEY',
          description: 'Test API key',
          required: true,
          category: 'auth'
        }
      ],
      setupInstructions: [
        {
          step: 1,
          title: 'Install dependencies',
          description: 'Run npm install',
          category: 'installation'
        }
      ],
      packageDependencies: {
        'test-package': '^1.0.0'
      },
      devDependencies: {
        'test-dev-package': '^1.0.0'
      },
      scripts: {
        'test': 'jest'
      }
    }

    // Reset mocks
    jest.clearAllMocks()
  })

  describe('Template Registration', () => {
    it('should register a valid template', () => {
      const result = templateRegistry.registerTemplate(mockTemplate)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      
      const retrieved = templateRegistry.getTemplate('test-template')
      expect(retrieved).toEqual(mockTemplate)
    })

    it('should reject invalid template', () => {
      const invalidTemplate = {
        ...mockTemplate,
        metadata: {
          ...mockTemplate.metadata,
          id: '' // Invalid empty ID
        }
      }

      const result = templateRegistry.registerTemplate(invalidTemplate)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should overwrite existing template with same ID', () => {
      templateRegistry.registerTemplate(mockTemplate)
      
      const updatedTemplate = {
        ...mockTemplate,
        metadata: {
          ...mockTemplate.metadata,
          name: 'Updated Template'
        }
      }
      
      templateRegistry.registerTemplate(updatedTemplate)
      
      const retrieved = templateRegistry.getTemplate('test-template')
      expect(retrieved?.metadata.name).toBe('Updated Template')
    })
  })

  describe('Template Retrieval', () => {
    beforeEach(() => {
      templateRegistry.registerTemplate(mockTemplate)
    })

    it('should retrieve template by ID', () => {
      const template = templateRegistry.getTemplate('test-template')
      expect(template).toEqual(mockTemplate)
    })

    it('should return null for non-existent template', () => {
      const template = templateRegistry.getTemplate('non-existent')
      expect(template).toBeNull()
    })

    it('should get all templates', () => {
      const templates = templateRegistry.getAllTemplates()
      expect(templates).toHaveLength(1)
      expect(templates[0]).toEqual(mockTemplate)
    })

    it('should get templates by category', () => {
      const authTemplate = mockTemplate
      const dbTemplate = {
        ...mockTemplate,
        metadata: {
          ...mockTemplate.metadata,
          id: 'db-template',
          category: 'database' as const
        }
      }
      
      templateRegistry.registerTemplate(authTemplate)
      templateRegistry.registerTemplate(dbTemplate)
      
      const authTemplates = templateRegistry.getTemplatesByCategory('auth')
      const dbTemplates = templateRegistry.getTemplatesByCategory('database')
      
      expect(authTemplates).toHaveLength(1)
      expect(authTemplates[0].metadata.id).toBe('test-template')
      expect(dbTemplates).toHaveLength(1)
      expect(dbTemplates[0].metadata.id).toBe('db-template')
    })
  })

  describe('Template Selection', () => {
    beforeEach(() => {
      // Register multiple templates
      const templates = [
        {
          ...mockTemplate,
          metadata: { ...mockTemplate.metadata, id: 'clerk', category: 'auth' as const }
        },
        {
          ...mockTemplate,
          metadata: { ...mockTemplate.metadata, id: 'supabase', category: 'database' as const }
        },
        {
          ...mockTemplate,
          metadata: { ...mockTemplate.metadata, id: 'stripe', category: 'payments' as const }
        },
        {
          ...mockTemplate,
          metadata: { ...mockTemplate.metadata, id: 'nextjs-base', category: 'base' as const }
        }
      ]
      
      templates.forEach(template => templateRegistry.registerTemplate(template))
    })

    it('should get templates for selections', () => {
      const selections: TechSelections = {
        framework: 'nextjs',
        authentication: 'clerk',
        database: 'supabase',
        hosting: 'vercel',
        payments: 'stripe',
        analytics: 'none',
        email: 'none',
        monitoring: 'none',
        ui: 'none'
      }

      const templates = templateRegistry.getTemplatesForSelections(selections)
      
      expect(templates.length).toBeGreaterThan(0)
      const templateIds = templates.map(t => t.metadata.id)
      expect(templateIds).toContain('nextjs-base')
      expect(templateIds).toContain('clerk')
      expect(templateIds).toContain('supabase')
      expect(templateIds).toContain('stripe')
    })

    it('should exclude none selections', () => {
      const selections: TechSelections = {
        framework: 'nextjs',
        authentication: 'none',
        database: 'none',
        hosting: 'vercel',
        payments: 'none',
        analytics: 'none',
        email: 'none',
        monitoring: 'none',
        ui: 'none'
      }

      const templates = templateRegistry.getTemplatesForSelections(selections)
      
      const templateIds = templates.map(t => t.metadata.id)
      expect(templateIds).toContain('nextjs-base')
      expect(templateIds).not.toContain('clerk')
      expect(templateIds).not.toContain('supabase')
      expect(templateIds).not.toContain('stripe')
    })
  })

  describe('Template Search', () => {
    beforeEach(() => {
      const templates = [
        {
          ...mockTemplate,
          metadata: {
            ...mockTemplate.metadata,
            id: 'clerk-auth',
            name: 'Clerk Authentication',
            description: 'User authentication with Clerk',
            tags: ['auth', 'clerk', 'authentication']
          }
        },
        {
          ...mockTemplate,
          metadata: {
            ...mockTemplate.metadata,
            id: 'supabase-db',
            name: 'Supabase Database',
            description: 'PostgreSQL database with Supabase',
            tags: ['database', 'supabase', 'postgresql']
          }
        }
      ]
      
      templates.forEach(template => templateRegistry.registerTemplate(template))
    })

    it('should search templates by name', () => {
      const results = templateRegistry.searchTemplates('Clerk')
      expect(results).toHaveLength(1)
      expect(results[0].metadata.id).toBe('clerk-auth')
    })

    it('should search templates by description', () => {
      const results = templateRegistry.searchTemplates('PostgreSQL')
      expect(results).toHaveLength(1)
      expect(results[0].metadata.id).toBe('supabase-db')
    })

    it('should search templates by tags', () => {
      const results = templateRegistry.searchTemplates('authentication')
      expect(results).toHaveLength(1)
      expect(results[0].metadata.id).toBe('clerk-auth')
    })

    it('should be case insensitive', () => {
      const results = templateRegistry.searchTemplates('CLERK')
      expect(results).toHaveLength(1)
      expect(results[0].metadata.id).toBe('clerk-auth')
    })

    it('should return empty array for no matches', () => {
      const results = templateRegistry.searchTemplates('nonexistent')
      expect(results).toHaveLength(0)
    })
  })

  describe('Popular Templates', () => {
    beforeEach(() => {
      const templates = [
        {
          ...mockTemplate,
          metadata: { ...mockTemplate.metadata, id: 'popular-1', popularity: 100 }
        },
        {
          ...mockTemplate,
          metadata: { ...mockTemplate.metadata, id: 'popular-2', popularity: 200 }
        },
        {
          ...mockTemplate,
          metadata: { ...mockTemplate.metadata, id: 'popular-3', popularity: 50 }
        }
      ]
      
      templates.forEach(template => templateRegistry.registerTemplate(template))
    })

    it('should return templates sorted by popularity', () => {
      const popular = templateRegistry.getPopularTemplates()
      
      expect(popular).toHaveLength(3)
      expect(popular[0].metadata.id).toBe('popular-2') // highest popularity
      expect(popular[1].metadata.id).toBe('popular-1')
      expect(popular[2].metadata.id).toBe('popular-3') // lowest popularity
    })

    it('should respect limit parameter', () => {
      const popular = templateRegistry.getPopularTemplates(2)
      
      expect(popular).toHaveLength(2)
      expect(popular[0].metadata.id).toBe('popular-2')
      expect(popular[1].metadata.id).toBe('popular-1')
    })
  })

  describe('File System Loading', () => {
    beforeEach(() => {
      // Mock file system structure
      mockFs.readdir.mockImplementation(async (dirPath: any) => {
        const pathStr = dirPath.toString()
        if (pathStr.includes('test-templates')) {
          return ['auth', 'database'] as any
        }
        if (pathStr.includes('auth')) {
          return ['clerk'] as any
        }
        if (pathStr.includes('database')) {
          return ['supabase'] as any
        }
        return [] as any
      })

      mockFs.stat.mockImplementation(async () => ({
        isDirectory: () => true
      }) as any)

      mockFs.readFile.mockImplementation(async (filePath: any) => {
        const pathStr = filePath.toString()
        if (pathStr.includes('template.json')) {
          return JSON.stringify({
            id: 'test-template',
            name: 'Test Template',
            description: 'Test description',
            category: 'auth',
            version: '1.0.0',
            complexity: 'simple',
            pricing: 'free',
            setupTime: 5,
            dependencies: [],
            conflicts: [],
            requiredEnvVars: [],
            optionalEnvVars: [],
            documentation: '',
            tags: [],
            popularity: 0,
            lastUpdated: new Date().toISOString()
          })
        }
        if (pathStr.includes('package.json')) {
          return JSON.stringify({
            dependencies: { 'test-dep': '^1.0.0' },
            devDependencies: { 'test-dev-dep': '^1.0.0' },
            scripts: { 'test': 'jest' }
          })
        }
        return 'test content'
      })
    })

    it('should initialize and load templates from file system', async () => {
      await templateRegistry.initialize()
      
      expect(mockFs.readdir).toHaveBeenCalled()
      expect(mockFs.readFile).toHaveBeenCalled()
    })

    it('should handle missing template directory gracefully', async () => {
      mockFs.readdir.mockRejectedValueOnce(new Error('Directory not found'))
      
      await expect(templateRegistry.initialize()).resolves.not.toThrow()
    })

    it('should handle corrupted template files gracefully', async () => {
      mockFs.readFile.mockImplementation(async (filePath: any) => {
        if (filePath.toString().includes('template.json')) {
          return 'invalid json'
        }
        return 'test content'
      })

      await expect(templateRegistry.initialize()).resolves.not.toThrow()
    })
  })

  describe('Validation Integration', () => {
    it('should validate selections using template validator', () => {
      const selections: TechSelections = {
        framework: 'nextjs',
        authentication: 'clerk',
        database: 'supabase',
        hosting: 'vercel',
        payments: 'stripe',
        analytics: 'posthog',
        email: 'resend',
        monitoring: 'sentry',
        ui: 'shadcn'
      }

      const result = templateRegistry.validateSelections(selections)
      
      expect(result).toBeDefined()
      expect(typeof result.isValid).toBe('boolean')
      expect(Array.isArray(result.errors)).toBe(true)
      expect(Array.isArray(result.warnings)).toBe(true)
    })

    it('should get recommendations for selections', () => {
      const selections: TechSelections = {
        framework: 'nextjs',
        authentication: 'clerk',
        database: 'none',
        hosting: 'vercel',
        payments: 'none',
        analytics: 'none',
        email: 'none',
        monitoring: 'none',
        ui: 'none'
      }

      const recommendations = templateRegistry.getRecommendations(selections)
      
      expect(Array.isArray(recommendations)).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle template registration errors gracefully', () => {
      const invalidTemplate = null as any
      
      expect(() => {
        templateRegistry.registerTemplate(invalidTemplate)
      }).not.toThrow()
    })

    it('should handle search with empty query', () => {
      const results = templateRegistry.searchTemplates('')
      expect(Array.isArray(results)).toBe(true)
    })

    it('should handle getTemplatesForSelections with invalid selections', () => {
      const invalidSelections = null as any
      
      expect(() => {
        templateRegistry.getTemplatesForSelections(invalidSelections)
      }).not.toThrow()
    })
  })
})