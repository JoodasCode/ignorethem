import { promises as fs } from 'fs'
import * as path from 'path'
import * as os from 'os'
import { v4 as uuidv4 } from 'uuid'

export interface TempFile {
  id: string
  path: string
  createdAt: Date
  expiresAt: Date
  size: number
}

export interface CleanupStats {
  filesDeleted: number
  bytesFreed: number
  errors: number
}

/**
 * Service for managing temporary files with automatic cleanup
 */
export class TempFileManager {
  private static readonly TEMP_DIR = path.join(os.tmpdir(), 'stack-navigator')
  private static readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes
  private static readonly MAX_TEMP_SIZE = 100 * 1024 * 1024 // 100MB total
  private static readonly CLEANUP_INTERVAL = 60 * 1000 // 1 minute
  
  private static tempFiles = new Map<string, TempFile>()
  private static cleanupTimer: NodeJS.Timeout | null = null
  private static initialized = false

  /**
   * Initialize the temp file manager
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Ensure temp directory exists
      await fs.mkdir(this.TEMP_DIR, { recursive: true })
      
      // Start cleanup timer
      this.startCleanupTimer()
      
      // Clean up any existing temp files from previous runs
      await this.cleanupExpiredFiles()
      
      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize temp file manager:', error)
      throw error
    }
  }

  /**
   * Create a temporary file
   */
  static async createTempFile(
    content: Buffer | string,
    extension = '.tmp',
    ttl = this.DEFAULT_TTL
  ): Promise<TempFile> {
    await this.initialize()

    const id = uuidv4()
    const filename = `${id}${extension}`
    const filePath = path.join(this.TEMP_DIR, filename)
    
    const now = new Date()
    const expiresAt = new Date(now.getTime() + ttl)

    try {
      // Write file to disk
      await fs.writeFile(filePath, content)
      
      // Get file size
      const stats = await fs.stat(filePath)
      
      const tempFile: TempFile = {
        id,
        path: filePath,
        createdAt: now,
        expiresAt,
        size: stats.size
      }

      // Store in memory map
      this.tempFiles.set(id, tempFile)

      // Check if we're exceeding size limits
      await this.enforceStorageLimits()

      return tempFile

    } catch (error) {
      console.error('Failed to create temp file:', error)
      throw new Error(`Failed to create temporary file: ${error}`)
    }
  }

  /**
   * Get a temporary file by ID
   */
  static getTempFile(id: string): TempFile | null {
    const tempFile = this.tempFiles.get(id)
    
    if (!tempFile) {
      return null
    }

    // Check if expired
    if (new Date() > tempFile.expiresAt) {
      this.deleteTempFile(id)
      return null
    }

    return tempFile
  }

  /**
   * Delete a temporary file
   */
  static async deleteTempFile(id: string): Promise<boolean> {
    const tempFile = this.tempFiles.get(id)
    
    if (!tempFile) {
      return false
    }

    try {
      // Delete from filesystem
      await fs.unlink(tempFile.path)
    } catch (error) {
      // File might already be deleted, continue
      console.warn(`Failed to delete temp file ${tempFile.path}:`, error)
    }

    // Remove from memory map
    this.tempFiles.delete(id)
    return true
  }

  /**
   * Extend the TTL of a temporary file
   */
  static extendTempFile(id: string, additionalTtl: number): boolean {
    const tempFile = this.tempFiles.get(id)
    
    if (!tempFile) {
      return false
    }

    tempFile.expiresAt = new Date(tempFile.expiresAt.getTime() + additionalTtl)
    return true
  }

  /**
   * Get all temporary files
   */
  static getAllTempFiles(): TempFile[] {
    return Array.from(this.tempFiles.values())
  }

  /**
   * Get temporary files statistics
   */
  static getStats(): {
    totalFiles: number
    totalSize: number
    expiredFiles: number
    oldestFile?: Date
    newestFile?: Date
  } {
    const files = this.getAllTempFiles()
    const now = new Date()
    
    const totalSize = files.reduce((sum, file) => sum + file.size, 0)
    const expiredFiles = files.filter(file => now > file.expiresAt).length
    
    const dates = files.map(file => file.createdAt)
    const oldestFile = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : undefined
    const newestFile = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : undefined

    return {
      totalFiles: files.length,
      totalSize,
      expiredFiles,
      oldestFile,
      newestFile
    }
  }

  /**
   * Clean up expired files
   */
  static async cleanupExpiredFiles(): Promise<CleanupStats> {
    const now = new Date()
    const expiredFiles = Array.from(this.tempFiles.values())
      .filter(file => now > file.expiresAt)

    let filesDeleted = 0
    let bytesFreed = 0
    let errors = 0

    for (const file of expiredFiles) {
      try {
        await fs.unlink(file.path)
        bytesFreed += file.size
        filesDeleted++
      } catch (error) {
        errors++
        console.warn(`Failed to delete expired temp file ${file.path}:`, error)
      }
      
      // Remove from memory map regardless
      this.tempFiles.delete(file.id)
    }

    return { filesDeleted, bytesFreed, errors }
  }

  /**
   * Enforce storage limits by deleting oldest files
   */
  private static async enforceStorageLimits(): Promise<void> {
    const stats = this.getStats()
    
    if (stats.totalSize <= this.MAX_TEMP_SIZE) {
      return
    }

    // Sort files by creation date (oldest first)
    const files = this.getAllTempFiles()
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

    let currentSize = stats.totalSize
    
    for (const file of files) {
      if (currentSize <= this.MAX_TEMP_SIZE) {
        break
      }

      try {
        await this.deleteTempFile(file.id)
        currentSize -= file.size
      } catch (error) {
        console.warn(`Failed to delete temp file for size limit:`, error)
      }
    }
  }

  /**
   * Start the cleanup timer
   */
  private static startCleanupTimer(): void {
    if (this.cleanupTimer) {
      return
    }

    this.cleanupTimer = setInterval(async () => {
      try {
        await this.cleanupExpiredFiles()
      } catch (error) {
        console.error('Cleanup timer error:', error)
      }
    }, this.CLEANUP_INTERVAL)

    // Ensure cleanup runs on process exit
    process.on('exit', () => this.stopCleanupTimer())
    process.on('SIGINT', () => this.stopCleanupTimer())
    process.on('SIGTERM', () => this.stopCleanupTimer())
  }

  /**
   * Stop the cleanup timer
   */
  private static stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
  }

  /**
   * Clean up all temporary files (for shutdown)
   */
  static async cleanup(): Promise<CleanupStats> {
    this.stopCleanupTimer()

    const allFiles = this.getAllTempFiles()
    let filesDeleted = 0
    let bytesFreed = 0
    let errors = 0

    for (const file of allFiles) {
      try {
        await fs.unlink(file.path)
        bytesFreed += file.size
        filesDeleted++
      } catch (error) {
        errors++
        console.warn(`Failed to delete temp file during cleanup:`, error)
      }
    }

    // Clear memory map
    this.tempFiles.clear()

    // Try to remove temp directory if empty
    try {
      await fs.rmdir(this.TEMP_DIR)
    } catch {
      // Directory might not be empty or might not exist
    }

    return { filesDeleted, bytesFreed, errors }
  }

  /**
   * Create a temporary ZIP file specifically
   */
  static async createTempZipFile(
    zipBuffer: Buffer,
    filename: string,
    ttl = this.DEFAULT_TTL
  ): Promise<TempFile> {
    const extension = path.extname(filename) || '.zip'
    return this.createTempFile(zipBuffer, extension, ttl)
  }

  /**
   * Get temp file path for serving
   */
  static getTempFilePath(id: string): string | null {
    const tempFile = this.getTempFile(id)
    return tempFile ? tempFile.path : null
  }
}