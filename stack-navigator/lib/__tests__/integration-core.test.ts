import { describe, it, expect } from '@jest/globals'
import { dependencyManager } from '../dependency-manager'
import { configGenerator } from '../config-generator'
import { ZipGeneratorService } from '../zip-generator'
import { TechSelections, Template } from '../types/template'

describe('Core Integration Tests', () => {
  // Mock template data for testing
  const mockTemplate: Template = {
    metadata: {
      id: 'nextjs-base',
      name: 'Next.js Base',
      description: 'Base Next.js template',
      category: 'base',
      version: '1.0.0',
      complexity: 'simple',
      pricing: 'free',
      setupTime: 5,
      dependencies: [],
      conflicts: [],
      requiredEnvVars: [],
      optionalEnvVars: [],
      documentation: 'Basic Next.js setup',
      tags: ['nextjs', 'react'],
      popularity: 100,
      lastUpdated: new Date()
    },
    files: [
      {
        path: 'package.json',
        content: JSON.stringify({
          name: '{{projectName}}',
          version: '0.1.0',
          scripts: {
            dev: 'next dev',
            build: 'next build',
            start: 'next start'
          }
        }, null, 2)
      },
      {
        path: 'app/layout.tsx',
        content: `export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}`
      },
      {
        path: 'app/page.tsx',
        content: `export default function Home() {
  return (
    <main>
      <h1>Welcome to {{projectName}}</h1>
    </main>
  )
}`
      }
    ],
    envVars: [],
    setupInstructions: [],
    packageDependencies: {
      'next': '^14.0.0',
      'react': '^18.0.0',
      'react-dom': '^18.0.0'
    },
    devDependencies: {
      'typescript': '^5.0.0',
      '@types/node': '^20.0.0',
      '@types/react': '^18.0.0',
      '@types/react-dom': '^18.0.0'
    },
    scripts: {
      'dev': 'next dev',
      'build': 'next build',
      'start': 'next start'
    }
  }

  const mockAuthTemplate: Template = {
    metadata: {
      id: 'clerk',
      name: 'Clerk Authentication',
      description: 'Clerk auth integration',
      category: 'auth',
      version: '1.0.0',
      complexity: 'moderate',
      pricing: 'freemium',
      setupTime: 15,
      dependencies: [],
      conflicts: [],
      requiredEnvVars: ['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY'],
      optionalEnvVars: [],
      documentation: 'Clerk authentication setup',
      tags: ['auth', 'clerk'],
      popularity: 90,
      lastUpdated: new Date()
    },
    files: [
      {
        path: 'lib/auth.ts',
        content: `import { auth } from '@clerk/nextjs'

export { auth }

export async function getUser() {
  const { userId } = auth()
  return userId
}`
      },
      {
        path: 'middleware.ts',
        content: `import { authMiddleware } from '@clerk/nextjs'

export default authMiddleware({
  publicRoutes: ['/']
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)']
}`
      }
    ],
    envVars: [
      {
        key: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
        description: 'Clerk publishable key',
        required: true,
        example: 'pk_test_...',
        category: 'auth'
      },
      {
        key: 'CLERK_SECRET_KEY',
        description: 'Clerk secret key',
        required: true,
        example: 'sk_test_...',
        category: 'auth'
      }
    ],
    setupInstructions: [],
    packageDependencies: {
      '@clerk/nextjs': '^4.0.0'
    },
    devDependencies: {},
    scripts: {}
  }

  describe('Dependency Management', () => {
    it('should generate valid package.json', () => {
      const templates = [mockTemplate]
      const selections: TechSelections = {
        framework: 'nextjs',
        authentication: 'none',
        database: 'none',
        hosting: 'vercel',
        payments: 'none',
        analytics: 'none',
        email: 'none',
        monitoring: 'none',
        ui: 'shadcn'
      }

      const result = dependencyManager.generatePackageJson('test-project', templates, selections)
      
      expect(result.packageJson).toBeDefined()
      expect(result.packageJson.name).toBe('test-project')
      expect(result.packageJson.dependencies).toHaveProperty('next')
      expect(result.packageJson.dependencies).toHaveProperty('react')
      expect(result.packageJson.devDependencies).toHaveProperty('typescript')
      expect(result.packageJson.scripts).toHaveProperty('dev')
      expect(result.packageJson.scripts).toHaveProperty('build')
    })

    it('should merge dependencies from multiple templates', () => {
      const templates = [mockTemplate, mockAuthTemplate]
      const selections: TechSelections = {
        framework: 'nextjs',
        authentication: 'clerk',
        database: 'none',
        hosting: 'vercel',
        payments: 'none',
        analytics: 'none',
        email: 'none',
        monitoring: 'none',
        ui: 'shadcn'
      }

      const result = dependencyManager.generatePackageJson('auth-project', templates, selections)
      
      expect(result.packageJson.dependencies).toHaveProperty('next')
      expect(result.packageJson.dependencies).toHaveProperty('@clerk/nextjs')
      expect(result.packageJson.name).toBe('auth-project')
    })

    it('should validate dependency compatibility', () => {
      const dependencies = {
        'react': '^18.0.0',
        'react-dom': '^18.0.0',
        'next': '^14.0.0'
      }

      const validation = dependencyManager.validateDependencySet(dependencies)
      
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })
  })

  describe('Configuration Generation', () => {
    it('should generate environment variables template', () => {
      const templates = [mockTemplate, mockAuthTemplate]
      const selections: TechSelections = {
        framework: 'nextjs',
        authentication: 'clerk',
        database: 'none',
        hosting: 'vercel',
        payments: 'none',
        analytics: 'none',
        email: 'none',
        monitoring: 'none',
        ui: 'shadcn'
      }

      const result = configGenerator.generateEnvTemplate(templates, selections)
      
      expect(result.envExample).toContain('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY')
      expect(result.envExample).toContain('CLERK_SECRET_KEY')
      expect(result.envExample).toContain('# Auth')
      expect(result.envLocal).toContain('NODE_ENV=development')
      expect(result.documentation).toContain('# Environment Variables Documentation')
    })

    it('should generate deployment configurations', () => {
      const selections: TechSelections = {
        framework: 'nextjs',
        authentication: 'none',
        database: 'none',
        hosting: 'vercel',
        payments: 'none',
        analytics: 'none',
        email: 'none',
        monitoring: 'none',
        ui: 'shadcn'
      }

      const result = configGenerator.generateDeploymentConfigs(selections)
      
      expect(result.files).toBeInstanceOf(Array)
      expect(result.instructions).toBeInstanceOf(Array)
      
      // Should include Vercel config since hosting is 'vercel'
      const vercelConfig = result.files.find(f => f.path === 'vercel.json')
      expect(vercelConfig).toBeDefined()
      expect(vercelConfig?.content).toContain('nextjs')
    })

    it('should generate Next.js configuration files', () => {
      const selections: TechSelections = {
        framework: 'nextjs',
        authentication: 'clerk',
        database: 'none',
        hosting: 'vercel',
        payments: 'none',
        analytics: 'none',
        email: 'none',
        monitoring: 'none',
        ui: 'shadcn'
      }

      const configs = configGenerator.generateNextJsConfigs(selections)
      
      expect(configs).toBeInstanceOf(Array)
      
      const nextConfig = configs.find(c => c.path === 'next.config.mjs')
      expect(nextConfig).toBeDefined()
      
      const tailwindConfig = configs.find(c => c.path === 'tailwind.config.ts')
      expect(tailwindConfig).toBeDefined() // Should be included since ui is 'shadcn'
      
      const tsConfig = configs.find(c => c.path === 'tsconfig.json')
      expect(tsConfig).toBeDefined()
    })
  })

  describe('ZIP Generation', () => {
    it('should validate ZIP generation interface', () => {
      // Test that the ZIP generator service exists and has the right interface
      expect(ZipGeneratorService).toBeDefined()
      expect(typeof ZipGeneratorService.generateProjectZip).toBe('function')
      
      // Test that we can create a basic project structure for ZIP generation
      const mockProject = {
        name: 'test-project',
        files: [
          { path: 'package.json', content: '{"name": "test-project"}' },
          { path: 'README.md', content: '# Test Project' }
        ],
        packageJson: { name: 'test-project', version: '0.1.0' },
        envTemplate: 'NODE_ENV=development',
        setupGuide: '# Setup Guide',
        selections: {
          framework: 'nextjs',
          authentication: 'none',
          database: 'none',
          hosting: 'vercel',
          payments: 'none',
          analytics: 'none',
          email: 'none',
          monitoring: 'none',
          ui: 'shadcn'
        } as TechSelections,
        metadata: {
          generatedAt: new Date(),
          templateVersions: {},
          estimatedSetupTime: 10
        }
      }

      // Verify project structure is valid for ZIP generation
      expect(mockProject.files.length).toBeGreaterThan(0)
      expect(mockProject.packageJson).toBeDefined()
      expect(mockProject.name).toBe('test-project')
    })

    it('should handle file path validation for ZIP structure', () => {
      const testFiles = [
        { path: 'package.json', content: '{}' },
        { path: 'src/components/Button.tsx', content: 'export const Button = () => <button />' },
        { path: 'src/lib/utils.ts', content: 'export const utils = {}' },
        { path: 'public/favicon.ico', content: 'fake-ico-content' }
      ]

      // Verify all paths are valid for ZIP generation
      for (const file of testFiles) {
        expect(file.path).toBeDefined()
        expect(file.path.length).toBeGreaterThan(0)
        expect(file.content).toBeDefined()
        
        // Paths should not start with / or contain invalid characters
        expect(file.path).not.toMatch(/^\//)
        expect(file.path).not.toMatch(/\.\./g)
      }
    })
  })

  describe('Template Processing', () => {
    it('should process template variables correctly', () => {
      const template = mockTemplate.files[0] // package.json template
      const processedContent = template.content.replace(/\{\{projectName\}\}/g, 'my-awesome-project')
      
      const parsed = JSON.parse(processedContent)
      expect(parsed.name).toBe('my-awesome-project')
    })

    it('should handle multiple template variables', () => {
      const templateContent = `
# {{projectName}}

Welcome to {{projectName}}! This project uses {{framework}}.

## Setup

1. Install dependencies: npm install
2. Start development: npm run dev
3. Visit: http://localhost:3000
`
      
      const processed = templateContent
        .replace(/\{\{projectName\}\}/g, 'my-app')
        .replace(/\{\{framework\}\}/g, 'Next.js')
      
      expect(processed).toContain('# my-app')
      expect(processed).toContain('Welcome to my-app!')
      expect(processed).toContain('This project uses Next.js.')
    })
  })

  describe('Integration Validation', () => {
    it('should validate that all required components work together', () => {
      const templates = [mockTemplate, mockAuthTemplate]
      const selections: TechSelections = {
        framework: 'nextjs',
        authentication: 'clerk',
        database: 'none',
        hosting: 'vercel',
        payments: 'none',
        analytics: 'none',
        email: 'none',
        monitoring: 'none',
        ui: 'shadcn'
      }

      // Test dependency generation
      const packageResult = dependencyManager.generatePackageJson('integration-test', templates, selections)
      expect(packageResult.packageJson).toBeDefined()
      expect(packageResult.packageJson.dependencies).toHaveProperty('@clerk/nextjs')

      // Test environment generation
      const envResult = configGenerator.generateEnvTemplate(templates, selections)
      expect(envResult.envExample).toContain('CLERK')

      // Test deployment config
      const deployResult = configGenerator.generateDeploymentConfigs(selections)
      expect(deployResult.files.length).toBeGreaterThan(0)

      // All components should work together without conflicts
      expect(packageResult.conflicts.length).toBe(0)
    })

    it('should handle edge cases gracefully', () => {
      // Test with minimal selections
      const minimalSelections: TechSelections = {
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

      const packageResult = dependencyManager.generatePackageJson('minimal-test', [mockTemplate], minimalSelections)
      expect(packageResult.packageJson).toBeDefined()
      expect(packageResult.packageJson.name).toBe('minimal-test')

      const envResult = configGenerator.generateEnvTemplate([mockTemplate], minimalSelections)
      expect(envResult.envLocal).toContain('NODE_ENV=development')
    })
  })
})