import { Template, TemplateFile, TechSelections, GeneratedProject, ValidationResult } from './types/template'
import { templateRegistry } from './template-registry'
import { templateValidator } from './template-validator'
import { dependencyManager } from './dependency-manager'
import { configGenerator } from './config-generator'
import { ReadmeGenerator } from './readme-generator'
import { EnvDocsGenerator } from './env-docs-generator'
import { InputValidator } from './input-validator'
import { PerformanceMonitor } from './performance-monitor'
import { ErrorRecovery, CodeGenerationError, CircularDependencyError } from './error-handling'
import * as path from 'path'

/**
 * Core code generation engine that merges templates and resolves conflicts
 */
export class CodeGenerator {
  /**
   * Generate a complete project from tech selections
   */
  async generateProject(
    projectName: string,
    selections: TechSelections
  ): Promise<GeneratedProject> {
    PerformanceMonitor.startTimer('generateProject')
    PerformanceMonitor.setMemoryBaseline()

    try {
      // Validate and sanitize inputs
      const nameValidation = InputValidator.validateProjectName(projectName)
      if (!nameValidation.isValid) {
        throw new CodeGenerationError(
          `Invalid project name: ${nameValidation.errors.join(', ')}`,
          'INVALID_PROJECT_NAME'
        )
      }

      const selectionsValidation = InputValidator.validateSelections(selections)
      if (!selectionsValidation.isValid) {
        throw new CodeGenerationError(
          `Invalid selections: ${selectionsValidation.errors.join(', ')}`,
          'INVALID_SELECTIONS'
        )
      }

      // Sanitize project name
      const sanitizedProjectName = InputValidator.sanitizeProjectName(projectName)

      // Validate selections with template validator
      const validation = templateValidator.validateSelections(selections)
      if (!validation.isValid) {
        throw new CodeGenerationError(
          `Template validation failed: ${validation.errors.join(', ')}`,
          'TEMPLATE_VALIDATION_FAILED'
        )
      }

      // Get templates for selections with error recovery
      let templates: Template[]
      try {
        templates = templateRegistry.getTemplatesForSelections(selections)
        if (templates.length === 0) {
          throw new CodeGenerationError('No templates found for selections', 'NO_TEMPLATES_FOUND')
        }
      } catch (error) {
        console.warn('Template loading failed, attempting recovery:', error)
        templates = this.recoverFromTemplateFailure(selections)
      }

      PerformanceMonitor.checkMemoryUsage('after template loading')

      // Merge templates with conflict resolution
      const mergedTemplate = await this.mergeTemplatesSafely(templates)
    
    // Process template variables
    const processedFiles = await this.processTemplateVariables(
      mergedTemplate.files,
      projectName,
      selections
    )

    // Generate package.json with dependency management
    const packageJsonResult = dependencyManager.generatePackageJson(
      projectName,
      templates,
      selections
    )
    const packageJson = packageJsonResult.packageJson

    // Generate environment template and configuration files
    const envTemplateResult = configGenerator.generateEnvTemplate(templates, selections)
    const deploymentConfigs = configGenerator.generateDeploymentConfigs(selections)
    const nextJsConfigs = configGenerator.generateNextJsConfigs(selections)
    
    // Generate comprehensive documentation
    const envExample = EnvDocsGenerator.generateEnvExample(selections)
    const envLocalTemplate = EnvDocsGenerator.generateEnvLocalTemplate(selections)
    const envDocumentation = EnvDocsGenerator.generateEnvDocs(selections, {
      includeExamples: true,
      includeSetupInstructions: true,
      groupByService: true
    })
    
    // Add configuration files to processed files
    processedFiles.push(
      {
        path: '.env.example',
        content: envExample
      },
      {
        path: '.env.local.template',
        content: envLocalTemplate
      },
      {
        path: 'ENV_VARIABLES.md',
        content: envDocumentation
      },
      ...deploymentConfigs.files.map(f => ({ path: f.path, content: f.content })),
      ...nextJsConfigs.map(f => ({ path: f.path, content: f.content }))
    )

    // Generate comprehensive setup guide and README
    const setupInstructions = configGenerator.generateSetupInstructions(templates, selections)
    const setupGuide = ReadmeGenerator.generateSetupInstructions(
      { 
        name: sanitizedProjectName, 
        files: processedFiles, 
        packageJson, 
        envTemplate: envExample, 
        setupGuide: '', 
        selections, 
        metadata: { 
          generatedAt: new Date(), 
          templateVersions: this.getTemplateVersions(templates), 
          estimatedSetupTime: this.calculateSetupTime(templates) 
        } 
      }, 
      templates
    )

      const result = {
        name: sanitizedProjectName,
        files: processedFiles,
        packageJson,
        envTemplate: envTemplateResult.envExample,
        setupGuide,
        selections,
        metadata: {
          generatedAt: new Date(),
          templateVersions: this.getTemplateVersions(templates),
          estimatedSetupTime: this.calculateSetupTime(templates),
          warnings: [...nameValidation.warnings, ...selectionsValidation.warnings, ...validation.warnings],
          suggestions: [...nameValidation.suggestions, ...selectionsValidation.suggestions, ...validation.suggestions]
        }
      }

      PerformanceMonitor.endTimer('generateProject')
      PerformanceMonitor.checkMemoryGrowth('project generation complete')

      return result
    } catch (error) {
      PerformanceMonitor.endTimer('generateProject')
      
      if (error instanceof CodeGenerationError) {
        throw error
      }
      
      throw new CodeGenerationError(
        `Project generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GENERATION_FAILED',
        { originalError: error }
      )
    }
  }

  /**
   * Safely merge multiple templates with enhanced error handling
   */
  async mergeTemplatesSafely(templates: Template[]): Promise<Template> {
    PerformanceMonitor.startTimer('mergeTemplates')
    
    if (templates.length === 0) {
      throw new CodeGenerationError('No templates to merge', 'NO_TEMPLATES')
    }

    if (templates.length === 1) {
      PerformanceMonitor.endTimer('mergeTemplates')
      return templates[0]
    }

    // Sort templates by dependency order with error recovery
    const sortedTemplates = this.sortTemplatesByDependenciesSafely(templates)
    
    const result = await this.mergeTemplates(sortedTemplates)
    PerformanceMonitor.endTimer('mergeTemplates')
    return result
  }

  /**
   * Merge multiple templates with conflict resolution
   */
  async mergeTemplates(templates: Template[]): Promise<Template> {
    if (templates.length === 0) {
      throw new Error('No templates to merge')
    }

    if (templates.length === 1) {
      return templates[0]
    }

    // Sort templates by dependency order
    const sortedTemplates = this.sortTemplatesByDependencies(templates)
    
    // Start with base template
    const baseTemplate = sortedTemplates[0]
    const mergedTemplate: Template = {
      metadata: { ...baseTemplate.metadata },
      files: [...baseTemplate.files],
      envVars: [...baseTemplate.envVars],
      setupInstructions: [...baseTemplate.setupInstructions],
      packageDependencies: { ...baseTemplate.packageDependencies },
      devDependencies: { ...baseTemplate.devDependencies },
      scripts: { ...baseTemplate.scripts }
    }

    // Merge remaining templates
    for (let i = 1; i < sortedTemplates.length; i++) {
      const template = sortedTemplates[i]
      await this.mergeTemplateInto(mergedTemplate, template)
    }

    return mergedTemplate
  }

  /**
   * Merge a template into an existing merged template
   */
  private async mergeTemplateInto(target: Template, source: Template): Promise<void> {
    // Merge files with conflict resolution
    target.files = this.mergeFiles(target.files, source.files)
    
    // Merge environment variables
    target.envVars = this.mergeEnvVars(target.envVars, source.envVars)
    
    // Merge setup instructions
    target.setupInstructions = this.mergeSetupInstructions(
      target.setupInstructions,
      source.setupInstructions
    )
    
    // Merge package dependencies
    Object.assign(target.packageDependencies, source.packageDependencies)
    Object.assign(target.devDependencies, source.devDependencies)
    Object.assign(target.scripts, source.scripts)
  }

  /**
   * Merge files with conflict resolution strategies
   */
  private mergeFiles(targetFiles: TemplateFile[], sourceFiles: TemplateFile[]): TemplateFile[] {
    const mergedFiles = [...targetFiles]
    const existingPaths = new Set(targetFiles.map(f => f.path))

    for (const sourceFile of sourceFiles) {
      if (existingPaths.has(sourceFile.path)) {
        // Handle file conflict with error recovery
        const conflictResolution = this.resolveFileConflictSafely(
          targetFiles.find(f => f.path === sourceFile.path)!,
          sourceFile
        )
        
        if (conflictResolution) {
          // Replace existing file
          const index = mergedFiles.findIndex(f => f.path === sourceFile.path)
          mergedFiles[index] = conflictResolution
        }
      } else {
        // Add new file
        mergedFiles.push(sourceFile)
        existingPaths.add(sourceFile.path)
      }
    }

    return mergedFiles
  }

  /**
   * Resolve conflicts between two files with the same path
   */
  private resolveFileConflict(
    existingFile: TemplateFile,
    newFile: TemplateFile
  ): TemplateFile | null {
    // Strategy 1: Check overwrite flag
    if (newFile.overwrite === true) {
      return newFile
    }

    // Strategy 2: Merge specific file types
    if (this.isMergeableFile(existingFile.path)) {
      return this.mergeFileContents(existingFile, newFile)
    }

    // Strategy 3: Use template priority (later templates override earlier ones)
    return newFile
  }

  /**
   * Check if a file can be merged rather than replaced
   */
  private isMergeableFile(filePath: string): boolean {
    const mergeableExtensions = ['.json', '.md', '.txt', '.env']
    const mergeableFiles = [
      'package.json',
      'README.md',
      '.env.example',
      'tsconfig.json',
      'next.config.js',
      'tailwind.config.js'
    ]

    const fileName = path.basename(filePath)
    const extension = path.extname(filePath)

    return mergeableFiles.includes(fileName) || mergeableExtensions.includes(extension)
  }

  /**
   * Merge contents of two files intelligently
   */
  private mergeFileContents(existingFile: TemplateFile, newFile: TemplateFile): TemplateFile {
    const fileName = path.basename(existingFile.path)

    switch (fileName) {
      case 'package.json':
        return this.mergePackageJsonFiles(existingFile, newFile)
      
      case 'README.md':
        return this.mergeMarkdownFiles(existingFile, newFile)
      
      case '.env.example':
        return this.mergeEnvFiles(existingFile, newFile)
      
      case 'tsconfig.json':
        return this.mergeJsonFiles(existingFile, newFile)
      
      default:
        // For other files, append content with separator
        return {
          ...existingFile,
          content: existingFile.content + '\n\n' + newFile.content
        }
    }
  }

  /**
   * Merge package.json files by combining dependencies and scripts
   */
  private mergePackageJsonFiles(existingFile: TemplateFile, newFile: TemplateFile): TemplateFile {
    try {
      const existing = JSON.parse(existingFile.content)
      const newContent = JSON.parse(newFile.content)

      const merged = {
        ...existing,
        ...newContent,
        dependencies: {
          ...existing.dependencies,
          ...newContent.dependencies
        },
        devDependencies: {
          ...existing.devDependencies,
          ...newContent.devDependencies
        },
        scripts: {
          ...existing.scripts,
          ...newContent.scripts
        }
      }

      return {
        ...existingFile,
        content: JSON.stringify(merged, null, 2)
      }
    } catch {
      // If parsing fails, use new file
      return newFile
    }
  }

  /**
   * Merge JSON files by deep merging objects
   */
  private mergeJsonFiles(existingFile: TemplateFile, newFile: TemplateFile): TemplateFile {
    try {
      const existing = JSON.parse(existingFile.content)
      const newContent = JSON.parse(newFile.content)

      const merged = this.deepMerge(existing, newContent)

      return {
        ...existingFile,
        content: JSON.stringify(merged, null, 2)
      }
    } catch {
      return newFile
    }
  }

  /**
   * Merge markdown files by combining sections
   */
  private mergeMarkdownFiles(existingFile: TemplateFile, newFile: TemplateFile): TemplateFile {
    const existingContent = existingFile.content
    const newContent = newFile.content

    // Simple concatenation with separator for now
    // Could be enhanced to merge sections intelligently
    return {
      ...existingFile,
      content: existingContent + '\n\n---\n\n' + newContent
    }
  }

  /**
   * Merge environment files by combining variables
   */
  private mergeEnvFiles(existingFile: TemplateFile, newFile: TemplateFile): TemplateFile {
    const existingLines = existingFile.content.split('\n')
    const newLines = newFile.content.split('\n')
    
    const existingVars = new Set(
      existingLines
        .filter(line => line.includes('='))
        .map(line => line.split('=')[0])
    )

    const mergedLines = [...existingLines]
    
    for (const line of newLines) {
      if (line.includes('=')) {
        const varName = line.split('=')[0]
        if (!existingVars.has(varName)) {
          mergedLines.push(line)
        }
      } else if (line.trim() && !existingLines.includes(line)) {
        mergedLines.push(line)
      }
    }

    return {
      ...existingFile,
      content: mergedLines.join('\n')
    }
  }

  /**
   * Deep merge two objects
   */
  private deepMerge(target: any, source: any): any {
    if (typeof target !== 'object' || typeof source !== 'object') {
      return source
    }

    const result = { ...target }

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (typeof source[key] === 'object' && typeof target[key] === 'object') {
          result[key] = this.deepMerge(target[key], source[key])
        } else {
          result[key] = source[key]
        }
      }
    }

    return result
  }

  /**
   * Sort templates by their dependencies
   */
  private sortTemplatesByDependencies(templates: Template[]): Template[] {
    const sorted: Template[] = []
    const visited = new Set<string>()
    const visiting = new Set<string>()

    const visit = (template: Template) => {
      if (visiting.has(template.metadata.id)) {
        throw new Error(`Circular dependency detected: ${template.metadata.id}`)
      }
      
      if (visited.has(template.metadata.id)) {
        return
      }

      visiting.add(template.metadata.id)

      // Visit dependencies first
      for (const depId of template.metadata.dependencies) {
        const depTemplate = templates.find(t => t.metadata.id === depId)
        if (depTemplate) {
          visit(depTemplate)
        }
      }

      visiting.delete(template.metadata.id)
      visited.add(template.metadata.id)
      sorted.push(template)
    }

    for (const template of templates) {
      visit(template)
    }

    return sorted
  }

  /**
   * Merge environment variables from multiple templates
   */
  private mergeEnvVars(existing: any[], newVars: any[]): any[] {
    const merged = [...existing]
    const existingKeys = new Set(existing.map(v => v.key))

    for (const envVar of newVars) {
      if (!existingKeys.has(envVar.key)) {
        merged.push(envVar)
        existingKeys.add(envVar.key)
      }
    }

    return merged
  }

  /**
   * Merge setup instructions from multiple templates
   */
  private mergeSetupInstructions(existing: any[], newInstructions: any[]): any[] {
    const merged = [...existing]
    
    // Add new instructions with adjusted step numbers
    const maxStep = existing.length > 0 ? Math.max(...existing.map(i => i.step)) : 0
    
    for (const instruction of newInstructions) {
      merged.push({
        ...instruction,
        step: maxStep + instruction.step
      })
    }

    return merged.sort((a, b) => a.step - b.step)
  }

  /**
   * Process template variables in file contents
   */
  private async processTemplateVariables(
    files: TemplateFile[],
    projectName: string,
    selections: TechSelections
  ): Promise<TemplateFile[]> {
    const context = {
      projectName,
      projectNameKebab: this.toKebabCase(projectName),
      projectNamePascal: this.toPascalCase(projectName),
      projectNameCamel: this.toCamelCase(projectName),
      selections,
      timestamp: new Date().toISOString(),
      year: new Date().getFullYear()
    }

    // Validate and sanitize files first
    const validatedFiles = this.validateAndSanitizeFiles(files)
    
    const processedFiles = validatedFiles.map(file => ({
      ...file,
      content: this.processVariablesSafely(file.content, context),
      path: this.processVariablesSafely(file.path, context)
    }))

    return processedFiles
  }

  /**
   * Process template variables in a string
   */
  private processVariables(content: string, context: any): string {
    return content.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
      const value = this.getNestedValue(context, path)
      return value !== undefined ? String(value) : match
    })
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    const value = path.split('.').reduce((current, key) => current?.[key], obj)
    // Return undefined for null values to prevent replacement
    return value === null ? undefined : value
  }

  /**
   * Convert string to kebab-case
   */
  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase()
  }

  /**
   * Convert string to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
      .replace(/^(.)/, char => char.toUpperCase())
  }

  /**
   * Convert string to camelCase
   */
  private toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str)
    return pascal.charAt(0).toLowerCase() + pascal.slice(1)
  }

  /**
   * Generate package.json for the project
   */
  private generatePackageJson(
    projectName: string,
    templates: Template[],
    selections: TechSelections
  ): any {
    const dependencies: Record<string, string> = {}
    const devDependencies: Record<string, string> = {}
    const scripts: Record<string, string> = {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint'
    }

    // Merge dependencies from all templates
    for (const template of templates) {
      Object.assign(dependencies, template.packageDependencies)
      Object.assign(devDependencies, template.devDependencies)
      Object.assign(scripts, template.scripts)
    }

    return {
      name: this.toKebabCase(projectName),
      version: '0.1.0',
      private: true,
      scripts,
      dependencies,
      devDependencies,
      engines: {
        node: '>=18.0.0'
      }
    }
  }



  /**
   * Generate setup guide from configuration instructions
   */
  private generateSetupGuideFromInstructions(
    instructions: any[],
    selections: TechSelections
  ): string {
    let guide = `# Project Setup Guide\n\n`
    guide += 'This guide will help you set up your generated project step by step.\n\n'

    // Prerequisites
    guide += '## Prerequisites\n\n'
    guide += '- Node.js 18+ installed\n'
    guide += '- npm or yarn package manager\n'
    guide += '- Git (optional)\n\n'

    // Quick start
    guide += '## Quick Start\n\n'
    guide += '1. Extract the project files\n'
    guide += '2. Install dependencies: `npm install`\n'
    guide += '3. Copy `.env.local.template` to `.env.local`\n'
    guide += '4. Fill in your environment variables (see ENV_VARIABLES.md)\n'
    guide += '5. Run the development server: `npm run dev`\n\n'

    // Group instructions by category
    const groupedInstructions = instructions.reduce((groups, instruction) => {
      const category = instruction.category || 'other'
      if (!groups[category]) groups[category] = []
      groups[category].push(instruction)
      return groups
    }, {} as Record<string, any[]>)

    // Add detailed setup instructions by category
    const categoryOrder = ['installation', 'configuration', 'deployment', 'testing']
    
    for (const category of categoryOrder) {
      const categoryInstructions = groupedInstructions[category]
      if (!categoryInstructions || categoryInstructions.length === 0) continue

      guide += `## ${this.capitalizeCategory(category)}\n\n`
      
      const sortedInstructions = categoryInstructions.sort((a: any, b: any) => a.step - b.step)
      
      for (const instruction of sortedInstructions) {
        guide += `### ${instruction.step}. ${instruction.title}\n\n`
        guide += `${instruction.description}\n\n`
        
        if (instruction.commands && instruction.commands.length > 0) {
          guide += '```bash\n'
          guide += instruction.commands.join('\n')
          guide += '\n```\n\n'
        }
        
        if (instruction.url) {
          guide += `[Learn more](${instruction.url})\n\n`
        }
      }
    }

    // Add technology-specific notes
    guide += '## Technology Stack\n\n'
    guide += 'Your project uses the following technologies:\n\n'
    
    if (selections.framework) {
      guide += `- **Framework:** ${selections.framework}\n`
    }
    if (selections.authentication !== 'none') {
      guide += `- **Authentication:** ${selections.authentication}\n`
    }
    if (selections.database !== 'none') {
      guide += `- **Database:** ${selections.database}\n`
    }
    if (selections.payments !== 'none') {
      guide += `- **Payments:** ${selections.payments}\n`
    }
    if (selections.hosting) {
      guide += `- **Hosting:** ${selections.hosting}\n`
    }
    
    guide += '\nRefer to the individual service documentation for advanced configuration options.\n'

    return guide
  }

  /**
   * Capitalize category name
   */
  private capitalizeCategory(category: string): string {
    return category.charAt(0).toUpperCase() + category.slice(1)
  }

  /**
   * Get template versions for metadata
   */
  private getTemplateVersions(templates: Template[]): Record<string, string> {
    return templates.reduce((acc, template) => {
      acc[template.metadata.id] = template.metadata.version
      return acc
    }, {} as Record<string, string>)
  }

  /**
   * Calculate estimated setup time
   */
  private calculateSetupTime(templates: Template[]): number {
    return templates.reduce((total, template) => total + template.metadata.setupTime, 0)
  }

  /**
   * Recover from template loading failures
   */
  private recoverFromTemplateFailure(selections: TechSelections): Template[] {
    console.warn('Attempting to recover from template loading failure')
    
    const fallbackTemplates: Template[] = []
    
    // Create minimal base template
    fallbackTemplates.push({
      metadata: {
        id: 'fallback-base',
        name: 'Fallback Base Template',
        version: '0.0.0',
        category: 'base',
        dependencies: [],
        setupTime: 5,
        complexity: 'simple',
        pricing: 'free',
        requiredEnvVars: [],
        optionalEnvVars: [],
        documentation: '',
        tags: ['fallback'],
        popularity: 0,
        lastUpdated: new Date(),
        conflicts: []
      },
      files: [
        {
          path: 'package.json',
          content: JSON.stringify({
            name: '{{projectNameKebab}}',
            version: '0.1.0',
            private: true,
            scripts: {
              dev: 'next dev',
              build: 'next build',
              start: 'next start'
            }
          }, null, 2)
        },
        {
          path: 'README.md',
          content: '# {{projectName}}\n\nGenerated with fallback template due to loading error.\n'
        }
      ],
      envVars: [],
      setupInstructions: [
        {
          step: 1,
          title: 'Install Dependencies',
          description: 'Install the required dependencies',
          category: 'installation'
        }
      ],
      packageDependencies: {
        'next': '^14.0.0',
        'react': '^18.0.0',
        'react-dom': '^18.0.0'
      },
      devDependencies: {
        'typescript': '^5.0.0',
        '@types/react': '^18.0.0',
        '@types/node': '^20.0.0'
      },
      scripts: {
        'dev': 'next dev',
        'build': 'next build',
        'start': 'next start'
      }
    })

    return fallbackTemplates
  }

  /**
   * Enhanced file conflict resolution with better error handling
   */
  private resolveFileConflictSafely(
    existingFile: TemplateFile,
    newFile: TemplateFile
  ): TemplateFile | null {
    try {
      return this.resolveFileConflict(existingFile, newFile)
    } catch (error) {
      console.warn(`File conflict resolution failed for ${existingFile.path}:`, error)
      
      // Use error recovery
      const recoveredContent = ErrorRecovery.recoverFromMergeConflict(
        existingFile.path,
        existingFile.content,
        newFile.content
      )
      
      return {
        ...existingFile,
        content: recoveredContent
      }
    }
  }

  /**
   * Enhanced dependency sorting with better circular dependency detection
   */
  private sortTemplatesByDependenciesSafely(templates: Template[]): Template[] {
    try {
      return this.sortTemplatesByDependencies(templates)
    } catch (error) {
      if (error instanceof Error && error.message.includes('Circular dependency')) {
        // Extract dependency chain from error message
        const dependencyChain = this.extractDependencyChain(error.message)
        throw new CircularDependencyError(error.message, dependencyChain)
      }
      
      // Fallback: sort by template ID to ensure deterministic order
      console.warn('Dependency sorting failed, using fallback ordering:', error)
      return templates.sort((a, b) => a.metadata.id.localeCompare(b.metadata.id))
    }
  }

  /**
   * Extract dependency chain from circular dependency error
   */
  private extractDependencyChain(errorMessage: string): string[] {
    // Simple extraction - could be enhanced
    const match = errorMessage.match(/Circular dependency detected: (.+)/)
    return match ? [match[1]] : []
  }

  /**
   * Validate file paths for security
   */
  private validateAndSanitizeFiles(files: TemplateFile[]): TemplateFile[] {
    return files
      .filter(file => {
        if (!InputValidator.validateFilePath(file.path)) {
          console.warn(`Skipping file with invalid path: ${file.path}`)
          return false
        }
        return true
      })
      .map(file => ({
        ...file,
        content: InputValidator.sanitizeFileContent(file.content),
        path: file.path.replace(/\\/g, '/') // Normalize path separators
      }))
  }

  /**
   * Enhanced template variable processing with error handling
   */
  private processVariablesSafely(content: string, context: any): string {
    try {
      return this.processVariables(content, context)
    } catch (error) {
      console.warn('Variable processing failed, returning original content:', error)
      return content
    }
  }

  /**
   * Validate generated project structure
   */
  private validateGeneratedProject(project: GeneratedProject): void {
    // Check for required files
    const requiredFiles = ['package.json']
    const filePaths = project.files.map(f => f.path)
    
    for (const required of requiredFiles) {
      if (!filePaths.includes(required)) {
        console.warn(`Missing required file: ${required}`)
      }
    }

    // Check for duplicate files
    const duplicates = filePaths.filter((path, index) => filePaths.indexOf(path) !== index)
    if (duplicates.length > 0) {
      console.warn(`Duplicate files detected: ${duplicates.join(', ')}`)
    }

    // Validate package.json structure
    if (project.packageJson) {
      if (!project.packageJson.name) {
        console.warn('Generated package.json missing name field')
      }
      if (!project.packageJson.version) {
        console.warn('Generated package.json missing version field')
      }
    }
  }
}

export const codeGenerator = new CodeGenerator()