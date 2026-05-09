'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!email.trim()) return
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'https://www.whiskly.co/reset-password',
    })
    if (err) {
      setError(err.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#f5f0eb' }}>
      <Navbar />
      <div className="flex items-center justify-center px-5 py-20">
        <div className="bg-white rounded-2xl p-8 shadow-sm w-full max-w-sm">
          {sent ? (
            <div className="text-center">
              <p className="text-4xl mb-4">✉️</p>
              <h1 className="text-xl font-bold mb-2" style={{ color: '#2d1a0e' }}>Check your email</h1>
              <p className="text-sm mb-6" style={{ color: '#5c3d2e' }}>
                We sent a password reset link to <strong>{email}</strong>. Check your inbox and click the link to reset your password.
              </p>
              <p className="text-xs" style={{ color: '#9c7b6b' }}>
                Didn't get it? Check your spam folder or{' '}
                <button onClick={() => setSent(false)} className="underline" style={{ color: '#8B4513' }}>try again</button>.
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-1" style={{ color: '#2d1a0e' }}>Forgot password?</h1>
              <p className="text-sm mb-6" style={{ color: '#5c3d2e' }}>Enter your email and we'll send you a reset link.</p>

              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: '#2d1a0e' }}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl border text-sm"
                    style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
                </div>

                {error && <p className="text-xs" style={{ color: '#dc2626' }}>{error}</p>}

                <button
                  onClick={handleSubmit}
                  disabled={loading || !email.trim()}
                  className="w-full py-3 rounded-xl text-white font-semibold text-sm"
                  style={{ backgroundColor: '#2d1a0e', opacity: (loading || !email.trim()) ? 0.6 : 1 }}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>

                <Link href="/login" className="text-xs text-center underline" style={{ color: '#5c3d2e' }}>
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}