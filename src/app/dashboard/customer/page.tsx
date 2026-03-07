'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function CustomerDashboard() {
  const router = useRouter()
  const [customer, setCustomer] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('orders')

  useEffect(() => { loadDashboard() }, [])

  async function loadDashboard() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { router.push('/login'); return }

  const { data: bakerData } = await supabase.from('bakers').select('id').eq('user_id', user.id).maybeSingle()
  if (bakerData) { router.push('/dashboard/baker'); return }

  const { data: customerData } = await supabase.from('customers').select('*').eq('user_id', user.id).maybeSingle()
  if (customerData) {
    setCustomer(customerData)
    const { data: ordersData } = await supabase
      .from('orders')
      .select('*, bakers(business_name, profile_photo_url, city, state)')
      .eq('customer_email', customerData.email)
      .order('created_at', { ascending: false })
    setOrders(ordersData || [])
  }
  setLoading(false)
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
  const declined = orders.filter(o => o.status === 'declined')

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#f5f0eb' }}>

      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white shadow-sm">
        <Link href="/" className="text-2xl font-bold" style={{ color: '#2d1a0e' }}>🎂 Whiskly</Link>
        <p className="text-sm font-medium" style={{ color: '#2d1a0e' }}>My Dashboard</p>
        <div className="flex items-center gap-3">
          <Link href="/bakers" className="px-4 py-2 text-sm rounded-lg border" style={{ borderColor: '#2d1a0e', color: '#2d1a0e' }}>Browse Bakers</Link>
          <button onClick={handleSignOut} className="px-4 py-2 text-sm rounded-lg text-white" style={{ backgroundColor: '#2d1a0e' }}>Sign Out</button>
        </div>
      </nav>

      <div className="px-8 py-8 max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold" style={{ color: '#2d1a0e' }}>
            Hey, {customer?.full_name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: '#5c3d2e' }}>Track your orders and find new bakers</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <p className="text-3xl font-bold" style={{ color: '#2d1a0e' }}>{pending.length}</p>
            <p className="text-sm mt-1" style={{ color: '#5c3d2e' }}>Pending</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <p className="text-3xl font-bold" style={{ color: '#2d1a0e' }}>{confirmed.length}</p>
            <p className="text-sm mt-1" style={{ color: '#5c3d2e' }}>Confirmed</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <p className="text-3xl font-bold" style={{ color: '#2d1a0e' }}>{orders.length}</p>
            <p className="text-sm mt-1" style={{ color: '#5c3d2e' }}>Total Orders</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['orders', 'account'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-5 py-2 rounded-lg text-sm font-semibold capitalize"
              style={{ backgroundColor: activeTab === tab ? '#2d1a0e' : 'white', color: activeTab === tab ? 'white' : '#2d1a0e' }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="flex flex-col gap-4">
            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
                <p className="text-4xl mb-3">🎂</p>
                <p className="font-semibold mb-1" style={{ color: '#2d1a0e' }}>No orders yet</p>
                <p className="text-sm mb-6" style={{ color: '#5c3d2e' }}>Find a baker and send your first request!</p>
                <Link href="/bakers" className="px-6 py-3 rounded-xl text-white font-semibold text-sm inline-block"
                  style={{ backgroundColor: '#2d1a0e' }}>
                  Browse Bakers
                </Link>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">

                    {/* Baker Info */}
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
                        style={{ backgroundColor: '#f5f0eb' }}>
                        {order.bakers?.profile_photo_url ? (
                          <img src={order.bakers.profile_photo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl">🎂</span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold" style={{ color: '#2d1a0e' }}>{order.bakers?.business_name || 'Unknown Baker'}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>
                          📍 {order.bakers?.city}, {order.bakers?.state}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span className="px-3 py-1 text-xs font-semibold rounded-full flex-shrink-0" style={{
                      backgroundColor: order.status === 'confirmed' ? '#dcfce7' : order.status === 'declined' ? '#fee2e2' : '#fef9c3',
                      color: order.status === 'confirmed' ? '#166534' : order.status === 'declined' ? '#991b1b' : '#854d0e'
                    }}>
                      {order.status === 'confirmed' ? '✓ Confirmed' : order.status === 'declined' ? '✗ Declined' : '⏳ Pending'}
                    </span>
                  </div>

                  {/* Order Details */}
                  <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4" style={{ borderColor: '#e0d5cc' }}>
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
                    <p className="mt-3 text-sm leading-relaxed" style={{ color: '#5c3d2e' }}>{order.item_description}</p>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                    <Link href={'/bakers/' + order.baker_id}
                      className="px-4 py-2 rounded-lg text-xs font-semibold border"
                      style={{ borderColor: '#2d1a0e', color: '#2d1a0e' }}>
                      View Baker Profile
                    </Link>
                    {order.status === 'confirmed' && (
                      <span className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>
                        🎉 Your order is confirmed!
                      </span>
                    )}
                    {order.status === 'declined' && (
                      <Link href="/bakers" className="px-4 py-2 rounded-lg text-xs font-semibold text-white"
                        style={{ backgroundColor: '#2d1a0e' }}>
                        Find Another Baker
                      </Link>
                    )}
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
                  {customer?.full_name}
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: '#2d1a0e' }}>Email</label>
                <p className="px-4 py-3 rounded-lg border text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }}>
                  {customer?.email}
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: '#2d1a0e' }}>Location</label>
                <p className="px-4 py-3 rounded-lg border text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }}>
                  {customer?.city && customer?.state ? customer.city + ', ' + customer.state : 'Not set'}
                </p>
              </div>
              <div className="pt-2">
                <p className="text-xs" style={{ color: '#5c3d2e' }}>
                  Want to sell on Whiskly?{' '}
                  <Link href="/join" className="font-semibold underline" style={{ color: '#2d1a0e' }}>Join as a Baker</Link>
                </p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Footer */}
      <footer className="text-center py-8 mt-10" style={{ backgroundColor: '#2d1a0e' }}>
        <p className="text-sm" style={{ color: '#e0d5cc' }}>© 2026 Whiskly. All rights reserved.</p>
      </footer>
    </main>
  )
}