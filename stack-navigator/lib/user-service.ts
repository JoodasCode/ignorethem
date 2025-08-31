import { supabase, type User, type Subscription, type UsageTracking } from './supabase'

export class UserService {
  /**
   * Get current user profile
   */
  static async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }

    return data
  }

  /**
   * Create or update user profile after authentication
   */
  static async upsertUserProfile(authUser: any): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0],
        avatar_url: authUser.user_metadata?.avatar_url,
        last_active_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
      .select()
      .single()

    if (error) {
      console.error('Error upserting user profile:', error)
      return null
    }

    return data
  }

  /**
   * Get user's current subscription
   */
  static async getUserSubscription(userId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching subscription:', error)
      return null
    }

    return data
  }

  /**
   * Get user's current usage tracking
   */
  static async getUserUsage(userId: string): Promise<UsageTracking | null> {
    const { data, error } = await supabase
      .rpc('get_current_usage_period', { p_user_id: userId })

    if (error) {
      console.error('Error fetching usage:', error)
      return null
    }

    return data
  }

  /**
   * Check if user can generate a stack
   */
  static async canGenerateStack(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('can_generate_stack', { p_user_id: userId })

    if (error) {
      console.error('Error checking stack generation limit:', error)
      return false
    }

    return data
  }

  /**
   * Check if user can save a conversation
   */
  static async canSaveConversation(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('can_save_conversation', { p_user_id: userId })

    if (error) {
      console.error('Error checking conversation save limit:', error)
      return false
    }

    return data
  }

  /**
   * Check if user can send a message in a conversation
   */
  static async canSendMessage(userId: string, conversationId: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('can_send_message', { 
        p_user_id: userId, 
        p_conversation_id: conversationId 
      })

    if (error) {
      console.error('Error checking message limit:', error)
      return false
    }

    return data
  }

  /**
   * Increment stack generation usage
   */
  static async incrementStackGeneration(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('increment_stack_generation', { p_user_id: userId })

    if (error) {
      console.error('Error incrementing stack generation:', error)
      return false
    }

    return data
  }

  /**
   * Update user's last active timestamp
   */
  static async updateLastActive(userId: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ 
        last_active_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('Error updating last active:', error)
    }
  }

  /**
   * Update user profile information
   */
  static async updateUserProfile(userId: string, updates: {
    name?: string
    avatar_url?: string
    theme?: 'light' | 'dark' | 'system'
    email_notifications?: boolean
  }): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user profile:', error)
      return null
    }

    return data
  }

  /**
   * Get user session with extended information
   */
  static async getUserSession(userId: string): Promise<{
    user: User | null
    subscription: Subscription | null
    usage: UsageTracking | null
    tier: string
  }> {
    const user = await this.getCurrentUser()
    const subscription = user ? await this.getUserSubscription(user.id) : null
    const usage = user ? await this.getUserUsage(user.id) : null
    
    let tier = 'free'
    if (subscription?.status === 'active') {
      tier = subscription.tier
    }

    return {
      user,
      subscription,
      usage,
      tier
    }
  }

  /**
   * Update user preferences (theme, notifications, etc.)
   */
  static async updateUserPreferences(userId: string, preferences: {
    theme?: 'light' | 'dark' | 'system'
    email_notifications?: boolean
  }): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .update(preferences)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user preferences:', error)
      return null
    }

    return data
  }

  /**
   * Get user preferences
   */
  static async getUserPreferences(userId: string): Promise<{
    theme: 'light' | 'dark' | 'system'
    email_notifications: boolean
  } | null> {
    const { data, error } = await supabase
      .from('users')
      .select('theme, email_notifications')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user preferences:', error)
      return null
    }

    return {
      theme: data.theme || 'system',
      email_notifications: data.email_notifications ?? true
    }
  }

  /**
   * Get user dashboard stats
   */
  static async getDashboardStats(userId: string) {
    const { data, error } = await supabase
      .from('user_dashboard_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching dashboard stats:', error)
      return null
    }

    return data
  }
}