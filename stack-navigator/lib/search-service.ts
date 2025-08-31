import { supabase } from './supabase'

export interface SearchFilters {
  categories?: string[]
  technologies?: string[]
  complexity?: ('simple' | 'moderate' | 'complex')[]
  pricingModel?: ('free' | 'freemium' | 'paid')[]
  setupTime?: {
    min?: number
    max?: number
  }
  rating?: {
    min?: number
    max?: number
  }
  tags?: string[]
}

export interface SearchResult {
  id: string
  name: string
  description: string
  category: string
  technologies: string[]
  complexity: 'simple' | 'moderate' | 'complex'
  pricing_model: 'free' | 'freemium' | 'paid'
  setup_time_minutes: number
  rating: number
  rating_count: number
  usage_count: number
  is_featured: boolean
  icon_url?: string
  preview_image_url?: string
  tags: string[]
  created_at: string
  relevance_score?: number
}

export interface SearchOptions {
  query?: string
  filters?: SearchFilters
  sortBy?: 'relevance' | 'popularity' | 'rating' | 'newest' | 'setup_time'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export class SearchService {
  /**
   * Perform full-text search across stacks and templates
   */
  static async searchStacks(options: SearchOptions): Promise<{
    results: SearchResult[]
    total: number
    facets: {
      categories: { name: string; count: number }[]
      technologies: { name: string; count: number }[]
      complexity: { name: string; count: number }[]
      pricingModel: { name: string; count: number }[]
    }
  }> {
    try {
      let query = supabase
        .from('popular_stacks')
        .select(`
          *,
          stack_ratings(rating),
          stack_usage(created_at)
        `)

      // Apply text search
      if (options.query) {
        const searchTerms = options.query.toLowerCase().split(' ').filter(term => term.length > 0)
        
        // Build full-text search query
        const searchQuery = searchTerms.map(term => `'${term}'`).join(' | ')
        
        query = query.or(`
          name.ilike.%${options.query}%,
          description.ilike.%${options.query}%,
          technologies.cs.{${searchTerms.join(',')}},
          category.ilike.%${options.query}%
        `)
      }

      // Apply filters
      if (options.filters) {
        const { filters } = options.filters

        if (filters.categories && filters.categories.length > 0) {
          query = query.in('category', filters.categories)
        }

        if (filters.technologies && filters.technologies.length > 0) {
          // Check if any of the specified technologies are in the technologies array
          const techFilter = filters.technologies.map(tech => `technologies.cs.{${tech}}`).join(',')
          query = query.or(techFilter)
        }

        if (filters.complexity && filters.complexity.length > 0) {
          query = query.in('complexity', filters.complexity)
        }

        if (filters.pricingModel && filters.pricingModel.length > 0) {
          query = query.in('pricing_model', filters.pricingModel)
        }

        if (filters.setupTime) {
          if (filters.setupTime.min !== undefined) {
            query = query.gte('setup_time_minutes', filters.setupTime.min)
          }
          if (filters.setupTime.max !== undefined) {
            query = query.lte('setup_time_minutes', filters.setupTime.max)
          }
        }

        if (filters.rating) {
          if (filters.rating.min !== undefined) {
            query = query.gte('rating', filters.rating.min)
          }
          if (filters.rating.max !== undefined) {
            query = query.lte('rating', filters.rating.max)
          }
        }
      }

      // Apply sorting
      const sortBy = options.sortBy || 'relevance'
      const sortOrder = options.sortOrder || 'desc'

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
        case 'relevance':
        default:
          // For relevance, we'll calculate a score based on multiple factors
          query = query.order('is_featured', { ascending: false })
            .order('rating', { ascending: false })
            .order('usage_count', { ascending: false })
          break
      }

      // Apply pagination
      const limit = options.limit || 20
      const offset = options.offset || 0
      
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) {
        console.error('Search error:', error)
        throw error
      }

      // Calculate relevance scores if searching by relevance
      const results = (data || []).map(item => {
        let relevanceScore = 0

        if (options.query && sortBy === 'relevance') {
          const query = options.query.toLowerCase()
          
          // Name match (highest weight)
          if (item.name.toLowerCase().includes(query)) {
            relevanceScore += 100
          }

          // Description match
          if (item.description.toLowerCase().includes(query)) {
            relevanceScore += 50
          }

          // Technology match
          const techMatches = item.technologies.filter((tech: string) => 
            tech.toLowerCase().includes(query)
          ).length
          relevanceScore += techMatches * 30

          // Category match
          if (item.category.toLowerCase().includes(query)) {
            relevanceScore += 20
          }

          // Boost for featured items
          if (item.is_featured) {
            relevanceScore += 10
          }

          // Boost for high ratings
          relevanceScore += item.rating * 5

          // Boost for popularity
          relevanceScore += Math.log(item.usage_count + 1) * 2
        }

        return {
          ...item,
          relevance_score: relevanceScore,
          tags: item.technologies // Use technologies as tags for now
        }
      })

      // Sort by relevance score if applicable
      if (options.query && sortBy === 'relevance') {
        results.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
      }

      // Get facets for filtering UI
      const facets = await this.getFacets(options.filters)

      return {
        results,
        total: count || 0,
        facets
      }
    } catch (error) {
      console.error('Error in searchStacks:', error)
      throw error
    }
  }

  /**
   * Get search suggestions based on partial query
   */
  static async getSearchSuggestions(query: string, limit = 10): Promise<string[]> {
    try {
      if (!query || query.length < 2) {
        return []
      }

      const { data, error } = await supabase
        .from('popular_stacks')
        .select('name, technologies, category')
        .or(`
          name.ilike.%${query}%,
          technologies.cs.{${query}},
          category.ilike.%${query}%
        `)
        .limit(limit)

      if (error) {
        console.error('Error getting suggestions:', error)
        return []
      }

      const suggestions = new Set<string>()

      data?.forEach(item => {
        // Add matching stack names
        if (item.name.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(item.name)
        }

        // Add matching technologies
        item.technologies.forEach((tech: string) => {
          if (tech.toLowerCase().includes(query.toLowerCase())) {
            suggestions.add(tech)
          }
        })

        // Add matching categories
        if (item.category.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(item.category)
        }
      })

      return Array.from(suggestions).slice(0, limit)
    } catch (error) {
      console.error('Error getting search suggestions:', error)
      return []
    }
  }

  /**
   * Get facets for filtering
   */
  private static async getFacets(currentFilters?: SearchFilters): Promise<{
    categories: { name: string; count: number }[]
    technologies: { name: string; count: number }[]
    complexity: { name: string; count: number }[]
    pricingModel: { name: string; count: number }[]
  }> {
    try {
      // Get category facets
      const { data: categoryData } = await supabase
        .from('popular_stacks')
        .select('category')
        .not('category', 'is', null)

      const categories = this.aggregateFacets(categoryData, 'category')

      // Get technology facets
      const { data: techData } = await supabase
        .from('popular_stacks')
        .select('technologies')

      const allTechnologies: string[] = []
      techData?.forEach(item => {
        if (Array.isArray(item.technologies)) {
          allTechnologies.push(...item.technologies)
        }
      })

      const technologies = this.aggregateFacets(
        allTechnologies.map(tech => ({ technology: tech })),
        'technology'
      )

      // Get complexity facets
      const { data: complexityData } = await supabase
        .from('popular_stacks')
        .select('complexity')
        .not('complexity', 'is', null)

      const complexity = this.aggregateFacets(complexityData, 'complexity')

      // Get pricing model facets
      const { data: pricingData } = await supabase
        .from('popular_stacks')
        .select('pricing_model')
        .not('pricing_model', 'is', null)

      const pricingModel = this.aggregateFacets(pricingData, 'pricing_model')

      return {
        categories,
        technologies: technologies.slice(0, 20), // Limit to top 20 technologies
        complexity,
        pricingModel
      }
    } catch (error) {
      console.error('Error getting facets:', error)
      return {
        categories: [],
        technologies: [],
        complexity: [],
        pricingModel: []
      }
    }
  }

  /**
   * Aggregate facet counts
   */
  private static aggregateFacets(data: any[], field: string): { name: string; count: number }[] {
    const counts = new Map<string, number>()

    data?.forEach(item => {
      const value = item[field]
      if (value) {
        counts.set(value, (counts.get(value) || 0) + 1)
      }
    })

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }

  /**
   * Get popular search terms
   */
  static async getPopularSearchTerms(limit = 10): Promise<string[]> {
    // This would typically come from search analytics
    // For now, return some common terms
    return [
      'Next.js + Supabase',
      'React + Firebase',
      'Node.js + PostgreSQL',
      'TypeScript + Prisma',
      'Stripe + Auth0',
      'Vercel + Tailwind',
      'SaaS starter',
      'E-commerce stack',
      'Real-time chat',
      'Authentication'
    ].slice(0, limit)
  }

  /**
   * Track search query for analytics
   */
  static async trackSearch(query: string, userId?: string, resultsCount?: number): Promise<void> {
    try {
      await supabase
        .from('search_analytics')
        .insert({
          query: query.toLowerCase(),
          user_id: userId,
          results_count: resultsCount,
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error tracking search:', error)
      // Don't throw - analytics shouldn't break search
    }
  }
}