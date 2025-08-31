'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Star, 
  Clock, 
  Users, 
  ArrowRight, 
  Sparkles,
  ExternalLink,
  Heart,
  Share2,
  Download
} from 'lucide-react'
import { SearchResult } from '@/lib/search-service'
import Link from 'next/link'

interface SearchResultsProps {
  results: SearchResult[]
  total: number
  isLoading?: boolean
  onStackSelect?: (stack: SearchResult) => void
  onLoadMore?: () => void
  hasMore?: boolean
  className?: string
}

export function SearchResults({ 
  results, 
  total, 
  isLoading = false,
  onStackSelect,
  onLoadMore,
  hasMore = false,
  className 
}: SearchResultsProps) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  const handleStackClick = (stack: SearchResult) => {
    if (onStackSelect) {
      onStackSelect(stack)
    }
  }

  const toggleFavorite = (stackId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(stackId)) {
        newFavorites.delete(stackId)
      } else {
        newFavorites.add(stackId)
      }
      return newFavorites
    })
  }

  const shareStack = (stack: SearchResult, event: React.MouseEvent) => {
    event.stopPropagation()
    if (navigator.share) {
      navigator.share({
        title: stack.name,
        text: stack.description,
        url: window.location.href
      })
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href)
    }
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'moderate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'complex': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const getPricingColor = (pricing: string) => {
    switch (pricing) {
      case 'free': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'freemium': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'paid': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  if (isLoading && results.length === 0) {
    return (
      <div className={className}>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-6xl">🔍</div>
              <div>
                <h3 className="font-semibold text-lg">No results found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search terms or filters
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button variant="outline" size="sm">
                  Clear filters
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/browse">Browse all stacks</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Results Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">
            {total.toLocaleString()} {total === 1 ? 'result' : 'results'}
          </h2>
          <p className="text-sm text-muted-foreground">
            Showing {results.length} of {total} stacks
          </p>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((stack) => (
          <Card 
            key={stack.id} 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 group"
            onClick={() => handleStackClick(stack)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {stack.icon_url && (
                    <img 
                      src={stack.icon_url} 
                      alt={stack.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {stack.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      {stack.is_featured && (
                        <Badge variant="secondary" className="text-xs">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="w-3 h-3 fill-current text-yellow-400" />
                        {stack.rating.toFixed(1)}
                        <span className="text-xs">({stack.rating_count})</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={(e) => toggleFavorite(stack.id, e)}
                  >
                    <Heart 
                      className={`w-4 h-4 ${
                        favorites.has(stack.id) 
                          ? 'fill-current text-red-500' 
                          : 'text-muted-foreground'
                      }`} 
                    />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={(e) => shareStack(stack, e)}
                  >
                    <Share2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <CardDescription className="line-clamp-3">
                {stack.description}
              </CardDescription>

              {/* Technologies */}
              <div className="flex flex-wrap gap-1">
                {stack.technologies.slice(0, 4).map((tech) => (
                  <Badge key={tech} variant="outline" className="text-xs">
                    {tech}
                  </Badge>
                ))}
                {stack.technologies.length > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{stack.technologies.length - 4} more
                  </Badge>
                )}
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <Badge className={getComplexityColor(stack.complexity)}>
                    {stack.complexity}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Badge className={getPricingColor(stack.pricing_model)}>
                    {stack.pricing_model}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {stack.setup_time_minutes}m setup
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="w-3 h-3" />
                  {stack.usage_count.toLocaleString()} uses
                </div>
              </div>

              {/* Relevance Score (if available) */}
              {stack.relevance_score !== undefined && stack.relevance_score > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Sparkles className="w-3 h-3" />
                  {Math.round(stack.relevance_score)}% match
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t">
                <Button size="sm" variant="outline" className="flex-1 mr-2">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Preview
                </Button>
                <Button size="sm" className="flex-1">
                  <Download className="w-3 h-3 mr-1" />
                  Use Stack
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="mt-8 text-center">
          <Button 
            variant="outline" 
            onClick={onLoadMore}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Loading...
              </>
            ) : (
              <>
                Load More Results
                <ArrowRight className="ml-2 w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && results.length > 0 && (
        <div className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}