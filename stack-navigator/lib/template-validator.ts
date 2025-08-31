import { Template, TemplateCompatibility, ValidationResult, TechSelections } from './types/template'

/**
 * Template validation and compatibility checking system
 */
export class TemplateValidator {
  private compatibilityMatrix: Map<string, TemplateCompatibility> = new Map()

  constructor() {
    this.initializeCompatibilityMatrix()
  }

  /**
   * Validate a single template for correctness
   */
  validateTemplate(template: Template): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []

    // Validate metadata
    if (!template.metadata.id || template.metadata.id.trim() === '') {
      errors.push('Template ID is required')
    }

    if (!template.metadata.name || template.metadata.name.trim() === '') {
      errors.push('Template name is required')
    }

    if (!template.metadata.version || !this.isValidVersion(template.metadata.version)) {
      errors.push('Valid semantic version is required')
    }

    // Validate dependencies exist
    for (const depId of template.metadata.dependencies) {
      if (!this.templateExists(depId)) {
        errors.push(`Dependency template '${depId}' not found`)
      }
    }

    // Validate files
    if (template.files.length === 0) {
      warnings.push('Template has no files')
    }

    for (const file of template.files) {
      if (!file.path || file.path.trim() === '') {
        errors.push('File path is required')
      }

      if (file.path.includes('..')) {
        errors.push(`File path '${file.path}' contains invalid directory traversal`)
      }

      if (!file.content) {
        warnings.push(`File '${file.path}' has empty content`)
      }
    }

    // Validate environment variables
    for (const envVar of template.envVars) {
      if (!envVar.key || !envVar.key.match(/^[A-Z_][A-Z0-9_]*$/)) {
        errors.push(`Invalid environment variable name: '${envVar.key}'`)
      }

      if (envVar.required && !envVar.description) {
        warnings.push(`Required env var '${envVar.key}' should have description`)
      }
    }

    // Validate package dependencies
    for (const [pkg, version] of Object.entries(template.packageDependencies)) {
      if (!this.isValidPackageName(pkg)) {
        errors.push(`Invalid package name: '${pkg}'`)
      }

      if (!this.isValidVersion(version)) {
        warnings.push(`Package '${pkg}' has invalid version: '${version}'`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    }
  }

  /**
   * Validate compatibility between selected templates
   */
  validateSelections(selections: TechSelections): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []

    const selectedTemplates = this.selectionsToTemplateIds(selections)

    // Check for direct conflicts
    for (const templateId of selectedTemplates) {
      const compatibility = this.compatibilityMatrix.get(templateId)
      if (!compatibility) continue

      for (const conflictId of compatibility.incompatibleWith) {
        if (selectedTemplates.includes(conflictId)) {
          errors.push(`${templateId} is incompatible with ${conflictId}`)
        }
      }

      // Add warnings from compatibility matrix
      warnings.push(...compatibility.warnings)
    }

    // Check for missing dependencies
    for (const templateId of selectedTemplates) {
      const template = this.getTemplate(templateId)
      if (!template) continue

      for (const depId of template.metadata.dependencies) {
        if (!selectedTemplates.includes(depId)) {
          errors.push(`${templateId} requires ${depId} but it's not selected`)
        }
      }
    }

    // Suggest complementary templates
    if (selections.authentication !== 'none' && selections.database === 'none') {
      suggestions.push('Consider adding a database for user data storage')
    }

    if (selections.payments !== 'none' && selections.monitoring === 'none') {
      suggestions.push('Consider adding monitoring for payment processing')
    }

    if (selections.database !== 'none' && selections.monitoring === 'none') {
      suggestions.push('Consider adding error monitoring for database operations')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    }
  }

  /**
   * Get recommended templates based on selections
   */
  getRecommendations(selections: TechSelections): string[] {
    const recommendations: string[] = []

    // Base recommendations
    if (selections.framework === 'nextjs') {
      recommendations.push('nextjs-base')
    }

    // UI recommendations
    if (selections.ui === 'none' && selections.framework === 'nextjs') {
      recommendations.push('shadcn-ui')
    }

    // Monitoring recommendations for production setups
    if (selections.hosting !== 'vercel' && selections.monitoring === 'none') {
      recommendations.push('sentry')
    }

    // Email recommendations for auth setups
    if (selections.authentication !== 'none' && selections.email === 'none') {
      recommendations.push('resend')
    }

    return recommendations
  }

  private initializeCompatibilityMatrix(): void {
    // Authentication compatibility
    this.compatibilityMatrix.set('clerk', {
      templateId: 'clerk',
      compatibleWith: ['nextjs-base', 'supabase', 'stripe', 'vercel'],
      incompatibleWith: ['nextauth', 'supabase-auth'],
      warnings: ['Clerk requires organization setup for B2B features']
    })

    this.compatibilityMatrix.set('nextauth', {
      templateId: 'nextauth',
      compatibleWith: ['nextjs-base', 'supabase', 'planetscale', 'stripe'],
      incompatibleWith: ['clerk', 'supabase-auth'],
      warnings: ['NextAuth requires additional setup for organization management']
    })

    this.compatibilityMatrix.set('supabase-auth', {
      templateId: 'supabase-auth',
      compatibleWith: ['nextjs-base', 'supabase'],
      incompatibleWith: ['clerk', 'nextauth', 'planetscale', 'neon'],
      warnings: ['Supabase Auth works best with Supabase database']
    })

    // Database compatibility
    this.compatibilityMatrix.set('supabase', {
      templateId: 'supabase',
      compatibleWith: ['nextjs-base', 'clerk', 'nextauth', 'supabase-auth', 'vercel'],
      incompatibleWith: [],
      warnings: []
    })

    this.compatibilityMatrix.set('planetscale', {
      templateId: 'planetscale',
      compatibleWith: ['nextjs-base', 'clerk', 'nextauth', 'vercel'],
      incompatibleWith: ['supabase-auth'],
      warnings: ['PlanetScale requires Prisma for type safety']
    })

    // Payment compatibility
    this.compatibilityMatrix.set('stripe', {
      templateId: 'stripe',
      compatibleWith: ['nextjs-base', 'clerk', 'nextauth', 'supabase', 'planetscale'],
      incompatibleWith: ['paddle'],
      warnings: ['Stripe webhooks require HTTPS in production']
    })
  }

  private selectionsToTemplateIds(selections: TechSelections): string[] {
    const templateIds: string[] = []

    if (selections.framework !== 'nextjs') {
      templateIds.push(selections.framework)
    } else {
      templateIds.push('nextjs-base')
    }

    if (selections.authentication !== 'none') {
      templateIds.push(selections.authentication)
    }

    if (selections.database !== 'none') {
      templateIds.push(selections.database)
    }

    if (selections.payments !== 'none') {
      templateIds.push(selections.payments)
    }

    if (selections.analytics !== 'none') {
      templateIds.push(selections.analytics)
    }

    if (selections.email !== 'none') {
      templateIds.push(selections.email)
    }

    if (selections.monitoring !== 'none') {
      templateIds.push(selections.monitoring)
    }

    if (selections.ui !== 'none') {
      templateIds.push(selections.ui)
    }

    return templateIds
  }

  private templateExists(templateId: string): boolean {
    // This would check against the actual template registry
    // For now, return true for known template IDs
    const knownTemplates = [
      'nextjs-base', 'clerk', 'nextauth', 'supabase-auth',
      'supabase', 'planetscale', 'neon',
      'stripe', 'paddle',
      'posthog', 'plausible', 'ga4',
      'resend', 'postmark', 'sendgrid',
      'sentry', 'bugsnag',
      'shadcn-ui', 'chakra-ui', 'mantine'
    ]
    return knownTemplates.includes(templateId)
  }

  private getTemplate(templateId: string): Template | null {
    // This would fetch from the template registry
    // For now, return null as this is just validation logic
    return null
  }

  private isValidVersion(version: string): boolean {
    // Basic semantic version validation
    return /^\d+\.\d+\.\d+(-[a-zA-Z0-9-]+)?$/.test(version)
  }

  private isValidPackageName(name: string): boolean {
    // Basic npm package name validation
    return /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(name)
  }
}

export const templateValidator = new TemplateValidator()