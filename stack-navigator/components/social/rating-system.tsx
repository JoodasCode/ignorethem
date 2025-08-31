'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Star, 
  ThumbsUp, 
  MessageSquare, 
  User,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { SocialService, type StackRating } from '@/lib/social-service'
import { useAuth } from '@/hooks/use-auth'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

interface RatingSystemProps {
  stackId: string
  stackName: string
  currentRating?: number
  currentRatingCount?: number
  onRatingUpdate?: (newRating: number, newCount: number) => void
  className?: string
}

export function RatingSystem({
  stackId,
  stackName,
  currentRating = 0,
  currentRatingCount = 0,
  onRatingUpdate,
  className
}: RatingSystemProps) {
  const [ratings, setRatings] = useState<StackRating[]>([])
  const [userRating, setUserRating] = useState(0)
  const [userReview, setUserReview] = useState('')
  const [hoverRating, setHoverRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showReviewForm, setShowReviewForm] = useState(false)
  
  const { user } = useAuth()

  useEffect(() => {
    loadRatings()
  }, [stackId])

  const loadRatings = async () => {
    setIsLoading(true)
    try {
      const ratingsData = await SocialService.getStackRatings(stackId)
      setRatings(ratingsData)

      // Check if user has already rated
      if (user) {
        const existingRating = ratingsData.find(r => r.user_id === user.id)
        if (existingRating) {
          setUserRating(existingRating.rating)
          setUserReview(existingRating.review || '')
        }
      }
    } catch (error) {
      console.error('Error loading ratings:', error)
      toast.error('Failed to load ratings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRatingSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to rate this stack')
      return
    }

    if (userRating === 0) {
      toast.error('Please select a rating')
      return
    }

    setIsSubmitting(true)
    try {
      const success = await SocialService.rateStack({
        stackId,
        userId: user.id,
        rating: userRating,
        review: userReview.trim() || undefined
      })

      if (success) {
        toast.success('Rating submitted successfully!')
        setShowReviewForm(false)
        await loadRatings()
        
        // Update parent component
        onRatingUpdate?.(currentRating, currentRatingCount + 1)
      } else {
        toast.error('Failed to submit rating')
      }
    } catch (error) {
      console.error('Error submitting rating:', error)
      toast.error('Failed to submit rating')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleHelpfulClick = async (ratingId: string) => {
    if (!user) {
      toast.error('Please sign in to mark reviews as helpful')
      return
    }

    try {
      const success = await SocialService.markRatingHelpful(ratingId, user.id)
      if (success) {
        toast.success('Marked as helpful!')
        await loadRatings()
      } else {
        toast.info('You\'ve already marked this as helpful')
      }
    } catch (error) {
      console.error('Error marking as helpful:', error)
      toast.error('Failed to mark as helpful')
    }
  }

  const renderStars = (rating: number, interactive = false, size = 'default') => {
    const starSize = size === 'small' ? 'w-3 h-3' : size === 'large' ? 'w-6 h-6' : 'w-4 h-4'
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} cursor-pointer transition-colors ${
              star <= (interactive ? (hoverRating || userRating) : rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
            onClick={interactive ? () => setUserRating(star) : undefined}
            onMouseEnter={interactive ? () => setHoverRating(star) : undefined}
            onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
          />
        ))}
      </div>
    )
  }

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    ratings.forEach(rating => {
      distribution[rating.rating as keyof typeof distribution]++
    })
    return distribution
  }

  const distribution = getRatingDistribution()
  const totalRatings = ratings.length

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Ratings & Reviews
          </CardTitle>
          <CardDescription>
            See what the community thinks about {stackName}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Overall Rating */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{currentRating.toFixed(1)}</div>
              <div className="flex items-center justify-center mb-1">
                {renderStars(currentRating, false, 'default')}
              </div>
              <div className="text-sm text-muted-foreground">
                {currentRatingCount} {currentRatingCount === 1 ? 'rating' : 'ratings'}
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => (
                <div key={stars} className="flex items-center gap-2 text-sm">
                  <span className="w-8">{stars}★</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{
                        width: totalRatings > 0 ? `${(distribution[stars as keyof typeof distribution] / totalRatings) * 100}%` : '0%'
                      }}
                    />
                  </div>
                  <span className="w-8 text-muted-foreground">
                    {distribution[stars as keyof typeof distribution]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* User Rating Form */}
          {user && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Rate this stack</h4>
                {userRating > 0 && (
                  <Badge variant="secondary">
                    You rated: {userRating}★
                  </Badge>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {renderStars(userRating, true, 'large')}
                  <span className="text-sm text-muted-foreground ml-2">
                    {hoverRating > 0 ? `${hoverRating} star${hoverRating > 1 ? 's' : ''}` : 
                     userRating > 0 ? `${userRating} star${userRating > 1 ? 's' : ''}` : 
                     'Click to rate'}
                  </span>
                </div>

                {(userRating > 0 || showReviewForm) && (
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Write a review (optional)..."
                      value={userReview}
                      onChange={(e) => setUserReview(e.target.value)}
                      className="min-h-20"
                    />
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleRatingSubmit}
                        disabled={isSubmitting || userRating === 0}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          'Submit Rating'
                        )}
                      </Button>
                      {showReviewForm && (
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setShowReviewForm(false)
                            setUserReview('')
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {userRating > 0 && !showReviewForm && !userReview && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowReviewForm(true)}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Add Review
                  </Button>
                )}
              </div>
            </div>
          )}

          {!user && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <a href="/auth/signin" className="underline">Sign in</a> to rate and review this stack.
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          {/* Reviews List */}
          <div className="space-y-4">
            <h4 className="font-medium">Reviews</h4>
            
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/4" />
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : ratings.filter(r => r.review).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No reviews yet. Be the first to review this stack!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {ratings.filter(r => r.review).map((rating) => (
                  <div key={rating.id} className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={(rating as any).users?.avatar_url} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {(rating as any).users?.name || 'Anonymous'}
                          </span>
                          {renderStars(rating.rating, false, 'small')}
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(rating.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        
                        <p className="text-sm">{rating.review}</p>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleHelpfulClick(rating.id)}
                            className="h-auto p-1 text-xs"
                          >
                            <ThumbsUp className="mr-1 h-3 w-3" />
                            Helpful ({rating.helpful_count})
                          </Button>
                        </div>
                      </div>
                    </div>
                    <Separator />
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}