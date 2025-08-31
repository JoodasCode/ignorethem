'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Completing sign in...')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the auth callback by exchanging the code for a session
        const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href)
        
        if (error) {
          console.error('Auth callback error:', error)
          setStatus('error')
          setMessage(error.message || 'Authentication failed')
          
          // Redirect to home with error after a delay
          setTimeout(() => {
            router.push('/?error=auth_failed')
          }, 2000)
          return
        }

        if (data.session) {
          setStatus('success')
          setMessage('Sign in successful! Redirecting...')
          
          // Successful authentication, redirect to chat to start building
          const redirectTo = searchParams.get('redirect_to') || '/chat'
          
          setTimeout(() => {
            router.push(redirectTo)
          }, 1000)
        } else {
          setStatus('error')
          setMessage('No session created')
          
          setTimeout(() => {
            router.push('/')
          }, 2000)
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        setStatus('error')
        setMessage('An unexpected error occurred')
        
        setTimeout(() => {
          router.push('/?error=auth_error')
        }, 2000)
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
      case 'success':
        return <CheckCircle className="h-8 w-8 mx-auto text-green-500" />
      case 'error':
        return <XCircle className="h-8 w-8 mx-auto text-red-500" />
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4 max-w-md">
        {getIcon()}
        <p className={`text-lg ${
          status === 'success' ? 'text-green-600' : 
          status === 'error' ? 'text-red-600' : 
          'text-muted-foreground'
        }`}>
          {message}
        </p>
        {status === 'error' && (
          <p className="text-sm text-muted-foreground">
            You will be redirected shortly...
          </p>
        )}
      </div>
    </div>
  )
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}