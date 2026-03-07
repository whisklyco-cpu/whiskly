'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const router = useRouter()
  const [userType, setUserType] = useState<'baker' | 'customer' | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { checkUser() }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: baker } = await supabase.from('bakers').select('id').eq('user_id', user.id).single()
    if (baker) { setUserType('baker'); setLoading(false); return }

    const { data: customer } = await supabase.from('customers').select('id').eq('user_id', user.id).single()
    if (customer) { setUserType('customer'); setLoading(false); return }

    setLoading(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="flex items-center justify-between px-8 py-4 bg-white shadow-sm">
      <Link href="/" className="flex items-center gap-2">
        <span className="text-2xl">🎂</span>
        <span className="text-2xl font-bold" style={{ color: '#2d1a0e' }}>Whiskly</span>
      </Link>

      <div className="flex items-center gap-3">
        <Link href="/bakers" className="text-sm font-medium" style={{ color: '#2d1a0e' }}>
          Browse Bakers
        </Link>

        {!loading && (
          <>
            {userType === 'baker' && (
              <>
                <Link href="/dashboard/baker"
                  className="px-4 py-2 text-sm rounded-lg border font-medium"
                  style={{ borderColor: '#2d1a0e', color: '#2d1a0e' }}>
                  My Dashboard
                </Link>
                <button onClick={handleSignOut}
                  className="px-4 py-2 text-sm rounded-lg text-white font-medium"
                  style={{ backgroundColor: '#2d1a0e' }}>
                  Sign Out
                </button>
              </>
            )}

            {userType === 'customer' && (
              <>
                <Link href="/dashboard/customer"
                  className="px-4 py-2 text-sm rounded-lg border font-medium"
                  style={{ borderColor: '#2d1a0e', color: '#2d1a0e' }}>
                  My Orders
                </Link>
                <button onClick={handleSignOut}
                  className="px-4 py-2 text-sm rounded-lg text-white font-medium"
                  style={{ backgroundColor: '#2d1a0e' }}>
                  Sign Out
                </button>
              </>
            )}

            {userType === null && (
              <>
                <Link href="/login"
                  className="px-4 py-2 text-sm rounded-lg border font-medium"
                  style={{ borderColor: '#2d1a0e', color: '#2d1a0e' }}>
                  Sign In
                </Link>
                <Link href="/join"
                  className="px-4 py-2 text-sm rounded-lg text-white font-medium"
                  style={{ backgroundColor: '#2d1a0e' }}>
                  Get Started
                </Link>
              </>
            )}
          </>
        )}
      </div>
    </nav>
  )
}