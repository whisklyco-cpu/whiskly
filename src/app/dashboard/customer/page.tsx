'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'

function CustomerDashboardInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [customer, setCustomer] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [nearbyBakers, setNearbyBakers] = useState<any[]>([])
  const [savedBakers, setSavedBakers] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('orders')

  const [conversations, setConversations] = useState<any[]>([])
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null)
  const [activeConvo, setActiveConvo] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [reviewOrder, setReviewOrder] = useState<any>(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [submittedReviews, setSubmittedReviews] = useState<string[]>([])
  const [importantDates, setImportantDates] = useState<any[]>([])
  const [newDateLabel, setNewDateLabel] = useState('')
  const [newDateMonth, setNewDateMonth] = useState('')
  const [newDateDay, setNewDateDay] = useState('')
  const [savingDate, setSavingDate] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { loadDashboard() }, [])

  useEffect(() => {
    const tab = searchParams.get('tab')
    const orderId = searchParams.get('order')
    const success = searchParams.get('success')
    if (tab === 'messages') setActiveTab('messages')
    if (tab === 'orders') setActiveTab('orders')
    if (orderId) setActiveOrderId(orderId)
    if (success === '1') {
      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 5000)
    }
  }, [searchParams])

  useEffect(() => {
    const reviewOrderId = searchParams.get('review')
    if (reviewOrderId && orders.length > 0) {
      const target = orders.find((o: any) => o.id === reviewOrderId)
      if (target && !submittedReviews.includes(target.id)) {
        setReviewOrder(target)
      }
    }
  }, [orders, searchParams])

  useEffect(() => {
    if (activeTab === 'messages' && currentUserId) loadConversations()
  }, [activeTab, currentUserId])

  useEffect(() => {
    if (currentUserId) loadConversations()
  }, [currentUserId])

  useEffect(() => {
    if (activeTab === 'messages' && activeOrderId && currentUserId) loadThread(activeOrderId)
  }, [activeOrderId, activeTab, currentUserId])

  useEffect(() => {
    if (!activeOrderId || !currentUserId) return
    const channel = supabase
      .channel('customer-thread-' + activeOrderId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: 'order_id=eq.' + activeOrderId }, (payload) => {
        const msg = payload.new as any
        setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [activeOrderId, currentUserId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadDashboard() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    setCurrentUserId(session.user.id)

    const { data: bakerData } = await supabase.from('bakers').select('id').eq('user_id', session.user.id).maybeSingle()
    if (bakerData) { router.push('/dashboard/baker'); return }

    const { data: customerData } = await supabase.from('customers').select('*').eq('user_id', session.user.id).maybeSingle()
    if (customerData) {
      setCustomer(customerData)
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*, bakers(id, business_name, profile_photo_url, city, state, pickup_address, pickup_zip)')
        .eq('customer_email', customerData.email)
        .order('created_at', { ascending: false })
      setOrders(ordersData || [])
      const saved = JSON.parse(localStorage.getItem('whiskly-saved-bakers') || '[]')
      setSavedBakers(saved)
      const { data: bakersData } = await supabase
        .from('bakers').select('*').eq('is_active', true).eq('profile_complete', true)
        .eq('state', customerData.state || 'MD').limit(4)
      setNearbyBakers(bakersData || [])
      const { data: datesData } = await supabase
        .from('customer_important_dates').select('*').eq('customer_id', customerData.id).order('month', { ascending: true })
      setImportantDates(datesData || [])
    }
    setLoading(false)
  }

  async function loadConversations() {
    if (!currentUserId) return
    const { data } = await supabase
      .from('messages')
      .select('*, bakers!messages_baker_id_fkey(id, business_name, profile_photo_url)')
      .or('sender_id.eq.' + currentUserId + ',receiver_id.eq.' + currentUserId)
      .order('created_at', { ascending: false })
    if (!data) return
    const unread = data.filter(m => m.receiver_id === currentUserId && !m.read_at)
    setUnreadCount(unread.length)
    const seen = new Set<string>()
    const threads: any[] = []
    for (const msg of data) {
      const key = msg.order_id || ('general-' + msg.baker_id)
      if (!seen.has(key)) { seen.add(key); threads.push(msg) }
    }
    const orderIds = threads.filter(t => t.order_id).map(t => t.order_id)
    let ordersMap: Record<string, any> = {}
    if (orderIds.length > 0) {
      const { data: ordersData } = await supabase.from('orders').select('id, event_type, event_date, status').in('id', orderIds)
      for (const o of ordersData || []) ordersMap[o.id] = o
    }
    setConversations(threads.map(t => ({ ...t, order_info: t.order_id ? ordersMap[t.order_id] : null, thread_key: t.order_id || ('general-' + t.baker_id) })))
    const paramOrderId = searchParams.get('order')
    if (paramOrderId && !activeOrderId) setActiveOrderId(paramOrderId)
    else if (!activeOrderId && threads.length > 0) setActiveOrderId(threads[0].order_id || null)
  }

  async function loadThread(orderId: string) {
    if (!currentUserId) return
    const order = orders.find(o => o.id === orderId)
    if (order) {
      setActiveConvo({ baker: order.bakers, order })
    } else {
      const { data: orderData } = await supabase.from('orders').select('*, bakers(id, business_name, profile_photo_url, city, state)').eq('id', orderId).maybeSingle()
      if (orderData) setActiveConvo({ baker: orderData.bakers, order: orderData })
    }
    const { data: msgs } = await supabase.from('messages').select('*').eq('order_id', orderId).order('created_at', { ascending: true })
    setMessages(msgs || [])
    await supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('order_id', orderId).eq('receiver_id', currentUserId).is('read_at', null)
  }

  async function sendMessage() {
    if (!newMessage.trim() || !activeOrderId || !currentUserId || !activeConvo) return
    setSendingMessage(true)
    const { data: bakerUser } = await supabase.from('bakers').select('user_id').eq('id', activeConvo.baker.id).maybeSingle()
    await supabase.from('messages').insert({ sender_id: currentUserId, receiver_id: bakerUser?.user_id, baker_id: activeConvo.baker.id, order_id: activeOrderId, content: newMessage.trim() })
    setNewMessage('')
    setSendingMessage(false)
    loadThread(activeOrderId)
    loadConversations()
  }

  function openThread(orderId: string) { setActiveOrderId(orderId); setActiveTab('messages'); loadThread(orderId) }

  async function markReceived(orderId: string) {
    await supabase.from('orders').update({ status: 'complete' }).eq('id', orderId)
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'complete' } : o))
  }

  async function confirmPickup(order: any) {
    await supabase.from('orders').update({ status: 'complete', pickup_confirmed_at: new Date().toISOString() }).eq('id', order.id)
    setOrders(orders.map(o => o.id === order.id ? { ...o, status: 'complete', pickup_confirmed_at: new Date().toISOString() } : o))
  }

  async function submitReview() {
    if (!reviewOrder || !customer) return
    setSubmittingReview(true)
    await supabase.from('reviews').insert({ order_id: reviewOrder.id, baker_id: reviewOrder.baker_id, customer_email: customer.email, customer_name: customer.full_name || '', event_type: reviewOrder.event_type, rating: reviewRating, comment: reviewComment })
    const { data: allReviews } = await supabase.from('reviews').select('rating').eq('baker_id', reviewOrder.baker_id)
    if (allReviews && allReviews.length > 0) {
      const avg = allReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / allReviews.length
      await supabase.from('bakers').update({ avg_rating: Math.round(avg * 100) / 100, review_count: allReviews.length }).eq('id', reviewOrder.baker_id)
    }
    setSubmittedReviews(prev => [...prev, reviewOrder.id])
    setReviewOrder(null); setReviewRating(5); setReviewComment(''); setSubmittingReview(false)
  }

  function reviewNudgeEligible(order: any) {
    if (order.status !== 'complete') return false
    if (submittedReviews.includes(order.id)) return false
    const completedAt = order.delivery_confirmed_at || order.pickup_confirmed_at || order.updated_at
    if (!completedAt) return false
    return (Date.now() - new Date(completedAt).getTime()) / 3600000 >= 48
  }

  function toggleSave(bakerId: string) {
    const current = JSON.parse(localStorage.getItem('whiskly-saved-bakers') || '[]')
    const updated = current.includes(bakerId) ? current.filter((id: string) => id !== bakerId) : [...current, bakerId]
    localStorage.setItem('whiskly-saved-bakers', JSON.stringify(updated))
    setSavedBakers(updated)
  }

  function getDaysUntil(dateStr: string) {
    const [year, month, day] = dateStr.split('-').map(Number)
    const today = new Date(); today.setHours(0, 0, 0, 0)
    return Math.round((new Date(year, month - 1, day).getTime() - today.getTime()) / 86400000)
  }

  function getProgressStep(status: string) {
    if (status === 'pending') return 0
    if (status === 'confirmed' || status === 'in_progress') return 2
    if (status === 'ready') return 3
    if (status === 'complete') return 4
    return 0
  }

  function formatTime(ts: string) { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }

  function formatDate(ts: string) {
    const d = new Date(ts), today = new Date(), yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (d.toDateString() === today.toDateString()) return 'Today'
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  function threadLabel(conv: any) {
    return conv.order_info ? conv.order_info.event_type + ' · ' + conv.order_info.event_date : 'General Inquiry'
  }

  async function addImportantDate() {
    if (!newDateLabel.trim() || !newDateMonth || !newDateDay || !customer) return
    setSavingDate(true)
    const { data } = await supabase.from('customer_important_dates').insert({ customer_id: customer.id, label: newDateLabel.trim(), month: parseInt(newDateMonth), day: parseInt(newDateDay) }).select().single()
    if (data) { setImportantDates(prev => [...prev, data].sort((a, b) => a.month - b.month || a.day - b.day)); setNewDateLabel(''); setNewDateMonth(''); setNewDateDay('') }
    setSavingDate(false)
  }

  async function removeImportantDate(id: string) {
    await supabase.from('customer_important_dates').delete().eq('id', id)
    setImportantDates(prev => prev.filter(d => d.id !== id))
  }

  function getDaysUntilDate(month: number, day: number) {
    const today = new Date()
    const thisYear = new Date(today.getFullYear(), month - 1, day)
    const target = thisYear >= today ? thisYear : new Date(today.getFullYear() + 1, month - 1, day)
    return Math.ceil((target.getTime() - today.getTime()) / 86400000)
  }

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

  async function handleSignOut() { await supabase.auth.signOut(); router.push('/') }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f0eb' }}>
      <p style={{ color: '#2d1a0e' }}>Loading your dashboard...</p>
    </div>
  )

  const firstName = customer?.full_name?.split(' ')[0] || 'there'
  const pending = orders.filter(o => o.status === 'pending')
  const confirmed = orders.filter(o => o.status === 'confirmed')
  const upcomingOrder = orders
    .filter(o => (o.status === 'confirmed' || o.status === 'in_progress' || o.status === 'ready') && getDaysUntil(o.event_date) >= 0 && getDaysUntil(o.event_date) <= 30)
    .sort((a, b) => getDaysUntil(a.event_date) - getDaysUntil(b.event_date))[0] || null

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#f5f0eb' }}>
      <Navbar />

      {reviewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-lg mb-1" style={{ color: '#2d1a0e' }}>Leave a Review</h3>
            <p className="text-xs mb-5" style={{ color: '#5c3d2e' }}>How was your experience with {reviewOrder.bakers?.business_name}?</p>
            <div className="flex gap-2 mb-4 justify-center">
              {[1,2,3,4,5].map(star => (
                <button key={star} onClick={() => setReviewRating(star)} className="text-3xl transition-transform hover:scale-110">
                  <span style={{ color: star <= reviewRating ? '#f59e0b' : '#e0d5cc' }}>★</span>
                </button>
              ))}
            </div>
            <p className="text-center text-xs mb-4 font-medium" style={{ color: '#5c3d2e' }}>{['', 'Poor', 'Fair', 'Good', 'Great', 'Amazing!'][reviewRating]}</p>
            <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} rows={3} placeholder="Tell others about your experience..."
              className="w-full px-3 py-2.5 rounded-xl border text-sm resize-none mb-4" style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
            <div className="flex gap-3">
              <button onClick={() => setReviewOrder(null)} className="flex-1 py-3 rounded-xl border text-sm font-semibold" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>Skip</button>
              <button onClick={submitReview} disabled={submittingReview} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: '#2d1a0e', opacity: submittingReview ? 0.7 : 1 }}>
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3.5 rounded-2xl shadow-lg flex items-center gap-3" style={{ backgroundColor: '#2d1a0e', color: 'white', minWidth: '300px' }}>
          <span className="text-lg">🎂</span>
          <div>
            <p className="font-semibold text-sm">Order request sent!</p>
            <p className="text-xs mt-0.5" style={{ color: '#e0c9b0' }}>Your baker will review and respond soon.</p>
          </div>
          <button onClick={() => setShowSuccessToast(false)} className="ml-auto text-xs opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#2d1a0e' }}>Hey, {firstName}!</h1>
            <p className="text-sm mt-1" style={{ color: '#5c3d2e' }}>
              {orders.length === 0 ? "Ready to find your perfect baker?" : 'You have ' + pending.length + ' pending and ' + confirmed.length + ' confirmed order' + (confirmed.length !== 1 ? 's' : '') + '.'}
            </p>
          </div>
          <Link href="/bakers" className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm" style={{ backgroundColor: '#2d1a0e' }}>+ New Order</Link>
        </div>

        {upcomingOrder && (
          <div className="mb-6 rounded-2xl p-6 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #2d1a0e 0%, #8B4513 100%)' }}>
            <div className="flex items-center gap-4">
              {upcomingOrder.bakers?.profile_photo_url
                ? <img src={upcomingOrder.bakers.profile_photo_url} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" style={{ border: '2px solid rgba(255,255,255,0.2)' }} />
                : <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.2)' }}>
                    <span className="text-white font-bold text-lg">{upcomingOrder.bakers?.business_name?.[0] || 'B'}</span>
                  </div>}
              <div>
                <p className="text-white font-bold text-lg">
                  {getDaysUntil(upcomingOrder.event_date) === 0 ? 'Your ' + upcomingOrder.event_type + ' order is today!'
                    : getDaysUntil(upcomingOrder.event_date) === 1 ? 'Your ' + upcomingOrder.event_type + ' order is tomorrow!'
                    : getDaysUntil(upcomingOrder.event_date) <= 7 ? 'Your ' + upcomingOrder.event_type + ' order is almost here!'
                    : 'Your ' + upcomingOrder.event_type + ' order is coming up soon!'}
                </p>
                <p className="text-sm mt-0.5" style={{ color: '#e0c9b0' }}>
                  {getDaysUntil(upcomingOrder.event_date) === 0 ? 'Today' : getDaysUntil(upcomingOrder.event_date) === 1 ? 'Tomorrow' : getDaysUntil(upcomingOrder.event_date) + ' days away'} · {upcomingOrder.bakers?.business_name}
                </p>
              </div>
            </div>
            <div className="text-right">
              {getDaysUntil(upcomingOrder.event_date) <= 1
                ? <p className="text-2xl font-bold text-white">{getDaysUntil(upcomingOrder.event_date) === 0 ? 'Today!' : 'Tomorrow!'}</p>
                : <><p className="text-3xl font-bold text-white">{getDaysUntil(upcomingOrder.event_date)}</p><p className="text-xs" style={{ color: '#e0c9b0' }}>days to go</p></>}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6 md:mb-8">
          {[['Pending', pending.length], ['Confirmed', confirmed.length], ['Saved Bakers', savedBakers.length]].map(([label, count]) => (
            <div key={label as string} className="bg-white rounded-2xl p-5 shadow-sm text-center">
              <p className="text-3xl font-bold" style={{ color: '#2d1a0e' }}>{count}</p>
              <p className="text-sm mt-1" style={{ color: '#5c3d2e' }}>{label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {['orders', 'messages', 'saved', 'nearby', 'account'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-3 md:px-5 py-2 rounded-lg text-xs md:text-sm font-semibold capitalize transition-all relative"
              style={{ backgroundColor: activeTab === tab ? '#2d1a0e' : 'white', color: activeTab === tab ? 'white' : '#2d1a0e' }}>
              {tab === 'nearby' ? 'Nearby' : tab === 'saved' ? 'Saved Bakers' : tab === 'orders' ? 'My Orders' : tab === 'messages' ? 'Messages' : 'Account'}
              {tab === 'messages' && unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center" style={{ backgroundColor: '#dc2626' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'orders' && (
          <div className="flex flex-col gap-4">
            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl p-16 shadow-sm text-center">
                <p className="text-5xl mb-4">🎂</p>
                <p className="font-bold text-lg mb-2" style={{ color: '#2d1a0e' }}>No orders yet</p>
                <p className="text-sm mb-6" style={{ color: '#5c3d2e' }}>Find a baker and start your first order!</p>
                <Link href="/bakers" className="px-6 py-3 rounded-xl text-white font-semibold text-sm inline-block" style={{ backgroundColor: '#2d1a0e' }}>Browse Bakers</Link>
              </div>
            ) : orders.map(order => {
              const daysUntil = getDaysUntil(order.event_date)
              const progressStep = getProgressStep(order.status)
              const steps = ['Request Sent', 'Baker Accepted', 'In Progress', 'Ready', 'Complete']
              return (
                <div key={order.id} className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#f5f0eb' }}>
                        {order.bakers?.profile_photo_url ? <img src={order.bakers.profile_photo_url} alt="" className="w-full h-full object-cover" /> : <span className="text-2xl">🎂</span>}
                      </div>
                      <div>
                        <p className="font-bold" style={{ color: '#2d1a0e' }}>{order.bakers?.business_name}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>📍 {order.bakers?.city}, {order.bakers?.state}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="px-3 py-1 text-xs font-semibold rounded-full" style={{
                        backgroundColor: order.status === 'confirmed' ? '#dcfce7' : order.status === 'declined' ? '#fee2e2' : order.status === 'ready' ? '#f3e8ff' : order.status === 'in_progress' ? '#dbeafe' : '#fef9c3',
                        color: order.status === 'confirmed' ? '#166534' : order.status === 'declined' ? '#991b1b' : order.status === 'ready' ? '#6b21a8' : order.status === 'in_progress' ? '#1e40af' : '#854d0e'
                      }}>
                        {order.status === 'confirmed' ? 'Confirmed' : order.status === 'declined' ? 'Declined' : order.status === 'in_progress' ? 'In Progress' : order.status === 'ready' ? 'Ready!' : order.status === 'complete' ? 'Complete' : 'Pending'}
                      </span>
                      {daysUntil > 0 && order.status !== 'declined' && (
                        <p className="text-xs mt-1 font-semibold" style={{ color: daysUntil <= 7 ? '#dc2626' : '#5c3d2e' }}>
                          {daysUntil === 1 ? 'Tomorrow!' : daysUntil + ' days away'}
                        </p>
                      )}
                    </div>
                  </div>

                  {order.status === 'ready' && (
                    <div className="mb-4 rounded-xl p-4" style={{ backgroundColor: '#f3e8ff' }}>
                      <p className="text-sm font-bold mb-1" style={{ color: '#6b21a8' }}>Your order is ready!</p>
                      {order.fulfillment_type === 'pickup' ? (
                        <div>
                          <p className="text-xs mb-2" style={{ color: '#6b21a8' }}>Pickup address:</p>
                          {order.bakers?.pickup_address
                            ? <a href={'https://maps.google.com/?q=' + encodeURIComponent(order.bakers.pickup_address)} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold underline" style={{ color: '#2d1a0e' }}>📍 {order.bakers.pickup_address}</a>
                            : <p className="text-xs" style={{ color: '#5c3d2e' }}>Contact your baker for pickup details.</p>}
                        </div>
                      ) : order.fulfillment_type === 'delivery'
                        ? <p className="text-xs" style={{ color: '#6b21a8' }}>Your baker will be in touch to arrange delivery to your address.</p>
                        : <p className="text-xs" style={{ color: '#6b21a8' }}>Contact your baker to arrange pickup or delivery.</p>}
                    </div>
                  )}

                  {order.status === 'complete' && order.delivery_proof_url && (
                    <div className="mb-4 rounded-xl overflow-hidden border" style={{ borderColor: '#e0d5cc' }}>
                      <div className="px-4 py-3" style={{ backgroundColor: '#2d1a0e' }}>
                        <p className="text-white font-bold text-sm">Your order was delivered!</p>
                        <p className="text-xs mt-0.5" style={{ color: '#c4a882' }}>Thank you for using Whiskly & {order.bakers?.business_name}</p>
                      </div>
                      <img src={order.delivery_proof_url} alt="Delivery proof" className="w-full h-40 object-cover" />
                      {order.care_instructions && (
                        <div className="px-4 py-3" style={{ backgroundColor: '#faf8f6' }}>
                          <p className="text-xs font-semibold mb-1" style={{ color: '#2d1a0e' }}>Care & Storage</p>
                          <p className="text-xs leading-relaxed" style={{ color: '#5c3d2e' }}>{order.care_instructions}</p>
                        </div>
                      )}
                      <div className="px-4 py-3 flex gap-2 flex-wrap border-t" style={{ borderColor: '#e0d5cc' }}>
                        {submittedReviews.includes(order.id) && <span className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>✓ Review submitted</span>}
                        <button onClick={() => { const text = 'Just got my order from ' + order.bakers?.business_name + ' via @Whiskly 🎂 So beautiful!'; if (navigator.share) navigator.share({ text, url: 'https://whiskly.vercel.app/bakers/' + order.baker_id }); else { navigator.clipboard.writeText(text + ' https://whiskly.vercel.app/bakers/' + order.baker_id); alert('Copied to clipboard!') } }}
                          className="px-4 py-2 rounded-lg text-xs font-semibold border" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>📤 Share</button>
                      </div>
                    </div>
                  )}

                  {order.status === 'ready' && order.fulfillment_type === 'pickup' && order.handoff_photo_url && !order.pickup_confirmed_at && (
                    <div className="mb-4 rounded-xl overflow-hidden border" style={{ borderColor: '#e0d5cc' }}>
                      <div className="px-4 py-3" style={{ backgroundColor: '#f5f0eb' }}>
                        <p className="text-sm font-bold" style={{ color: '#2d1a0e' }}>Your order is ready for pickup</p>
                        <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>Your baker has prepared your order. Tap below to confirm you received it.</p>
                      </div>
                      <img src={order.handoff_photo_url} alt="Your order" className="w-full h-36 object-cover" />
                      {order.care_instructions && (
                        <div className="px-4 py-3" style={{ backgroundColor: '#faf8f6' }}>
                          <p className="text-xs font-semibold mb-1" style={{ color: '#2d1a0e' }}>Care & Storage</p>
                          <p className="text-xs" style={{ color: '#5c3d2e' }}>{order.care_instructions}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {order.status === 'complete' && order.pickup_confirmed_at && !order.delivery_proof_url && (
                    <div className="mb-4 rounded-xl p-4" style={{ backgroundColor: '#f5f0eb' }}>
                      <p className="text-sm font-bold mb-1" style={{ color: '#2d1a0e' }}>Order complete!</p>
                      <p className="text-xs" style={{ color: '#5c3d2e' }}>Thank you for using Whiskly & {order.bakers?.business_name}</p>
                      {submittedReviews.includes(order.id) && <p className="text-xs mt-2 font-semibold" style={{ color: '#166534' }}>✓ Review submitted — thank you!</p>}
                    </div>
                  )}

                  {order.status !== 'declined' && (
                    <div className="mb-5">
                      <div className="flex items-center justify-between mb-2">
                        {steps.map((step, i) => (
                          <div key={i} className="flex flex-col items-center flex-1">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition-all"
                              style={{ backgroundColor: i <= progressStep ? '#2d1a0e' : '#e0d5cc', color: i <= progressStep ? 'white' : '#5c3d2e' }}>
                              {i <= progressStep ? '✓' : i + 1}
                            </div>
                            <p className="text-center leading-tight" style={{ fontSize: '9px', color: i <= progressStep ? '#2d1a0e' : '#5c3d2e', fontWeight: i === progressStep ? '700' : '400' }}>{step}</p>
                          </div>
                        ))}
                      </div>
                      <div className="relative h-1 rounded-full mt-1" style={{ backgroundColor: '#e0d5cc' }}>
                        <div className="absolute h-1 rounded-full transition-all duration-500" style={{ backgroundColor: '#2d1a0e', width: (progressStep / (steps.length - 1) * 100) + '%' }} />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 md:gap-4 py-4 border-t border-b mb-4" style={{ borderColor: '#e0d5cc' }}>
                    <div><p className="text-xs font-semibold mb-0.5" style={{ color: '#5c3d2e' }}>Event</p><p className="text-sm font-medium" style={{ color: '#2d1a0e' }}>{order.event_type}</p></div>
                    <div><p className="text-xs font-semibold mb-0.5" style={{ color: '#5c3d2e' }}>Date</p><p className="text-sm font-medium" style={{ color: '#2d1a0e' }}>{(() => { const [y,m,d] = order.event_date.split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString([], {month:'long',day:'numeric',year:'numeric'}) })()}</p></div>
                    <div><p className="text-xs font-semibold mb-0.5" style={{ color: '#5c3d2e' }}>Budget</p><p className="text-sm font-medium" style={{ color: '#2d1a0e' }}>${order.budget}</p></div>
                  </div>

                  {order.item_description && <p className="text-sm mb-4 leading-relaxed" style={{ color: '#5c3d2e' }}>{order.item_description}</p>}

                  {(order.status === 'confirmed' || order.status === 'in_progress' || order.status === 'ready' || order.status === 'complete') && order.fulfillment_type === 'pickup' && (
                    <div className="mb-4 px-3 py-2.5 rounded-xl text-xs" style={{ backgroundColor: '#f5f0eb' }}>
                      <span className="font-semibold" style={{ color: '#2d1a0e' }}>Pickup: </span>
                      <span style={{ color: '#5c3d2e' }}>
                        {order.status === 'ready' || order.status === 'complete'
                          ? (order.bakers?.pickup_address || order.bakers?.city + ', ' + order.bakers?.state + (order.bakers?.pickup_zip ? ' ' + order.bakers?.pickup_zip : ''))
                          : order.bakers?.city + ', ' + order.bakers?.state + (order.bakers?.pickup_zip ? ' ' + order.bakers?.pickup_zip : '')}
                      </span>
                      {order.status !== 'ready' && order.status !== 'complete' && <span className="ml-1 italic" style={{ color: '#8B4513' }}> · Full address shared when ready</span>}
                    </div>
                  )}

                  {(order.status === 'confirmed' || order.status === 'in_progress') && order.fulfillment_type === 'delivery' && (
                    <div className="mb-4 px-3 py-2.5 rounded-xl text-xs" style={{ backgroundColor: '#f5f0eb', color: '#5c3d2e' }}>
                      Delivery confirmed — your baker will be in touch about timing closer to your event date.
                    </div>
                  )}

                  {order.baker_question && (
                    <div className="mb-4 rounded-xl border-2 p-4 flex items-start justify-between gap-4" style={{ borderColor: '#f59e0b', backgroundColor: '#fffbeb' }}>
                      <div className="flex items-start gap-3">
                        <span className="text-lg flex-shrink-0">💬</span>
                        <div>
                          <p className="text-xs font-bold mb-1" style={{ color: '#92400e' }}>{order.bakers?.business_name} has a question about your order:</p>
                          <p className="text-sm font-medium" style={{ color: '#78350f' }}>"{order.baker_question}"</p>
                        </div>
                      </div>
                      <button onClick={() => openThread(order.id)} className="flex-shrink-0 px-4 py-2 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: '#f59e0b' }}>Reply</button>
                    </div>
                  )}

                  {reviewNudgeEligible(order) && (
                    <div className="mb-4 rounded-xl px-4 py-3 flex items-center justify-between gap-3" style={{ backgroundColor: '#fef9c3', border: '1px solid #fde68a' }}>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: '#854d0e' }}>How did everything turn out?</p>
                        <p className="text-xs mt-0.5" style={{ color: '#92400e' }}>Your review helps {order.bakers?.business_name} grow their business.</p>
                      </div>
                      <button onClick={() => setReviewOrder(order)} className="flex-shrink-0 px-4 py-2 rounded-lg text-white text-xs font-semibold" style={{ backgroundColor: '#2d1a0e' }}>Review</button>
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    <Link href={'/bakers/' + order.baker_id} className="px-4 py-2 rounded-lg text-xs font-semibold border" style={{ borderColor: '#2d1a0e', color: '#2d1a0e' }}>View Baker</Link>
                    <button onClick={() => openThread(order.id)} className="px-4 py-2 rounded-lg text-xs font-semibold border" style={{ borderColor: '#5c3d2e', color: '#5c3d2e' }}>Message</button>
                    {order.status === 'ready' && order.fulfillment_type === 'delivery' && (
                      <button onClick={() => markReceived(order.id)} className="px-4 py-2 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: '#166534' }}>Mark as Received</button>
                    )}
                    {order.status === 'ready' && order.fulfillment_type === 'pickup' && order.handoff_photo_url && !order.pickup_confirmed_at && (
                      <button onClick={() => confirmPickup(order)} className="px-4 py-2 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: '#166534' }}>Confirm Pickup</button>
                    )}
                    {order.status === 'declined' && (
                      <Link href="/bakers" className="px-4 py-2 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: '#2d1a0e' }}>Find Another Baker</Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden" style={{ height: '560px' }}>
            <div className="flex h-full">
              <div className={`${activeOrderId ? 'hidden md:flex' : 'flex'} w-full md:w-72 flex-shrink-0 flex-col border-r`} style={{ borderColor: '#e0d5cc' }}>
                <div className="px-4 py-4 border-b" style={{ borderColor: '#e0d5cc' }}>
                  <h3 className="font-bold text-sm" style={{ color: '#2d1a0e' }}>Conversations</h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                      <p className="text-sm font-medium mb-1" style={{ color: '#2d1a0e' }}>No messages yet</p>
                      <p className="text-xs mb-4" style={{ color: '#5c3d2e' }}>Start an order to begin a conversation</p>
                      <Link href="/bakers" className="px-4 py-2 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: '#2d1a0e' }}>Browse Bakers</Link>
                    </div>
                  ) : conversations.map(conv => (
                    <button key={conv.thread_key} onClick={() => { setActiveOrderId(conv.order_id); loadThread(conv.order_id) }}
                      className="w-full px-4 py-3 flex items-center gap-3 text-left border-b"
                      style={{ borderColor: '#e0d5cc', backgroundColor: activeOrderId === conv.order_id ? '#f5f0eb' : 'transparent', borderLeft: activeOrderId === conv.order_id ? '3px solid #2d1a0e' : '3px solid transparent' }}>
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#f5f0eb' }}>
                        {conv.bakers?.profile_photo_url ? <img src={conv.bakers.profile_photo_url} alt="" className="w-full h-full object-cover" /> : <span className="text-lg">🎂</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: '#2d1a0e' }}>{conv.bakers?.business_name}</p>
                        <p className="text-xs truncate mt-0.5 font-medium" style={{ color: '#8B4513' }}>{threadLabel(conv)}</p>
                        <p className="text-xs truncate mt-0.5" style={{ color: '#5c3d2e' }}>{conv.content}</p>
                      </div>
                      <p className="text-xs flex-shrink-0" style={{ color: '#5c3d2e' }}>{formatDate(conv.created_at)}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 flex flex-col">
                {!activeOrderId || !activeConvo ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-sm" style={{ color: '#5c3d2e' }}>Select a conversation</p>
                  </div>
                ) : (
                  <>
                    <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: '#e0d5cc' }}>
                      <button className="md:hidden flex-shrink-0 text-sm font-semibold mr-1" onClick={() => setActiveOrderId(null)} style={{ color: '#2d1a0e' }}>← Back</button>
                      <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#f5f0eb' }}>
                        {activeConvo.baker?.profile_photo_url ? <img src={activeConvo.baker.profile_photo_url} alt="" className="w-full h-full object-cover" /> : <span>🎂</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate" style={{ color: '#2d1a0e' }}>{activeConvo.baker?.business_name}</p>
                        <p className="text-xs" style={{ color: '#8B4513' }}>{activeConvo.order?.event_type}{activeConvo.order?.event_date ? ' · ' + (() => { const [y,m,d] = activeConvo.order.event_date.split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString([], {month:'short',day:'numeric',year:'numeric'}) })() : ''}</p>
                      </div>
                      <Link href={'/bakers/' + activeConvo.baker?.id} className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>View Profile</Link>
                    </div>
                    <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
                      {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-16">
                          <p className="text-sm font-medium mb-1" style={{ color: '#2d1a0e' }}>No messages yet</p>
                          <p className="text-xs" style={{ color: '#5c3d2e' }}>Start the conversation with {activeConvo.baker?.business_name}</p>
                        </div>
                      ) : messages.map((msg, i) => {
                        const isMe = msg.sender_id === currentUserId
                        const showDate = i === 0 || formatDate(messages[i - 1].created_at) !== formatDate(msg.created_at)
                        return (
                          <div key={msg.id}>
                            {showDate && <div className="text-center my-2"><span className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: '#f5f0eb', color: '#5c3d2e' }}>{formatDate(msg.created_at)}</span></div>}
                            <div className={'flex ' + (isMe ? 'justify-end' : 'justify-start')}>
                              <div className="max-w-xs">
                                <div className="px-4 py-2.5 rounded-2xl text-sm" style={{ backgroundColor: isMe ? '#2d1a0e' : '#f5f0eb', color: isMe ? 'white' : '#2d1a0e', borderBottomRightRadius: isMe ? '4px' : '16px', borderBottomLeftRadius: isMe ? '16px' : '4px' }}>{msg.content}</div>
                                <p className={'text-xs mt-1 ' + (isMe ? 'text-right' : 'text-left')} style={{ color: '#5c3d2e' }}>{formatTime(msg.created_at)}</p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                    <div className="px-5 py-4 border-t flex gap-3 items-end" style={{ borderColor: '#e0d5cc' }}>
                      <textarea value={newMessage} onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                        placeholder={'Message ' + (activeConvo.baker?.business_name || 'baker') + '...'}
                        rows={1} className="flex-1 px-4 py-2.5 rounded-xl border text-sm resize-none"
                        style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6', maxHeight: '100px' }} />
                      <button onClick={sendMessage} disabled={sendingMessage || !newMessage.trim()}
                        className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold flex-shrink-0"
                        style={{ backgroundColor: '#2d1a0e', opacity: (!newMessage.trim() || sendingMessage) ? 0.5 : 1 }}>Send</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'saved' && (
          <div>
            {savedBakers.length === 0 ? (
              <div className="bg-white rounded-2xl p-16 shadow-sm text-center">
                <p className="text-5xl mb-4">❤️</p>
                <p className="font-bold text-lg mb-2" style={{ color: '#2d1a0e' }}>No saved bakers yet</p>
                <p className="text-sm mb-6" style={{ color: '#5c3d2e' }}>Heart a baker on their profile to save them here!</p>
                <Link href="/bakers" className="px-6 py-3 rounded-xl text-white font-semibold text-sm inline-block" style={{ backgroundColor: '#2d1a0e' }}>Browse Bakers</Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {nearbyBakers.filter(b => savedBakers.includes(b.id)).map(baker => (
                  <div key={baker.id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                    <div className="h-36 overflow-hidden" style={{ backgroundColor: '#f5f0eb' }}>
                      {baker.profile_photo_url ? <img src={baker.profile_photo_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl">🎂</div>}
                    </div>
                    <div className="p-4">
                      <p className="font-bold" style={{ color: '#2d1a0e' }}>{baker.business_name}</p>
                      <p className="text-xs mt-0.5 mb-3" style={{ color: '#5c3d2e' }}>📍 {baker.city}, {baker.state}</p>
                      <div className="flex gap-2">
                        <Link href={'/bakers/' + baker.id} className="flex-1 text-center py-2 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: '#2d1a0e' }}>View Profile</Link>
                        <button onClick={() => toggleSave(baker.id)} className="px-3 py-2 rounded-lg text-xs font-semibold border" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>✕</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'nearby' && (
          <div className="grid grid-cols-2 gap-4">
            {nearbyBakers.length === 0 ? (
              <div className="col-span-2 bg-white rounded-2xl p-16 shadow-sm text-center">
                <p className="text-5xl mb-4">📍</p>
                <p className="font-bold text-lg mb-2" style={{ color: '#2d1a0e' }}>No bakers found nearby</p>
                <p className="text-sm" style={{ color: '#5c3d2e' }}>We're growing! Check back soon.</p>
              </div>
            ) : nearbyBakers.map(baker => (
              <div key={baker.id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <div className="h-36 overflow-hidden relative" style={{ backgroundColor: '#f5f0eb' }}>
                  {baker.profile_photo_url ? <img src={baker.profile_photo_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl">🎂</div>}
                  <button onClick={() => toggleSave(baker.id)} className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-md text-sm" style={{ backgroundColor: 'white', color: savedBakers.includes(baker.id) ? '#dc2626' : '#5c3d2e' }}>
                    {savedBakers.includes(baker.id) ? '❤️' : '🤍'}
                  </button>
                </div>
                <div className="p-4">
                  <p className="font-bold" style={{ color: '#2d1a0e' }}>{baker.business_name}</p>
                  <p className="text-xs mt-0.5 mb-1" style={{ color: '#5c3d2e' }}>📍 {baker.city}, {baker.state}</p>
                  {baker.starting_price && <p className="text-xs mb-3 font-semibold" style={{ color: '#2d1a0e' }}>From ${baker.starting_price}</p>}
                  <Link href={'/bakers/' + baker.id} className="block text-center py-2 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: '#2d1a0e' }}>View Profile →</Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'account' && (
          <div className="flex flex-col gap-6 max-w-lg">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-6" style={{ color: '#2d1a0e' }}>Account Info</h2>
              <div className="flex flex-col gap-4">
                {[['Full Name', customer?.full_name], ['Email', customer?.email], ['Location', customer?.city && customer?.state ? customer.city + ', ' + customer.state : 'Not set']].map(([label, val]) => (
                  <div key={label as string}>
                    <label className="block text-sm font-semibold mb-1" style={{ color: '#2d1a0e' }}>{label}</label>
                    <p className="px-4 py-3 rounded-lg border text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }}>{val || '—'}</p>
                  </div>
                ))}
                <div className="pt-2 flex items-center justify-between">
                  <p className="text-xs" style={{ color: '#5c3d2e' }}>Want to sell on Whiskly? <Link href="/join" className="font-semibold underline" style={{ color: '#2d1a0e' }}>Join as a Baker</Link></p>
                  <button onClick={handleSignOut} className="px-4 py-2 rounded-lg text-xs font-semibold border" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>Sign Out</button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-lg font-bold" style={{ color: '#2d1a0e' }}>Important Dates</h2>
                <p className="text-xs mt-1" style={{ color: '#5c3d2e' }}>Save recurring dates and we'll remind you to order in advance — birthdays, anniversaries, and more.</p>
              </div>
              {importantDates.length > 0 && (
                <div className="flex flex-col gap-2 mb-5">
                  {importantDates.map(date => {
                    const daysAway = getDaysUntilDate(date.month, date.day)
                    const soon = daysAway <= 42
                    return (
                      <div key={date.id} className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ backgroundColor: soon ? '#fff7ed' : '#f5f0eb' }}>
                        <div className="flex items-center gap-3">
                          <div className="text-center w-10 flex-shrink-0">
                            <p className="text-xs font-bold uppercase" style={{ color: soon ? '#c2410c' : '#5c3d2e' }}>{MONTHS[date.month - 1].slice(0, 3)}</p>
                            <p className="text-lg font-bold leading-none" style={{ color: soon ? '#c2410c' : '#2d1a0e' }}>{date.day}</p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: '#2d1a0e' }}>{date.label}</p>
                            <p className="text-xs mt-0.5" style={{ color: soon ? '#c2410c' : '#5c3d2e' }}>
                              {daysAway === 0 ? 'Today!' : daysAway === 1 ? 'Tomorrow!' : daysAway + ' days away'}{soon && daysAway > 1 ? ' — time to order!' : ''}
                            </p>
                          </div>
                        </div>
                        <button onClick={() => removeImportantDate(date.id)} className="text-xs px-2 py-1 rounded-lg border flex-shrink-0" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>✕</button>
                      </div>
                    )
                  })}
                </div>
              )}
              <div className="p-4 rounded-xl border-2 border-dashed" style={{ borderColor: '#e0d5cc' }}>
                <p className="text-xs font-semibold mb-3" style={{ color: '#2d1a0e' }}>Add a date</p>
                <div className="flex flex-col gap-2">
                  <input value={newDateLabel} onChange={e => setNewDateLabel(e.target.value)} placeholder="e.g. Emma's Birthday, Our Anniversary..."
                    className="w-full px-3 py-2.5 rounded-lg border text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
                  <div className="flex gap-2">
                    <select value={newDateMonth} onChange={e => setNewDateMonth(e.target.value)} className="flex-1 px-3 py-2.5 rounded-lg border text-sm" style={{ borderColor: '#e0d5cc', color: newDateMonth ? '#2d1a0e' : '#5c3d2e', backgroundColor: '#faf8f6' }}>
                      <option value="">Month</option>
                      {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                    </select>
                    <select value={newDateDay} onChange={e => setNewDateDay(e.target.value)} className="w-24 px-3 py-2.5 rounded-lg border text-sm" style={{ borderColor: '#e0d5cc', color: newDateDay ? '#2d1a0e' : '#5c3d2e', backgroundColor: '#faf8f6' }}>
                      <option value="">Day</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <button onClick={addImportantDate} disabled={savingDate || !newDateLabel.trim() || !newDateMonth || !newDateDay}
                      className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white flex-shrink-0"
                      style={{ backgroundColor: '#2d1a0e', opacity: (!newDateLabel.trim() || !newDateMonth || !newDateDay || savingDate) ? 0.5 : 1 }}>
                      {savingDate ? '...' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
              {importantDates.length === 0 && <p className="text-xs text-center mt-4" style={{ color: '#5c3d2e' }}>No dates saved yet — add your first one above!</p>}
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

export default function CustomerDashboard() {
  return (
    <Suspense fallback={null}>
      <CustomerDashboardInner />
    </Suspense>
  )
}