import { CodeGenerator } from '../code-generator'
import { Template, TemplateFile } from '../types/template'

describe('Template Merging Algorithms', () => {
  let codeGenerator: CodeGenerator

  beforeEach(() => {
    codeGenerator = new CodeGenerator()
  })

  describe('File Conflict Resolution', () => {
    it('should handle package.json merging with complex dependencies', async () => {
      const template1: Template = {
        metadata: {
          id: 'base',
          name: 'Base Template',
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
          documentation: '',
          tags: [],
          popularity: 0,
          lastUpdated: new Date()
        },
        files: [
          {
            path: 'package.json',
            content: JSON.stringify({
              name: 'test-project',
              version: '0.1.0',
              dependencies: {
                'react': '^18.0.0',
                'next': '^14.0.0'
              },
              devDependencies: {
                'typescript': '^5.0.0',
                '@types/react': '^18.0.0'
              },
              scripts: {
                'dev': 'next dev',
                'build': 'next build'
              }
            }, null, 2)
          }
        ],
        envVars: [],
        setupInstructions: [],
        packageDependencies: {},
        devDependencies: {},
        scripts: {}
      }

      const template2: Template = {
        ...template1,
        metadata: { ...template1.metadata, id: 'auth' },
        files: [
          {
            path: 'package.json',
            content: JSON.stringify({
              name: 'test-project',
              dependencies: {
                '@clerk/nextjs': '^4.0.0',
                'react': '^18.2.0' // Different version
              },
              devDependencies: {
                '@types/node': '^20.0.0'
              },
              scripts: {
                'lint': 'next lint',
                'dev': 'next dev --turbo' // Different dev script
              }
            }, null, 2)
          }
        ]
      }

      const merged = await codeGenerator.mergeTemplates([template1, template2])
      const packageJsonFile = merged.files.find(f => f.path === 'package.json')
      const packageJson = JSON.parse(packageJsonFile!.content)

      // Should merge dependencies
      expect(packageJson.dependencies).toEqual({
        'react': '^18.2.0', // Should use later version
        'next': '^14.0.0',
        '@clerk/nextjs': '^4.0.0'
      })

      // Should merge devDependencies
      expect(packageJson.devDependencies).toEqual({
        'typescript': '^5.0.0',
        '@types/react': '^18.0.0',
        '@types/node': '^20.0.0'
      })

      // Should merge scripts (later template wins for conflicts)
      expect(packageJson.scripts).toEqual({
        'dev': 'next dev --turbo',
        'build': 'next build',
        'lint': 'next lint'
      })
    })

    it('should handle TypeScript config merging', async () => {
      const template1: Template = {
        metadata: {
          id: 'base',
          name: 'Base Template',
          description: 'Base template',
          category: 'base',
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
            path: 'tsconfig.json',
            content: JSON.stringify({
              compilerOptions: {
                target: 'es5',
                lib: ['dom', 'dom.iterable', 'es6'],
                allowJs: true,
                skipLibCheck: true,
                strict: true
              },
              include: ['next-env.d.ts', '**/*.ts', '**/*.tsx'],
              exclude: ['node_modules']
            }, null, 2)
          }
        ],
        envVars: [],
        setupInstructions: [],
        packageDependencies: {},
        devDependencies: {},
        scripts: {}
      }

      const template2: Template = {
        ...template1,
        metadata: { ...template1.metadata, id: 'auth' },
        files: [
          {
            path: 'tsconfig.json',
            content: JSON.stringify({
              compilerOptions: {
                target: 'es2017', // Different target
                moduleResolution: 'node',
                resolveJsonModule: true,
                isolatedModules: true,
                jsx: 'preserve'
              },
              include: ['**/*.ts', '**/*.tsx', 'types/**/*.ts']
            }, null, 2)
          }
        ]
      }

      const merged = await codeGenerator.mergeTemplates([template1, template2])
      const tsconfigFile = merged.files.find(f => f.path === 'tsconfig.json')
      const tsconfig = JSON.parse(tsconfigFile!.content)

      // Should deep merge compiler options
      expect(tsconfig.compilerOptions.target).toBe('es2017') // Later template wins
      expect(tsconfig.compilerOptions.lib).toEqual(['dom', 'dom.iterable', 'es6'])
      expect(tsconfig.compilerOptions.allowJs).toBe(true)
      expect(tsconfig.compilerOptions.moduleResolution).toBe('node')
      expect(tsconfig.compilerOptions.jsx).toBe('preserve')

      // Should merge include arrays
      expect(tsconfig.include).toContain('next-env.d.ts')
      expect(tsconfig.include).toContain('**/*.ts')
      expect(tsconfig.include).toContain('types/**/*.ts')
    })

    it('should handle environment file merging with comments', async () => {
      const template1: Template = {
        metadata: {
          id: 'base',
          name: 'Base Template',
          description: 'Base template',
          category: 'base',
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
            path: '.env.example',
            content: `# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/mydb

# Application Settings
NODE_ENV=development
PORT=3000`
          }
        ],
        envVars: [],
        setupInstructions: [],
        packageDependencies: {},
        devDependencies: {},
        scripts: {}
      }

      const template2: Template = {
        ...template1,
        metadata: { ...template1.metadata, id: 'auth' },
        files: [
          {
            path: '.env.example',
            content: `# Authentication Configuration
CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_secret_here

# Additional Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000`
          }
        ]
      }

      const merged = await codeGenerator.mergeTemplates([template1, template2])
      const envFile = merged.files.find(f => f.path === '.env.example')

      expect(envFile!.content).toContain('DATABASE_URL=postgresql://user:password@localhost:5432/mydb')
      expect(envFile!.content).toContain('NODE_ENV=development')
      expect(envFile!.content).toContain('PORT=3000')
      expect(envFile!.content).toContain('CLERK_PUBLISHABLE_KEY=pk_test_your_key_here')
      expect(envFile!.content).toContain('CLERK_SECRET_KEY=sk_test_your_secret_here')
      expect(envFile!.content).toContain('NEXT_PUBLIC_APP_URL=http://localhost:3000')
      
      // Should preserve comments
      expect(envFile!.content).toContain('# Database Configuration')
      expect(envFile!.content).toContain('# Authentication Configuration')
    })

    it('should handle README.md merging with sections', async () => {
      const template1: Template = {
        metadata: {
          id: 'base',
          name: 'Base Template',
          description: 'Base template',
          category: 'base',
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
            path: 'README.md',
            content: `# My Project

This is a Next.js project.

## Getting Started

Run the development server:

\`\`\`bash
npm run dev
\`\`\``
          }
        ],
        envVars: [],
        setupInstructions: [],
        packageDependencies: {},
        devDependencies: {},
        scripts: {}
      }

      const template2: Template = {
        ...template1,
        metadata: { ...template1.metadata, id: 'auth' },
        files: [
          {
            path: 'README.md',
            content: `## Authentication

This project uses Clerk for authentication.

### Setup

1. Create a Clerk account
2. Add your API keys to .env.local`
          }
        ]
      }

      const merged = await codeGenerator.mergeTemplates([template1, template2])
      const readmeFile = merged.files.find(f => f.path === 'README.md')

      expect(readmeFile!.content).toContain('# My Project')
      expect(readmeFile!.content).toContain('This is a Next.js project.')
      expect(readmeFile!.content).toContain('## Getting Started')
      expect(readmeFile!.content).toContain('npm run dev')
      expect(readmeFile!.content).toContain('## Authentication')
      expect(readmeFile!.content).toContain('This project uses Clerk for authentication.')
      expect(readmeFile!.content).toContain('### Setup')
    })
  })

  describe('Dependency Resolution', () => {
    it('should sort templates by dependency order', async () => {
      const baseTemplate: Template = {
        metadata: {
          id: 'base',
          name: 'Base Template',
          description: 'Base template',
          category: 'base',
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
        files: [{ path: 'base.ts', content: 'export const base = true' }],
        envVars: [],
        setupInstructions: [],
        packageDependencies: {},
        devDependencies: {},
        scripts: {}
      }

      const authTemplate: Template = {
        ...baseTemplate,
        metadata: {
          ...baseTemplate.metadata,
          id: 'auth',
          dependencies: ['base']
        },
        files: [{ path: 'auth.ts', content: 'export const auth = true' }]
      }

      const dbTemplate: Template = {
        ...baseTemplate,
        metadata: {
          ...baseTemplate.metadata,
          id: 'database',
          dependencies: ['base', 'auth']
        },
        files: [{ path: 'db.ts', content: 'export const db = true' }]
      }

      // Pass templates in wrong order
      const merged = await codeGenerator.mergeTemplates([dbTemplate, authTemplate, baseTemplate])

      // Should merge successfully without throwing dependency errors
      expect(merged.files).toHaveLength(3)
      expect(merged.files.find(f => f.path === 'base.ts')).toBeDefined()
      expect(merged.files.find(f => f.path === 'auth.ts')).toBeDefined()
      expect(merged.files.find(f => f.path === 'db.ts')).toBeDefined()
    })

    it('should detect and handle circular dependencies', async () => {
      const template1: Template = {
        metadata: {
          id: 'template1',
          name: 'Template 1',
          description: 'Template 1',
          category: 'auth',
          version: '1.0.0',
          complexity: 'simple',
          pricing: 'free',
          setupTime: 5,
          dependencies: ['template2'],
          conflicts: [],
          requiredEnvVars: [],
          optionalEnvVars: [],
          documentation: '',
          tags: [],
          popularity: 0,
          lastUpdated: new Date()
        },
        files: [{ path: 'file1.ts', content: 'export const file1 = true' }],
        envVars: [],
        setupInstructions: [],
        packageDependencies: {},
        devDependencies: {},
        scripts: {}
      }

      const template2: Template = {
        ...template1,
        metadata: {
          ...template1.metadata,
          id: 'template2',
          dependencies: ['template1'] // Circular dependency
        },
        files: [{ path: 'file2.ts', content: 'export const file2 = true' }]
      }

      await expect(
        codeGenerator.mergeTemplates([template1, template2])
      ).rejects.toThrow('Circular dependency detected')
    })

    it('should handle complex dependency chains', async () => {
      const templates: Template[] = []
      
      // Create a chain: A -> B -> C -> D
      for (let i = 0; i < 4; i++) {
        const id = String.fromCharCode(65 + i) // A, B, C, D
        const dependencies = i === 0 ? [] : [String.fromCharCode(64 + i)] // Previous letter
        
        templates.push({
          metadata: {
            id,
            name: `Template ${id}`,
            description: `Template ${id}`,
            category: 'base',
            version: '1.0.0',
            complexity: 'simple',
            pricing: 'free',
            setupTime: 5,
            dependencies,
            conflicts: [],
            requiredEnvVars: [],
            optionalEnvVars: [],
            documentation: '',
            tags: [],
            popularity: 0,
            lastUpdated: new Date()
          },
          files: [{ path: `${id.toLowerCase()}.ts`, content: `export const ${id.toLowerCase()} = true` }],
          envVars: [],
          setupInstructions: [],
          packageDependencies: {},
          devDependencies: {},
          scripts: {}
        })
      }

      // Pass in reverse order
      const merged = await codeGenerator.mergeTemplates(templates.reverse())

      expect(merged.files).toHaveLength(4)
      expect(merged.files.find(f => f.path === 'a.ts')).toBeDefined()
      expect(merged.files.find(f => f.path === 'b.ts')).toBeDefined()
      expect(merged.files.find(f => f.path === 'c.ts')).toBeDefined()
      expect(merged.files.find(f => f.path === 'd.ts')).toBeDefined()
    })
  })

  describe('Environment Variable Merging', () => {
    it('should merge environment variables without duplicates', async () => {
      const template1: Template = {
        metadata: {
          id: 'base',
          name: 'Base Template',
          description: 'Base template',
          category: 'base',
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
        files: [],
        envVars: [
          {
            key: 'DATABASE_URL',
            description: 'Database connection string',
            required: true,
            category: 'database'
          },
          {
            key: 'NODE_ENV',
            description: 'Node environment',
            required: false,
            defaultValue: 'development',
            category: 'other'
          }
        ],
        setupInstructions: [],
        packageDependencies: {},
        devDependencies: {},
        scripts: {}
      }

      const template2: Template = {
        ...template1,
        metadata: { ...template1.metadata, id: 'auth' },
        envVars: [
          {
            key: 'CLERK_PUBLISHABLE_KEY',
            description: 'Clerk publishable key',
            required: true,
            category: 'auth'
          },
          {
            key: 'DATABASE_URL', // Duplicate key
            description: 'Database URL for auth',
            required: true,
            category: 'database'
          }
        ]
      }

      const merged = await codeGenerator.mergeTemplates([template1, template2])

      expect(merged.envVars).toHaveLength(3) // Should not duplicate DATABASE_URL
      
      const envVarKeys = merged.envVars.map(v => v.key)
      expect(envVarKeys).toContain('DATABASE_URL')
      expect(envVarKeys).toContain('NODE_ENV')
      expect(envVarKeys).toContain('CLERK_PUBLISHABLE_KEY')
      
      // Should keep the first occurrence of DATABASE_URL
      const databaseUrlVar = merged.envVars.find(v => v.key === 'DATABASE_URL')
      expect(databaseUrlVar?.description).toBe('Database connection string')
    })
  })

  describe('Setup Instructions Merging', () => {
    it('should merge setup instructions with proper step numbering', async () => {
      const template1: Template = {
        metadata: {
          id: 'base',
          name: 'Base Template',
          description: 'Base template',
          category: 'base',
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
        files: [],
        envVars: [],
        setupInstructions: [
          {
            step: 1,
            title: 'Install dependencies',
            description: 'Run npm install',
            category: 'installation'
          },
          {
            step: 2,
            title: 'Setup environment',
            description: 'Copy .env.example to .env.local',
            category: 'configuration'
          }
        ],
        packageDependencies: {},
        devDependencies: {},
        scripts: {}
      }

      const template2: Template = {
        ...template1,
        metadata: { ...template1.metadata, id: 'auth' },
        setupInstructions: [
          {
            step: 1,
            title: 'Create Clerk account',
            description: 'Sign up at clerk.com',
            category: 'configuration'
          },
          {
            step: 2,
            title: 'Add Clerk keys',
            description: 'Add your Clerk keys to .env.local',
            category: 'configuration'
          }
        ]
      }

      const merged = await codeGenerator.mergeTemplates([template1, template2])

      expect(merged.setupInstructions).toHaveLength(4)
      
      // Should renumber steps properly
      const steps = merged.setupInstructions.map(i => i.step).sort((a, b) => a - b)
      expect(steps).toEqual([1, 2, 3, 4])
      
      // Should maintain original order within each template
      const step1 = merged.setupInstructions.find(i => i.step === 1)
      const step2 = merged.setupInstructions.find(i => i.step === 2)
      const step3 = merged.setupInstructions.find(i => i.step === 3)
      const step4 = merged.setupInstructions.find(i => i.step === 4)
      
      expect(step1?.title).toBe('Install dependencies')
      expect(step2?.title).toBe('Setup environment')
      expect(step3?.title).toBe('Create Clerk account')
      expect(step4?.title).toBe('Add Clerk keys')
    })
  })
})