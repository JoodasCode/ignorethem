/**
 * Template system types and interfaces for Stack Navigator
 */

export interface TemplateMetadata {
  id: string
  name: string
  description: string
  category: 'base' | 'auth' | 'database' | 'payments' | 'hosting' | 'analytics' | 'email' | 'monitoring' | 'ui'
  version: string
  complexity: 'simple' | 'moderate' | 'complex'
  pricing: 'free' | 'freemium' | 'paid'
  setupTime: number // minutes
  dependencies: string[] // Other template IDs this template depends on
  conflicts: string[] // Template IDs that conflict with this template
  requiredEnvVars: string[]
  optionalEnvVars: string[]
  documentation: string
  tags: string[]
  popularity: number // Usage score for recommendations
  lastUpdated: Date
}

export interface TemplateFile {
  path: string
  content: string
  overwrite?: boolean // Whether to overwrite existing files
  conditions?: string[] // Conditional inclusion based on other selections
  executable?: boolean // Whether file should be executable
}

export interface EnvVariable {
  key: string
  description: string
  required: boolean
  defaultValue?: string
  example?: string
  category: 'auth' | 'database' | 'payments' | 'analytics' | 'email' | 'monitoring' | 'other'
}

export interface SetupInstruction {
  step: number
  title: string
  description: string
  command?: string
  url?: string
  category: 'installation' | 'configuration' | 'deployment' | 'testing'
}

export interface Template {
  metadata: TemplateMetadata
  files: TemplateFile[]
  envVars: EnvVariable[]
  setupInstructions: SetupInstruction[]
  packageDependencies: Record<string, string> // package name -> version
  devDependencies: Record<string, string>
  scripts: Record<string, string> // npm scripts to add
}

export interface TemplateCompatibility {
  templateId: string
  compatibleWith: string[]
  incompatibleWith: string[]
  warnings: string[] // Compatibility warnings
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

export interface TechSelections {
  framework: 'nextjs' | 'remix' | 'sveltekit'
  authentication: 'clerk' | 'supabase-auth' | 'nextauth' | 'none'
  database: 'supabase' | 'planetscale' | 'neon' | 'none'
  hosting: 'vercel' | 'netlify' | 'railway' | 'render'
  payments: 'stripe' | 'paddle' | 'none'
  analytics: 'posthog' | 'plausible' | 'ga4' | 'none'
  email: 'resend' | 'postmark' | 'sendgrid' | 'none'
  monitoring: 'sentry' | 'bugsnag' | 'none'
  ui: 'shadcn' | 'chakra' | 'mantine' | 'none'
}

export interface GeneratedProject {
  name: string
  files: TemplateFile[]
  packageJson: any
  envTemplate: string
  setupGuide: string
  selections: TechSelections
  metadata: {
    generatedAt: Date
    templateVersions: Record<string, string>
    estimatedSetupTime: number
  }
}