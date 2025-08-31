import { supabase } from './supabase'
import { templateRegistry } from './template-registry'

export interface Template {
  id: string
  name: string
  slug: string
  description: string
  category: string
  technologies: string[]
  features: string[]
  template_config: Record<string, any>
  preview_files: Record<string, any>
  full_template: Record<string, any>
  setup_time_minutes: number
  complexity: 'simple' | 'medium' | 'complex'
  preview_image_url?: string
  demo_url?: string
  github_url?: string
  usage_count: number
  rating: number
  rating_count: number
  view_count: number
  is_active: boolean
  is_featured: boolean
  is_premium: boolean
  created_at: string
  updated_at: string
}

export interface TemplateFilters {
  category?: string
  complexity?: string
  technologies?: string[]
  is_featured?: boolean
  is_premium?: boolean
  search?: string
}

export interface TemplateSort {
  field: 'name' | 'rating' | 'usage_count' | 'view_count' | 'created_at'
  direction: 'asc' | 'desc'
}

export interface TemplateView {
  template_id: string
  user_id?: string
  ip_address?: string
  user_agent?: string
  referrer?: string
}

export interface TemplateRating {
  template_id: string
  user_id?: string
  rating: number
  review?: string
}

export interface TemplateUsage {
  template_id: string
  user_id?: string
  action: 'view' | 'preview' | 'use' | 'download'
  ip_address?: string
  user_agent?: string
}

export interface TemplateAnalytics {
  total_templates: number
  total_views: number
  total_usage: number
  popular_categories: Array<{ category: string; count: number }>
  popular_technologies: Array<{ technology: string; count: number }>
  recent_activity: Array<{
    template_name: string
    action: string
    count: number
    date: string
  }>
}

/**
 * Templates service for managing template gallery functionality
 */
export class TemplatesService {
  /**
   * Get all templates with optional filtering and sorting
   */
  async getTemplates(
    filters: TemplateFilters = {},
    sort: TemplateSort = { field: 'rating', direction: 'desc' },
    limit = 50,
    offset = 0
  ): Promise<{ templates: Template[]; total: number }> {
    try {
      let query = supabase
        .from('templates')
        .select('*', { count: 'exact' })
        .eq('is_active', true)

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category)
      }

      if (filters.complexity) {
        query = query.eq('complexity', filters.complexity)
      }

      if (filters.is_featured !== undefined) {
        query = query.eq('is_featured', filters.is_featured)
      }

      if (filters.is_premium !== undefined) {
        query = query.eq('is_premium', filters.is_premium)
      }

      if (filters.technologies && filters.technologies.length > 0) {
        // Filter by technologies using JSONB contains
        for (const tech of filters.technologies) {
          query = query.contains('technologies', [tech])
        }
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      // Apply sorting
      query = query.order(sort.field, { ascending: sort.direction === 'asc' })

      // Apply pagination
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching templates:', error)
        throw error
      }

      return {
        templates: data || [],
        total: count || 0
      }
    } catch (error) {
      console.error('Error in getTemplates:', error)
      throw error
    }
  }

  /**
   * Get a single template by ID or slug
   */
  async getTemplate(identifier: string): Promise<Template | null> {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('is_active', true)
        .or(`id.eq.${identifier},slug.eq.${identifier}`)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Template not found
        }
        console.error('Error fetching template:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error in getTemplate:', error)
      throw error
    }
  }

  /**
   * Get featured templates
   */
  async getFeaturedTemplates(limit = 6): Promise<Template[]> {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('rating', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching featured templates:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error in getFeaturedTemplates:', error)
      throw error
    }
  }

  /**
   * Get popular templates by usage count
   */
  async getPopularTemplates(limit = 10): Promise<Template[]> {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('is_active', true)
        .order('usage_count', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching popular templates:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error in getPopularTemplates:', error)
      throw error
    }
  }

  /**
   * Get templates by category
   */
  async getTemplatesByCategory(category: string, limit = 20): Promise<Template[]> {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('is_active', true)
        .eq('category', category)
        .order('rating', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching templates by category:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error in getTemplatesByCategory:', error)
      throw error
    }
  }

  /**
   * Search templates by name, description, or technologies
   */
  async searchTemplates(
    query: string,
    filters: TemplateFilters = {},
    limit = 20
  ): Promise<Template[]> {
    try {
      const { templates } = await this.getTemplates(
        { ...filters, search: query },
        { field: 'rating', direction: 'desc' },
        limit
      )

      return templates
    } catch (error) {
      console.error('Error in searchTemplates:', error)
      throw error
    }
  }

  /**
   * Get template categories with counts
   */
  async getCategories(): Promise<Array<{ category: string; count: number }>> {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('category')
        .eq('is_active', true)

      if (error) {
        console.error('Error fetching categories:', error)
        throw error
      }

      // Count categories
      const categoryCount = (data || []).reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      return Object.entries(categoryCount)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
    } catch (error) {
      console.error('Error in getCategories:', error)
      throw error
    }
  }

  /**
   * Record a template view
   */
  async recordTemplateView(view: TemplateView): Promise<void> {
    try {
      const { error } = await supabase
        .from('template_views')
        .insert([view])

      if (error) {
        console.error('Error recording template view:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in recordTemplateView:', error)
      throw error
    }
  }

  /**
   * Record template usage
   */
  async recordTemplateUsage(usage: TemplateUsage): Promise<void> {
    try {
      const { error } = await supabase
        .from('template_usage')
        .insert([usage])

      if (error) {
        console.error('Error recording template usage:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in recordTemplateUsage:', error)
      throw error
    }
  }

  /**
   * Rate a template
   */
  async rateTemplate(rating: TemplateRating): Promise<void> {
    try {
      const { error } = await supabase
        .from('template_ratings')
        .upsert([rating], { onConflict: 'template_id,user_id' })

      if (error) {
        console.error('Error rating template:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in rateTemplate:', error)
      throw error
    }
  }

  /**
   * Get template ratings
   */
  async getTemplateRatings(templateId: string): Promise<TemplateRating[]> {
    try {
      const { data, error } = await supabase
        .from('template_ratings')
        .select('*')
        .eq('template_id', templateId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching template ratings:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error in getTemplateRatings:', error)
      throw error
    }
  }

  /**
   * Get template preview (limited for free tier)
   */
  async getTemplatePreview(
    templateId: string,
    userTier: 'free' | 'starter' | 'pro' = 'free'
  ): Promise<{ files: Record<string, any>; isLimited: boolean }> {
    try {
      const template = await this.getTemplate(templateId)
      if (!template) {
        throw new Error('Template not found')
      }

      // Free tier gets limited preview, paid tiers get full preview
      if (userTier === 'free' && template.is_premium) {
        return {
          files: template.preview_files || {},
          isLimited: true
        }
      }

      return {
        files: template.full_template || {},
        isLimited: false
      }
    } catch (error) {
      console.error('Error in getTemplatePreview:', error)
      throw error
    }
  }

  /**
   * Get template analytics
   */
  async getTemplateAnalytics(): Promise<TemplateAnalytics> {
    try {
      // Get total templates
      const { count: totalTemplates } = await supabase
        .from('templates')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      // Get total views
      const { count: totalViews } = await supabase
        .from('template_views')
        .select('*', { count: 'exact', head: true })

      // Get total usage
      const { count: totalUsage } = await supabase
        .from('template_usage')
        .select('*', { count: 'exact', head: true })

      // Get popular categories
      const { data: categoryData } = await supabase
        .from('templates')
        .select('category')
        .eq('is_active', true)

      const categoryCount = (categoryData || []).reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const popularCategories = Object.entries(categoryCount)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Get popular technologies
      const { data: techData } = await supabase
        .from('templates')
        .select('technologies')
        .eq('is_active', true)

      const techCount = (techData || []).reduce((acc, item) => {
        const technologies = item.technologies || []
        technologies.forEach((tech: string) => {
          acc[tech] = (acc[tech] || 0) + 1
        })
        return acc
      }, {} as Record<string, number>)

      const popularTechnologies = Object.entries(techCount)
        .map(([technology, count]) => ({ technology, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      // Get recent activity (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { data: activityData } = await supabase
        .from('template_usage')
        .select(`
          action,
          created_at,
          templates!inner(name)
        `)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })

      const activityCount = (activityData || []).reduce((acc, item) => {
        const key = `${item.templates.name}-${item.action}`
        const date = new Date(item.created_at).toISOString().split('T')[0]
        
        if (!acc[key]) {
          acc[key] = {
            template_name: item.templates.name,
            action: item.action,
            count: 0,
            date
          }
        }
        acc[key].count++
        return acc
      }, {} as Record<string, any>)

      const recentActivity = Object.values(activityCount)
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 10)

      return {
        total_templates: totalTemplates || 0,
        total_views: totalViews || 0,
        total_usage: totalUsage || 0,
        popular_categories: popularCategories,
        popular_technologies: popularTechnologies,
        recent_activity: recentActivity as any
      }
    } catch (error) {
      console.error('Error in getTemplateAnalytics:', error)
      throw error
    }
  }

  /**
   * Sync file system templates to database
   */
  async syncTemplatesFromFileSystem(): Promise<void> {
    try {
      // Initialize template registry
      await templateRegistry.initialize()
      
      // Get all templates from file system
      const fsTemplates = templateRegistry.getAllTemplates()

      for (const fsTemplate of fsTemplates) {
        // Convert file system template to database format
        const dbTemplate = {
          name: fsTemplate.metadata.name,
          slug: fsTemplate.metadata.id,
          description: fsTemplate.metadata.description,
          category: fsTemplate.metadata.category,
          technologies: this.extractTechnologies(fsTemplate),
          features: this.extractFeatures(fsTemplate),
          template_config: fsTemplate.metadata,
          preview_files: this.extractPreviewFiles(fsTemplate),
          full_template: this.extractFullTemplate(fsTemplate),
          setup_time_minutes: fsTemplate.metadata.setupTime || 15,
          complexity: this.mapComplexity(fsTemplate.metadata.complexity),
          is_premium: fsTemplate.metadata.pricing === 'paid'
        }

        // Upsert template
        const { error } = await supabase
          .from('templates')
          .upsert([dbTemplate], { onConflict: 'slug' })

        if (error) {
          console.error(`Error syncing template ${fsTemplate.metadata.id}:`, error)
        }
      }

      console.log(`Synced ${fsTemplates.length} templates from file system`)
    } catch (error) {
      console.error('Error in syncTemplatesFromFileSystem:', error)
      throw error
    }
  }

  private extractTechnologies(template: any): string[] {
    const technologies = []
    
    // Extract from metadata
    if (template.metadata.category) {
      technologies.push(template.metadata.category)
    }
    
    // Extract from dependencies
    if (template.packageDependencies) {
      Object.keys(template.packageDependencies).forEach(dep => {
        technologies.push(dep)
      })
    }

    return [...new Set(technologies)]
  }

  private extractFeatures(template: any): string[] {
    const features = []
    
    // Extract from metadata tags
    if (template.metadata.tags) {
      features.push(...template.metadata.tags)
    }

    // Extract from setup instructions
    if (template.setupInstructions) {
      template.setupInstructions.forEach((instruction: any) => {
        if (instruction.category) {
          features.push(instruction.category)
        }
      })
    }

    return [...new Set(features)]
  }

  private extractPreviewFiles(template: any): Record<string, any> {
    const previewFiles: Record<string, any> = {}
    
    // Get key files for preview (limit to important ones)
    const keyFiles = ['package.json', 'README.md', 'app/page.tsx', 'lib/auth.ts']
    
    if (template.files) {
      template.files.forEach((file: any) => {
        if (keyFiles.some(key => file.path.includes(key))) {
          previewFiles[file.path] = {
            content: file.content.substring(0, 1000), // Limit content for preview
            path: file.path
          }
        }
      })
    }

    return previewFiles
  }

  private extractFullTemplate(template: any): Record<string, any> {
    const fullTemplate: Record<string, any> = {}
    
    if (template.files) {
      template.files.forEach((file: any) => {
        fullTemplate[file.path] = {
          content: file.content,
          path: file.path,
          executable: file.executable || false
        }
      })
    }

    return fullTemplate
  }

  private mapComplexity(complexity: string): 'simple' | 'medium' | 'complex' {
    switch (complexity) {
      case 'simple':
        return 'simple'
      case 'complex':
        return 'complex'
      default:
        return 'medium'
    }
  }
}

// Singleton instance
export const templatesService = new TemplatesService()