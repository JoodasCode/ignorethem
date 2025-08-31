import JSZip from 'jszip'
import { GeneratedProject, TemplateFile } from './types/template'
import { UsageTrackingService, UsageCheckResult } from './usage-tracking'
import { AnalyticsMCPService } from './analytics-mcp'
import { PerformanceMonitor } from './performance-monitor'
import { ErrorRecovery, CodeGenerationError } from './error-handling'

export interface ZipGenerationOptions {
  userId: string
  projectName: string
  includeReadme?: boolean
  includeEnvTemplate?: boolean
  compressionLevel?: number
}

export interface ZipGenerationResult {
  success: boolean
  zipBuffer?: Buffer
  filename: string
  size: number
  error?: string
  usageInfo?: {
    remainingGenerations: number
    resetDate?: Date
    upgradeRequired: boolean
  }
}

export interface ProjectGenerationMetrics {
  generationTime: number
  zipSize: number
  fileCount: number
  compressionRatio: number
  memoryUsage: number
}

/**
 * Service for generating ZIP files from generated projects with usage tracking
 */
export class ZipGeneratorService {
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
  private static readonly MAX_FILES = 1000
  private static readonly TEMP_CLEANUP_TIMEOUT = 5 * 60 * 1000 // 5 minutes

  /**
   * Generate ZIP file for a project with usage validation
   */
  static async generateProjectZip(
    project: GeneratedProject,
    options: ZipGenerationOptions
  ): Promise<ZipGenerationResult> {
    PerformanceMonitor.startTimer('zipGeneration')
    PerformanceMonitor.setMemoryBaseline()

    try {
      // Check usage limits before generation
      const usageCheck = await this.checkUsageLimits(options.userId)
      if (!usageCheck.allowed) {
        return {
          success: false,
          filename: '',
          size: 0,
          error: usageCheck.reason,
          usageInfo: {
            remainingGenerations: usageCheck.remainingCount || 0,
            resetDate: usageCheck.resetDate,
            upgradeRequired: usageCheck.upgradeRequired || false
          }
        }
      }

      // Validate project data
      this.validateProjectData(project)

      // Create ZIP file
      const zip = new JSZip()
      const filename = this.generateFilename(options.projectName)

      // Add project files to ZIP
      await this.addProjectFilesToZip(zip, project, options)

      // Generate ZIP buffer with compression
      const compressionLevel = options.compressionLevel || 6
      const zipBuffer = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: compressionLevel },
        streamFiles: true
      })

      // Validate ZIP size
      if (zipBuffer.length > this.MAX_FILE_SIZE) {
        throw new CodeGenerationError(
          `Generated ZIP file too large: ${zipBuffer.length} bytes`,
          'ZIP_TOO_LARGE'
        )
      }

      // Track usage after successful generation
      await this.trackUsage(options.userId, project, zipBuffer.length)

      // Calculate metrics
      const metrics = this.calculateMetrics(project, zipBuffer)

      // Track download analytics
      await this.trackDownloadAnalytics(options.userId, project, zipBuffer.length, metrics)
      
      PerformanceMonitor.endTimer('zipGeneration')
      PerformanceMonitor.checkMemoryGrowth('ZIP generation complete')

      return {
        success: true,
        zipBuffer,
        filename,
        size: zipBuffer.length,
        usageInfo: {
          remainingGenerations: (usageCheck.remainingCount || 1) - 1,
          resetDate: usageCheck.resetDate,
          upgradeRequired: false
        }
      }

    } catch (error) {
      PerformanceMonitor.endTimer('zipGeneration')
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('ZIP generation failed:', error)

      return {
        success: false,
        filename: '',
        size: 0,
        error: errorMessage
      }
    }
  }

  /**
   * Check if user can generate a project
   */
  private static async checkUsageLimits(userId: string): Promise<UsageCheckResult> {
    try {
      return await UsageTrackingService.checkStackGeneration(userId)
    } catch (error) {
      console.error('Usage check failed:', error)
      return {
        allowed: false,
        reason: 'Unable to verify usage limits. Please try again.'
      }
    }
  }

  /**
   * Validate project data before ZIP generation
   */
  private static validateProjectData(project: GeneratedProject): void {
    if (!project.name || project.name.trim().length === 0) {
      throw new CodeGenerationError('Project name is required', 'INVALID_PROJECT_NAME')
    }

    if (!project.files || project.files.length === 0) {
      throw new CodeGenerationError('Project must contain at least one file', 'NO_FILES')
    }

    if (project.files.length > this.MAX_FILES) {
      throw new CodeGenerationError(
        `Too many files: ${project.files.length} (max: ${this.MAX_FILES})`,
        'TOO_MANY_FILES'
      )
    }

    // Validate file paths for security
    for (const file of project.files) {
      if (!this.isValidFilePath(file.path)) {
        throw new CodeGenerationError(
          `Invalid file path: ${file.path}`,
          'INVALID_FILE_PATH'
        )
      }
    }
  }

  /**
   * Add all project files to the ZIP archive
   */
  private static async addProjectFilesToZip(
    zip: JSZip,
    project: GeneratedProject,
    options: ZipGenerationOptions
  ): Promise<void> {
    // Add project files
    for (const file of project.files) {
      try {
        // Sanitize file content
        const sanitizedContent = this.sanitizeFileContent(file.content)
        
        zip.file(file.path, sanitizedContent, {
          createFolders: true,
          unixPermissions: file.executable ? 0o755 : 0o644
        })
      } catch (error) {
        console.warn(`Failed to add file ${file.path}:`, error)
        // Continue with other files rather than failing completely
      }
    }

    // Add package.json
    if (project.packageJson) {
      zip.file('package.json', JSON.stringify(project.packageJson, null, 2))
    }

    // Add environment template if requested
    if (options.includeEnvTemplate && project.envTemplate) {
      zip.file('.env.example', project.envTemplate)
    }

    // Add README if requested
    if (options.includeReadme && project.setupGuide) {
      zip.file('README.md', project.setupGuide)
    }

    // Add generation metadata
    const metadata = {
      generatedAt: project.metadata.generatedAt.toISOString(),
      generatedBy: 'Stack Navigator',
      templateVersions: project.metadata.templateVersions,
      selections: project.selections,
      estimatedSetupTime: project.metadata.estimatedSetupTime
    }
    zip.file('.stack-navigator.json', JSON.stringify(metadata, null, 2))
  }

  /**
   * Generate filename for the ZIP file
   */
  private static generateFilename(projectName: string): string {
    const sanitizedName = projectName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    
    const timestamp = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    return `${sanitizedName}-${timestamp}.zip`
  }

  /**
   * Track usage after successful generation
   */
  private static async trackUsage(
    userId: string,
    project: GeneratedProject,
    zipSize: number
  ): Promise<void> {
    try {
      // Increment stack generation count
      await UsageTrackingService.incrementStackGeneration(userId)
    } catch (error) {
      console.error('Usage tracking failed:', error)
      // Don't fail the generation if tracking fails
    }
  }

  /**
   * Track download analytics and conversion metrics
   */
  private static async trackDownloadAnalytics(
    userId: string,
    project: GeneratedProject,
    zipSize: number,
    metrics: ProjectGenerationMetrics
  ): Promise<void> {
    try {
      // Get user tier for analytics
      const userTier = await UsageTrackingService.getUserTier(userId)

      // Track download event
      await AnalyticsMCPService.trackDownload({
        userId,
        projectName: project.name,
        selections: project.selections,
        fileCount: project.files.length,
        zipSize,
        generationTime: metrics.generationTime,
        downloadedAt: new Date(),
        userTier
      })

      // Track conversion event if this is user's first generation
      const usageSummary = await UsageTrackingService.getUsageSummary(userId)
      if (usageSummary.stackGenerations.used === 1) {
        await AnalyticsMCPService.trackConversion({
          userId,
          eventType: 'first_generation',
          metadata: {
            project_name: project.name,
            selections: project.selections,
            generation_time: metrics.generationTime
          },
          timestamp: new Date()
        })
      }

    } catch (error) {
      console.error('Download analytics tracking failed:', error)
      // Don't fail the generation if analytics fails
    }
  }

  /**
   * Calculate generation metrics
   */
  private static calculateMetrics(
    project: GeneratedProject,
    zipBuffer: Buffer
  ): ProjectGenerationMetrics {
    const totalFileSize = project.files.reduce(
      (total, file) => total + file.content.length,
      0
    )

    return {
      generationTime: PerformanceMonitor.getTimerDuration('zipGeneration') || 0,
      zipSize: zipBuffer.length,
      fileCount: project.files.length,
      compressionRatio: totalFileSize > 0 ? zipBuffer.length / totalFileSize : 0,
      memoryUsage: PerformanceMonitor.getCurrentMemoryUsage()
    }
  }

  /**
   * Validate file path for security
   */
  private static isValidFilePath(filePath: string): boolean {
    // Prevent path traversal attacks
    if (filePath.includes('..') || filePath.includes('\\')) {
      return false
    }

    // Prevent absolute paths
    if (filePath.startsWith('/') || filePath.match(/^[a-zA-Z]:/)) {
      return false
    }

    // Prevent hidden system files
    if (filePath.startsWith('.') && !this.isAllowedDotFile(filePath)) {
      return false
    }

    return true
  }

  /**
   * Check if dot file is allowed
   */
  private static isAllowedDotFile(filePath: string): boolean {
    const allowedDotFiles = [
      '.env.example',
      '.env.local.template',
      '.gitignore',
      '.eslintrc.json',
      '.prettierrc',
      '.stack-navigator.json'
    ]

    return allowedDotFiles.some(allowed => 
      filePath === allowed || filePath.startsWith(allowed + '/')
    )
  }

  /**
   * Sanitize file content to prevent malicious code
   */
  private static sanitizeFileContent(content: string): string {
    // Remove any potential script injections in comments
    let sanitized = content.replace(/<!--[\s\S]*?-->/g, (match) => {
      // Keep HTML comments but remove script tags within them
      return match.replace(/<script[\s\S]*?<\/script>/gi, '')
    })

    // Remove standalone script tags (but preserve legitimate code files)
    if (!this.isCodeFile(content)) {
      sanitized = sanitized.replace(/<script[\s\S]*?<\/script>/gi, '')
    }

    return sanitized
  }

  /**
   * Check if content appears to be a legitimate code file
   */
  private static isCodeFile(content: string): boolean {
    // Simple heuristic: if it contains imports, exports, or function declarations
    // it's likely a legitimate code file
    const codePatterns = [
      /^import\s+/m,
      /^export\s+/m,
      /^function\s+/m,
      /^const\s+\w+\s*=/m,
      /^class\s+/m
    ]

    return codePatterns.some(pattern => pattern.test(content))
  }

  /**
   * Create a temporary file cleanup handler
   */
  static createTempCleanupHandler(): () => void {
    const tempFiles = new Set<string>()
    
    const cleanup = () => {
      tempFiles.clear()
    }

    // Auto-cleanup after timeout
    setTimeout(cleanup, this.TEMP_CLEANUP_TIMEOUT)

    return cleanup
  }

  /**
   * Get ZIP generation statistics for monitoring
   */
  static getGenerationStats(): {
    totalGenerations: number
    averageSize: number
    averageTime: number
    errorRate: number
  } {
    // This would typically be stored in a database or cache
    // For now, return placeholder values
    return {
      totalGenerations: 0,
      averageSize: 0,
      averageTime: 0,
      errorRate: 0
    }
  }
}