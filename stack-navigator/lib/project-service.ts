import { supabase, type Project } from './supabase'

export interface TechSelections {
  framework?: string
  authentication?: string
  database?: string
  hosting?: string
  payments?: string
  analytics?: string
  email?: string
  monitoring?: string
  [key: string]: any
}

export class ProjectService {
  /**
   * Create a new project
   */
  static async createProject(
    name: string,
    stackSelections: TechSelections,
    userId?: string,
    conversationId?: string,
    description?: string
  ): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        conversation_id: conversationId,
        name,
        description,
        stack_selections: stackSelections,
        generation_status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating project:', error)
      return null
    }

    return data
  }

  /**
   * Get project by ID
   */
  static async getProject(projectId: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (error) {
      console.error('Error fetching project:', error)
      return null
    }

    return data
  }

  /**
   * Get projects for a user
   */
  static async getUserProjects(userId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user projects:', error)
      return []
    }

    return data || []
  }

  /**
   * Update project generation status
   */
  static async updateGenerationStatus(
    projectId: string,
    status: 'pending' | 'generating' | 'completed' | 'failed',
    error?: string
  ): Promise<void> {
    const updates: any = {
      generation_status: status,
      updated_at: new Date().toISOString()
    }

    if (status === 'generating') {
      updates.generation_started_at = new Date().toISOString()
    } else if (status === 'completed') {
      updates.generation_completed_at = new Date().toISOString()
    } else if (status === 'failed' && error) {
      updates.generation_error = error
    }

    const { error: updateError } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)

    if (updateError) {
      console.error('Error updating generation status:', updateError)
    }
  }

  /**
   * Update project file metadata
   */
  static async updateFileMetadata(
    projectId: string,
    zipFileSize: number,
    zipFileUrl?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .update({
        zip_file_size: zipFileSize,
        zip_file_url: zipFileUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)

    if (error) {
      console.error('Error updating file metadata:', error)
    }
  }

  /**
   * Record a project download
   */
  static async recordDownload(
    projectId: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
    downloadSize?: number
  ): Promise<void> {
    const { error } = await supabase
      .from('project_downloads')
      .insert({
        project_id: projectId,
        user_id: userId,
        ip_address: ipAddress,
        user_agent: userAgent,
        download_size: downloadSize
      })

    if (error) {
      console.error('Error recording download:', error)
    }
  }

  /**
   * Update project last accessed timestamp
   */
  static async updateLastAccessed(projectId: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .update({
        last_accessed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)

    if (error) {
      console.error('Error updating last accessed:', error)
    }
  }

  /**
   * Delete a project
   */
  static async deleteProject(projectId: string): Promise<boolean> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (error) {
      console.error('Error deleting project:', error)
      return false
    }

    return true
  }

  /**
   * Get popular technology stacks
   */
  static async getPopularTechnologies() {
    const { data, error } = await supabase
      .from('popular_technologies')
      .select('*')
      .limit(20)

    if (error) {
      console.error('Error fetching popular technologies:', error)
      return []
    }

    return data || []
  }

  /**
   * Get technologies by category
   */
  static async getTechnologiesByCategory(category?: string) {
    let query = supabase
      .from('technologies')
      .select('*')
      .eq('is_active', true)

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query.order('popularity_score', { ascending: false })

    if (error) {
      console.error('Error fetching technologies:', error)
      return []
    }

    return data || []
  }
}