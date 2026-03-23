'use client'

import Link from 'next/link'
import WhisklyLogo from '@/components/WhisklyLogo'
import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'

export default function ForBakersPage() {
  const [annual, setAnnual] = useState(false)
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

  // Dynamic social proof based on real numbers
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

  const freeFeatures = [
    'Full order management dashboard',
    'Customer messaging',
    'Inspiration photo uploads',
    'Delivery and pickup flow with proof photos',
    'Customer reviews',
    'Per-specialty pricing display',
    'Event countdowns',
    'Unlimited orders',
  ]

  const proFeatures = [
    { name: 'Featured placement in browse results', desc: 'Show up first when customers search' },
    { name: 'Verified badge', desc: 'Stand out as a trusted, vetted baker' },
    { name: '10 portfolio photos', desc: 'Free tier includes 3' },
    { name: 'Send Reminder', desc: 'Nudge customers about upcoming events' },
    { name: 'Profile writing assistance', desc: 'Get a polished bio and specialty descriptions written for you' },
    { name: 'Pricing calculator', desc: 'See what bakers in your area charge and price with confidence' },
    { name: 'Analytics dashboard', desc: 'Profile views, request volume, and conversion rate' },
    { name: 'Custom booking link', desc: 'whiskly.co/bakers/yourname, perfect for your Instagram bio' },
    { name: 'Pro Baker badge on order emails', desc: 'Every confirmation email shows your Pro status' },
    { name: 'Priority support', desc: 'Get help faster when you need it' },
    { name: 'Founding Baker badge', desc: 'Exclusive, first 50 Pro members only' },
  ]

  const howItWorks = [
    { num: '01', title: 'Create your profile', desc: 'Add your specialties, pricing, portfolio photos, and bio. Takes about 10 minutes.' },
    { num: '02', title: 'Share your link', desc: 'Post your Whiskly profile on Instagram, Facebook, or anywhere you promote your business.' },
    { num: '03', title: 'Receive structured requests', desc: 'Customers fill out a detailed request form with event date, budget, and inspiration photos. No more vague DMs.' },
    { num: '04', title: 'Accept or decline', desc: 'Review every request before committing. Only take orders that work for you.' },
    { num: '05', title: 'Get paid and deliver', desc: 'Manage the whole order in one place, from deposit to delivery confirmation.' },
  ]

  const whyWhiskly = [
    {
      title: 'You set the terms',
      body: 'Your pricing is public. Customers know what to expect before they reach out. No more explaining your rates from scratch on every inquiry.'
    },
    {
      title: 'Serious customers only',
      body: 'The order form requires an event date, budget, servings, and inspiration photos. Casual browsers self-select out. Only real buyers make it to your inbox.'
    },
    {
      title: 'Your business, protected',
      body: 'Deposits collected upfront. Delivery proof photos. Order history saved. If anything ever goes sideways, you have documentation.'
    },
    {
      title: 'Built by someone who gets it',
      body: 'This platform was built by an independent baker. Every feature exists because it solved a real problem, not because a tech company guessed what bakers need.'
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
            You didn't start baking<br />
            <span style={{ color: '#8B4513' }}>to live in your DMs.</span>
          </h1>
          <p className="text-lg mb-6 leading-relaxed max-w-xl" style={{ color: '#5c3d2e' }}>
            Whiskly gives independent bakers a professional home to manage inquiries, accept orders, and grow their business without the chaos.
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

      {/* Why Whiskly */}
      <section className="py-20" style={{ backgroundColor: '#f5f0eb' }}>
        <div className="px-6 md:px-16" style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#8B4513' }}>Why Whiskly</p>
          <h2 className="text-3xl font-bold mb-12" style={{ color: '#2d1a0e', letterSpacing: '-0.02em' }}>
            Everything your business deserves. Nothing you don't need.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {whyWhiskly.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 shadow-sm">
                <p className="font-bold text-lg mb-3" style={{ color: '#2d1a0e' }}>{item.title}</p>
                <p className="text-sm leading-relaxed" style={{ color: '#5c3d2e' }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20" style={{ backgroundColor: 'white' }}>
        <div className="px-6 md:px-16" style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#8B4513' }}>How it works</p>
          <h2 className="text-3xl font-bold mb-12" style={{ color: '#2d1a0e', letterSpacing: '-0.02em' }}>
            Up and running in under 15 minutes.
          </h2>
          <div className="flex flex-col gap-6">
            {howItWorks.map((step, i) => (
              <div key={i} className="flex items-start gap-6 p-6 rounded-2xl" style={{ backgroundColor: '#faf8f6' }}>
                <p className="text-3xl font-bold flex-shrink-0" style={{ color: '#e0d5cc' }}>{step.num}</p>
                <div>
                  <p className="font-bold mb-1" style={{ color: '#2d1a0e' }}>{step.title}</p>
                  <p className="text-sm leading-relaxed" style={{ color: '#5c3d2e' }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Free vs Pro */}
      <section className="py-20" style={{ backgroundColor: '#f5f0eb' }}>
        <div className="px-6 md:px-16" style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#8B4513' }}>Pricing</p>
          <h2 className="text-3xl font-bold mb-3" style={{ color: '#2d1a0e', letterSpacing: '-0.02em' }}>
            Start free. Grow with Pro.
          </h2>
          <p className="text-sm mb-10" style={{ color: '#5c3d2e' }}>Every tool you need to run your business is free. Pro is for bakers ready to grow faster.</p>

          <div className="flex items-center gap-3 mb-10">
            <span className="text-sm font-semibold" style={{ color: annual ? '#5c3d2e' : '#2d1a0e' }}>Monthly</span>
            <button onClick={() => setAnnual(!annual)}
              className="w-12 h-6 rounded-full relative transition-all"
              style={{ backgroundColor: annual ? '#2d1a0e' : '#e0d5cc' }}>
              <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all"
                style={{ left: annual ? '26px' : '2px' }} />
            </button>
            <span className="text-sm font-semibold" style={{ color: annual ? '#2d1a0e' : '#5c3d2e' }}>
              Annual <span className="text-xs px-2 py-0.5 rounded-full ml-1" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>Save 43%</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#5c3d2e' }}>Free</p>
              <p className="text-4xl font-bold mb-1" style={{ color: '#2d1a0e' }}>$0</p>
              <p className="text-sm mb-2" style={{ color: '#5c3d2e' }}>Forever. No credit card needed.</p>
              <p className="text-xs mb-8 px-3 py-2 rounded-lg" style={{ backgroundColor: '#f5f0eb', color: '#5c3d2e' }}>
                10% commission per order. You keep 90%.
              </p>
              <div className="flex flex-col gap-3 mb-8">
                {freeFeatures.map((f, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-white" style={{ backgroundColor: '#2d1a0e' }}>✓</span>
                    <p className="text-sm" style={{ color: '#2d1a0e' }}>{f}</p>
                  </div>
                ))}
              </div>
              <Link href="/join" className="block text-center py-3 rounded-xl border font-semibold text-sm"
                style={{ borderColor: '#2d1a0e', color: '#2d1a0e' }}>
                Get Started Free
              </Link>
            </div>

            <div className="rounded-2xl p-8 shadow-sm relative overflow-hidden" style={{ backgroundColor: '#2d1a0e' }}>
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: '#8B4513', color: 'white' }}>
                Most Popular
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#c4a882' }}>Pro</p>
              <div className="flex items-end gap-2 mb-1">
                <p className="text-4xl font-bold text-white">{annual ? '$199' : '$29'}</p>
                <p className="text-sm mb-1" style={{ color: '#c4a882' }}>{annual ? '/year' : '/month'}</p>
              </div>
              {annual && <p className="text-xs mb-1" style={{ color: '#c4a882' }}>That's just $16.58/month</p>}
              <p className="text-xs mb-4 px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#c4a882' }}>
                7% commission per order. You keep 93%.
              </p>

              <div className="mb-3 p-3 rounded-xl" style={{ backgroundColor: 'rgba(139,69,19,0.3)', border: '1px solid rgba(139,69,19,0.5)' }}>
                <p className="text-xs font-bold text-white">Founding Baker — First 50 only</p>
                <p className="text-xs mt-0.5" style={{ color: '#e0c9b0' }}>{annual ? '$149/year' : '$19/month'} locked in forever plus exclusive Founding Baker badge</p>
              </div>

              <p className="text-sm mb-6" style={{ color: '#c4a882' }}>Everything in Free, plus:</p>
              <div className="flex flex-col gap-3 mb-8">
                {proFeatures.map((f, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-white" style={{ backgroundColor: '#8B4513' }}>✓</span>
                    <div>
                      <p className="text-sm font-semibold text-white">{f.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#c4a882' }}>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/join?plan=pro" className="block text-center py-3 rounded-xl font-semibold text-sm"
                style={{ backgroundColor: '#8B4513', color: 'white' }}>
                Apply for Pro
              </Link>
            </div>
          </div>

          <div className="mt-6 p-5 rounded-2xl text-center" style={{ backgroundColor: 'white' }}>
            <p className="text-sm font-semibold mb-1" style={{ color: '#2d1a0e' }}>When does Pro pay for itself?</p>
            <p className="text-sm" style={{ color: '#5c3d2e' }}>
              At 10% commission you break even on Pro at around $290/month in orders. Most bakers hit that in their first week.
              At $1,000/month in orders, Pro saves you $30. At $3,000/month, it saves you $90.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 md:px-16 py-20" style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: '#2d1a0e' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#8B4513' }}>
            {bakerCount >= 25 ? 'Join ' + bakerCount + ' bakers' : bakerCount >= 5 ? 'Early access open' : 'Now accepting applications'}
          </p>
          <h2 className="text-3xl font-bold text-white mb-4" style={{ letterSpacing: '-0.02em' }}>
            {bakerCount >= 25
              ? 'Your next customer is already looking for you.'
              : bakerCount >= 5
              ? 'Be one of the first bakers on the platform.'
              : 'Get in early. Shape the platform.'}
          </h2>
          <p className="text-sm mb-8 max-w-md mx-auto" style={{ color: '#c4a882' }}>
            {bakerCount >= 25
              ? 'Join Whiskly and give your business the professional home it deserves. Free to start, forever.'
              : bakerCount >= 5
              ? 'We are intentionally keeping early access small. Bakers who join now get the most attention, the best placement, and the Founding Baker rate locked in forever.'
              : 'We are hand-selecting our first bakers. Early members get direct input on features, Founding Baker pricing locked in forever, and first placement when customers search.'}
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
            <div className="mb-2"><WhisklyLogo variant="dark" size="md" /></div>
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
          © 2026 Whiskly. All rights reserved. Currently in Beta
        </p>
      </footer>
    </main>
  )
}