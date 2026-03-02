'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function BakerDashboard() {
  const router = useRouter()
  const [baker, setBaker] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [portfolio, setPortfolio] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const [businessName, setBusinessName] = useState('')
  const [bio, setBio] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [startingPrice, setStartingPrice] = useState('')
  const [leadTime, setLeadTime] = useState('7')

  useEffect(() => {
  loadDashboard()
  // Handle Stripe Connect return
  const params = new URLSearchParams(window.location.search)
  if (params.get('stripe') === 'success') {
    alert('Stripe connected successfully! You can now receive payments.')
    window.history.replaceState({}, '', '/dashboard/baker')
  }
}, [])

  async function loadDashboard() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: bakerData } = await supabase
      .from('bakers').select('*').eq('user_id', user.id).single()

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
        .from('orders').select('*').eq('baker_id', bakerData.id)
        .order('created_at', { ascending: false })
      setOrders(ordersData || [])

      const { data: portfolioData } = await supabase
        .from('portfolio_items').select('*').eq('baker_id', bakerData.id)
        .order('created_at', { ascending: false })
      setPortfolio(portfolioData || [])
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
      specialties: baker?.specialties || [],
      rush_orders_available: baker?.rush_orders_available || false,
      cancellation_policy: baker?.cancellation_policy || '',
    }).eq('id', baker.id)
    setSaving(false)
    alert('Profile saved!')
  }

  async function uploadPhoto(file: File) {
    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = baker.id + '.' + fileExt
    const { error: uploadError } = await supabase.storage
      .from('baker-photos').upload(fileName, file, { upsert: true })
    if (!uploadError) {
      const { data } = supabase.storage.from('baker-photos').getPublicUrl(fileName)
      await supabase.from('bakers').update({ profile_photo_url: data.publicUrl }).eq('id', baker.id)
      setBaker({ ...baker, profile_photo_url: data.publicUrl })
    }
    setUploading(false)
  }

  async function uploadPortfolioPhoto(file: File) {
    setUploadingPortfolio(true)
    const fileExt = file.name.split('.').pop()
    const fileName = baker.id + '-' + Date.now() + '.' + fileExt
    const { error: uploadError } = await supabase.storage
      .from('baker-photos').upload(fileName, file, { upsert: true })
    if (!uploadError) {
      const { data } = supabase.storage.from('baker-photos').getPublicUrl(fileName)
      const { data: newItem } = await supabase.from('portfolio_items')
        .insert({ baker_id: baker.id, image_url: data.publicUrl, is_visible: true })
        .select().single()
      if (newItem) setPortfolio([newItem, ...portfolio])
    }
    setUploadingPortfolio(false)
  }

  async function deletePortfolioPhoto(id: string) {
    await supabase.from('portfolio_items').delete().eq('id', id)
    setPortfolio(portfolio.filter(p => p.id !== id))
  }

  async function updateOrderStatus(orderId: string, status: string) {
    await supabase.from('orders').update({ status }).eq('id', orderId)
    setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o))
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }
async function connectStripe() {
  const { data: { user } } = await supabase.auth.getUser()
  const res = await fetch('/api/stripe/connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bakerId: baker.id, email: user?.email })
  })
  const data = await res.json()
  if (data.url) window.location.href = data.url
}
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f0eb' }}>
      <p style={{ color: '#2d1a0e' }}>Loading your dashboard...</p>
    </div>
  )

  const pending = orders.filter(o => o.status === 'pending')
  const confirmed = orders.filter(o => o.status === 'confirmed')
  const maxPhotos = baker?.tier === 'pro' ? 10 : 3

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#f5f0eb' }}>

      <nav className="flex items-center justify-between px-8 py-4 bg-white shadow-sm">
        <Link href="/" className="text-2xl font-bold" style={{ color: '#2d1a0e' }}>🎂 Whiskly</Link>
        <p className="text-sm font-medium" style={{ color: '#2d1a0e' }}>Baker Dashboard</p>
        <div className="flex items-center gap-3">
          <Link href={'/bakers/' + baker?.id} className="px-4 py-2 text-sm rounded-lg border" style={{ borderColor: '#2d1a0e', color: '#2d1a0e' }}>View Profile</Link>
          <button onClick={handleSignOut} className="px-4 py-2 text-sm rounded-lg text-white" style={{ backgroundColor: '#2d1a0e' }}>Sign Out</button>
        </div>
      </nav>

      <div className="px-8 py-8 max-w-6xl mx-auto">

        <div className="mb-8">
          <h1 className="text-3xl font-bold" style={{ color: '#2d1a0e' }}>{businessName || 'Your Bakery'}</h1>
          <p className="text-sm mt-1" style={{ color: '#5c3d2e' }}>Manage your profile and customer requests</p>
        </div>

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

        <div className="flex gap-2 mb-6">
          {['overview', 'orders', 'profile', 'gallery'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-5 py-2 rounded-lg text-sm font-semibold capitalize"
              style={{ backgroundColor: activeTab === tab ? '#2d1a0e' : 'white', color: activeTab === tab ? 'white' : '#2d1a0e' }}>
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
                  {typeof window !== 'undefined' ? window.location.origin + '/bakers/' + baker?.id : ''}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {pending.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: '#f5f0eb' }}>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: '#2d1a0e' }}>{order.customer_name}</p>
                      <p className="text-xs mt-1" style={{ color: '#5c3d2e' }}>{order.event_type} · ${order.budget} · {order.event_date}</p>
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
                      }}>{order.status}</span>
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
            <div className="flex flex-col gap-5 max-w-lg">

              {/* Tier Badge */}
              <div className="p-4 rounded-xl border" style={{ borderColor: '#e0d5cc', backgroundColor: '#faf8f6' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#2d1a0e' }}>
                      {baker?.tier === 'pro' ? '⭐ Pro Baker' : '🆓 Free Tier'}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>
                      {baker?.tier === 'pro'
                        ? 'Featured placement · 10 photos · Verified badge'
                        : 'Standard listing · 3 photos · Basic profile'}
                    </p>
                  </div>
                  {/* Stripe Connect */}
<div className="p-4 rounded-xl border" style={{ borderColor: '#e0d5cc', backgroundColor: '#faf8f6' }}>
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-semibold" style={{ color: '#2d1a0e' }}>
        {baker?.stripe_account_id ? '✅ Stripe Connected' : '💳 Connect Stripe'}
      </p>
      <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>
        {baker?.stripe_account_id
          ? 'You can receive payments from customers'
          : 'Required to receive payments on Whiskly'}
      </p>
    </div>
    {!baker?.stripe_account_id && (
      <button
        onClick={connectStripe}
        className="px-4 py-2 rounded-lg text-white text-xs font-semibold"
        style={{ backgroundColor: '#635bff' }}
      >
        Connect →
      </button>
    )}
  </div>
</div>
                  {baker?.tier !== 'pro' && (
                    <button
                      onClick={() => alert('Stripe billing coming soon!')}
                      className="px-4 py-2 rounded-lg text-white text-xs font-semibold"
                      style={{ backgroundColor: '#8B4513' }}
                    >
                      Upgrade to Pro
                    </button>
                  )}
                </div>
              </div>

              {/* Profile Photo */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#2d1a0e' }}>Profile Photo</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#f5f0eb' }}>
                    {baker?.profile_photo_url
                      ? <img src={baker.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
                      : <span className="text-2xl">🎂</span>}
                  </div>
                  <div>
                    <label className="cursor-pointer px-4 py-2 rounded-lg text-sm font-semibold border inline-block" style={{ borderColor: '#2d1a0e', color: '#2d1a0e' }}>
                      {uploading ? 'Uploading...' : 'Upload Photo'}
                      <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) uploadPhoto(e.target.files[0]) }} />
                    </label>
                    <p className="text-xs mt-1" style={{ color: '#5c3d2e' }}>JPG, PNG — shows on your public profile</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: '#2d1a0e' }}>Business Name</label>
                <input value={businessName} onChange={e => setBusinessName(e.target.value)} className="w-full px-4 py-3 rounded-lg border text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: '#2d1a0e' }}>Bio</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} className="w-full px-4 py-3 rounded-lg border text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-1" style={{ color: '#2d1a0e' }}>City</label>
                  <input value={city} onChange={e => setCity(e.target.value)} className="w-full px-4 py-3 rounded-lg border text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
                </div>
                <div className="w-20">
                  <label className="block text-sm font-semibold mb-1" style={{ color: '#2d1a0e' }}>State</label>
                  <input value={state} onChange={e => setState(e.target.value)} className="w-full px-4 py-3 rounded-lg border text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-1" style={{ color: '#2d1a0e' }}>Starting Price ($)</label>
                  <input value={startingPrice} onChange={e => setStartingPrice(e.target.value)} type="number" className="w-full px-4 py-3 rounded-lg border text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-1" style={{ color: '#2d1a0e' }}>Lead Time (days)</label>
                  <input value={leadTime} onChange={e => setLeadTime(e.target.value)} type="number" className="w-full px-4 py-3 rounded-lg border text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
                </div>
              </div>

              {/* Specialties */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#2d1a0e' }}>Specialties</label>
                <div className="flex flex-wrap gap-2">
                  {['Wedding Cakes','Birthday Cakes','Custom Cookies','Cupcakes','Kids Party Cakes','Vegan/Gluten Free','Alcohol Infused','Breads','Cheesecakes','Macarons','Custom Dessert Boxes'].map(s => (
                    <button key={s}
                      onClick={() => {
                        const current = baker?.specialties || []
                        const updated = current.includes(s) ? current.filter((x: string) => x !== s) : [...current, s]
                        setBaker({ ...baker, specialties: updated })
                      }}
                      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                      style={{
                        backgroundColor: baker?.specialties?.includes(s) ? '#2d1a0e' : '#f5f0eb',
                        color: baker?.specialties?.includes(s) ? 'white' : '#2d1a0e',
                        border: '1px solid ' + (baker?.specialties?.includes(s) ? '#2d1a0e' : '#e0d5cc')
                      }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rush Orders Toggle */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#2d1a0e' }}>Rush Orders</label>
                <button
                  onClick={() => setBaker({ ...baker, rush_orders_available: !baker?.rush_orders_available })}
                  className="flex items-center gap-3 p-3 rounded-xl w-full text-left"
                  style={{ backgroundColor: '#f5f0eb' }}
                >
                  <div className="w-10 h-6 rounded-full transition-all relative flex-shrink-0"
                    style={{ backgroundColor: baker?.rush_orders_available ? '#2d1a0e' : '#e0d5cc' }}>
                    <div className="w-4 h-4 bg-white rounded-full absolute top-1 transition-all"
                      style={{ left: baker?.rush_orders_available ? '22px' : '4px' }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#2d1a0e' }}>
                      {baker?.rush_orders_available ? 'Accepting rush orders' : 'Not accepting rush orders'}
                    </p>
                    <p className="text-xs" style={{ color: '#5c3d2e' }}>Toggle to let customers know your availability</p>
                  </div>
                </button>
              </div>

              {/* Cancellation Policy */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>Cancellation Policy</label>
                <textarea
                  value={baker?.cancellation_policy || ''}
                  onChange={e => setBaker({ ...baker, cancellation_policy: e.target.value })}
                  rows={3}
                  placeholder="e.g. Full refund if cancelled 2+ weeks out. 50% refund within 1 week. No refund within 48 hours."
                  className="w-full px-4 py-3 rounded-lg border text-sm"
                  style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }}
                />
              </div>

              <button onClick={saveProfile} disabled={saving} className="py-3 rounded-lg text-white font-semibold" style={{ backgroundColor: '#2d1a0e', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        )}

        {/* Gallery Tab */}
        {activeTab === 'gallery' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold" style={{ color: '#2d1a0e' }}>Portfolio Gallery</h2>
                <p className="text-sm mt-1" style={{ color: '#5c3d2e' }}>
                  {portfolio.length}/{maxPhotos} photos · {baker?.tier !== 'pro' && 'Upgrade to Pro for 10 photos · '}Customers see this on your profile
                </p>
              </div>
              {portfolio.length < maxPhotos && (
                <label className="cursor-pointer px-4 py-2 rounded-lg text-white text-sm font-semibold" style={{ backgroundColor: '#2d1a0e' }}>
                  {uploadingPortfolio ? 'Uploading...' : '+ Add Photo'}
                  <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) uploadPortfolioPhoto(e.target.files[0]) }} />
                </label>
              )}
            </div>

            {portfolio.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed rounded-2xl" style={{ borderColor: '#e0d5cc' }}>
                <p className="text-4xl mb-3">📸</p>
                <p className="font-semibold mb-1" style={{ color: '#2d1a0e' }}>No photos yet</p>
                <p className="text-sm mb-4" style={{ color: '#5c3d2e' }}>Upload your best work to attract customers</p>
                <label className="cursor-pointer px-6 py-3 rounded-xl text-white text-sm font-semibold inline-block" style={{ backgroundColor: '#2d1a0e' }}>
                  {uploadingPortfolio ? 'Uploading...' : 'Upload Your First Photo'}
                  <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) uploadPortfolioPhoto(e.target.files[0]) }} />
                </label>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {portfolio.map((item) => (
                  <div key={item.id} className="relative group rounded-xl overflow-hidden" style={{ aspectRatio: '1' }}>
                    <img src={item.image_url} alt="Portfolio" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
                      <button onClick={() => deletePortfolioPhoto(item.id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: '#991b1b' }}>Delete</button>
                    </div>
                  </div>
                ))}
                {portfolio.length < maxPhotos && (
                  <label className="cursor-pointer rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2" style={{ borderColor: '#e0d5cc', aspectRatio: '1' }}>
                    <span className="text-2xl" style={{ color: '#5c3d2e' }}>+</span>
                    <span className="text-xs font-medium" style={{ color: '#5c3d2e' }}>Add photo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) uploadPortfolioPhoto(e.target.files[0]) }} />
                  </label>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  )
}