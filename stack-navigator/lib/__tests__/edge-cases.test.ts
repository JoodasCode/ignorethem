import { codeGenerator } from '../code-generator'
import { InputValidator } from '../input-validator'
import { PerformanceMonitor } from '../performance-monitor'
import { ErrorRecovery, CodeGenerationError } from '../error-handling'
import { TechSelections } from '../types/template'

describe('Edge Cases and Error Handling', () => {
  describe('Input Validation', () => {
    it('should handle invalid project names', () => {
      const invalidNames = [
        '', // empty
        '   ', // whitespace only
        'a'.repeat(300), // too long
        'my/project', // invalid characters
        'node_modules', // reserved name
        'test@#$%', // special characters
      ]

      for (const name of invalidNames) {
        const result = InputValidator.validateProjectName(name)
        expect(result.isValid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
      }
    })

    it('should sanitize project names correctly', () => {
      expect(InputValidator.sanitizeProjectName('  My Awesome App!  ')).toBe('my-awesome-app')
      expect(InputValidator.sanitizeProjectName('Test@#$%Project')).toBe('testproject')
      expect(InputValidator.sanitizeProjectName('multiple---dashes')).toBe('multiple-dashes')
    })

    it('should validate file paths for security', () => {
      expect(InputValidator.validateFilePath('../../../etc/passwd')).toBe(false)
      expect(InputValidator.validateFilePath('/absolute/path')).toBe(false)
      expect(InputValidator.validateFilePath('C:\\Windows\\System32')).toBe(false)
      expect(InputValidator.validateFilePath('file\0with\0nulls')).toBe(false)
      expect(InputValidator.validateFilePath('valid/relative/path.js')).toBe(true)
    })

    it('should validate environment variable keys', () => {
      expect(InputValidator.validateEnvVarKey('VALID_ENV_VAR')).toBe(true)
      expect(InputValidator.validateEnvVarKey('_ALSO_VALID')).toBe(true)
      expect(InputValidator.validateEnvVarKey('123_INVALID')).toBe(false)
      expect(InputValidator.validateEnvVarKey('invalid-chars')).toBe(false)
    })
  })

  describe('Error Recovery', () => {
    it('should recover from template loading failures', () => {
      const fallback = ErrorRecovery.recoverFromTemplateFailure('missing-template', new Error('Not found'))
      
      expect(fallback).toBeDefined()
      expect(fallback.metadata.id).toBe('missing-template')
      expect(fallback.files).toEqual([])
    })

    it('should recover from dependency resolution failures', () => {
      const recovered = ErrorRecovery.recoverFromDependencyFailure('react', ['^17.0.0', '^18.0.0'])
      
      expect(recovered).toBe('^17.0.0') // Should use first version
    })

    it('should recover from merge conflicts', () => {
      const recovered = ErrorRecovery.recoverFromMergeConflict(
        'package.json',
        '{"name": "old"}',
        '{"name": "new"}'
      )
      
      expect(recovered).toContain('{"name": "old"}')
      expect(recovered).toContain('{"name": "new"}')
      expect(recovered).toContain('MERGE CONFLICT')
    })
  })

  describe('Performance Monitoring', () => {
    it('should track operation timing', () => {
      PerformanceMonitor.startTimer('test-operation')
      
      // Simulate some work
      const start = Date.now()
      while (Date.now() - start < 10) {
        // Wait 10ms
      }
      
      const duration = PerformanceMonitor.endTimer('test-operation')
      expect(duration).toBeGreaterThanOrEqual(10)
    })

    it('should handle missing timers gracefully', () => {
      const duration = PerformanceMonitor.endTimer('non-existent-timer')
      expect(duration).toBe(0)
    })
  })

  describe('Code Generation Edge Cases', () => {
    const validSelections: TechSelections = {
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

    it('should handle empty template arrays with recovery', async () => {
      // Mock empty template registry
      const originalMethod = require('../template-registry').templateRegistry.getTemplatesForSelections
      require('../template-registry').templateRegistry.getTemplatesForSelections = jest.fn().mockReturnValue([])

      try {
        // Should succeed with fallback templates
        const result = await codeGenerator.generateProject('test-app', validSelections)
        expect(result).toBeDefined()
        expect(result.name).toBe('test-app')
        expect(result.files.length).toBeGreaterThan(0)
        expect(result.metadata.warnings).toBeDefined()
      } finally {
        require('../template-registry').templateRegistry.getTemplatesForSelections = originalMethod
      }
    })

    it('should handle invalid project names', async () => {
      await expect(codeGenerator.generateProject('', validSelections))
        .rejects.toThrow(CodeGenerationError)
      
      await expect(codeGenerator.generateProject('invalid/name', validSelections))
        .rejects.toThrow(CodeGenerationError)
    })

    it('should handle invalid selections', async () => {
      const invalidSelections = {
        ...validSelections,
        framework: 'invalid-framework' as any
      }

      await expect(codeGenerator.generateProject('test-app', invalidSelections))
        .rejects.toThrow(CodeGenerationError)
    })

    it('should handle large file content', () => {
      const largeContent = 'x'.repeat(1024 * 1024) // 1MB
      
      expect(() => InputValidator.sanitizeFileContent(largeContent)).not.toThrow()
      
      const tooLargeContent = 'x'.repeat(11 * 1024 * 1024) // 11MB
      expect(() => InputValidator.sanitizeFileContent(tooLargeContent)).toThrow()
    })

    it('should handle circular dependencies gracefully', () => {
      const templatesWithCircularDeps = [
        {
          metadata: {
            id: 'template-a',
            dependencies: ['template-b'],
            name: 'Template A',
            version: '1.0.0',
            category: 'base' as const,
            setupTime: 5
          },
          files: [],
          envVars: [],
          setupInstructions: [],
          packageDependencies: {},
          devDependencies: {},
          scripts: {}
        },
        {
          metadata: {
            id: 'template-b',
            dependencies: ['template-a'], // Circular dependency
            name: 'Template B',
            version: '1.0.0',
            category: 'auth' as const,
            setupTime: 5
          },
          files: [],
          envVars: [],
          setupInstructions: [],
          packageDependencies: {},
          devDependencies: {},
          scripts: {}
        }
      ]

      const generator = codeGenerator as any
      expect(() => generator.sortTemplatesByDependencies(templatesWithCircularDeps))
        .toThrow(/Circular dependency/)
    })

    it('should handle malformed JSON in template files', () => {
      const generator = codeGenerator as any
      
      const existingFile = {
        path: 'package.json',
        content: '{"name": "test"' // Malformed JSON
      }
      
      const newFile = {
        path: 'package.json',
        content: '{"version": "1.0.0"}'
      }

      const result = generator.mergePackageJsonFiles(existingFile, newFile)
      expect(result).toBe(newFile) // Should fallback to new file
    })

    it('should handle null and undefined values in template variables', () => {
      const generator = codeGenerator as any
      
      const context = {
        projectName: 'test',
        undefinedValue: undefined,
        nullValue: null
      }

      const content = 'Project: {{projectName}}, Undefined: {{undefinedValue}}, Null: {{nullValue}}'
      const processed = generator.processVariables(content, context)
      
      expect(processed).toContain('Project: test')
      expect(processed).toContain('Undefined: {{undefinedValue}}') // Should remain unchanged
      expect(processed).toContain('Null: {{nullValue}}') // Should remain unchanged for null values
    })
  })

  describe('Memory and Performance Edge Cases', () => {
    it('should handle large numbers of templates', async () => {
      const manyTemplates = Array.from({ length: 100 }, (_, i) => ({
        metadata: {
          id: `template-${i}`,
          name: `Template ${i}`,
          version: '1.0.0',
          category: 'other' as const,
          dependencies: [],
          setupTime: 1
        },
        files: [{
          path: `file-${i}.js`,
          content: `// File ${i}\nconsole.log('Template ${i}');`
        }],
        envVars: [],
        setupInstructions: [],
        packageDependencies: {},
        devDependencies: {},
        scripts: {}
      }))

      const generator = codeGenerator as any
      const merged = await generator.mergeTemplates(manyTemplates)
      
      expect(merged.files).toHaveLength(100)
    })

    it('should handle deeply nested template variables', () => {
      const generator = codeGenerator as any
      
      const context = {
        level1: {
          level2: {
            level3: {
              value: 'deep-value'
            }
          }
        }
      }

      const content = 'Deep value: {{level1.level2.level3.value}}'
      const processed = generator.processVariables(content, context)
      
      expect(processed).toBe('Deep value: deep-value')
    })
  })
})