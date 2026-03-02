'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const SPECIALTIES = ['Wedding Cakes', 'Birthday Cakes', 'Custom Cookies', 'Cupcakes', 'Kids Party Cakes', 'Vegan/Gluten Free', 'Alcohol Infused', 'Breads', 'Cheesecakes', 'Macarons', 'Custom Dessert Boxes']
const DIETARY = ['Vegan', 'Gluten Free', 'Nut Free', 'Halal', 'Kosher', 'Dairy Free']

export default function BrowseBakers() {
  const [bakers, setBakers] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState('')
  const [selectedDietary, setSelectedDietary] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [deliveryOnly, setDeliveryOnly] = useState(false)
  const [rushOnly, setRushOnly] = useState(false)

  useEffect(() => { loadBakers() }, [])

  useEffect(() => {
    let results = [...bakers]

    if (search) {
      const q = search.toLowerCase()
      results = results.filter(b =>
        b.business_name?.toLowerCase().includes(q) ||
        b.city?.toLowerCase().includes(q) ||
        b.bio?.toLowerCase().includes(q) ||
        b.specialties?.some((s: string) => s.toLowerCase().includes(q))
      )
    }

    if (selectedSpecialty) {
      results = results.filter(b => b.specialties?.includes(selectedSpecialty))
    }

    if (selectedDietary) {
      results = results.filter(b => b.dietary_tags?.includes(selectedDietary))
    }

    if (maxPrice) {
      results = results.filter(b => !b.starting_price || b.starting_price <= parseInt(maxPrice))
    }

    if (deliveryOnly) {
      results = results.filter(b => b.delivery_available)
    }

    if (rushOnly) {
      results = results.filter(b => b.rush_orders_available)
    }

    // Pro bakers first
    results.sort((a, b) => {
      if (a.tier === 'pro' && b.tier !== 'pro') return -1
      if (b.tier === 'pro' && a.tier !== 'pro') return 1
      return 0
    })

    setFiltered(results)
  }, [bakers, search, selectedSpecialty, selectedDietary, maxPrice, deliveryOnly, rushOnly])

  async function loadBakers() {
    const { data } = await supabase
      .from('bakers')
      .select('*')
      .eq('is_active', true)
      .eq('profile_complete', true)
    setBakers(data || [])
    setFiltered(data || [])
    setLoading(false)
  }

  function clearFilters() {
    setSearch('')
    setSelectedSpecialty('')
    setSelectedDietary('')
    setMaxPrice('')
    setDeliveryOnly(false)
    setRushOnly(false)
  }

  const hasFilters = search || selectedSpecialty || selectedDietary || maxPrice || deliveryOnly || rushOnly

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#f5f0eb' }}>

      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white shadow-sm">
        <Link href="/" className="text-2xl font-bold" style={{ color: '#2d1a0e' }}>🎂 Whiskly</Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="px-4 py-2 text-sm rounded-lg border" style={{ borderColor: '#2d1a0e', color: '#2d1a0e' }}>Sign In</Link>
          <Link href="/join" className="px-4 py-2 text-sm rounded-lg text-white" style={{ backgroundColor: '#2d1a0e' }}>Join as Baker</Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#2d1a0e' }}>Browse Bakers</h1>
          <p className="text-sm" style={{ color: '#5c3d2e' }}>
            {filtered.length} baker{filtered.length !== 1 ? 's' : ''} found
            {hasFilters ? ' · ' : ''}
            {hasFilters && (
              <button onClick={clearFilters} className="underline font-semibold" style={{ color: '#8B4513' }}>
                Clear filters
              </button>
            )}
          </p>
        </div>

        <div className="flex gap-8">

          {/* Sidebar Filters */}
          <div className="w-64 flex-shrink-0 flex flex-col gap-5">

            {/* Search */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <label className="block text-sm font-semibold mb-2" style={{ color: '#2d1a0e' }}>Search</label>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Name, city, specialty..."
                className="w-full px-3 py-2.5 rounded-lg border text-sm"
                style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }}
              />
            </div>

            {/* Specialty Filter */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <label className="block text-sm font-semibold mb-3" style={{ color: '#2d1a0e' }}>Specialty</label>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => setSelectedSpecialty('')}
                  className="text-left text-sm px-3 py-1.5 rounded-lg transition-all"
                  style={{
                    backgroundColor: !selectedSpecialty ? '#2d1a0e' : 'transparent',
                    color: !selectedSpecialty ? 'white' : '#5c3d2e'
                  }}
                >
                  All Specialties
                </button>
                {SPECIALTIES.map(s => (
                  <button
                    key={s}
                    onClick={() => setSelectedSpecialty(selectedSpecialty === s ? '' : s)}
                    className="text-left text-sm px-3 py-1.5 rounded-lg transition-all"
                    style={{
                      backgroundColor: selectedSpecialty === s ? '#2d1a0e' : 'transparent',
                      color: selectedSpecialty === s ? 'white' : '#5c3d2e'
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Dietary Filter */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <label className="block text-sm font-semibold mb-3" style={{ color: '#2d1a0e' }}>Dietary Options</label>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => setSelectedDietary('')}
                  className="text-left text-sm px-3 py-1.5 rounded-lg transition-all"
                  style={{
                    backgroundColor: !selectedDietary ? '#2d1a0e' : 'transparent',
                    color: !selectedDietary ? 'white' : '#5c3d2e'
                  }}
                >
                  Any
                </button>
                {DIETARY.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSelectedDietary(selectedDietary === tag ? '' : tag)}
                    className="text-left text-sm px-3 py-1.5 rounded-lg transition-all"
                    style={{
                      backgroundColor: selectedDietary === tag ? '#2d1a0e' : 'transparent',
                      color: selectedDietary === tag ? 'white' : '#5c3d2e'
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <label className="block text-sm font-semibold mb-2" style={{ color: '#2d1a0e' }}>Max Starting Price</label>
              <select
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border text-sm"
                style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }}
              >
                <option value="">Any price</option>
                <option value="50">Under $50</option>
                <option value="100">Under $100</option>
                <option value="150">Under $150</option>
                <option value="200">Under $200</option>
                <option value="300">Under $300</option>
              </select>
            </div>

            {/* Toggles */}
            <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-3">
              <label className="block text-sm font-semibold mb-1" style={{ color: '#2d1a0e' }}>More Filters</label>

              <button
                onClick={() => setDeliveryOnly(!deliveryOnly)}
                className="flex items-center gap-3 text-left"
              >
                <div className="w-9 h-5 rounded-full relative flex-shrink-0 transition-all"
                  style={{ backgroundColor: deliveryOnly ? '#2d1a0e' : '#e0d5cc' }}>
                  <div className="w-3 h-3 bg-white rounded-full absolute top-1 transition-all"
                    style={{ left: deliveryOnly ? '20px' : '4px' }} />
                </div>
                <span className="text-sm" style={{ color: '#2d1a0e' }}>Delivery available</span>
              </button>

              <button
                onClick={() => setRushOnly(!rushOnly)}
                className="flex items-center gap-3 text-left"
              >
                <div className="w-9 h-5 rounded-full relative flex-shrink-0 transition-all"
                  style={{ backgroundColor: rushOnly ? '#2d1a0e' : '#e0d5cc' }}>
                  <div className="w-3 h-3 bg-white rounded-full absolute top-1 transition-all"
                    style={{ left: rushOnly ? '20px' : '4px' }} />
                </div>
                <span className="text-sm" style={{ color: '#2d1a0e' }}>Rush orders accepted</span>
              </button>
            </div>

          </div>

          {/* Baker Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <p style={{ color: '#5c3d2e' }}>Loading bakers...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
                <p className="text-4xl mb-3">🔍</p>
                <p className="font-semibold mb-1" style={{ color: '#2d1a0e' }}>No bakers found</p>
                <p className="text-sm mb-4" style={{ color: '#5c3d2e' }}>Try adjusting your filters</p>
                <button onClick={clearFilters} className="px-5 py-2 rounded-lg text-white text-sm font-semibold" style={{ backgroundColor: '#2d1a0e' }}>
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-5">
                {filtered.map((baker) => (
                  <Link key={baker.id} href={'/bakers/' + baker.id}>
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group">

                      {/* Photo */}
                      <div className="h-48 overflow-hidden relative" style={{ backgroundColor: '#f5f0eb' }}>
                        {baker.profile_photo_url ? (
                          <img
                            src={baker.profile_photo_url}
                            alt={baker.business_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-5xl">🎂</span>
                          </div>
                        )}
                        {baker.tier === 'pro' && (
                          <div className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#2d1a0e', color: 'white' }}>
                            ⭐ Pro
                          </div>
                        )}
                        {baker.is_cottage_baker && (
                          <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#fef9c3', color: '#854d0e' }}>
                            🏠 Cottage
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-bold text-base" style={{ color: '#2d1a0e' }}>{baker.business_name}</h3>
                            <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>📍 {baker.city}, {baker.state}</p>
                          </div>
                          {baker.starting_price && (
                            <p className="text-sm font-semibold flex-shrink-0" style={{ color: '#2d1a0e' }}>
                              From ${baker.starting_price}
                            </p>
                          )}
                        </div>

                        {baker.bio && (
                          <p className="text-xs leading-relaxed mb-3 line-clamp-2" style={{ color: '#5c3d2e' }}>
                            {baker.bio}
                          </p>
                        )}

                        {/* Specialties */}
                        {baker.specialties?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {baker.specialties.slice(0, 3).map((s: string) => (
                              <span key={s} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#f5f0eb', color: '#2d1a0e' }}>
                                {s}
                              </span>
                            ))}
                            {baker.specialties.length > 3 && (
                              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#f5f0eb', color: '#5c3d2e' }}>
                                +{baker.specialties.length - 3} more
                              </span>
                            )}
                          </div>
                        )}

                        {/* Tags */}
                        <div className="flex gap-2 flex-wrap">
                          {baker.delivery_available && (
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>🚗 Delivery</span>
                          )}
                          {baker.rush_orders_available && (
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#fef9c3', color: '#854d0e' }}>⚡ Rush orders</span>
                          )}
                          {baker.lead_time_days && (
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#f5f0eb', color: '#5c3d2e' }}>📅 {baker.lead_time_days}d lead time</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
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