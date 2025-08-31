import { Template, TemplateMetadata, ValidationResult, TechSelections } from './types/template'
import { templateValidator } from './template-validator'
import * as path from 'path'
import * as fs from 'fs/promises'

/**
 * Template registry for managing and loading templates
 */
export class TemplateRegistry {
  private templates: Map<string, Template> = new Map()
  private templatePath: string
  private initialized = false

  constructor(templatePath = 'templates') {
    this.templatePath = path.resolve(process.cwd(), templatePath)
  }

  /**
   * Initialize the registry by loading all templates
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      await this.loadAllTemplates()
      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize template registry:', error)
      throw error
    }
  }

  /**
   * Get a template by ID
   */
  getTemplate(templateId: string): Template | null {
    return this.templates.get(templateId) || null
  }

  /**
   * Get all templates
   */
  getAllTemplates(): Template[] {
    return Array.from(this.templates.values())
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string): Template[] {
    return this.getAllTemplates().filter(t => t.metadata.category === category)
  }

  /**
   * Get templates for specific selections
   */
  getTemplatesForSelections(selections: TechSelections): Template[] {
    const templateIds = this.selectionsToTemplateIds(selections)
    const templates: Template[] = []

    for (const id of templateIds) {
      const template = this.getTemplate(id)
      if (template) {
        templates.push(template)
      }
    }

    return templates
  }

  /**
   * Validate template selections and return validation result
   */
  validateSelections(selections: TechSelections): ValidationResult {
    return templateValidator.validateSelections(selections)
  }

  /**
   * Get recommended templates based on current selections
   */
  getRecommendations(selections: TechSelections): Template[] {
    const recommendedIds = templateValidator.getRecommendations(selections)
    return recommendedIds
      .map(id => this.getTemplate(id))
      .filter((template): template is Template => template !== null)
  }

  /**
   * Search templates by name, description, or tags
   */
  searchTemplates(query: string): Template[] {
    const lowercaseQuery = query.toLowerCase()
    return this.getAllTemplates().filter(template => 
      template.metadata.name.toLowerCase().includes(lowercaseQuery) ||
      template.metadata.description.toLowerCase().includes(lowercaseQuery) ||
      template.metadata.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    )
  }

  /**
   * Get popular templates sorted by usage
   */
  getPopularTemplates(limit = 10): Template[] {
    return this.getAllTemplates()
      .sort((a, b) => b.metadata.popularity - a.metadata.popularity)
      .slice(0, limit)
  }

  /**
   * Register a new template
   */
  registerTemplate(template: Template): ValidationResult {
    const validation = templateValidator.validateTemplate(template)
    
    if (validation.isValid) {
      this.templates.set(template.metadata.id, template)
    }

    return validation
  }

  /**
   * Load all templates from the file system
   */
  private async loadAllTemplates(): Promise<void> {
    try {
      const categories = await fs.readdir(this.templatePath)
      
      for (const category of categories) {
        const categoryPath = path.join(this.templatePath, category)
        const stat = await fs.stat(categoryPath)
        
        if (stat.isDirectory()) {
          await this.loadCategoryTemplates(category, categoryPath)
        }
      }
    } catch (error) {
      console.warn('Template directory not found, using empty registry')
    }
  }

  /**
   * Load templates from a specific category directory
   */
  private async loadCategoryTemplates(category: string, categoryPath: string): Promise<void> {
    try {
      const templateDirs = await fs.readdir(categoryPath)
      
      for (const templateDir of templateDirs) {
        const templatePath = path.join(categoryPath, templateDir)
        const stat = await fs.stat(templatePath)
        
        if (stat.isDirectory()) {
          await this.loadTemplate(templatePath)
        }
      }
    } catch (error) {
      console.warn(`Failed to load templates from category ${category}:`, error)
    }
  }

  /**
   * Load a single template from its directory
   */
  private async loadTemplate(templatePath: string): Promise<void> {
    try {
      const metadataPath = path.join(templatePath, 'template.json')
      const metadataContent = await fs.readFile(metadataPath, 'utf-8')
      const metadata: TemplateMetadata = JSON.parse(metadataContent)

      // Load template files
      const files = await this.loadTemplateFiles(templatePath)
      
      // Load package.json for dependencies
      const packageJsonPath = path.join(templatePath, 'package.json')
      let packageDependencies = {}
      let devDependencies = {}
      let scripts = {}

      try {
        const packageContent = await fs.readFile(packageJsonPath, 'utf-8')
        const packageJson = JSON.parse(packageContent)
        packageDependencies = packageJson.dependencies || {}
        devDependencies = packageJson.devDependencies || {}
        scripts = packageJson.scripts || {}
      } catch {
        // package.json is optional
      }

      const template: Template = {
        metadata,
        files,
        envVars: [], // Will be loaded from env.json if exists
        setupInstructions: [], // Will be loaded from setup.json if exists
        packageDependencies,
        devDependencies,
        scripts
      }

      // Load additional configuration files
      await this.loadTemplateConfig(templatePath, template)

      // Validate and register template
      const validation = this.registerTemplate(template)
      if (!validation.isValid) {
        console.warn(`Template ${metadata.id} validation failed:`, validation.errors)
      }
    } catch (error) {
      console.warn(`Failed to load template from ${templatePath}:`, error)
    }
  }

  /**
   * Load all files from a template directory
   */
  private async loadTemplateFiles(templatePath: string): Promise<any[]> {
    const files: any[] = []
    const filesDir = path.join(templatePath, 'files')
    
    try {
      await this.loadFilesRecursively(filesDir, '', files)
    } catch {
      // files directory is optional
    }

    return files
  }

  /**
   * Recursively load files from a directory
   */
  private async loadFilesRecursively(
    dirPath: string, 
    relativePath: string, 
    files: any[]
  ): Promise<void> {
    const entries = await fs.readdir(dirPath)
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry)
      const entryRelativePath = path.join(relativePath, entry)
      const stat = await fs.stat(fullPath)
      
      if (stat.isDirectory()) {
        await this.loadFilesRecursively(fullPath, entryRelativePath, files)
      } else {
        const content = await fs.readFile(fullPath, 'utf-8')
        files.push({
          path: entryRelativePath,
          content,
          executable: stat.mode & 0o111 ? true : false
        })
      }
    }
  }

  /**
   * Load additional template configuration
   */
  private async loadTemplateConfig(templatePath: string, template: Template): Promise<void> {
    // Load environment variables
    try {
      const envPath = path.join(templatePath, 'env.json')
      const envContent = await fs.readFile(envPath, 'utf-8')
      template.envVars = JSON.parse(envContent)
    } catch {
      // env.json is optional
    }

    // Load setup instructions
    try {
      const setupPath = path.join(templatePath, 'setup.json')
      const setupContent = await fs.readFile(setupPath, 'utf-8')
      template.setupInstructions = JSON.parse(setupContent)
    } catch {
      // setup.json is optional
    }
  }

  private selectionsToTemplateIds(selections: TechSelections): string[] {
    const templateIds: string[] = []

    // Always include base framework
    templateIds.push('nextjs-base')

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
}

// Singleton instance
export const templateRegistry = new TemplateRegistry()