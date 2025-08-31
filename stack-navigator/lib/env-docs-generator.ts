import { TechSelections } from './types/template'

export interface EnvVarDoc {
  key: string
  description: string
  required: boolean
  defaultValue?: string
  example: string
  category: string
  service: string
  setupInstructions: string
  notes?: string[]
}

export interface EnvDocsOptions {
  includeExamples?: boolean
  includeSetupInstructions?: boolean
  groupByService?: boolean
}

/**
 * Service for generating comprehensive environment variable documentation
 */
export class EnvDocsGenerator {
  /**
   * Generate complete environment variables documentation
   */
  static generateEnvDocs(
    selections: TechSelections,
    options: EnvDocsOptions = {}
  ): string {
    const envVars = this.getEnvVarsForSelections(selections)
    
    let docs = '# Environment Variables Documentation\n\n'
    docs += 'This document describes all environment variables used in your project.\n\n'
    
    // Quick reference section
    docs += this.generateQuickReference(envVars)
    
    // Detailed documentation
    if (options.groupByService !== false) {
      docs += this.generateServiceGroupedDocs(envVars, options)
    } else {
      docs += this.generateAlphabeticalDocs(envVars, options)
    }
    
    // Setup checklist
    docs += this.generateSetupChecklist(envVars)
    
    // Troubleshooting section
    docs += this.generateTroubleshooting()
    
    return docs
  }

  /**
   * Generate .env.example file content
   */
  static generateEnvExample(selections: TechSelections): string {
    const envVars = this.getEnvVarsForSelections(selections)
    
    let content = '# Environment Variables\n'
    content += '# Copy this file to .env.local and fill in your actual values\n\n'
    
    const groupedVars = this.groupVarsByService(envVars)
    
    for (const [service, vars] of Object.entries(groupedVars)) {
      content += `# ${service}\n`
      
      for (const envVar of vars) {
        if (envVar.description) {
          content += `# ${envVar.description}\n`
        }
        
        const value = envVar.defaultValue || envVar.example
        content += `${envVar.key}=${value}\n`
        
        if (!envVar.required) {
          content += `# Optional: ${envVar.key}=${value}\n`
        }
        
        content += '\n'
      }
    }
    
    return content
  }

  /**
   * Generate .env.local template with placeholder values
   */
  static generateEnvLocalTemplate(selections: TechSelections): string {
    const envVars = this.getEnvVarsForSelections(selections)
    
    let content = '# Local Environment Variables\n'
    content += '# This file should never be committed to version control\n\n'
    
    const groupedVars = this.groupVarsByService(envVars)
    
    for (const [service, vars] of Object.entries(groupedVars)) {
      content += `# ${service} Configuration\n`
      
      for (const envVar of vars) {
        if (envVar.required) {
          content += `${envVar.key}=your_${envVar.key.toLowerCase()}_here\n`
        } else {
          content += `# ${envVar.key}=your_${envVar.key.toLowerCase()}_here\n`
        }
      }
      
      content += '\n'
    }
    
    return content
  }

  /**
   * Get all environment variables for the selected technologies
   */
  private static getEnvVarsForSelections(selections: TechSelections): EnvVarDoc[] {
    const envVars: EnvVarDoc[] = []
    
    // Framework variables
    if (selections.framework === 'nextjs') {
      envVars.push(...this.getNextJsEnvVars())
    }
    
    // Authentication variables
    if (selections.authentication !== 'none') {
      envVars.push(...this.getAuthEnvVars(selections.authentication))
    }
    
    // Database variables
    if (selections.database !== 'none') {
      envVars.push(...this.getDatabaseEnvVars(selections.database))
    }
    
    // Payment variables
    if (selections.payments !== 'none') {
      envVars.push(...this.getPaymentEnvVars(selections.payments))
    }
    
    // Analytics variables
    if (selections.analytics !== 'none') {
      envVars.push(...this.getAnalyticsEnvVars(selections.analytics))
    }
    
    // Email variables
    if (selections.email !== 'none') {
      envVars.push(...this.getEmailEnvVars(selections.email))
    }
    
    // Monitoring variables
    if (selections.monitoring !== 'none') {
      envVars.push(...this.getMonitoringEnvVars(selections.monitoring))
    }
    
    return envVars
  }

  // Service-specific environment variable definitions

  private static getNextJsEnvVars(): EnvVarDoc[] {
    return [
      {
        key: 'NODE_ENV',
        description: 'Node.js environment mode',
        required: false,
        defaultValue: 'development',
        example: 'development',
        category: 'Framework',
        service: 'Next.js',
        setupInstructions: 'Automatically set by Next.js. Use "production" for production builds.',
        notes: ['Automatically set to "production" during build', 'Controls optimization and debugging features']
      },
      {
        key: 'NEXTAUTH_URL',
        description: 'Canonical URL of your site (required for NextAuth.js)',
        required: false,
        example: 'http://localhost:3000',
        category: 'Framework',
        service: 'Next.js',
        setupInstructions: 'Set to your domain URL. Use http://localhost:3000 for development.',
        notes: ['Required if using NextAuth.js', 'Must match your actual domain in production']
      }
    ]
  }

  private static getAuthEnvVars(auth: string): EnvVarDoc[] {
    switch (auth) {
      case 'clerk':
        return [
          {
            key: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
            description: 'Clerk publishable key for client-side authentication',
            required: true,
            example: 'pk_test_...',
            category: 'Authentication',
            service: 'Clerk',
            setupInstructions: '1. Go to clerk.com and create an application\n2. Copy the publishable key from the API Keys section',
            notes: ['Safe to expose in client-side code', 'Different keys for development and production']
          },
          {
            key: 'CLERK_SECRET_KEY',
            description: 'Clerk secret key for server-side operations',
            required: true,
            example: 'sk_test_...',
            category: 'Authentication',
            service: 'Clerk',
            setupInstructions: '1. Go to clerk.com dashboard\n2. Copy the secret key from the API Keys section',
            notes: ['Keep this secret and secure', 'Never expose in client-side code']
          }
        ]
      
      case 'supabase-auth':
        return [
          {
            key: 'NEXT_PUBLIC_SUPABASE_URL',
            description: 'Supabase project URL',
            required: true,
            example: 'https://your-project.supabase.co',
            category: 'Authentication',
            service: 'Supabase',
            setupInstructions: '1. Create a Supabase project at supabase.com\n2. Go to Settings → API\n3. Copy the Project URL',
            notes: ['Safe to expose in client-side code']
          },
          {
            key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
            description: 'Supabase anonymous public key',
            required: true,
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            category: 'Authentication',
            service: 'Supabase',
            setupInstructions: '1. Go to Supabase project Settings → API\n2. Copy the anon public key',
            notes: ['Safe to expose in client-side code', 'Respects Row Level Security policies']
          },
          {
            key: 'SUPABASE_SERVICE_ROLE_KEY',
            description: 'Supabase service role key for admin operations',
            required: false,
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            category: 'Authentication',
            service: 'Supabase',
            setupInstructions: '1. Go to Supabase project Settings → API\n2. Copy the service_role key',
            notes: ['Keep this secret - bypasses RLS', 'Only use for admin operations']
          }
        ]
      
      case 'nextauth':
        return [
          {
            key: 'NEXTAUTH_SECRET',
            description: 'Secret key for NextAuth.js JWT encryption',
            required: true,
            example: 'your-secret-key-here',
            category: 'Authentication',
            service: 'NextAuth.js',
            setupInstructions: 'Generate a random string: openssl rand -base64 32',
            notes: ['Must be at least 32 characters', 'Keep this secret and secure']
          },
          {
            key: 'NEXTAUTH_URL',
            description: 'Canonical URL of your site',
            required: true,
            example: 'http://localhost:3000',
            category: 'Authentication',
            service: 'NextAuth.js',
            setupInstructions: 'Set to your domain URL. Use http://localhost:3000 for development.',
            notes: ['Must match your actual domain', 'Include protocol (http/https)']
          }
        ]
      
      default:
        return []
    }
  }

  private static getDatabaseEnvVars(database: string): EnvVarDoc[] {
    switch (database) {
      case 'supabase':
        return [
          {
            key: 'DATABASE_URL',
            description: 'PostgreSQL connection string for Supabase',
            required: true,
            example: 'postgresql://postgres:password@db.project.supabase.co:5432/postgres',
            category: 'Database',
            service: 'Supabase',
            setupInstructions: '1. Go to Supabase project Settings → Database\n2. Copy the connection string\n3. Replace [YOUR-PASSWORD] with your database password',
            notes: ['Contains sensitive credentials', 'Use connection pooling for production']
          }
        ]
      
      case 'planetscale':
        return [
          {
            key: 'DATABASE_URL',
            description: 'MySQL connection string for PlanetScale',
            required: true,
            example: 'mysql://username:password@host:3306/database?sslaccept=strict',
            category: 'Database',
            service: 'PlanetScale',
            setupInstructions: '1. Create a PlanetScale database\n2. Create a connection string\n3. Copy the connection URL',
            notes: ['SSL is required', 'Use different branches for development/production']
          }
        ]
      
      case 'neon':
        return [
          {
            key: 'DATABASE_URL',
            description: 'PostgreSQL connection string for Neon',
            required: true,
            example: 'postgresql://user:password@host.neon.tech/dbname?sslmode=require',
            category: 'Database',
            service: 'Neon',
            setupInstructions: '1. Create a Neon database at neon.tech\n2. Copy the connection string from the dashboard',
            notes: ['SSL is required', 'Supports connection pooling']
          }
        ]
      
      default:
        return []
    }
  }

  private static getPaymentEnvVars(payments: string): EnvVarDoc[] {
    switch (payments) {
      case 'stripe':
        return [
          {
            key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
            description: 'Stripe publishable key for client-side operations',
            required: true,
            example: 'pk_test_...',
            category: 'Payments',
            service: 'Stripe',
            setupInstructions: '1. Create a Stripe account at stripe.com\n2. Go to Developers → API keys\n3. Copy the publishable key',
            notes: ['Safe to expose in client-side code', 'Use test keys for development']
          },
          {
            key: 'STRIPE_SECRET_KEY',
            description: 'Stripe secret key for server-side operations',
            required: true,
            example: 'sk_test_...',
            category: 'Payments',
            service: 'Stripe',
            setupInstructions: '1. Go to Stripe dashboard → Developers → API keys\n2. Copy the secret key',
            notes: ['Keep this secret and secure', 'Never expose in client-side code']
          },
          {
            key: 'STRIPE_WEBHOOK_SECRET',
            description: 'Stripe webhook endpoint secret for verifying webhook signatures',
            required: true,
            example: 'whsec_...',
            category: 'Payments',
            service: 'Stripe',
            setupInstructions: '1. Go to Stripe dashboard → Developers → Webhooks\n2. Create a webhook endpoint\n3. Copy the webhook secret',
            notes: ['Required for webhook security', 'Different for each webhook endpoint']
          }
        ]
      
      case 'paddle':
        return [
          {
            key: 'PADDLE_VENDOR_ID',
            description: 'Paddle vendor ID',
            required: true,
            example: '12345',
            category: 'Payments',
            service: 'Paddle',
            setupInstructions: '1. Create a Paddle account\n2. Find your vendor ID in the dashboard',
            notes: ['Safe to expose in client-side code']
          },
          {
            key: 'PADDLE_API_KEY',
            description: 'Paddle API key for server-side operations',
            required: true,
            example: 'your-api-key',
            category: 'Payments',
            service: 'Paddle',
            setupInstructions: '1. Go to Paddle dashboard → Developer Tools → Authentication\n2. Generate an API key',
            notes: ['Keep this secret and secure']
          }
        ]
      
      default:
        return []
    }
  }

  private static getAnalyticsEnvVars(analytics: string): EnvVarDoc[] {
    switch (analytics) {
      case 'posthog':
        return [
          {
            key: 'NEXT_PUBLIC_POSTHOG_KEY',
            description: 'PostHog project API key',
            required: true,
            example: 'phc_...',
            category: 'Analytics',
            service: 'PostHog',
            setupInstructions: '1. Create a PostHog project\n2. Copy the project API key from settings',
            notes: ['Safe to expose in client-side code']
          },
          {
            key: 'NEXT_PUBLIC_POSTHOG_HOST',
            description: 'PostHog instance URL',
            required: false,
            defaultValue: 'https://app.posthog.com',
            example: 'https://app.posthog.com',
            category: 'Analytics',
            service: 'PostHog',
            setupInstructions: 'Use default value unless using self-hosted PostHog',
            notes: ['Use custom URL for self-hosted instances']
          }
        ]
      
      case 'plausible':
        return [
          {
            key: 'NEXT_PUBLIC_PLAUSIBLE_DOMAIN',
            description: 'Domain name registered in Plausible',
            required: true,
            example: 'yourdomain.com',
            category: 'Analytics',
            service: 'Plausible',
            setupInstructions: '1. Add your domain to Plausible\n2. Use the exact domain name',
            notes: ['Must match the domain in your Plausible dashboard']
          }
        ]
      
      default:
        return []
    }
  }

  private static getEmailEnvVars(email: string): EnvVarDoc[] {
    switch (email) {
      case 'resend':
        return [
          {
            key: 'RESEND_API_KEY',
            description: 'Resend API key for sending emails',
            required: true,
            example: 're_...',
            category: 'Email',
            service: 'Resend',
            setupInstructions: '1. Create a Resend account\n2. Generate an API key in the dashboard',
            notes: ['Keep this secret and secure']
          }
        ]
      
      case 'postmark':
        return [
          {
            key: 'POSTMARK_SERVER_TOKEN',
            description: 'Postmark server token for sending emails',
            required: true,
            example: 'your-server-token',
            category: 'Email',
            service: 'Postmark',
            setupInstructions: '1. Create a Postmark server\n2. Copy the server token',
            notes: ['Keep this secret and secure']
          }
        ]
      
      case 'sendgrid':
        return [
          {
            key: 'SENDGRID_API_KEY',
            description: 'SendGrid API key for sending emails',
            required: true,
            example: 'SG...',
            category: 'Email',
            service: 'SendGrid',
            setupInstructions: '1. Create a SendGrid account\n2. Generate an API key with mail send permissions',
            notes: ['Keep this secret and secure']
          }
        ]
      
      default:
        return []
    }
  }

  private static getMonitoringEnvVars(monitoring: string): EnvVarDoc[] {
    switch (monitoring) {
      case 'sentry':
        return [
          {
            key: 'NEXT_PUBLIC_SENTRY_DSN',
            description: 'Sentry Data Source Name for error tracking',
            required: true,
            example: 'https://...@sentry.io/...',
            category: 'Monitoring',
            service: 'Sentry',
            setupInstructions: '1. Create a Sentry project\n2. Copy the DSN from project settings',
            notes: ['Safe to expose in client-side code']
          },
          {
            key: 'SENTRY_AUTH_TOKEN',
            description: 'Sentry authentication token for releases',
            required: false,
            example: 'your-auth-token',
            category: 'Monitoring',
            service: 'Sentry',
            setupInstructions: '1. Go to Sentry Settings → Auth Tokens\n2. Create a token with releases scope',
            notes: ['Optional - used for release tracking']
          }
        ]
      
      default:
        return []
    }
  }

  // Documentation generation methods

  private static generateQuickReference(envVars: EnvVarDoc[]): string {
    const requiredVars = envVars.filter(v => v.required)
    const optionalVars = envVars.filter(v => !v.required)
    
    let content = '## Quick Reference\n\n'
    
    if (requiredVars.length > 0) {
      content += '### Required Variables\n\n'
      content += 'These variables must be set for your application to work:\n\n'
      
      for (const envVar of requiredVars) {
        content += `- **${envVar.key}** - ${envVar.description}\n`
      }
      content += '\n'
    }
    
    if (optionalVars.length > 0) {
      content += '### Optional Variables\n\n'
      content += 'These variables have default values or are optional:\n\n'
      
      for (const envVar of optionalVars) {
        content += `- **${envVar.key}** - ${envVar.description}`
        if (envVar.defaultValue) {
          content += ` (default: \`${envVar.defaultValue}\`)`
        }
        content += '\n'
      }
      content += '\n'
    }
    
    return content
  }

  private static generateServiceGroupedDocs(envVars: EnvVarDoc[], options: EnvDocsOptions): string {
    const groupedVars = this.groupVarsByService(envVars)
    let content = '## Detailed Configuration\n\n'
    
    for (const [service, vars] of Object.entries(groupedVars)) {
      content += `### ${service}\n\n`
      
      for (const envVar of vars) {
        content += this.generateVarDocumentation(envVar, options)
      }
    }
    
    return content
  }

  private static generateAlphabeticalDocs(envVars: EnvVarDoc[], options: EnvDocsOptions): string {
    const sortedVars = [...envVars].sort((a, b) => a.key.localeCompare(b.key))
    let content = '## Environment Variables\n\n'
    
    for (const envVar of sortedVars) {
      content += this.generateVarDocumentation(envVar, options)
    }
    
    return content
  }

  private static generateVarDocumentation(envVar: EnvVarDoc, options: EnvDocsOptions): string {
    let content = `#### ${envVar.key}\n\n`
    content += `**Description:** ${envVar.description}\n\n`
    content += `**Required:** ${envVar.required ? 'Yes' : 'No'}\n\n`
    content += `**Service:** ${envVar.service}\n\n`
    
    if (options.includeExamples !== false) {
      content += `**Example:** \`${envVar.example}\`\n\n`
    }
    
    if (envVar.defaultValue) {
      content += `**Default Value:** \`${envVar.defaultValue}\`\n\n`
    }
    
    if (options.includeSetupInstructions !== false) {
      content += `**Setup Instructions:**\n${envVar.setupInstructions}\n\n`
    }
    
    if (envVar.notes && envVar.notes.length > 0) {
      content += `**Notes:**\n`
      for (const note of envVar.notes) {
        content += `- ${note}\n`
      }
      content += '\n'
    }
    
    content += '---\n\n'
    
    return content
  }

  private static generateSetupChecklist(envVars: EnvVarDoc[]): string {
    const requiredVars = envVars.filter(v => v.required)
    
    let content = '## Setup Checklist\n\n'
    content += 'Use this checklist to ensure all required environment variables are configured:\n\n'
    
    for (const envVar of requiredVars) {
      content += `- [ ] **${envVar.key}** - ${envVar.service}\n`
    }
    
    content += '\n### Verification\n\n'
    content += 'After setting up all variables:\n\n'
    content += '1. Copy `.env.example` to `.env.local`\n'
    content += '2. Fill in all required values\n'
    content += '3. Run `npm run dev` to test your configuration\n'
    content += '4. Check the console for any configuration errors\n\n'
    
    return content
  }

  private static generateTroubleshooting(): string {
    return `## Troubleshooting

### Common Issues

**Environment variables not loading**
- Ensure your \`.env.local\` file is in the project root
- Restart your development server after changing environment variables
- Check that variable names are spelled correctly (case-sensitive)

**"Invalid API key" errors**
- Verify you're using the correct API key for your environment (test vs production)
- Check that the API key hasn't expired or been revoked
- Ensure there are no extra spaces or characters in the key

**Database connection fails**
- Verify your DATABASE_URL is correct and accessible
- Check that your database is running and accepting connections
- Ensure your IP address is whitelisted (for cloud databases)

**Webhook verification fails**
- Verify your webhook secret matches the one in your service dashboard
- Check that your webhook endpoint is accessible from the internet
- Ensure you're using the correct webhook secret for your environment

### Getting Help

If you're still having issues:

1. Check the service documentation for your specific technology
2. Verify your account status and billing information
3. Test your API keys using the service's testing tools
4. Contact support for the specific service having issues

### Security Best Practices

- Never commit \`.env.local\` to version control
- Use different API keys for development and production
- Regularly rotate your API keys and secrets
- Use environment-specific configurations
- Monitor your API usage and set up alerts for unusual activity
`
  }

  private static groupVarsByService(envVars: EnvVarDoc[]): Record<string, EnvVarDoc[]> {
    return envVars.reduce((groups, envVar) => {
      if (!groups[envVar.service]) {
        groups[envVar.service] = []
      }
      groups[envVar.service].push(envVar)
      return groups
    }, {} as Record<string, EnvVarDoc[]>)
  }
}