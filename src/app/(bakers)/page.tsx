import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default async function BrowseBakers() {
  const { data: bakers } = await supabase
    .from('bakers')
    .select('*')
    .eq('is_active', true)

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#f5f0eb' }}>
      
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white shadow-sm">
        <Link href="/" className="text-2xl font-bold" style={{ color: '#2d1a0e' }}>Whiskly</Link>
        <div className="flex items-center gap-6 text-sm font-medium" style={{ color: '#2d1a0e' }}>
          <Link href="/bakers">Find a Baker</Link>
          <Link href="/join">Join as Baker</Link>
          <Link href="/bakers">Browse Bakers</Link>
          <Link href="/for-bakers">For Bakers</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="px-4 py-2 text-sm font-medium rounded-lg border" style={{ borderColor: '#2d1a0e', color: '#2d1a0e' }}>Sign In</Link>
          <Link href="/join" className="px-4 py-2 text-sm font-medium rounded-lg text-white" style={{ backgroundColor: '#2d1a0e' }}>Get Started</Link>
        </div>
      </nav>

      {/* Header */}
      <section className="px-16 py-12 text-center">
        <h1 className="text-4xl font-bold mb-3" style={{ color: '#2d1a0e' }}>Browse Local Bakers</h1>
        <p className="text-lg mb-8" style={{ color: '#5c3d2e' }}>Choose a baker and send a detailed request in a few clicks. No more scattered DMs.</p>
        
        {/* Search */}
        <div className="flex items-center justify-center gap-3 max-w-lg mx-auto">
          <input
            type="text"
            placeholder="Enter 5-digit ZIP"
            className="flex-1 px-4 py-3 rounded-lg border text-sm"
            style={{ borderColor: '#e0d5cc' }}
          />
          <select className="px-4 py-3 rounded-lg border text-sm" style={{ borderColor: '#e0d5cc' }}>
            <option>25 miles</option>
            <option>10 miles</option>
            <option>50 miles</option>
          </select>
          <button className="px-6 py-3 rounded-lg text-white text-sm font-semibold" style={{ backgroundColor: '#2d1a0e' }}>
            Search
          </button>
        </div>
      </section>

      {/* Baker Grid */}
      <section className="px-16 pb-20">
        {bakers && bakers.length > 0 ? (
          <>
            <p className="text-sm mb-6" style={{ color: '#5c3d2e' }}>Available Bakers ({bakers.length})</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bakers.map((baker) => (
                <div key={baker.id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                  <div className="h-48 bg-gray-100 overflow-hidden">
                    {baker.profile_photo_url ? (
                      <img src={baker.profile_photo_url} alt={baker.business_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">🎂</div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-lg mb-1" style={{ color: '#2d1a0e' }}>{baker.business_name}</h3>
                    {baker.city && <p className="text-sm mb-3" style={{ color: '#5c3d2e' }}>📍 {baker.city}, {baker.state}</p>}
                    {baker.specialties && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {baker.specialties.slice(0, 3).map((s: string) => (
                          <span key={s} className="px-2 py-1 text-xs rounded-full" style={{ backgroundColor: '#f5f0eb', color: '#2d1a0e' }}>{s}</span>
                        ))}
                      </div>
                    )}
                    {baker.starting_price && <p className="text-sm mb-1" style={{ color: '#2d1a0e' }}>$ From ${baker.starting_price}</p>}
                    {baker.lead_time_days && <p className="text-sm mb-4" style={{ color: '#5c3d2e' }}>⏱ {baker.lead_time_days}d lead</p>}
                    <Link
                      href={`/bakers/${baker.id}`}
                      className="block w-full text-center py-2 rounded-lg text-white text-sm font-semibold"
                      style={{ backgroundColor: '#2d1a0e' }}
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🎂</p>
            <p className="text-lg font-semibold mb-2" style={{ color: '#2d1a0e' }}>No bakers yet</p>
            <p className="text-sm mb-6" style={{ color: '#5c3d2e' }}>Be the first baker on Whiskly!</p>
            <Link href="/join" className="px-6 py-3 rounded-lg text-white font-semibold" style={{ backgroundColor: '#2d1a0e' }}>
              Join as a Baker
            </Link>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="px-16 py-8 text-center" style={{ backgroundColor: '#2d1a0e' }}>
        <p className="text-sm" style={{ color: '#c4a882' }}>© 2026 Whiskly. All rights reserved.</p>
      </footer>

    </main>
  )
}