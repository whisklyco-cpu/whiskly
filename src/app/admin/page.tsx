'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const TABS = ['Overview', 'Orders', 'Bakers', 'Customers', 'Disputes', 'Applications', 'Emergency', 'Accounting']

export default function AdminPanel() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState('')
  const [activeTab, setActiveTab] = useState('Overview')

  const [orders, setOrders] = useState<any[]>([])
  const [bakers, setBakers] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [emergencyCases, setEmergencyCases] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const [orderSearch, setOrderSearch] = useState('')
  const [bakerSearch, setBakerSearch] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  function handleAuth() {
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setAuthed(true)
      loadAll()
    } else {
      setAuthError('Incorrect password.')
    }
  }

  async function loadAll() {
    setLoading(true)
    const [ordersRes, bakersRes, customersRes, emergencyRes] = await Promise.all([
      supabase.from('orders').select('*, bakers(id, business_name, city, state, is_pro, stripe_account_id)').order('created_at', { ascending: false }),
      supabase.from('bakers').select('*').order('created_at', { ascending: false }),
      supabase.from('customers').select('*').order('created_at', { ascending: false }),
      supabase.from('emergency_cases').select('*, bakers(business_name, email, city, state)').eq('status', 'open').order('created_at', { ascending: false }),
    ])
    setOrders(ordersRes.data || [])
    setBakers(bakersRes.data || [])
    setCustomers(customersRes.data || [])
    setEmergencyCases(emergencyRes.data || [])
    setLoading(false)
  }

  async function toggleBakerSuspend(baker: any) {
    const newVal = !baker.is_suspended
    await supabase.from('bakers').update({ is_suspended: newVal }).eq('id', baker.id)
    setBakers(bakers.map(b => b.id === baker.id ? { ...b, is_suspended: newVal } : b))
  }

  async function toggleBakerPro(baker: any) {
    const newVal = !baker.is_pro
    await supabase.from('bakers').update({ is_pro: newVal }).eq('id', baker.id)
    setBakers(bakers.map(b => b.id === baker.id ? { ...b, is_pro: newVal } : b))
  }

  async function toggleFoundingBaker(baker: any) {
    const newVal = !baker.is_founding_baker
    await supabase.from('bakers').update({ is_founding_baker: newVal }).eq('id', baker.id)
    setBakers(bakers.map(b => b.id === baker.id ? { ...b, is_founding_baker: newVal } : b))
  }

  async function toggleFeatured(baker: any) {
    const newVal = !baker.is_featured
    await supabase.from('bakers').update({ is_featured: newVal }).eq('id', baker.id)
    setBakers(bakers.map(b => b.id === baker.id ? { ...b, is_featured: newVal } : b))
  }

  async function approveBaker(baker: any) {
    await supabase.from('bakers').update({ is_active: true, profile_complete: true }).eq('id', baker.id)
    setBakers(bakers.map(b => b.id === baker.id ? { ...b, is_active: true, profile_complete: true } : b))
  }

  async function rejectBaker(baker: any) {
    await supabase.from('bakers').update({ is_suspended: true }).eq('id', baker.id)
    setBakers(bakers.map(b => b.id === baker.id ? { ...b, is_suspended: true } : b))
  }

  async function toggleCustomerSuspend(customer: any) {
    const newVal = !customer.is_suspended
    await supabase.from('customers').update({ is_suspended: newVal }).eq('id', customer.id)
    setCustomers(customers.map(c => c.id === customer.id ? { ...c, is_suspended: newVal } : c))
  }

  async function flagOrder(order: any) {
    const newVal = !order.is_flagged
    await supabase.from('orders').update({ is_flagged: newVal }).eq('id', order.id)
    setOrders(orders.map(o => o.id === order.id ? { ...o, is_flagged: newVal } : o))
  }

  async function resolveDispute(order: any) {
    await supabase.from('orders').update({ is_disputed: false, is_flagged: false, status: 'complete' }).eq('id', order.id)
    setOrders(orders.map(o => o.id === order.id ? { ...o, is_disputed: false, is_flagged: false, status: 'complete' } : o))
  }

  async function issueRefund(order: any) {
    if (!confirm('Issue full refund for order ' + order.id.slice(0, 8) + '?')) return
    const res = await fetch('/api/stripe/refund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: order.id }),
    })
    const data = await res.json()
    if (data.error) { alert('Refund error: ' + data.error); return }
    alert('Refund issued successfully.')
    setOrders(orders.map(o => o.id === order.id ? { ...o, status: 'refunded' } : o))
  }

  async function handleStrike(baker: any) {
    const reason = prompt('Reason for strike:')
    if (!reason) return
    const newCount = (baker.strike_count || 0) + 1
    const log = [...(baker.strike_log || []), { reason, date: new Date().toISOString(), count: newCount }]
    await supabase.from('bakers').update({ strike_count: newCount, strike_log: log }).eq('id', baker.id)
    setBakers(bakers.map(b => b.id === baker.id ? { ...b, strike_count: newCount, strike_log: log } : b))
    const subject = newCount >= 3 ? 'Your Whiskly account has been suspended' : 'Warning — Whiskly account violation'
    const body = newCount >= 3
      ? 'Your account has received 3 strikes and has been automatically suspended. Please contact support@whiskly.co to appeal.'
      : 'Your account has received strike ' + newCount + ' of 3 for: ' + reason + '. Further violations may result in suspension.'
    await fetch('/api/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'announcement', to: baker.email, name: baker.business_name, subject, body }) }).catch(() => {})
    if (newCount >= 3) {
      await supabase.from('bakers').update({ is_suspended: true }).eq('id', baker.id)
      setBakers(bakers.map(b => b.id === baker.id ? { ...b, is_suspended: true, strike_count: newCount } : b))
      alert(baker.business_name + ' has been automatically suspended after 3 strikes.')
    } else {
      alert('Strike ' + newCount + ' issued to ' + baker.business_name + '. Warning email sent.')
    }
  }

  function getFilteredOrders() {
    return orders.filter(o => {
      if (dateFrom && o.created_at < dateFrom) return false
      if (dateTo && o.created_at > dateTo + 'T23:59:59') return false
      return true
    })
  }

  function downloadCSV() {
    const filtered = getFilteredOrders()
    const rows = [
      ['Date', 'Order ID', 'Customer', 'Baker', 'Event Type', 'Total ($)', 'Commission ($)', 'Deposit Paid', 'Remainder Paid', 'Status'],
      ...filtered.map(o => {
        const total = o.amount_total ? (o.amount_total / 100).toFixed(2) : o.budget || 0
        const commission = o.amount_total ? ((o.amount_total / 100) * (o.bakers?.is_pro ? 0.07 : 0.10)).toFixed(2) : ''
        return [new Date(o.created_at).toLocaleDateString(), o.id.slice(0, 8), o.customer_name, o.bakers?.business_name || '', o.event_type, total, commission, o.deposit_paid_at ? 'Yes' : 'No', o.remainder_paid_at ? 'Yes' : 'No', o.status]
      })
    ]
    const csv = rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'whiskly-transactions-' + new Date().toISOString().slice(0, 10) + '.csv'
    a.click()
  }

  const totalGMV = orders.filter(o => o.deposit_paid_at).reduce((sum, o) => sum + (o.amount_total || (o.budget * 100) || 0), 0) / 100
  const totalCommission = orders.filter(o => o.deposit_paid_at).reduce((sum, o) => {
    const rate = o.bakers?.is_pro ? 0.07 : 0.10
    return sum + ((o.amount_total || (o.budget * 100) || 0) / 100) * rate
  }, 0)
  const pendingOrders = orders.filter(o => o.status === 'pending').length
  const disputedOrders = orders.filter(o => o.is_disputed || o.is_flagged)
  const pendingApplications = bakers.filter(b => !b.is_active || !b.profile_complete)
  const proCount = bakers.filter(b => b.is_pro).length

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f0eb' }}>
        <div className="bg-white rounded-2xl p-8 shadow-sm w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#2d1a0e' }}>Admin Panel</h1>
          <p className="text-sm mb-6" style={{ color: '#5c3d2e' }}>Whiskly internal access only</p>
          <div className="relative mb-3">
            <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAuth()} placeholder="Enter admin password" className="w-full px-4 py-3 rounded-xl border text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-xs font-semibold" style={{ color: '#5c3d2e' }}>{showPassword ? 'Hide' : 'Show'}</button>
          </div>
          {authError && <p className="text-xs mb-3" style={{ color: '#dc2626' }}>{authError}</p>}
          <button onClick={handleAuth} className="w-full py-3 rounded-xl text-white font-semibold text-sm" style={{ backgroundColor: '#2d1a0e' }}>Sign In</button>
          <p className="text-xs text-center mt-4" style={{ color: '#9c7b6b' }}>
            To change your password, update NEXT_PUBLIC_ADMIN_PASSWORD in your{' '}
            <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="underline">Vercel environment variables</a>.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f0eb' }}>
      <nav className="bg-white shadow-sm px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-lg font-bold" style={{ color: '#2d1a0e' }}>🎂 Whiskly</Link>
          <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ backgroundColor: '#fef9c3', color: '#854d0e' }}>Admin</span>
        </div>
        <div className="flex items-center gap-3">
          {emergencyCases.length > 0 && (
            <button onClick={() => setActiveTab('Emergency')} className="text-xs px-3 py-1.5 rounded-full font-semibold cursor-pointer" style={{ backgroundColor: '#dc2626', color: 'white' }}>
              {emergencyCases.length} emergency — click now
            </button>
          )}
          {disputedOrders.length > 0 && (
            <button onClick={() => setActiveTab('Disputes')} className="text-xs px-3 py-1.5 rounded-full font-semibold cursor-pointer" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>
              {disputedOrders.length} dispute{disputedOrders.length > 1 ? 's' : ''} — click to review
            </button>
          )}
          {pendingApplications.length > 0 && (
            <button onClick={() => setActiveTab('Applications')} className="text-xs px-3 py-1.5 rounded-full font-semibold cursor-pointer" style={{ backgroundColor: '#fef9c3', color: '#854d0e' }}>
              {pendingApplications.length} application{pendingApplications.length > 1 ? 's' : ''} — click to review
            </button>
          )}
          <button onClick={() => setAuthed(false)} className="px-3 py-1.5 rounded-lg border text-xs font-semibold" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>Sign Out</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-2 mb-6 flex-wrap">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className="px-4 py-2 rounded-lg text-sm font-semibold relative" style={{ backgroundColor: activeTab === tab ? '#2d1a0e' : 'white', color: activeTab === tab ? 'white' : '#2d1a0e' }}>
              {tab}
              {tab === 'Disputes' && disputedOrders.length > 0 && <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: '#dc2626', color: 'white' }}>{disputedOrders.length}</span>}
              {tab === 'Applications' && pendingApplications.length > 0 && <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: '#f59e0b', color: 'white' }}>{pendingApplications.length}</span>}
              {tab === 'Emergency' && emergencyCases.length > 0 && <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: '#dc2626', color: 'white' }}>{emergencyCases.length}</span>}
            </button>
          ))}
        </div>

        {loading && <p className="text-sm" style={{ color: '#5c3d2e' }}>Loading...</p>}

        {activeTab === 'Overview' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total GMV', value: '$' + totalGMV.toFixed(2), sub: 'all paid orders', tab: 'Accounting', color: '#2d1a0e' },
                { label: 'Commission Earned', value: '$' + totalCommission.toFixed(2), sub: '10% / 7% Pro', tab: 'Accounting', color: '#2d1a0e' },
                { label: 'Pro Bakers', value: proCount + ' / ' + bakers.length, sub: 'click to manage bakers', tab: 'Bakers', color: '#8B4513' },
                { label: 'Pending Orders', value: pendingOrders, sub: 'click to view orders', tab: 'Orders', color: pendingOrders > 0 ? '#854d0e' : '#2d1a0e' },
              ].map(stat => (
                <button key={stat.label} onClick={() => setActiveTab(stat.tab)} className="bg-white rounded-2xl p-5 shadow-sm text-left hover:shadow-md transition-shadow group">
                  <p className="text-xs font-semibold mb-1" style={{ color: '#5c3d2e' }}>{stat.label}</p>
                  <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                  <p className="text-xs mt-1 group-hover:underline" style={{ color: '#9c7b6b' }}>{stat.sub} →</p>
                </button>
              ))}
            </div>

            {(disputedOrders.length > 0 || pendingApplications.length > 0 || emergencyCases.length > 0) && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-4" style={{ color: '#2d1a0e' }}>Needs Attention</h2>
                <div className="flex flex-col gap-3">
                  {emergencyCases.map(ec => (
                    <div key={ec.id} className="flex items-center justify-between p-4 rounded-xl border-l-4 gap-4" style={{ backgroundColor: '#fef2f2', borderColor: '#dc2626' }}>
                      <div>
                        <p className="text-sm font-bold" style={{ color: '#991b1b' }}>EMERGENCY — {ec.bakers?.business_name}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>{ec.bakers?.city}, {ec.bakers?.state} · Opened {new Date(ec.created_at).toLocaleString()}</p>
                      </div>
                      <button onClick={() => setActiveTab('Emergency')} className="flex-shrink-0 px-4 py-2 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: '#dc2626' }}>Handle Now</button>
                    </div>
                  ))}
                  {pendingApplications.map(baker => (
                    <div key={baker.id} className="flex items-center justify-between p-4 rounded-xl border-l-4 gap-4" style={{ backgroundColor: '#fffbeb', borderColor: '#f59e0b' }}>
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#f5f0eb' }}>
                          {baker.profile_photo_url ? <img src={baker.profile_photo_url} alt="" className="w-full h-full object-cover" /> : <span className="font-bold text-sm" style={{ color: '#2d1a0e' }}>{baker.business_name?.[0]}</span>}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold" style={{ color: '#2d1a0e' }}>Baker Application — {baker.business_name}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>{baker.city}, {baker.state} · {baker.email}</p>
                          {baker.specialties?.length > 0 && <p className="text-xs mt-0.5" style={{ color: '#8B4513' }}>{baker.specialties.slice(0, 3).join(', ')}</p>}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Link href={'/bakers/' + baker.id} target="_blank" className="px-3 py-2 rounded-lg text-xs font-semibold border" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>View</Link>
                        <button onClick={() => approveBaker(baker)} className="px-4 py-2 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: '#166534' }}>Approve</button>
                        <button onClick={() => rejectBaker(baker)} className="px-4 py-2 rounded-lg text-xs font-bold border" style={{ borderColor: '#dc2626', color: '#dc2626' }}>Reject</button>
                      </div>
                    </div>
                  ))}
                  {disputedOrders.map(order => (
                    <div key={order.id} className="flex items-center justify-between p-4 rounded-xl border-l-4 gap-4" style={{ backgroundColor: '#fef2f2', borderColor: '#dc2626' }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold" style={{ color: '#2d1a0e' }}>Dispute — {order.customer_name} vs {order.bakers?.business_name}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>{order.event_type} · {order.event_date} · ${order.budget} · Order {order.id.slice(0, 8)}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => resolveDispute(order)} className="px-4 py-2 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: '#166534' }}>Resolve</button>
                        {order.deposit_paid_at && <button onClick={() => issueRefund(order)} className="px-4 py-2 rounded-lg text-xs font-bold border" style={{ borderColor: '#dc2626', color: '#dc2626' }}>Refund</button>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold" style={{ color: '#2d1a0e' }}>Recent Orders</h2>
                <button onClick={() => setActiveTab('Orders')} className="text-xs font-semibold underline" style={{ color: '#8B4513' }}>View all orders →</button>
              </div>
              <div className="flex flex-col gap-2">
                {orders.slice(0, 8).map(order => (
                  <div key={order.id} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: order.is_flagged ? '#fff7ed' : order.is_disputed ? '#fef2f2' : '#faf8f6' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: '#2d1a0e' }}>{order.customer_name}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>{order.event_type} · {order.bakers?.business_name} · ${order.budget}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs" style={{ color: '#9c7b6b' }}>{new Date(order.created_at).toLocaleDateString()}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: order.status === 'complete' ? '#dcfce7' : order.status === 'pending' ? '#fef9c3' : order.status === 'declined' ? '#fee2e2' : '#dbeafe', color: order.status === 'complete' ? '#166534' : order.status === 'pending' ? '#854d0e' : order.status === 'declined' ? '#991b1b' : '#1e40af' }}>{order.status}</span>
                      <button onClick={() => flagOrder(order)} className="px-2 py-1 rounded text-xs font-semibold border" style={{ borderColor: order.is_flagged ? '#f59e0b' : '#e0d5cc', color: order.is_flagged ? '#92400e' : '#9c7b6b', backgroundColor: order.is_flagged ? '#fef9c3' : 'transparent' }}>{order.is_flagged ? '⚑ Flagged' : 'Flag'}</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-4" style={{ color: '#2d1a0e' }}>Platform Stats</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'Total Bakers', value: bakers.length, tab: 'Bakers' },
                  { label: 'Active Bakers', value: bakers.filter(b => b.is_active).length, tab: 'Bakers' },
                  { label: 'Total Customers', value: customers.length, tab: 'Customers' },
                  { label: 'Total Orders', value: orders.length, tab: 'Orders' },
                  { label: 'Completed Orders', value: orders.filter(o => o.status === 'complete').length, tab: 'Orders' },
                  { label: 'Suspended Accounts', value: bakers.filter(b => b.is_suspended).length + customers.filter(c => c.is_suspended).length, tab: 'Bakers' },
                ].map(stat => (
                  <button key={stat.label} onClick={() => setActiveTab(stat.tab)} className="p-4 rounded-xl text-left hover:shadow-sm transition-shadow" style={{ backgroundColor: '#f5f0eb' }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: '#5c3d2e' }}>{stat.label}</p>
                    <p className="text-xl font-bold" style={{ color: '#2d1a0e' }}>{stat.value}</p>
                    <p className="text-xs mt-1" style={{ color: '#9c7b6b' }}>click to view →</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Orders' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <input value={orderSearch} onChange={e => setOrderSearch(e.target.value)} placeholder="Search by customer, baker, event..." className="px-3 py-2 rounded-lg border text-sm flex-1 min-w-48" style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
              <select value={orderStatusFilter} onChange={e => setOrderStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }}>
                <option value="all">All Statuses</option>
                {['pending','confirmed','in_progress','ready','complete','declined','refunded','countered','disputed'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: '1px solid #e0d5cc' }}>
                    {['Date','Order ID','Customer','Baker','Event','Budget','Deposit','Status','Actions'].map(h => <th key={h} className="text-left py-2 px-3 font-semibold" style={{ color: '#5c3d2e' }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {orders.filter(o => {
                    const q = orderSearch.toLowerCase()
                    const matchSearch = !q || o.customer_name?.toLowerCase().includes(q) || o.bakers?.business_name?.toLowerCase().includes(q) || o.event_type?.toLowerCase().includes(q)
                    const matchStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter
                    return matchSearch && matchStatus
                  }).map(order => (
                    <tr key={order.id} className="border-b" style={{ borderColor: '#f5f0eb', backgroundColor: order.is_flagged ? '#fff7ed' : order.is_disputed ? '#fef2f2' : 'transparent' }}>
                      <td className="py-2.5 px-3" style={{ color: '#5c3d2e' }}>{new Date(order.created_at).toLocaleDateString()}</td>
                      <td className="py-2.5 px-3 font-mono" style={{ color: '#2d1a0e' }}>{order.id.slice(0, 8)}</td>
                      <td className="py-2.5 px-3" style={{ color: '#2d1a0e' }}>{order.customer_name}</td>
                      <td className="py-2.5 px-3" style={{ color: '#2d1a0e' }}>{order.bakers?.business_name}</td>
                      <td className="py-2.5 px-3" style={{ color: '#2d1a0e' }}>{order.event_type}</td>
                      <td className="py-2.5 px-3" style={{ color: '#2d1a0e' }}>${order.budget}</td>
                      <td className="py-2.5 px-3"><span style={{ color: order.deposit_paid_at ? '#166534' : '#854d0e' }}>{order.deposit_paid_at ? '✓ Paid' : 'Unpaid'}</span></td>
                      <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded-full" style={{ backgroundColor: order.status === 'complete' ? '#dcfce7' : order.status === 'pending' ? '#fef9c3' : order.status === 'declined' ? '#fee2e2' : '#dbeafe', color: order.status === 'complete' ? '#166534' : order.status === 'pending' ? '#854d0e' : order.status === 'declined' ? '#991b1b' : '#1e40af' }}>{order.status}</span></td>
                      <td className="py-2.5 px-3">
                        <div className="flex gap-1.5 flex-wrap">
                          <button onClick={() => flagOrder(order)} className="px-2 py-1 rounded text-xs font-semibold border" style={{ borderColor: order.is_flagged ? '#f59e0b' : '#e0d5cc', color: order.is_flagged ? '#92400e' : '#5c3d2e', backgroundColor: order.is_flagged ? '#fef9c3' : 'transparent' }}>{order.is_flagged ? 'Unflag' : 'Flag'}</button>
                          {order.deposit_paid_at && <button onClick={() => issueRefund(order)} className="px-2 py-1 rounded text-xs font-semibold border" style={{ borderColor: '#dc2626', color: '#dc2626' }}>Refund</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'Bakers' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <input value={bakerSearch} onChange={e => setBakerSearch(e.target.value)} placeholder="Search bakers..." className="px-3 py-2 rounded-lg border text-sm mb-4 w-full max-w-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: '1px solid #e0d5cc' }}>
                    {['Baker','Location','Joined','Orders','Pro','Featured','Stripe','Strikes','Status','Actions'].map(h => <th key={h} className="text-left py-2 px-3 font-semibold" style={{ color: '#5c3d2e' }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {bakers.filter(b => !bakerSearch || b.business_name?.toLowerCase().includes(bakerSearch.toLowerCase()) || b.email?.toLowerCase().includes(bakerSearch.toLowerCase())).map(baker => {
                    const bakerOrders = orders.filter(o => o.baker_id === baker.id)
                    return (
                      <tr key={baker.id} className="border-b" style={{ borderColor: '#f5f0eb', backgroundColor: baker.is_suspended ? '#fef2f2' : baker.is_emergency_pause ? '#fff7ed' : baker.is_on_vacation ? '#eff6ff' : 'transparent' }}>
                        <td className="py-2.5 px-3">
                          <p className="font-semibold" style={{ color: '#2d1a0e' }}>{baker.business_name}</p>
                          <p style={{ color: '#5c3d2e' }}>{baker.email}</p>
                          {baker.is_emergency_pause && <span className="text-xs px-1.5 py-0.5 rounded font-semibold" style={{ backgroundColor: '#dc2626', color: 'white' }}>Emergency</span>}
                          {baker.is_on_vacation && <span className="text-xs px-1.5 py-0.5 rounded font-semibold" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>Vacation</span>}
                          {baker.is_at_capacity && <span className="text-xs px-1.5 py-0.5 rounded font-semibold" style={{ backgroundColor: '#fef9c3', color: '#854d0e' }}>At Capacity</span>}
                        </td>
                        <td className="py-2.5 px-3" style={{ color: '#5c3d2e' }}>{baker.city}, {baker.state}</td>
                        <td className="py-2.5 px-3" style={{ color: '#5c3d2e' }}>{new Date(baker.created_at).toLocaleDateString()}</td>
                        <td className="py-2.5 px-3" style={{ color: '#2d1a0e' }}>{bakerOrders.length}</td>
                        <td className="py-2.5 px-3">
                          <button onClick={() => toggleBakerPro(baker)} className="px-2 py-1 rounded text-xs font-semibold" style={{ backgroundColor: baker.is_pro ? '#2d1a0e' : '#f5f0eb', color: baker.is_pro ? 'white' : '#2d1a0e' }}>{baker.is_pro ? 'Pro' : 'Free'}</button>
                        </td>
                        <td className="py-2.5 px-3">
                          <button onClick={() => toggleFeatured(baker)} className="px-2 py-1 rounded text-xs font-semibold" style={{ backgroundColor: baker.is_featured ? '#f59e0b' : '#f5f0eb', color: baker.is_featured ? 'white' : '#2d1a0e' }}>{baker.is_featured ? '★ Yes' : 'No'}</button>
                        </td>
                        <td className="py-2.5 px-3"><span style={{ color: baker.stripe_account_id ? '#166534' : '#854d0e' }}>{baker.stripe_account_id ? '✓' : 'No'}</span></td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold" style={{ color: (baker.strike_count || 0) >= 3 ? '#dc2626' : (baker.strike_count || 0) >= 2 ? '#c2410c' : (baker.strike_count || 0) >= 1 ? '#854d0e' : '#5c3d2e' }}>
                            {baker.strike_count || 0}/3
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full" style={{ backgroundColor: baker.is_suspended ? '#fee2e2' : baker.is_active ? '#dcfce7' : '#fef9c3', color: baker.is_suspended ? '#991b1b' : baker.is_active ? '#166534' : '#854d0e' }}>
                            {baker.is_suspended ? 'Suspended' : baker.is_active ? 'Active' : 'Pending'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex gap-1.5 flex-wrap">
                            <button onClick={() => toggleBakerSuspend(baker)} className="px-2 py-1 rounded text-xs font-semibold border" style={{ borderColor: baker.is_suspended ? '#166534' : '#dc2626', color: baker.is_suspended ? '#166534' : '#dc2626' }}>{baker.is_suspended ? 'Unsuspend' : 'Suspend'}</button>
                            <button onClick={() => handleStrike(baker)} className="px-2 py-1 rounded text-xs font-semibold border" style={{ borderColor: (baker.strike_count || 0) >= 2 ? '#dc2626' : '#e0d5cc', color: (baker.strike_count || 0) >= 2 ? '#dc2626' : '#5c3d2e', backgroundColor: (baker.strike_count || 0) > 0 ? '#fef2f2' : 'transparent' }}>Strike</button>
                            <button onClick={() => toggleFoundingBaker(baker)} className="px-2 py-1 rounded text-xs font-semibold border" style={{ borderColor: '#8B4513', color: '#8B4513', backgroundColor: baker.is_founding_baker ? '#fff7ed' : 'transparent' }}>{baker.is_founding_baker ? '✓ Found' : 'Found'}</button>
                            <Link href={'/bakers/' + baker.id} target="_blank" className="px-2 py-1 rounded text-xs font-semibold border" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>View</Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'Customers' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <input value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} placeholder="Search customers..." className="px-3 py-2 rounded-lg border text-sm mb-4 w-full max-w-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: '1px solid #e0d5cc' }}>
                    {['Name','Email','Location','Joined','Orders','Status','Actions'].map(h => <th key={h} className="text-left py-2 px-3 font-semibold" style={{ color: '#5c3d2e' }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {customers.filter(c => !customerSearch || c.full_name?.toLowerCase().includes(customerSearch.toLowerCase()) || c.email?.toLowerCase().includes(customerSearch.toLowerCase())).map(customer => {
                    const customerOrders = orders.filter(o => o.customer_email === customer.email)
                    return (
                      <tr key={customer.id} className="border-b" style={{ borderColor: '#f5f0eb', backgroundColor: customer.is_suspended ? '#fef2f2' : 'transparent' }}>
                        <td className="py-2.5 px-3 font-semibold" style={{ color: '#2d1a0e' }}>{customer.full_name}</td>
                        <td className="py-2.5 px-3" style={{ color: '#5c3d2e' }}>{customer.email}</td>
                        <td className="py-2.5 px-3" style={{ color: '#5c3d2e' }}>{customer.city}, {customer.state}</td>
                        <td className="py-2.5 px-3" style={{ color: '#5c3d2e' }}>{new Date(customer.created_at).toLocaleDateString()}</td>
                        <td className="py-2.5 px-3" style={{ color: '#2d1a0e' }}>{customerOrders.length}</td>
                        <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded-full" style={{ backgroundColor: customer.is_suspended ? '#fee2e2' : '#dcfce7', color: customer.is_suspended ? '#991b1b' : '#166534' }}>{customer.is_suspended ? 'Suspended' : 'Active'}</span></td>
                        <td className="py-2.5 px-3"><button onClick={() => toggleCustomerSuspend(customer)} className="px-2 py-1 rounded text-xs font-semibold border" style={{ borderColor: customer.is_suspended ? '#166634' : '#dc2626', color: customer.is_suspended ? '#166634' : '#dc2626' }}>{customer.is_suspended ? 'Unsuspend' : 'Suspend'}</button></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'Disputes' && (
          <div className="flex flex-col gap-4">
            {disputedOrders.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 shadow-sm text-center"><p className="text-2xl mb-2">✓</p><p className="font-semibold" style={{ color: '#2d1a0e' }}>No active disputes</p><p className="text-sm mt-1" style={{ color: '#5c3d2e' }}>All orders are in good standing.</p></div>
            ) : disputedOrders.map(order => (
              <DisputeCase key={order.id} order={order} bakers={bakers} onResolve={async (orderId: string, outcome: string, strikeBaker: boolean) => {
                await supabase.from('orders').update({ is_disputed: false, is_flagged: false, status: outcome === 'refund' ? 'refunded' : 'complete' }).eq('id', orderId)
                setOrders(orders.map(o => o.id === orderId ? { ...o, is_disputed: false, is_flagged: false, status: outcome === 'refund' ? 'refunded' : 'complete' } : o))
                if (strikeBaker) { const b = bakers.find(b => b.id === order.baker_id); if (b) handleStrike(b) }
              }} onRefund={() => issueRefund(order)} />
            ))}
          </div>
        )}

        {activeTab === 'Applications' && (
          <div className="flex flex-col gap-4">
            {pendingApplications.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 shadow-sm text-center"><p className="text-2xl mb-2">✓</p><p className="font-semibold" style={{ color: '#2d1a0e' }}>No pending applications</p></div>
            ) : pendingApplications.map(baker => (
              <div key={baker.id} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#f5f0eb' }}>
                      {baker.profile_photo_url ? <img src={baker.profile_photo_url} alt="" className="w-full h-full object-cover" /> : <span className="text-xl font-bold" style={{ color: '#2d1a0e' }}>{baker.business_name?.[0] || 'B'}</span>}
                    </div>
                    <div>
                      <p className="font-bold" style={{ color: '#2d1a0e' }}>{baker.business_name}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>{baker.email}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>{baker.city}, {baker.state}</p>
                      {baker.specialties?.length > 0 && <p className="text-xs mt-1" style={{ color: '#8B4513' }}>{baker.specialties.join(', ')}</p>}
                      {baker.bio && <p className="text-xs mt-1 max-w-md" style={{ color: '#5c3d2e' }}>{baker.bio}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Link href={'/bakers/' + baker.id} target="_blank" className="px-4 py-2 rounded-lg text-xs font-semibold border" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>View Profile</Link>
                    <button onClick={() => approveBaker(baker)} className="px-4 py-2 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: '#166534' }}>Approve</button>
                    <button onClick={() => rejectBaker(baker)} className="px-4 py-2 rounded-lg text-xs font-semibold border" style={{ borderColor: '#dc2626', color: '#dc2626' }}>Reject</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'Emergency' && (
          <div className="flex flex-col gap-4">
            {emergencyCases.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 shadow-sm text-center"><p className="text-2xl mb-2">✓</p><p className="font-semibold" style={{ color: '#2d1a0e' }}>No active emergency cases</p></div>
            ) : emergencyCases.map(ec => (
              <EmergencyCase key={ec.id} emergencyCase={ec} bakers={bakers} orders={orders} onResolve={async (id: string, resolution: string) => {
                await supabase.from('emergency_cases').update({ status: 'resolved', resolved_at: new Date().toISOString(), resolution }).eq('id', id)
                await supabase.from('bakers').update({ is_emergency_pause: false }).eq('id', ec.baker_id)
                setEmergencyCases(emergencyCases.filter(c => c.id !== id))
                setBakers(bakers.map(b => b.id === ec.baker_id ? { ...b, is_emergency_pause: false } : b))
              }} />
            ))}
          </div>
        )}

        {activeTab === 'Accounting' && (
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h2 className="text-lg font-bold" style={{ color: '#2d1a0e' }}>Transaction Export</h2>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold" style={{ color: '#5c3d2e' }}>From</label>
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-1.5 rounded-lg border text-xs" style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold" style={{ color: '#5c3d2e' }}>To</label>
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-1.5 rounded-lg border text-xs" style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
                  </div>
                  <button onClick={downloadCSV} className="px-5 py-2 rounded-xl text-white text-sm font-semibold" style={{ backgroundColor: '#2d1a0e' }}>Download CSV</button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {(() => {
                  const filtered = getFilteredOrders()
                  const paidOrders = filtered.filter(o => o.deposit_paid_at)
                  const gmv = paidOrders.reduce((s, o) => s + (o.amount_total || (o.budget * 100) || 0), 0) / 100
                  const commission = paidOrders.reduce((s, o) => { const rate = o.bakers?.is_pro ? 0.07 : 0.10; return s + ((o.amount_total || (o.budget * 100) || 0) / 100) * rate }, 0)
                  return [
                    { label: 'GMV', value: '$' + gmv.toFixed(2) },
                    { label: 'Commission', value: '$' + commission.toFixed(2) },
                    { label: 'Paid Orders', value: paidOrders.length },
                    { label: 'Avg Order', value: paidOrders.length ? '$' + (gmv / paidOrders.length).toFixed(2) : '$0' },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl p-4" style={{ backgroundColor: '#f5f0eb' }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: '#5c3d2e' }}>{s.label}</p>
                      <p className="text-xl font-bold" style={{ color: '#2d1a0e' }}>{s.value}</p>
                    </div>
                  ))
                })()}
              </div>
              <h3 className="text-sm font-bold mb-3" style={{ color: '#2d1a0e' }}>Baker Payout Summary</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e0d5cc' }}>
                      {['Baker','Orders','Gross Revenue','Commission Rate','Baker Payout'].map(h => <th key={h} className="text-left py-2 px-3 font-semibold" style={{ color: '#5c3d2e' }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {bakers.map(baker => {
                      const bakerOrders = getFilteredOrders().filter(o => o.baker_id === baker.id && o.deposit_paid_at)
                      if (bakerOrders.length === 0) return null
                      const gross = bakerOrders.reduce((s, o) => s + (o.amount_total || (o.budget * 100) || 0), 0) / 100
                      const rate = baker.is_pro ? 0.07 : 0.10
                      const payout = gross * (1 - rate)
                      return (
                        <tr key={baker.id} className="border-b" style={{ borderColor: '#f5f0eb' }}>
                          <td className="py-2.5 px-3 font-semibold" style={{ color: '#2d1a0e' }}>{baker.business_name}</td>
                          <td className="py-2.5 px-3" style={{ color: '#5c3d2e' }}>{bakerOrders.length}</td>
                          <td className="py-2.5 px-3" style={{ color: '#2d1a0e' }}>${gross.toFixed(2)}</td>
                          <td className="py-2.5 px-3" style={{ color: '#5c3d2e' }}>{(rate * 100).toFixed(0)}%</td>
                          <td className="py-2.5 px-3 font-semibold" style={{ color: '#166534' }}>${payout.toFixed(2)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function EmergencyCase({ emergencyCase: ec, bakers, orders, onResolve }: { emergencyCase: any, bakers: any[], orders: any[], onResolve: (id: string, resolution: string) => void }) {
  const [steps, setSteps] = useState<string[]>(ec.steps_completed || [])
  const [expandedStep, setExpandedStep] = useState<number | null>(0)
  const [notes, setNotes] = useState(ec.notes || '')
  const [resolution, setResolution] = useState('')
  const [saving, setSaving] = useState(false)
  const [orderOutcomes, setOrderOutcomes] = useState<Record<string, string>>({})

  const baker = bakers.find(b => b.id === ec.baker_id) || ec.bakers
  const affectedOrders = orders.filter(o => o.baker_id === ec.baker_id && ['pending','confirmed','in_progress'].includes(o.status))
  const criticalOrders = affectedOrders.filter(o => {
    const [y,m,d] = o.event_date.split('-').map(Number)
    const days = Math.round((new Date(y,m-1,d).getTime() - Date.now()) / 86400000)
    return days <= 3 && days >= 0
  })
  const hoursOpen = Math.floor((Date.now() - new Date(ec.created_at).getTime()) / 3600000)

  const STEPS = [
    { label: 'Contact baker by email or phone', key: 'contact_baker' },
    { label: 'Assess all affected orders', key: 'assess_orders' },
    { label: 'Notify critical orders (event within 72hrs)', key: 'notify_critical' },
    { label: 'Notify all other affected customers', key: 'notify_others' },
    { label: 'Decide outcome for each order', key: 'decide_outcomes' },
    { label: 'Log resolution notes and close case', key: 'log_notes' },
  ]

  async function toggleStep(label: string, index: number) {
    const updated = steps.includes(label) ? steps.filter(s => s !== label) : [...steps, label]
    setSteps(updated)
    await supabase.from('emergency_cases').update({ steps_completed: updated }).eq('id', ec.id)
    if (!steps.includes(label)) setExpandedStep(index + 1 < STEPS.length ? index + 1 : null)
  }

  async function saveNotes() {
    setSaving(true)
    await supabase.from('emergency_cases').update({ notes }).eq('id', ec.id)
    setSaving(false)
  }

  function customerEmailText(order: any) {
    const isUrgent = (() => { const [y,m,d] = order.event_date.split('-').map(Number); return Math.round((new Date(y,m-1,d).getTime() - Date.now()) / 86400000) <= 3 })()
    return 'Hi ' + order.customer_name + ',\n\nWe want to reach out about your upcoming ' + order.event_type + ' order with ' + baker?.business_name + '. Your baker has had an unexpected situation come up and we are personally reviewing your order to make sure everything is taken care of.\n\n' + (isUrgent ? 'We see your event is very soon. Please reply to this email immediately and we will prioritize your case.\n\n' : 'We will be in touch within 24 hours with an update.\n\n') + 'We are sorry for any concern this causes.\n\nWhiskly Support\nsupport@whiskly.co'
  }

  function getDaysUntil(dateStr: string) {
    const [y,m,d] = dateStr.split('-').map(Number)
    return Math.round((new Date(y,m-1,d).getTime() - Date.now()) / 86400000)
  }

  const allOutcomesSet = affectedOrders.length === 0 || affectedOrders.every(o => orderOutcomes[o.id])

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4" style={{ borderColor: '#dc2626' }}>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="font-bold text-lg" style={{ color: '#2d1a0e' }}>Emergency — {baker?.business_name}</p>
            {hoursOpen >= 24 && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: '#dc2626', color: 'white' }}>OVERDUE {hoursOpen}hrs</span>}
            {hoursOpen < 24 && hoursOpen >= 4 && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: '#f59e0b', color: 'white' }}>{hoursOpen}hrs open</span>}
            {criticalOrders.length > 0 && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: '#dc2626', color: 'white' }}>{criticalOrders.length} CRITICAL</span>}
          </div>
          <p className="text-xs" style={{ color: '#5c3d2e' }}>Opened {new Date(ec.created_at).toLocaleString()} · {baker?.city}, {baker?.state}</p>
        </div>
        <span className="text-xs px-3 py-1.5 rounded-lg font-semibold flex-shrink-0" style={{ backgroundColor: '#f5f0eb', color: '#5c3d2e' }}>{steps.length}/{STEPS.length} steps done</span>
      </div>

      {/* Checklist */}
      <div className="mb-5">
        <p className="text-xs font-bold mb-3" style={{ color: '#2d1a0e' }}>Resolution Checklist — click each step to expand</p>
        <div className="flex flex-col gap-2">

          {/* Step 1 — Contact Baker */}
          <div className="rounded-xl overflow-hidden border" style={{ borderColor: steps.includes(STEPS[0].label) ? '#bbf7d0' : '#e0d5cc' }}>
            <button onClick={() => setExpandedStep(expandedStep === 0 ? null : 0)} className="w-full flex items-center gap-3 p-3 text-left" style={{ backgroundColor: steps.includes(STEPS[0].label) ? '#dcfce7' : '#faf8f6' }}>
              <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ backgroundColor: steps.includes(STEPS[0].label) ? '#166534' : '#e0d5cc', color: 'white' }}>{steps.includes(STEPS[0].label) ? '✓' : '1'}</div>
              <span className="text-xs font-medium flex-1" style={{ color: steps.includes(STEPS[0].label) ? '#166534' : '#2d1a0e', textDecoration: steps.includes(STEPS[0].label) ? 'line-through' : 'none' }}>{STEPS[0].label}</span>
              <span className="text-xs" style={{ color: '#9c7b6b' }}>{expandedStep === 0 ? '▲' : '▼'}</span>
            </button>
            {expandedStep === 0 && (
              <div className="p-4 border-t flex flex-col gap-3" style={{ borderColor: '#e0d5cc', backgroundColor: 'white' }}>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: '#f5f0eb' }}>
                    <p className="text-xs font-bold mb-1" style={{ color: '#2d1a0e' }}>Baker Contact Info</p>
                    <p className="text-xs font-semibold" style={{ color: '#2d1a0e' }}>{baker?.business_name}</p>
                    <p className="text-xs" style={{ color: '#5c3d2e' }}>{baker?.email}</p>
                    <p className="text-xs" style={{ color: '#5c3d2e' }}>{baker?.city}, {baker?.state}</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ backgroundColor: '#f5f0eb' }}>
                    <p className="text-xs font-bold mb-1" style={{ color: '#2d1a0e' }}>What to ask</p>
                    <p className="text-xs" style={{ color: '#5c3d2e' }}>What is the situation? What is your expected timeline? Can you still fulfill any existing orders?</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a href={'mailto:' + baker?.email + '?subject=Whiskly%20Emergency%20Pause%20Check-in&body=Hi%20' + encodeURIComponent(baker?.business_name || '') + '%2C%0A%0AWe%20received%20your%20emergency%20pause%20request.%20We%20want%20to%20check%20in%20and%20understand%20the%20situation%20so%20we%20can%20support%20you%20and%20your%20customers.%0A%0APlease%20reply%20as%20soon%20as%20possible.%0A%0AWhiskly%20Support'}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: '#2d1a0e' }}>
                    Open Email Draft
                  </a>
                  <button onClick={() => navigator.clipboard.writeText(baker?.email || '')} className="px-3 py-1.5 rounded-lg text-xs font-semibold border" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>Copy Email</button>
                </div>
                <button onClick={() => toggleStep(STEPS[0].label, 0)} className="px-4 py-2 rounded-lg text-xs font-semibold text-white self-start" style={{ backgroundColor: '#166534' }}>Mark Done — Baker Contacted</button>
              </div>
            )}
          </div>

          {/* Step 2 — Assess Orders */}
          <div className="rounded-xl overflow-hidden border" style={{ borderColor: steps.includes(STEPS[1].label) ? '#bbf7d0' : '#e0d5cc' }}>
            <button onClick={() => setExpandedStep(expandedStep === 1 ? null : 1)} className="w-full flex items-center gap-3 p-3 text-left" style={{ backgroundColor: steps.includes(STEPS[1].label) ? '#dcfce7' : '#faf8f6' }}>
              <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ backgroundColor: steps.includes(STEPS[1].label) ? '#166534' : '#e0d5cc', color: 'white' }}>{steps.includes(STEPS[1].label) ? '✓' : '2'}</div>
              <span className="text-xs font-medium flex-1" style={{ color: steps.includes(STEPS[1].label) ? '#166534' : '#2d1a0e', textDecoration: steps.includes(STEPS[1].label) ? 'line-through' : 'none' }}>{STEPS[1].label}</span>
              <span className="text-xs" style={{ color: '#9c7b6b' }}>{expandedStep === 1 ? '▲' : '▼'}</span>
            </button>
            {expandedStep === 1 && (
              <div className="p-4 border-t flex flex-col gap-3" style={{ borderColor: '#e0d5cc', backgroundColor: 'white' }}>
                {affectedOrders.length === 0 ? (
                  <p className="text-xs" style={{ color: '#5c3d2e' }}>No active orders found for this baker.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {affectedOrders.map(o => {
                      const days = getDaysUntil(o.event_date)
                      const urgent = days <= 3 && days >= 0
                      return (
                        <div key={o.id} className="p-3 rounded-xl" style={{ backgroundColor: urgent ? '#fef2f2' : '#f5f0eb' }}>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-bold" style={{ color: '#2d1a0e' }}>{o.customer_name}</p>
                            <span className="text-xs font-bold" style={{ color: urgent ? '#dc2626' : '#854d0e' }}>{days < 0 ? 'PAST' : days === 0 ? 'TODAY' : days + 'd away'}{urgent ? ' — CRITICAL' : ''}</span>
                          </div>
                          <p className="text-xs" style={{ color: '#5c3d2e' }}>{o.event_type} · {o.event_date} · ${o.budget}</p>
                          <p className="text-xs" style={{ color: '#5c3d2e' }}>{o.customer_email}</p>
                          <p className="text-xs mt-1 font-semibold" style={{ color: '#8B4513' }}>Status: {o.status} · Deposit: {o.deposit_paid_at ? 'Paid' : 'Unpaid'}</p>
                        </div>
                      )
                    })}
                  </div>
                )}
                <div className="p-3 rounded-xl" style={{ backgroundColor: '#fef9c3' }}>
                  <p className="text-xs font-bold mb-1" style={{ color: '#854d0e' }}>What to consider</p>
                  <p className="text-xs" style={{ color: '#5c3d2e' }}>Which orders are most urgent? Which have deposits paid? Which customers need immediate contact? Sort by event date — closest first.</p>
                </div>
                <button onClick={() => toggleStep(STEPS[1].label, 1)} className="px-4 py-2 rounded-lg text-xs font-semibold text-white self-start" style={{ backgroundColor: '#166534' }}>Mark Done — Orders Assessed</button>
              </div>
            )}
          </div>

          {/* Step 3 — Notify Critical */}
          <div className="rounded-xl overflow-hidden border" style={{ borderColor: steps.includes(STEPS[2].label) ? '#bbf7d0' : '#e0d5cc' }}>
            <button onClick={() => setExpandedStep(expandedStep === 2 ? null : 2)} className="w-full flex items-center gap-3 p-3 text-left" style={{ backgroundColor: steps.includes(STEPS[2].label) ? '#dcfce7' : '#faf8f6' }}>
              <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ backgroundColor: steps.includes(STEPS[2].label) ? '#166534' : '#e0d5cc', color: 'white' }}>{steps.includes(STEPS[2].label) ? '✓' : '3'}</div>
              <span className="text-xs font-medium flex-1" style={{ color: steps.includes(STEPS[2].label) ? '#166534' : '#2d1a0e', textDecoration: steps.includes(STEPS[2].label) ? 'line-through' : 'none' }}>{STEPS[2].label}</span>
              <span className="text-xs" style={{ color: '#9c7b6b' }}>{expandedStep === 2 ? '▲' : '▼'}</span>
            </button>
            {expandedStep === 2 && (
              <div className="p-4 border-t flex flex-col gap-3" style={{ borderColor: '#e0d5cc', backgroundColor: 'white' }}>
                {criticalOrders.length === 0 ? (
                  <p className="text-xs" style={{ color: '#5c3d2e' }}>No critical orders (event within 72hrs). Skip to next step.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    <p className="text-xs font-bold" style={{ color: '#dc2626' }}>{criticalOrders.length} order{criticalOrders.length > 1 ? 's' : ''} with event within 72hrs — contact immediately</p>
                    {criticalOrders.map(o => (
                      <div key={o.id} className="p-3 rounded-xl border" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca' }}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-bold" style={{ color: '#991b1b' }}>{o.customer_name} — {o.event_type} in {getDaysUntil(o.event_date)} day{getDaysUntil(o.event_date) !== 1 ? 's' : ''}</p>
                          <a href={'mailto:' + o.customer_email + '?subject=' + encodeURIComponent('Urgent: Update about your Whiskly order') + '&body=' + encodeURIComponent(customerEmailText(o))}
                            className="px-3 py-1 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: '#dc2626' }}>
                            Open Email
                          </a>
                        </div>
                        <p className="text-xs" style={{ color: '#5c3d2e' }}>{o.customer_email}</p>
                        <button onClick={() => navigator.clipboard.writeText(customerEmailText(o))} className="mt-2 px-3 py-1 rounded-lg text-xs font-semibold border" style={{ borderColor: '#fecaca', color: '#991b1b' }}>Copy Email Text</button>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={() => toggleStep(STEPS[2].label, 2)} className="px-4 py-2 rounded-lg text-xs font-semibold text-white self-start" style={{ backgroundColor: '#166534' }}>Mark Done — Critical Customers Notified</button>
              </div>
            )}
          </div>

          {/* Step 4 — Notify Others */}
          <div className="rounded-xl overflow-hidden border" style={{ borderColor: steps.includes(STEPS[3].label) ? '#bbf7d0' : '#e0d5cc' }}>
            <button onClick={() => setExpandedStep(expandedStep === 3 ? null : 3)} className="w-full flex items-center gap-3 p-3 text-left" style={{ backgroundColor: steps.includes(STEPS[3].label) ? '#dcfce7' : '#faf8f6' }}>
              <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ backgroundColor: steps.includes(STEPS[3].label) ? '#166534' : '#e0d5cc', color: 'white' }}>{steps.includes(STEPS[3].label) ? '✓' : '4'}</div>
              <span className="text-xs font-medium flex-1" style={{ color: steps.includes(STEPS[3].label) ? '#166534' : '#2d1a0e', textDecoration: steps.includes(STEPS[3].label) ? 'line-through' : 'none' }}>{STEPS[3].label}</span>
              <span className="text-xs" style={{ color: '#9c7b6b' }}>{expandedStep === 3 ? '▲' : '▼'}</span>
            </button>
            {expandedStep === 3 && (
              <div className="p-4 border-t flex flex-col gap-3" style={{ borderColor: '#e0d5cc', backgroundColor: 'white' }}>
                {affectedOrders.filter(o => getDaysUntil(o.event_date) > 3).length === 0 ? (
                  <p className="text-xs" style={{ color: '#5c3d2e' }}>No non-critical orders to notify. Skip to next step.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {affectedOrders.filter(o => getDaysUntil(o.event_date) > 3).map(o => (
                      <div key={o.id} className="p-3 rounded-xl" style={{ backgroundColor: '#f5f0eb' }}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-bold" style={{ color: '#2d1a0e' }}>{o.customer_name} — {o.event_type} in {getDaysUntil(o.event_date)} days</p>
                          <a href={'mailto:' + o.customer_email + '?subject=' + encodeURIComponent('Update about your Whiskly order') + '&body=' + encodeURIComponent(customerEmailText(o))}
                            className="px-3 py-1 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: '#8B4513' }}>
                            Open Email
                          </a>
                        </div>
                        <p className="text-xs" style={{ color: '#5c3d2e' }}>{o.customer_email}</p>
                        <button onClick={() => navigator.clipboard.writeText(customerEmailText(o))} className="mt-2 px-3 py-1 rounded-lg text-xs font-semibold border" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>Copy Email Text</button>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={() => toggleStep(STEPS[3].label, 3)} className="px-4 py-2 rounded-lg text-xs font-semibold text-white self-start" style={{ backgroundColor: '#166534' }}>Mark Done — All Customers Notified</button>
              </div>
            )}
          </div>

          {/* Step 5 — Decide Outcomes */}
          <div className="rounded-xl overflow-hidden border" style={{ borderColor: steps.includes(STEPS[4].label) ? '#bbf7d0' : '#e0d5cc' }}>
            <button onClick={() => setExpandedStep(expandedStep === 4 ? null : 4)} className="w-full flex items-center gap-3 p-3 text-left" style={{ backgroundColor: steps.includes(STEPS[4].label) ? '#dcfce7' : '#faf8f6' }}>
              <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ backgroundColor: steps.includes(STEPS[4].label) ? '#166534' : '#e0d5cc', color: 'white' }}>{steps.includes(STEPS[4].label) ? '✓' : '5'}</div>
              <span className="text-xs font-medium flex-1" style={{ color: steps.includes(STEPS[4].label) ? '#166534' : '#2d1a0e', textDecoration: steps.includes(STEPS[4].label) ? 'line-through' : 'none' }}>{STEPS[4].label}</span>
              <span className="text-xs" style={{ color: '#9c7b6b' }}>{expandedStep === 4 ? '▲' : '▼'}</span>
            </button>
            {expandedStep === 4 && (
              <div className="p-4 border-t flex flex-col gap-3" style={{ borderColor: '#e0d5cc', backgroundColor: 'white' }}>
                <p className="text-xs font-semibold" style={{ color: '#2d1a0e' }}>Set an outcome for each order:</p>
                {affectedOrders.length === 0 ? (
                  <p className="text-xs" style={{ color: '#5c3d2e' }}>No active orders to decide on.</p>
                ) : affectedOrders.map(o => (
                  <div key={o.id} className="p-3 rounded-xl" style={{ backgroundColor: '#f5f0eb' }}>
                    <p className="text-xs font-bold mb-2" style={{ color: '#2d1a0e' }}>{o.customer_name} · {o.event_type} · {o.event_date}</p>
                    <select value={orderOutcomes[o.id] || ''} onChange={e => setOrderOutcomes({ ...orderOutcomes, [o.id]: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border text-xs"
                      style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: 'white' }}>
                      <option value="">Select outcome...</option>
                      <option value="hold">Keep on hold — baker may still fulfill</option>
                      <option value="refund">Issue refund and cancel order</option>
                      <option value="replacement">Find replacement baker</option>
                    </select>
                    {orderOutcomes[o.id] === 'refund' && (
                      <p className="text-xs mt-1.5 font-semibold" style={{ color: '#dc2626' }}>Go to Orders tab to issue refund for this order after closing case.</p>
                    )}
                    {orderOutcomes[o.id] === 'replacement' && (
                      <p className="text-xs mt-1.5 font-semibold" style={{ color: '#8B4513' }}>Check Bakers tab for nearby bakers with matching specialties in {baker?.city}, {baker?.state}.</p>
                    )}
                  </div>
                ))}
                {!allOutcomesSet && affectedOrders.length > 0 && (
                  <p className="text-xs" style={{ color: '#854d0e' }}>Set an outcome for every order before marking done.</p>
                )}
                <button onClick={() => allOutcomesSet && toggleStep(STEPS[4].label, 4)} disabled={!allOutcomesSet}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white self-start"
                  style={{ backgroundColor: '#166534', opacity: allOutcomesSet ? 1 : 0.4 }}>
                  Mark Done — Outcomes Decided
                </button>
              </div>
            )}
          </div>

          {/* Step 6 — Log Notes */}
          <div className="rounded-xl overflow-hidden border" style={{ borderColor: steps.includes(STEPS[5].label) ? '#bbf7d0' : '#e0d5cc' }}>
            <button onClick={() => setExpandedStep(expandedStep === 5 ? null : 5)} className="w-full flex items-center gap-3 p-3 text-left" style={{ backgroundColor: steps.includes(STEPS[5].label) ? '#dcfce7' : '#faf8f6' }}>
              <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ backgroundColor: steps.includes(STEPS[5].label) ? '#166534' : '#e0d5cc', color: 'white' }}>{steps.includes(STEPS[5].label) ? '✓' : '6'}</div>
              <span className="text-xs font-medium flex-1" style={{ color: steps.includes(STEPS[5].label) ? '#166534' : '#2d1a0e', textDecoration: steps.includes(STEPS[5].label) ? 'line-through' : 'none' }}>{STEPS[5].label}</span>
              <span className="text-xs" style={{ color: '#9c7b6b' }}>{expandedStep === 5 ? '▲' : '▼'}</span>
            </button>
            {expandedStep === 5 && (
              <div className="p-4 border-t flex flex-col gap-3" style={{ borderColor: '#e0d5cc', backgroundColor: 'white' }}>
                <div className="p-3 rounded-xl" style={{ backgroundColor: '#fef9c3' }}>
                  <p className="text-xs font-bold mb-1" style={{ color: '#854d0e' }}>What to document</p>
                  <p className="text-xs" style={{ color: '#5c3d2e' }}>What was the situation? When did you contact the baker and what did they say? What outcome was chosen for each order? Any follow-up needed?</p>
                </div>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} onBlur={saveNotes} rows={4}
                  placeholder="e.g. Baker had a family emergency. Contacted via email at 3pm. Orders for Sarah J and Tom L held pending baker return. Order for Mike R refunded. Baker expects to return in 3 days."
                  className="w-full px-3 py-2 rounded-xl border text-xs resize-none"
                  style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
                {saving && <p className="text-xs" style={{ color: '#5c3d2e' }}>Saving...</p>}
                <button onClick={() => notes.trim().length > 20 && toggleStep(STEPS[5].label, 5)} disabled={notes.trim().length <= 20}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white self-start"
                  style={{ backgroundColor: '#166534', opacity: notes.trim().length > 20 ? 1 : 0.4 }}>
                  Mark Done — Notes Logged
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Resolution */}
      <div className="pt-4 border-t" style={{ borderColor: '#e0d5cc' }}>
        {steps.length < STEPS.length && (
          <p className="text-xs font-semibold mb-3" style={{ color: '#854d0e' }}>
            Complete all {STEPS.length} steps to close this case ({STEPS.length - steps.length} remaining)
          </p>
        )}
        <div className="flex gap-3 flex-wrap">
          <select value={resolution} onChange={e => setResolution(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl border text-xs min-w-48"
            style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }}>
            <option value="">Select resolution...</option>
            <option value="baker_returned">Baker returned — orders continue</option>
            <option value="converted_vacation">Converted to vacation mode</option>
            <option value="orders_refunded">All orders refunded</option>
            <option value="baker_suspended">Baker suspended</option>
            <option value="resolved_other">Resolved — other</option>
          </select>
          <button
            onClick={() => resolution && steps.length >= STEPS.length && onResolve(ec.id, resolution)}
            disabled={!resolution || steps.length < STEPS.length}
            className="px-5 py-2 rounded-xl text-white text-xs font-semibold"
            style={{ backgroundColor: '#166534', opacity: (!resolution || steps.length < STEPS.length) ? 0.4 : 1 }}>
            Close Case
          </button>
        </div>
      </div>
    </div>
  )
}

function DisputeCase({ order, bakers, onResolve, onRefund }: { order: any, bakers: any[], onResolve: (orderId: string, outcome: string, strikeBaker: boolean) => void, onRefund: () => void }) {
  const [expandedStep, setExpandedStep] = useState<number | null>(0)
  const [steps, setSteps] = useState<string[]>([])
  const [ruling, setRuling] = useState('')
  const [strikeBaker, setStrikeBaker] = useState(false)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const baker = bakers.find(b => b.id === order.baker_id) || order.bakers

  const STEPS = [
    { label: 'Review order details and evidence', key: 'review' },
    { label: 'Contact both parties if needed', key: 'contact' },
    { label: 'Make a ruling', key: 'ruling' },
    { label: 'Take action and close dispute', key: 'close' },
  ]

  async function saveNotes() {
    setSaving(true)
    await supabase.from('orders').update({ dispute_notes: notes } as any).eq('id', order.id).then(() => setSaving(false))
  }

  function toggleStep(label: string, next: number) {
    const updated = steps.includes(label) ? steps.filter(s => s !== label) : [...steps, label]
    setSteps(updated)
    if (!steps.includes(label)) setExpandedStep(next < STEPS.length ? next : null)
  }

  const RULING_OPTIONS = [
    { value: 'customer', label: 'Rule for customer — full refund, baker may receive strike' },
    { value: 'baker', label: 'Rule for baker — release payment, no refund' },
    { value: 'partial', label: 'Split — partial refund, negotiate amount' },
    { value: 'noop', label: 'No action needed — unlock order and continue' },
  ]

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4" style={{ borderColor: '#dc2626' }}>
      {/* Header */}
      <div className="mb-5">
        <p className="font-bold text-lg" style={{ color: '#2d1a0e' }}>{order.customer_name} vs {order.bakers?.business_name}</p>
        <p className="text-xs mt-1" style={{ color: '#5c3d2e' }}>{order.event_type} · {order.event_date} · ${order.budget} · Order {order.id.slice(0, 8)}</p>
        <div className="flex gap-2 mt-2 flex-wrap">
          {order.deposit_paid_at && <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>Deposit paid</span>}
          {order.remainder_paid_at && <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>Remainder paid</span>}
          {order.is_disputed && <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>Formal dispute</span>}
          {order.is_flagged && !order.is_disputed && <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#fff7ed', color: '#c2410c' }}>Flagged</span>}
        </div>
        <p className="text-xs mt-1 font-semibold" style={{ color: '#5c3d2e' }}>{steps.length}/{STEPS.length} steps done</p>
      </div>

      <div className="flex flex-col gap-2 mb-5">

        {/* Step 1 — Review Evidence */}
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: steps.includes(STEPS[0].label) ? '#bbf7d0' : '#e0d5cc' }}>
          <button onClick={() => setExpandedStep(expandedStep === 0 ? null : 0)} className="w-full flex items-center gap-3 p-3 text-left" style={{ backgroundColor: steps.includes(STEPS[0].label) ? '#dcfce7' : '#faf8f6' }}>
            <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ backgroundColor: steps.includes(STEPS[0].label) ? '#166534' : '#e0d5cc', color: 'white' }}>{steps.includes(STEPS[0].label) ? '✓' : '1'}</div>
            <span className="text-xs font-medium flex-1" style={{ color: steps.includes(STEPS[0].label) ? '#166534' : '#2d1a0e', textDecoration: steps.includes(STEPS[0].label) ? 'line-through' : 'none' }}>{STEPS[0].label}</span>
            <span className="text-xs" style={{ color: '#9c7b6b' }}>{expandedStep === 0 ? '▲' : '▼'}</span>
          </button>
          {expandedStep === 0 && (
            <div className="p-4 border-t flex flex-col gap-3" style={{ borderColor: '#e0d5cc', backgroundColor: 'white' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl" style={{ backgroundColor: '#f5f0eb' }}>
                  <p className="text-xs font-bold mb-2" style={{ color: '#2d1a0e' }}>Order Details</p>
                  <p className="text-xs" style={{ color: '#5c3d2e' }}><strong>Customer:</strong> {order.customer_name} · {order.customer_email}</p>
                  <p className="text-xs" style={{ color: '#5c3d2e' }}><strong>Baker:</strong> {order.bakers?.business_name} · {baker?.email}</p>
                  <p className="text-xs" style={{ color: '#5c3d2e' }}><strong>Event:</strong> {order.event_type} on {order.event_date}</p>
                  <p className="text-xs" style={{ color: '#5c3d2e' }}><strong>Budget:</strong> ${order.budget}</p>
                  <p className="text-xs" style={{ color: '#5c3d2e' }}><strong>Fulfillment:</strong> {order.fulfillment_type || 'Not specified'}</p>
                  {order.item_description && <p className="text-xs mt-1" style={{ color: '#5c3d2e' }}><strong>Description:</strong> {order.item_description}</p>}
                  {order.allergen_notes && <p className="text-xs mt-1" style={{ color: '#5c3d2e' }}><strong>Allergens:</strong> {order.allergen_notes}</p>}
                </div>
                <div className="p-3 rounded-xl" style={{ backgroundColor: '#f5f0eb' }}>
                  <p className="text-xs font-bold mb-2" style={{ color: '#2d1a0e' }}>Payment Status</p>
                  <p className="text-xs" style={{ color: order.deposit_paid_at ? '#166534' : '#991b1b' }}>Deposit: {order.deposit_paid_at ? 'Paid on ' + new Date(order.deposit_paid_at).toLocaleDateString() : 'Not paid'}</p>
                  <p className="text-xs" style={{ color: order.remainder_paid_at ? '#166534' : '#854d0e' }}>Remainder: {order.remainder_paid_at ? 'Paid on ' + new Date(order.remainder_paid_at).toLocaleDateString() : 'Not paid'}</p>
                  {order.delivery_proof_url && (
                    <div className="mt-2">
                      <p className="text-xs font-bold mb-1" style={{ color: '#2d1a0e' }}>Delivery Photo</p>
                      <a href={order.delivery_proof_url} target="_blank" rel="noopener noreferrer">
                        <img src={order.delivery_proof_url} alt="Delivery proof" className="w-full h-24 object-cover rounded-lg" />
                      </a>
                    </div>
                  )}
                  {order.handoff_photo_url && (
                    <div className="mt-2">
                      <p className="text-xs font-bold mb-1" style={{ color: '#2d1a0e' }}>Handoff Photo</p>
                      <a href={order.handoff_photo_url} target="_blank" rel="noopener noreferrer">
                        <img src={order.handoff_photo_url} alt="Handoff proof" className="w-full h-24 object-cover rounded-lg" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
              {order.inspiration_photo_urls?.length > 0 && (
                <div className="p-3 rounded-xl" style={{ backgroundColor: '#f5f0eb' }}>
                  <p className="text-xs font-bold mb-2" style={{ color: '#2d1a0e' }}>Inspiration Photos (what customer requested)</p>
                  <div className="flex gap-2 flex-wrap">
                    {order.inspiration_photo_urls.map((url: string, i: number) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt={'Inspiration ' + (i+1)} className="w-20 h-20 object-cover rounded-lg border" style={{ borderColor: '#e0d5cc' }} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#fef9c3' }}>
                <p className="text-xs font-bold mb-1" style={{ color: '#854d0e' }}>What to look for</p>
                <p className="text-xs" style={{ color: '#5c3d2e' }}>Does the delivery photo match the order description and inspiration photos? Was the order delivered? Was it on time? Is there any communication in messages that supports either side?</p>
              </div>
              <button onClick={() => toggleStep(STEPS[0].label, 1)} className="px-4 py-2 rounded-lg text-xs font-semibold text-white self-start" style={{ backgroundColor: '#166534' }}>Mark Done — Evidence Reviewed</button>
            </div>
          )}
        </div>

        {/* Step 2 — Contact Parties */}
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: steps.includes(STEPS[1].label) ? '#bbf7d0' : '#e0d5cc' }}>
          <button onClick={() => setExpandedStep(expandedStep === 1 ? null : 1)} className="w-full flex items-center gap-3 p-3 text-left" style={{ backgroundColor: steps.includes(STEPS[1].label) ? '#dcfce7' : '#faf8f6' }}>
            <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ backgroundColor: steps.includes(STEPS[1].label) ? '#166534' : '#e0d5cc', color: 'white' }}>{steps.includes(STEPS[1].label) ? '✓' : '2'}</div>
            <span className="text-xs font-medium flex-1" style={{ color: steps.includes(STEPS[1].label) ? '#166534' : '#2d1a0e', textDecoration: steps.includes(STEPS[1].label) ? 'line-through' : 'none' }}>{STEPS[1].label}</span>
            <span className="text-xs" style={{ color: '#9c7b6b' }}>{expandedStep === 1 ? '▲' : '▼'}</span>
          </button>
          {expandedStep === 1 && (
            <div className="p-4 border-t flex flex-col gap-3" style={{ borderColor: '#e0d5cc', backgroundColor: 'white' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl" style={{ backgroundColor: '#f5f0eb' }}>
                  <p className="text-xs font-bold mb-2" style={{ color: '#2d1a0e' }}>Contact Customer</p>
                  <p className="text-xs mb-2" style={{ color: '#5c3d2e' }}>{order.customer_name} · {order.customer_email}</p>
                  <a href={'mailto:' + order.customer_email + '?subject=' + encodeURIComponent('Whiskly Dispute Update — Order ' + order.id.slice(0,8)) + '&body=' + encodeURIComponent('Hi ' + order.customer_name + ',\n\nWe are reviewing your dispute for your ' + order.event_type + ' order with ' + order.bakers?.business_name + '. We may have a few questions as we investigate.\n\nCould you please share any additional details about your concern?\n\nWhiskly Support\nsupport@whiskly.co')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white inline-block" style={{ backgroundColor: '#2d1a0e' }}>
                    Email Customer
                  </a>
                </div>
                <div className="p-3 rounded-xl" style={{ backgroundColor: '#f5f0eb' }}>
                  <p className="text-xs font-bold mb-2" style={{ color: '#2d1a0e' }}>Contact Baker</p>
                  <p className="text-xs mb-2" style={{ color: '#5c3d2e' }}>{order.bakers?.business_name} · {baker?.email}</p>
                  <a href={'mailto:' + baker?.email + '?subject=' + encodeURIComponent('Whiskly Dispute — Order ' + order.id.slice(0,8)) + '&body=' + encodeURIComponent('Hi ' + order.bakers?.business_name + ',\n\nWe have received a dispute on order ' + order.id.slice(0,8) + ' for a ' + order.event_type + ' on ' + order.event_date + '. We are reviewing the situation and may have a few questions.\n\nCould you please share your side of the situation?\n\nWhiskly Support\nsupport@whiskly.co')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white inline-block" style={{ backgroundColor: '#8B4513' }}>
                    Email Baker
                  </a>
                </div>
              </div>
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#fef9c3' }}>
                <p className="text-xs font-bold mb-1" style={{ color: '#854d0e' }}>This step is optional</p>
                <p className="text-xs" style={{ color: '#5c3d2e' }}>Only contact parties if the evidence is unclear. For straightforward cases (no delivery photo, clear no-show, etc.) you can skip directly to making a ruling.</p>
              </div>
              <button onClick={() => toggleStep(STEPS[1].label, 2)} className="px-4 py-2 rounded-lg text-xs font-semibold text-white self-start" style={{ backgroundColor: '#166534' }}>Mark Done — Parties Contacted</button>
            </div>
          )}
        </div>

        {/* Step 3 — Make Ruling */}
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: steps.includes(STEPS[2].label) ? '#bbf7d0' : '#e0d5cc' }}>
          <button onClick={() => setExpandedStep(expandedStep === 2 ? null : 2)} className="w-full flex items-center gap-3 p-3 text-left" style={{ backgroundColor: steps.includes(STEPS[2].label) ? '#dcfce7' : '#faf8f6' }}>
            <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ backgroundColor: steps.includes(STEPS[2].label) ? '#166534' : '#e0d5cc', color: 'white' }}>{steps.includes(STEPS[2].label) ? '✓' : '3'}</div>
            <span className="text-xs font-medium flex-1" style={{ color: steps.includes(STEPS[2].label) ? '#166534' : '#2d1a0e', textDecoration: steps.includes(STEPS[2].label) ? 'line-through' : 'none' }}>{STEPS[2].label}</span>
            <span className="text-xs" style={{ color: '#9c7b6b' }}>{expandedStep === 2 ? '▲' : '▼'}</span>
          </button>
          {expandedStep === 2 && (
            <div className="p-4 border-t flex flex-col gap-3" style={{ borderColor: '#e0d5cc', backgroundColor: 'white' }}>
              <div className="flex flex-col gap-2">
                {RULING_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setRuling(opt.value)}
                    className="flex items-center gap-3 p-3 rounded-xl text-left border"
                    style={{ borderColor: ruling === opt.value ? '#2d1a0e' : '#e0d5cc', backgroundColor: ruling === opt.value ? '#2d1a0e' : '#faf8f6' }}>
                    <div className="w-4 h-4 rounded-full border-2 flex-shrink-0" style={{ borderColor: ruling === opt.value ? 'white' : '#e0d5cc', backgroundColor: ruling === opt.value ? 'white' : 'transparent' }} />
                    <span className="text-xs font-medium" style={{ color: ruling === opt.value ? 'white' : '#2d1a0e' }}>{opt.label}</span>
                  </button>
                ))}
              </div>
              {ruling === 'customer' && (
                <div className="p-3 rounded-xl" style={{ backgroundColor: '#fef2f2' }}>
                  <p className="text-xs font-bold mb-1" style={{ color: '#991b1b' }}>Ruling for customer</p>
                  <p className="text-xs mb-2" style={{ color: '#5c3d2e' }}>A refund will be issued and the order closed. You can also issue a strike to the baker if this was due to their fault.</p>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={strikeBaker} onChange={e => setStrikeBaker(e.target.checked)} />
                    <span className="text-xs font-semibold" style={{ color: '#991b1b' }}>Issue a strike to the baker</span>
                  </label>
                </div>
              )}
              {ruling === 'baker' && (
                <div className="p-3 rounded-xl" style={{ backgroundColor: '#dcfce7' }}>
                  <p className="text-xs font-bold mb-1" style={{ color: '#166534' }}>Ruling for baker</p>
                  <p className="text-xs" style={{ color: '#5c3d2e' }}>The order will be marked complete. No refund issued. Payment already released to baker via Stripe Connect.</p>
                </div>
              )}
              {ruling === 'partial' && (
                <div className="p-3 rounded-xl" style={{ backgroundColor: '#fef9c3' }}>
                  <p className="text-xs font-bold mb-1" style={{ color: '#854d0e' }}>Split ruling</p>
                  <p className="text-xs" style={{ color: '#5c3d2e' }}>Issue a partial refund manually in Stripe dashboard, then mark resolved here. Note the amount in your internal notes.</p>
                </div>
              )}
              {ruling === 'noop' && (
                <div className="p-3 rounded-xl" style={{ backgroundColor: '#dbeafe' }}>
                  <p className="text-xs font-bold mb-1" style={{ color: '#1e40af' }}>No action needed</p>
                  <p className="text-xs" style={{ color: '#5c3d2e' }}>The dispute flag will be removed and the order will be unlocked for both parties to continue.</p>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: '#2d1a0e' }}>Internal Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} onBlur={saveNotes} rows={3}
                  placeholder="e.g. No delivery photo found. Baker could not confirm delivery. Customer claims order never arrived. Ruled for customer."
                  className="w-full px-3 py-2 rounded-xl border text-xs resize-none"
                  style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
                {saving && <p className="text-xs mt-1" style={{ color: '#5c3d2e' }}>Saving...</p>}
              </div>
              <button onClick={() => ruling && notes.trim().length > 10 && toggleStep(STEPS[2].label, 3)}
                disabled={!ruling || notes.trim().length <= 10}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white self-start"
                style={{ backgroundColor: '#166534', opacity: (!ruling || notes.trim().length <= 10) ? 0.4 : 1 }}>
                {!ruling ? 'Select a ruling first' : notes.trim().length <= 10 ? 'Add notes before continuing' : 'Mark Done — Ruling Made'}
              </button>
            </div>
          )}
        </div>

        {/* Step 4 — Take Action */}
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: steps.includes(STEPS[3].label) ? '#bbf7d0' : '#e0d5cc' }}>
          <button onClick={() => setExpandedStep(expandedStep === 3 ? null : 3)} className="w-full flex items-center gap-3 p-3 text-left" style={{ backgroundColor: steps.includes(STEPS[3].label) ? '#dcfce7' : '#faf8f6' }}>
            <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ backgroundColor: steps.includes(STEPS[3].label) ? '#166534' : '#e0d5cc', color: 'white' }}>{steps.includes(STEPS[3].label) ? '✓' : '4'}</div>
            <span className="text-xs font-medium flex-1" style={{ color: steps.includes(STEPS[3].label) ? '#166534' : '#2d1a0e', textDecoration: steps.includes(STEPS[3].label) ? 'line-through' : 'none' }}>{STEPS[3].label}</span>
            <span className="text-xs" style={{ color: '#9c7b6b' }}>{expandedStep === 3 ? '▲' : '▼'}</span>
          </button>
          {expandedStep === 3 && (
            <div className="p-4 border-t flex flex-col gap-3" style={{ borderColor: '#e0d5cc', backgroundColor: 'white' }}>
              {!ruling && <p className="text-xs font-semibold" style={{ color: '#854d0e' }}>Complete the ruling step first.</p>}
              {ruling && (
                <>
                  <div className="p-3 rounded-xl" style={{ backgroundColor: '#f5f0eb' }}>
                    <p className="text-xs font-bold mb-1" style={{ color: '#2d1a0e' }}>Actions to take for this ruling:</p>
                    {ruling === 'customer' && <p className="text-xs" style={{ color: '#5c3d2e' }}>1. Click Issue Refund below. 2. Email customer confirming refund. 3. Email baker with decision. 4. Click Close Dispute.</p>}
                    {ruling === 'baker' && <p className="text-xs" style={{ color: '#5c3d2e' }}>1. Email customer with decision. 2. Email baker confirming ruling. 3. Click Close Dispute.</p>}
                    {ruling === 'partial' && <p className="text-xs" style={{ color: '#5c3d2e' }}>1. Issue partial refund in Stripe dashboard manually. 2. Email both parties with decision and refund amount. 3. Click Close Dispute.</p>}
                    {ruling === 'noop' && <p className="text-xs" style={{ color: '#5c3d2e' }}>1. Email both parties that the dispute has been reviewed and no action was needed. 2. Click Close Dispute.</p>}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {(ruling === 'customer') && order.deposit_paid_at && (
                      <button onClick={onRefund} className="px-4 py-2 rounded-lg text-xs font-semibold border" style={{ borderColor: '#dc2626', color: '#dc2626' }}>Issue Refund via Stripe</button>
                    )}
                    <a href={'mailto:' + order.customer_email + '?subject=' + encodeURIComponent('Whiskly Dispute Resolution — Order ' + order.id.slice(0,8)) + '&body=' + encodeURIComponent(
                      ruling === 'customer' ? 'Hi ' + order.customer_name + ',\n\nWe have completed our review of your dispute for order ' + order.id.slice(0,8) + '. We are ruling in your favor and a full refund has been issued. Please allow 5-10 business days.\n\nWhiskly Support'
                      : ruling === 'baker' ? 'Hi ' + order.customer_name + ',\n\nWe have completed our review of your dispute for order ' + order.id.slice(0,8) + '. After reviewing the evidence we are unable to issue a refund at this time. If you have further questions please reply to this email.\n\nWhiskly Support'
                      : 'Hi ' + order.customer_name + ',\n\nWe have completed our review of your dispute for order ' + order.id.slice(0,8) + '. We have made a decision and will be in touch shortly.\n\nWhiskly Support'
                    )} className="px-4 py-2 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: '#2d1a0e' }}>
                      Email Customer Decision
                    </a>
                    <a href={'mailto:' + baker?.email + '?subject=' + encodeURIComponent('Whiskly Dispute Resolution — Order ' + order.id.slice(0,8)) + '&body=' + encodeURIComponent(
                      ruling === 'customer' ? 'Hi ' + order.bakers?.business_name + ',\n\nWe have completed our review of the dispute on order ' + order.id.slice(0,8) + '. We have ruled in the customer\'s favor and issued a refund. If you believe this decision is incorrect please reply within 7 days.\n\nWhiskly Support'
                      : ruling === 'baker' ? 'Hi ' + order.bakers?.business_name + ',\n\nWe have completed our review of the dispute on order ' + order.id.slice(0,8) + '. We have ruled in your favor.\n\nWhiskly Support'
                      : 'Hi ' + order.bakers?.business_name + ',\n\nWe have completed our review of the dispute on order ' + order.id.slice(0,8) + '. We have made a decision and will be in touch shortly.\n\nWhiskly Support'
                    )} className="px-4 py-2 rounded-lg text-xs font-semibold border" style={{ borderColor: '#8B4513', color: '#8B4513' }}>
                      Email Baker Decision
                    </a>
                  </div>
                  <button onClick={() => {
                    toggleStep(STEPS[3].label, 4)
                    onResolve(order.id, ruling === 'customer' ? 'refund' : 'complete', strikeBaker)
                  }} className="px-5 py-2 rounded-lg text-xs font-semibold text-white self-start" style={{ backgroundColor: '#166534' }}>
                    Close Dispute
                  </button>
                </>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}