import { TechSelections, GeneratedProject, Template } from './types/template'

export interface ReadmeSection {
  title: string
  content: string
  order: number
}

export interface SetupGuideOptions {
  includeQuickStart?: boolean
  includeDeployment?: boolean
  includeTroubleshooting?: boolean
  includeContributing?: boolean
  customSections?: ReadmeSection[]
}

export interface DeploymentGuide {
  platform: string
  steps: string[]
  envVars: string[]
  notes: string[]
}

export interface TroubleshootingItem {
  issue: string
  solution: string
  category: 'installation' | 'configuration' | 'runtime' | 'deployment'
}

/**
 * Service for generating comprehensive README and setup guides
 */
export class ReadmeGenerator {
  /**
   * Generate a comprehensive README for the project
   */
  static generateReadme(
    project: GeneratedProject,
    options: SetupGuideOptions = {}
  ): string {
    const sections: ReadmeSection[] = []

    // Header section
    sections.push(this.generateHeaderSection(project))

    // Quick start section
    if (options.includeQuickStart !== false) {
      sections.push(this.generateQuickStartSection(project))
    }

    // Technology stack section
    sections.push(this.generateTechStackSection(project.selections))

    // Prerequisites section
    sections.push(this.generatePrerequisitesSection(project.selections))

    // Installation section
    sections.push(this.generateInstallationSection(project))

    // Configuration section
    sections.push(this.generateConfigurationSection(project))

    // Development section
    sections.push(this.generateDevelopmentSection(project.selections))

    // Deployment section
    if (options.includeDeployment !== false) {
      sections.push(this.generateDeploymentSection(project.selections))
    }

    // Troubleshooting section
    if (options.includeTroubleshooting !== false) {
      sections.push(this.generateTroubleshootingSection(project.selections))
    }

    // Contributing section
    if (options.includeContributing) {
      sections.push(this.generateContributingSection())
    }

    // Custom sections
    if (options.customSections) {
      sections.push(...options.customSections)
    }

    // License section
    sections.push(this.generateLicenseSection())

    // Sort sections by order and combine
    return sections
      .sort((a, b) => a.order - b.order)
      .map(section => section.content)
      .join('\n\n')
  }

  /**
   * Generate detailed setup instructions
   */
  static generateSetupInstructions(
    project: GeneratedProject,
    templates: Template[]
  ): string {
    let guide = '# Detailed Setup Instructions\n\n'
    
    guide += 'This guide provides step-by-step instructions for setting up your generated project.\n\n'

    // Environment setup
    guide += this.generateEnvironmentSetup(project.selections)

    // Service-specific setup
    guide += this.generateServiceSetup(project.selections, templates)

    // Database setup
    if (project.selections.database !== 'none') {
      guide += this.generateDatabaseSetup(project.selections.database)
    }

    // Authentication setup
    if (project.selections.authentication !== 'none') {
      guide += this.generateAuthSetup(project.selections.authentication)
    }

    // Payment setup
    if (project.selections.payments !== 'none') {
      guide += this.generatePaymentSetup(project.selections.payments)
    }

    // Deployment setup
    guide += this.generateDeploymentInstructions(project.selections.hosting)

    return guide
  }

  /**
   * Generate deployment guides for different platforms
   */
  static generateDeploymentGuides(hosting: string): DeploymentGuide[] {
    const guides: DeploymentGuide[] = []

    switch (hosting) {
      case 'vercel':
        guides.push(this.generateVercelGuide())
        break
      case 'netlify':
        guides.push(this.generateNetlifyGuide())
        break
      case 'railway':
        guides.push(this.generateRailwayGuide())
        break
      case 'render':
        guides.push(this.generateRenderGuide())
        break
    }

    return guides
  }

  /**
   * Generate troubleshooting guide
   */
  static generateTroubleshootingGuide(selections: TechSelections): TroubleshootingItem[] {
    const items: TroubleshootingItem[] = []

    // Common issues
    items.push(
      {
        issue: 'npm install fails with dependency conflicts',
        solution: 'Try running `npm install --legacy-peer-deps` or delete node_modules and package-lock.json, then run `npm install` again.',
        category: 'installation'
      },
      {
        issue: 'Environment variables not loading',
        solution: 'Ensure your .env.local file is in the project root and restart your development server.',
        category: 'configuration'
      },
      {
        issue: 'TypeScript compilation errors',
        solution: 'Run `npm run build` to see detailed error messages. Check that all required dependencies are installed.',
        category: 'runtime'
      }
    )

    // Technology-specific issues
    if (selections.authentication === 'clerk') {
      items.push({
        issue: 'Clerk authentication not working',
        solution: 'Verify your NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY are set correctly. Check that your domain is configured in the Clerk dashboard.',
        category: 'configuration'
      })
    }

    if (selections.database === 'supabase') {
      items.push({
        issue: 'Supabase connection fails',
        solution: 'Check your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. Ensure your database is running and accessible.',
        category: 'configuration'
      })
    }

    if (selections.payments === 'stripe') {
      items.push({
        issue: 'Stripe webhooks not working',
        solution: 'Verify your webhook endpoint URL is correct and your STRIPE_WEBHOOK_SECRET matches the webhook secret in your Stripe dashboard.',
        category: 'configuration'
      })
    }

    return items
  }

  // Private helper methods

  private static generateHeaderSection(project: GeneratedProject): ReadmeSection {
    const content = `# ${project.name}

A modern SaaS application built with the Stack Navigator.

## Overview

This project was generated using Stack Navigator, an AI-powered tool that creates production-ready SaaS applications with your ideal technology stack.

**Generated on:** ${project.metadata.generatedAt.toLocaleDateString()}  
**Estimated setup time:** ${project.metadata.estimatedSetupTime} minutes

## Features

- 🚀 **Modern Stack**: Built with the latest technologies
- 🔐 **Authentication**: User management and security
- 💾 **Database**: Scalable data storage
- 💳 **Payments**: Subscription and billing integration
- 📊 **Analytics**: User behavior tracking
- 📧 **Email**: Transactional email support
- 🔍 **Monitoring**: Error tracking and performance monitoring
- 🎨 **UI Components**: Beautiful, accessible interface`

    return { title: 'Header', content, order: 1 }
  }

  private static generateQuickStartSection(project: GeneratedProject): ReadmeSection {
    const content = `## Quick Start

Get your application running in under 5 minutes:

\`\`\`bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys (see Configuration section)

# 3. Start the development server
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to see your application.

> **Need help?** Check the [Configuration](#configuration) section for detailed setup instructions.`

    return { title: 'Quick Start', content, order: 2 }
  }

  private static generateTechStackSection(selections: TechSelections): ReadmeSection {
    const technologies = []

    if (selections.framework) {
      technologies.push(`**Framework:** ${this.getTechDisplayName(selections.framework)}`)
    }
    if (selections.authentication !== 'none') {
      technologies.push(`**Authentication:** ${this.getTechDisplayName(selections.authentication)}`)
    }
    if (selections.database !== 'none') {
      technologies.push(`**Database:** ${this.getTechDisplayName(selections.database)}`)
    }
    if (selections.payments !== 'none') {
      technologies.push(`**Payments:** ${this.getTechDisplayName(selections.payments)}`)
    }
    if (selections.hosting) {
      technologies.push(`**Hosting:** ${this.getTechDisplayName(selections.hosting)}`)
    }
    if (selections.analytics !== 'none') {
      technologies.push(`**Analytics:** ${this.getTechDisplayName(selections.analytics)}`)
    }
    if (selections.email !== 'none') {
      technologies.push(`**Email:** ${this.getTechDisplayName(selections.email)}`)
    }
    if (selections.monitoring !== 'none') {
      technologies.push(`**Monitoring:** ${this.getTechDisplayName(selections.monitoring)}`)
    }

    const content = `## Technology Stack

This project uses the following technologies:

${technologies.join('\n')}

Each technology was selected based on your project requirements and provides the best balance of developer experience, scalability, and cost-effectiveness.`

    return { title: 'Technology Stack', content, order: 3 }
  }

  private static generatePrerequisitesSection(selections: TechSelections): ReadmeSection {
    const prerequisites = [
      '- **Node.js** 18+ ([Download](https://nodejs.org/))',
      '- **npm** or **yarn** package manager',
      '- **Git** for version control'
    ]

    // Add technology-specific prerequisites
    if (selections.database === 'supabase') {
      prerequisites.push('- **Supabase account** ([Sign up](https://supabase.com/))')
    }
    if (selections.authentication === 'clerk') {
      prerequisites.push('- **Clerk account** ([Sign up](https://clerk.com/))')
    }
    if (selections.payments === 'stripe') {
      prerequisites.push('- **Stripe account** ([Sign up](https://stripe.com/))')
    }

    const content = `## Prerequisites

Before you begin, ensure you have the following installed and set up:

${prerequisites.join('\n')}

> **Tip:** Most services offer generous free tiers perfect for development and testing.`

    return { title: 'Prerequisites', content, order: 4 }
  }

  private static generateInstallationSection(project: GeneratedProject): ReadmeSection {
    const content = `## Installation

### 1. Clone or Extract the Project

If you downloaded a ZIP file, extract it to your desired location. If using Git:

\`\`\`bash
git clone <your-repository-url>
cd ${project.name}
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
\`\`\`

If you encounter dependency conflicts, try:

\`\`\`bash
npm install --legacy-peer-deps
\`\`\`

### 3. Verify Installation

\`\`\`bash
npm run build
\`\`\`

If the build succeeds, your installation is complete!`

    return { title: 'Installation', content, order: 5 }
  }

  private static generateConfigurationSection(project: GeneratedProject): ReadmeSection {
    let content = `## Configuration

### Environment Variables

Copy the environment template and fill in your API keys:

\`\`\`bash
cp .env.example .env.local
\`\`\`

Edit \`.env.local\` with your actual values. See \`ENV_VARIABLES.md\` for detailed descriptions of each variable.

### Required Configuration

The following services require setup before your application will work:`

    const selections = project.selections

    if (selections.authentication !== 'none') {
      content += `\n\n#### ${this.getTechDisplayName(selections.authentication)} (Authentication)\n`
      content += this.getAuthConfigInstructions(selections.authentication)
    }

    if (selections.database !== 'none') {
      content += `\n\n#### ${this.getTechDisplayName(selections.database)} (Database)\n`
      content += this.getDatabaseConfigInstructions(selections.database)
    }

    if (selections.payments !== 'none') {
      content += `\n\n#### ${this.getTechDisplayName(selections.payments)} (Payments)\n`
      content += this.getPaymentConfigInstructions(selections.payments)
    }

    content += `\n\n> **Security Note:** Never commit your \`.env.local\` file to version control. It's already included in \`.gitignore\`.`

    return { title: 'Configuration', content, order: 6 }
  }

  private static generateDevelopmentSection(selections: TechSelections): ReadmeSection {
    const content = `## Development

### Available Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run start\` - Start production server
- \`npm run lint\` - Run ESLint
- \`npm run test\` - Run tests (if configured)

### Development Workflow

1. **Start the development server:**
   \`\`\`bash
   npm run dev
   \`\`\`

2. **Make your changes** - The server will automatically reload

3. **Test your changes** - Check both functionality and console for errors

4. **Build for production** to verify everything works:
   \`\`\`bash
   npm run build
   \`\`\`

### Project Structure

\`\`\`
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   ├── globals.css     # Global styles
│   └── layout.tsx      # Root layout
├── components/         # React components
├── lib/               # Utility functions
├── public/            # Static assets
└── .env.local         # Environment variables
\`\`\`

### Adding Features

This project is designed to be easily extensible. Key areas for customization:

- **Components**: Add new UI components in \`components/\`
- **API Routes**: Add new endpoints in \`app/api/\`
- **Database**: Modify schema and queries in \`lib/\`
- **Styling**: Update styles in component files or \`globals.css\``

    return { title: 'Development', content, order: 7 }
  }

  private static generateDeploymentSection(selections: TechSelections): ReadmeSection {
    const platform = selections.hosting
    let content = `## Deployment

### ${this.getTechDisplayName(platform)}

This project is optimized for deployment on ${this.getTechDisplayName(platform)}.`

    switch (platform) {
      case 'vercel':
        content += `

#### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=<your-repo-url>)

#### Manual Deployment

1. Install Vercel CLI: \`npm i -g vercel\`
2. Run \`vercel\` in your project directory
3. Follow the prompts to deploy

#### Environment Variables

Add your environment variables in the Vercel dashboard under Settings → Environment Variables.`
        break

      case 'netlify':
        content += `

#### Quick Deploy

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=<your-repo-url>)

#### Manual Deployment

1. Build your project: \`npm run build\`
2. Deploy the \`out\` directory to Netlify
3. Configure environment variables in Netlify dashboard`
        break

      case 'railway':
        content += `

#### Deploy to Railway

1. Connect your GitHub repository to Railway
2. Configure environment variables
3. Deploy automatically on push`
        break

      case 'render':
        content += `

#### Deploy to Render

1. Connect your GitHub repository to Render
2. Configure build and start commands
3. Set environment variables`
        break
    }

    content += `

### Pre-deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations run (if applicable)
- [ ] Build succeeds locally (\`npm run build\`)
- [ ] All external services configured and accessible
- [ ] Domain configured (if using custom domain)`

    return { title: 'Deployment', content, order: 8 }
  }

  private static generateTroubleshootingSection(selections: TechSelections): ReadmeSection {
    const issues = this.generateTroubleshootingGuide(selections)
    
    let content = `## Troubleshooting

### Common Issues

`

    const groupedIssues = issues.reduce((groups, item) => {
      if (!groups[item.category]) groups[item.category] = []
      groups[item.category].push(item)
      return groups
    }, {} as Record<string, TroubleshootingItem[]>)

    for (const [category, categoryIssues] of Object.entries(groupedIssues)) {
      content += `#### ${this.capitalizeFirst(category)}\n\n`
      
      for (const issue of categoryIssues) {
        content += `**${issue.issue}**\n\n${issue.solution}\n\n`
      }
    }

    content += `### Getting Help

If you're still having issues:

1. Check the [GitHub Issues](https://github.com/your-repo/issues) for similar problems
2. Search the documentation for your specific technologies
3. Join our [Discord community](https://discord.gg/your-server) for help
4. Create a new issue with detailed information about your problem

### Useful Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Stack Navigator Documentation](https://stacknavigator.com/docs)
- [Troubleshooting Guide](https://stacknavigator.com/troubleshooting)`

    return { title: 'Troubleshooting', content, order: 9 }
  }

  private static generateContributingSection(): ReadmeSection {
    const content = `## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Start for Contributors

1. Fork the repository
2. Create a feature branch: \`git checkout -b feature/amazing-feature\`
3. Make your changes
4. Run tests: \`npm test\`
5. Commit your changes: \`git commit -m 'Add amazing feature'\`
6. Push to the branch: \`git push origin feature/amazing-feature\`
7. Open a Pull Request

### Development Setup

\`\`\`bash
git clone https://github.com/your-username/your-repo.git
cd your-repo
npm install
cp .env.example .env.local
# Configure your environment variables
npm run dev
\`\`\``

    return { title: 'Contributing', content, order: 10 }
  }

  private static generateLicenseSection(): ReadmeSection {
    const content = `## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Generated with ❤️ by [Stack Navigator](https://stacknavigator.com)**

Need help? Check out our [documentation](https://stacknavigator.com/docs) or join our [community](https://discord.gg/stacknavigator).`

    return { title: 'License', content, order: 11 }
  }

  // Service-specific configuration instructions

  private static getAuthConfigInstructions(auth: string): string {
    switch (auth) {
      case 'clerk':
        return `1. Create a Clerk application at [clerk.com](https://clerk.com)
2. Copy your publishable key to \`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY\`
3. Copy your secret key to \`CLERK_SECRET_KEY\`
4. Configure your sign-in/sign-up pages in the Clerk dashboard`

      case 'supabase-auth':
        return `1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Go to Settings → API
3. Copy your project URL to \`NEXT_PUBLIC_SUPABASE_URL\`
4. Copy your anon public key to \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`
5. Copy your service role key to \`SUPABASE_SERVICE_ROLE_KEY\``

      case 'nextauth':
        return `1. Set \`NEXTAUTH_SECRET\` to a random string (use: \`openssl rand -base64 32\`)
2. Set \`NEXTAUTH_URL\` to your domain (http://localhost:3000 for development)
3. Configure your OAuth providers in \`app/api/auth/[...nextauth]/route.ts\``

      default:
        return 'No additional configuration required.'
    }
  }

  private static getDatabaseConfigInstructions(database: string): string {
    switch (database) {
      case 'supabase':
        return `1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Go to Settings → Database
3. Copy your connection string to \`DATABASE_URL\`
4. Run migrations: \`npm run db:migrate\` (if available)`

      case 'planetscale':
        return `1. Create a PlanetScale database at [planetscale.com](https://planetscale.com)
2. Create a connection string
3. Copy it to \`DATABASE_URL\`
4. Run migrations: \`npx prisma db push\``

      case 'neon':
        return `1. Create a Neon database at [neon.tech](https://neon.tech)
2. Copy your connection string to \`DATABASE_URL\`
3. Run migrations if available`

      default:
        return 'No additional configuration required.'
    }
  }

  private static getPaymentConfigInstructions(payments: string): string {
    switch (payments) {
      case 'stripe':
        return `1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Go to Developers → API keys
3. Copy your publishable key to \`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY\`
4. Copy your secret key to \`STRIPE_SECRET_KEY\`
5. Set up webhooks and copy the webhook secret to \`STRIPE_WEBHOOK_SECRET\``

      case 'paddle':
        return `1. Create a Paddle account at [paddle.com](https://paddle.com)
2. Go to Developer Tools → Authentication
3. Copy your vendor ID to \`PADDLE_VENDOR_ID\`
4. Copy your API key to \`PADDLE_API_KEY\`
5. Set up webhooks and configure the webhook URL`

      default:
        return 'No additional configuration required.'
    }
  }

  // Helper methods for generating specific sections

  private static generateEnvironmentSetup(selections: TechSelections): string {
    return `## Environment Setup

### 1. Copy Environment Template

\`\`\`bash
cp .env.example .env.local
\`\`\`

### 2. Configure Required Variables

Edit \`.env.local\` and fill in the following required variables:

${this.getRequiredEnvVars(selections).map(env => `- \`${env}\``).join('\n')}

See the sections below for instructions on obtaining these values.

`
  }

  private static generateServiceSetup(selections: TechSelections, templates: Template[]): string {
    let setup = '## Service Configuration\n\n'
    
    // Add setup instructions for each selected service
    const services = [
      { key: 'authentication', value: selections.authentication },
      { key: 'database', value: selections.database },
      { key: 'payments', value: selections.payments },
      { key: 'analytics', value: selections.analytics },
      { key: 'email', value: selections.email },
      { key: 'monitoring', value: selections.monitoring }
    ]

    for (const service of services) {
      if (service.value !== 'none') {
        setup += `### ${this.getTechDisplayName(service.value)}\n\n`
        setup += this.getServiceSetupInstructions(service.key, service.value)
        setup += '\n\n'
      }
    }

    return setup
  }

  private static generateDatabaseSetup(database: string): string {
    return `## Database Setup

### ${this.getTechDisplayName(database)}

${this.getDatabaseConfigInstructions(database)}

### Running Migrations

If your project includes database migrations:

\`\`\`bash
# Run pending migrations
npm run db:migrate

# Reset database (development only)
npm run db:reset
\`\`\`

`
  }

  private static generateAuthSetup(auth: string): string {
    return `## Authentication Setup

### ${this.getTechDisplayName(auth)}

${this.getAuthConfigInstructions(auth)}

### Testing Authentication

1. Start your development server: \`npm run dev\`
2. Navigate to the sign-up page
3. Create a test account
4. Verify the authentication flow works

`
  }

  private static generatePaymentSetup(payments: string): string {
    return `## Payment Setup

### ${this.getTechDisplayName(payments)}

${this.getPaymentConfigInstructions(payments)}

### Testing Payments

Use test card numbers for development:
- Success: \`4242 4242 4242 4242\`
- Decline: \`4000 0000 0000 0002\`

`
  }

  private static generateDeploymentInstructions(hosting: string): string {
    const guides = this.generateDeploymentGuides(hosting)
    let instructions = `## Deployment Instructions\n\n`
    
    for (const guide of guides) {
      instructions += `### ${guide.platform}\n\n`
      instructions += guide.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')
      instructions += '\n\n'
      
      if (guide.envVars.length > 0) {
        instructions += '**Required Environment Variables:**\n'
        instructions += guide.envVars.map(env => `- ${env}`).join('\n')
        instructions += '\n\n'
      }
      
      if (guide.notes.length > 0) {
        instructions += '**Notes:**\n'
        instructions += guide.notes.map(note => `- ${note}`).join('\n')
        instructions += '\n\n'
      }
    }

    return instructions
  }

  // Platform-specific deployment guides

  private static generateVercelGuide(): DeploymentGuide {
    return {
      platform: 'Vercel',
      steps: [
        'Install Vercel CLI: `npm i -g vercel`',
        'Run `vercel` in your project directory',
        'Follow the prompts to link your project',
        'Configure environment variables in the Vercel dashboard',
        'Deploy with `vercel --prod`'
      ],
      envVars: ['All environment variables from .env.local'],
      notes: [
        'Vercel automatically deploys on git push',
        'Use preview deployments for testing',
        'Configure custom domains in the dashboard'
      ]
    }
  }

  private static generateNetlifyGuide(): DeploymentGuide {
    return {
      platform: 'Netlify',
      steps: [
        'Build your project: `npm run build`',
        'Install Netlify CLI: `npm i -g netlify-cli`',
        'Run `netlify deploy` for preview',
        'Run `netlify deploy --prod` for production',
        'Configure environment variables in Netlify dashboard'
      ],
      envVars: ['All environment variables from .env.local'],
      notes: [
        'Netlify supports automatic deployments from Git',
        'Use branch deploys for testing',
        'Configure redirects in netlify.toml if needed'
      ]
    }
  }

  private static generateRailwayGuide(): DeploymentGuide {
    return {
      platform: 'Railway',
      steps: [
        'Connect your GitHub repository to Railway',
        'Configure build and start commands',
        'Set environment variables in Railway dashboard',
        'Deploy automatically on git push'
      ],
      envVars: ['All environment variables from .env.local'],
      notes: [
        'Railway provides automatic HTTPS',
        'Database services can be added easily',
        'Supports custom domains'
      ]
    }
  }

  private static generateRenderGuide(): DeploymentGuide {
    return {
      platform: 'Render',
      steps: [
        'Connect your GitHub repository to Render',
        'Configure build command: `npm run build`',
        'Configure start command: `npm start`',
        'Set environment variables in Render dashboard',
        'Deploy automatically on git push'
      ],
      envVars: ['All environment variables from .env.local'],
      notes: [
        'Render provides free SSL certificates',
        'Supports custom domains',
        'Database services available'
      ]
    }
  }

  // Utility methods

  private static getTechDisplayName(tech: string): string {
    const displayNames: Record<string, string> = {
      'nextjs': 'Next.js',
      'clerk': 'Clerk',
      'supabase': 'Supabase',
      'supabase-auth': 'Supabase Auth',
      'nextauth': 'NextAuth.js',
      'planetscale': 'PlanetScale',
      'neon': 'Neon',
      'stripe': 'Stripe',
      'paddle': 'Paddle',
      'vercel': 'Vercel',
      'netlify': 'Netlify',
      'railway': 'Railway',
      'render': 'Render',
      'posthog': 'PostHog',
      'plausible': 'Plausible',
      'ga4': 'Google Analytics 4',
      'resend': 'Resend',
      'postmark': 'Postmark',
      'sendgrid': 'SendGrid',
      'sentry': 'Sentry',
      'bugsnag': 'Bugsnag',
      'shadcn': 'shadcn/ui'
    }

    return displayNames[tech] || tech
  }

  private static getRequiredEnvVars(selections: TechSelections): string[] {
    const envVars: string[] = []

    if (selections.authentication === 'clerk') {
      envVars.push('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY')
    }
    if (selections.authentication === 'supabase-auth') {
      envVars.push('NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY')
    }
    if (selections.authentication === 'nextauth') {
      envVars.push('NEXTAUTH_SECRET', 'NEXTAUTH_URL')
    }
    if (selections.database === 'supabase') {
      envVars.push('DATABASE_URL')
    }
    if (selections.payments === 'stripe') {
      envVars.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'STRIPE_SECRET_KEY')
    }

    return envVars
  }

  private static getServiceSetupInstructions(serviceType: string, serviceName: string): string {
    // This would contain detailed setup instructions for each service
    // For brevity, returning a placeholder
    return `Follow the ${this.getTechDisplayName(serviceName)} documentation to set up your ${serviceType} service.`
  }

  private static capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }
}