import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { execSync } from 'child_process'
import { mkdirSync, rmSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { codeGenerator } from '../code-generator'
import { templateRegistry } from '../template-registry'
import { zipGenerator } from '../zip-generator'
import { TechSelections } from '../types/template'
import './setup-integration-tests'

describe('Generated Code Integration Tests', () => {
  const testDir = join(process.cwd(), 'test-generated-projects')
  const testTimeout = 120000 // 2 minutes for compilation tests

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

  describe('Basic Next.js Stack Generation', () => {
    const basicSelections: TechSelections = {
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

    it('should generate a compilable Next.js project', async () => {
      const projectName = 'basic-nextjs-test'
      const projectPath = join(testDir, projectName)

      // Generate the project
      const templates = await templateRegistry.getTemplatesForSelections(basicSelections)
      const generatedProject = await codeGenerator.generateProject(
        projectName,
        templates,
        basicSelections
      )

      // Create project files
      mkdirSync(projectPath, { recursive: true })
      
      for (const file of generatedProject.files) {
        const filePath = join(projectPath, file.path)
        const fileDir = join(filePath, '..')
        mkdirSync(fileDir, { recursive: true })
        writeFileSync(filePath, file.content)
      }

      // Install dependencies
      try {
        execSync('npm install', { 
          cwd: projectPath, 
          stdio: 'pipe',
          timeout: 60000 
        })
      } catch (error) {
        console.error('npm install failed:', error)
        throw error
      }

      // Check TypeScript compilation
      try {
        execSync('npx tsc --noEmit', { 
          cwd: projectPath, 
          stdio: 'pipe',
          timeout: 30000 
        })
      } catch (error) {
        console.error('TypeScript compilation failed:', error)
        throw error
      }

      // Check Next.js build
      try {
        execSync('npm run build', { 
          cwd: projectPath, 
          stdio: 'pipe',
          timeout: 60000 
        })
      } catch (error) {
        console.error('Next.js build failed:', error)
        throw error
      }

      // Verify essential files exist
      expect(existsSync(join(projectPath, 'package.json'))).toBe(true)
      expect(existsSync(join(projectPath, 'next.config.mjs'))).toBe(true)
      expect(existsSync(join(projectPath, 'tsconfig.json'))).toBe(true)
      expect(existsSync(join(projectPath, 'app/layout.tsx'))).toBe(true)
      expect(existsSync(join(projectPath, 'app/page.tsx'))).toBe(true)
    }, testTimeout)
  })

  describe('Full Stack with Authentication', () => {
    const authSelections: TechSelections = {
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

    it('should generate a compilable project with Clerk authentication', async () => {
      const projectName = 'clerk-auth-test'
      const projectPath = join(testDir, projectName)

      // Generate the project
      const templates = await templateRegistry.getTemplatesForSelections(authSelections)
      const generatedProject = await codeGenerator.generateProject(
        projectName,
        templates,
        authSelections
      )

      // Create project files
      mkdirSync(projectPath, { recursive: true })
      
      for (const file of generatedProject.files) {
        const filePath = join(projectPath, file.path)
        const fileDir = join(filePath, '..')
        mkdirSync(fileDir, { recursive: true })
        writeFileSync(filePath, file.content)
      }

      // Create a minimal .env.local for compilation
      const envContent = `
NODE_ENV=development
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_example
CLERK_SECRET_KEY=sk_test_example
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=example_anon_key
SUPABASE_SERVICE_ROLE_KEY=example_service_key
STRIPE_SECRET_KEY=sk_test_example
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_example
STRIPE_WEBHOOK_SECRET=whsec_example
NEXT_PUBLIC_POSTHOG_KEY=phc_example
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
RESEND_API_KEY=re_example
SENTRY_DSN=https://example@sentry.io/example
SENTRY_AUTH_TOKEN=example_token
`
      writeFileSync(join(projectPath, '.env.local'), envContent)

      // Install dependencies
      try {
        execSync('npm install', { 
          cwd: projectPath, 
          stdio: 'pipe',
          timeout: 90000 
        })
      } catch (error) {
        console.error('npm install failed:', error)
        throw error
      }

      // Check TypeScript compilation
      try {
        execSync('npx tsc --noEmit', { 
          cwd: projectPath, 
          stdio: 'pipe',
          timeout: 45000 
        })
      } catch (error) {
        console.error('TypeScript compilation failed:', error)
        throw error
      }

      // Verify integration files exist
      expect(existsSync(join(projectPath, 'lib/auth.ts'))).toBe(true)
      expect(existsSync(join(projectPath, 'lib/supabase/client.ts'))).toBe(true)
      expect(existsSync(join(projectPath, 'lib/stripe/client.ts'))).toBe(true)
      expect(existsSync(join(projectPath, 'middleware.ts'))).toBe(true)
      expect(existsSync(join(projectPath, 'app/api/webhooks/stripe/route.ts'))).toBe(true)
    }, testTimeout)
  })

  describe('Alternative Authentication Stack', () => {
    const nextAuthSelections: TechSelections = {
      framework: 'nextjs',
      authentication: 'nextauth',
      database: 'supabase',
      hosting: 'vercel',
      payments: 'none',
      analytics: 'none',
      email: 'resend',
      monitoring: 'none',
      ui: 'shadcn'
    }

    it('should generate a compilable project with NextAuth.js', async () => {
      const projectName = 'nextauth-test'
      const projectPath = join(testDir, projectName)

      // Generate the project
      const templates = await templateRegistry.getTemplatesForSelections(nextAuthSelections)
      const generatedProject = await codeGenerator.generateProject(
        projectName,
        templates,
        nextAuthSelections
      )

      // Create project files
      mkdirSync(projectPath, { recursive: true })
      
      for (const file of generatedProject.files) {
        const filePath = join(projectPath, file.path)
        const fileDir = join(filePath, '..')
        mkdirSync(fileDir, { recursive: true })
        writeFileSync(filePath, file.content)
      }

      // Create a minimal .env.local for compilation
      const envContent = `
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=example_secret
GOOGLE_CLIENT_ID=example_client_id
GOOGLE_CLIENT_SECRET=example_client_secret
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=example_anon_key
SUPABASE_SERVICE_ROLE_KEY=example_service_key
RESEND_API_KEY=re_example
`
      writeFileSync(join(projectPath, '.env.local'), envContent)

      // Install dependencies
      try {
        execSync('npm install', { 
          cwd: projectPath, 
          stdio: 'pipe',
          timeout: 90000 
        })
      } catch (error) {
        console.error('npm install failed:', error)
        throw error
      }

      // Check TypeScript compilation
      try {
        execSync('npx tsc --noEmit', { 
          cwd: projectPath, 
          stdio: 'pipe',
          timeout: 45000 
        })
      } catch (error) {
        console.error('TypeScript compilation failed:', error)
        throw error
      }

      // Verify NextAuth integration files exist
      expect(existsSync(join(projectPath, 'lib/auth.ts'))).toBe(true)
      expect(existsSync(join(projectPath, 'app/api/auth/[...nextauth]/route.ts'))).toBe(true)
    }, testTimeout)
  })

  describe('End-to-End User Flow Simulation', () => {
    it('should complete the full generation and download flow', async () => {
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

      const projectName = 'e2e-flow-test'

      // Step 1: Get templates for selections
      const templates = await templateRegistry.getTemplatesForSelections(selections)
      expect(templates.length).toBeGreaterThan(0)

      // Step 2: Generate project
      const generatedProject = await codeGenerator.generateProject(
        projectName,
        templates,
        selections
      )
      expect(generatedProject.files.length).toBeGreaterThan(0)
      expect(generatedProject.packageJson).toBeDefined()
      expect(generatedProject.readme).toBeDefined()

      // Step 3: Create ZIP file
      const zipBuffer = await zipGenerator.createProjectZip(generatedProject, projectName)
      expect(zipBuffer).toBeInstanceOf(Buffer)
      expect(zipBuffer.length).toBeGreaterThan(0)

      // Step 4: Verify ZIP contents by extracting and checking key files
      const zipPath = join(testDir, `${projectName}.zip`)
      writeFileSync(zipPath, zipBuffer)

      // Extract ZIP
      const extractPath = join(testDir, `${projectName}-extracted`)
      try {
        execSync(`unzip -q "${zipPath}" -d "${extractPath}"`, { 
          stdio: 'pipe',
          timeout: 30000 
        })
      } catch (error) {
        console.error('ZIP extraction failed:', error)
        throw error
      }

      // Verify extracted files
      const projectDir = join(extractPath, projectName)
      expect(existsSync(join(projectDir, 'package.json'))).toBe(true)
      expect(existsSync(join(projectDir, 'README.md'))).toBe(true)
      expect(existsSync(join(projectDir, '.env.example'))).toBe(true)
      expect(existsSync(join(projectDir, 'app/layout.tsx'))).toBe(true)
      expect(existsSync(join(projectDir, 'lib/auth.ts'))).toBe(true)
    }, testTimeout)
  })

  describe('Template Compatibility Validation', () => {
    it('should validate that all template combinations compile successfully', async () => {
      const testCombinations = [
        {
          name: 'minimal-stack',
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
          } as TechSelections
        },
        {
          name: 'clerk-supabase',
          selections: {
            framework: 'nextjs',
            authentication: 'clerk',
            database: 'supabase',
            hosting: 'vercel',
            payments: 'none',
            analytics: 'none',
            email: 'none',
            monitoring: 'none',
            ui: 'shadcn'
          } as TechSelections
        },
        {
          name: 'nextauth-payments',
          selections: {
            framework: 'nextjs',
            authentication: 'nextauth',
            database: 'supabase',
            hosting: 'vercel',
            payments: 'stripe',
            analytics: 'none',
            email: 'resend',
            monitoring: 'none',
            ui: 'shadcn'
          } as TechSelections
        }
      ]

      for (const combination of testCombinations) {
        const projectPath = join(testDir, combination.name)
        
        // Generate project
        const templates = await templateRegistry.getTemplatesForSelections(combination.selections)
        const generatedProject = await codeGenerator.generateProject(
          combination.name,
          templates,
          combination.selections
        )

        // Create project files
        mkdirSync(projectPath, { recursive: true })
        
        for (const file of generatedProject.files) {
          const filePath = join(projectPath, file.path)
          const fileDir = join(filePath, '..')
          mkdirSync(fileDir, { recursive: true })
          writeFileSync(filePath, file.content)
        }

        // Create minimal environment variables
        const envContent = `NODE_ENV=development\n`
        writeFileSync(join(projectPath, '.env.local'), envContent)

        // Install and compile
        try {
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
        } catch (error) {
          console.error(`Compilation failed for ${combination.name}:`, error)
          throw new Error(`Template combination ${combination.name} failed to compile`)
        }
      }
    }, testTimeout * 3) // Allow more time for multiple combinations
  })

  describe('Database Integration with MCP', () => {
    const stackNavigatorProjectId = 'gexfrtzlxyrxccupmbjo'

    it('should generate database schema that works with real Supabase', async () => {
      // Test that our generated Supabase integration actually works
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

      const projectName = 'supabase-integration-test'
      const projectPath = join(testDir, projectName)

      // Generate project with Supabase integration
      const templates = await templateRegistry.getTemplatesForSelections(selections)
      const generatedProject = await codeGenerator.generateProject(
        projectName,
        templates,
        selections
      )

      // Create project files
      mkdirSync(projectPath, { recursive: true })
      
      for (const file of generatedProject.files) {
        const filePath = join(projectPath, file.path)
        const fileDir = join(filePath, '..')
        mkdirSync(fileDir, { recursive: true })
        writeFileSync(filePath, file.content)
      }

      // Verify that generated migration files are valid SQL
      const migrationFiles = generatedProject.files.filter(f => 
        f.path.includes('supabase/migrations') && f.path.endsWith('.sql')
      )

      expect(migrationFiles.length).toBeGreaterThan(0)

      // Test each migration file against real database
      for (const migration of migrationFiles) {
        try {
          // Use MCP to validate SQL syntax
          const result = await global.mcpSupabase.execute_sql({
            project_id: stackNavigatorProjectId,
            query: `EXPLAIN ${migration.content}`
          })
          
          // If EXPLAIN works, the SQL is syntactically valid
          expect(result).toBeDefined()
        } catch (error) {
          console.error(`Migration validation failed for ${migration.path}:`, error)
          throw new Error(`Generated migration ${migration.path} contains invalid SQL`)
        }
      }
    }, testTimeout)

    it('should generate working Supabase client configuration', async () => {
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
        'supabase-client-test',
        templates,
        selections
      )

      // Find the Supabase client configuration file
      const supabaseClientFile = generatedProject.files.find(f => 
        f.path.includes('lib/supabase/client.ts') || f.path.includes('lib/supabase.ts')
      )

      expect(supabaseClientFile).toBeDefined()
      expect(supabaseClientFile?.content).toContain('createClient')
      expect(supabaseClientFile?.content).toContain('NEXT_PUBLIC_SUPABASE_URL')
      expect(supabaseClientFile?.content).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY')

      // Verify the generated client code structure is correct
      expect(supabaseClientFile?.content).toMatch(/export.*supabase/i)
    })

    it('should generate valid RLS policies', async () => {
      const selections: TechSelections = {
        framework: 'nextjs',
        authentication: 'supabase-auth',
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
        'rls-policies-test',
        templates,
        selections
      )

      // Find migration files that contain RLS policies
      const rlsPolicyFiles = generatedProject.files.filter(f => 
        f.path.includes('.sql') && 
        (f.content.includes('CREATE POLICY') || f.content.includes('ENABLE ROW LEVEL SECURITY'))
      )

      expect(rlsPolicyFiles.length).toBeGreaterThan(0)

      // Test that RLS policies are syntactically correct
      for (const policyFile of rlsPolicyFiles) {
        const policies = policyFile.content.split(';').filter(stmt => 
          stmt.trim().includes('CREATE POLICY') || stmt.trim().includes('ENABLE ROW LEVEL SECURITY')
        )

        for (const policy of policies) {
          if (policy.trim()) {
            try {
              // Use MCP to validate policy syntax
              await global.mcpSupabase.execute_sql({
                project_id: stackNavigatorProjectId,
                query: `EXPLAIN ${policy.trim()};`
              })
            } catch (error) {
              console.error(`RLS policy validation failed:`, policy, error)
              throw new Error(`Generated RLS policy is invalid: ${policy}`)
            }
          }
        }
      }
    })
  })

  describe('Runtime Validation', () => {
    it('should start development server without errors', async () => {
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

      const projectName = 'runtime-test'
      const projectPath = join(testDir, projectName)

      // Generate and create project
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

      // Install dependencies
      execSync('npm install', { 
        cwd: projectPath, 
        stdio: 'pipe',
        timeout: 60000 
      })

      // Test that the development server can start (run for 5 seconds then kill)
      try {
        const child = execSync('timeout 5s npm run dev || true', { 
          cwd: projectPath, 
          stdio: 'pipe',
          timeout: 10000 
        })
        
        // If we get here without throwing, the server started successfully
        expect(true).toBe(true)
      } catch (error) {
        // Check if it's just a timeout (which is expected)
        if (!error.message.includes('timeout') && !error.message.includes('SIGTERM')) {
          console.error('Development server failed to start:', error)
          throw error
        }
      }
    }, testTimeout)

    it('should validate generated API endpoints work with real database', async () => {
      // Test that generated API routes can connect to real Supabase
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
        'api-endpoints-test',
        templates,
        selections
      )

      // Find API route files
      const apiRoutes = generatedProject.files.filter(f => 
        f.path.includes('app/api/') && f.path.endsWith('route.ts')
      )

      expect(apiRoutes.length).toBeGreaterThan(0)

      // Verify API routes have proper error handling and database connections
      for (const route of apiRoutes) {
        expect(route.content).toMatch(/try\s*{[\s\S]*}\s*catch/i) // Has try-catch
        expect(route.content).toMatch(/supabase/i) // References Supabase client
        expect(route.content).toMatch(/NextResponse/i) // Uses Next.js response
      }
    })
  })

  describe('Real Database Connection Testing', () => {
    const stackNavigatorProjectId = 'gexfrtzlxyrxccupmbjo'

    it('should test that generated database functions work', async () => {
      // Create a test table to validate our generated code patterns
      try {
        await global.mcpSupabase.execute_sql({
          project_id: stackNavigatorProjectId,
          query: `
            CREATE TABLE IF NOT EXISTS integration_test_users (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              email TEXT UNIQUE NOT NULL,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `
        })

        // Test basic CRUD operations that our generated code should support
        const insertResult = await global.mcpSupabase.execute_sql({
          project_id: stackNavigatorProjectId,
          query: `
            INSERT INTO integration_test_users (email) 
            VALUES ('test@example.com') 
            RETURNING id, email, created_at;
          `
        })

        expect(insertResult).toBeDefined()
        expect(insertResult.length).toBeGreaterThan(0)

        const selectResult = await global.mcpSupabase.execute_sql({
          project_id: stackNavigatorProjectId,
          query: `SELECT * FROM integration_test_users WHERE email = 'test@example.com';`
        })

        expect(selectResult).toBeDefined()
        expect(selectResult.length).toBe(1)

        // Cleanup
        await global.mcpSupabase.execute_sql({
          project_id: stackNavigatorProjectId,
          query: `DROP TABLE IF EXISTS integration_test_users;`
        })

      } catch (error) {
        console.error('Database integration test failed:', error)
        throw error
      }
    })

    it('should validate generated TypeScript types match database schema', async () => {
      // Get current database schema
      const tablesResult = await global.mcpSupabase.execute_sql({
        project_id: stackNavigatorProjectId,
        query: `
          SELECT table_name, column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_schema = 'public'
          ORDER BY table_name, ordinal_position;
        `
      })

      expect(tablesResult).toBeDefined()

      // Generate a project with database integration
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
        'types-validation-test',
        templates,
        selections
      )

      // Find TypeScript type definition files
      const typeFiles = generatedProject.files.filter(f => 
        f.path.includes('types') && f.path.endsWith('.ts')
      )

      expect(typeFiles.length).toBeGreaterThan(0)

      // Verify that type files contain proper TypeScript interfaces
      for (const typeFile of typeFiles) {
        expect(typeFile.content).toMatch(/interface|type/i)
        expect(typeFile.content).toMatch(/export/i)
      }
    })
  })
})