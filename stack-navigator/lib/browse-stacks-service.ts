import { supabase } from './supabase'

export interface PopularStack {
  id: string
  name: string
  description: string
  category: string
  technologies: string[]
  stack_config: Record<string, any>
  icon_url?: string
  preview_image_url?: string
  usage_count: number
  rating: number
  rating_count: number
  setup_time_minutes: number
  is_featured: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface StackRating {
  id: string
  stack_id: string
  user_id?: string
  rating: number
  review?: string
  created_at: string
}

export interface StackUsage {
  id: string
  stack_id: string
  user_id?: string
  ip_address?: string
  user_agent?: string
  created_at: string
}

export interface BrowseFilters {
  category?: string
  technologies?: string[]
  complexity?: 'simple' | 'medium' | 'complex'
  rating_min?: number
  setup_time_max?: number
  search?: string
}

export interface BrowseOptions {
  limit?: number
  offset?: number
  sort_by?: 'popularity' | 'rating' | 'newest' | 'setup_time'
  sort_order?: 'asc' | 'desc'
}

export class BrowseStacksService {
  /**
   * Get popular stacks with filtering and pagination
   */
  static async getPopularStacks(
    filters: BrowseFilters = {},
    options: BrowseOptions = {}
  ): Promise<{ stacks: PopularStack[]; total: number }> {
    let query = supabase
      .from('popular_stacks')
      .select('*', { count: 'exact' })
      .eq('is_active', true)

    // Apply filters
    if (filters.category) {
      query = query.eq('category', filters.category)
    }

    if (filters.technologies && filters.technologies.length > 0) {
      // Filter stacks that contain any of the specified technologies
      query = query.overlaps('technologies', filters.technologies)
    }

    if (filters.rating_min) {
      query = query.gte('rating', filters.rating_min)
    }

    if (filters.setup_time_max) {
      query = query.lte('setup_time_minutes', filters.setup_time_max)
    }

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    // Apply sorting
    const sortBy = options.sort_by || 'popularity'
    const sortOrder = options.sort_order || 'desc'
    
    switch (sortBy) {
      case 'popularity':
        query = query.order('usage_count', { ascending: sortOrder === 'asc' })
        break
      case 'rating':
        query = query.order('rating', { ascending: sortOrder === 'asc' })
        break
      case 'newest':
        query = query.order('created_at', { ascending: sortOrder === 'asc' })
        break
      case 'setup_time':
        query = query.order('setup_time_minutes', { ascending: sortOrder === 'asc' })
        break
    }

    // Apply pagination
    const limit = options.limit || 20
    const offset = options.offset || 0
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching popular stacks:', error)
      return { stacks: [], total: 0 }
    }

    return { stacks: data || [], total: count || 0 }
  }

  /**
   * Get featured stacks
   */
  static async getFeaturedStacks(limit = 6): Promise<PopularStack[]> {
    const { data, error } = await supabase
      .from('popular_stacks')
      .select('*')
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('usage_count', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching featured stacks:', error)
      return []
    }

    return data || []
  }

  /**
   * Get stack by ID
   */
  static async getStackById(stackId: string): Promise<PopularStack | null> {
    const { data, error } = await supabase
      .from('popular_stacks')
      .select('*')
      .eq('id', stackId)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('Error fetching stack:', error)
      return null
    }

    return data
  }

  /**
   * Get stacks by category
   */
  static async getStacksByCategory(category: string, limit = 10): Promise<PopularStack[]> {
    const { data, error } = await supabase
      .from('popular_stacks')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('usage_count', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching stacks by category:', error)
      return []
    }

    return data || []
  }

  /**
   * Get available categories
   */
  static async getCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('popular_stacks')
      .select('category')
      .eq('is_active', true)
      .order('category')

    if (error) {
      console.error('Error fetching categories:', error)
      return []
    }

    // Get unique categories
    const categories = [...new Set(data?.map(item => item.category) || [])]
    return categories
  }

  /**
   * Search stacks by name or description
   */
  static async searchStacks(
    query: string,
    limit = 20,
    offset = 0
  ): Promise<{ stacks: PopularStack[]; total: number }> {
    const { data, error, count } = await supabase
      .from('popular_stacks')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('usage_count', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error searching stacks:', error)
      return { stacks: [], total: 0 }
    }

    return { stacks: data || [], total: count || 0 }
  }

  /**
   * Record stack usage (when user views or uses a stack)
   */
  static async recordStackUsage(
    stackId: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    // Record the usage event
    const { error: usageError } = await supabase
      .from('stack_usage')
      .insert({
        stack_id: stackId,
        user_id: userId,
        ip_address: ipAddress,
        user_agent: userAgent
      })

    if (usageError) {
      console.error('Error recording stack usage:', usageError)
    }

    // Update the usage count on the stack
    const { error: updateError } = await supabase
      .from('popular_stacks')
      .update({
        usage_count: supabase.raw('usage_count + 1'),
        updated_at: new Date().toISOString()
      })
      .eq('id', stackId)

    if (updateError) {
      console.error('Error updating stack usage count:', updateError)
    }
  }

  /**
   * Rate a stack
   */
  static async rateStack(
    stackId: string,
    rating: number,
    userId?: string,
    review?: string
  ): Promise<boolean> {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5')
    }

    // Insert or update the rating
    const { error: ratingError } = await supabase
      .from('stack_ratings')
      .upsert({
        stack_id: stackId,
        user_id: userId,
        rating,
        review
      }, {
        onConflict: 'stack_id,user_id'
      })

    if (ratingError) {
      console.error('Error saving stack rating:', ratingError)
      return false
    }

    // Recalculate average rating
    await this.updateStackRating(stackId)
    return true
  }

  /**
   * Get stack ratings
   */
  static async getStackRatings(
    stackId: string,
    limit = 10,
    offset = 0
  ): Promise<{ ratings: StackRating[]; total: number }> {
    const { data, error, count } = await supabase
      .from('stack_ratings')
      .select('*', { count: 'exact' })
      .eq('stack_id', stackId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching stack ratings:', error)
      return { ratings: [], total: 0 }
    }

    return { ratings: data || [], total: count || 0 }
  }

  /**
   * Get user's rating for a stack
   */
  static async getUserStackRating(stackId: string, userId: string): Promise<StackRating | null> {
    const { data, error } = await supabase
      .from('stack_ratings')
      .select('*')
      .eq('stack_id', stackId)
      .eq('user_id', userId)
      .single()

    if (error) {
      return null
    }

    return data
  }

  /**
   * Get similar stacks based on technologies
   */
  static async getSimilarStacks(
    stackId: string,
    limit = 5
  ): Promise<PopularStack[]> {
    // First get the current stack to find its technologies
    const currentStack = await this.getStackById(stackId)
    if (!currentStack) return []

    const { data, error } = await supabase
      .from('popular_stacks')
      .select('*')
      .eq('is_active', true)
      .neq('id', stackId)
      .overlaps('technologies', currentStack.technologies)
      .order('usage_count', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching similar stacks:', error)
      return []
    }

    return data || []
  }

  /**
   * Create a project from a popular stack
   */
  static async useStack(
    stackId: string,
    projectName: string,
    userId?: string,
    conversationId?: string
  ): Promise<string | null> {
    const stack = await this.getStackById(stackId)
    if (!stack) {
      throw new Error('Stack not found')
    }

    // Record stack usage
    await this.recordStackUsage(stackId, userId)

    // Create project using the stack configuration
    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        conversation_id: conversationId,
        name: projectName,
        description: `Generated from ${stack.name} stack`,
        stack_selections: stack.stack_config,
        generation_status: 'pending'
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error creating project from stack:', error)
      return null
    }

    return data.id
  }

  /**
   * Update stack rating average (internal method)
   */
  private static async updateStackRating(stackId: string): Promise<void> {
    const { data, error } = await supabase
      .from('stack_ratings')
      .select('rating')
      .eq('stack_id', stackId)

    if (error) {
      console.error('Error fetching ratings for average calculation:', error)
      return
    }

    if (!data || data.length === 0) return

    const ratings = data.map(r => r.rating)
    const averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
    const ratingCount = ratings.length

    const { error: updateError } = await supabase
      .from('popular_stacks')
      .update({
        rating: Math.round(averageRating * 100) / 100, // Round to 2 decimal places
        rating_count: ratingCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', stackId)

    if (updateError) {
      console.error('Error updating stack rating:', updateError)
    }
  }

  /**
   * Get stack analytics/stats
   */
  static async getStackStats(stackId: string): Promise<{
    usage_count: number
    rating: number
    rating_count: number
    recent_usage: number // Usage in last 30 days
  } | null> {
    const stack = await this.getStackById(stackId)
    if (!stack) return null

    // Get recent usage count (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { count: recentUsage } = await supabase
      .from('stack_usage')
      .select('*', { count: 'exact', head: true })
      .eq('stack_id', stackId)
      .gte('created_at', thirtyDaysAgo.toISOString())

    return {
      usage_count: stack.usage_count,
      rating: stack.rating,
      rating_count: stack.rating_count,
      recent_usage: recentUsage || 0
    }
  }
}