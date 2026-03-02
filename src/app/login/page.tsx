'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    if (!email || !password) { setError('Please enter your email and password.'); return }
    setLoading(true)
    setError('')

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Check if baker or customer and redirect accordingly
    const { data: { user } } = await supabase.auth.getUser()
    const { data: baker } = await supabase.from('bakers').select('id').eq('user_id', user?.id).single()

if (baker) {
  router.push('/dashboard/baker')
} else {
  router.push('/bakers')
}
  }

  return (
    <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f0eb' }}>
      <div className="w-full max-w-md px-6">

        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold" style={{ color: '#2d1a0e' }}>🎂 Whiskly</Link>
          <p className="text-sm mt-2" style={{ color: '#5c3d2e' }}>Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm">
          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm text-red-700 bg-red-50 border border-red-200">{error}</div>
          )}

          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border text-sm"
                style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full px-4 py-3 rounded-xl border text-sm"
                style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm mt-2"
              style={{ backgroundColor: '#2d1a0e', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: '#5c3d2e' }}>
          Don't have an account?{' '}
          <Link href="/signup" className="font-semibold underline" style={{ color: '#2d1a0e' }}>Create a customer account</Link>
        {' or '}
        <Link href="/join" className="font-semibold underline" style={{ color: '#2d1a0e' }}>join as a baker</Link>
        </p>
      </div>
    </main>
  )
}