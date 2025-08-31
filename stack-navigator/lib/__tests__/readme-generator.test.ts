import { ReadmeGenerator } from '../readme-generator'
import { GeneratedProject, TechSelections, Template } from '../types/template'

describe('ReadmeGenerator', () => {
  const mockSelections: TechSelections = {
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

  const mockProject: GeneratedProject = {
    name: 'test-project',
    files: [
      { path: 'package.json', content: '{}' },
      { path: 'src/index.ts', content: 'console.log("test");' }
    ],
    packageJson: { name: 'test-project', version: '1.0.0' },
    envTemplate: 'NODE_ENV=development',
    setupGuide: '',
    selections: mockSelections,
    metadata: {
      generatedAt: new Date('2024-01-01'),
      templateVersions: { 'nextjs': '1.0.0' },
      estimatedSetupTime: 30
    }
  }

  const mockTemplates: Template[] = [
    {
      metadata: {
        id: 'nextjs',
        name: 'Next.js',
        description: 'React framework',
        category: 'base',
        version: '1.0.0',
        complexity: 'simple',
        pricing: 'free',
        setupTime: 10,
        dependencies: [],
        conflicts: [],
        requiredEnvVars: [],
        optionalEnvVars: [],
        documentation: '',
        tags: [],
        popularity: 100,
        lastUpdated: new Date()
      },
      files: [],
      envVars: [],
      setupInstructions: [],
      packageDependencies: {},
      devDependencies: {},
      scripts: {}
    }
  ]

  describe('generateReadme', () => {
    it('should generate a comprehensive README', () => {
      const readme = ReadmeGenerator.generateReadme(mockProject)

      expect(readme).toContain('# test-project')
      expect(readme).toContain('## Quick Start')
      expect(readme).toContain('## Technology Stack')
      expect(readme).toContain('## Prerequisites')
      expect(readme).toContain('## Installation')
      expect(readme).toContain('## Configuration')
      expect(readme).toContain('## Development')
      expect(readme).toContain('## Deployment')
      expect(readme).toContain('## Troubleshooting')
    })

    it('should include project metadata in header', () => {
      const readme = ReadmeGenerator.generateReadme(mockProject)

      expect(readme).toContain('Generated on: 1/1/2024')
      expect(readme).toContain('Estimated setup time: 30 minutes')
    })

    it('should list selected technologies', () => {
      const readme = ReadmeGenerator.generateReadme(mockProject)

      expect(readme).toContain('**Framework:** Next.js')
      expect(readme).toContain('**Authentication:** Clerk')
      expect(readme).toContain('**Database:** Supabase')
      expect(readme).toContain('**Payments:** Stripe')
      expect(readme).toContain('**Hosting:** Vercel')
    })

    it('should include quick start instructions', () => {
      const readme = ReadmeGenerator.generateReadme(mockProject)

      expect(readme).toContain('npm install')
      expect(readme).toContain('cp .env.example .env.local')
      expect(readme).toContain('npm run dev')
      expect(readme).toContain('http://localhost:3000')
    })

    it('should include service-specific configuration instructions', () => {
      const readme = ReadmeGenerator.generateReadme(mockProject)

      expect(readme).toContain('Clerk (Authentication)')
      expect(readme).toContain('Supabase (Database)')
      expect(readme).toContain('Stripe (Payments)')
    })

    it('should include deployment instructions for selected platform', () => {
      const readme = ReadmeGenerator.generateReadme(mockProject)

      expect(readme).toContain('Vercel')
      expect(readme).toContain('Deploy with Vercel')
      expect(readme).toContain('vercel')
    })

    it('should include troubleshooting section with technology-specific issues', () => {
      const readme = ReadmeGenerator.generateReadme(mockProject)

      expect(readme).toContain('Clerk authentication not working')
      expect(readme).toContain('Supabase connection fails')
      expect(readme).toContain('Stripe webhooks not working')
    })

    it('should respect options for optional sections', () => {
      const readmeWithoutDeployment = ReadmeGenerator.generateReadme(mockProject, {
        includeDeployment: false,
        includeTroubleshooting: false
      })

      expect(readmeWithoutDeployment).not.toContain('## Deployment')
      expect(readmeWithoutDeployment).not.toContain('## Troubleshooting')
    })

    it('should include custom sections when provided', () => {
      const customSections = [
        {
          title: 'Custom Section',
          content: '## Custom Section\n\nThis is a custom section.',
          order: 5
        }
      ]

      const readme = ReadmeGenerator.generateReadme(mockProject, {
        customSections
      })

      expect(readme).toContain('## Custom Section')
      expect(readme).toContain('This is a custom section.')
    })

    it('should include contributing section when requested', () => {
      const readme = ReadmeGenerator.generateReadme(mockProject, {
        includeContributing: true
      })

      expect(readme).toContain('## Contributing')
      expect(readme).toContain('Fork the repository')
      expect(readme).toContain('Pull Request')
    })
  })

  describe('generateSetupInstructions', () => {
    it('should generate detailed setup instructions', () => {
      const instructions = ReadmeGenerator.generateSetupInstructions(mockProject, mockTemplates)

      expect(instructions).toContain('# Detailed Setup Instructions')
      expect(instructions).toContain('## Environment Setup')
      expect(instructions).toContain('## Service Configuration')
    })

    it('should include database setup when database is selected', () => {
      const instructions = ReadmeGenerator.generateSetupInstructions(mockProject, mockTemplates)

      expect(instructions).toContain('## Database Setup')
      expect(instructions).toContain('Supabase')
    })

    it('should include authentication setup when auth is selected', () => {
      const instructions = ReadmeGenerator.generateSetupInstructions(mockProject, mockTemplates)

      expect(instructions).toContain('## Authentication Setup')
      expect(instructions).toContain('Clerk')
    })

    it('should include payment setup when payments are selected', () => {
      const instructions = ReadmeGenerator.generateSetupInstructions(mockProject, mockTemplates)

      expect(instructions).toContain('## Payment Setup')
      expect(instructions).toContain('Stripe')
    })

    it('should include deployment instructions', () => {
      const instructions = ReadmeGenerator.generateSetupInstructions(mockProject, mockTemplates)

      expect(instructions).toContain('## Deployment Instructions')
      expect(instructions).toContain('Vercel')
    })
  })

  describe('generateDeploymentGuides', () => {
    it('should generate Vercel deployment guide', () => {
      const guides = ReadmeGenerator.generateDeploymentGuides('vercel')

      expect(guides).toHaveLength(1)
      expect(guides[0].platform).toBe('Vercel')
      expect(guides[0].steps).toContain('Install Vercel CLI: `npm i -g vercel`')
      expect(guides[0].steps).toContain('Run `vercel` in your project directory')
    })

    it('should generate Netlify deployment guide', () => {
      const guides = ReadmeGenerator.generateDeploymentGuides('netlify')

      expect(guides).toHaveLength(1)
      expect(guides[0].platform).toBe('Netlify')
      expect(guides[0].steps).toContain('Build your project: `npm run build`')
      expect(guides[0].steps).toContain('Install Netlify CLI: `npm i -g netlify-cli`')
    })

    it('should generate Railway deployment guide', () => {
      const guides = ReadmeGenerator.generateDeploymentGuides('railway')

      expect(guides).toHaveLength(1)
      expect(guides[0].platform).toBe('Railway')
      expect(guides[0].steps).toContain('Connect your GitHub repository to Railway')
    })

    it('should generate Render deployment guide', () => {
      const guides = ReadmeGenerator.generateDeploymentGuides('render')

      expect(guides).toHaveLength(1)
      expect(guides[0].platform).toBe('Render')
      expect(guides[0].steps).toContain('Connect your GitHub repository to Render')
    })
  })

  describe('generateTroubleshootingGuide', () => {
    it('should generate common troubleshooting items', () => {
      const items = ReadmeGenerator.generateTroubleshootingGuide(mockSelections)

      expect(items.length).toBeGreaterThan(0)
      
      // Check for common issues
      const commonIssue = items.find(item => 
        item.issue.includes('npm install fails')
      )
      expect(commonIssue).toBeDefined()
      expect(commonIssue?.solution).toContain('--legacy-peer-deps')
    })

    it('should include technology-specific troubleshooting', () => {
      const items = ReadmeGenerator.generateTroubleshootingGuide(mockSelections)

      // Check for Clerk-specific issues
      const clerkIssue = items.find(item => 
        item.issue.includes('Clerk authentication')
      )
      expect(clerkIssue).toBeDefined()
      expect(clerkIssue?.solution).toContain('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY')

      // Check for Supabase-specific issues
      const supabaseIssue = items.find(item => 
        item.issue.includes('Supabase connection')
      )
      expect(supabaseIssue).toBeDefined()

      // Check for Stripe-specific issues
      const stripeIssue = items.find(item => 
        item.issue.includes('Stripe webhooks')
      )
      expect(stripeIssue).toBeDefined()
    })

    it('should categorize issues correctly', () => {
      const items = ReadmeGenerator.generateTroubleshootingGuide(mockSelections)

      const categories = ['installation', 'configuration', 'runtime', 'deployment']
      
      for (const category of categories) {
        const categoryItems = items.filter(item => item.category === category)
        expect(categoryItems.length).toBeGreaterThan(0)
      }
    })
  })

  describe('technology display names', () => {
    it('should convert technical names to display names', () => {
      const projectWithVariousTech = {
        ...mockProject,
        selections: {
          ...mockSelections,
          authentication: 'nextauth',
          database: 'planetscale',
          payments: 'paddle',
          analytics: 'plausible'
        }
      }

      const readme = ReadmeGenerator.generateReadme(projectWithVariousTech)

      expect(readme).toContain('**Authentication:** NextAuth.js')
      expect(readme).toContain('**Database:** PlanetScale')
      expect(readme).toContain('**Payments:** Paddle')
      expect(readme).toContain('**Analytics:** Plausible')
    })
  })

  describe('none selections handling', () => {
    it('should handle "none" selections gracefully', () => {
      const projectWithNoneSelections = {
        ...mockProject,
        selections: {
          ...mockSelections,
          authentication: 'none',
          payments: 'none',
          analytics: 'none',
          email: 'none',
          monitoring: 'none'
        }
      }

      const readme = ReadmeGenerator.generateReadme(projectWithNoneSelections)

      expect(readme).not.toContain('**Authentication:** none')
      expect(readme).not.toContain('**Payments:** none')
      expect(readme).toContain('**Framework:** Next.js')
      expect(readme).toContain('**Database:** Supabase')
    })
  })
})