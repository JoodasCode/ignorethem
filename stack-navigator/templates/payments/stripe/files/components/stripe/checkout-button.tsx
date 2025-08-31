'use client'

import { useState } from 'react'
import { getStripe } from '@/lib/stripe/client'

interface CheckoutButtonProps {
  priceId: string
  mode?: 'payment' | 'subscription'
  customerId?: string
  trialPeriodDays?: number
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

export function CheckoutButton({
  priceId,
  mode = 'subscription',
  customerId,
  trialPeriodDays,
  children,
  className = '',
  disabled = false,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    if (disabled || loading) return

    setLoading(true)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          mode,
          customerId,
          trialPeriodDays,
        }),
      })

      const { sessionId, error } = await response.json()

      if (error) {
        throw new Error(error)
      }

      const stripe = await getStripe()
      if (!stripe) {
        throw new Error('Stripe failed to load')
      }

      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId,
      })

      if (stripeError) {
        throw stripeError
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={disabled || loading}
      className={`${className} ${
        loading ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {loading ? 'Loading...' : children}
    </button>
  )
}