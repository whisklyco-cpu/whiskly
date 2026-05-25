'use client'

import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'

export default function ForBakersPage() {
  const [bakerCount, setBakerCount] = useState(0)
  const [orderCount, setOrderCount] = useState(0)
  const [revenue, setRevenue] = useState(0)
  const [statsLoaded, setStatsLoaded] = useState(false)

  useEffect(() => {
    async function loadStats() {
      const [bakersRes, ordersRes] = await Promise.all([
        supabase.from('bakers').select('id', { count: 'exact' }).eq('is_active', true).eq('profile_complete', true),
        supabase.from('orders').select('amount_total, budget, deposit_paid_at', { count: 'exact' }),
      ])
      const count = bakersRes.count || 0
      const ocount = ordersRes.count || 0
      const rev = (ordersRes.data || []).filter(o => o.deposit_paid_at).reduce((s, o) => s + (o.amount_total || (o.budget * 100) || 0), 0) / 100
      setBakerCount(count)
      setOrderCount(ocount)
      setRevenue(rev)
      setStatsLoaded(true)
    }
    loadStats()
  }, [])

  function getSocialProof() {
    if (!statsLoaded) return null
    if (bakerCount >= 25) {
      return {
        badge: 'Trusted by bakers',
        headline: bakerCount + ' independent bakers run their business on Whiskly.',
        sub: orderCount + ' orders processed. $' + (revenue >= 1000 ? (revenue / 1000).toFixed(0) + 'K' : revenue.toFixed(0)) + ' in baker revenue. Growing every week.',
        type: 'metrics'
      }
    }
    if (bakerCount >= 5) {
      return {
        badge: 'Early access',
        headline: bakerCount + ' bakers already trust Whiskly with their business.',
        sub: 'We are intentionally growing slowly to make sure every baker gets the attention they deserve. Applications are open now.',
        type: 'early'
      }
    }
    return {
      badge: 'Built by a baker',
      headline: 'We built this because we lived it.',
      sub: 'Whiskly was created by an independent baker who got tired of managing orders through Instagram DMs, Venmo, and sticky notes. This is the platform we wished existed.',
      type: 'founder'
    }
  }

  const socialProof = getSocialProof()

  const painPoints = [
    {
      problem: 'DMs everywhere',
      detail: 'Instagram. Facebook. Text. Email. You spend more time managing messages than baking.'
    },
    {
      problem: 'Customers who ghost',
      detail: 'You spend an hour on a custom quote. They say "let me think about it." You never hear back.'
    },
    {
      problem: 'Price shock',
      detail: 'You pour your heart into a quote. They respond: "That\'s so expensive, my cousin does it for $40."'
    },
    {
      problem: 'No system',
      detail: 'Order details in texts, deposits in Venmo, event dates in your head. One thing falls through and it\'s your reputation on the line.'
    },
  ]

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#f5f0eb' }}>
      <Navbar />

      {/* Hero */}
      <section className="px-6 md:px-16 py-20 md:py-28" style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div className="max-w-3xl">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-6"
            style={{ backgroundColor: '#e8ddd4', color: '#2d1a0e' }}>
            For Bakers
          </div>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6"
            style={{ color: '#2d1a0e', letterSpacing: '-0.02em' }}>
            Built by a baker who got tired of<br />
            <span style={{ color: '#8B4513' }}>chasing payments and missing orders.</span>
          </h1>
          <p className="text-lg mb-6 leading-relaxed max-w-xl" style={{ color: '#5c3d2e' }}>
            You make incredible cakes. Whiskly handles everything else: bookings, deposits, customer communication, the calendar. So you can spend your time in the kitchen instead of the DMs.
          </p>

          {/* Dynamic social proof block */}
          {socialProof && (
            <div className="mb-10 p-5 rounded-2xl border-l-4" style={{ backgroundColor: 'white', borderColor: '#8B4513' }}>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#8B4513' }}>{socialProof.badge}</span>
              <p className="text-base font-bold mt-1 mb-1" style={{ color: '#2d1a0e' }}>{socialProof.headline}</p>
              <p className="text-sm leading-relaxed" style={{ color: '#5c3d2e' }}>{socialProof.sub}</p>
              {socialProof.type === 'metrics' && (
                <div className="flex gap-6 mt-4 pt-4 border-t" style={{ borderColor: '#f5f0eb' }}>
                  {[
                    [bakerCount + '+', 'Active Bakers'],
                    [orderCount + '+', 'Orders Placed'],
                    ['$' + (revenue >= 1000 ? (revenue / 1000).toFixed(0) + 'K' : revenue.toFixed(0)), 'Baker Revenue'],
                  ].map(([val, label]) => (
                    <div key={label as string}>
                      <p className="text-xl font-bold" style={{ color: '#2d1a0e' }}>{val}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>{label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-4 flex-wrap">
            <Link href="/join"
              className="px-8 py-4 rounded-xl text-white font-semibold"
              style={{ backgroundColor: '#2d1a0e' }}>
              Apply as a Baker
            </Link>
            <Link href="/bakers"
              className="px-8 py-4 rounded-xl font-semibold border"
              style={{ borderColor: '#2d1a0e', color: '#2d1a0e' }}>
              Browse the Marketplace
            </Link>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-20" style={{ backgroundColor: '#2d1a0e' }}>
        <div className="px-6 md:px-16" style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#8B4513' }}>Sound familiar?</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-12" style={{ letterSpacing: '-0.02em' }}>
            The way most bakers take orders is broken.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {painPoints.map((p, i) => (
              <div key={i} className="rounded-2xl p-6" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="font-bold text-lg mb-2 text-white">{p.problem}</p>
                <p className="text-sm leading-relaxed" style={{ color: '#c4a882' }}>{p.detail}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 p-6 rounded-2xl" style={{ backgroundColor: '#8B4513' }}>
            <p className="text-white font-bold text-lg mb-1">There is a better way.</p>
            <p className="text-sm" style={{ color: '#f5e6d3' }}>
              One place for every inquiry. Structured requests so customers come prepared with a budget, date, and vision. Your pricing posted upfront so only serious buyers reach out.
            </p>
          </div>
        </div>
      </section>

      {/* How Whiskly Works */}
      <section className="py-20" style={{ backgroundColor: '#f5f0eb' }}>
        <div className="px-6 md:px-16" style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#8B4513' }}>How it works</p>
            <h2 className="text-3xl font-bold mb-8" style={{ color: '#2d1a0e', letterSpacing: '-0.02em' }}>
              Simple for you. Professional for your customers.
            </h2>
            <div className="bg-white rounded-2xl p-8 shadow-sm flex flex-col gap-6">
              <p className="text-base leading-relaxed" style={{ color: '#5c3d2e' }}>
                Customers find your cakes through Whiskly's browse and search. They book directly through your profile with a structured order form, pay a deposit through the platform, and get clear delivery details. You see the order, accept it, bake the cake. Whiskly handles the rest.
              </p>
              <p className="text-base leading-relaxed" style={{ color: '#5c3d2e' }}>
                You set your prices. You keep your customer relationships. You keep your style. Whiskly is the platform underneath, not a middleman.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing — three cards */}
      <section className="py-20" style={{ backgroundColor: 'white' }}>
        <div className="px-6 md:px-16" style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#8B4513' }}>Pricing</p>
          <h2 className="text-3xl font-bold mb-3" style={{ color: '#2d1a0e', letterSpacing: '-0.02em' }}>What it costs</h2>
          <p className="text-base mb-10 max-w-xl leading-relaxed" style={{ color: '#5c3d2e' }}>
            Right now joining is free. No monthly fee, no commission. Commission only activates when Whiskly is genuinely
            driving customers to your business. You always get 60 days written notice before anything changes.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {/* Free card */}
            <div className="rounded-2xl p-8 border" style={{ borderColor: '#e0d5cc', backgroundColor: '#faf8f6' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#5c3d2e' }}>Free</p>
              <p className="text-3xl font-bold mb-1" style={{ color: '#2d1a0e' }}>$0</p>
              <p className="text-xs mb-6" style={{ color: '#9c7b6b' }}>per month, always</p>
              <ul className="flex flex-col gap-2.5 mb-8">
                {[
                  '0% commission today',
                  '10% commission when Phase 2 activates',
                  'Full order management dashboard',
                  'Customer messaging',
                  'Unlimited orders',
                  '6–10 portfolio photos',
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm" style={{ color: '#5c3d2e' }}>
                    <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white" style={{ backgroundColor: '#2d1a0e' }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/join" className="block text-center px-6 py-3 rounded-xl font-semibold text-sm border" style={{ borderColor: '#2d1a0e', color: '#2d1a0e' }}>
                Apply as a Baker
              </Link>
            </div>

            {/* Founding card */}
            <div className="rounded-2xl p-8 relative" style={{ backgroundColor: '#2d1a0e' }}>
              <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: '#8B4513', color: 'white' }}>
                First 50 only
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#8B4513' }}>Founding</p>
              <p className="text-3xl font-bold mb-1 text-white">$14</p>
              <p className="text-xs mb-6" style={{ color: '#c4a882' }}>per month, locked for 3 years · $99/year · 30-day free trial</p>
              <ul className="flex flex-col gap-2.5 mb-8">
                {[
                  '0% commission today',
                  '7% commission locked for 3 years',
                  '30-day free trial',
                  'Full order management dashboard',
                  'Priority search placement — first 12 months',
                  '6–50 portfolio photos',
                  'Founding Baker badge + number',
                  'Verified Original Work badge',
                  'Direct founder group chat',
                  'First access to bulk orders',
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm" style={{ color: '#c4a882' }}>
                    <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white" style={{ backgroundColor: '#8B4513' }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/founding" className="block text-center px-6 py-3 rounded-xl font-semibold text-sm" style={{ backgroundColor: '#8B4513', color: 'white' }}>
                Learn More
              </Link>
            </div>
          </div>

          <p className="text-sm mb-6" style={{ color: '#5c3d2e' }}>
            A standard paid tier will be available for bakers 51 and beyond. Pricing and features will be announced before it launches.
          </p>

          {/* Breakeven explainer */}
          <div className="rounded-2xl p-6" style={{ backgroundColor: '#faf8f6', border: '1px solid #e0d5cc' }}>
            <p className="text-sm font-semibold mb-2" style={{ color: '#2d1a0e' }}>Doing the math</p>
            <p className="text-sm leading-relaxed" style={{ color: '#5c3d2e' }}>
              <span className="font-semibold">Founding</span> pays for itself at ~$467/month in orders — at that volume the 3% commission saving (7% vs 10% Free) covers the $14 fee.
              At $1,000/month, Founding saves you $16 net versus Free. At $3,000/month, $76.
              And your rate is locked for three years — it won't rise even if Whiskly raises pricing for new bakers.
            </p>
          </div>
        </div>
      </section>

      {/* Why We Built It This Way */}
      <section className="py-20" style={{ backgroundColor: 'white' }}>
        <div className="px-6 md:px-16" style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#8B4513' }}>Why we built it this way</p>
            <div className="bg-white rounded-2xl p-8 shadow-sm border" style={{ borderColor: '#e0d5cc' }}>
              <p className="text-base leading-relaxed mb-4" style={{ color: '#5c3d2e' }}>
                Whiskly only earns when we earn for you. Your customer fee covers our operations during this early phase. Commission only activates when at least 40% of your orders come from customers Whiskly brought you, or after 18 months on the platform, whichever comes first.
              </p>
              <p className="text-base leading-relaxed font-semibold" style={{ color: '#2d1a0e' }}>
                That means we're not extracting from your existing business. We're building something that grows with you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 md:px-16 py-20" style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: '#2d1a0e' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#8B4513' }}>Now accepting applications</p>
          <h2 className="text-3xl font-bold text-white mb-4" style={{ letterSpacing: '-0.02em' }}>Ready to apply? It takes about 10 minutes.</h2>
          <p className="text-sm mb-8 max-w-md mx-auto" style={{ color: '#c4a882' }}>
            We're hand-selecting our first bakers. Founding Baker spots are limited to 50, and they're filling.
          </p>
          <Link href="/join"
            className="inline-block px-10 py-4 rounded-xl font-semibold text-sm"
            style={{ backgroundColor: '#8B4513', color: 'white' }}>
            Apply as a Baker
          </Link>
        </div>
      </section>

      <footer className="px-6 md:px-16 py-12" style={{ backgroundColor: '#2d1a0e' }}>
        <div className="flex flex-col md:flex-row justify-between gap-8 mb-8" style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div className="max-w-xs">
            <div className="mb-2"><Logo size={32} linked={false} className="text-[#f5f0eb]" /></div>
            <p className="text-sm" style={{ color: '#c4a882' }}>Book bakers with confidence. Clear pricing. Structured booking.</p>
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
                <Link href="/for-bakers">For Bakers</Link>
                <Link href="/join">Apply as a Baker</Link>
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
          © 2026 Whiskly. All rights reserved. · Early Access · <a href="mailto:support@whiskly.co" className="underline">support@whiskly.co</a>
        </p>
      </footer>
    </main>
  )
}
