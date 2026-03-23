'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

const SPECIALTIES = ['Wedding Cakes', 'Birthday Cakes', 'Custom Cookies', 'Cupcakes', 'Kids Party Cakes', 'Vegan/Gluten Free', 'Alcohol Infused', 'Breads', 'Cheesecakes', 'Macarons', 'Custom Dessert Boxes']
const DIETARY = ['Vegan', 'Gluten Free', 'Nut Free', 'Halal', 'Kosher', 'Dairy Free']

function StarRating({ rating, count }: { rating: number | null; count: number }) {
  if (!rating || count === 0) return null
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  return (
    <div className="flex items-center gap-1.5 mt-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <svg key={i} width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path
              d="M6 1l1.2 2.6 2.8.4-2 2 .5 2.8L6 7.5 3.5 8.8l.5-2.8-2-2 2.8-.4z"
              fill={i <= full ? '#c8975a' : i === full + 1 && half ? '#c8975a' : '#e0d5cc'}
              fillOpacity={i === full + 1 && half ? 0.5 : 1}
              stroke="#c8975a"
              strokeWidth="0.5"
            />
          </svg>
        ))}
      </div>
      <span className="text-xs font-semibold" style={{ color: '#5c3d2e' }}>{rating.toFixed(1)}</span>
      <span className="text-xs" style={{ color: '#9c7b6b' }}>({count})</span>
    </div>
  )
}

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
  const [filtersOpen, setFiltersOpen] = useState(false)

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
    if (selectedSpecialty) results = results.filter(b => b.specialties?.includes(selectedSpecialty))
    if (selectedDietary) results = results.filter(b => b.dietary_tags?.includes(selectedDietary))
    if (maxPrice) results = results.filter(b => !b.starting_price || b.starting_price <= parseInt(maxPrice))
    if (deliveryOnly) results = results.filter(b => b.delivery_available)
    if (rushOnly) results = results.filter(b => b.rush_orders_available)
    results.sort((a, b) => {
      if (a.tier === 'pro' && b.tier !== 'pro') return -1
      if (b.tier === 'pro' && a.tier !== 'pro') return 1
      return (b.avg_rating || 0) - (a.avg_rating || 0)
    })
    setFiltered(results)
  }, [bakers, search, selectedSpecialty, selectedDietary, maxPrice, deliveryOnly, rushOnly])

  async function loadBakers() {
    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData?.session?.user?.id
    let blockedBakerIds: string[] = []
    if (userId) {
      const { data: customerData } = await supabase.from('customers').select('id').eq('user_id', userId).maybeSingle()
      if (customerData) {
        const { data: blockData } = await supabase.from('blocks').select('blocked_id').eq('blocker_id', customerData.id).eq('blocker_type', 'customer')
        blockedBakerIds = (blockData || []).map((b: any) => b.blocked_id)
      }
    }
    const { data } = await supabase.from('bakers').select('*').eq('is_active', true).eq('profile_complete', true)
    const visibleBakers = (data || []).filter((b: any) => !blockedBakerIds.includes(b.id))
    setBakers(visibleBakers)
    setFiltered(visibleBakers)
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
  const activeFilterCount = [search, selectedSpecialty, selectedDietary, maxPrice, deliveryOnly, rushOnly].filter(Boolean).length

  const FilterPanel = () => (
    <div className="flex flex-col gap-5">
      {/* Search */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <label className="block text-sm font-semibold mb-2" style={{ color: '#2d1a0e' }}>Search</label>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Name, city, specialty..."
          className="w-full px-3 py-2.5 rounded-lg border text-sm"
          style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
      </div>

      {/* Specialty */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <label className="block text-sm font-semibold mb-3" style={{ color: '#2d1a0e' }}>Specialty</label>
        <div className="flex flex-col gap-1.5">
          {['', ...SPECIALTIES].map((s, i) => (
            <button key={i} onClick={() => setSelectedSpecialty(s)}
              className="text-left text-sm px-3 py-1.5 rounded-lg transition-all"
              style={{ backgroundColor: selectedSpecialty === s ? '#2d1a0e' : 'transparent', color: selectedSpecialty === s ? 'white' : '#5c3d2e' }}>
              {s || 'All Specialties'}
            </button>
          ))}
        </div>
      </div>

      {/* Dietary */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <label className="block text-sm font-semibold mb-3" style={{ color: '#2d1a0e' }}>Dietary Options</label>
        <div className="flex flex-col gap-1.5">
          {['', ...DIETARY].map((tag, i) => (
            <button key={i} onClick={() => setSelectedDietary(tag)}
              className="text-left text-sm px-3 py-1.5 rounded-lg transition-all"
              style={{ backgroundColor: selectedDietary === tag ? '#2d1a0e' : 'transparent', color: selectedDietary === tag ? 'white' : '#5c3d2e' }}>
              {tag || 'Any'}
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <label className="block text-sm font-semibold mb-2" style={{ color: '#2d1a0e' }}>Max Starting Price</label>
        <select value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border text-sm"
          style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }}>
          <option value="">Any price</option>
          <option value="50">Under $50</option>
          <option value="100">Under $100</option>
          <option value="150">Under $150</option>
          <option value="200">Under $200</option>
          <option value="300">Under $300</option>
        </select>
      </div>

      {/* More filters */}
      <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-3">
        <label className="block text-sm font-semibold mb-1" style={{ color: '#2d1a0e' }}>More Filters</label>
        <button onClick={() => setDeliveryOnly(!deliveryOnly)} className="flex items-center gap-3 text-left">
          <div className="w-9 h-5 rounded-full relative flex-shrink-0 transition-all" style={{ backgroundColor: deliveryOnly ? '#2d1a0e' : '#e0d5cc' }}>
            <div className="w-3 h-3 bg-white rounded-full absolute top-1 transition-all" style={{ left: deliveryOnly ? '20px' : '4px' }} />
          </div>
          <span className="text-sm" style={{ color: '#2d1a0e' }}>Delivery available</span>
        </button>
        <button onClick={() => setRushOnly(!rushOnly)} className="flex items-center gap-3 text-left">
          <div className="w-9 h-5 rounded-full relative flex-shrink-0 transition-all" style={{ backgroundColor: rushOnly ? '#2d1a0e' : '#e0d5cc' }}>
            <div className="w-3 h-3 bg-white rounded-full absolute top-1 transition-all" style={{ left: rushOnly ? '20px' : '4px' }} />
          </div>
          <span className="text-sm" style={{ color: '#2d1a0e' }}>Rush orders accepted</span>
        </button>
      </div>

      {hasFilters && (
        <button onClick={clearFilters}
          className="w-full py-3 rounded-xl border text-sm font-semibold"
          style={{ borderColor: '#2d1a0e', color: '#2d1a0e' }}>
          Clear All Filters
        </button>
      )}
    </div>
  )

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#f5f0eb' }}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-10">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1" style={{ color: '#2d1a0e' }}>Browse Bakers</h1>
            <p className="text-sm" style={{ color: '#5c3d2e' }}>
              {filtered.length} baker{filtered.length !== 1 ? 's' : ''} found
              {hasFilters && <> · <button onClick={clearFilters} className="underline font-semibold" style={{ color: '#8B4513' }}>Clear filters</button></>}
            </p>
          </div>

          {/* Mobile filter button */}
          <button
            className="md:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm relative"
            style={{ backgroundColor: filtersOpen ? '#2d1a0e' : 'white', color: filtersOpen ? 'white' : '#2d1a0e', border: '1px solid #e0d5cc' }}
            onClick={() => setFiltersOpen(!filtersOpen)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center"
                style={{ backgroundColor: '#8B4513', color: 'white' }}>
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Mobile search bar — always visible */}
        <div className="md:hidden mb-4">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, city, specialty..."
            className="w-full px-4 py-3 rounded-xl border text-sm bg-white"
            style={{ borderColor: '#e0d5cc', color: '#2d1a0e' }} />
        </div>

        {/* Mobile quick specialty pills */}
        <div className="md:hidden mb-4 flex gap-2 overflow-x-auto pb-1">
          {['', ...SPECIALTIES.slice(0, 6)].map((s, i) => (
            <button key={i} onClick={() => setSelectedSpecialty(s)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: selectedSpecialty === s ? '#2d1a0e' : 'white',
                color: selectedSpecialty === s ? 'white' : '#2d1a0e',
                border: '1px solid ' + (selectedSpecialty === s ? '#2d1a0e' : '#e0d5cc')
              }}>
              {s || 'All'}
            </button>
          ))}
        </div>

        {/* Mobile filter drawer */}
        {filtersOpen && (
          <div className="md:hidden mb-6">
            <FilterPanel />
            <button onClick={() => setFiltersOpen(false)}
              className="w-full mt-4 py-3 rounded-xl text-white font-semibold text-sm"
              style={{ backgroundColor: '#2d1a0e' }}>
              Show {filtered.length} Baker{filtered.length !== 1 ? 's' : ''}
            </button>
          </div>
        )}

        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <div className="hidden md:block w-64 flex-shrink-0">
            <FilterPanel />
          </div>

          {/* Baker Grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <p style={{ color: '#5c3d2e' }}>Loading bakers...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
                <p className="text-4xl mb-3"></p>
                <p className="font-semibold mb-1" style={{ color: '#2d1a0e' }}>No bakers found</p>
                <p className="text-sm mb-4" style={{ color: '#5c3d2e' }}>Try adjusting your filters</p>
                <button onClick={clearFilters} className="px-5 py-2 rounded-lg text-white text-sm font-semibold" style={{ backgroundColor: '#2d1a0e' }}>Clear Filters</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                {filtered.map((baker) => (
                  <Link key={baker.id} href={'/bakers/' + baker.id}>
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group">
                      <div className="overflow-hidden relative" style={{ height: '200px', backgroundColor: '#f5f0eb' }}>
                        {baker.profile_photo_url ? (
                          <img src={baker.profile_photo_url} alt={baker.business_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-5xl">🎂</span>
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
                          style={{ backgroundColor: 'rgba(45,26,14,0.5)' }}>
                          <span className="px-4 py-2 rounded-full text-sm font-semibold text-white border-2 border-white">View Profile →</span>
                        </div>
                        {baker.tier === 'pro' && (
                          <div className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#2d1a0e', color: 'white' }}>⭐ Pro</div>
                        )}
                        {baker.is_cottage_baker && (
                          <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#fef9c3', color: '#854d0e' }}>Cottage Baker</div>
                        )}
                      </div>
                      <div className="p-4 md:p-5">
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex-1 min-w-0 pr-2">
                            <h3 className="font-bold text-base truncate" style={{ color: '#2d1a0e' }}>{baker.business_name}</h3>
                            <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>{baker.city}, {baker.state}</p>
                            <StarRating rating={baker.avg_rating ?? null} count={baker.review_count ?? 0} />
                          </div>
                          {baker.starting_price && (
                            <p className="text-sm font-semibold flex-shrink-0" style={{ color: '#2d1a0e' }}>From ${baker.starting_price}</p>
                          )}
                        </div>
                        {baker.bio && (
                          <p className="text-xs leading-relaxed mb-3 mt-2 line-clamp-2" style={{ color: '#5c3d2e' }}>{baker.bio}</p>
                        )}
                        {baker.specialties?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {baker.specialties.slice(0, 3).map((s: string) => (
                              <span key={s} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#f5f0eb', color: '#2d1a0e' }}>{s}</span>
                            ))}
                            {baker.specialties.length > 3 && (
                              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#f5f0eb', color: '#5c3d2e' }}>+{baker.specialties.length - 3} more</span>
                            )}
                          </div>
                        )}
                        <div className="flex gap-2 flex-wrap">
                          {baker.delivery_available && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>Delivery</span>}
                          {baker.rush_orders_available && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#fef9c3', color: '#854d0e' }}>⚡ Rush orders</span>}
                          {baker.lead_time_days && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#f5f0eb', color: '#5c3d2e' }}>{baker.lead_time_days}d lead time</span>}
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

      <footer className="text-center py-8 mt-10" style={{ backgroundColor: '#2d1a0e' }}>
        <p className="text-sm" style={{ color: '#e0d5cc' }}>© 2026 Whiskly. All rights reserved.</p>
      </footer>
    </main>
  )
}