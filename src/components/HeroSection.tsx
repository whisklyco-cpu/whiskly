'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type FeaturedBaker = {
  id: string
  business_name: string
  city: string
  state: string
  specialties: string[]
  profile_photo_url: string | null
}

export default function HeroSection({ featuredBaker }: { featuredBaker: FeaturedBaker | null }) {
  const [loaded, setLoaded] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100)

    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section className="flex flex-col md:flex-row items-center justify-between px-16 py-16 gap-12 max-w-7xl mx-auto">

      {/* Left */}
      <div
        className="max-w-xl transition-all duration-700"
        style={{
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'translateY(0)' : 'translateY(24px)'
        }}
      >
        <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-6" style={{ backgroundColor: '#e8ddd4', color: '#2d1a0e' }}>
          ✦ The marketplace for custom baked goods
        </div>

        <h1 className="text-5xl font-bold leading-tight mb-5" style={{ color: '#2d1a0e', letterSpacing: '-0.02em' }}>
          Book bakers with <br />
          <span style={{ color: '#8B4513' }}>confidence.</span>
        </h1>

        <p className="text-base mb-8 leading-relaxed" style={{ color: '#5c3d2e' }}>
          Browse local bakers, see clear pricing, and book in one place. No more Instagram DMs or scattered messages.
        </p>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl p-5 shadow-md mb-6">
          <div className="flex gap-3 mb-3">
            <input
              type="text"
              placeholder="What are you craving?"
              className="flex-1 px-4 py-3 rounded-xl border text-sm"
              style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }}
            />
            <input
              type="text"
              placeholder="ZIP code"
              className="w-32 px-4 py-3 rounded-xl border text-sm"
              style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }}
            />
          </div>
          <Link href="/bakers" className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white font-semibold text-sm" style={{ backgroundColor: '#2d1a0e' }}>
            🔍 Browse bakers
          </Link>
        </div>

        {/* Trust badges */}
        <div className="flex gap-6 text-xs font-medium" style={{ color: '#5c3d2e' }}>
          <div className="flex items-center gap-1">
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs" style={{ backgroundColor: '#2d1a0e' }}>$</span>
            Clear pricing
          </div>
          <div className="flex items-center gap-1">
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs" style={{ backgroundColor: '#2d1a0e' }}>✓</span>
            Structured booking
          </div>
          <div className="flex items-center gap-1">
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs" style={{ backgroundColor: '#2d1a0e' }}>🔒</span>
            Stripe payments
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-4 mt-8">
          <Link href="/bakers" className="px-6 py-3 rounded-xl text-white font-semibold text-sm shadow-sm" style={{ backgroundColor: '#2d1a0e' }}>
            Browse bakers
          </Link>
          <Link href="/join" className="px-6 py-3 rounded-xl font-semibold text-sm border" style={{ borderColor: '#2d1a0e', color: '#2d1a0e' }}>
            Become a baker →
          </Link>
        </div>

        {/* Stats */}
        <div className="flex gap-8 mt-10 pt-8 border-t" style={{ borderColor: '#e0d5cc' }}>
          <div>
            <p className="text-2xl font-bold" style={{ color: '#2d1a0e' }}>100+</p>
            <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>Orders Placed</p>
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: '#2d1a0e' }}>25</p>
            <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>Local Bakers</p>
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: '#2d1a0e' }}>$12K</p>
            <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>Revenue Generated</p>
          </div>
        </div>
      </div>

      {/* Right - Animated Image */}
      <div
        className="relative flex-shrink-0 transition-all duration-1000"
        style={{
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'translateY(0)' : 'translateY(32px)',
          transitionDelay: '200ms'
        }}
      >
        {/* Floating animation wrapper */}
        <div
          style={{
            animation: 'float 6s ease-in-out infinite',
          }}
        >
          <div className="w-[480px] h-[560px] rounded-3xl overflow-hidden shadow-2xl relative">
            <img
              src="/hero.jpg"
              alt="Baker decorating a cake"
              className="w-full h-full object-cover"
              style={{
                transform: `scale(1.05) translateY(${scrollY * 0.05}px)`,
                transition: 'transform 0.1s ease-out'
              }}
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(45,26,14,0.3) 0%, transparent 60%)' }} />
          </div>
        </div>

        {/* Featured Baker Card */}
        <div
          className="absolute -bottom-4 -left-8 bg-white rounded-2xl px-5 py-4 shadow-xl transition-all duration-1000"
          style={{
            opacity: loaded ? 1 : 0,
            transitionDelay: '500ms',
            animation: 'float 6s ease-in-out infinite',
            animationDelay: '1s'
          }}
        >
          {featuredBaker ? (
            <Link href={`/bakers/${featuredBaker.id}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                  {featuredBaker.profile_photo_url ? (
                    <img src={featuredBaker.profile_photo_url} alt={featuredBaker.business_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl">🎂</span>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold" style={{ color: '#2d1a0e' }}>{featuredBaker.business_name}</p>
                  <p className="text-xs" style={{ color: '#5c3d2e' }}>
                    {featuredBaker.specialties?.[0] || 'Custom Cakes'} · {featuredBaker.city}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                {'★★★★★'.split('').map((s, i) => (
                  <span key={i} className="text-xs" style={{ color: '#f59e0b' }}>{s}</span>
                ))}
                <span className="text-xs ml-1" style={{ color: '#5c3d2e' }}>Featured Baker</span>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-xl">🎂</span>
              </div>
              <div>
                <p className="text-xs font-bold" style={{ color: '#2d1a0e' }}>Whiskly Bakers</p>
                <p className="text-xs" style={{ color: '#5c3d2e' }}>Custom cakes · Your area</p>
              </div>
            </div>
          )}
        </div>

        {/* Verified badge */}
        <div
          className="absolute -top-4 -right-4 bg-white rounded-2xl px-4 py-3 shadow-xl transition-all duration-1000"
          style={{
            opacity: loaded ? 1 : 0,
            transitionDelay: '700ms',
            animation: 'float 6s ease-in-out infinite',
            animationDelay: '2s'
          }}
        >
          <p className="text-xs font-bold" style={{ color: '#2d1a0e' }}>✓ Verified Platform</p>
          <p className="text-xs" style={{ color: '#5c3d2e' }}>Trusted by local bakers</p>
        </div>
      </div>

      {/* Float animation keyframes */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </section>
  )
}