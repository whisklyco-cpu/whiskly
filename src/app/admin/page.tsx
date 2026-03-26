'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import WhisklyLogo from '@/components/WhisklyLogo'
import { EmergencyCase } from './components/EmergencyCase'
import { DisputeCase } from './components/DisputeCase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const TABS = ['Overview', 'Orders', 'Bakers', 'Customers', 'Disputes', 'Applications', 'Emergency', 'Accounting', 'Earnings', 'Broadcast', 'Reviews']

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('Overview')

  const [orders, setOrders] = useState<any[]>([])
  const [bakers, setBakers] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [emergencyCases, setEmergencyCases] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const [reviews, setReviews] = useState<any[]>([])

  useEffect(() => { loadAll() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [orderSearch, setOrderSearch] = useState('')
  const [bakerSearch, setBakerSearch] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [broadcastSubject, setBroadcastSubject] = useState('')
  const [broadcastBody, setBroadcastBody] = useState('')
  const [broadcastTarget, setBroadcastTarget] = useState<'all' | 'bakers' | 'customers'>('all')
  const [broadcastSending, setBroadcastSending] = useState(false)
  const [broadcastSent, setBroadcastSent] = useState(false)

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    window.location.href = '/admin/login'
  }

  async function loadAll() {
    setLoading(true)
    const [ordersRes, bakersRes, customersRes, emergencyRes, reviewsRes] = await Promise.all([
      supabase.from('orders').select('*, bakers(id, business_name, city, state, is_pro, stripe_account_id)').order('created_at', { ascending: false }),
      supabase.from('bakers').select('*').order('created_at', { ascending: false }),
      supabase.from('customers').select('*').order('created_at', { ascending: false }),
      supabase.from('emergency_cases').select('*, bakers(business_name, email, city, state)').eq('status', 'open').order('created_at', { ascending: false }),
      supabase.from('reviews').select('*, bakers(business_name)').order('created_at', { ascending: false }),
    ])
    setOrders(ordersRes.data || [])
    setBakers(bakersRes.data || [])
    setCustomers(customersRes.data || [])
    setEmergencyCases(emergencyRes.data || [])
    setReviews(reviewsRes.data || [])
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

  async function sendBroadcast() {
    if (!broadcastSubject.trim() || !broadcastBody.trim()) return
    if (!confirm('Send broadcast to ' + broadcastTarget + '?')) return
    setBroadcastSending(true)
    const recipients: string[] = []
    if (broadcastTarget === 'bakers' || broadcastTarget === 'all') {
      bakers.filter(b => b.is_active && !b.is_suspended).forEach(b => recipients.push(JSON.stringify({ email: b.email, name: b.business_name })))
    }
    if (broadcastTarget === 'customers' || broadcastTarget === 'all') {
      customers.filter(c => !c.is_suspended).forEach(c => recipients.push(JSON.stringify({ email: c.email, name: c.full_name })))
    }
    for (const r of recipients) {
      const { email, name } = JSON.parse(r)
      await fetch('/api/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'announcement', to: email, name, subject: broadcastSubject, body: broadcastBody }) }).catch(() => {})
    }
    setBroadcastSending(false)
    setBroadcastSent(true)
    setBroadcastSubject('')
    setBroadcastBody('')
    setTimeout(() => setBroadcastSent(false), 4000)
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f0eb' }}>
      <nav className="bg-white shadow-sm px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/"><WhisklyLogo variant="horizontal" size="sm" /></Link>
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
          <button onClick={handleLogout} className="px-3 py-1.5 rounded-lg border text-xs font-semibold" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>Sign Out</button>
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

        {activeTab === 'Earnings' && (() => {
          const monthMap: Record<string, { gmv: number; commission: number }> = {}
          orders.filter(o => o.deposit_paid_at).forEach(o => {
            const key = new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
            if (!monthMap[key]) monthMap[key] = { gmv: 0, commission: 0 }
            const total = (o.amount_total || (o.budget * 100) || 0) / 100
            const rate = o.bakers?.is_pro ? 0.07 : 0.10
            monthMap[key].gmv += total
            monthMap[key].commission += total * rate
          })
          const chartData = Object.entries(monthMap).slice(-12).map(([month, v]) => ({ month, GMV: +v.gmv.toFixed(2), Commission: +v.commission.toFixed(2) }))
          const totalReserve = bakers.reduce((s, b) => s + (b.baker_reserve_balance || 0), 0)
          return (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'All-time GMV', value: '$' + totalGMV.toFixed(2) },
                  { label: 'All-time Commission', value: '$' + totalCommission.toFixed(2) },
                  { label: 'Total Reserve Held', value: '$' + totalReserve.toFixed(2) },
                  { label: 'Avg Commission Rate', value: bakers.length ? ((bakers.filter(b => b.is_pro).length / bakers.length) * 7 + (1 - bakers.filter(b => b.is_pro).length / bakers.length) * 10).toFixed(1) + '%' : '10%' },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm">
                    <p className="text-xs font-semibold mb-1" style={{ color: '#5c3d2e' }}>{s.label}</p>
                    <p className="text-2xl font-bold" style={{ color: '#2d1a0e' }}>{s.value}</p>
                  </div>
                ))}
              </div>
              {chartData.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-lg font-bold mb-6" style={{ color: '#2d1a0e' }}>Monthly Revenue</h2>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={chartData} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe6" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#5c3d2e' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#5c3d2e' }} tickFormatter={v => '$' + v} />
                      <Tooltip formatter={(v) => '$' + (typeof v === 'number' ? v.toFixed(2) : v)} contentStyle={{ borderRadius: 8, border: '1px solid #e0d5cc', fontSize: 12 }} />
                      <Bar dataKey="GMV" fill="#c4a882" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Commission" fill="#8B4513" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex gap-4 mt-3 justify-center">
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#c4a882' }} /><span className="text-xs" style={{ color: '#5c3d2e' }}>GMV</span></div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#8B4513' }} /><span className="text-xs" style={{ color: '#5c3d2e' }}>Commission</span></div>
                  </div>
                </div>
              )}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-sm font-bold mb-3" style={{ color: '#2d1a0e' }}>Reserve Balance by Baker</h2>
                <div className="flex flex-col gap-2">
                  {bakers.filter(b => (b.baker_reserve_balance || 0) > 0).map(b => (
                    <div key={b.id} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ backgroundColor: '#faf8f6' }}>
                      <p className="text-sm font-medium" style={{ color: '#2d1a0e' }}>{b.business_name}</p>
                      <p className="text-sm font-semibold" style={{ color: '#2d1a0e' }}>${(b.baker_reserve_balance || 0).toFixed(2)}</p>
                    </div>
                  ))}
                  {bakers.filter(b => (b.baker_reserve_balance || 0) > 0).length === 0 && (
                    <p className="text-sm text-center py-4" style={{ color: '#5c3d2e' }}>No reserve balances yet.</p>
                  )}
                </div>
              </div>
            </div>
          )
        })()}

        {activeTab === 'Broadcast' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm max-w-2xl">
            <h2 className="text-lg font-bold mb-1" style={{ color: '#2d1a0e' }}>Broadcast Email</h2>
            <p className="text-sm mb-5" style={{ color: '#5c3d2e' }}>Send a message to all bakers, all customers, or everyone on the platform.</p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: '#5c3d2e' }}>Send to</label>
                <div className="flex gap-2">
                  {(['all', 'bakers', 'customers'] as const).map(t => (
                    <button key={t} onClick={() => setBroadcastTarget(t)} className="px-4 py-2 rounded-lg text-sm font-semibold capitalize" style={{ backgroundColor: broadcastTarget === t ? '#2d1a0e' : '#f5f0eb', color: broadcastTarget === t ? 'white' : '#2d1a0e' }}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: '#5c3d2e' }}>Subject</label>
                <input value={broadcastSubject} onChange={e => setBroadcastSubject(e.target.value)} placeholder="Email subject line" className="w-full px-3 py-2.5 rounded-xl border text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: '#5c3d2e' }}>Message</label>
                <textarea value={broadcastBody} onChange={e => setBroadcastBody(e.target.value)} rows={8} placeholder="Write your message here..." className="w-full px-3 py-2.5 rounded-xl border text-sm resize-none" style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
              </div>
              {broadcastSent && <p className="text-sm font-semibold" style={{ color: '#166534' }}>Broadcast sent successfully.</p>}
              <button onClick={sendBroadcast} disabled={broadcastSending || !broadcastSubject.trim() || !broadcastBody.trim()} className="px-6 py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-50" style={{ backgroundColor: '#2d1a0e' }}>
                {broadcastSending ? 'Sending...' : 'Send Broadcast'}
              </button>
              <p className="text-xs" style={{ color: '#9c7b6b' }}>
                This will send to: {broadcastTarget === 'all' ? bakers.filter(b => b.is_active && !b.is_suspended).length + customers.filter(c => !c.is_suspended).length : broadcastTarget === 'bakers' ? bakers.filter(b => b.is_active && !b.is_suspended).length : customers.filter(c => !c.is_suspended).length} recipients
              </p>
            </div>
          </div>
        )}

        {activeTab === 'Reviews' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: '#2d1a0e' }}>All Reviews ({reviews.length})</h2>
            </div>
            {reviews.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: '#5c3d2e' }}>No reviews yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {reviews.map(r => (
                  <div key={r.id} className="p-4 rounded-xl" style={{ backgroundColor: '#faf8f6' }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold" style={{ color: '#2d1a0e' }}>{r.customer_name || 'Customer'}</span>
                          <span className="text-xs" style={{ color: '#5c3d2e' }}>for</span>
                          <span className="text-sm font-semibold" style={{ color: '#8B4513' }}>{r.bakers?.business_name}</span>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map(n => (
                            <span key={n} className="text-sm" style={{ color: n <= (r.rating || 0) ? '#f59e0b' : '#e0d5cc' }}>★</span>
                          ))}
                          <span className="text-xs ml-1" style={{ color: '#5c3d2e' }}>{r.rating}/5</span>
                        </div>
                        {r.comment && <p className="text-sm" style={{ color: '#2d1a0e' }}>{r.comment}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs" style={{ color: '#9c7b6b' }}>{new Date(r.created_at).toLocaleDateString()}</p>
                        <button onClick={async () => { if (!confirm('Delete this review?')) return; await supabase.from('reviews').delete().eq('id', r.id); setReviews(reviews.filter(rv => rv.id !== r.id)) }} className="mt-2 px-2 py-1 rounded text-xs font-semibold border" style={{ borderColor: '#dc2626', color: '#dc2626' }}>Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
