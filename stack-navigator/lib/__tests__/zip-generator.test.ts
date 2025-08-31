import { ZipGeneratorService } from '../zip-generator'
import { GeneratedProject, TechSelections } from '../types/template'
import { UsageTrackingService } from '../usage-tracking'
import JSZip from 'jszip'

// Mock dependencies
jest.mock('../usage-tracking')
jest.mock('../performance-monitor')
jest.mock('../error-handling')

const mockUsageTrackingService = UsageTrackingService as jest.Mocked<typeof UsageTrackingService>

describe('ZipGeneratorService', () => {
  const mockProject: GeneratedProject = {
    name: 'test-project',
    files: [
      {
        path: 'package.json',
        content: JSON.stringify({ name: 'test-project', version: '1.0.0' }, null, 2)
      },
      {
        path: 'src/index.ts',
        content: 'console.log("Hello, world!");'
      },
      {
        path: 'README.md',
        content: '# Test Project\n\nThis is a test project.'
      }
    ],
    packageJson: {
      name: 'test-project',
      version: '1.0.0',
      dependencies: {}
    },
    envTemplate: 'NODE_ENV=development\nAPI_KEY=your_api_key_here',
    setupGuide: '# Setup Guide\n\n1. Install dependencies\n2. Run the project',
    selections: {
      framework: 'nextjs',
      authentication: 'clerk',
      database: 'supabase',
      hosting: 'vercel',
      payments: 'stripe',
      analytics: 'posthog',
      email: 'resend',
      monitoring: 'sentry',
      ui: 'shadcn'
    } as TechSelections,
    metadata: {
      generatedAt: new Date(),
      templateVersions: { 'nextjs': '1.0.0', 'clerk': '1.0.0' },
      estimatedSetupTime: 30
    }
  }

  const mockOptions = {
    userId: 'test-user-id',
    projectName: 'test-project',
    includeReadme: true,
    includeEnvTemplate: true,
    compressionLevel: 6
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('generateProjectZip', () => {
    it('should generate ZIP file successfully when usage limits allow', async () => {
      // Mock usage check to allow generation
      mockUsageTrackingService.checkStackGeneration.mockResolvedValue({
        allowed: true,
        remainingCount: 5
      })
      mockUsageTrackingService.incrementStackGeneration.mockResolvedValue(true)

      const result = await ZipGeneratorService.generateProjectZip(mockProject, mockOptions)

      expect(result.success).toBe(true)
      expect(result.zipBuffer).toBeDefined()
      expect(result.filename).toMatch(/test-project-\d{4}-\d{2}-\d{2}\.zip/)
      expect(result.size).toBeGreaterThan(0)
      expect(result.usageInfo?.remainingGenerations).toBe(4)
    })

    it('should reject generation when usage limits exceeded', async () => {
      // Mock usage check to deny generation
      mockUsageTrackingService.checkStackGeneration.mockResolvedValue({
        allowed: false,
        reason: 'Monthly limit exceeded',
        upgradeRequired: true,
        remainingCount: 0
      })

      const result = await ZipGeneratorService.generateProjectZip(mockProject, mockOptions)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Monthly limit exceeded')
      expect(result.usageInfo?.upgradeRequired).toBe(true)
      expect(mockUsageTrackingService.incrementStackGeneration).not.toHaveBeenCalled()
    })

    it('should include all project files in ZIP', async () => {
      mockUsageTrackingService.checkStackGeneration.mockResolvedValue({
        allowed: true,
        remainingCount: 5
      })
      mockUsageTrackingService.incrementStackGeneration.mockResolvedValue(true)

      const result = await ZipGeneratorService.generateProjectZip(mockProject, mockOptions)

      expect(result.success).toBe(true)
      
      // Verify ZIP contents
      const zip = new JSZip()
      const loadedZip = await zip.loadAsync(result.zipBuffer!)
      
      // Check that all project files are included
      expect(loadedZip.files['package.json']).toBeDefined()
      expect(loadedZip.files['src/index.ts']).toBeDefined()
      expect(loadedZip.files['README.md']).toBeDefined()
      expect(loadedZip.files['.env.example']).toBeDefined()
      expect(loadedZip.files['.stack-navigator.json']).toBeDefined()
    })

    it('should handle executable files correctly', async () => {
      const projectWithExecutable = {
        ...mockProject,
        files: [
          ...mockProject.files,
          {
            path: 'scripts/deploy.sh',
            content: '#!/bin/bash\necho "Deploying..."',
            executable: true
          }
        ]
      }

      mockUsageTrackingService.checkStackGeneration.mockResolvedValue({
        allowed: true,
        remainingCount: 5
      })
      mockUsageTrackingService.incrementStackGeneration.mockResolvedValue(true)

      const result = await ZipGeneratorService.generateProjectZip(projectWithExecutable, mockOptions)

      expect(result.success).toBe(true)
      
      // Verify executable file is included
      const zip = new JSZip()
      const loadedZip = await zip.loadAsync(result.zipBuffer!)
      expect(loadedZip.files['scripts/deploy.sh']).toBeDefined()
    })

    it('should validate project data before generation', async () => {
      const invalidProject = {
        ...mockProject,
        name: '', // Invalid empty name
        files: []  // No files
      }

      mockUsageTrackingService.checkStackGeneration.mockResolvedValue({
        allowed: true,
        remainingCount: 5
      })

      const result = await ZipGeneratorService.generateProjectZip(invalidProject, mockOptions)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Project name is required')
    })

    it('should reject files with invalid paths', async () => {
      const projectWithInvalidPaths = {
        ...mockProject,
        files: [
          {
            path: '../../../etc/passwd', // Path traversal attempt
            content: 'malicious content'
          },
          {
            path: 'C:\\Windows\\System32\\config', // Absolute Windows path
            content: 'malicious content'
          }
        ]
      }

      mockUsageTrackingService.checkStackGeneration.mockResolvedValue({
        allowed: true,
        remainingCount: 5
      })

      const result = await ZipGeneratorService.generateProjectZip(projectWithInvalidPaths, mockOptions)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid file path')
    })

    it('should handle large projects within limits', async () => {
      // Create a project with many files but within limits
      const largeProject = {
        ...mockProject,
        files: Array.from({ length: 100 }, (_, i) => ({
          path: `src/component-${i}.tsx`,
          content: `export const Component${i} = () => <div>Component ${i}</div>;`
        }))
      }

      mockUsageTrackingService.checkStackGeneration.mockResolvedValue({
        allowed: true,
        remainingCount: 5
      })
      mockUsageTrackingService.incrementStackGeneration.mockResolvedValue(true)

      const result = await ZipGeneratorService.generateProjectZip(largeProject, mockOptions)

      expect(result.success).toBe(true)
      expect(result.size).toBeGreaterThan(0)
    })

    it('should reject projects with too many files', async () => {
      // Create a project exceeding file limit
      const oversizedProject = {
        ...mockProject,
        files: Array.from({ length: 1001 }, (_, i) => ({
          path: `src/file-${i}.ts`,
          content: `// File ${i}`
        }))
      }

      mockUsageTrackingService.checkStackGeneration.mockResolvedValue({
        allowed: true,
        remainingCount: 5
      })

      const result = await ZipGeneratorService.generateProjectZip(oversizedProject, mockOptions)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Too many files')
    })

    it('should sanitize file content', async () => {
      const projectWithScripts = {
        ...mockProject,
        files: [
          {
            path: 'index.html',
            content: '<html><script>alert("xss")</script><body>Content</body></html>'
          }
        ]
      }

      mockUsageTrackingService.checkStackGeneration.mockResolvedValue({
        allowed: true,
        remainingCount: 5
      })
      mockUsageTrackingService.incrementStackGeneration.mockResolvedValue(true)

      const result = await ZipGeneratorService.generateProjectZip(projectWithScripts, mockOptions)

      expect(result.success).toBe(true)
      
      // Verify script tags are removed from non-code files
      const zip = new JSZip()
      const loadedZip = await zip.loadAsync(result.zipBuffer!)
      const htmlContent = await loadedZip.files['index.html'].async('string')
      expect(htmlContent).not.toContain('<script>')
    })

    it('should include metadata file', async () => {
      mockUsageTrackingService.checkStackGeneration.mockResolvedValue({
        allowed: true,
        remainingCount: 5
      })
      mockUsageTrackingService.incrementStackGeneration.mockResolvedValue(true)

      const result = await ZipGeneratorService.generateProjectZip(mockProject, mockOptions)

      expect(result.success).toBe(true)
      
      // Verify metadata file is included and contains correct data
      const zip = new JSZip()
      const loadedZip = await zip.loadAsync(result.zipBuffer!)
      const metadataFile = loadedZip.files['.stack-navigator.json']
      expect(metadataFile).toBeDefined()
      
      const metadata = JSON.parse(await metadataFile.async('string'))
      expect(metadata.generatedBy).toBe('Stack Navigator')
      expect(metadata.selections).toEqual(mockProject.selections)
      expect(metadata.templateVersions).toEqual(mockProject.metadata.templateVersions)
    })

    it('should handle usage tracking failures gracefully', async () => {
      mockUsageTrackingService.checkStackGeneration.mockResolvedValue({
        allowed: true,
        remainingCount: 5
      })
      // Mock increment to fail
      mockUsageTrackingService.incrementStackGeneration.mockRejectedValue(
        new Error('Database connection failed')
      )

      const result = await ZipGeneratorService.generateProjectZip(mockProject, mockOptions)

      // Should still succeed even if usage tracking fails
      expect(result.success).toBe(true)
      expect(result.zipBuffer).toBeDefined()
    })

    it('should respect compression level option', async () => {
      mockUsageTrackingService.checkStackGeneration.mockResolvedValue({
        allowed: true,
        remainingCount: 5
      })
      mockUsageTrackingService.incrementStackGeneration.mockResolvedValue(true)

      // Test with different compression levels
      const lowCompressionOptions = { ...mockOptions, compressionLevel: 1 }
      const highCompressionOptions = { ...mockOptions, compressionLevel: 9 }

      const lowCompressionResult = await ZipGeneratorService.generateProjectZip(
        mockProject, 
        lowCompressionOptions
      )
      const highCompressionResult = await ZipGeneratorService.generateProjectZip(
        mockProject, 
        highCompressionOptions
      )

      expect(lowCompressionResult.success).toBe(true)
      expect(highCompressionResult.success).toBe(true)
      
      // Higher compression should result in smaller file (for this test data)
      expect(highCompressionResult.size).toBeLessThanOrEqual(lowCompressionResult.size)
    })
  })

  describe('filename generation', () => {
    it('should generate valid filenames', async () => {
      mockUsageTrackingService.checkStackGeneration.mockResolvedValue({
        allowed: true,
        remainingCount: 5
      })
      mockUsageTrackingService.incrementStackGeneration.mockResolvedValue(true)

      const testCases = [
        { input: 'My Project', expected: /my-project-\d{4}-\d{2}-\d{2}\.zip/ },
        { input: 'project_with_underscores', expected: /project-with-underscores-\d{4}-\d{2}-\d{2}\.zip/ },
        { input: 'Project123!@#', expected: /project123-\d{4}-\d{2}-\d{2}\.zip/ }
      ]

      for (const testCase of testCases) {
        const options = { ...mockOptions, projectName: testCase.input }
        const result = await ZipGeneratorService.generateProjectZip(mockProject, options)
        
        expect(result.success).toBe(true)
        expect(result.filename).toMatch(testCase.expected)
      }
    })
  })
})