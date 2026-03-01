import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'

export default async function BakerProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: baker } = await supabase
    .from('bakers')
    .select('*')
    .eq('id', id)
    .single()

  if (!baker) notFound()

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#f5f0eb' }}>

      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white shadow-sm">
        <Link href="/" className="text-2xl font-bold" style={{ color: '#2d1a0e' }}>Whiskly</Link>
        <div className="flex items-center gap-3">
          <Link href="/bakers" className="text-sm font-medium" style={{ color: '#2d1a0e' }}>Browse Bakers</Link>
          <Link href="/login" className="px-4 py-2 text-sm rounded-lg border" style={{ borderColor: '#2d1a0e', color: '#2d1a0e' }}>Sign In</Link>
          <Link href="/join" className="px-4 py-2 text-sm rounded-lg text-white" style={{ backgroundColor: '#2d1a0e' }}>Get Started</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-8 py-12">

        {/* Baker Header */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-1" style={{ color: '#2d1a0e' }}>{baker.business_name}</h1>
              {baker.city && (
                <p className="text-sm" style={{ color: '#5c3d2e' }}>📍 {baker.city}{baker.state ? `, ${baker.state}` : ''}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button className="px-5 py-2 rounded-lg text-white font-semibold text-sm" style={{ backgroundColor: '#2d1a0e' }}>
                Book Now
              </button>
            </div>
          </div>

          {/* About */}
          {baker.bio && (
            <div className="mb-6">
              <h2 className="font-semibold mb-2" style={{ color: '#2d1a0e' }}>About</h2>
              <p className="text-sm leading-relaxed" style={{ color: '#5c3d2e' }}>{baker.bio}</p>
            </div>
          )}

          {/* Specialties */}
          {baker.specialties && baker.specialties.length > 0 && (
            <div className="mb-6">
              <h2 className="font-semibold mb-2" style={{ color: '#2d1a0e' }}>Specialties</h2>
              <div className="flex flex-wrap gap-2">
                {baker.specialties.map((s: string) => (
                  <span key={s} className="px-3 py-1 text-sm rounded-full" style={{ backgroundColor: '#f5f0eb', color: '#2d1a0e' }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Service Details */}
          <div className="grid grid-cols-2 gap-6 p-4 rounded-xl" style={{ backgroundColor: '#f5f0eb' }}>
            <div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#2d1a0e' }}>Service Details</h3>
              {baker.lead_time_days && <p className="text-sm" style={{ color: '#5c3d2e' }}>⏱ Lead Time: {baker.lead_time_days} days</p>}
              {baker.starting_price && <p className="text-sm mt-1" style={{ color: '#5c3d2e' }}>$ Starting from ${baker.starting_price}</p>}
              {baker.zip_code && <p className="text-sm mt-1" style={{ color: '#5c3d2e' }}>📍 Service Area: {baker.zip_code}</p>}
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#2d1a0e' }}>How to Order</h3>
              <p className="text-sm" style={{ color: '#5c3d2e' }}>Send a request through the platform</p>
            </div>
          </div>
        </div>

        {/* Request Form */}
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-bold mb-6" style={{ color: '#2d1a0e' }}>Send a Request</h2>
          <RequestForm bakerId={baker.id} bakerName={baker.business_name} />
        </div>

      </div>

      {/* Footer */}
      <footer className="px-16 py-8 text-center mt-8" style={{ backgroundColor: '#2d1a0e' }}>
        <p className="text-sm" style={{ color: '#c4a882' }}>© 2026 Whiskly. All rights reserved.</p>
      </footer>

    </main>
  )
}

function RequestForm({ bakerId, bakerName }: { bakerId: string, bakerName: string }) {
  return (
    <form action="/api/orders" method="POST" className="flex flex-col gap-4">
      <input type="hidden" name="baker_id" value={bakerId} />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#2d1a0e' }}>Your Name</label>
          <input name="customer_name" required placeholder="Jane Smith" className="w-full px-4 py-3 rounded-lg border text-sm" style={{ borderColor: '#e0d5cc' }} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#2d1a0e' }}>Your Email</label>
          <input name="customer_email" type="email" required placeholder="you@example.com" className="w-full px-4 py-3 rounded-lg border text-sm" style={{ borderColor: '#e0d5cc' }} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#2d1a0e' }}>Event Type</label>
          <select name="event_type" className="w-full px-4 py-3 rounded-lg border text-sm" style={{ borderColor: '#e0d5cc' }}>
            <option>Birthday Cake</option>
            <option>Wedding Cake</option>
            <option>Cupcakes</option>
            <option>Cookies</option>
            <option>Custom Desserts</option>
            <option>Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#2d1a0e' }}>Event Date</label>
          <input name="event_date" type="date" required className="w-full px-4 py-3 rounded-lg border text-sm" style={{ borderColor: '#e0d5cc' }} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: '#2d1a0e' }}>Budget ($)</label>
        <input name="budget" type="number" required placeholder="150" className="w-full px-4 py-3 rounded-lg border text-sm" style={{ borderColor: '#e0d5cc' }} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: '#2d1a0e' }}>Describe what you want</label>
        <textarea name="item_description" rows={3} required placeholder="Tell the baker what you're looking for..." className="w-full px-4 py-3 rounded-lg border text-sm" style={{ borderColor: '#e0d5cc' }} />
      </div>
      <button type="submit" className="w-full py-3 rounded-lg text-white font-semibold" style={{ backgroundColor: '#2d1a0e' }}>
        Send Request to {bakerName}
      </button>
    </form>
  )
}