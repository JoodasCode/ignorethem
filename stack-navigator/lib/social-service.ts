import { supabase } from './supabase'

export interface ProjectShare {
  id: string
  user_id: string
  project_id: string
  share_token: string
  title: string
  description?: string
  stack_config: Record<string, any>
  is_public: boolean
  view_count: number
  like_count: number
  created_at: string
  updated_at: string
}

export interface StackRating {
  id: string
  stack_id: string
  user_id?: string
  rating: number
  review?: string
  helpful_count: number
  created_at: string
}

export interface CommunityTemplate {
  id: string
  user_id: string
  name: string
  description: string
  stack_config: Record<string, any>
  category: string
  tags: string[]
  is_approved: boolean
  download_count: number
  rating: number
  rating_count: number
  created_at: string
  updated_at: string
}

export class SocialService {
  /**
   * Share a project publicly
   */
  static async shareProject(params: {
    userId: string
    projectId: string
    title: string
    description?: string
    stackConfig: Record<string, any>
    isPublic?: boolean
  }): Promise<{ shareToken: string; shareUrl: string } | null> {
    try {
      const shareToken = this.generateShareToken()
      
      const { data, error } = await supabase
        .from('project_shares')
        .insert({
          user_id: params.userId,
          project_id: params.projectId,
          share_token: shareToken,
          title: params.title,
          description: params.description,
          stack_config: params.stackConfig,
          is_public: params.isPublic ?? true,
          view_count: 0,
          like_count: 0
        })
        .select()
        .single()

      if (error) {
        console.error('Error sharing project:', error)
        return null
      }

      const shareUrl = `${window.location.origin}/shared/${shareToken}`
      
      return { shareToken, shareUrl }
    } catch (error) {
      console.error('Error sharing project:', error)
      return null
    }
  }

  /**
   * Get shared project by token
   */
  static async getSharedProject(shareToken: string): Promise<ProjectShare | null> {
    try {
      const { data, error } = await supabase
        .from('project_shares')
        .select(`
          *,
          users(name, avatar_url)
        `)
        .eq('share_token', shareToken)
        .eq('is_public', true)
        .single()

      if (error) {
        console.error('Error getting shared project:', error)
        return null
      }

      // Increment view count
      await supabase
        .from('project_shares')
        .update({ view_count: data.view_count + 1 })
        .eq('id', data.id)

      return data
    } catch (error) {
      console.error('Error getting shared project:', error)
      return null
    }
  }

  /**
   * Like/unlike a shared project
   */
  static async toggleProjectLike(shareToken: string, userId?: string): Promise<boolean> {
    try {
      // Get the project share
      const { data: projectShare, error: getError } = await supabase
        .from('project_shares')
        .select('id, like_count')
        .eq('share_token', shareToken)
        .single()

      if (getError || !projectShare) {
        console.error('Error getting project share:', getError)
        return false
      }

      // Check if user already liked this project
      let hasLiked = false
      if (userId) {
        const { data: existingLike } = await supabase
          .from('project_likes')
          .select('id')
          .eq('project_share_id', projectShare.id)
          .eq('user_id', userId)
          .single()

        hasLiked = !!existingLike
      }

      if (hasLiked) {
        // Unlike
        await supabase
          .from('project_likes')
          .delete()
          .eq('project_share_id', projectShare.id)
          .eq('user_id', userId)

        await supabase
          .from('project_shares')
          .update({ like_count: Math.max(0, projectShare.like_count - 1) })
          .eq('id', projectShare.id)
      } else {
        // Like
        if (userId) {
          await supabase
            .from('project_likes')
            .insert({
              project_share_id: projectShare.id,
              user_id: userId
            })
        }

        await supabase
          .from('project_shares')
          .update({ like_count: projectShare.like_count + 1 })
          .eq('id', projectShare.id)
      }

      return !hasLiked
    } catch (error) {
      console.error('Error toggling project like:', error)
      return false
    }
  }

  /**
   * Rate a stack
   */
  static async rateStack(params: {
    stackId: string
    userId?: string
    rating: number
    review?: string
  }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('stack_ratings')
        .upsert({
          stack_id: params.stackId,
          user_id: params.userId,
          rating: params.rating,
          review: params.review,
          helpful_count: 0
        }, {
          onConflict: 'stack_id,user_id'
        })

      if (error) {
        console.error('Error rating stack:', error)
        return false
      }

      // Update stack average rating
      await this.updateStackRating(params.stackId)

      return true
    } catch (error) {
      console.error('Error rating stack:', error)
      return false
    }
  }

  /**
   * Get stack ratings
   */
  static async getStackRatings(stackId: string, limit = 10): Promise<StackRating[]> {
    try {
      const { data, error } = await supabase
        .from('stack_ratings')
        .select(`
          *,
          users(name, avatar_url)
        `)
        .eq('stack_id', stackId)
        .not('review', 'is', null)
        .order('helpful_count', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error getting stack ratings:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error getting stack ratings:', error)
      return []
    }
  }

  /**
   * Mark rating as helpful
   */
  static async markRatingHelpful(ratingId: string, userId?: string): Promise<boolean> {
    try {
      // Check if user already marked as helpful
      if (userId) {
        const { data: existing } = await supabase
          .from('rating_helpful')
          .select('id')
          .eq('rating_id', ratingId)
          .eq('user_id', userId)
          .single()

        if (existing) {
          return false // Already marked as helpful
        }

        // Add helpful mark
        await supabase
          .from('rating_helpful')
          .insert({
            rating_id: ratingId,
            user_id: userId
          })
      }

      // Increment helpful count
      const { error } = await supabase.rpc('increment_rating_helpful', {
        rating_id: ratingId
      })

      if (error) {
        console.error('Error marking rating as helpful:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error marking rating as helpful:', error)
      return false
    }
  }

  /**
   * Submit community template
   */
  static async submitCommunityTemplate(params: {
    userId: string
    name: string
    description: string
    stackConfig: Record<string, any>
    category: string
    tags: string[]
  }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('community_templates')
        .insert({
          user_id: params.userId,
          name: params.name,
          description: params.description,
          stack_config: params.stackConfig,
          category: params.category,
          tags: params.tags,
          is_approved: false, // Requires moderation
          download_count: 0,
          rating: 0,
          rating_count: 0
        })

      if (error) {
        console.error('Error submitting community template:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error submitting community template:', error)
      return false
    }
  }

  /**
   * Get community templates
   */
  static async getCommunityTemplates(params: {
    category?: string
    tags?: string[]
    limit?: number
    offset?: number
  } = {}): Promise<CommunityTemplate[]> {
    try {
      let query = supabase
        .from('community_templates')
        .select(`
          *,
          users(name, avatar_url)
        `)
        .eq('is_approved', true)

      if (params.category) {
        query = query.eq('category', params.category)
      }

      if (params.tags && params.tags.length > 0) {
        query = query.contains('tags', params.tags)
      }

      query = query
        .order('rating', { ascending: false })
        .order('download_count', { ascending: false })
        .range(params.offset || 0, (params.offset || 0) + (params.limit || 20) - 1)

      const { data, error } = await query

      if (error) {
        console.error('Error getting community templates:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error getting community templates:', error)
      return []
    }
  }

  /**
   * Get popular shared projects
   */
  static async getPopularSharedProjects(limit = 10): Promise<ProjectShare[]> {
    try {
      const { data, error } = await supabase
        .from('project_shares')
        .select(`
          *,
          users(name, avatar_url)
        `)
        .eq('is_public', true)
        .order('like_count', { ascending: false })
        .order('view_count', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error getting popular shared projects:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error getting popular shared projects:', error)
      return []
    }
  }

  /**
   * Generate social media share content
   */
  static generateShareContent(params: {
    type: 'project' | 'stack' | 'template'
    title: string
    description?: string
    url: string
    technologies?: string[]
  }): {
    twitter: string
    linkedin: string
    facebook: string
    reddit: string
  } {
    const { title, description, url, technologies } = params
    const hashtags = technologies?.map(tech => `#${tech.replace(/[^a-zA-Z0-9]/g, '')}`).join(' ') || ''
    
    const twitterText = `Check out this awesome ${params.type}: ${title} ${hashtags} ${url}`
    const linkedinText = `${title}\n\n${description || ''}\n\n${url}`
    const facebookText = `${title}\n\n${description || ''}`
    const redditText = `${title} - ${description || ''}`

    return {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      reddit: `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(redditText)}`
    }
  }

  /**
   * Private helper methods
   */
  private static generateShareToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  private static async updateStackRating(stackId: string): Promise<void> {
    try {
      const { data } = await supabase
        .from('stack_ratings')
        .select('rating')
        .eq('stack_id', stackId)

      if (data && data.length > 0) {
        const avgRating = data.reduce((sum, rating) => sum + rating.rating, 0) / data.length
        const ratingCount = data.length

        await supabase
          .from('popular_stacks')
          .update({
            rating: Math.round(avgRating * 10) / 10,
            rating_count: ratingCount
          })
          .eq('id', stackId)
      }
    } catch (error) {
      console.error('Error updating stack rating:', error)
    }
  }
}