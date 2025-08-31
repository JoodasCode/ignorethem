'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Sparkles, 
  TrendingUp, 
  Clock, 
  Star, 
  Users, 
  ArrowRight,
  Lightbulb,
  Target
} from 'lucide-react'
import { SearchService, type SearchResult } from '@/lib/search-service'
import { useAuth } from '@/hooks/use-auth'
import Link from 'next/link'

interface SmartRecommendationsProps {
  onStackSelect?: (stack: SearchResult) => void
  className?: string
}

interface RecommendationSection {
  title: string
  description: string
  icon: React.ReactNode
  stacks: SearchResult[]
  type: 'trending' | 'personalized' | 'similar' | 'quick_start'
}

export function SmartRecommendations({ onStackSelect, className }: SmartRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<RecommendationSection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    const loadRecommendations = async () => {
      setIsLoading(true)
      
      try {
        const sections: RecommendationSection[] = []

        // Get trending stacks
        const trendingResults = await SearchService.searchStacks({
          sortBy: 'popularity',
          limit: 6
        })

        if (trendingResults.results.length > 0) {
          sections.push({
            title: 'Trending This Week',
            description: 'Popular stacks that developers are choosing right now',
            icon: <TrendingUp className="h-5 w-5" />,
            stacks: trendingResults.results,
            type: 'trending'
          })
        }

        // Get quick start stacks (low setup time)
        const quickStartResults = await SearchService.searchStacks({
          filters: {
            setupTime: { max: 30 }
          },
          sortBy: 'rating',
          limit: 4
        })

        if (quickStartResults.results.length > 0) {
          sections.push({
            title: 'Quick Start',
            description: 'Get up and running in under 30 minutes',
            icon: <Clock className="h-5 w-5" />,
            stacks: quickStartResults.results,
            type: 'quick_start'
          })
        }

        // Get highly rated stacks
        const topRatedResults = await SearchService.searchStacks({
          filters: {
            rating: { min: 4.5 }
          },
          sortBy: 'rating',
          limit: 4
        })

        if (topRatedResults.results.length > 0) {
          sections.push({
            title: 'Top Rated',
            description: 'Highest rated stacks by the community',
            icon: <Star className="h-5 w-5" />,
            stacks: topRatedResults.results,
            type: 'similar'
          })
        }

        // If user is authenticated, get personalized recommendations
        if (user) {
          // This would typically analyze user's previous projects, searches, etc.
          // For now, we'll show some curated recommendations
          const personalizedResults = await SearchService.searchStacks({
            filters: {
              categories: ['SaaS', 'Web App']
            },
            sortBy: 'relevance',
            limit: 4
          })

          if (personalizedResults.results.length > 0) {
            sections.unshift({
              title: 'Recommended for You',
              description: 'Based on your previous projects and preferences',
              icon: <Target className="h-5 w-5" />,
              stacks: personalizedResults.results,
              type: 'personalized'
            })
          }
        }

        setRecommendations(sections)
      } catch (error) {
        console.error('Error loading recommendations:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadRecommendations()
  }, [user])

  const handleStackClick = (stack: SearchResult) => {
    if (onStackSelect) {
      onStackSelect(stack)
    }
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-green-100 text-green-800'
      case 'moderate': return 'bg-yellow-100 text-yellow-800'
      case 'complex': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPricingColor = (pricing: string) => {
    switch (pricing) {
      case 'free': return 'bg-green-100 text-green-800'
      case 'freemium': return 'bg-blue-100 text-blue-800'
      case 'paid': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className={className}>
        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-6 w-48" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-48" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="space-y-8">
        {recommendations.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                {section.icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold">{section.title}</h3>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.stacks.map((stack) => (
                <Card 
                  key={stack.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleStackClick(stack)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {stack.icon_url && (
                          <img 
                            src={stack.icon_url} 
                            alt={stack.name}
                            className="w-8 h-8 rounded"
                          />
                        )}
                        <div>
                          <CardTitle className="text-base">{stack.name}</CardTitle>
                          {stack.is_featured && (
                            <Badge variant="secondary" className="mt-1">
                              <Sparkles className="w-3 h-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="w-3 h-3 fill-current" />
                        {stack.rating.toFixed(1)}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <CardDescription className="line-clamp-2">
                      {stack.description}
                    </CardDescription>

                    <div className="flex flex-wrap gap-1">
                      {stack.technologies.slice(0, 3).map((tech) => (
                        <Badge key={tech} variant="outline" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                      {stack.technologies.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{stack.technologies.length - 3}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Badge className={getComplexityColor(stack.complexity)}>
                          {stack.complexity}
                        </Badge>
                        <Badge className={getPricingColor(stack.pricing_model)}>
                          {stack.pricing_model}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {stack.setup_time_minutes}m
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="w-3 h-3" />
                        {stack.usage_count.toLocaleString()} uses
                      </div>
                      <Button size="sm" variant="ghost" className="h-auto p-1">
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {section.stacks.length >= 4 && (
              <div className="mt-4 text-center">
                <Button variant="outline" asChild>
                  <Link href={`/browse?category=${section.type}`}>
                    View More {section.title}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        ))}

        {recommendations.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="font-semibold">No recommendations yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Start exploring stacks to get personalized recommendations
                  </p>
                </div>
                <Button asChild>
                  <Link href="/browse">
                    Browse All Stacks
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}