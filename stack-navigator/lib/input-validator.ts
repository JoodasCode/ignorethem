import { TechSelections } from './types/template'

/**
 * Input validation and sanitization for code generation
 */
export class InputValidator {
  /**
   * Validate project name
   */
  static validateProjectName(projectName: string): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Check if empty
    if (!projectName || projectName.trim() === '') {
      errors.push('Project name cannot be empty')
    }

    // Check length
    if (projectName.length > 214) {
      errors.push('Project name cannot exceed 214 characters (npm limit)')
    }

    // Check for invalid characters
    if (!/^[a-zA-Z0-9\-_\s]+$/.test(projectName)) {
      errors.push('Project name contains invalid characters. Use only letters, numbers, hyphens, underscores, and spaces')
    }

    // Check for reserved names
    const reservedNames = ['node_modules', 'package', 'npm', 'test', 'src', 'lib', 'bin']
    if (reservedNames.includes(projectName.toLowerCase())) {
      errors.push(`"${projectName}" is a reserved name`)
    }

    // Check for leading/trailing spaces or special chars
    if (projectName !== projectName.trim()) {
      warnings.push('Project name has leading/trailing whitespace')
    }

    // Check for consecutive special characters
    if (/[-_]{2,}/.test(projectName)) {
      warnings.push('Project name has consecutive special characters')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions: []
    }
  }

  /**
   * Sanitize project name
   */
  static sanitizeProjectName(projectName: string): string {
    return projectName
      .trim()
      .replace(/[^a-zA-Z0-9\-_\s]/g, '') // Remove invalid chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/[-_]+/g, '-') // Replace multiple consecutive chars
      .toLowerCase()
      .substring(0, 214) // Limit length
  }

  /**
   * Validate tech selections
   */
  static validateSelections(selections: TechSelections): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []

    // Validate framework
    const validFrameworks = ['nextjs', 'remix', 'sveltekit']
    if (!validFrameworks.includes(selections.framework)) {
      errors.push(`Invalid framework: ${selections.framework}`)
    }

    // Validate authentication
    const validAuth = ['clerk', 'supabase-auth', 'nextauth', 'none']
    if (!validAuth.includes(selections.authentication)) {
      errors.push(`Invalid authentication: ${selections.authentication}`)
    }

    // Validate database
    const validDatabases = ['supabase', 'planetscale', 'neon', 'none']
    if (!validDatabases.includes(selections.database)) {
      errors.push(`Invalid database: ${selections.database}`)
    }

    // Validate hosting
    const validHosting = ['vercel', 'netlify', 'railway', 'render']
    if (!validHosting.includes(selections.hosting)) {
      errors.push(`Invalid hosting: ${selections.hosting}`)
    }

    // Check for logical conflicts
    if (selections.authentication === 'supabase-auth' && selections.database !== 'supabase') {
      warnings.push('Supabase Auth works best with Supabase database')
      suggestions.push('Consider using Supabase database with Supabase Auth')
    }

    if (selections.payments !== 'none' && selections.monitoring === 'none') {
      suggestions.push('Consider adding error monitoring for payment processing')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    }
  }

  /**
   * Validate file paths for security
   */
  static validateFilePath(filePath: string): boolean {
    // Prevent directory traversal
    if (filePath.includes('..')) {
      return false
    }

    // Prevent absolute paths
    if (filePath.startsWith('/')) {
      return false
    }

    // Prevent Windows drive paths
    if (/^[A-Za-z]:/.test(filePath)) {
      return false
    }

    // Check for null bytes
    if (filePath.includes('\0')) {
      return false
    }

    return true
  }

  /**
   * Sanitize file content
   */
  static sanitizeFileContent(content: string): string {
    // Remove null bytes
    content = content.replace(/\0/g, '')
    
    // Normalize line endings
    content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    
    // Limit file size (10MB)
    if (content.length > 10 * 1024 * 1024) {
      throw new Error('File content exceeds maximum size limit (10MB)')
    }

    return content
  }

  /**
   * Validate environment variable key
   */
  static validateEnvVarKey(key: string): boolean {
    // Must start with letter or underscore
    // Can contain letters, numbers, underscores
    return /^[A-Z_][A-Z0-9_]*$/.test(key)
  }

  /**
   * Validate package name
   */
  static validatePackageName(name: string): boolean {
    // Basic npm package name validation
    return /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(name)
  }

  /**
   * Validate semantic version
   */
  static validateVersion(version: string): boolean {
    // Basic semantic version validation
    return /^\^?~?(\d+)\.(\d+)\.(\d+)(-[a-zA-Z0-9-]+)?(\+[a-zA-Z0-9-]+)?$/.test(version)
  }
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
}