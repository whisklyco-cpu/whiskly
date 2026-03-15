'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

export default function ResetPassword() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    // Supabase handles the token from the URL automatically
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleReset() {
    if (!password || !confirmPassword) return
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) {
      setError(err.message)
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/login'), 2000)
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#f5f0eb' }}>
      <Navbar />
      <div className="flex items-center justify-center px-5 py-20">
        <div className="bg-white rounded-2xl p-8 shadow-sm w-full max-w-sm">
          {success ? (
            <div className="text-center">
              <p className="text-4xl mb-4">✓</p>
              <h1 className="text-xl font-bold mb-2" style={{ color: '#2d1a0e' }}>Password updated!</h1>
              <p className="text-sm" style={{ color: '#5c3d2e' }}>Taking you to sign in...</p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-1" style={{ color: '#2d1a0e' }}>Set new password</h1>
              <p className="text-sm mb-6" style={{ color: '#5c3d2e' }}>Choose a strong password for your account.</p>

              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: '#2d1a0e' }}>New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full px-4 py-3 rounded-xl border text-sm"
                      style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-xs font-semibold"
                      style={{ color: '#5c3d2e' }}>
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: '#2d1a0e' }}>Confirm Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleReset()}
                    placeholder="Repeat your password"
                    className="w-full px-4 py-3 rounded-xl border text-sm"
                    style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
                </div>

                {error && <p className="text-xs" style={{ color: '#dc2626' }}>{error}</p>}

                <button
                  onClick={handleReset}
                  disabled={loading || !password || !confirmPassword}
                  className="w-full py-3 rounded-xl text-white font-semibold text-sm"
                  style={{ backgroundColor: '#2d1a0e', opacity: (loading || !password || !confirmPassword) ? 0.6 : 1 }}>
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}