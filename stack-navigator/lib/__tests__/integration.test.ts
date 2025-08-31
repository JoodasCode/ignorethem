import { codeGenerator } from '../code-generator'
import { dependencyManager } from '../dependency-manager'
import { configGenerator } from '../config-generator'
import { TechSelections } from '../types/template'

describe('Code Generation Integration', () => {
  const testSelections: TechSelections = {
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

  it('should generate package.json with correct dependencies', () => {
    const mockTemplates = [
      {
        metadata: {
          id: 'nextjs-base',
          name: 'Next.js Base',
          version: '1.0.0',
          category: 'base' as const,
          dependencies: [],
          setupTime: 5
        },
        files: [],
        envVars: [],
        setupInstructions: [],
        packageDependencies: {
          'next': '^14.0.0',
          'react': '^18.0.0'
        },
        devDependencies: {
          'typescript': '^5.0.0'
        },
        scripts: {
          'dev': 'next dev'
        }
      }
    ]

    const result = dependencyManager.generatePackageJson('test-app', mockTemplates, testSelections)
    
    expect(result.packageJson).toBeDefined()
    expect(result.packageJson.name).toBe('test-app')
    expect(result.packageJson.dependencies).toHaveProperty('next')
    expect(result.packageJson.dependencies).toHaveProperty('react')
    expect(result.packageJson.devDependencies).toHaveProperty('typescript')
  })

  it('should generate environment configuration', () => {
    const mockTemplates = [
      {
        metadata: {
          id: 'clerk',
          name: 'Clerk Auth',
          version: '1.0.0',
          category: 'auth' as const,
          dependencies: [],
          setupTime: 10
        },
        files: [],
        envVars: [
          {
            key: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
            description: 'Clerk publishable key',
            required: true,
            example: 'pk_test_...',
            category: 'auth' as const
          },
          {
            key: 'CLERK_SECRET_KEY',
            description: 'Clerk secret key',
            required: true,
            example: 'sk_test_...',
            category: 'auth' as const
          }
        ],
        setupInstructions: [],
        packageDependencies: {},
        devDependencies: {},
        scripts: {}
      }
    ]

    const result = configGenerator.generateEnvTemplate(mockTemplates, testSelections)
    
    expect(result.envExample).toContain('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY')
    expect(result.envExample).toContain('CLERK_SECRET_KEY')
    expect(result.envExample).toContain('# Auth')
    expect(result.envLocal).toContain('NODE_ENV=development')
    expect(result.documentation).toContain('# Environment Variables Documentation')
  })

  it('should generate deployment configurations', () => {
    const result = configGenerator.generateDeploymentConfigs(testSelections)
    
    expect(result.files).toBeInstanceOf(Array)
    expect(result.instructions).toBeInstanceOf(Array)
    
    // Should include Vercel config since hosting is 'vercel'
    const vercelConfig = result.files.find(f => f.path === 'vercel.json')
    expect(vercelConfig).toBeDefined()
    expect(vercelConfig?.content).toContain('nextjs')
  })

  it('should generate Next.js configuration files', () => {
    const configs = configGenerator.generateNextJsConfigs(testSelections)
    
    expect(configs).toBeInstanceOf(Array)
    
    const nextConfig = configs.find(c => c.path === 'next.config.mjs')
    expect(nextConfig).toBeDefined()
    
    const tailwindConfig = configs.find(c => c.path === 'tailwind.config.ts')
    expect(tailwindConfig).toBeDefined() // Should be included since ui is 'shadcn'
    
    const tsConfig = configs.find(c => c.path === 'tsconfig.json')
    expect(tsConfig).toBeDefined()
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

  it('should handle version conflicts', () => {
    const check = dependencyManager.checkVersionCompatibility('react', '^17.0.0', '^18.0.0')
    
    expect(check).toBeDefined()
    expect(check.compatible).toBeDefined()
    expect(check.recommendedVersion).toBeDefined()
    expect(check.reason).toBeDefined()
  })
})