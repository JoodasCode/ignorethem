import { CodeGenerator } from '../code-generator'
import { Template, TechSelections, TemplateFile } from '../types/template'

// Mock dependencies
jest.mock('../template-registry', () => ({
  templateRegistry: {
    getTemplatesForSelections: jest.fn(),
    initialize: jest.fn()
  }
}))

jest.mock('../template-validator', () => ({
  templateValidator: {
    validateSelections: jest.fn()
  }
}))

jest.mock('../dependency-manager', () => ({
  dependencyManager: {
    generatePackageJson: jest.fn(() => ({
      packageJson: {
        name: 'test-project',
        version: '0.1.0',
        dependencies: {},
        devDependencies: {},
        scripts: {}
      }
    }))
  }
}))

jest.mock('../config-generator', () => ({
  configGenerator: {
    generateEnvTemplate: jest.fn(() => ({ envExample: '' })),
    generateDeploymentConfigs: jest.fn(() => ({ files: [] })),
    generateNextJsConfigs: jest.fn(() => []),
    generateSetupInstructions: jest.fn(() => [])
  }
}))

jest.mock('../readme-generator', () => ({
  ReadmeGenerator: {
    generateSetupInstructions: jest.fn(() => 'Setup guide')
  }
}))

jest.mock('../env-docs-generator', () => ({
  EnvDocsGenerator: {
    generateEnvExample: jest.fn(() => ''),
    generateEnvLocalTemplate: jest.fn(() => ''),
    generateEnvDocs: jest.fn(() => '')
  }
}))

jest.mock('../input-validator', () => ({
  InputValidator: {
    validateProjectName: jest.fn(() => ({ isValid: true, errors: [], warnings: [], suggestions: [] })),
    validateSelections: jest.fn(() => ({ isValid: true, errors: [], warnings: [], suggestions: [] })),
    sanitizeProjectName: jest.fn((name) => name.toLowerCase().replace(/[^a-z0-9-]/g, '-')),
    validateFilePath: jest.fn(() => true),
    sanitizeFileContent: jest.fn((content) => content)
  }
}))

jest.mock('../performance-monitor', () => ({
  PerformanceMonitor: {
    startTimer: jest.fn(),
    endTimer: jest.fn(),
    setMemoryBaseline: jest.fn(),
    checkMemoryUsage: jest.fn(),
    checkMemoryGrowth: jest.fn()
  }
}))

jest.mock('../error-handling', () => ({
  ErrorRecovery: {
    recoverFromMergeConflict: jest.fn((path, existing, newContent) => existing)
  },
  CodeGenerationError: class extends Error {
    constructor(message, code, context) {
      super(message)
      this.code = code
      this.context = context
    }
  },
  CircularDependencyError: class extends Error {
    constructor(message, chain) {
      super(message)
      this.chain = chain
    }
  }
}))

const { templateRegistry } = require('../template-registry')
const { templateValidator } = require('../template-validator')

const mockTemplateRegistry = templateRegistry as jest.Mocked<typeof templateRegistry>
const mockTemplateValidator = templateValidator as jest.Mocked<typeof templateValidator>

describe('CodeGenerator', () => {
  let codeGenerator: CodeGenerator
  let mockTemplate: Template
  let mockSelections: TechSelections

  beforeEach(() => {
    codeGenerator = new CodeGenerator()
    
    mockTemplate = {
      metadata: {
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
        lastUpdated: new Date()
      },
      files: [
        {
          path: 'src/auth.ts',
          content: 'export const projectName = "{{projectName}}"'
        }
      ],
      envVars: [],
      setupInstructions: [],
      packageDependencies: {
        'react': '^18.0.0'
      },
      devDependencies: {
        'typescript': '^5.0.0'
      },
      scripts: {
        'dev': 'next dev'
      }
    }

    mockSelections = {
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

    // Setup mocks
    mockTemplateValidator.validateSelections.mockReturnValue({
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    })

    mockTemplateRegistry.getTemplatesForSelections.mockReturnValue([mockTemplate])

    jest.clearAllMocks()
  })

  describe('Project Generation', () => {
    it('should generate a complete project', async () => {
      const result = await codeGenerator.generateProject('test-project', mockSelections)

      expect(result).toBeDefined()
      expect(result.name).toBe('test-project')
      expect(result.selections).toEqual(mockSelections)
      expect(result.files).toBeDefined()
      expect(result.packageJson).toBeDefined()
      expect(result.metadata).toBeDefined()
      expect(result.metadata.generatedAt).toBeInstanceOf(Date)
    })

    it('should sanitize project name', async () => {
      const result = await codeGenerator.generateProject('Test Project!@#', mockSelections)

      expect(result.name).toBe('test-project')
    })

    it('should validate selections before generation', async () => {
      await codeGenerator.generateProject('test-project', mockSelections)

      expect(mockTemplateValidator.validateSelections).toHaveBeenCalledWith(mockSelections)
    })

    it('should throw error for invalid selections', async () => {
      mockTemplateValidator.validateSelections.mockReturnValue({
        isValid: false,
        errors: ['Invalid authentication selection'],
        warnings: [],
        suggestions: []
      })

      await expect(
        codeGenerator.generateProject('test-project', mockSelections)
      ).rejects.toThrow('Template validation failed')
    })

    it('should throw error for invalid project name', async () => {
      await expect(
        codeGenerator.generateProject('', mockSelections)
      ).rejects.toThrow('Invalid project name')
    })

    it('should handle template loading failure with recovery', async () => {
      mockTemplateRegistry.getTemplatesForSelections.mockImplementation(() => {
        throw new Error('Template loading failed')
      })

      const result = await codeGenerator.generateProject('test-project', mockSelections)

      expect(result).toBeDefined()
      expect(result.name).toBe('test-project')
    })
  })

  describe('Template Merging', () => {
    it('should merge single template', async () => {
      const result = await codeGenerator.mergeTemplates([mockTemplate])

      expect(result).toEqual(mockTemplate)
    })

    it('should merge multiple templates', async () => {
      const template1: Template = {
        ...mockTemplate,
        metadata: { ...mockTemplate.metadata, id: 'template1' },
        files: [
          { path: 'file1.ts', content: 'content1' }
        ],
        packageDependencies: { 'dep1': '^1.0.0' }
      }

      const template2: Template = {
        ...mockTemplate,
        metadata: { ...mockTemplate.metadata, id: 'template2' },
        files: [
          { path: 'file2.ts', content: 'content2' }
        ],
        packageDependencies: { 'dep2': '^2.0.0' }
      }

      const result = await codeGenerator.mergeTemplates([template1, template2])

      expect(result.files).toHaveLength(2)
      expect(result.files.find(f => f.path === 'file1.ts')).toBeDefined()
      expect(result.files.find(f => f.path === 'file2.ts')).toBeDefined()
      expect(result.packageDependencies).toEqual({
        'dep1': '^1.0.0',
        'dep2': '^2.0.0'
      })
    })

    it('should handle file conflicts with overwrite strategy', async () => {
      const template1: Template = {
        ...mockTemplate,
        files: [
          { path: 'config.ts', content: 'original content' }
        ]
      }

      const template2: Template = {
        ...mockTemplate,
        files: [
          { path: 'config.ts', content: 'new content', overwrite: true }
        ]
      }

      const result = await codeGenerator.mergeTemplates([template1, template2])

      expect(result.files).toHaveLength(1)
      expect(result.files[0].content).toBe('new content')
    })

    it('should merge package.json files intelligently', async () => {
      const template1: Template = {
        ...mockTemplate,
        files: [
          {
            path: 'package.json',
            content: JSON.stringify({
              name: 'test',
              dependencies: { 'react': '^18.0.0' },
              scripts: { 'dev': 'next dev' }
            }, null, 2)
          }
        ]
      }

      const template2: Template = {
        ...mockTemplate,
        files: [
          {
            path: 'package.json',
            content: JSON.stringify({
              name: 'test',
              dependencies: { 'typescript': '^5.0.0' },
              scripts: { 'build': 'next build' }
            }, null, 2)
          }
        ]
      }

      const result = await codeGenerator.mergeTemplates([template1, template2])
      const packageJsonFile = result.files.find(f => f.path === 'package.json')
      const packageJson = JSON.parse(packageJsonFile!.content)

      expect(packageJson.dependencies).toEqual({
        'react': '^18.0.0',
        'typescript': '^5.0.0'
      })
      expect(packageJson.scripts).toEqual({
        'dev': 'next dev',
        'build': 'next build'
      })
    })

    it('should merge environment files', async () => {
      const template1: Template = {
        ...mockTemplate,
        files: [
          {
            path: '.env.example',
            content: 'API_KEY=your_api_key\nDATABASE_URL=your_db_url'
          }
        ]
      }

      const template2: Template = {
        ...mockTemplate,
        files: [
          {
            path: '.env.example',
            content: 'STRIPE_KEY=your_stripe_key\nEMAIL_API_KEY=your_email_key'
          }
        ]
      }

      const result = await codeGenerator.mergeTemplates([template1, template2])
      const envFile = result.files.find(f => f.path === '.env.example')

      expect(envFile!.content).toContain('API_KEY=your_api_key')
      expect(envFile!.content).toContain('DATABASE_URL=your_db_url')
      expect(envFile!.content).toContain('STRIPE_KEY=your_stripe_key')
      expect(envFile!.content).toContain('EMAIL_API_KEY=your_email_key')
    })

    it('should handle circular dependencies', async () => {
      const template1: Template = {
        ...mockTemplate,
        metadata: {
          ...mockTemplate.metadata,
          id: 'template1',
          dependencies: ['template2']
        }
      }

      const template2: Template = {
        ...mockTemplate,
        metadata: {
          ...mockTemplate.metadata,
          id: 'template2',
          dependencies: ['template1']
        }
      }

      await expect(
        codeGenerator.mergeTemplates([template1, template2])
      ).rejects.toThrow('Circular dependency detected')
    })
  })

  describe('Template Variable Processing', () => {
    it('should process basic template variables', async () => {
      const template: Template = {
        ...mockTemplate,
        files: [
          {
            path: 'src/config.ts',
            content: 'export const projectName = "{{projectName}}"'
          }
        ]
      }

      mockTemplateRegistry.getTemplatesForSelections.mockReturnValue([template])

      const result = await codeGenerator.generateProject('my-awesome-project', mockSelections)
      const configFile = result.files.find(f => f.path === 'src/config.ts')

      expect(configFile!.content).toContain('export const projectName = "my-awesome-project"')
    })

    it('should process case variations of project name', async () => {
      const template: Template = {
        ...mockTemplate,
        files: [
          {
            path: 'src/config.ts',
            content: `
              export const projectName = "{{projectName}}"
              export const projectNameKebab = "{{projectNameKebab}}"
              export const projectNamePascal = "{{projectNamePascal}}"
              export const projectNameCamel = "{{projectNameCamel}}"
            `
          }
        ]
      }

      mockTemplateRegistry.getTemplatesForSelections.mockReturnValue([template])

      const result = await codeGenerator.generateProject('My Awesome Project', mockSelections)
      const configFile = result.files.find(f => f.path === 'src/config.ts')

      expect(configFile!.content).toContain('projectName = "My Awesome Project"')
      expect(configFile!.content).toContain('projectNameKebab = "my-awesome-project"')
      expect(configFile!.content).toContain('projectNamePascal = "MyAwesomeProject"')
      expect(configFile!.content).toContain('projectNameCamel = "myAwesomeProject"')
    })

    it('should process template variables in file paths', async () => {
      const template: Template = {
        ...mockTemplate,
        files: [
          {
            path: 'src/{{projectNameKebab}}/config.ts',
            content: 'export const config = {}'
          }
        ]
      }

      mockTemplateRegistry.getTemplatesForSelections.mockReturnValue([template])

      const result = await codeGenerator.generateProject('My Project', mockSelections)
      const configFile = result.files.find(f => f.path === 'src/my-project/config.ts')

      expect(configFile).toBeDefined()
    })

    it('should handle missing template variables gracefully', async () => {
      const template: Template = {
        ...mockTemplate,
        files: [
          {
            path: 'src/config.ts',
            content: 'export const unknown = "{{unknownVariable}}"'
          }
        ]
      }

      mockTemplateRegistry.getTemplatesForSelections.mockReturnValue([template])

      const result = await codeGenerator.generateProject('test-project', mockSelections)
      const configFile = result.files.find(f => f.path === 'src/config.ts')

      // Should leave unknown variables unchanged
      expect(configFile!.content).toContain('{{unknownVariable}}')
    })

    it('should process nested object variables', async () => {
      const template: Template = {
        ...mockTemplate,
        files: [
          {
            path: 'src/config.ts',
            content: 'export const auth = "{{selections.authentication}}"'
          }
        ]
      }

      mockTemplateRegistry.getTemplatesForSelections.mockReturnValue([template])

      const result = await codeGenerator.generateProject('test-project', mockSelections)
      const configFile = result.files.find(f => f.path === 'src/config.ts')

      expect(configFile!.content).toContain('export const auth = "clerk"')
    })
  })

  describe('Dependency Sorting', () => {
    it('should sort templates by dependencies', async () => {
      const baseTemplate: Template = {
        ...mockTemplate,
        metadata: {
          ...mockTemplate.metadata,
          id: 'base',
          dependencies: []
        }
      }

      const authTemplate: Template = {
        ...mockTemplate,
        metadata: {
          ...mockTemplate.metadata,
          id: 'auth',
          dependencies: ['base']
        }
      }

      const dbTemplate: Template = {
        ...mockTemplate,
        metadata: {
          ...mockTemplate.metadata,
          id: 'database',
          dependencies: ['base', 'auth']
        }
      }

      const result = await codeGenerator.mergeTemplates([dbTemplate, authTemplate, baseTemplate])

      // Should not throw error and should merge successfully
      expect(result).toBeDefined()
    })

    it('should handle templates with no dependencies', async () => {
      const template1: Template = {
        ...mockTemplate,
        metadata: { ...mockTemplate.metadata, id: 'template1', dependencies: [] }
      }

      const template2: Template = {
        ...mockTemplate,
        metadata: { ...mockTemplate.metadata, id: 'template2', dependencies: [] }
      }

      const result = await codeGenerator.mergeTemplates([template1, template2])

      expect(result).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle empty template list', async () => {
      mockTemplateRegistry.getTemplatesForSelections.mockReturnValue([])

      const result = await codeGenerator.generateProject('test-project', mockSelections)

      // Should use fallback templates
      expect(result).toBeDefined()
      expect(result.name).toBe('test-project')
    })

    it('should handle template processing errors gracefully', async () => {
      const corruptedTemplate: Template = {
        ...mockTemplate,
        files: [
          {
            path: 'package.json',
            content: 'invalid json content'
          }
        ]
      }

      mockTemplateRegistry.getTemplatesForSelections.mockReturnValue([corruptedTemplate])

      const result = await codeGenerator.generateProject('test-project', mockSelections)

      expect(result).toBeDefined()
    })

    it('should validate file paths for security', async () => {
      const maliciousTemplate: Template = {
        ...mockTemplate,
        files: [
          {
            path: '../../../etc/passwd',
            content: 'malicious content'
          },
          {
            path: 'valid/path.ts',
            content: 'valid content'
          }
        ]
      }

      mockTemplateRegistry.getTemplatesForSelections.mockReturnValue([maliciousTemplate])

      const result = await codeGenerator.generateProject('test-project', mockSelections)

      // Should filter out malicious paths
      const maliciousFile = result.files.find(f => f.path.includes('../../../etc/passwd'))
      const validFile = result.files.find(f => f.path === 'valid/path.ts')

      expect(maliciousFile).toBeUndefined()
      expect(validFile).toBeDefined()
    })
  })

  describe('Case Conversion Utilities', () => {
    it('should convert to kebab-case correctly', async () => {
      const testCases = [
        ['MyProject', 'my-project'],
        ['my project', 'my-project'],
        ['My_Project_Name', 'my-project-name'],
        ['myProjectName', 'my-project-name'],
        ['UPPERCASE', 'uppercase']
      ]

      for (const [input, expected] of testCases) {
        const template: Template = {
          ...mockTemplate,
          files: [{ path: 'test.ts', content: '{{projectNameKebab}}' }]
        }

        mockTemplateRegistry.getTemplatesForSelections.mockReturnValue([template])

        const result = await codeGenerator.generateProject(input, mockSelections)
        const file = result.files.find(f => f.path === 'test.ts')

        expect(file!.content).toBe(expected)
      }
    })

    it('should convert to PascalCase correctly', async () => {
      const testCases = [
        ['my-project', 'MyProject'],
        ['my project', 'MyProject'],
        ['my_project_name', 'MyProjectName'],
        ['myProjectName', 'MyProjectName']
      ]

      for (const [input, expected] of testCases) {
        const template: Template = {
          ...mockTemplate,
          files: [{ path: 'test.ts', content: '{{projectNamePascal}}' }]
        }

        mockTemplateRegistry.getTemplatesForSelections.mockReturnValue([template])

        const result = await codeGenerator.generateProject(input, mockSelections)
        const file = result.files.find(f => f.path === 'test.ts')

        expect(file!.content).toBe(expected)
      }
    })

    it('should convert to camelCase correctly', async () => {
      const testCases = [
        ['my-project', 'myProject'],
        ['My Project', 'myProject'],
        ['my_project_name', 'myProjectName'],
        ['MyProjectName', 'myProjectName']
      ]

      for (const [input, expected] of testCases) {
        const template: Template = {
          ...mockTemplate,
          files: [{ path: 'test.ts', content: '{{projectNameCamel}}' }]
        }

        mockTemplateRegistry.getTemplatesForSelections.mockReturnValue([template])

        const result = await codeGenerator.generateProject(input, mockSelections)
        const file = result.files.find(f => f.path === 'test.ts')

        expect(file!.content).toBe(expected)
      }
    })
  })
})