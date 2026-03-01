'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f0eb' }}>
      <div className="bg-white rounded-2xl shadow-sm p-10 w-full max-w-md">
        
        <Link href="/" className="text-2xl font-bold block text-center mb-8" style={{ color: '#2d1a0e' }}>
          Whiskly
        </Link>

        <h1 className="text-2xl font-bold mb-2 text-center" style={{ color: '#2d1a0e' }}>Welcome back</h1>
        <p className="text-sm text-center mb-8" style={{ color: '#5c3d2e' }}>Sign in to your account</p>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm text-red-700 bg-red-50 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#2d1a0e' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 rounded-lg border text-sm"
              style={{ borderColor: '#e0d5cc' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#2d1a0e' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 rounded-lg border text-sm"
              style={{ borderColor: '#e0d5cc' }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg text-white font-semibold mt-2"
            style={{ backgroundColor: '#2d1a0e', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-sm text-center mt-6" style={{ color: '#5c3d2e' }}>
          Don't have an account?{' '}
          <Link href="/join" className="font-semibold underline" style={{ color: '#2d1a0e' }}>
            Join Whiskly
          </Link>
        </p>
      </div>
    </main>
  )
}