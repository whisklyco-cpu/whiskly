'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function BakerProfile() {
  const { id } = useParams()
  const [baker, setBaker] = useState<any>(null)
  const [portfolio, setPortfolio] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    customer_name: '', email: '', event_type: '', event_date: '', budget: '', item_description: ''
  })

  useEffect(() => {
    loadBaker()
  }, [id])

  async function loadBaker() {
    const { data: bakerData } = await supabase
      .from('bakers')
      .select('*')
      .eq('id', id)
      .single()

    if (bakerData) {
      setBaker(bakerData)
      const { data: portfolioData } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('baker_id', id)
        .eq('is_visible', true)
        .order('created_at', { ascending: false })
      setPortfolio(portfolioData || [])
    }
    setLoading(false)
  }

  async function handleSubmit() {
    if (!form.customer_name || !form.email || !form.event_type || !form.event_date) return
    setSubmitting(true)
    await supabase.from('orders').insert({
  baker_id: baker.id,
  customer_name: form.customer_name,
  customer_email: form.email,
  event_type: form.event_type,
  event_date: form.event_date,
  budget: parseFloat(form.budget) || 0,
  item_description: form.item_description,
  status: 'pending'
})

// Send email notification to baker
await fetch('/api/email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'new_order',
    bakerEmail: baker.email,
    bakerName: baker.business_name,
    customerName: form.customer_name,
    eventType: form.event_type,
    eventDate: form.event_date,
    budget: form.budget,
    description: form.item_description,
  })
})

setSubmitted(true)
setSubmitting(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f0eb' }}>
      <p style={{ color: '#2d1a0e' }}>Loading...</p>
    </div>
  )

  if (!baker) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f0eb' }}>
      <p style={{ color: '#2d1a0e' }}>Baker not found</p>
    </div>
  )

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#f5f0eb' }}>

      {/* Navbar */}
     <Navbar />
import Navbar from '@/components/Navbar'
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-3 gap-8">

          {/* Left Column - Main Content */}
          <div className="col-span-2 flex flex-col gap-6">

            {/* Header Card */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex items-start gap-5">
                <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#f5f0eb' }}>
                  {baker.profile_photo_url ? (
                    <img src={baker.profile_photo_url} alt={baker.business_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl">🎂</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h1 className="text-2xl font-bold" style={{ color: '#2d1a0e' }}>{baker.business_name}</h1>
                    {baker.verified && (
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>✓ Verified</span>
                    )}
                    {baker.is_cottage_baker && (
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full" style={{ backgroundColor: '#fef9c3', color: '#854d0e' }}>🏠 Cottage Baker</span>
                    )}
                  </div>
                  <p className="text-sm mb-3" style={{ color: '#5c3d2e' }}>📍 {baker.city}, {baker.state}</p>
                  <div className="flex flex-wrap gap-2">
                    {baker.starting_price && (
                      <span className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: '#f5f0eb', color: '#2d1a0e' }}>
                        Starting from ${baker.starting_price}
                      </span>
                    )}
                    {baker.lead_time_days && (
                      <span className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: '#f5f0eb', color: '#2d1a0e' }}>
                        {baker.lead_time_days} day lead time
                      </span>
                    )}
                    {baker.instagram_handle && (
  <span className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: '#f5f0eb', color: '#2d1a0e' }}>
    @{baker.instagram_handle}
  </span>
)}
                  </div>
                </div>
              </div>
            </div>

            {/* About */}
            {baker.bio && (
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <h2 className="text-lg font-bold mb-3" style={{ color: '#2d1a0e' }}>About</h2>
                <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#5c3d2e' }}>{baker.bio}</p>
              </div>
            )}

            {/* Portfolio */}
            {portfolio.length > 0 && (
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <h2 className="text-lg font-bold mb-4" style={{ color: '#2d1a0e' }}>Portfolio</h2>
                <div className="grid grid-cols-3 gap-3">
                  {portfolio.map((item) => (
                    <div key={item.id} className="rounded-xl overflow-hidden" style={{ aspectRatio: '1' }}>
                      <img src={item.image_url} alt="Portfolio" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Specialties */}
            {baker.specialties?.length > 0 && (
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <h2 className="text-lg font-bold mb-4" style={{ color: '#2d1a0e' }}>Specialties</h2>
                <div className="flex flex-wrap gap-2">
                  {baker.specialties.map((s: string) => (
                    <span key={s} className="px-4 py-2 rounded-full text-sm font-medium" style={{ backgroundColor: '#f5f0eb', color: '#2d1a0e' }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Dietary Tags */}
            {baker.dietary_tags?.length > 0 && (
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <h2 className="text-lg font-bold mb-4" style={{ color: '#2d1a0e' }}>Dietary Options</h2>
                <div className="flex flex-wrap gap-2">
                  {baker.dietary_tags.map((tag: string) => (
                    <span key={tag} className="px-4 py-2 rounded-full text-sm font-medium" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>
                      ✓ {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Service Details */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h2 className="text-lg font-bold mb-4" style={{ color: '#2d1a0e' }}>Service Details</h2>
              <div className="grid grid-cols-2 gap-4">
                {baker.delivery_available && (
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#5c3d2e' }}>
                    <span>🚗</span> Delivery available
                  </div>
                )}
                {baker.pickup_available && (
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#5c3d2e' }}>
                    <span>📦</span> Pickup available
                  </div>
                )}
                {baker.rush_orders_available && (
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#5c3d2e' }}>
                    <span>⚡</span> Rush orders accepted
                  </div>
                )}
                {baker.minimum_order > 0 && (
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#5c3d2e' }}>
                    <span>💵</span> ${baker.minimum_order} minimum
                  </div>
                )}
                {baker.days_available?.length > 0 && (
                  <div className="flex items-center gap-2 text-sm col-span-2" style={{ color: '#5c3d2e' }}>
                    <span>📅</span> Available: {baker.days_available.join(', ')}
                  </div>
                )}
                {baker.cancellation_policy && (
                  <div className="flex items-center gap-2 text-sm col-span-2" style={{ color: '#5c3d2e' }}>
                    <span>📋</span> {baker.cancellation_policy}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Column - Booking Form */}
          <div className="col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-6">
              {submitted ? (
                <div className="text-center py-8">
                  <p className="text-4xl mb-3">🎉</p>
                  <h3 className="font-bold text-lg mb-2" style={{ color: '#2d1a0e' }}>Request Sent!</h3>
                  <p className="text-sm" style={{ color: '#5c3d2e' }}>{baker.business_name} will be in touch soon.</p>
                </div>
              ) : (
                <>
                  <h3 className="font-bold text-lg mb-1" style={{ color: '#2d1a0e' }}>Send a Request</h3>
                  <p className="text-xs mb-5" style={{ color: '#5c3d2e' }}>No payment yet — just start the conversation</p>

                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: '#2d1a0e' }}>Your Name *</label>
                      <input
                        value={form.customer_name}
                        onChange={e => setForm({ ...form, customer_name: e.target.value })}
                        placeholder="Alexandria Johnson"
                        className="w-full px-3 py-2.5 rounded-lg border text-sm"
                        style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: '#2d1a0e' }}>Email *</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        placeholder="you@example.com"
                        className="w-full px-3 py-2.5 rounded-lg border text-sm"
                        style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: '#2d1a0e' }}>Event Type *</label>
                      <select
                        value={form.event_type}
                        onChange={e => setForm({ ...form, event_type: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-lg border text-sm"
                        style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }}
                      >
                        <option value="">Select event</option>
                        <option>Birthday</option>
                        <option>Wedding</option>
                        <option>Baby Shower</option>
                        <option>Bridal Shower</option>
                        <option>Anniversary</option>
                        <option>Corporate Event</option>
                        <option>Holiday</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: '#2d1a0e' }}>Event Date *</label>
                      <input
                        type="date"
                        value={form.event_date}
                        onChange={e => setForm({ ...form, event_date: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-lg border text-sm"
                        style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: '#2d1a0e' }}>Budget ($)</label>
                      <input
                        type="number"
                        value={form.budget}
                        onChange={e => setForm({ ...form, budget: e.target.value })}
                        placeholder="150"
                        className="w-full px-3 py-2.5 rounded-lg border text-sm"
                        style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: '#2d1a0e' }}>Tell them what you want</label>
                      <textarea
                        value={form.item_description}
                        onChange={e => setForm({ ...form, item_description: e.target.value })}
                        rows={3}
                        placeholder="3 tier chocolate cake with gold details, serves 50..."
                        className="w-full px-3 py-2.5 rounded-lg border text-sm resize-none"
                        style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }}
                      />
                    </div>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="w-full py-3 rounded-xl text-white font-semibold text-sm"
                      style={{ backgroundColor: '#2d1a0e', opacity: submitting ? 0.7 : 1 }}
                    >
                      {submitting ? 'Sending...' : `Request ${baker.business_name}`}
                    </button>
                    <p className="text-xs text-center" style={{ color: '#5c3d2e' }}>No payment required to send a request</p>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-8 mt-10" style={{ backgroundColor: '#2d1a0e' }}>
        <p className="text-sm" style={{ color: '#e0d5cc' }}>© 2026 Whiskly. All rights reserved.</p>
      </footer>
    </main>
  )
}