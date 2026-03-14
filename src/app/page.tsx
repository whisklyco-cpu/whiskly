'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

export default function Home() {
  const [loaded, setLoaded] = useState(false)
  const [featuredBaker, setFeaturedBaker] = useState<any>(null)
  const [zip, setZip] = useState('')

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100)
    async function loadFeatured() {
      const { data } = await supabase
        .from('bakers')
        .select('id, business_name, city, state, specialties, profile_photo_url')
        .eq('is_active', true)
        .eq('profile_complete', true)
        .limit(1)
        .maybeSingle()
      setFeaturedBaker(data)
    }
    loadFeatured()
  }, [])

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#f5f0eb' }}>
      <Navbar />

      {/* Hero */}
      <section className="px-5 md:px-16 py-10 md:py-16" style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">

          {/* Left */}
          <div className="w-full md:max-w-xl transition-all duration-700"
            style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(24px)' }}>

            <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-5"
              style={{ backgroundColor: '#e8ddd4', color: '#2d1a0e' }}>
              ✦ The marketplace for custom baked goods
            </div>

            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4"
              style={{ color: '#2d1a0e', letterSpacing: '-0.02em' }}>
              Book bakers with <br />
              <span style={{ color: '#8B4513' }}>confidence.</span>
            </h1>

            <p className="text-base mb-6 leading-relaxed" style={{ color: '#5c3d2e' }}>
              Browse local bakers, see clear pricing, and book in one place. No more Instagram DMs or scattered messages.
            </p>

            {/* Search Bar */}
            <div className="bg-white rounded-2xl p-4 shadow-md mb-5">
              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <input type="text" placeholder="What are you craving?"
                  className="flex-1 px-4 py-3 rounded-xl border text-sm"
                  style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
                <input type="text" placeholder="ZIP code" value={zip} onChange={e => setZip(e.target.value)}
                  className="sm:w-32 px-4 py-3 rounded-xl border text-sm"
                  style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
              </div>
              <Link href="/bakers"
                className="flex items-center justify-center w-full py-3 rounded-xl text-white font-semibold text-sm"
                style={{ backgroundColor: '#2d1a0e' }}>
                Browse Bakers
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex gap-4 text-xs font-medium flex-wrap" style={{ color: '#5c3d2e' }}>
              {['Clear pricing', 'Structured booking', 'Secure payments'].map((badge, i) => (
                <div key={i} className="flex items-center gap-1">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: '#2d1a0e' }}>✓</span>
                  {badge}
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex gap-3 mt-6 flex-wrap">
              <Link href="/bakers" className="px-6 py-3 rounded-xl text-white font-semibold text-sm"
                style={{ backgroundColor: '#2d1a0e' }}>Browse Bakers</Link>
              <Link href="/join" className="px-6 py-3 rounded-xl font-semibold text-sm border"
                style={{ borderColor: '#2d1a0e', color: '#2d1a0e' }}>Become a Baker →</Link>
            </div>

            {/* Stats */}
            <div className="flex gap-6 mt-8 pt-6 border-t" style={{ borderColor: '#e0d5cc' }}>
              {[['100+', 'Orders Placed'], ['25', 'Local Bakers'], ['$12K', 'Revenue Generated']].map(([num, label]) => (
                <div key={label}>
                  <p className="text-xl md:text-2xl font-bold" style={{ color: '#2d1a0e' }}>{num}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Image (hidden on small mobile, shown md+) */}
          <div className="hidden md:block relative flex-shrink-0 transition-all duration-1000"
            style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(32px)', transitionDelay: '200ms' }}>
            <div style={{ animation: 'float 6s ease-in-out infinite' }}>
              <div className="rounded-3xl overflow-hidden shadow-2xl relative" style={{ width: '420px', height: '500px' }}>
                <img src="/hero.jpg" alt="Baker decorating a cake" className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(45,26,14,0.3) 0%, transparent 60%)' }} />
              </div>
            </div>

            {/* Featured Baker Card */}
            {featuredBaker && (
              <div className="absolute bg-white rounded-2xl px-5 py-4 shadow-xl"
                style={{ bottom: '-16px', left: '-32px', animation: 'float 6s ease-in-out infinite', animationDelay: '1s' }}>
                <Link href={'/bakers/' + featuredBaker.id}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: '#f5f0eb' }}>
                      {featuredBaker.profile_photo_url
                        ? <img src={featuredBaker.profile_photo_url} alt="" className="w-full h-full object-cover" />
                        : <span className="text-xl">🎂</span>}
                    </div>
                    <div>
                      <p className="text-xs font-bold" style={{ color: '#2d1a0e' }}>{featuredBaker.business_name}</p>
                      <p className="text-xs" style={{ color: '#5c3d2e' }}>
                        {featuredBaker.specialties?.[0] || 'Custom Cakes'} · {featuredBaker.city}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 mt-2">
                    {[1,2,3,4,5].map(i => <span key={i} className="text-xs" style={{ color: '#f59e0b' }}>★</span>)}
                    <span className="text-xs ml-1" style={{ color: '#5c3d2e' }}>Featured Baker</span>
                  </div>
                </Link>
              </div>
            )}

            {/* Verified badge */}
            <div className="absolute bg-white rounded-2xl px-4 py-3 shadow-xl"
              style={{ top: '-16px', right: '-16px', animation: 'float 6s ease-in-out infinite', animationDelay: '2s', opacity: loaded ? 1 : 0, transition: 'opacity 1s', transitionDelay: '700ms' }}>
              <p className="text-xs font-bold" style={{ color: '#2d1a0e' }}>✓ Verified Platform</p>
              <p className="text-xs" style={{ color: '#5c3d2e' }}>Trusted by local bakers</p>
            </div>
          </div>

          {/* Mobile hero image — simpler, no floating cards */}
          <div className="md:hidden w-full transition-all duration-1000"
            style={{ opacity: loaded ? 1 : 0, transitionDelay: '200ms' }}>
            <div className="rounded-2xl overflow-hidden shadow-xl relative" style={{ height: '260px' }}>
              <img src="/hero.jpg" alt="Baker decorating a cake" className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(45,26,14,0.4) 0%, transparent 60%)' }} />
              {featuredBaker && (
                <Link href={'/bakers/' + featuredBaker.id}
                  className="absolute bottom-4 left-4 bg-white rounded-xl px-4 py-3 shadow-lg flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0" style={{ backgroundColor: '#f5f0eb' }}>
                    {featuredBaker.profile_photo_url
                      ? <img src={featuredBaker.profile_photo_url} alt="" className="w-full h-full object-cover" />
                      : <span className="text-sm flex items-center justify-center h-full">🎂</span>}
                  </div>
                  <div>
                    <p className="text-xs font-bold" style={{ color: '#2d1a0e' }}>{featuredBaker.business_name}</p>
                    <p className="text-xs" style={{ color: '#5c3d2e' }}>{featuredBaker.specialties?.[0] || 'Custom Cakes'} · {featuredBaker.city}</p>
                  </div>
                </Link>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-20" style={{ backgroundColor: 'white' }}>
        <div className="px-5 md:px-16" style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-3" style={{ color: '#2d1a0e' }}>How It Works</h2>
          <p className="text-center mb-10 text-sm" style={{ color: '#5c3d2e' }}>Getting your perfect custom cake is simple.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { num: '01', title: 'Browse & Discover', desc: 'Find local bakers and explore their portfolios.' },
              { num: '02', title: 'Send a Request', desc: 'Share your event details, date, and budget.' },
              { num: '03', title: 'Secure Your Order', desc: 'Pay a deposit through our secure checkout.' },
              { num: '04', title: 'Enjoy Your Cake', desc: 'Pick up your order and celebrate in style.' },
            ].map(step => (
              <div key={step.num} className="text-center p-4 rounded-2xl" style={{ backgroundColor: '#faf8f6' }}>
                <p className="text-2xl md:text-3xl font-bold mb-2" style={{ color: '#e0d5cc' }}>{step.num}</p>
                <p className="font-semibold mb-1 text-sm" style={{ color: '#2d1a0e' }}>{step.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: '#5c3d2e' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Baker CTA */}
      <section className="px-5 md:px-16 py-10 md:py-16" style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div className="rounded-2xl p-8 md:p-12 text-center" style={{ backgroundColor: '#2d1a0e' }}>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-3">Are you a baker?</h2>
          <p className="mb-6 text-sm max-w-md mx-auto" style={{ color: '#c4a882' }}>
            Join Whiskly and reach customers actively looking for custom baked goods in your area.
          </p>
          <Link href="/join" className="inline-block px-8 py-3 rounded-xl font-semibold text-sm"
            style={{ backgroundColor: '#c4a882', color: '#2d1a0e' }}>
            Apply as a Baker
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-5 md:px-16 py-10 md:py-12" style={{ backgroundColor: '#2d1a0e' }}>
        <div className="flex flex-col md:flex-row justify-between gap-8 mb-8" style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div className="max-w-xs">
            <p className="text-xl font-bold text-white mb-2">🎂 Whiskly</p>
            <p className="text-sm" style={{ color: '#c4a882' }}>Book bakers with confidence. Clear pricing. Structured booking.</p>
          </div>
          <div className="flex gap-10 md:gap-16 text-sm flex-wrap">
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
                <Link href="/for-bakers">For Bakers</Link>
                <Link href="/join">Join as Baker</Link>
                <Link href="/login">Sign In</Link>
              </div>
            </div>
            <div>
              <p className="font-semibold text-white mb-3">Legal</p>
              <div className="flex flex-col gap-2" style={{ color: '#c4a882' }}>
                <Link href="/terms">Terms of Service</Link>
                <Link href="/privacy">Privacy Policy</Link>
                <Link href="/faq">FAQ</Link>
              </div>
            </div>
          </div>
        </div>
        <p className="text-sm border-t pt-6" style={{ color: '#c4a882', borderColor: '#4a2e1a', maxWidth: '1280px', margin: '0 auto' }}>
          © 2026 Whiskly. All rights reserved. · Currently in Beta
        </p>
      </footer>

      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </main>
  )
}