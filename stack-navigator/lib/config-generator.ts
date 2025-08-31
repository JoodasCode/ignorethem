import { Template, TechSelections, EnvVariable } from './types/template'
import * as path from 'path'

/**
 * Configuration generator for environment variables and deployment configs
 */
export class ConfigGenerator {
  /**
   * Generate environment variable template file
   */
  generateEnvTemplate(templates: Template[], selections: TechSelections): EnvTemplateResult {
    const envVars = this.collectEnvVariables(templates)
    const groupedVars = this.groupEnvVariablesByCategory(envVars)
    
    return {
      envExample: this.generateEnvExampleFile(groupedVars, selections),
      envLocal: this.generateEnvLocalTemplate(groupedVars, selections),
      envProduction: this.generateEnvProductionTemplate(groupedVars, selections),
      documentation: this.generateEnvDocumentation(groupedVars, selections)
    }
  }

  /**
   * Generate deployment configuration files
   */
  generateDeploymentConfigs(selections: TechSelections): DeploymentConfigResult {
    const configs: DeploymentConfigResult = {
      files: [],
      instructions: []
    }

    // Generate hosting platform configs
    switch (selections.hosting) {
      case 'vercel':
        configs.files.push(...this.generateVercelConfig(selections))
        configs.instructions.push(...this.getVercelInstructions())
        break
      case 'netlify':
        configs.files.push(...this.generateNetlifyConfig(selections))
        configs.instructions.push(...this.getNetlifyInstructions())
        break
      case 'railway':
        configs.files.push(...this.generateRailwayConfig(selections))
        configs.instructions.push(...this.getRailwayInstructions())
        break
      case 'render':
        configs.files.push(...this.generateRenderConfig(selections))
        configs.instructions.push(...this.getRenderInstructions())
        break
    }

    // Generate framework-specific configs
    if (selections.framework === 'nextjs') {
      configs.files.push(...this.generateNextJsConfigs(selections))
    }

    return configs
  }

  /**
   * Generate Next.js configuration files
   */
  generateNextJsConfigs(selections: TechSelections): ConfigFile[] {
    const configs: ConfigFile[] = []

    // next.config.js
    configs.push({
      path: 'next.config.mjs',
      content: this.generateNextConfig(selections)
    })

    // tailwind.config.js (if using Tailwind)
    if (selections.ui === 'shadcn' || this.usesTailwind(selections)) {
      configs.push({
        path: 'tailwind.config.ts',
        content: this.generateTailwindConfig(selections)
      })

      configs.push({
        path: 'postcss.config.mjs',
        content: this.generatePostCSSConfig()
      })
    }

    // TypeScript config
    configs.push({
      path: 'tsconfig.json',
      content: this.generateTSConfig(selections)
    })

    return configs
  }

  /**
   * Generate setup instructions for environment variables
   */
  generateSetupInstructions(
    templates: Template[],
    selections: TechSelections
  ): SetupInstruction[] {
    const instructions: SetupInstruction[] = []
    const envVars = this.collectEnvVariables(templates)

    // Base setup instructions
    instructions.push({
      step: 1,
      title: 'Environment Setup',
      description: 'Copy the environment template and configure your variables',
      commands: [
        'cp .env.example .env.local',
        'cp .env.example .env.production'
      ],
      category: 'configuration'
    })

    // Service-specific instructions
    if (selections.authentication === 'clerk') {
      instructions.push(...this.getClerkSetupInstructions())
    }

    if (selections.authentication === 'supabase-auth' || selections.database === 'supabase') {
      instructions.push(...this.getSupabaseSetupInstructions())
    }

    if (selections.payments === 'stripe') {
      instructions.push(...this.getStripeSetupInstructions())
    }

    if (selections.analytics === 'posthog') {
      instructions.push(...this.getPostHogSetupInstructions())
    }

    if (selections.email === 'resend') {
      instructions.push(...this.getResendSetupInstructions())
    }

    if (selections.monitoring === 'sentry') {
      instructions.push(...this.getSentrySetupInstructions())
    }

    // Deployment instructions
    instructions.push(...this.getDeploymentInstructions(selections))

    return instructions.sort((a, b) => a.step - b.step)
  }

  /**
   * Collect all environment variables from templates
   */
  private collectEnvVariables(templates: Template[]): EnvVariable[] {
    const envVars: EnvVariable[] = []
    const seenKeys = new Set<string>()

    for (const template of templates) {
      for (const envVar of template.envVars) {
        if (!seenKeys.has(envVar.key)) {
          envVars.push(envVar)
          seenKeys.add(envVar.key)
        }
      }
    }

    return envVars
  }

  /**
   * Group environment variables by category
   */
  private groupEnvVariablesByCategory(envVars: EnvVariable[]): Record<string, EnvVariable[]> {
    return envVars.reduce((groups, envVar) => {
      const category = envVar.category || 'other'
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(envVar)
      return groups
    }, {} as Record<string, EnvVariable[]>)
  }

  /**
   * Generate .env.example file content
   */
  private generateEnvExampleFile(
    groupedVars: Record<string, EnvVariable[]>,
    selections: TechSelections
  ): string {
    let content = '# Environment Variables Template\n'
    content += '# Copy this file to .env.local and fill in your actual values\n'
    content += '# Never commit .env.local to version control\n\n'

    // Add framework-specific variables
    content += '# Framework Configuration\n'
    content += 'NODE_ENV=development\n'
    if (selections.framework === 'nextjs') {
      content += 'NEXTAUTH_URL=http://localhost:3000\n'
      content += 'NEXTAUTH_SECRET=your-secret-key-here\n'
    }
    content += '\n'

    // Add grouped variables
    const categoryOrder = ['auth', 'database', 'payments', 'analytics', 'email', 'monitoring', 'other']
    
    for (const category of categoryOrder) {
      const vars = groupedVars[category]
      if (!vars || vars.length === 0) continue

      content += `# ${this.capitalizeCategory(category)}\n`
      
      for (const envVar of vars) {
        content += `# ${envVar.description}\n`
        
        if (envVar.required) {
          content += `${envVar.key}=${envVar.example || ''}\n`
        } else {
          content += `# ${envVar.key}=${envVar.example || ''}\n`
        }
        content += '\n'
      }
    }

    return content
  }

  /**
   * Generate .env.local template with development values
   */
  private generateEnvLocalTemplate(
    groupedVars: Record<string, EnvVariable[]>,
    selections: TechSelections
  ): string {
    let content = '# Local Development Environment\n'
    content += '# This file is for local development only\n'
    content += '# Add your actual API keys and secrets here\n\n'

    content += 'NODE_ENV=development\n'
    if (selections.framework === 'nextjs') {
      content += 'NEXTAUTH_URL=http://localhost:3000\n'
      content += 'NEXTAUTH_SECRET=development-secret-change-in-production\n'
    }
    content += '\n'

    // Add development-specific values
    const allVars = Object.values(groupedVars).flat()
    for (const envVar of allVars) {
      if (envVar.required) {
        content += `${envVar.key}=${this.getDevValue(envVar)}\n`
      }
    }

    return content
  }

  /**
   * Generate .env.production template
   */
  private generateEnvProductionTemplate(
    groupedVars: Record<string, EnvVariable[]>,
    selections: TechSelections
  ): string {
    let content = '# Production Environment Template\n'
    content += '# Configure these variables in your hosting platform\n'
    content += '# Use strong, unique values for production\n\n'

    content += 'NODE_ENV=production\n'
    if (selections.framework === 'nextjs') {
      content += 'NEXTAUTH_URL=https://your-domain.com\n'
      content += 'NEXTAUTH_SECRET=strong-random-secret-for-production\n'
    }
    content += '\n'

    const allVars = Object.values(groupedVars).flat()
    for (const envVar of allVars) {
      if (envVar.required) {
        content += `${envVar.key}=\n`
      }
    }

    return content
  }

  /**
   * Generate environment variables documentation
   */
  private generateEnvDocumentation(
    groupedVars: Record<string, EnvVariable[]>,
    selections: TechSelections
  ): string {
    let content = '# Environment Variables Documentation\n\n'
    content += 'This document describes all environment variables used in this project.\n\n'

    const categoryOrder = ['auth', 'database', 'payments', 'analytics', 'email', 'monitoring', 'other']
    
    for (const category of categoryOrder) {
      const vars = groupedVars[category]
      if (!vars || vars.length === 0) continue

      content += `## ${this.capitalizeCategory(category)}\n\n`
      
      for (const envVar of vars) {
        content += `### \`${envVar.key}\`\n\n`
        content += `${envVar.description}\n\n`
        content += `- **Required:** ${envVar.required ? 'Yes' : 'No'}\n`
        if (envVar.example) {
          content += `- **Example:** \`${envVar.example}\`\n`
        }
        if (envVar.defaultValue) {
          content += `- **Default:** \`${envVar.defaultValue}\`\n`
        }
        content += '\n'
      }
    }

    return content
  }

  /**
   * Generate Next.js configuration
   */
  private generateNextConfig(selections: TechSelections): string {
    const config = {
      experimental: {},
      images: {
        domains: []
      },
      env: {}
    }

    // Add configuration based on selections
    if (selections.monitoring === 'sentry') {
      config.experimental = {
        ...config.experimental,
        instrumentationHook: true
      }
    }

    if (selections.analytics === 'posthog') {
      config.env = {
        ...config.env,
        NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
        NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST
      }
    }

    return `/** @type {import('next').NextConfig} */
const nextConfig = ${JSON.stringify(config, null, 2)}

export default nextConfig`
  }

  /**
   * Generate Tailwind CSS configuration
   */
  private generateTailwindConfig(selections: TechSelections): string {
    const config = {
      darkMode: ['class'],
      content: [
        './pages/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './app/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}'
      ],
      theme: {
        container: {
          center: true,
          padding: '2rem',
          screens: {
            '2xl': '1400px'
          }
        },
        extend: {
          colors: {
            border: 'hsl(var(--border))',
            input: 'hsl(var(--input))',
            ring: 'hsl(var(--ring))',
            background: 'hsl(var(--background))',
            foreground: 'hsl(var(--foreground))',
            primary: {
              DEFAULT: 'hsl(var(--primary))',
              foreground: 'hsl(var(--primary-foreground))'
            },
            secondary: {
              DEFAULT: 'hsl(var(--secondary))',
              foreground: 'hsl(var(--secondary-foreground))'
            },
            destructive: {
              DEFAULT: 'hsl(var(--destructive))',
              foreground: 'hsl(var(--destructive-foreground))'
            },
            muted: {
              DEFAULT: 'hsl(var(--muted))',
              foreground: 'hsl(var(--muted-foreground))'
            },
            accent: {
              DEFAULT: 'hsl(var(--accent))',
              foreground: 'hsl(var(--accent-foreground))'
            },
            popover: {
              DEFAULT: 'hsl(var(--popover))',
              foreground: 'hsl(var(--popover-foreground))'
            },
            card: {
              DEFAULT: 'hsl(var(--card))',
              foreground: 'hsl(var(--card-foreground))'
            }
          },
          borderRadius: {
            lg: 'var(--radius)',
            md: 'calc(var(--radius) - 2px)',
            sm: 'calc(var(--radius) - 4px)'
          },
          keyframes: {
            'accordion-down': {
              from: { height: 0 },
              to: { height: 'var(--radix-accordion-content-height)' }
            },
            'accordion-up': {
              from: { height: 'var(--radix-accordion-content-height)' },
              to: { height: 0 }
            }
          },
          animation: {
            'accordion-down': 'accordion-down 0.2s ease-out',
            'accordion-up': 'accordion-up 0.2s ease-out'
          }
        }
      },
      plugins: ['tailwindcss-animate']
    }

    return `import type { Config } from "tailwindcss"

const config = ${JSON.stringify(config, null, 2)} satisfies Config

export default config`
  }

  /**
   * Generate PostCSS configuration
   */
  private generatePostCSSConfig(): string {
    return `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`
  }

  /**
   * Generate TypeScript configuration
   */
  private generateTSConfig(selections: TechSelections): string {
    const config = {
      compilerOptions: {
        lib: ['dom', 'dom.iterable', 'es6'],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: 'esnext',
        moduleResolution: 'bundler',
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: 'preserve',
        incremental: true,
        plugins: [
          {
            name: 'next'
          }
        ],
        baseUrl: '.',
        paths: {
          '@/*': ['./src/*'],
          '@/components/*': ['./components/*'],
          '@/lib/*': ['./lib/*'],
          '@/app/*': ['./app/*']
        }
      },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
      exclude: ['node_modules']
    }

    return JSON.stringify(config, null, 2)
  }

  /**
   * Generate Vercel deployment configuration
   */
  private generateVercelConfig(selections: TechSelections): ConfigFile[] {
    const config = {
      buildCommand: 'npm run build',
      outputDirectory: '.next',
      framework: 'nextjs',
      installCommand: 'npm install',
      devCommand: 'npm run dev'
    }

    return [
      {
        path: 'vercel.json',
        content: JSON.stringify(config, null, 2)
      }
    ]
  }

  /**
   * Generate Netlify deployment configuration
   */
  private generateNetlifyConfig(selections: TechSelections): ConfigFile[] {
    const config = {
      build: {
        command: 'npm run build',
        publish: '.next'
      },
      plugins: [
        {
          package: '@netlify/plugin-nextjs'
        }
      ]
    }

    return [
      {
        path: 'netlify.toml',
        content: this.toToml(config)
      }
    ]
  }

  /**
   * Generate Railway deployment configuration
   */
  private generateRailwayConfig(selections: TechSelections): ConfigFile[] {
    return [
      {
        path: 'railway.json',
        content: JSON.stringify({
          deploy: {
            startCommand: 'npm start',
            healthcheckPath: '/api/health'
          }
        }, null, 2)
      }
    ]
  }

  /**
   * Generate Render deployment configuration
   */
  private generateRenderConfig(selections: TechSelections): ConfigFile[] {
    return [
      {
        path: 'render.yaml',
        content: `services:
  - type: web
    name: ${selections.framework}-app
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production`
      }
    ]
  }

  /**
   * Get development value for environment variable
   */
  private getDevValue(envVar: EnvVariable): string {
    if (envVar.defaultValue) {
      return envVar.defaultValue
    }

    // Provide sensible development defaults
    switch (envVar.category) {
      case 'database':
        if (envVar.key.includes('URL')) {
          return 'postgresql://localhost:5432/dev'
        }
        break
      case 'auth':
        if (envVar.key.includes('SECRET')) {
          return 'development-secret-change-in-production'
        }
        break
    }

    return envVar.example || ''
  }

  /**
   * Check if selections use Tailwind CSS
   */
  private usesTailwind(selections: TechSelections): boolean {
    return selections.ui === 'shadcn' || selections.framework === 'nextjs'
  }

  /**
   * Capitalize category name
   */
  private capitalizeCategory(category: string): string {
    return category.charAt(0).toUpperCase() + category.slice(1)
  }

  /**
   * Convert object to TOML format (basic implementation)
   */
  private toToml(obj: any): string {
    let toml = ''
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && !Array.isArray(value)) {
        toml += `[${key}]\n`
        for (const [subKey, subValue] of Object.entries(value as object)) {
          toml += `${subKey} = "${subValue}"\n`
        }
        toml += '\n'
      } else if (Array.isArray(value)) {
        toml += `[[${key}]]\n`
        for (const item of value) {
          if (typeof item === 'object') {
            for (const [itemKey, itemValue] of Object.entries(item)) {
              toml += `${itemKey} = "${itemValue}"\n`
            }
          }
        }
        toml += '\n'
      } else {
        toml += `${key} = "${value}"\n`
      }
    }
    
    return toml
  }

  // Service-specific setup instructions
  private getClerkSetupInstructions(): SetupInstruction[] {
    return [
      {
        step: 10,
        title: 'Clerk Authentication Setup',
        description: 'Create a Clerk account and configure authentication',
        commands: [
          'Visit https://clerk.com and create an account',
          'Create a new application',
          'Copy your publishable key and secret key to .env.local'
        ],
        category: 'configuration',
        url: 'https://clerk.com/docs/quickstarts/nextjs'
      }
    ]
  }

  private getSupabaseSetupInstructions(): SetupInstruction[] {
    return [
      {
        step: 11,
        title: 'Supabase Setup',
        description: 'Create a Supabase project and configure database',
        commands: [
          'Visit https://supabase.com and create an account',
          'Create a new project',
          'Copy your project URL and anon key to .env.local',
          'Run database migrations if needed'
        ],
        category: 'configuration',
        url: 'https://supabase.com/docs/guides/getting-started/quickstarts/nextjs'
      }
    ]
  }

  private getStripeSetupInstructions(): SetupInstruction[] {
    return [
      {
        step: 12,
        title: 'Stripe Payment Setup',
        description: 'Configure Stripe for payment processing',
        commands: [
          'Visit https://stripe.com and create an account',
          'Get your publishable and secret keys from the dashboard',
          'Add keys to .env.local',
          'Configure webhooks for production'
        ],
        category: 'configuration',
        url: 'https://stripe.com/docs/development/quickstart'
      }
    ]
  }

  private getPostHogSetupInstructions(): SetupInstruction[] {
    return [
      {
        step: 13,
        title: 'PostHog Analytics Setup',
        description: 'Configure PostHog for product analytics',
        commands: [
          'Visit https://posthog.com and create an account',
          'Create a new project',
          'Copy your project API key to .env.local'
        ],
        category: 'configuration',
        url: 'https://posthog.com/docs/integrate/client/js'
      }
    ]
  }

  private getResendSetupInstructions(): SetupInstruction[] {
    return [
      {
        step: 14,
        title: 'Resend Email Setup',
        description: 'Configure Resend for transactional emails',
        commands: [
          'Visit https://resend.com and create an account',
          'Create an API key',
          'Add your API key to .env.local',
          'Verify your domain for production'
        ],
        category: 'configuration',
        url: 'https://resend.com/docs/send-with-nextjs'
      }
    ]
  }

  private getSentrySetupInstructions(): SetupInstruction[] {
    return [
      {
        step: 15,
        title: 'Sentry Error Monitoring Setup',
        description: 'Configure Sentry for error tracking',
        commands: [
          'Visit https://sentry.io and create an account',
          'Create a new project for Next.js',
          'Copy your DSN to .env.local',
          'Configure error boundaries in your app'
        ],
        category: 'configuration',
        url: 'https://docs.sentry.io/platforms/javascript/guides/nextjs/'
      }
    ]
  }

  private getVercelInstructions(): SetupInstruction[] {
    return [
      {
        step: 20,
        title: 'Deploy to Vercel',
        description: 'Deploy your application to Vercel',
        commands: [
          'Install Vercel CLI: npm i -g vercel',
          'Run: vercel',
          'Follow the prompts to deploy',
          'Add environment variables in Vercel dashboard'
        ],
        category: 'deployment',
        url: 'https://vercel.com/docs/deployments/overview'
      }
    ]
  }

  private getNetlifyInstructions(): SetupInstruction[] {
    return [
      {
        step: 20,
        title: 'Deploy to Netlify',
        description: 'Deploy your application to Netlify',
        commands: [
          'Connect your Git repository to Netlify',
          'Configure build settings',
          'Add environment variables',
          'Deploy your site'
        ],
        category: 'deployment',
        url: 'https://docs.netlify.com/integrations/frameworks/next-js/'
      }
    ]
  }

  private getRailwayInstructions(): SetupInstruction[] {
    return [
      {
        step: 20,
        title: 'Deploy to Railway',
        description: 'Deploy your application to Railway',
        commands: [
          'Install Railway CLI: npm i -g @railway/cli',
          'Run: railway login',
          'Run: railway init',
          'Add environment variables: railway variables',
          'Deploy: railway up'
        ],
        category: 'deployment',
        url: 'https://docs.railway.app/deploy/deployments'
      }
    ]
  }

  private getRenderInstructions(): SetupInstruction[] {
    return [
      {
        step: 20,
        title: 'Deploy to Render',
        description: 'Deploy your application to Render',
        commands: [
          'Connect your Git repository to Render',
          'Create a new Web Service',
          'Configure build and start commands',
          'Add environment variables'
        ],
        category: 'deployment',
        url: 'https://render.com/docs/deploy-nextjs-app'
      }
    ]
  }

  private getDeploymentInstructions(selections: TechSelections): SetupInstruction[] {
    const instructions: SetupInstruction[] = []

    // General deployment preparation
    instructions.push({
      step: 19,
      title: 'Prepare for Deployment',
      description: 'Prepare your application for production deployment',
      commands: [
        'npm run build',
        'Test the production build locally: npm start',
        'Ensure all environment variables are configured',
        'Test all integrations work in production mode'
      ],
      category: 'deployment'
    })

    return instructions
  }
}

// Types for configuration generation
interface EnvTemplateResult {
  envExample: string
  envLocal: string
  envProduction: string
  documentation: string
}

interface DeploymentConfigResult {
  files: ConfigFile[]
  instructions: SetupInstruction[]
}

interface ConfigFile {
  path: string
  content: string
}

interface SetupInstruction {
  step: number
  title: string
  description: string
  commands?: string[]
  category: 'installation' | 'configuration' | 'deployment' | 'testing'
  url?: string
}

export const configGenerator = new ConfigGenerator()