'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Check, Sparkles, Zap, Loader2 } from 'lucide-react'
import { type UpgradePrompt } from '@/lib/usage-tracking'
import { useSubscription } from '@/hooks/use-subscription'

interface UpgradePromptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prompt: UpgradePrompt
  onUpgrade?: () => void
}

export function UpgradePromptDialog({
  open,
  onOpenChange,
  prompt,
  onUpgrade
}: UpgradePromptDialogProps) {
  const { createCheckoutSession, error } = useSubscription()
  const [isUpgrading, setIsUpgrading] = useState(false)

  const handleUpgrade = async () => {
    setIsUpgrading(true)
    try {
      if (prompt.targetTier === 'starter') {
        await createCheckoutSession('starter')
      }
      if (onUpgrade) {
        await onUpgrade()
      }
    } catch (error) {
      console.error('Upgrade failed:', error)
    } finally {
      setIsUpgrading(false)
    }
  }

  const getIcon = () => {
    switch (prompt.targetTier) {
      case 'starter':
        return <Zap className="h-6 w-6 text-blue-500" />
      case 'pro':
        return <Sparkles className="h-6 w-6 text-purple-500" />
      default:
        return <Zap className="h-6 w-6 text-blue-500" />
    }
  }

  const getGradient = () => {
    switch (prompt.targetTier) {
      case 'starter':
        return 'from-blue-500 to-cyan-500'
      case 'pro':
        return 'from-purple-500 to-pink-500'
      default:
        return 'from-blue-500 to-cyan-500'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
            {getIcon()}
          </div>
          <DialogTitle className="text-xl font-semibold">
            {prompt.title}
          </DialogTitle>
          <DialogDescription className="text-base">
            {prompt.message}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Pricing */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-bold">
                ${prompt.pricing.monthly}
              </span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <Badge 
              variant="secondary" 
              className={`mt-2 bg-gradient-to-r ${getGradient()} text-white`}
            >
              {prompt.targetTier.charAt(0).toUpperCase() + prompt.targetTier.slice(1)} Plan
            </Badge>
          </div>

          {/* Benefits */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              What you'll get:
            </h4>
            <div className="space-y-2">
              {prompt.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={handleUpgrade}
            disabled={isUpgrading}
            className={`w-full bg-gradient-to-r ${getGradient()} hover:opacity-90 text-white`}
          >
            {isUpgrading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isUpgrading ? 'Redirecting to checkout...' : prompt.ctaText}
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface InlineUpgradePromptProps {
  prompt: UpgradePrompt
  onUpgrade?: () => void
  compact?: boolean
}

export function InlineUpgradePrompt({
  prompt,
  onUpgrade,
  compact = false
}: InlineUpgradePromptProps) {
  const { createCheckoutSession } = useSubscription()
  const [isUpgrading, setIsUpgrading] = useState(false)

  const handleUpgrade = async () => {
    setIsUpgrading(true)
    try {
      if (prompt.targetTier === 'starter') {
        await createCheckoutSession('starter')
      }
      if (onUpgrade) {
        await onUpgrade()
      }
    } catch (error) {
      console.error('Upgrade failed:', error)
    } finally {
      setIsUpgrading(false)
    }
  }

  const getGradient = () => {
    switch (prompt.targetTier) {
      case 'starter':
        return 'from-blue-500 to-cyan-500'
      case 'pro':
        return 'from-purple-500 to-pink-500'
      default:
        return 'from-blue-500 to-cyan-500'
    }
  }

  if (compact) {
    return (
      <div className="rounded-lg border border-dashed border-muted-foreground/25 bg-muted/50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">{prompt.title}</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {prompt.message}
            </p>
          </div>
          <Button
            onClick={handleUpgrade}
            disabled={isUpgrading}
            size="sm"
            className={`bg-gradient-to-r ${getGradient()} hover:opacity-90 text-white`}
          >
            {isUpgrading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isUpgrading ? 'Upgrading...' : 'Upgrade'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="text-center space-y-4">
        <div>
          <h3 className="text-lg font-semibold">{prompt.title}</h3>
          <p className="text-muted-foreground mt-2">{prompt.message}</p>
        </div>

        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl font-bold">
            ${prompt.pricing.monthly}
          </span>
          <span className="text-muted-foreground">/month</span>
        </div>

        <div className="space-y-2">
          {prompt.benefits.slice(0, 3).map((benefit, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>

        <Button
          onClick={handleUpgrade}
          disabled={isUpgrading}
          className={`w-full bg-gradient-to-r ${getGradient()} hover:opacity-90 text-white`}
        >
          {isUpgrading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isUpgrading ? 'Redirecting to checkout...' : prompt.ctaText}
        </Button>
      </div>
    </div>
  )
}