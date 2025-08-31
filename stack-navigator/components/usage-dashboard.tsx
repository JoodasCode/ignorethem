'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Zap, MessageSquare, FolderOpen, Calendar, Sparkles } from 'lucide-react'
import { useUsage } from '@/hooks/use-usage'
import { InlineUpgradePrompt } from './upgrade-prompt'

interface UsageDashboardProps {
  showUpgradePrompts?: boolean
  compact?: boolean
}

export function UsageDashboard({ 
  showUpgradePrompts = true, 
  compact = false 
}: UsageDashboardProps) {
  const {
    tier,
    usageSummary,
    loading,
    error,
    isAtStackLimit,
    isAtConversationLimit,
    resetDate,
    getUpgradePrompt
  } = useUsage()

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-2 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-destructive">
            Failed to load usage data: {error}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!usageSummary) {
    return null
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
      case 'starter':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'pro':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const formatResetDate = (date: Date | null) => {
    if (!date) return null
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    })
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const stackPercentage = usageSummary.stackGenerations.unlimited 
    ? 0 
    : (usageSummary.stackGenerations.used / usageSummary.stackGenerations.limit) * 100

  const conversationPercentage = usageSummary.conversations.unlimited 
    ? 0 
    : (usageSummary.conversations.used / usageSummary.conversations.limit) * 100

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Usage</h3>
          <Badge className={getTierColor(tier)}>
            {tier.charAt(0).toUpperCase() + tier.slice(1)}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Stack Generations
            </span>
            <span className="text-muted-foreground">
              {usageSummary.stackGenerations.unlimited 
                ? `${usageSummary.stackGenerations.used} used`
                : `${usageSummary.stackGenerations.used}/${usageSummary.stackGenerations.limit}`
              }
            </span>
          </div>
          {!usageSummary.stackGenerations.unlimited && (
            <Progress 
              value={stackPercentage} 
              className="h-2"
            />
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Saved Conversations
            </span>
            <span className="text-muted-foreground">
              {usageSummary.conversations.unlimited 
                ? `${usageSummary.conversations.used} saved`
                : `${usageSummary.conversations.used}/${usageSummary.conversations.limit}`
              }
            </span>
          </div>
          {!usageSummary.conversations.unlimited && (
            <Progress 
              value={conversationPercentage} 
              className="h-2"
            />
          )}
        </div>

        {resetDate && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            Resets {formatResetDate(resetDate)}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Usage Overview</CardTitle>
              <CardDescription>
                Your current plan usage and limits
              </CardDescription>
            </div>
            <Badge className={getTierColor(tier)}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)} Plan
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stack Generations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-500" />
                <span className="font-medium">Stack Generations</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {usageSummary.stackGenerations.unlimited 
                  ? `${usageSummary.stackGenerations.used} generated`
                  : `${usageSummary.stackGenerations.used} of ${usageSummary.stackGenerations.limit} used`
                }
              </span>
            </div>
            
            {!usageSummary.stackGenerations.unlimited && (
              <div className="space-y-2">
                <Progress 
                  value={stackPercentage} 
                  className="h-3"
                />
                {stackPercentage >= 80 && (
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    You're running low on stack generations
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Saved Conversations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-green-500" />
                <span className="font-medium">Saved Conversations</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {usageSummary.conversations.unlimited 
                  ? `${usageSummary.conversations.used} saved`
                  : `${usageSummary.conversations.used} of ${usageSummary.conversations.limit} used`
                }
              </span>
            </div>
            
            {!usageSummary.conversations.unlimited && (
              <div className="space-y-2">
                <Progress 
                  value={conversationPercentage} 
                  className="h-3"
                />
                {conversationPercentage >= 80 && (
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    You're running low on saved conversation slots
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Reset Date */}
          {resetDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground border-t pt-4">
              <Calendar className="h-4 w-4" />
              <span>Usage resets on {formatResetDate(resetDate)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade Prompts */}
      {showUpgradePrompts && (
        <div className="space-y-4">
          {isAtStackLimit && (
            <InlineUpgradePrompt
              prompt={getUpgradePrompt('stack')}
              compact
            />
          )}
          
          {isAtConversationLimit && (
            <InlineUpgradePrompt
              prompt={getUpgradePrompt('conversation')}
              compact
            />
          )}
          
          {tier === 'free' && !isAtStackLimit && !isAtConversationLimit && (
            <Card className="border-dashed">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-blue-500" />
                    <div>
                      <h4 className="font-medium">Unlock More Features</h4>
                      <p className="text-sm text-muted-foreground">
                        Get unlimited messages and more stacks with Starter
                      </p>
                    </div>
                  </div>
                  <Button size="sm" className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                    Upgrade
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}