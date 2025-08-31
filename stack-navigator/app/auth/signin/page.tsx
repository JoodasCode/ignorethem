'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthModal } from '@/components/auth/auth-modal'
import { useAuth } from '@/hooks/use-auth'

export default function SignInPage() {
  const [showModal, setShowModal] = useState(true)
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = searchParams.get('redirect_to') || '/dashboard'
      router.push(redirectTo)
    }
  }, [isAuthenticated, router, searchParams])

  const handleClose = () => {
    setShowModal(false)
    router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <AuthModal 
        isOpen={showModal} 
        onClose={handleClose}
        defaultTab="signin"
      />
    </div>
  )
}