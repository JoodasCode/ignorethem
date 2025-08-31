import { codeGenerator } from '../code-generator'
import { dependencyManager } from '../dependency-manager'
import { configGenerator } from '../config-generator'
import { TechSelections } from '../types/template'

describe('Code Generation Demo', () => {
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

  it('should demonstrate complete code generation workflow', () => {
    console.log('🚀 Starting code generation demo...')
    
    // 1. Test dependency management
    console.log('📦 Testing dependency management...')
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
          'react': '^18.0.0',
          'react-dom': '^18.0.0'
        },
        devDependencies: {
          'typescript': '^5.0.0',
          '@types/react': '^18.0.0'
        },
        scripts: {
          'dev': 'next dev',
          'build': 'next build'
        }
      }
    ]

    const packageResult = dependencyManager.generatePackageJson('demo-app', mockTemplates, selections)
    expect(packageResult.packageJson.name).toBe('demo-app')
    expect(packageResult.packageJson.dependencies).toHaveProperty('next')
    console.log('✅ Package.json generated successfully')

    // 2. Test environment configuration
    console.log('🔧 Testing environment configuration...')
    const envResult = configGenerator.generateEnvTemplate(mockTemplates, selections)
    expect(envResult.envExample).toContain('NODE_ENV')
    expect(envResult.envLocal).toContain('development')
    console.log('✅ Environment templates generated successfully')

    // 3. Test deployment configuration
    console.log('🌐 Testing deployment configuration...')
    const deployResult = configGenerator.generateDeploymentConfigs(selections)
    expect(deployResult.files).toBeInstanceOf(Array)
    const vercelConfig = deployResult.files.find(f => f.path === 'vercel.json')
    expect(vercelConfig).toBeDefined()
    console.log('✅ Deployment configs generated successfully')

    // 4. Test Next.js configuration
    console.log('⚛️ Testing Next.js configuration...')
    const nextConfigs = configGenerator.generateNextJsConfigs(selections)
    expect(nextConfigs.length).toBeGreaterThan(0)
    
    const nextConfig = nextConfigs.find(c => c.path === 'next.config.mjs')
    const tailwindConfig = nextConfigs.find(c => c.path === 'tailwind.config.ts')
    const tsConfig = nextConfigs.find(c => c.path === 'tsconfig.json')
    
    expect(nextConfig).toBeDefined()
    expect(tailwindConfig).toBeDefined() // Should exist because ui is 'shadcn'
    expect(tsConfig).toBeDefined()
    console.log('✅ Next.js configs generated successfully')

    // 5. Test setup instructions
    console.log('📋 Testing setup instructions...')
    const instructions = configGenerator.generateSetupInstructions(mockTemplates, selections)
    expect(instructions).toBeInstanceOf(Array)
    expect(instructions.length).toBeGreaterThan(0)
    console.log('✅ Setup instructions generated successfully')

    console.log('🎉 Code generation demo completed successfully!')
    console.log(`Generated ${nextConfigs.length} configuration files`)
    console.log(`Generated ${instructions.length} setup instructions`)
    console.log(`Package.json includes ${Object.keys(packageResult.packageJson.dependencies).length} dependencies`)
  })

  it('should handle template variable processing correctly', () => {
    const generator = codeGenerator as any
    
    // Test case conversion functions
    expect(generator.toKebabCase('MyAwesomeApp')).toBe('my-awesome-app')
    expect(generator.toPascalCase('my-awesome-app')).toBe('MyAwesomeApp')
    expect(generator.toCamelCase('my-awesome-app')).toBe('myAwesomeApp')
    
    // Test variable processing
    const context = {
      projectName: 'TestApp',
      projectNameKebab: 'test-app',
      selections: { framework: 'nextjs' }
    }
    
    const template = 'Welcome to {{projectName}} ({{projectNameKebab}}) using {{selections.framework}}'
    const processed = generator.processVariables(template, context)
    
    expect(processed).toBe('Welcome to TestApp (test-app) using nextjs')
    console.log('✅ Template variable processing works correctly')
  })

  it('should validate dependency compatibility', () => {
    // Test compatible versions
    const compatibleCheck = dependencyManager.checkVersionCompatibility('react', '^18.0.0', '^18.2.0')
    expect(compatibleCheck.compatible).toBe(true)
    
    // Test dependency set validation
    const dependencies = {
      'react': '^18.0.0',
      'react-dom': '^18.0.0',
      'next': '^14.0.0',
      'typescript': '^5.0.0'
    }
    
    const validation = dependencyManager.validateDependencySet(dependencies)
    expect(validation.isValid).toBe(true)
    expect(validation.errors).toHaveLength(0)
    
    console.log('✅ Dependency compatibility validation works correctly')
  })
})