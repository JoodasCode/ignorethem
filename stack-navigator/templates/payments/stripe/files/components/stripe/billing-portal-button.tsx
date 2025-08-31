'use client'

import { useState } from 'react'

interface BillingPortalButtonProps {
  customerId: string
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

export function BillingPortalButton({
  customerId,
  children,
  className = '',
  disabled = false,
}: BillingPortalButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleBillingPortal = async () => {
    if (disabled || loading) return

    setLoading(true)

    try {
      const response = await fetch('/api/stripe/billing-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
        }),
      })

      const { url, error } = await response.json()

      if (error) {
        throw new Error(error)
      }

      window.location.href = url
    } catch (error) {
      console.error('Billing portal error:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleBillingPortal}
      disabled={disabled || loading}
      className={`${className} ${
        loading ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {loading ? 'Loading...' : children}
    </button>
  )
}