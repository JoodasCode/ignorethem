'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Lock, User, Chrome } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: 'signin' | 'signup'
}

export function AuthModal({ isOpen, onClose, defaultTab = 'signin' }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const { signIn, signUp, signInWithMagicLink, signInWithGoogle, isAuthenticated } = useAuth()

  // Close modal when user becomes authenticated and redirect to chat
  React.useEffect(() => {
    if (isAuthenticated && isOpen) {
      setSuccessMessage('Successfully signed in! Taking you to the chat...')
      setTimeout(() => {
        onClose()
        setSuccessMessage(null)
        // Redirect to chat immediately after successful auth
        window.location.href = '/chat'
      }, 1500)
    }
  }, [isAuthenticated, isOpen, onClose])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const { error } = await signIn(email, password)
    
    if (error) {
      setError(error.message)
      setIsLoading(false)
    } else {
      setSuccessMessage('Signing in...')
      // Don't set loading to false here - let the auth state change handle it
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const { error } = await signUp(email, password, name)
    
    if (error) {
      setError(error.message)
      setIsLoading(false)
    } else {
      setError(null)
      setMagicLinkSent(true)
      setIsLoading(false)
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const { error } = await signInWithMagicLink(email)
    
    if (error) {
      setError(error.message)
    } else {
      setMagicLinkSent(true)
    }
    
    setIsLoading(false)
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError(null)

    const { error } = await signInWithGoogle()
    
    if (error) {
      setError(error.message)
      setIsLoading(false)
    } else {
      setSuccessMessage('Redirecting to Google...')
      // Don't set loading to false - the redirect will happen
    }
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setName('')
    setError(null)
    setSuccessMessage(null)
    setMagicLinkSent(false)
    setIsLoading(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (magicLinkSent) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Check your email
            </DialogTitle>
            <DialogDescription>
              We've sent you a magic link to sign in. Check your email and click the link to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Magic link sent to <strong>{email}</strong>
              </AlertDescription>
            </Alert>
            <Button onClick={handleClose} variant="outline">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to Stack Navigator</DialogTitle>
          <DialogDescription>
            Sign in to save your conversations and generate unlimited stacks
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'signin' | 'signup')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {successMessage && (
                <Alert>
                  <AlertDescription className="text-green-600">{successMessage}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <div className="space-y-2">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                disabled={isLoading}
                onClick={handleGoogleSignIn}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Chrome className="mr-2 h-4 w-4" />
                    Continue with Google
                  </>
                )}
              </Button>

              <form onSubmit={handleMagicLink} className="space-y-2">
                <Button type="submit" variant="outline" className="w-full" disabled={isLoading || !email}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Magic Link
                    </>
                  )}
                </Button>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            <Button 
              type="button" 
              variant="outline" 
              className="w-full" 
              disabled={isLoading}
              onClick={handleGoogleSignIn}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing up...
                </>
              ) : (
                <>
                  <Chrome className="mr-2 h-4 w-4" />
                  Continue with Google
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Name</Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {successMessage && (
                <Alert>
                  <AlertDescription className="text-green-600">{successMessage}</AlertDescription>
                </Alert>
              )}

              <div className="text-xs text-muted-foreground">
                ✓ Free forever plan<br />
                ✓ No credit card required<br />
                ✓ 1 free stack generation<br />
                ✓ Save conversations
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <User className="mr-2 h-4 w-4" />
                    Create Free Account
                  </>
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}