'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

export default function CustomerDashboard() {
  const router = useRouter()
  const [customer, setCustomer] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [nearbyBakers, setNearbyBakers] = useState<any[]>([])
  const [savedBakers, setSavedBakers] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('orders')

  useEffect(() => { loadDashboard() }, [])

  async function loadDashboard() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }

    const { data: bakerData } = await supabase.from('bakers').select('id').eq('user_id', session.user.id).maybeSingle()
    if (bakerData) { router.push('/dashboard/baker'); return }

    const { data: customerData } = await supabase.from('customers').select('*').eq('user_id', session.user.id).maybeSingle()
    if (customerData) {
      setCustomer(customerData)

      const { data: ordersData } = await supabase
        .from('orders')
        .select('*, bakers(id, business_name, profile_photo_url, city, state)')
        .eq('customer_email', customerData.email)
        .order('created_at', { ascending: false })
      setOrders(ordersData || [])

      // Load saved bakers from localStorage
      const saved = JSON.parse(localStorage.getItem('whiskly-saved-bakers') || '[]')
      setSavedBakers(saved)

      // Load nearby bakers
      const { data: bakersData } = await supabase
        .from('bakers')
        .select('*')
        .eq('is_active', true)
        .eq('profile_complete', true)
        .eq('state', customerData.state || 'MD')
        .limit(4)
      setNearbyBakers(bakersData || [])
    }
    setLoading(false)
  }

  function toggleSave(bakerId: string) {
    const current = JSON.parse(localStorage.getItem('whiskly-saved-bakers') || '[]')
    const updated = current.includes(bakerId)
      ? current.filter((id: string) => id !== bakerId)
      : [...current, bakerId]
    localStorage.setItem('whiskly-saved-bakers', JSON.stringify(updated))
    setSavedBakers(updated)
  }

  function getDaysUntil(dateStr: string) {
    const today = new Date()
    const event = new Date(dateStr)
    const diff = Math.ceil((event.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  function getProgressStep(status: string) {
    const steps = ['Request Sent', 'Baker Accepted', 'In Progress', 'Ready', 'Complete']
    if (status === 'pending') return 0
    if (status === 'confirmed') return 2
    if (status === 'complete') return 4
    if (status === 'declined') return -1
    return 0
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f0eb' }}>
      <p style={{ color: '#2d1a0e' }}>Loading your dashboard...</p>
    </div>
  )

  const firstName = customer?.full_name?.split(' ')[0] || 'there'
  const pending = orders.filter(o => o.status === 'pending')
  const confirmed = orders.filter(o => o.status === 'confirmed')
  const upcomingOrder = orders.find(o => o.status === 'confirmed' && getDaysUntil(o.event_date) > 0)

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#f5f0eb' }}>
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#2d1a0e' }}>
              Hey, {firstName}!
            </h1>
            <p className="text-sm mt-1" style={{ color: '#5c3d2e' }}>
              {orders.length === 0
                ? "Ready to find your perfect baker?"
                : `You have ${pending.length} pending and ${confirmed.length} confirmed order${confirmed.length !== 1 ? 's' : ''}.`}
            </p>
          </div>
          <Link href="/bakers"
            className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm"
            style={{ backgroundColor: '#2d1a0e' }}>
            + New Order
          </Link>
        </div>

        {/* Upcoming Event Banner */}
        {upcomingOrder && (
          <div className="mb-6 rounded-2xl p-6 flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg, #2d1a0e 0%, #8B4513 100%)' }}>
            <div className="flex items-center gap-4">
              <span className="text-4xl">🎂</span>
              <div>
                <p className="text-white font-bold text-lg">Your {upcomingOrder.event_type} is coming up!</p>
                <p className="text-sm mt-0.5" style={{ color: '#e0c9b0' }}>
                  {getDaysUntil(upcomingOrder.event_date)} days away · {upcomingOrder.bakers?.business_name}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-white">{getDaysUntil(upcomingOrder.event_date)}</p>
              <p className="text-xs" style={{ color: '#e0c9b0' }}>days to go</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
            <p className="text-3xl font-bold" style={{ color: '#2d1a0e' }}>{pending.length}</p>
            <p className="text-sm mt-1" style={{ color: '#5c3d2e' }}>⏳ Pending</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
            <p className="text-3xl font-bold" style={{ color: '#2d1a0e' }}>{confirmed.length}</p>
            <p className="text-sm mt-1" style={{ color: '#5c3d2e' }}>✅ Confirmed</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
            <p className="text-3xl font-bold" style={{ color: '#2d1a0e' }}>{savedBakers.length}</p>
            <p className="text-sm mt-1" style={{ color: '#5c3d2e' }}>❤️ Saved Bakers</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['orders', 'saved', 'nearby', 'account'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all"
              style={{
                backgroundColor: activeTab === tab ? '#2d1a0e' : 'white',
                color: activeTab === tab ? 'white' : '#2d1a0e'
              }}>
              {tab === 'nearby' ? '📍 Nearby' : tab === 'saved' ? '❤️ Saved' : tab === 'orders' ? '📦 Orders' : '👤 Account'}
            </button>
          ))}
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="flex flex-col gap-4">
            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl p-16 shadow-sm text-center">
                <p className="text-5xl mb-4">🎂</p>
                <p className="font-bold text-lg mb-2" style={{ color: '#2d1a0e' }}>No orders yet</p>
                <p className="text-sm mb-6" style={{ color: '#5c3d2e' }}>Find a baker and send your first request!</p>
                <Link href="/bakers" className="px-6 py-3 rounded-xl text-white font-semibold text-sm inline-block"
                  style={{ backgroundColor: '#2d1a0e' }}>
                  Browse Bakers
                </Link>
              </div>
            ) : (
              orders.map(order => {
                const daysUntil = getDaysUntil(order.event_date)
                const progressStep = getProgressStep(order.status)
                const steps = ['Request Sent', 'Baker Accepted', 'In Progress', 'Ready', 'Complete']

                return (
                  <div key={order.id} className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
                          style={{ backgroundColor: '#f5f0eb' }}>
                          {order.bakers?.profile_photo_url
                            ? <img src={order.bakers.profile_photo_url} alt="" className="w-full h-full object-cover" />
                            : <span className="text-2xl">🎂</span>}
                        </div>
                        <div>
                          <p className="font-bold" style={{ color: '#2d1a0e' }}>{order.bakers?.business_name}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>📍 {order.bakers?.city}, {order.bakers?.state}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="px-3 py-1 text-xs font-semibold rounded-full" style={{
                          backgroundColor: order.status === 'confirmed' ? '#dcfce7' : order.status === 'declined' ? '#fee2e2' : '#fef9c3',
                          color: order.status === 'confirmed' ? '#166534' : order.status === 'declined' ? '#991b1b' : '#854d0e'
                        }}>
                          {order.status === 'confirmed' ? '✓ Confirmed' : order.status === 'declined' ? '✗ Declined' : '⏳ Pending'}
                        </span>
                        {daysUntil > 0 && order.status !== 'declined' && (
                          <p className="text-xs mt-1 font-semibold" style={{ color: daysUntil <= 7 ? '#dc2626' : '#5c3d2e' }}>
                            {daysUntil === 1 ? 'Tomorrow!' : daysUntil + ' days away'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Progress Tracker */}
                    {order.status !== 'declined' && (
                      <div className="mb-5">
                        <div className="flex items-center justify-between mb-2">
                          {steps.map((step, i) => (
                            <div key={i} className="flex flex-col items-center flex-1">
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition-all"
                                style={{
                                  backgroundColor: i <= progressStep ? '#2d1a0e' : '#e0d5cc',
                                  color: i <= progressStep ? 'white' : '#5c3d2e'
                                }}>
                                {i <= progressStep ? '✓' : i + 1}
                              </div>
                              <p className="text-center leading-tight"
                                style={{ fontSize: '9px', color: i <= progressStep ? '#2d1a0e' : '#5c3d2e', fontWeight: i === progressStep ? '700' : '400' }}>
                                {step}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="relative h-1 rounded-full mt-1" style={{ backgroundColor: '#e0d5cc' }}>
                          <div className="absolute h-1 rounded-full transition-all duration-500"
                            style={{ backgroundColor: '#2d1a0e', width: (progressStep / (steps.length - 1) * 100) + '%' }} />
                        </div>
                      </div>
                    )}

                    {/* Order Details */}
                    <div className="grid grid-cols-3 gap-4 py-4 border-t border-b mb-4" style={{ borderColor: '#e0d5cc' }}>
                      <div>
                        <p className="text-xs font-semibold mb-0.5" style={{ color: '#5c3d2e' }}>Event</p>
                        <p className="text-sm font-medium" style={{ color: '#2d1a0e' }}>{order.event_type}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold mb-0.5" style={{ color: '#5c3d2e' }}>Date</p>
                        <p className="text-sm font-medium" style={{ color: '#2d1a0e' }}>{order.event_date}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold mb-0.5" style={{ color: '#5c3d2e' }}>Budget</p>
                        <p className="text-sm font-medium" style={{ color: '#2d1a0e' }}>${order.budget}</p>
                      </div>
                    </div>

                    {order.item_description && (
                      <p className="text-sm mb-4 leading-relaxed" style={{ color: '#5c3d2e' }}>{order.item_description}</p>
                    )}

                    <div className="flex gap-2">
                      <Link href={'/bakers/' + order.baker_id}
                        className="px-4 py-2 rounded-lg text-xs font-semibold border"
                        style={{ borderColor: '#2d1a0e', color: '#2d1a0e' }}>
                        View Baker
                      </Link>
                      {order.status === 'declined' && (
                        <Link href="/bakers" className="px-4 py-2 rounded-lg text-xs font-semibold text-white"
                          style={{ backgroundColor: '#2d1a0e' }}>
                          Find Another Baker
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Saved Bakers Tab */}
        {activeTab === 'saved' && (
          <div>
            {savedBakers.length === 0 ? (
              <div className="bg-white rounded-2xl p-16 shadow-sm text-center">
                <p className="text-5xl mb-4">❤️</p>
                <p className="font-bold text-lg mb-2" style={{ color: '#2d1a0e' }}>No saved bakers yet</p>
                <p className="text-sm mb-6" style={{ color: '#5c3d2e' }}>Heart a baker on their profile to save them here!</p>
                <Link href="/bakers" className="px-6 py-3 rounded-xl text-white font-semibold text-sm inline-block"
                  style={{ backgroundColor: '#2d1a0e' }}>
                  Browse Bakers
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {nearbyBakers.filter(b => savedBakers.includes(b.id)).map(baker => (
                  <div key={baker.id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                    <div className="h-36 overflow-hidden" style={{ backgroundColor: '#f5f0eb' }}>
                      {baker.profile_photo_url
                        ? <img src={baker.profile_photo_url} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-4xl">🎂</div>}
                    </div>
                    <div className="p-4">
                      <p className="font-bold" style={{ color: '#2d1a0e' }}>{baker.business_name}</p>
                      <p className="text-xs mt-0.5 mb-3" style={{ color: '#5c3d2e' }}>📍 {baker.city}, {baker.state}</p>
                      <div className="flex gap-2">
                        <Link href={'/bakers/' + baker.id}
                          className="flex-1 text-center py-2 rounded-lg text-xs font-semibold text-white"
                          style={{ backgroundColor: '#2d1a0e' }}>
                          View Profile
                        </Link>
                        <button onClick={() => toggleSave(baker.id)}
                          className="px-3 py-2 rounded-lg text-xs font-semibold border"
                          style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Nearby Bakers Tab */}
        {activeTab === 'nearby' && (
          <div className="grid grid-cols-2 gap-4">
            {nearbyBakers.length === 0 ? (
              <div className="col-span-2 bg-white rounded-2xl p-16 shadow-sm text-center">
                <p className="text-5xl mb-4">📍</p>
                <p className="font-bold text-lg mb-2" style={{ color: '#2d1a0e' }}>No bakers found nearby</p>
                <p className="text-sm" style={{ color: '#5c3d2e' }}>We're growing! Check back soon.</p>
              </div>
            ) : (
              nearbyBakers.map(baker => (
                <div key={baker.id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                  <div className="h-36 overflow-hidden relative" style={{ backgroundColor: '#f5f0eb' }}>
                    {baker.profile_photo_url
                      ? <img src={baker.profile_photo_url} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-4xl">🎂</div>}
                    <button onClick={() => toggleSave(baker.id)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-md text-sm"
                      style={{ backgroundColor: 'white', color: savedBakers.includes(baker.id) ? '#dc2626' : '#5c3d2e' }}>
                      {savedBakers.includes(baker.id) ? '❤️' : '🤍'}
                    </button>
                  </div>
                  <div className="p-4">
                    <p className="font-bold" style={{ color: '#2d1a0e' }}>{baker.business_name}</p>
                    <p className="text-xs mt-0.5 mb-1" style={{ color: '#5c3d2e' }}>📍 {baker.city}, {baker.state}</p>
                    {baker.starting_price && (
                      <p className="text-xs mb-3 font-semibold" style={{ color: '#2d1a0e' }}>From ${baker.starting_price}</p>
                    )}
                    <Link href={'/bakers/' + baker.id}
                      className="block text-center py-2 rounded-lg text-xs font-semibold text-white"
                      style={{ backgroundColor: '#2d1a0e' }}>
                      View Profile →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm max-w-lg">
            <h2 className="text-lg font-bold mb-6" style={{ color: '#2d1a0e' }}>Account Info</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: '#2d1a0e' }}>Full Name</label>
                <p className="px-4 py-3 rounded-lg border text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }}>
                  {customer?.full_name || '—'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: '#2d1a0e' }}>Email</label>
                <p className="px-4 py-3 rounded-lg border text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }}>
                  {customer?.email || '—'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: '#2d1a0e' }}>Location</label>
                <p className="px-4 py-3 rounded-lg border text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }}>
                  {customer?.city && customer?.state ? customer.city + ', ' + customer.state : 'Not set'}
                </p>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <p className="text-xs" style={{ color: '#5c3d2e' }}>
                  Want to sell on Whiskly?{' '}
                  <Link href="/join" className="font-semibold underline" style={{ color: '#2d1a0e' }}>Join as a Baker</Link>
                </p>
                <button onClick={handleSignOut} className="px-4 py-2 rounded-lg text-xs font-semibold border"
                  style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      <footer className="text-center py-8 mt-10" style={{ backgroundColor: '#2d1a0e' }}>
        <p className="text-sm" style={{ color: '#e0d5cc' }}>© 2026 Whiskly. All rights reserved.</p>
      </footer>
    </main>
  )
}