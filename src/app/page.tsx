import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import HeroSection from '@/components/HeroSection'

export default async function Home() {
  const { data: featuredBaker } = await supabase
    .from('bakers')
    .select('id, business_name, city, state, specialties, profile_photo_url')
    .eq('is_featured', true)
    .eq('is_active', true)
    .single()

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#f5f0eb' }}>

      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎂</span>
          <span className="text-2xl font-bold" style={{ color: '#2d1a0e' }}>Whiskly</span>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium" style={{ color: '#2d1a0e' }}>
          <Link href="/bakers">Find a Baker</Link>
          <Link href="/join">Join as Baker</Link>
          <Link href="/bakers">Browse Bakers</Link>
          <Link href="/for-bakers">For Bakers</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="px-4 py-2 text-sm font-medium rounded-lg border" style={{ borderColor: '#2d1a0e', color: '#2d1a0e' }}>
            Sign In
          </Link>
          <Link href="/join" className="px-4 py-2 text-sm font-medium rounded-lg text-white" style={{ backgroundColor: '#2d1a0e' }}>
            Get Started
          </Link>
        </div>
      </nav>

      <HeroSection featuredBaker={featuredBaker} />

      {/* How It Works */}
      <section className="px-16 py-20" style={{ backgroundColor: '#f5f0eb' }}>
        <h2 className="text-3xl font-bold text-center mb-3" style={{ color: '#2d1a0e' }}>How It Works</h2>
        <p className="text-center mb-12 text-sm" style={{ color: '#5c3d2e' }}>Getting your perfect custom cake is simple.</p>
        <div className="flex flex-col gap-4 max-w-2xl mx-auto">
          {[
            { num: '1', icon: '🔍', title: 'Browse & Discover', desc: 'Find local bakers and browse their galleries.' },
            { num: '2', icon: '💬', title: 'Request Quote', desc: 'Share your custom order details.' },
            { num: '3', icon: '💳', title: 'Secure Payment', desc: 'Pay deposit through Stripe.' },
            { num: '4', icon: '🎂', title: 'Enjoy Your Cake', desc: 'Pick up and celebrate.' },
          ].map((step) => (
            <div key={step.num} className="flex items-center gap-4 bg-white rounded-2xl px-6 py-4 shadow-sm">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ backgroundColor: '#2d1a0e' }}>
                {step.num}
              </div>
              <span className="text-xl">{step.icon}</span>
              <div>
                <p className="font-semibold text-sm" style={{ color: '#2d1a0e' }}>{step.title}</p>
                <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-16 py-12" style={{ backgroundColor: '#2d1a0e' }}>
        <div className="flex flex-col md:flex-row justify-between gap-8 mb-8 max-w-7xl mx-auto">
          <div className="max-w-xs">
            <p className="text-xl font-bold text-white mb-2">🎂 Whiskly</p>
            <p className="text-sm" style={{ color: '#c4a882' }}>Book bakers with confidence. Clear pricing. Structured booking. One place to manage requests.</p>
          </div>
          <div className="flex gap-16 text-sm">
            <div>
              <p className="font-semibold text-white mb-3">For Customers</p>
              <div className="flex flex-col gap-2" style={{ color: '#c4a882' }}>
                <Link href="/bakers">Browse Bakers</Link>
                <Link href="/how-it-works">How It Works</Link>
              </div>
            </div>
            <div>
              <p className="font-semibold text-white mb-3">For Bakers</p>
              <div className="flex flex-col gap-2" style={{ color: '#c4a882' }}>
                <Link href="/for-bakers">For Bakers</Link>
                <Link href="/join">Join as Baker</Link>
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
        <p className="text-sm border-t pt-6 max-w-7xl mx-auto" style={{ color: '#c4a882', borderColor: '#4a2e1a' }}>© 2026 Whiskly. All rights reserved.</p>
      </footer>

    </main>
  )
}