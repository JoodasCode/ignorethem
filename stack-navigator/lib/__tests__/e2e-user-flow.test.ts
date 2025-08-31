import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { execSync } from 'child_process'
import { mkdirSync, rmSync, writeFileSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { codeGenerator } from '../code-generator'
import { templateRegistry } from '../template-registry'
import { zipGenerator } from '../zip-generator'
import { conversationManager } from '../conversation-manager'
import { TechSelections } from '../types/template'
import './setup-integration-tests'

describe('End-to-End User Flow Integration Tests', () => {
  const testDir = join(process.cwd(), 'test-e2e-flows')
  const testTimeout = 180000 // 3 minutes for full E2E tests

  beforeAll(() => {
    // Create test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
    mkdirSync(testDir, { recursive: true })
  })

  afterAll(() => {
    // Cleanup test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  describe('Complete User Journey: Conversation to Deployment', () => {
    it('should complete full flow from AI conversation to deployable project', async () => {
      // Step 1: Simulate AI conversation leading to stack selection
      const userResponses = [
        "I'm building a B2B SaaS for project management",
        "Solo founder, need to ship fast to validate",
        "Yes, need user accounts and team management",
        "Planning to charge from day one",
        "Comfortable with React, some backend experience"
      ]

      // This would normally go through the AI conversation flow
      const finalSelections: TechSelections = {
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

      const projectName = 'b2b-saas-complete'
      const projectPath = join(testDir, projectName)

      // Step 2: Generate project based on conversation
      const templates = await templateRegistry.getTemplatesForSelections(finalSelections)
      expect(templates.length).toBeGreaterThan(0)

      const generatedProject = await codeGenerator.generateProject(
        projectName,
        templates,
        finalSelections
      )

      // Step 3: Create ZIP for download
      const zipBuffer = await zipGenerator.createProjectZip(generatedProject, projectName)
      expect(zipBuffer).toBeInstanceOf(Buffer)

      // Step 4: Extract and validate project structure
      const zipPath = join(testDir, `${projectName}.zip`)
      writeFileSync(zipPath, zipBuffer)

      const extractPath = join(testDir, `${projectName}-extracted`)
      execSync(`unzip -q "${zipPath}" -d "${extractPath}"`, { 
        stdio: 'pipe',
        timeout: 30000 
      })

      const extractedProjectPath = join(extractPath, projectName)

      // Step 5: Validate all expected files exist
      const expectedFiles = [
        'package.json',
        'README.md',
        '.env.example',
        'next.config.mjs',
        'tailwind.config.ts',
        'tsconfig.json',
        'app/layout.tsx',
        'app/page.tsx',
        'lib/auth.ts',
        'lib/supabase/client.ts',
        'lib/stripe/client.ts',
        'middleware.ts',
        'app/api/webhooks/stripe/route.ts'
      ]

      for (const file of expectedFiles) {
        expect(existsSync(join(extractedProjectPath, file))).toBe(true)
      }

      // Step 6: Validate package.json has all required dependencies
      const packageJson = JSON.parse(readFileSync(join(extractedProjectPath, 'package.json'), 'utf8'))
      
      const expectedDependencies = [
        'next',
        'react',
        'react-dom',
        '@clerk/nextjs',
        '@supabase/supabase-js',
        'stripe',
        'posthog-js',
        'resend',
        '@sentry/nextjs'
      ]

      for (const dep of expectedDependencies) {
        expect(packageJson.dependencies).toHaveProperty(dep)
      }

      // Step 7: Install dependencies and compile
      execSync('npm install', { 
        cwd: extractedProjectPath, 
        stdio: 'pipe',
        timeout: 120000 
      })

      execSync('npx tsc --noEmit', { 
        cwd: extractedProjectPath, 
        stdio: 'pipe',
        timeout: 60000 
      })

      // Step 8: Validate README contains proper setup instructions
      const readme = readFileSync(join(extractedProjectPath, 'README.md'), 'utf8')
      expect(readme).toContain('Setup Instructions')
      expect(readme).toContain('Environment Variables')
      expect(readme).toContain('Deployment')
      expect(readme).toContain('Clerk')
      expect(readme).toContain('Supabase')
      expect(readme).toContain('Stripe')

      // Step 9: Validate .env.example has all required variables
      const envExample = readFileSync(join(extractedProjectPath, '.env.example'), 'utf8')
      const requiredEnvVars = [
        'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
        'CLERK_SECRET_KEY',
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'STRIPE_SECRET_KEY',
        'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
        'STRIPE_WEBHOOK_SECRET',
        'NEXT_PUBLIC_POSTHOG_KEY',
        'RESEND_API_KEY',
        'SENTRY_DSN'
      ]

      for (const envVar of requiredEnvVars) {
        expect(envExample).toContain(envVar)
      }
    }, testTimeout)
  })

  describe('Alternative Stack Combinations', () => {
    it('should handle NextAuth + Supabase combination', async () => {
      const selections: TechSelections = {
        framework: 'nextjs',
        authentication: 'nextauth',
        database: 'supabase',
        hosting: 'vercel',
        payments: 'stripe',
        analytics: 'none',
        email: 'resend',
        monitoring: 'none',
        ui: 'shadcn'
      }

      const projectName = 'nextauth-supabase-test'
      const projectPath = join(testDir, projectName)

      const templates = await templateRegistry.getTemplatesForSelections(selections)
      const generatedProject = await codeGenerator.generateProject(
        projectName,
        templates,
        selections
      )

      // Create and test project
      mkdirSync(projectPath, { recursive: true })
      
      for (const file of generatedProject.files) {
        const filePath = join(projectPath, file.path)
        const fileDir = join(filePath, '..')
        mkdirSync(fileDir, { recursive: true })
        writeFileSync(filePath, file.content)
      }

      // Verify NextAuth specific files
      expect(existsSync(join(projectPath, 'app/api/auth/[...nextauth]/route.ts'))).toBe(true)
      expect(existsSync(join(projectPath, 'lib/auth.ts'))).toBe(true)

      // Install and compile
      execSync('npm install', { 
        cwd: projectPath, 
        stdio: 'pipe',
        timeout: 90000 
      })

      execSync('npx tsc --noEmit', { 
        cwd: projectPath, 
        stdio: 'pipe',
        timeout: 45000 
      })
    }, testTimeout)

    it('should handle minimal stack without authentication', async () => {
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

      const projectName = 'minimal-stack-test'
      const projectPath = join(testDir, projectName)

      const templates = await templateRegistry.getTemplatesForSelections(selections)
      const generatedProject = await codeGenerator.generateProject(
        projectName,
        templates,
        selections
      )

      mkdirSync(projectPath, { recursive: true })
      
      for (const file of generatedProject.files) {
        const filePath = join(projectPath, file.path)
        const fileDir = join(filePath, '..')
        mkdirSync(fileDir, { recursive: true })
        writeFileSync(filePath, file.content)
      }

      // Should still have basic Next.js structure
      expect(existsSync(join(projectPath, 'package.json'))).toBe(true)
      expect(existsSync(join(projectPath, 'app/layout.tsx'))).toBe(true)
      expect(existsSync(join(projectPath, 'app/page.tsx'))).toBe(true)

      // Should NOT have auth-related files
      expect(existsSync(join(projectPath, 'lib/auth.ts'))).toBe(false)
      expect(existsSync(join(projectPath, 'middleware.ts'))).toBe(false)

      // Install and compile
      execSync('npm install', { 
        cwd: projectPath, 
        stdio: 'pipe',
        timeout: 60000 
      })

      execSync('npx tsc --noEmit', { 
        cwd: projectPath, 
        stdio: 'pipe',
        timeout: 30000 
      })
    }, testTimeout)
  })

  describe('Generated Code Quality Validation', () => {
    it('should generate code that passes linting', async () => {
      const selections: TechSelections = {
        framework: 'nextjs',
        authentication: 'clerk',
        database: 'supabase',
        hosting: 'vercel',
        payments: 'none',
        analytics: 'none',
        email: 'none',
        monitoring: 'none',
        ui: 'shadcn'
      }

      const projectName = 'linting-test'
      const projectPath = join(testDir, projectName)

      const templates = await templateRegistry.getTemplatesForSelections(selections)
      const generatedProject = await codeGenerator.generateProject(
        projectName,
        templates,
        selections
      )

      mkdirSync(projectPath, { recursive: true })
      
      for (const file of generatedProject.files) {
        const filePath = join(projectPath, file.path)
        const fileDir = join(filePath, '..')
        mkdirSync(fileDir, { recursive: true })
        writeFileSync(filePath, file.content)
      }

      execSync('npm install', { 
        cwd: projectPath, 
        stdio: 'pipe',
        timeout: 90000 
      })

      // Run ESLint on generated code
      try {
        execSync('npx eslint . --ext .ts,.tsx --max-warnings 0', { 
          cwd: projectPath, 
          stdio: 'pipe',
          timeout: 60000 
        })
      } catch (error) {
        console.error('ESLint failed on generated code:', error)
        throw new Error('Generated code does not pass linting standards')
      }
    }, testTimeout)

    it('should generate code with proper TypeScript types', async () => {
      const selections: TechSelections = {
        framework: 'nextjs',
        authentication: 'clerk',
        database: 'supabase',
        hosting: 'vercel',
        payments: 'stripe',
        analytics: 'none',
        email: 'none',
        monitoring: 'none',
        ui: 'shadcn'
      }

      const projectName = 'typescript-test'
      const projectPath = join(testDir, projectName)

      const templates = await templateRegistry.getTemplatesForSelections(selections)
      const generatedProject = await codeGenerator.generateProject(
        projectName,
        templates,
        selections
      )

      mkdirSync(projectPath, { recursive: true })
      
      for (const file of generatedProject.files) {
        const filePath = join(projectPath, file.path)
        const fileDir = join(filePath, '..')
        mkdirSync(fileDir, { recursive: true })
        writeFileSync(filePath, file.content)
      }

      execSync('npm install', { 
        cwd: projectPath, 
        stdio: 'pipe',
        timeout: 90000 
      })

      // Run TypeScript compiler in strict mode
      try {
        execSync('npx tsc --noEmit --strict', { 
          cwd: projectPath, 
          stdio: 'pipe',
          timeout: 45000 
        })
      } catch (error) {
        console.error('TypeScript strict mode compilation failed:', error)
        throw new Error('Generated code does not pass strict TypeScript compilation')
      }
    }, testTimeout)
  })

  describe('Integration with Real Services', () => {
    it('should generate valid Stripe webhook handlers', async () => {
      const selections: TechSelections = {
        framework: 'nextjs',
        authentication: 'clerk',
        database: 'supabase',
        hosting: 'vercel',
        payments: 'stripe',
        analytics: 'none',
        email: 'none',
        monitoring: 'none',
        ui: 'shadcn'
      }

      const templates = await templateRegistry.getTemplatesForSelections(selections)
      const generatedProject = await codeGenerator.generateProject(
        'stripe-webhook-test',
        templates,
        selections
      )

      // Find Stripe webhook handler
      const webhookHandler = generatedProject.files.find(f => 
        f.path.includes('api/webhooks/stripe/route.ts')
      )

      expect(webhookHandler).toBeDefined()
      expect(webhookHandler?.content).toContain('stripe.webhooks.constructEvent')
      expect(webhookHandler?.content).toContain('customer.subscription.created')
      expect(webhookHandler?.content).toContain('customer.subscription.deleted')
      expect(webhookHandler?.content).toContain('NextResponse')

      // Verify proper error handling
      expect(webhookHandler?.content).toMatch(/try\s*{[\s\S]*}\s*catch/i)
    })

    it('should generate working Supabase RLS policies', async () => {
      const selections: TechSelections = {
        framework: 'nextjs',
        authentication: 'supabase-auth',
        database: 'supabase',
        hosting: 'vercel',
        payments: 'none',
        analytics: 'none',
        email: 'none',
        monitoring: 'none',
        ui: 'shadcn'
      }

      const templates = await templateRegistry.getTemplatesForSelections(selections)
      const generatedProject = await codeGenerator.generateProject(
        'rls-test',
        templates,
        selections
      )

      // Find migration files with RLS policies
      const migrationFiles = generatedProject.files.filter(f => 
        f.path.includes('supabase/migrations') && f.content.includes('CREATE POLICY')
      )

      expect(migrationFiles.length).toBeGreaterThan(0)

      for (const migration of migrationFiles) {
        // Verify RLS policies reference auth.uid()
        expect(migration.content).toMatch(/auth\.uid\(\)/i)
        expect(migration.content).toContain('ENABLE ROW LEVEL SECURITY')
      }
    })
  })
})