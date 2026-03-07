'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

export default function Home() {
  const [featuredBakers, setFeaturedBakers] = useState<any[]>([])
  const [zip, setZip] = useState('')

  useEffect(() => {
    async function loadFeatured() {
      const { data } = await supabase
        .from('bakers')
        .select('id, business_name, city, state, specialties, profile_photo_url, starting_price, is_cottage_baker, tier')
        .eq('is_active', true)
        .eq('profile_complete', true)
        .limit(3)
      setFeaturedBakers(data || [])
    }
    loadFeatured()
  }, [])

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#f5f0eb' }}>
      <Navbar />

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #2d1a0e 0%, #5c3d2e 100%)' }} className="px-8 py-24">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm font-semibold mb-4 uppercase tracking-widest" style={{ color: '#c4a882' }}>
            The marketplace for custom baked goods
          </p>
          <h1 className="text-5xl font-bold leading-tight mb-6 text-white">
            Find the perfect baker<br />for your next celebration.
          </h1>
          <p className="text-lg mb-10 max-w-xl mx-auto" style={{ color: '#e0c9b0' }}>
            Browse local bakers, see real pricing, and book with confidence. No more Instagram DMs or chasing quotes.
          </p>

          {/* Search Bar */}
          <div className="flex gap-3 max-w-lg mx-auto">
            <input
              value={zip}
              onChange={e => setZip(e.target.value)}
              placeholder="Enter your ZIP code"
              className="flex-1 px-5 py-3.5 rounded-xl text-sm font-medium"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
            />
            <Link href={'/bakers' + (zip ? '?zip=' + zip : '')}
              className="px-6 py-3.5 rounded-xl font-semibold text-sm whitespace-nowrap"
              style={{ backgroundColor: '#c4a882', color: '#2d1a0e' }}>
              Find Bakers
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-8 mt-10">
            {['Verified Bakers', 'Secure Booking', 'Real Reviews'].map(badge => (
              <div key={badge} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#c4a882' }} />
                <span className="text-sm" style={{ color: '#e0c9b0' }}>{badge}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Bakers */}
      {featuredBakers.length > 0 && (
        <section className="px-8 py-16 max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: '#2d1a0e' }}>Featured Bakers</h2>
              <p className="text-sm mt-1" style={{ color: '#5c3d2e' }}>Talented bakers ready to take your order</p>
            </div>
            <Link href="/bakers" className="text-sm font-semibold underline" style={{ color: '#2d1a0e' }}>
              View all bakers →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {featuredBakers.map(baker => (
              <Link key={baker.id} href={'/bakers/' + baker.id}>
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group">
                  <div className="h-44 overflow-hidden relative" style={{ backgroundColor: '#f5f0eb' }}>
                    {baker.profile_photo_url
                      ? <img src={baker.profile_photo_url} alt={baker.business_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      : <div className="w-full h-full flex items-center justify-center text-5xl">🎂</div>}
                    {baker.tier === 'pro' && (
                      <div className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#2d1a0e', color: 'white' }}>Pro</div>
                    )}
                    {baker.is_cottage_baker && (
                      <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#fef9c3', color: '#854d0e' }}>Cottage</div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold mb-1" style={{ color: '#2d1a0e' }}>{baker.business_name}</h3>
                    <p className="text-xs mb-3" style={{ color: '#5c3d2e' }}>{baker.city}, {baker.state}</p>
                    {baker.specialties?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {baker.specialties.slice(0, 2).map((s: string) => (
                          <span key={s} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#f5f0eb', color: '#2d1a0e' }}>{s}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      {baker.starting_price
                        ? <p className="text-sm font-semibold" style={{ color: '#2d1a0e' }}>From ${baker.starting_price}</p>
                        : <p className="text-sm" style={{ color: '#5c3d2e' }}>Quote based</p>}
                      <span className="text-xs font-semibold" style={{ color: '#8B4513' }}>View Profile →</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="py-16" style={{ backgroundColor: 'white' }}>
        <div className="max-w-5xl mx-auto px-8">
          <h2 className="text-2xl font-bold text-center mb-2" style={{ color: '#2d1a0e' }}>How Whiskly Works</h2>
          <p className="text-center text-sm mb-12" style={{ color: '#5c3d2e' }}>From craving to celebration in four simple steps.</p>
          <div className="grid grid-cols-4 gap-6">
            {[
              { num: '01', title: 'Browse & Discover', desc: 'Find local bakers and explore their portfolios and pricing.' },
              { num: '02', title: 'Send a Request', desc: 'Share your event details, date, and budget directly.' },
              { num: '03', title: 'Secure Your Order', desc: 'Pay a deposit through our secure checkout.' },
              { num: '04', title: 'Enjoy Your Cake', desc: 'Pick up your order and celebrate in style.' },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <p className="text-3xl font-bold mb-3" style={{ color: '#e0d5cc' }}>{step.num}</p>
                <p className="font-semibold mb-2 text-sm" style={{ color: '#2d1a0e' }}>{step.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: '#5c3d2e' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Baker CTA */}
      <section className="px-8 py-16">
        <div className="max-w-4xl mx-auto rounded-2xl p-12 text-center" style={{ backgroundColor: '#2d1a0e' }}>
          <h2 className="text-2xl font-bold text-white mb-3">Are you a baker?</h2>
          <p className="mb-8 text-sm max-w-md mx-auto" style={{ color: '#c4a882' }}>
            Join Whiskly and reach customers who are actively looking for custom baked goods in your area.
          </p>
          <Link href="/join"
            className="inline-block px-8 py-3 rounded-xl font-semibold text-sm"
            style={{ backgroundColor: '#c4a882', color: '#2d1a0e' }}>
            Apply as a Baker
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-12" style={{ backgroundColor: '#2d1a0e' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-8 mb-8">
          <div className="max-w-xs">
            <p className="text-xl font-bold text-white mb-2">🎂 Whiskly</p>
            <p className="text-sm" style={{ color: '#c4a882' }}>The marketplace for custom baked goods. Book with confidence.</p>
          </div>
          <div className="flex gap-16 text-sm">
            <div>
              <p className="font-semibold text-white mb-3">Customers</p>
              <div className="flex flex-col gap-2" style={{ color: '#c4a882' }}>
                <Link href="/bakers">Browse Bakers</Link>
                <Link href="/signup">Create Account</Link>
              </div>
            </div>
            <div>
              <p className="font-semibold text-white mb-3">Bakers</p>
              <div className="flex flex-col gap-2" style={{ color: '#c4a882' }}>
                <Link href="/join">Join as Baker</Link>
                <Link href="/login">Sign In</Link>
              </div>
            </div>
            <div>
              <p className="font-semibold text-white mb-3">Legal</p>
              <div className="flex flex-col gap-2" style={{ color: '#c4a882' }}>
                <Link href="/terms">Terms of Service</Link>
                <Link href="/privacy">Privacy Policy</Link>
              </div>
            </div>
          </div>
        </div>
        <p className="text-sm border-t pt-6 max-w-6xl mx-auto" style={{ color: '#c4a882', borderColor: '#4a2e1a' }}>
          © 2026 Whiskly. All rights reserved.
        </p>
      </footer>
    </main>
  )
}