import { supabase } from './supabase'

export interface CreateNotificationParams {
  userId: string
  type: 'project_ready' | 'generation_complete' | 'subscription_updated' | 'system_message'
  title: string
  message: string
  data?: Record<string, any>
}

export class NotificationService {
  /**
   * Create a new notification for a user
   */
  static async createNotification(params: CreateNotificationParams): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: params.userId,
          type: params.type,
          title: params.title,
          message: params.message,
          data: params.data || {},
          read: false,
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error creating notification:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error creating notification:', error)
      return false
    }
  }

  /**
   * Notify user when project generation is complete
   */
  static async notifyProjectReady(userId: string, projectName: string, downloadUrl: string, projectId: string): Promise<boolean> {
    return this.createNotification({
      userId,
      type: 'project_ready',
      title: 'Project Ready! 🎉',
      message: `Your project "${projectName}" has been generated and is ready for download.`,
      data: {
        projectId,
        downloadUrl,
        projectName
      }
    })
  }

  /**
   * Notify user when generation process completes (success or failure)
   */
  static async notifyGenerationComplete(userId: string, projectName: string, success: boolean, error?: string): Promise<boolean> {
    if (success) {
      return this.createNotification({
        userId,
        type: 'generation_complete',
        title: 'Generation Complete',
        message: `Successfully generated "${projectName}". Check your dashboard to download.`,
        data: { projectName }
      })
    } else {
      return this.createNotification({
        userId,
        type: 'generation_complete',
        title: 'Generation Failed',
        message: `Failed to generate "${projectName}". ${error || 'Please try again.'}`,
        data: { projectName, error }
      })
    }
  }

  /**
   * Notify user about subscription changes
   */
  static async notifySubscriptionUpdated(userId: string, tier: string, action: 'upgraded' | 'downgraded' | 'cancelled'): Promise<boolean> {
    const messages = {
      upgraded: `Welcome to ${tier.charAt(0).toUpperCase() + tier.slice(1)}! Your new features are now active.`,
      downgraded: `Your subscription has been changed to ${tier}. Some features may be limited.`,
      cancelled: 'Your subscription has been cancelled. You can still use free tier features.'
    }

    return this.createNotification({
      userId,
      type: 'subscription_updated',
      title: 'Subscription Updated',
      message: messages[action],
      data: { tier, action }
    })
  }

  /**
   * Send system-wide notifications
   */
  static async notifySystemMessage(userId: string, title: string, message: string, data?: Record<string, any>): Promise<boolean> {
    return this.createNotification({
      userId,
      type: 'system_message',
      title,
      message,
      data
    })
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', userId)

      if (error) {
        console.error('Error marking notification as read:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error marking notification as read:', error)
      return false
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) {
        console.error('Error marking all notifications as read:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      return false
    }
  }

  /**
   * Get unread notification count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) {
        console.error('Error getting unread count:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('Error getting unread count:', error)
      return 0
    }
  }

  /**
   * Clean up old notifications (older than 30 days)
   */
  static async cleanupOldNotifications(): Promise<boolean> {
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { error } = await supabase
        .from('notifications')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString())

      if (error) {
        console.error('Error cleaning up old notifications:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error cleaning up old notifications:', error)
      return false
    }
  }
}