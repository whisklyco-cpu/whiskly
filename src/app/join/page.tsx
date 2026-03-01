'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Join() {
  const router = useRouter()
  const [role, setRole] = useState<'customer' | 'baker'>('customer')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, role }
      }
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (role === 'baker') {
      // Create baker profile
      await supabase.from('bakers').insert({
        user_id: data.user?.id,
        business_name: name,
        email,
      })
      router.push('/dashboard/baker')
    } else {
      router.push('/')
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center py-12" style={{ backgroundColor: '#f5f0eb' }}>
      <div className="bg-white rounded-2xl shadow-sm p-10 w-full max-w-md">
        
        <Link href="/" className="text-2xl font-bold block text-center mb-8" style={{ color: '#2d1a0e' }}>
          Whiskly
        </Link>

        <h1 className="text-2xl font-bold mb-2 text-center" style={{ color: '#2d1a0e' }}>Create your account</h1>
        <p className="text-sm text-center mb-6" style={{ color: '#5c3d2e' }}>Join Whiskly today</p>

        {/* Role Toggle */}
        <div className="flex rounded-lg overflow-hidden border mb-6" style={{ borderColor: '#e0d5cc' }}>
          <button
            onClick={() => setRole('customer')}
            className="flex-1 py-3 text-sm font-semibold transition-colors"
            style={{
              backgroundColor: role === 'customer' ? '#2d1a0e' : 'white',
              color: role === 'customer' ? 'white' : '#2d1a0e'
            }}
          >
            I want to order
          </button>
          <button
            onClick={() => setRole('baker')}
            className="flex-1 py-3 text-sm font-semibold transition-colors"
            style={{
              backgroundColor: role === 'baker' ? '#2d1a0e' : 'white',
              color: role === 'baker' ? 'white' : '#2d1a0e'
            }}
          >
            I'm a baker
          </button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm text-red-700 bg-red-50 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSignUp} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#2d1a0e' }}>
              {role === 'baker' ? 'Business Name' : 'Full Name'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={role === 'baker' ? 'Sweet Creations Bakery' : 'Your name'}
              required
              className="w-full px-4 py-3 rounded-lg border text-sm"
              style={{ borderColor: '#e0d5cc' }}
            />
          </div>
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
              minLength={6}
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
            {loading ? 'Creating account...' : `Join as ${role === 'baker' ? 'a Baker' : 'a Customer'}`}
          </button>
        </form>

        <p className="text-sm text-center mt-6" style={{ color: '#5c3d2e' }}>
          Already have an account?{' '}
          <Link href="/login" className="font-semibold underline" style={{ color: '#2d1a0e' }}>
            Sign In
          </Link>
        </p>
      </div>
    </main>
  )
}