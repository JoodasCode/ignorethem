import { describe, it, expect } from '@jest/globals'
import { codeGenerator } from '../code-generator'
import { templateRegistry } from '../template-registry'
import { TechSelections } from '../types/template'

describe('Code Validation Integration Tests', () => {
  describe('Generated Code Structure Validation', () => {
    it('should generate valid TypeScript code for basic Next.js stack', async () => {
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

      const templates = await templateRegistry.getTemplatesForSelections(selections)
      const generatedProject = await codeGenerator.generateProject(
        'test-project',
        templates,
        selections
      )

      // Verify essential files are generated
      expect(generatedProject.files.length).toBeGreaterThan(0)
      
      const packageJsonFile = generatedProject.files.find(f => f.path === 'package.json')
      expect(packageJsonFile).toBeDefined()
      
      const packageJson = JSON.parse(packageJsonFile!.content)
      expect(packageJson.name).toBe('test-project')
      expect(packageJson.dependencies).toHaveProperty('next')
      expect(packageJson.dependencies).toHaveProperty('react')

      // Verify TypeScript configuration
      const tsConfigFile = generatedProject.files.find(f => f.path === 'tsconfig.json')
      expect(tsConfigFile).toBeDefined()
      
      const tsConfig = JSON.parse(tsConfigFile!.content)
      expect(tsConfig.compilerOptions).toBeDefined()
      expect(tsConfig.compilerOptions.strict).toBe(true)

      // Verify Next.js app structure
      const layoutFile = generatedProject.files.find(f => f.path === 'app/layout.tsx')
      expect(layoutFile).toBeDefined()
      expect(layoutFile!.content).toContain('export default function RootLayout')

      const pageFile = generatedProject.files.find(f => f.path === 'app/page.tsx')
      expect(pageFile).toBeDefined()
      expect(pageFile!.content).toContain('export default function')
    })

    it('should generate valid authentication integration code', async () => {
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

      const templates = await templateRegistry.getTemplatesForSelections(selections)
      const generatedProject = await codeGenerator.generateProject(
        'auth-test-project',
        templates,
        selections
      )

      // Verify auth-related files
      const authFile = generatedProject.files.find(f => f.path === 'lib/auth.ts')
      expect(authFile).toBeDefined()
      expect(authFile!.content).toContain('clerk')

      const middlewareFile = generatedProject.files.find(f => f.path === 'middleware.ts')
      expect(middlewareFile).toBeDefined()
      expect(middlewareFile!.content).toContain('authMiddleware')

      // Verify Supabase integration
      const supabaseFile = generatedProject.files.find(f => 
        f.path.includes('supabase') && f.path.endsWith('.ts')
      )
      expect(supabaseFile).toBeDefined()
      expect(supabaseFile!.content).toContain('createClient')

      // Verify package.json includes auth dependencies
      const packageJsonFile = generatedProject.files.find(f => f.path === 'package.json')
      const packageJson = JSON.parse(packageJsonFile!.content)
      expect(packageJson.dependencies).toHaveProperty('@clerk/nextjs')
      expect(packageJson.dependencies).toHaveProperty('@supabase/supabase-js')
    })

    it('should generate valid payment integration code', async () => {
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
        'payments-test-project',
        templates,
        selections
      )

      // Verify Stripe integration files
      const stripeClientFile = generatedProject.files.find(f => 
        f.path.includes('stripe') && f.path.endsWith('.ts')
      )
      expect(stripeClientFile).toBeDefined()
      expect(stripeClientFile!.content).toContain('Stripe')

      // Verify webhook handler
      const webhookFile = generatedProject.files.find(f => 
        f.path.includes('webhooks/stripe/route.ts')
      )
      expect(webhookFile).toBeDefined()
      expect(webhookFile!.content).toContain('stripe.webhooks.constructEvent')

      // Verify package.json includes Stripe dependencies
      const packageJsonFile = generatedProject.files.find(f => f.path === 'package.json')
      const packageJson = JSON.parse(packageJsonFile!.content)
      expect(packageJson.dependencies).toHaveProperty('stripe')
      expect(packageJson.dependencies).toHaveProperty('@stripe/stripe-js')
    })
  })

  describe('Code Quality Validation', () => {
    it('should generate code with proper TypeScript types', async () => {
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

      const templates = await templateRegistry.getTemplatesForSelections(selections)
      const generatedProject = await codeGenerator.generateProject(
        'types-test-project',
        templates,
        selections
      )

      // Check that TypeScript files have proper imports and exports
      const tsFiles = generatedProject.files.filter(f => f.path.endsWith('.ts') || f.path.endsWith('.tsx'))
      
      for (const file of tsFiles) {
        // Should not have syntax errors (basic check)
        expect(file.content).not.toContain('undefined')
        
        // Should have proper imports if using external libraries
        if (file.content.includes('Stripe')) {
          expect(file.content).toMatch(/import.*stripe/i)
        }
        
        if (file.content.includes('supabase')) {
          expect(file.content).toMatch(/import.*supabase/i)
        }
        
        // Should export something if it's a module
        if (file.path.includes('lib/') || file.path.includes('components/')) {
          expect(file.content).toMatch(/export/i)
        }
      }
    })

    it('should generate proper environment variable templates', async () => {
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

      const templates = await templateRegistry.getTemplatesForSelections(selections)
      const generatedProject = await codeGenerator.generateProject(
        'env-test-project',
        templates,
        selections
      )

      const envExampleFile = generatedProject.files.find(f => f.path === '.env.example')
      expect(envExampleFile).toBeDefined()

      const envContent = envExampleFile!.content
      
      // Should include all required environment variables
      expect(envContent).toContain('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY')
      expect(envContent).toContain('CLERK_SECRET_KEY')
      expect(envContent).toContain('NEXT_PUBLIC_SUPABASE_URL')
      expect(envContent).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY')
      expect(envContent).toContain('STRIPE_SECRET_KEY')
      expect(envContent).toContain('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')
      expect(envContent).toContain('STRIPE_WEBHOOK_SECRET')
      expect(envContent).toContain('NEXT_PUBLIC_POSTHOG_KEY')
      expect(envContent).toContain('RESEND_API_KEY')
      expect(envContent).toContain('SENTRY_DSN')

      // Should have proper comments and organization
      expect(envContent).toContain('# Auth')
      expect(envContent).toContain('# Database')
      expect(envContent).toContain('# Payments')
    })

    it('should generate valid deployment configurations', async () => {
      const selections: TechSelections = {
        framework: 'nextjs',
        authentication: 'clerk',
        database: 'supabase',
        hosting: 'vercel',
        payments: 'stripe',
        analytics: 'none',
        email: 'none',
        monitoring: 'sentry',
        ui: 'shadcn'
      }

      const templates = await templateRegistry.getTemplatesForSelections(selections)
      const generatedProject = await codeGenerator.generateProject(
        'deployment-test-project',
        templates,
        selections
      )

      // Verify Vercel configuration
      const vercelConfigFile = generatedProject.files.find(f => f.path === 'vercel.json')
      expect(vercelConfigFile).toBeDefined()
      
      const vercelConfig = JSON.parse(vercelConfigFile!.content)
      expect(vercelConfig.framework).toBe('nextjs')

      // Verify Next.js configuration
      const nextConfigFile = generatedProject.files.find(f => f.path === 'next.config.mjs')
      expect(nextConfigFile).toBeDefined()
      expect(nextConfigFile!.content).toContain('withSentryConfig')
    })
  })

  describe('Template Compatibility Validation', () => {
    it('should handle conflicting template selections gracefully', async () => {
      // This would be a case where templates might conflict
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

      const templates = await templateRegistry.getTemplatesForSelections(selections)
      
      // Should not throw an error
      expect(async () => {
        await codeGenerator.generateProject(
          'conflict-test-project',
          templates,
          selections
        )
      }).not.toThrow()

      const generatedProject = await codeGenerator.generateProject(
        'conflict-test-project',
        templates,
        selections
      )

      // Should still generate a valid project
      expect(generatedProject.files.length).toBeGreaterThan(0)
      
      const packageJsonFile = generatedProject.files.find(f => f.path === 'package.json')
      expect(packageJsonFile).toBeDefined()
    })

    it('should validate that all selected integrations are included', async () => {
      const selections: TechSelections = {
        framework: 'nextjs',
        authentication: 'nextauth',
        database: 'supabase',
        hosting: 'vercel',
        payments: 'stripe',
        analytics: 'posthog',
        email: 'resend',
        monitoring: 'sentry',
        ui: 'shadcn'
      }

      const templates = await templateRegistry.getTemplatesForSelections(selections)
      const generatedProject = await codeGenerator.generateProject(
        'integration-test-project',
        templates,
        selections
      )

      // Verify each selected integration has corresponding files
      
      // NextAuth
      const nextAuthFile = generatedProject.files.find(f => 
        f.path.includes('api/auth/[...nextauth]')
      )
      expect(nextAuthFile).toBeDefined()

      // Supabase
      const supabaseFile = generatedProject.files.find(f => 
        f.path.includes('supabase') && f.path.endsWith('.ts')
      )
      expect(supabaseFile).toBeDefined()

      // Stripe
      const stripeFile = generatedProject.files.find(f => 
        f.path.includes('stripe') && f.path.endsWith('.ts')
      )
      expect(stripeFile).toBeDefined()

      // PostHog
      const packageJsonFile = generatedProject.files.find(f => f.path === 'package.json')
      const packageJson = JSON.parse(packageJsonFile!.content)
      expect(packageJson.dependencies).toHaveProperty('posthog-js')

      // Resend
      expect(packageJson.dependencies).toHaveProperty('resend')

      // Sentry
      expect(packageJson.dependencies).toHaveProperty('@sentry/nextjs')
    })
  })
})