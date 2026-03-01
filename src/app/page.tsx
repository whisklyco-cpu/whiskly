import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: '#f5f0eb' }}>
      
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white shadow-sm">
        <div className="flex items-center gap-2">
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

      {/* Hero */}
      <section className="flex flex-col md:flex-row items-center justify-between px-16 py-20 gap-12">
        <div className="max-w-xl">
          <h1 className="text-6xl font-bold leading-tight mb-4" style={{ color: '#2d1a0e' }}>
            Book bakers with confidence.
          </h1>
          <p className="text-lg mb-8" style={{ color: '#5c3d2e' }}>
            Browse local bakers, see clear pricing, and book in one place.
          </p>

          {/* Search Bar */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                placeholder="What are you craving? (e.g. cupcakes, wedding cake)"
                className="flex-1 px-4 py-3 rounded-lg border text-sm"
                style={{ borderColor: '#e0d5cc', color: '#2d1a0e' }}
              />
              <input
                type="text"
                placeholder="Location or ZIP code"
                className="w-40 px-4 py-3 rounded-lg border text-sm"
                style={{ borderColor: '#e0d5cc', color: '#2d1a0e' }}
              />
            </div>
            <Link href="/bakers" className="flex items-center justify-center gap-2 w-full py-3 rounded-lg text-white font-semibold" style={{ backgroundColor: '#2d1a0e' }}>
              🔍 Browse bakers
            </Link>
          </div>

          <div className="flex gap-6 mt-6 text-sm" style={{ color: '#5c3d2e' }}>
            <span>$ Clear pricing upfront</span>
            <span>📅 Structured booking process</span>
            <span>💳 Secure payments via Stripe</span>
          </div>

          <div className="flex gap-4 mt-8">
            <Link href="/bakers" className="px-6 py-3 rounded-lg text-white font-semibold" style={{ backgroundColor: '#2d1a0e' }}>
              Browse bakers
            </Link>
            <Link href="/join" className="px-6 py-3 rounded-lg font-semibold border" style={{ borderColor: '#2d1a0e', color: '#2d1a0e' }}>
              Become a baker
            </Link>
          </div>

          {/* Stats */}
          <div className="flex gap-10 mt-10">
            <div>
              <p className="text-2xl font-bold" style={{ color: '#2d1a0e' }}>100+</p>
              <p className="text-sm" style={{ color: '#5c3d2e' }}>Orders Placed</p>
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: '#2d1a0e' }}>25</p>
              <p className="text-sm" style={{ color: '#5c3d2e' }}>Bakers</p>
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: '#2d1a0e' }}>$12K</p>
              <p className="text-sm" style={{ color: '#5c3d2e' }}>Revenue</p>
            </div>
          </div>
        </div>

        {/* Hero Image */}
        <div className="relative">
          <div className="w-96 h-80 rounded-2xl overflow-hidden shadow-lg">
            <img
              src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600"
              alt="Baker decorating a cake"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute bottom-4 right-4 bg-white rounded-xl px-4 py-2 shadow-md text-sm font-medium" style={{ color: '#2d1a0e' }}>
            ✓ Verified Platform · Trusted by local bakers
          </div>
        </div>
      </section>
{/* How It Works */}
      <section className="px-16 py-20" style={{ backgroundColor: '#f5f0eb' }}>
        <h2 className="text-3xl font-bold text-center mb-4" style={{ color: '#2d1a0e' }}>How It Works</h2>
        <p className="text-center mb-12" style={{ color: '#5c3d2e' }}>Getting your perfect custom cake is simple with our streamlined process.</p>
        <div className="flex flex-col gap-4 max-w-2xl mx-auto">
          {[
            { num: '1', icon: '🔍', title: 'Browse & Discover', desc: 'Find local bakers and browse their galleries.' },
            { num: '2', icon: '💬', title: 'Request Quote', desc: 'Share your custom order details.' },
            { num: '3', icon: '$', title: 'Secure Payment', desc: 'Pay deposit through Stripe.' },
            { num: '4', icon: '🎂', title: 'Enjoy Your Cake', desc: 'Pick up and celebrate.' },
          ].map((step) => (
            <div key={step.num} className="flex items-center gap-4 bg-white rounded-xl px-6 py-4 shadow-sm">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ backgroundColor: '#2d1a0e' }}>
                {step.num}
              </div>
              <span className="text-xl">{step.icon}</span>
              <div>
                <p className="font-semibold" style={{ color: '#2d1a0e' }}>{step.title}</p>
                <p className="text-sm" style={{ color: '#5c3d2e' }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-16 py-12" style={{ backgroundColor: '#2d1a0e' }}>
        <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
          <div className="max-w-xs">
            <p className="text-xl font-bold text-white mb-2">Whiskly</p>
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
        <p className="text-sm border-t pt-6" style={{ color: '#c4a882', borderColor: '#4a2e1a' }}>© 2026 Whiskly. All rights reserved.</p>
      </footer>
    </main>
  )
}