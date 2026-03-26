'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import WhisklyLogo from '@/components/WhisklyLogo'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setError('')
    setLoading(true)
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    setLoading(false)
    if (res.ok) {
      router.push('/admin')
    } else {
      const data = await res.json()
      setError(data.error || 'Invalid credentials')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f0eb' }}>
      <div className="bg-white rounded-2xl p-8 shadow-sm w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <WhisklyLogo variant="horizontal" size="md" />
        </div>
        <h1 className="text-xl font-bold mb-1 text-center" style={{ color: '#2d1a0e' }}>Admin Sign In</h1>
        <p className="text-sm mb-6 text-center" style={{ color: '#5c3d2e' }}>Whiskly internal access only</p>

        <div className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Admin email"
            className="w-full px-4 py-3 rounded-xl border text-sm"
            style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }}
          />
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Password"
              className="w-full px-4 py-3 rounded-xl border text-sm"
              style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-xs font-semibold"
              style={{ color: '#5c3d2e' }}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {error && <p className="text-xs" style={{ color: '#dc2626' }}>{error}</p>}
          <button
            onClick={handleLogin}
            disabled={loading || !email || !password}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-50"
            style={{ backgroundColor: '#2d1a0e' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>

        <p className="text-xs text-center mt-5" style={{ color: '#9c7b6b' }}>
          Set <code className="font-mono">ADMIN_EMAIL</code>, <code className="font-mono">ADMIN_PASSWORD_HASH</code>, and <code className="font-mono">JWT_SECRET</code> in your Vercel environment variables.
        </p>
      </div>
    </div>
  )
}
