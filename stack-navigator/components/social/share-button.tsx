'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Share2, 
  Twitter, 
  Linkedin, 
  Facebook, 
  MessageCircle,
  Link as LinkIcon,
  Copy,
  Check,
  Mail,
  QrCode
} from 'lucide-react'
import { SocialService } from '@/lib/social-service'
import { toast } from 'sonner'

interface ShareButtonProps {
  type: 'project' | 'stack' | 'template'
  title: string
  description?: string
  url?: string
  technologies?: string[]
  onShare?: (platform: string) => void
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  className?: string
}

export function ShareButton({
  type,
  title,
  description,
  url = window.location.href,
  technologies,
  onShare,
  variant = 'outline',
  size = 'default',
  className
}: ShareButtonProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareContent = SocialService.generateShareContent({
    type,
    title,
    description,
    url,
    technologies
  })

  const handleShare = async (platform: string, shareUrl?: string) => {
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400')
    }
    
    onShare?.(platform)
    
    // Track sharing analytics
    try {
      await fetch('/api/analytics/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          platform,
          title,
          url
        })
      })
    } catch (error) {
      console.error('Error tracking share:', error)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Link copied to clipboard!')
      
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Error copying link:', error)
      toast.error('Failed to copy link')
    }
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url
        })
        onShare?.('native')
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error sharing:', error)
        }
      }
    } else {
      setShowDialog(true)
    }
  }

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Check out: ${title}`)
    const body = encodeURIComponent(`${description || ''}\n\n${url}`)
    const emailUrl = `mailto:?subject=${subject}&body=${body}`
    window.location.href = emailUrl
    onShare?.('email')
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size} className={className}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Share this {type}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Native Share (if supported) */}
          {navigator.share && (
            <>
              <DropdownMenuItem onClick={handleNativeShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Share...
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Social Platforms */}
          <DropdownMenuItem onClick={() => handleShare('twitter', shareContent.twitter)}>
            <Twitter className="mr-2 h-4 w-4" />
            Twitter
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleShare('linkedin', shareContent.linkedin)}>
            <Linkedin className="mr-2 h-4 w-4" />
            LinkedIn
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleShare('facebook', shareContent.facebook)}>
            <Facebook className="mr-2 h-4 w-4" />
            Facebook
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleShare('reddit', shareContent.reddit)}>
            <MessageCircle className="mr-2 h-4 w-4" />
            Reddit
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Direct Actions */}
          <DropdownMenuItem onClick={handleEmailShare}>
            <Mail className="mr-2 h-4 w-4" />
            Email
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleCopyLink}>
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4 text-green-500" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy Link
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setShowDialog(true)}>
            <QrCode className="mr-2 h-4 w-4" />
            More Options
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Share Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share {title}</DialogTitle>
            <DialogDescription>
              Choose how you'd like to share this {type}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* URL Input */}
            <div className="space-y-2">
              <Label htmlFor="share-url">Link</Label>
              <div className="flex space-x-2">
                <Input
                  id="share-url"
                  value={url}
                  readOnly
                  className="flex-1"
                />
                <Button size="sm" onClick={handleCopyLink}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Social Media Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => handleShare('twitter', shareContent.twitter)}
                className="justify-start"
              >
                <Twitter className="mr-2 h-4 w-4" />
                Twitter
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleShare('linkedin', shareContent.linkedin)}
                className="justify-start"
              >
                <Linkedin className="mr-2 h-4 w-4" />
                LinkedIn
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleShare('facebook', shareContent.facebook)}
                className="justify-start"
              >
                <Facebook className="mr-2 h-4 w-4" />
                Facebook
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleShare('reddit', shareContent.reddit)}
                className="justify-start"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Reddit
              </Button>
            </div>

            {/* Email Share */}
            <Button
              variant="outline"
              onClick={handleEmailShare}
              className="w-full justify-start"
            >
              <Mail className="mr-2 h-4 w-4" />
              Share via Email
            </Button>

            {/* QR Code (placeholder) */}
            <Alert>
              <QrCode className="h-4 w-4" />
              <AlertDescription>
                QR code sharing coming soon! For now, use the copy link button above.
              </AlertDescription>
            </Alert>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}