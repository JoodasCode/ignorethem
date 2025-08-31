import { TemplatesService } from '../templates-service'

describe('TemplatesService - Core Functionality', () => {
  let service: TemplatesService

  beforeEach(() => {
    service = new TemplatesService()
  })

  describe('extractTechnologies', () => {
    it('should extract technologies from template metadata', () => {
      const template = {
        metadata: { category: 'saas' },
        packageDependencies: { 'react': '^18.0.0', 'next': '^13.0.0' }
      }

      const result = (service as any).extractTechnologies(template)

      expect(result).toContain('saas')
      expect(result).toContain('react')
      expect(result).toContain('next')
      expect(result.length).toBe(3)
    })

    it('should handle empty dependencies', () => {
      const template = {
        metadata: { category: 'blog' },
        packageDependencies: {}
      }

      const result = (service as any).extractTechnologies(template)

      expect(result).toEqual(['blog'])
    })

    it('should deduplicate technologies', () => {
      const template = {
        metadata: { category: 'react' },
        packageDependencies: { 'react': '^18.0.0', 'react-dom': '^18.0.0' }
      }

      const result = (service as any).extractTechnologies(template)

      expect(result.filter(tech => tech === 'react')).toHaveLength(1)
    })
  })

  describe('extractFeatures', () => {
    it('should extract features from metadata tags', () => {
      const template = {
        metadata: { tags: ['auth', 'payments'] },
        setupInstructions: [{ category: 'database' }]
      }

      const result = (service as any).extractFeatures(template)

      expect(result).toContain('auth')
      expect(result).toContain('payments')
      expect(result).toContain('database')
    })

    it('should handle missing tags and instructions', () => {
      const template = {
        metadata: {},
        setupInstructions: []
      }

      const result = (service as any).extractFeatures(template)

      expect(result).toEqual([])
    })

    it('should deduplicate features', () => {
      const template = {
        metadata: { tags: ['auth', 'auth'] },
        setupInstructions: [{ category: 'auth' }]
      }

      const result = (service as any).extractFeatures(template)

      expect(result.filter(feature => feature === 'auth')).toHaveLength(1)
    })
  })

  describe('extractPreviewFiles', () => {
    it('should extract key files for preview', () => {
      const template = {
        files: [
          { path: 'package.json', content: '{"name": "test"}' },
          { path: 'app/page.tsx', content: 'export default function Page() {}' },
          { path: 'lib/auth.ts', content: 'export const auth = {}' },
          { path: 'components/button.tsx', content: 'export const Button = {}' }
        ]
      }

      const result = (service as any).extractPreviewFiles(template)

      expect(result['package.json']).toBeDefined()
      expect(result['app/page.tsx']).toBeDefined()
      expect(result['lib/auth.ts']).toBeDefined()
      expect(result['components/button.tsx']).toBeUndefined() // Not a key file
    })

    it('should limit content length for preview', () => {
      const longContent = 'a'.repeat(2000)
      const template = {
        files: [
          { path: 'package.json', content: longContent }
        ]
      }

      const result = (service as any).extractPreviewFiles(template)

      expect(result['package.json'].content.length).toBe(1000)
    })
  })

  describe('extractFullTemplate', () => {
    it('should extract all files', () => {
      const template = {
        files: [
          { path: 'file1.js', content: 'content1', executable: false },
          { path: 'file2.sh', content: 'content2', executable: true }
        ]
      }

      const result = (service as any).extractFullTemplate(template)

      expect(result['file1.js']).toEqual({
        content: 'content1',
        path: 'file1.js',
        executable: false
      })
      expect(result['file2.sh']).toEqual({
        content: 'content2',
        path: 'file2.sh',
        executable: true
      })
    })

    it('should handle empty files array', () => {
      const template = { files: [] }

      const result = (service as any).extractFullTemplate(template)

      expect(result).toEqual({})
    })
  })

  describe('mapComplexity', () => {
    it('should map complexity values correctly', () => {
      expect((service as any).mapComplexity('simple')).toBe('simple')
      expect((service as any).mapComplexity('complex')).toBe('complex')
      expect((service as any).mapComplexity('medium')).toBe('medium')
      expect((service as any).mapComplexity('moderate')).toBe('medium')
      expect((service as any).mapComplexity('unknown')).toBe('medium')
      expect((service as any).mapComplexity('')).toBe('medium')
    })
  })
})