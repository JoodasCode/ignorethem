/**
 * Error handling utilities for code generation
 */

export class CodeGenerationError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message)
    this.name = 'CodeGenerationError'
  }
}

export class TemplateValidationError extends CodeGenerationError {
  constructor(message: string, public templateId: string, public validationErrors: string[]) {
    super(message, 'TEMPLATE_VALIDATION_ERROR', { templateId, validationErrors })
  }
}

export class DependencyConflictError extends CodeGenerationError {
  constructor(message: string, public conflicts: any[]) {
    super(message, 'DEPENDENCY_CONFLICT_ERROR', { conflicts })
  }
}

export class CircularDependencyError extends CodeGenerationError {
  constructor(message: string, public dependencyChain: string[]) {
    super(message, 'CIRCULAR_DEPENDENCY_ERROR', { dependencyChain })
  }
}

/**
 * Error recovery strategies
 */
export class ErrorRecovery {
  /**
   * Attempt to recover from template loading failures
   */
  static recoverFromTemplateFailure(templateId: string, error: Error): any {
    console.warn(`Template ${templateId} failed to load: ${error.message}`)
    
    // Return minimal fallback template
    return {
      metadata: {
        id: templateId,
        name: `Fallback for ${templateId}`,
        version: '0.0.0',
        category: 'other',
        dependencies: [],
        setupTime: 0
      },
      files: [],
      envVars: [],
      setupInstructions: [],
      packageDependencies: {},
      devDependencies: {},
      scripts: {}
    }
  }

  /**
   * Recover from dependency resolution failures
   */
  static recoverFromDependencyFailure(packageName: string, versions: string[]): string {
    console.warn(`Failed to resolve dependency ${packageName} with versions: ${versions.join(', ')}`)
    
    // Use the first version as fallback
    return versions[0] || 'latest'
  }

  /**
   * Recover from file merge conflicts
   */
  static recoverFromMergeConflict(filePath: string, existingContent: string, newContent: string): string {
    console.warn(`Merge conflict for file ${filePath}, using new content`)
    
    // Simple strategy: use new content with conflict markers
    return `${existingContent}\n\n<<<<<<< MERGE CONFLICT\n${newContent}\n>>>>>>> END CONFLICT\n`
  }
}