import { supabase } from './supabase'
import { UserService } from './user-service'
import { subscriptionService } from './subscription-service'

export interface DashboardStats {
  totalProjects: number
  totalDownloads: number
  totalConversations: number
  averageGenerationTime: number
  popularTechnologies: Array<{
    name: string
    count: number
    percentage: number
  }>
  recentActivity: Array<{
    type: 'project_created' | 'project_downloaded' | 'conversation_started' | 'subscription_changed'
    description: string
    timestamp: string
  }>
}

export interface ProjectSummary {
  id: string
  name: string
  description?: string
  status: 'pending' | 'generating' | 'completed' | 'failed'
  createdAt: string
  updatedAt: string
  downloadCount: number
  stackTechnologies: string[]
}

export interface ConversationSummary {
  id: string
  title?: string
  phase: string
  status: string
  messageCount: number
  createdAt: string
  updatedAt: string
  hasGeneratedProject: boolean
}

export class DashboardService {
  /**
   * Get comprehensive dashboard data for a user
   */
  static async getDashboardData(userId: string) {
    try {
      const [
        userProfile,
        subscription,
        usage,
        stats,
        recentProjects,
        recentConversations
      ] = await Promise.all([
        UserService.getCurrentUser(),
        subscriptionService.getSubscription(userId),
        UserService.getUserUsage(userId),
        this.getDashboardStats(userId),
        this.getRecentProjects(userId, 5),
        this.getRecentConversations(userId, 5)
      ])

      return {
        user: userProfile,
        subscription: subscription ? {
          tier: subscription.tier,
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd
        } : null,
        usage: usage ? {
          stackGenerationsUsed: usage.stack_generations_used,
          stackGenerationsLimit: usage.stack_generations_limit,
          conversationsSaved: usage.conversations_saved,
          conversationsLimit: usage.conversations_limit,
          messagesUsed: usage.messages_sent,
          messagesLimit: usage.messages_limit,
          periodStart: usage.period_start,
          periodEnd: usage.period_end
        } : null,
        stats,
        recentProjects,
        recentConversations
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      throw new Error('Failed to fetch dashboard data')
    }
  }

  /**
   * Get dashboard statistics for a user
   */
  static async getDashboardStats(userId: string): Promise<DashboardStats> {
    try {
      // Get basic counts
      const [projectsResult, conversationsResult] = await Promise.all([
        supabase
          .from('projects')
          .select('id, download_count, stack_selections, generation_started_at, generation_completed_at')
          .eq('user_id', userId),
        supabase
          .from('conversations')
          .select('id')
          .eq('user_id', userId)
      ])

      const projects = projectsResult.data || []
      const conversations = conversationsResult.data || []

      const totalProjects = projects.length
      const totalDownloads = projects.reduce((sum, p) => sum + (p.download_count || 0), 0)
      const totalConversations = conversations.length

      // Calculate average generation time
      const completedProjects = projects.filter(p => 
        p.generation_started_at && p.generation_completed_at
      )
      
      let averageGenerationTime = 0
      if (completedProjects.length > 0) {
        const totalTime = completedProjects.reduce((sum, p) => {
          const start = new Date(p.generation_started_at!).getTime()
          const end = new Date(p.generation_completed_at!).getTime()
          return sum + (end - start)
        }, 0)
        averageGenerationTime = Math.round(totalTime / completedProjects.length / 1000) // Convert to seconds
      }

      // Get popular technologies from user's projects
      const technologyCounts: Record<string, number> = {}
      projects.forEach(project => {
        if (project.stack_selections) {
          Object.values(project.stack_selections).forEach(tech => {
            if (typeof tech === 'string' && tech !== 'none') {
              technologyCounts[tech] = (technologyCounts[tech] || 0) + 1
            }
          })
        }
      })

      const popularTechnologies = Object.entries(technologyCounts)
        .map(([name, count]) => ({
          name,
          count,
          percentage: Math.round((count / totalProjects) * 100)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Get recent activity
      const recentActivity = await this.getRecentActivity(userId)

      return {
        totalProjects,
        totalDownloads,
        totalConversations,
        averageGenerationTime,
        popularTechnologies,
        recentActivity
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      return {
        totalProjects: 0,
        totalDownloads: 0,
        totalConversations: 0,
        averageGenerationTime: 0,
        popularTechnologies: [],
        recentActivity: []
      }
    }
  }

  /**
   * Get recent projects for a user
   */
  static async getRecentProjects(userId: string, limit: number = 10): Promise<ProjectSummary[]> {
    try {
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(limit)

      return (projects || []).map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.generation_status,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
        downloadCount: project.download_count || 0,
        stackTechnologies: project.stack_selections ? 
          Object.values(project.stack_selections).filter(tech => 
            typeof tech === 'string' && tech !== 'none'
          ) as string[] : []
      }))
    } catch (error) {
      console.error('Error fetching recent projects:', error)
      return []
    }
  }

  /**
   * Get recent conversations for a user
   */
  static async getRecentConversations(userId: string, limit: number = 10): Promise<ConversationSummary[]> {
    try {
      const { data: conversations } = await supabase
        .from('conversations')
        .select(`
          *,
          projects!inner(id)
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(limit)

      return (conversations || []).map(conversation => ({
        id: conversation.id,
        title: conversation.title,
        phase: conversation.phase,
        status: conversation.status,
        messageCount: conversation.message_count || 0,
        createdAt: conversation.created_at,
        updatedAt: conversation.updated_at,
        hasGeneratedProject: conversation.projects && conversation.projects.length > 0
      }))
    } catch (error) {
      console.error('Error fetching recent conversations:', error)
      return []
    }
  }

  /**
   * Get recent activity for a user
   */
  static async getRecentActivity(userId: string, limit: number = 10) {
    try {
      const activities: Array<{
        type: 'project_created' | 'project_downloaded' | 'conversation_started' | 'subscription_changed'
        description: string
        timestamp: string
      }> = []

      // Get recent projects
      const { data: recentProjects } = await supabase
        .from('projects')
        .select('name, created_at, last_downloaded_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)

      recentProjects?.forEach(project => {
        activities.push({
          type: 'project_created',
          description: `Created project "${project.name}"`,
          timestamp: project.created_at
        })

        if (project.last_downloaded_at) {
          activities.push({
            type: 'project_downloaded',
            description: `Downloaded project "${project.name}"`,
            timestamp: project.last_downloaded_at
          })
        }
      })

      // Get recent conversations
      const { data: recentConversations } = await supabase
        .from('conversations')
        .select('title, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)

      recentConversations?.forEach(conversation => {
        activities.push({
          type: 'conversation_started',
          description: `Started conversation${conversation.title ? ` "${conversation.title}"` : ''}`,
          timestamp: conversation.created_at
        })
      })

      // Sort by timestamp and limit
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit)

    } catch (error) {
      console.error('Error fetching recent activity:', error)
      return []
    }
  }

  /**
   * Delete a project and update user stats
   */
  static async deleteProject(userId: string, projectId: string): Promise<boolean> {
    try {
      // Verify ownership
      const { data: project } = await supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('user_id', userId)
        .single()

      if (!project) {
        throw new Error('Project not found or access denied')
      }

      // Delete project
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', userId)

      if (error) {
        throw error
      }

      return true
    } catch (error) {
      console.error('Error deleting project:', error)
      return false
    }
  }

  /**
   * Delete a conversation and update user stats
   */
  static async deleteConversation(userId: string, conversationId: string): Promise<boolean> {
    try {
      // Verify ownership
      const { data: conversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single()

      if (!conversation) {
        throw new Error('Conversation not found or access denied')
      }

      // Delete conversation (messages should cascade)
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', userId)

      if (error) {
        throw error
      }

      return true
    } catch (error) {
      console.error('Error deleting conversation:', error)
      return false
    }
  }

  /**
   * Update conversation title
   */
  static async updateConversationTitle(
    userId: string, 
    conversationId: string, 
    title: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({
          title: title.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId)
        .eq('user_id', userId)

      if (error) {
        throw error
      }

      return true
    } catch (error) {
      console.error('Error updating conversation title:', error)
      return false
    }
  }
}