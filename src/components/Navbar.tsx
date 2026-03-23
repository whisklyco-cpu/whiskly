'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import WhisklyLogo from '@/components/WhisklyLogo'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const router = useRouter()
  const [userType, setUserType] = useState<'baker' | 'customer' | null>(null)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => { checkUser() }, [])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setLoading(false); return }

    const { data: baker } = await supabase.from('bakers').select('id').eq('user_id', session.user.id).maybeSingle()
    if (baker) { setUserType('baker'); setLoading(false); return }

    const { data: customer } = await supabase.from('customers').select('id').eq('user_id', session.user.id).maybeSingle()
    if (customer) { setUserType('customer'); setLoading(false); return }

    setLoading(false)
  }

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkUser()
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
    setMenuOpen(false)
  }

  return (
    <nav className="bg-white shadow-sm relative z-50">
      <div className="flex items-center justify-between px-5 md:px-8 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
          <WhisklyLogo variant="horizontal" size="sm" />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/bakers" className="text-sm font-medium" style={{ color: '#2d1a0e' }}>Browse Bakers</Link>
          <Link href="/for-bakers" className="text-sm font-medium" style={{ color: '#2d1a0e' }}>For Bakers</Link>
          <Link href="/faq" className="text-sm font-medium" style={{ color: '#2d1a0e' }}>FAQ</Link>

          {!loading && (
            <>
              {userType === 'baker' && (
                <>
                  <Link href="/dashboard/baker" className="px-4 py-2 text-sm rounded-lg border font-medium" style={{ borderColor: '#2d1a0e', color: '#2d1a0e' }}>My Dashboard</Link>
                  <button onClick={handleSignOut} className="px-4 py-2 text-sm rounded-lg text-white font-medium" style={{ backgroundColor: '#2d1a0e' }}>Sign Out</button>
                </>
              )}
              {userType === 'customer' && (
                <>
                  <Link href="/dashboard/customer" className="px-4 py-2 text-sm rounded-lg border font-medium" style={{ borderColor: '#2d1a0e', color: '#2d1a0e' }}>My Orders</Link>
                  <button onClick={handleSignOut} className="px-4 py-2 text-sm rounded-lg text-white font-medium" style={{ backgroundColor: '#2d1a0e' }}>Sign Out</button>
                </>
              )}
              {userType === null && (
                <>
                  <Link href="/login" className="px-4 py-2 text-sm rounded-lg border font-medium" style={{ borderColor: '#2d1a0e', color: '#2d1a0e' }}>Sign In</Link>
                  <Link href="/join" className="px-4 py-2 text-sm rounded-lg text-white font-medium" style={{ backgroundColor: '#2d1a0e' }}>Get Started</Link>
                </>
              )}
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden flex flex-col gap-1.5 p-2" onClick={() => setMenuOpen(!menuOpen)}>
          <span className="block w-6 h-0.5 transition-all duration-200" style={{ backgroundColor: '#2d1a0e', transform: menuOpen ? 'rotate(45deg) translate(4px, 4px)' : 'none' }} />
          <span className="block w-6 h-0.5 transition-all duration-200" style={{ backgroundColor: '#2d1a0e', opacity: menuOpen ? 0 : 1 }} />
          <span className="block w-6 h-0.5 transition-all duration-200" style={{ backgroundColor: '#2d1a0e', transform: menuOpen ? 'rotate(-45deg) translate(4px, -4px)' : 'none' }} />
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t px-5 py-4 flex flex-col gap-1" style={{ borderColor: '#e0d5cc', backgroundColor: 'white' }}>
          <Link href="/bakers" onClick={() => setMenuOpen(false)} className="text-sm font-medium py-3 border-b" style={{ color: '#2d1a0e', borderColor: '#f5f0eb' }}>Browse Bakers</Link>
          <Link href="/for-bakers" onClick={() => setMenuOpen(false)} className="text-sm font-medium py-3 border-b" style={{ color: '#2d1a0e', borderColor: '#f5f0eb' }}>For Bakers</Link>
          <Link href="/faq" onClick={() => setMenuOpen(false)} className="text-sm font-medium py-3 border-b" style={{ color: '#2d1a0e', borderColor: '#f5f0eb' }}>FAQ</Link>
          <Link href="/contact" className="text-sm font-medium" style={{ color: '#2d1a0e' }}>
  Support
</Link>

          <div className="pt-3 flex flex-col gap-2">
            {!loading && (
              <>
                {userType === 'baker' && (
                  <>
                    <Link href="/dashboard/baker" onClick={() => setMenuOpen(false)} className="w-full text-center px-4 py-3 text-sm rounded-xl border font-semibold" style={{ borderColor: '#2d1a0e', color: '#2d1a0e' }}>My Dashboard</Link>
                    <button onClick={handleSignOut} className="w-full px-4 py-3 text-sm rounded-xl text-white font-semibold" style={{ backgroundColor: '#2d1a0e' }}>Sign Out</button>
                  </>
                )}
                {userType === 'customer' && (
                  <>
                    <Link href="/dashboard/customer" onClick={() => setMenuOpen(false)} className="w-full text-center px-4 py-3 text-sm rounded-xl border font-semibold" style={{ borderColor: '#2d1a0e', color: '#2d1a0e' }}>My Orders</Link>
                    <button onClick={handleSignOut} className="w-full px-4 py-3 text-sm rounded-xl text-white font-semibold" style={{ backgroundColor: '#2d1a0e' }}>Sign Out</button>
                  </>
                )}
                {userType === null && (
                  <>
                    <Link href="/login" onClick={() => setMenuOpen(false)} className="w-full text-center px-4 py-3 text-sm rounded-xl border font-semibold" style={{ borderColor: '#2d1a0e', color: '#2d1a0e' }}>Sign In</Link>
                    <Link href="/join" onClick={() => setMenuOpen(false)} className="w-full text-center px-4 py-3 text-sm rounded-xl text-white font-semibold" style={{ backgroundColor: '#2d1a0e' }}>Get Started</Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}