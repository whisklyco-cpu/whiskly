'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function BakerDashboard() {
  const router = useRouter()
  const [baker, setBaker] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // Profile fields
  const [businessName, setBusinessName] = useState('')
  const [bio, setBio] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [startingPrice, setStartingPrice] = useState('')
  const [leadTime, setLeadTime] = useState('7')

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: bakerData } = await supabase
      .from('bakers')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (bakerData) {
      setBaker(bakerData)
      setBusinessName(bakerData.business_name || '')
      setBio(bakerData.bio || '')
      setCity(bakerData.city || '')
      setState(bakerData.state || '')
      setZipCode(bakerData.zip_code || '')
      setStartingPrice(bakerData.starting_price?.toString() || '')
      setLeadTime(bakerData.lead_time_days?.toString() || '7')

      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('baker_id', bakerData.id)
        .order('created_at', { ascending: false })

      setOrders(ordersData || [])
    }
    setLoading(false)
  }

  async function saveProfile() {
    setSaving(true)
    await supabase.from('bakers').update({
      business_name: businessName,
      bio,
      city,
      state,
      zip_code: zipCode,
      starting_price: parseInt(startingPrice) || null,
      lead_time_days: parseInt(leadTime) || 7,
    }).eq('id', baker.id)
    setSaving(false)
    alert('Profile saved!')
  }

  async function updateOrderStatus(orderId: string, status: string) {
    await supabase.from('orders').update({ status }).eq('id', orderId)
    setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o))
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

  const pending = orders.filter(o => o.status === 'pending')
  const confirmed = orders.filter(o => o.status === 'confirmed')

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#f5f0eb' }}>

      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white shadow-sm">
        <Link href="/" className="text-2xl font-bold" style={{ color: '#2d1a0e' }}>Whiskly</Link>
        <p className="text-sm font-medium" style={{ color: '#2d1a0e' }}>Baker Dashboard</p>
        <div className="flex items-center gap-3">
          <Link href={`/bakers/${baker?.id}`} className="px-4 py-2 text-sm rounded-lg border" style={{ borderColor: '#2d1a0e', color: '#2d1a0e' }}>
            View Profile
          </Link>
          <button onClick={handleSignOut} className="px-4 py-2 text-sm rounded-lg text-white" style={{ backgroundColor: '#2d1a0e' }}>
            Sign Out
          </button>
        </div>
      </nav>

      <div className="px-8 py-8 max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold" style={{ color: '#2d1a0e' }}>{businessName || 'Your Bakery'}</h1>
          <p className="text-sm mt-1" style={{ color: '#5c3d2e' }}>Manage your profile and customer requests</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <p className="text-3xl font-bold" style={{ color: '#2d1a0e' }}>{pending.length}</p>
            <p className="text-sm mt-1" style={{ color: '#5c3d2e' }}>Pending Requests</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <p className="text-3xl font-bold" style={{ color: '#2d1a0e' }}>{confirmed.length}</p>
            <p className="text-sm mt-1" style={{ color: '#5c3d2e' }}>Confirmed Orders</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <p className="text-3xl font-bold" style={{ color: '#2d1a0e' }}>{orders.length}</p>
            <p className="text-sm mt-1" style={{ color: '#5c3d2e' }}>Total Orders</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['overview', 'orders', 'profile'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-5 py-2 rounded-lg text-sm font-semibold capitalize"
              style={{
                backgroundColor: activeTab === tab ? '#2d1a0e' : 'white',
                color: activeTab === tab ? 'white' : '#2d1a0e'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4" style={{ color: '#2d1a0e' }}>Recent Requests</h2>
            {pending.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">📬</p>
                <p className="font-semibold" style={{ color: '#2d1a0e' }}>No pending requests yet</p>
                <p className="text-sm mt-1" style={{ color: '#5c3d2e' }}>Share your profile to start getting orders</p>
                <div className="mt-4 px-4 py-2 bg-gray-50 rounded-lg text-sm inline-block" style={{ color: '#5c3d2e' }}>
                  {typeof window !== 'undefined' ? `${window.location.origin}/bakers/${baker?.id}` : ''}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {pending.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: '#f5f0eb' }}>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: '#2d1a0e' }}>{order.customer_name}</p>
                      <p className="text-xs mt-1" style={{ color: '#5c3d2e' }}>{order.event_type} · ${order.budget} budget · {order.event_date}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => updateOrderStatus(order.id, 'confirmed')} className="px-3 py-1 text-xs rounded-lg text-white" style={{ backgroundColor: '#2d1a0e' }}>Accept</button>
                      <button onClick={() => updateOrderStatus(order.id, 'declined')} className="px-3 py-1 text-xs rounded-lg border" style={{ borderColor: '#2d1a0e', color: '#2d1a0e' }}>Decline</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4" style={{ color: '#2d1a0e' }}>All Orders</h2>
            {orders.length === 0 ? (
              <p className="text-center py-8" style={{ color: '#5c3d2e' }}>No orders yet</p>
            ) : (
              <div className="flex flex-col gap-3">
                {orders.map((order) => (
                  <div key={order.id} className="p-4 rounded-xl border" style={{ borderColor: '#e0d5cc' }}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold" style={{ color: '#2d1a0e' }}>{order.customer_name}</p>
                      <span className="px-2 py-1 text-xs rounded-full" style={{
                        backgroundColor: order.status === 'confirmed' ? '#dcfce7' : order.status === 'declined' ? '#fee2e2' : '#fef9c3',
                        color: order.status === 'confirmed' ? '#166534' : order.status === 'declined' ? '#991b1b' : '#854d0e'
                      }}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: '#5c3d2e' }}>{order.event_type} · ${order.budget} · {order.event_date}</p>
                    {order.item_description && <p className="text-sm mt-1" style={{ color: '#5c3d2e' }}>{order.item_description}</p>}
                    {order.status === 'pending' && (
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => updateOrderStatus(order.id, 'confirmed')} className="px-3 py-1 text-xs rounded-lg text-white" style={{ backgroundColor: '#2d1a0e' }}>Accept</button>
                        <button onClick={() => updateOrderStatus(order.id, 'declined')} className="px-3 py-1 text-xs rounded-lg border" style={{ borderColor: '#2d1a0e', color: '#2d1a0e' }}>Decline</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-6" style={{ color: '#2d1a0e' }}>Edit Profile</h2>
            <div className="flex flex-col gap-4 max-w-lg">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#2d1a0e' }}>Business Name</label>
                <input value={businessName} onChange={e => setBusinessName(e.target.value)} className="w-full px-4 py-3 rounded-lg border text-sm" style={{ borderColor: '#e0d5cc' }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#2d1a0e' }}>Bio</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} className="w-full px-4 py-3 rounded-lg border text-sm" style={{ borderColor: '#e0d5cc' }} />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1" style={{ color: '#2d1a0e' }}>City</label>
                  <input value={city} onChange={e => setCity(e.target.value)} className="w-full px-4 py-3 rounded-lg border text-sm" style={{ borderColor: '#e0d5cc' }} />
                </div>
                <div className="w-20">
                  <label className="block text-sm font-medium mb-1" style={{ color: '#2d1a0e' }}>State</label>
                  <input value={state} onChange={e => setState(e.target.value)} className="w-full px-4 py-3 rounded-lg border text-sm" style={{ borderColor: '#e0d5cc' }} />
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1" style={{ color: '#2d1a0e' }}>Starting Price ($)</label>
                  <input value={startingPrice} onChange={e => setStartingPrice(e.target.value)} type="number" className="w-full px-4 py-3 rounded-lg border text-sm" style={{ borderColor: '#e0d5cc' }} />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1" style={{ color: '#2d1a0e' }}>Lead Time (days)</label>
                  <input value={leadTime} onChange={e => setLeadTime(e.target.value)} type="number" className="w-full px-4 py-3 rounded-lg border text-sm" style={{ borderColor: '#e0d5cc' }} />
                </div>
              </div>
              <button onClick={saveProfile} disabled={saving} className="py-3 rounded-lg text-white font-semibold" style={{ backgroundColor: '#2d1a0e', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}