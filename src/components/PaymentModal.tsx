'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function CheckoutForm({ onSuccess, label }: { onSuccess: () => void, label: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setError(null)

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    })

    if (stripeError) {
      setError(stripeError.message || 'Payment failed. Please try again.')
      setLoading(false)
    } else {
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {error && (
        <div className="mt-3 px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="mt-4 w-full py-3 rounded-xl text-white font-semibold text-sm"
        style={{ backgroundColor: '#2d1a0e', opacity: loading ? 0.7 : 1 }}>
        {loading ? 'Processing...' : label}
      </button>
    </form>
  )
}

interface PaymentModalProps {
  orderId: string
  type: 'deposit' | 'remainder'
  amount: number // in cents
  eventType: string
  bakerName: string
  onClose: () => void
  onSuccess: () => void
}

export function PaymentModal({ orderId, type, amount, eventType, bakerName, onClose, onSuccess }: PaymentModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loadingIntent, setLoadingIntent] = useState(false)
  const [intentError, setIntentError] = useState<string | null>(null)

  async function initializePayment() {
    setLoadingIntent(true)
    setIntentError(null)
    try {
      const endpoint = type === 'deposit' ? '/api/stripe/deposit' : '/api/stripe/remainder'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setClientSecret(data.client_secret)
    } catch (err: any) {
      setIntentError(err.message)
    } finally {
      setLoadingIntent(false)
    }
  }

  // Auto-initialize on mount
  useState(() => {
    initializePayment()
  })

  const dollars = (amount / 100).toFixed(2)
  const label = type === 'deposit' ? `Pay $${dollars} Deposit` : `Pay $${dollars} Remaining Balance`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="font-bold text-lg" style={{ color: '#2d1a0e' }}>
              {type === 'deposit' ? 'Pay Deposit' : 'Pay Remaining Balance'}
            </h3>
            <p className="text-xs mt-1" style={{ color: '#5c3d2e' }}>
              {eventType} · {bakerName}
            </p>
          </div>
          <button onClick={onClose} className="text-sm opacity-50 hover:opacity-100" style={{ color: '#2d1a0e' }}>✕</button>
        </div>

        {/* Amount breakdown */}
        <div className="rounded-xl p-4 mb-5" style={{ backgroundColor: '#f5f0eb' }}>
          <div className="flex justify-between text-sm">
            <span style={{ color: '#5c3d2e' }}>{type === 'deposit' ? '50% deposit' : 'Remaining 50%'}</span>
            <span className="font-bold" style={{ color: '#2d1a0e' }}>${dollars}</span>
          </div>
          {type === 'deposit' && (
            <p className="text-xs mt-2" style={{ color: '#8B4513' }}>
              Remaining balance due 48 hours before your event.
            </p>
          )}
        </div>

        {loadingIntent && (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: '#5c3d2e' }}>Loading payment form...</p>
          </div>
        )}

        {intentError && (
          <div className="px-4 py-3 rounded-xl text-sm mb-4" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>
            {intentError}
            <button onClick={initializePayment} className="ml-2 underline">Try again</button>
          </div>
        )}

        {clientSecret && (
          <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
            <CheckoutForm onSuccess={onSuccess} label={label} />
          </Elements>
        )}

        <p className="text-xs text-center mt-4" style={{ color: '#5c3d2e' }}>
          Secured by Stripe. Whiskly never stores your card details.
        </p>
      </div>
    </div>
  )
}