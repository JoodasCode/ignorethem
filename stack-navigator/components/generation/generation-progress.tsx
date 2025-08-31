'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Download, 
  Clock,
  Package,
  AlertTriangle
} from 'lucide-react'
import { useRealtimeGeneration, type GenerationStatus } from '@/hooks/use-realtime-generation'
import { formatDistanceToNow } from 'date-fns'

interface GenerationProgressProps {
  generationId: string
  onComplete?: (downloadUrl: string) => void
  onError?: (error: string) => void
}

const getStatusIcon = (status: GenerationStatus['status']) => {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4 text-yellow-500" />
    case 'generating':
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-500" />
  }
}

const getStatusBadge = (status: GenerationStatus['status']) => {
  switch (status) {
    case 'pending':
      return <Badge variant="secondary">Pending</Badge>
    case 'generating':
      return <Badge variant="default">Generating</Badge>
    case 'completed':
      return <Badge variant="default" className="bg-green-500">Completed</Badge>
    case 'failed':
      return <Badge variant="destructive">Failed</Badge>
  }
}

export function GenerationProgress({ 
  generationId, 
  onComplete, 
  onError 
}: GenerationProgressProps) {
  const { getGenerationStatus, subscribeToGeneration } = useRealtimeGeneration()
  const generation = getGenerationStatus(generationId)

  useEffect(() => {
    subscribeToGeneration(generationId)
  }, [generationId, subscribeToGeneration])

  useEffect(() => {
    if (generation?.status === 'completed' && generation.download_url && onComplete) {
      onComplete(generation.download_url)
    } else if (generation?.status === 'failed' && generation.error_message && onError) {
      onError(generation.error_message)
    }
  }, [generation?.status, generation?.download_url, generation?.error_message, onComplete, onError])

  if (!generation) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading generation status...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleDownload = () => {
    if (generation.download_url) {
      window.open(generation.download_url, '_blank')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          {generation.project_name}
          {getStatusBadge(generation.status)}
        </CardTitle>
        <CardDescription>
          Started {formatDistanceToNow(new Date(generation.created_at), { addSuffix: true })}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Progress</span>
            <span className="text-muted-foreground">{generation.progress}%</span>
          </div>
          <Progress value={generation.progress} className="h-2" />
        </div>

        {/* Current Step */}
        <div className="flex items-center gap-2">
          {getStatusIcon(generation.status)}
          <span className="text-sm font-medium">
            {generation.current_step || 'Initializing...'}
          </span>
        </div>

        {/* Completed Steps */}
        {generation.steps_completed.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Completed Steps:</h4>
            <div className="space-y-1">
              {generation.steps_completed.map((step, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {generation.status === 'failed' && generation.error_message && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {generation.error_message}
            </AlertDescription>
          </Alert>
        )}

        {/* Download Button */}
        {generation.status === 'completed' && generation.download_url && (
          <Button onClick={handleDownload} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Download Project
          </Button>
        )}

        {/* Retry Button for Failed Generations */}
        {generation.status === 'failed' && (
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  )
}