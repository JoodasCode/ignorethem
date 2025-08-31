'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Star,
  Clock,
  TrendingUp,
  Sparkles,
  Loader2
} from 'lucide-react'
import { SearchService, type SearchFilters, type SearchOptions, type SearchResult } from '@/lib/search-service'
import { useAuth } from '@/hooks/use-auth'
import { useDebounce } from '@/hooks/use-debounce'

interface AdvancedSearchProps {
  onResults?: (results: SearchResult[], total: number) => void
  onLoading?: (loading: boolean) => void
  initialQuery?: string
  className?: string
}

export function AdvancedSearch({ 
  onResults, 
  onLoading, 
  initialQuery = '',
  className 
}: AdvancedSearchProps) {
  const [query, setQuery] = useState(initialQuery)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  
  // Filter states
  const [filters, setFilters] = useState<SearchFilters>({})
  const [sortBy, setSortBy] = useState<'relevance' | 'popularity' | 'rating' | 'newest' | 'setup_time'>('relevance')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Facet data
  const [facets, setFacets] = useState<{
    categories: { name: string; count: number }[]
    technologies: { name: string; count: number }[]
    complexity: { name: string; count: number }[]
    pricingModel: { name: string; count: number }[]
  }>({
    categories: [],
    technologies: [],
    complexity: [],
    pricingModel: []
  })

  const { user } = useAuth()
  const debouncedQuery = useDebounce(query, 300)

  // Search function
  const performSearch = useCallback(async (searchOptions: SearchOptions) => {
    setIsLoading(true)
    onLoading?.(true)

    try {
      const results = await SearchService.searchStacks(searchOptions)
      
      setFacets(results.facets)
      onResults?.(results.results, results.total)

      // Track search for analytics
      if (searchOptions.query) {
        await SearchService.trackSearch(
          searchOptions.query,
          user?.id,
          results.total
        )
      }
    } catch (error) {
      console.error('Search error:', error)
      onResults?.([], 0)
    } finally {
      setIsLoading(false)
      onLoading?.(false)
    }
  }, [onResults, onLoading, user])

  // Get search suggestions
  const getSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([])
      return
    }

    try {
      const suggestions = await SearchService.getSearchSuggestions(searchQuery)
      setSuggestions(suggestions)
    } catch (error) {
      console.error('Error getting suggestions:', error)
      setSuggestions([])
    }
  }, [])

  // Handle search
  useEffect(() => {
    const searchOptions: SearchOptions = {
      query: debouncedQuery || undefined,
      filters,
      sortBy,
      sortOrder,
      limit: 20
    }

    performSearch(searchOptions)
  }, [debouncedQuery, filters, sortBy, sortOrder, performSearch])

  // Handle suggestions
  useEffect(() => {
    if (query && showSuggestions) {
      getSuggestions(query)
    } else {
      setSuggestions([])
    }
  }, [query, showSuggestions, getSuggestions])

  // Filter update helpers
  const updateArrayFilter = (key: keyof SearchFilters, value: string, checked: boolean) => {
    setFilters(prev => {
      const currentArray = (prev[key] as string[]) || []
      const newArray = checked
        ? [...currentArray, value]
        : currentArray.filter(item => item !== value)
      
      return {
        ...prev,
        [key]: newArray.length > 0 ? newArray : undefined
      }
    })
  }

  const updateRangeFilter = (key: 'setupTime' | 'rating', field: 'min' | 'max', value: number) => {
    setFilters(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }))
  }

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.categories?.length) count += filters.categories.length
    if (filters.technologies?.length) count += filters.technologies.length
    if (filters.complexity?.length) count += filters.complexity.length
    if (filters.pricingModel?.length) count += filters.pricingModel.length
    if (filters.setupTime?.min !== undefined || filters.setupTime?.max !== undefined) count += 1
    if (filters.rating?.min !== undefined || filters.rating?.max !== undefined) count += 1
    return count
  }, [filters])

  // Clear all filters
  const clearFilters = () => {
    setFilters({})
  }

  return (
    <div className={className}>
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search stacks, technologies, or categories..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="pl-10 pr-12"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
          )}
        </div>

        {/* Search Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <Card className="absolute top-full left-0 right-0 z-50 mt-1">
            <CardContent className="p-2">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto p-2"
                  onClick={() => {
                    setQuery(suggestion)
                    setShowSuggestions(false)
                  }}
                >
                  <Search className="mr-2 h-3 w-3" />
                  {suggestion}
                </Button>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Search Controls */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFilterCount}
              </Badge>
            )}
          </Button>

          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear all
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Relevance
                </div>
              </SelectItem>
              <SelectItem value="popularity">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Popularity
                </div>
              </SelectItem>
              <SelectItem value="rating">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Rating
                </div>
              </SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="setup_time">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Setup Time
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
            <CardDescription>
              Narrow down your search results
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Categories */}
              <div>
                <h4 className="font-medium mb-3">Categories</h4>
                <ScrollArea className="h-32">
                  <div className="space-y-2">
                    {facets.categories.map((category) => (
                      <div key={category.name} className="flex items-center space-x-2">
                        <Checkbox
                          id={`category-${category.name}`}
                          checked={filters.categories?.includes(category.name) || false}
                          onCheckedChange={(checked) =>
                            updateArrayFilter('categories', category.name, checked as boolean)
                          }
                        />
                        <label
                          htmlFor={`category-${category.name}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                        >
                          {category.name}
                          <span className="text-muted-foreground ml-1">({category.count})</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Technologies */}
              <div>
                <h4 className="font-medium mb-3">Technologies</h4>
                <ScrollArea className="h-32">
                  <div className="space-y-2">
                    {facets.technologies.map((tech) => (
                      <div key={tech.name} className="flex items-center space-x-2">
                        <Checkbox
                          id={`tech-${tech.name}`}
                          checked={filters.technologies?.includes(tech.name) || false}
                          onCheckedChange={(checked) =>
                            updateArrayFilter('technologies', tech.name, checked as boolean)
                          }
                        />
                        <label
                          htmlFor={`tech-${tech.name}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                        >
                          {tech.name}
                          <span className="text-muted-foreground ml-1">({tech.count})</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Complexity */}
              <div>
                <h4 className="font-medium mb-3">Complexity</h4>
                <div className="space-y-2">
                  {facets.complexity.map((complexity) => (
                    <div key={complexity.name} className="flex items-center space-x-2">
                      <Checkbox
                        id={`complexity-${complexity.name}`}
                        checked={filters.complexity?.includes(complexity.name as any) || false}
                        onCheckedChange={(checked) =>
                          updateArrayFilter('complexity', complexity.name, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={`complexity-${complexity.name}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 capitalize"
                      >
                        {complexity.name}
                        <span className="text-muted-foreground ml-1">({complexity.count})</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Model */}
              <div>
                <h4 className="font-medium mb-3">Pricing</h4>
                <div className="space-y-2">
                  {facets.pricingModel.map((pricing) => (
                    <div key={pricing.name} className="flex items-center space-x-2">
                      <Checkbox
                        id={`pricing-${pricing.name}`}
                        checked={filters.pricingModel?.includes(pricing.name as any) || false}
                        onCheckedChange={(checked) =>
                          updateArrayFilter('pricingModel', pricing.name, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={`pricing-${pricing.name}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 capitalize"
                      >
                        {pricing.name}
                        <span className="text-muted-foreground ml-1">({pricing.count})</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            {/* Range Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Setup Time */}
              <div>
                <h4 className="font-medium mb-3">Setup Time (minutes)</h4>
                <div className="space-y-3">
                  <Slider
                    value={[filters.setupTime?.min || 0, filters.setupTime?.max || 240]}
                    onValueChange={([min, max]) => {
                      updateRangeFilter('setupTime', 'min', min)
                      updateRangeFilter('setupTime', 'max', max)
                    }}
                    max={240}
                    step={15}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{filters.setupTime?.min || 0}m</span>
                    <span>{filters.setupTime?.max || 240}m</span>
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div>
                <h4 className="font-medium mb-3">Minimum Rating</h4>
                <div className="space-y-3">
                  <Slider
                    value={[filters.rating?.min || 0]}
                    onValueChange={([min]) => updateRangeFilter('rating', 'min', min)}
                    max={5}
                    step={0.5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>0★</span>
                    <span>{filters.rating?.min || 0}★+</span>
                    <span>5★</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}