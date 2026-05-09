'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { PaymentModal } from '@/components/PaymentModal'

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

  const [phoneValue, setPhoneValue] = useState('')
  const [savingPhone, setSavingPhone] = useState(false)
  const [phoneSaved, setPhoneSaved] = useState(false)

  // Payment state
  const [paymentOrder, setPaymentOrder] = useState<any>(null)
  const [paymentType, setPaymentType] = useState<'deposit' | 'remainder'>('deposit')

  // Payment plan choice modal (shown for eligible confirmed orders before deposit)
  const [planChoiceOrder, setPlanChoiceOrder] = useState<any>(null)
  const [planChoiceSelection, setPlanChoiceSelection] = useState<'standard' | 'installments'>('standard')
  const [submittingPlanChoice, setSubmittingPlanChoice] = useState(false)

  // Cancel order state
  const [cancelOrder, setCancelOrder] = useState<any>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelDescription, setCancelDescription] = useState('')
  const [cancellingOrder, setCancellingOrder] = useState(false)

  // Dispute state
  const [disputeOrder, setDisputeOrder] = useState<any>(null)
  const [disputeReason, setDisputeReason] = useState('')
  const [disputeDescription, setDisputeDescription] = useState('')
  const [filingDispute, setFilingDispute] = useState(false)

  // Non-receipt state
  const [nonReceiptOrder, setNonReceiptOrder] = useState<any>(null)
  const [nonReceiptInput, setNonReceiptInput] = useState('')
  const [processingNonReceipt, setProcessingNonReceipt] = useState(false)

  // Block baker state
  const [blockBakerOrder, setBlockBakerOrder] = useState<any>(null)
  const [blockingBaker, setBlockingBaker] = useState(false)
  const [showDotsOrderId, setShowDotsOrderId] = useState<string | null>(null)

  // Size reduction state
  const [sizeReductionOrder, setSizeReductionOrder] = useState<any>(null)
  const [sizeReductionServings, setSizeReductionServings] = useState('')
  const [submittingSizeReduction, setSubmittingSizeReduction] = useState(false)

  // Needs Attention collapsed state
  const [needsAttentionCollapsed, setNeedsAttentionCollapsed] = useState(false)

  // Tip state
  const [tipOrder, setTipOrder] = useState<any>(null)
  const [tipSelection, setTipSelection] = useState<'10' | '15' | '20' | 'custom'>('15')
  const [tipCustomAmount, setTipCustomAmount] = useState('')
  const [sendingTip, setSendingTip] = useState(false)
  const [tipSuccess, setTipSuccess] = useState(false)
  const [tipError, setTipError] = useState<string | null>(null)
  const [dismissedTips, setDismissedTips] = useState<string[]>([])

  // Off-platform message monitoring
  const [offPlatformWarning, setOffPlatformWarning] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadDashboard()
    try {
      const stored = localStorage.getItem('whiskly_dismissed_tips')
      if (stored) setDismissedTips(JSON.parse(stored))
    } catch {}
  }, [])

  useEffect(() => {
    const tab = searchParams.get('tab')
    const orderId = searchParams.get('order')
    const success = searchParams.get('success')
    const paid = searchParams.get('paid')
    if (tab === 'messages') setActiveTab('messages')
    if (tab === 'orders') setActiveTab('orders')
    if (orderId) setActiveOrderId(orderId)
    if (success === '1' || paid === 'true') {
      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 5000)
      setTimeout(() => loadDashboard(), 1500)
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

  // Auto-show payment plan choice modal for eligible confirmed orders that haven't set payment_plan yet
  useEffect(() => {
    if (planChoiceOrder) return // already showing
    const eligible = orders.find(o =>
      o.status === 'confirmed' &&
      !o.deposit_paid_at &&
      o.payment_plan === null &&
      o.bakers?.payment_plans_enabled &&
      (o.confirmed_price != null ? o.confirmed_price / 100 : o.budget) >= 500
    )
    if (eligible) {
      setPlanChoiceSelection((o => {
        const price = o.confirmed_price != null ? o.confirmed_price / 100 : o.budget
        return price >= 750 ? 'installments' : 'standard'
      })(eligible))
      setPlanChoiceOrder(eligible)
    }
  }, [orders])

  useEffect(() => {
  if (activeTab === 'messages' && activeOrderId && currentUserId) {
    const conv = conversations.find(c => c.thread_key === activeOrderId)
    loadThread(conv?.order_id || null, conv?.baker_id)
  }
}, [activeOrderId, activeTab, currentUserId])

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
    if (!customer?.email) return
    const channel = supabase
      .channel('customer-orders-' + customer.id)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: 'customer_email=eq.' + customer.email }, (payload) => {
        setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [customer])

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
      setPhoneValue(customerData.phone || '')
      const { data: ordersData } = await supabase
  .from('orders')
  .select('*, bakers(id, business_name, profile_photo_url, city, state, pickup_address, pickup_zip, payment_plans_enabled)')
  .eq('customer_email', customerData.email)
  .order('created_at', { ascending: false })
      setOrders(ordersData || [])
      const { data: savedData } = await supabase
        .from('saved_bakers').select('baker_id').eq('customer_id', customerData.id)
      setSavedBakers((savedData || []).map((r: any) => r.baker_id))
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
      const { data: ordersData } = await supabase.from('orders').select('id, event_type, event_date, status, deposit_paid_at, amount_remainder, budget').in('id', orderIds)
      for (const o of ordersData || []) ordersMap[o.id] = o
    }
    setConversations(threads.map(t => ({ ...t, order_info: t.order_id ? ordersMap[t.order_id] : null, thread_key: t.order_id || ('general-' + t.baker_id) })))
    const paramOrderId = searchParams.get('order')
    if (paramOrderId && !activeOrderId) setActiveOrderId(paramOrderId)
    else if (!activeOrderId && threads.length > 0) setActiveOrderId(threads[0].order_id || null)
  }

  async function loadThread(orderId: string | null, bakerId?: string) {
  if (!currentUserId) return

  if (orderId) {
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
  } else if (bakerId) {
    // General inquiry thread — no order_id
    const { data: bakerData } = await supabase.from('bakers').select('id, business_name, profile_photo_url, city, state').eq('id', bakerId).maybeSingle()
    if (bakerData) setActiveConvo({ baker: bakerData, order: null })
    const { data: msgs } = await supabase.from('messages').select('*')
      .eq('baker_id', bakerId)
      .is('order_id', null)
      .or('sender_id.eq.' + currentUserId + ',receiver_id.eq.' + currentUserId)
      .order('created_at', { ascending: true })
    setMessages(msgs || [])
    await supabase.from('messages').update({ read_at: new Date().toISOString() })
      .eq('baker_id', bakerId)
      .is('order_id', null)
      .eq('receiver_id', currentUserId).is('read_at', null)
  }
}

  function detectOffPlatformPattern(text: string): string | null {
    const lower = text.toLowerCase()
    if (/(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/.test(text)) return 'phone number'
    if (/[^\s@]+@[^\s@]+\.[a-z]{2,}/i.test(text)) return 'email address'
    if (/@[a-zA-Z0-9_]{2,}/.test(text)) return '@handle'
    const phrases = ['venmo', 'zelle', 'cash app', 'cashapp', 'paypal', 'apple pay', 'applepay', 'text me', 'call me', 'my number', 'my email', 'reach me', 'contact me outside', 'dm me', 'direct message', 'whatsapp', 'telegram', 'snapchat']
    for (const phrase of phrases) { if (lower.includes(phrase)) return `"${phrase}"` }
    return null
  }

  async function sendMessage() {
    if (!newMessage.trim() || !currentUserId || !activeConvo) return
    setSendingMessage(true)
    const msgContent = newMessage.trim()
    const pattern = detectOffPlatformPattern(msgContent)
    const { data: bakerUser } = await supabase.from('bakers').select('user_id').eq('id', activeConvo.baker.id).maybeSingle()
    const conv = conversations.find(c => c.thread_key === activeOrderId)
    await supabase.from('messages').insert({
      sender_id: currentUserId,
      receiver_id: bakerUser?.user_id,
      baker_id: activeConvo.baker.id,
      order_id: conv?.order_id || null,
      content: msgContent,
      ...(pattern ? { is_flagged: true, flagged_reason: pattern } : {}),
    })
    setNewMessage('')
    setSendingMessage(false)
    if (pattern) setOffPlatformWarning(pattern)
    loadThread(activeOrderId)
    loadConversations()
  }

  function openThread(orderId: string) { setActiveOrderId(orderId); setActiveTab('messages'); loadThread(orderId) }

  async function submitPlanChoice() {
    if (!planChoiceOrder) return
    setSubmittingPlanChoice(true)
    const usePlan = planChoiceSelection === 'installments'
    const price = planChoiceOrder.confirmed_price != null ? planChoiceOrder.confirmed_price / 100 : planChoiceOrder.budget
    const payment2Date = (() => {
      const eventDate = new Date(planChoiceOrder.event_date + 'T00:00:00')
      const midMs = (Date.now() + eventDate.getTime()) / 2
      return new Date(midMs).toISOString()
    })()
    await supabase.from('orders').update({
      payment_plan: usePlan,
      payment_plan_payment2_date: usePlan ? payment2Date : null,
      payment_plan_payment2_amount: usePlan ? Math.round(price * 100 * 0.33) : null,
    }).eq('id', planChoiceOrder.id)
    setOrders(prev => prev.map(o => o.id === planChoiceOrder.id ? { ...o, payment_plan: usePlan } : o))
    setPlanChoiceOrder(null)
    setSubmittingPlanChoice(false)
    // Trigger deposit payment
    setPaymentOrder({ ...planChoiceOrder, payment_plan: usePlan })
    setPaymentType('deposit')
  }

  async function submitSizeReduction() {
    if (!sizeReductionOrder || !sizeReductionServings) return
    const requestedServings = parseInt(sizeReductionServings)
    const originalServings = parseInt(sizeReductionOrder.servings) || 0
    if (requestedServings >= originalServings) return
    setSubmittingSizeReduction(true)
    const now = new Date().toISOString()
    await supabase.from('orders').update({
      size_reduction_requested: true,
      size_reduction_original_servings: originalServings,
      size_reduction_requested_servings: requestedServings,
      size_reduction_requested_at: now,
      size_reduction_status: 'pending',
    }).eq('id', sizeReductionOrder.id)
    // Notify baker via message
    const { data: bakerData } = await supabase.from('bakers').select('user_id, email, business_name').eq('id', sizeReductionOrder.baker_id).maybeSingle()
    if (bakerData) {
      await supabase.from('messages').insert({
        sender_id: customer?.user_id,
        receiver_id: bakerData.user_id,
        baker_id: sizeReductionOrder.baker_id,
        order_id: sizeReductionOrder.id,
        content: sizeReductionOrder.customer_name + ' has requested a size reduction for their ' + sizeReductionOrder.event_type + ' order from ' + originalServings + ' servings to ' + requestedServings + ' servings. Review and respond in your dashboard.',
      })
      fetch('/api/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'announcement', to: bakerData.email, name: bakerData.business_name, subject: 'Size reduction request — ' + sizeReductionOrder.customer_name, body: 'Your customer ' + sizeReductionOrder.customer_name + ' has requested a size reduction for their ' + sizeReductionOrder.event_type + ' order from ' + originalServings + ' servings to ' + requestedServings + ' servings. Review and respond in your dashboard.' }) }).catch(() => {})
    }
    setOrders(prev => prev.map(o => o.id === sizeReductionOrder.id ? { ...o, size_reduction_requested: true, size_reduction_status: 'pending', size_reduction_original_servings: originalServings, size_reduction_requested_servings: requestedServings } : o))
    setSizeReductionOrder(null)
    setSizeReductionServings('')
    setSubmittingSizeReduction(false)
  }

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

  async function toggleSave(bakerId: string) {
    if (!customer) return
    if (savedBakers.includes(bakerId)) {
      await supabase.from('saved_bakers').delete().eq('customer_id', customer.id).eq('baker_id', bakerId)
      setSavedBakers(prev => prev.filter(id => id !== bakerId))
    } else {
      await supabase.from('saved_bakers').insert({ customer_id: customer.id, baker_id: bakerId })
      setSavedBakers(prev => [...prev, bakerId])
    }
  }

  function getDaysUntil(dateStr: string) {
    const [year, month, day] = dateStr.split('-').map(Number)
    const today = new Date(); today.setHours(0, 0, 0, 0)
    return Math.round((new Date(year, month - 1, day).getTime() - today.getTime()) / 86400000)
  }

  function getProgressStep(order: any) {
    const { status, deposit_paid_at } = order
    if (status === 'pending') return 0
    if (status === 'confirmed' && !deposit_paid_at) return 1
    if (status === 'confirmed' && deposit_paid_at) return 2
    if (status === 'in_progress') return 3
    if (status === 'ready') return 4
    if (status === 'complete') return 5
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

  // Payment helpers
  function needsDeposit(order: any) {
    return order.status === 'confirmed' && !order.deposit_paid_at && order.budget
  }

  function needsRemainder(order: any) {
    if (!order.deposit_paid_at || order.remainder_paid_at) return false
    if (order.status !== 'confirmed' && order.status !== 'in_progress') return false
    const daysUntil = getDaysUntil(order.event_date)
    return daysUntil <= 2 // show reminder within 48hrs of event
  }

  function openPayment(order: any, type: 'deposit' | 'remainder') {
    setPaymentOrder(order)
    setPaymentType(type)
  }

  async function payDeposit(order: any) {
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: order.id }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        // Fallback to PaymentModal (baker has Stripe Connect)
        openPayment(order, 'deposit')
      }
    } catch (err) {
      console.error('Checkout session failed, falling back to PaymentModal', err)
      openPayment(order, 'deposit')
    }
  }

  async function onPaymentSuccess() {
  // Update deposit_paid_at directly — don't wait for webhook
  if (paymentOrder) {
    await supabase.from('orders').update({
      deposit_paid_at: new Date().toISOString(),
      status: 'confirmed',
    }).eq('id', paymentOrder.id)
  }
  setPaymentOrder(null)
  await loadDashboard()
  setShowSuccessToast(true)
  setTimeout(() => setShowSuccessToast(false), 4000)
}

  async function acceptCounterOffer(order: any) {
    await supabase.from('orders').update({
      status: 'confirmed',
      counter_status: 'accepted',
      budget: order.counter_price,
    }).eq('id', order.id)
    await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'deposit_nudge',
        customerEmail: order.customer_email,
        customerName: order.customer_name,
        bakerName: order.bakers?.business_name,
        amount: order.counter_price,
      }),
    }).catch(() => {})
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'confirmed', counter_status: 'accepted', budget: order.counter_price } : o))
  }

  async function declineCounterOffer(order: any) {
    await supabase.from('orders').update({ status: 'declined', counter_status: 'declined' }).eq('id', order.id)
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'declined', counter_status: 'declined' } : o))
  }

  async function handleCustomerCancelOrder() {
    if (!cancelOrder || !cancelReason) return
    setCancellingOrder(true)
    const now = new Date().toISOString()
    const daysUntil = getDaysUntil(cancelOrder.event_date)
    await supabase.from('orders').update({
      status: 'cancelled',
      cancelled_by: 'customer',
      cancellation_reason: cancelReason,
      cancelled_at: now,
    }).eq('id', cancelOrder.id)
    if (!cancelOrder.deposit_paid_at) {
      // Pre-deposit cancellation — no Stripe call, no strike, no penalty
      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'announcement',
          to: cancelOrder.bakers?.email,
          name: cancelOrder.bakers?.business_name,
          subject: 'Order request cancelled — no action needed',
          body: cancelOrder.customer_name + ' cancelled their ' + cancelOrder.event_type + ' request before paying the deposit. No action needed on your end.',
        }),
      }).catch(() => {})
      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'announcement',
          to: cancelOrder.customer_email,
          name: cancelOrder.customer_name,
          subject: 'Your order request has been cancelled — Whiskly',
          body: 'Your order request has been cancelled. No charges were made to your account.',
        }),
      }).catch(() => {})
    } else {
      // Post-deposit cancellation — existing refund logic
      if (cancelOrder.status === 'confirmed' && daysUntil >= 7) {
        await fetch('/api/stripe/refund', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: cancelOrder.id }),
        }).catch(() => {})
      }
      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'customer_cancelled',
          bakerEmail: cancelOrder.bakers?.email,
          bakerName: cancelOrder.bakers?.business_name,
          customerName: cancelOrder.customer_name,
          eventType: cancelOrder.event_type,
          eventDate: cancelOrder.event_date,
          orderId: cancelOrder.id,
          reason: cancelReason,
        }),
      }).catch(() => {})
    }
    setOrders(prev => prev.map(o => o.id === cancelOrder.id ? { ...o, status: 'cancelled', cancelled_by: 'customer' } : o))
    setCancelOrder(null); setCancelReason(''); setCancelDescription(''); setCancellingOrder(false)
  }

  async function handleCustomerFileDispute() {
    if (!disputeOrder || !disputeReason || disputeDescription.trim().length < 20) return
    setFilingDispute(true)
    const now = new Date().toISOString()
    await supabase.from('orders').update({
      status: 'disputed',
      is_disputed: true,
      dispute_reason: disputeReason,
      dispute_description: disputeDescription.trim(),
      dispute_filed_by: 'customer',
      dispute_filed_at: now,
    }).eq('id', disputeOrder.id)
    await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'dispute_filed',
        customerEmail: disputeOrder.customer_email,
        customerName: disputeOrder.customer_name,
        bakerName: disputeOrder.bakers?.business_name,
        eventType: disputeOrder.event_type,
        eventDate: disputeOrder.event_date,
        orderId: disputeOrder.id,
        reason: disputeReason,
        filedBy: 'customer',
      }),
    }).catch(() => {})
    // Initialize evidence collection — generates tokens and emails both parties
    fetch('/api/disputes/evidence/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: disputeOrder.id }),
    }).catch(() => {})
    setOrders(prev => prev.map(o => o.id === disputeOrder.id ? { ...o, status: 'disputed', is_disputed: true } : o))
    setDisputeOrder(null); setDisputeReason(''); setDisputeDescription(''); setFilingDispute(false)
  }

  async function handleNonReceiptConfirm() {
    if (!nonReceiptOrder || nonReceiptInput !== 'I did not receive my order') return
    setProcessingNonReceipt(true)
    // Auto-resolve check: budget < $50, no delivery proof, baker dispute_count = 0, customer refund_count < 2
    const budget = nonReceiptOrder.budget || 0
    const hasDeliveryProof = !!nonReceiptOrder.delivery_proof_url
    const { data: bakerData } = await supabase.from('bakers').select('dispute_count').eq('id', nonReceiptOrder.baker_id).maybeSingle()
    const { data: customerData } = await supabase.from('customers').select('refund_count').eq('email', nonReceiptOrder.customer_email).maybeSingle()
    const bakerDisputeCount = bakerData?.dispute_count || 0
    const customerRefundCount = customerData?.refund_count || 0
    const autoResolve = budget < 50 && !hasDeliveryProof && bakerDisputeCount === 0 && customerRefundCount < 2
    if (autoResolve && nonReceiptOrder.remainder_payment_intent_id) {
      await fetch('/api/stripe/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId: nonReceiptOrder.remainder_payment_intent_id }),
      }).catch(() => {})
      await supabase.from('customers').update({ refund_count: customerRefundCount + 1 }).eq('email', nonReceiptOrder.customer_email)
      await supabase.from('orders').update({ status: 'disputed', is_disputed: true, dispute_reason: 'non_receipt', dispute_filed_by: 'customer', customer_confirmed_nonreceipt: true }).eq('id', nonReceiptOrder.id)
      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'announcement', to: nonReceiptOrder.customer_email, name: nonReceiptOrder.customer_name, subject: 'Your refund is being processed — Whiskly', body: 'We reviewed your non-receipt report for your order with ' + nonReceiptOrder.bakers?.business_name + ' and have initiated a refund. It may take 5-10 business days to appear.' }),
      }).catch(() => {})
    } else {
      await supabase.from('orders').update({ status: 'disputed', is_disputed: true, dispute_reason: 'non_receipt', dispute_filed_by: 'customer', customer_confirmed_nonreceipt: true }).eq('id', nonReceiptOrder.id)
      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'announcement', to: 'support@whiskly.co', name: 'Whiskly Admin', subject: '[ADMIN] Non-receipt dispute — ' + nonReceiptOrder.customer_name, body: nonReceiptOrder.customer_name + ' (' + nonReceiptOrder.customer_email + ') reported non-receipt for order ' + nonReceiptOrder.id + ' with baker ' + nonReceiptOrder.bakers?.business_name + '. Budget: $' + budget + '. Requires manual review.' }),
      }).catch(() => {})
    }
    setOrders(prev => prev.map(o => o.id === nonReceiptOrder.id ? { ...o, status: 'disputed', is_disputed: true, customer_confirmed_nonreceipt: true } : o))
    setNonReceiptOrder(null); setNonReceiptInput(''); setProcessingNonReceipt(false)
  }

  async function handleBlockBaker() {
    if (!blockBakerOrder) return
    setBlockingBaker(true)
    await supabase.from('blocks').insert({ blocker_id: customer?.id, blocked_id: blockBakerOrder.baker_id, blocker_type: 'customer' })
    setBlockBakerOrder(null); setBlockingBaker(false)
  }

  function getTipAmountCents(order: any): number {
    const budget = order.budget || 0
    if (tipSelection === 'custom') return Math.round(parseFloat(tipCustomAmount || '0') * 100)
    const pct = parseInt(tipSelection) / 100
    return Math.round(budget * pct * 100)
  }

  async function handleSendTip() {
    if (!tipOrder) return
    const amountCents = getTipAmountCents(tipOrder)
    if (amountCents < 100) return
    setSendingTip(true)
    setTipError(null)
    try {
      const res = await fetch('/api/stripe/tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: tipOrder.id,
          baker_id: tipOrder.baker_id,
          tip_amount_cents: amountCents,
          customer_email: customer?.email,
        }),
      })
      const data = await res.json()
      if (data.error) {
        setTipError(data.error)
        setSendingTip(false)
        return
      }
      // Payment succeeded server-side
      const now = data.tip_paid_at || new Date().toISOString()
      setOrders(prev => prev.map(o => o.id === tipOrder.id ? { ...o, tip_amount: amountCents, tip_paid_at: now } : o))
      setTipSuccess(true)
    } finally {
      setSendingTip(false)
    }
  }

  function dismissTip(orderId: string) {
    const updated = [...dismissedTips, orderId]
    setDismissedTips(updated)
    try { localStorage.setItem('whiskly_dismissed_tips', JSON.stringify(updated)) } catch {}
  }

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

  async function handleSignOut() { await supabase.auth.signOut(); router.push('/') }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f0eb' }}>
      <p style={{ color: '#2d1a0e' }}>Loading your dashboard...</p>
    </div>
  )

  const STATUS_ORDER: Record<string, number> = { in_progress: 0, confirmed: 1, ready: 2, pending: 3, countered: 4, complete: 5, declined: 6, cancelled: 7 }
  function sortOrders(list: any[]) {
    return [...list].sort((a, b) => {
      const ap = STATUS_ORDER[a.status] ?? 8, bp = STATUS_ORDER[b.status] ?? 8
      if (ap !== bp) return ap - bp
      if (a.event_date && b.event_date) return a.event_date.localeCompare(b.event_date)
      return a.event_date ? -1 : b.event_date ? 1 : 0
    })
  }

  const firstName = customer?.full_name?.split(' ')[0] || 'there'
  const pending = orders.filter(o => o.status === 'pending')
  const confirmed = orders.filter(o => o.status === 'confirmed')
  const upcomingOrder = orders
    .filter(o => (o.status === 'confirmed' || o.status === 'in_progress' || o.status === 'ready') && getDaysUntil(o.event_date) >= 0 && getDaysUntil(o.event_date) <= 30)
    .sort((a, b) => getDaysUntil(a.event_date) - getDaysUntil(b.event_date))[0] || null

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#f5f0eb' }}>
      <Navbar />

      {/* Payment Modal */}
      {paymentOrder && (
        <PaymentModal
          orderId={paymentOrder.id}
          type={paymentType}
          amount={paymentType === 'deposit' ? Math.round(paymentOrder.budget * (paymentOrder.budget >= 750 ? 60 : 50)) : (paymentOrder.amount_remainder || Math.round(paymentOrder.budget * 50))}
          eventType={paymentOrder.event_type}
          bakerName={paymentOrder.bakers?.business_name || 'Baker'}
          onClose={() => setPaymentOrder(null)}
          onSuccess={onPaymentSuccess}
        />
      )}

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
            <p className="font-semibold text-sm">Order submitted!</p>
            <p className="text-xs mt-0.5" style={{ color: '#e0c9b0' }}>Your baker will review your request soon.</p>
          </div>
          <button onClick={() => setShowSuccessToast(false)} className="ml-auto text-xs opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Cancel Order Modal */}
      {cancelOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-lg mb-1" style={{ color: '#2d1a0e' }}>Cancel Order</h3>
            <p className="text-xs mb-4" style={{ color: '#5c3d2e' }}>{cancelOrder.bakers?.business_name} · {cancelOrder.event_type}</p>
            {cancelOrder.status === 'confirmed' && cancelOrder.deposit_paid_at && (() => {
              const days = getDaysUntil(cancelOrder.event_date)
              return (
                <div className="mb-4 p-4 rounded-xl" style={{ backgroundColor: '#fef9c3', border: '1px solid #fde68a' }}>
                  {cancelOrder.bakers?.cancellation_policy && (
                    <p className="text-xs mb-2 leading-relaxed" style={{ color: '#92400e' }}><span className="font-bold">Baker policy:</span> {cancelOrder.bakers.cancellation_policy}</p>
                  )}
                  <p className="text-xs font-bold mb-1" style={{ color: '#92400e' }}>Whiskly refund policy:</p>
                  <p className="text-xs" style={{ color: '#92400e' }}>
                    {days >= 14 ? '✓ Full refund — your event is 14+ days away.' : days >= 7 ? '⚠ 50% refund — your event is 7–13 days away.' : '✕ No refund — your event is less than 7 days away.'}
                  </p>
                </div>
              )
            })()}
            {cancelOrder.status === 'pending' && (
              <div className="mb-4 px-4 py-3 rounded-xl" style={{ backgroundColor: '#dcfce7', border: '1px solid #bbf7d0' }}>
                <p className="text-xs font-semibold" style={{ color: '#166534' }}>Free cancellation — no deposit has been charged for this order.</p>
              </div>
            )}
            <div className="mb-3">
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>Reason <span style={{ color: '#dc2626' }}>*</span></label>
              <select value={cancelReason} onChange={e => setCancelReason(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border text-sm" style={{ borderColor: '#e0d5cc', color: cancelReason ? '#2d1a0e' : '#9c7b6b', backgroundColor: '#faf8f6' }}>
                <option value="">Select a reason</option>
                <option value="Change of plans">Change of plans</option>
                <option value="Found another baker">Found another baker</option>
                <option value="Event cancelled">Event cancelled</option>
                <option value="Budget changed">Budget changed</option>
                <option value="Baker hasn't responded">Baker hasn&apos;t responded</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="mb-5">
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>Additional details (optional)</label>
              <textarea value={cancelDescription} onChange={e => setCancelDescription(e.target.value)} rows={3} placeholder="Any additional context..." className="w-full px-3 py-2.5 rounded-lg border text-sm resize-none" style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setCancelOrder(null); setCancelReason(''); setCancelDescription('') }} className="flex-1 py-3 rounded-xl border text-sm font-semibold" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>Go Back</button>
              <button onClick={handleCustomerCancelOrder} disabled={!cancelReason || cancellingOrder} className="flex-1 py-3 rounded-xl text-white text-sm font-semibold" style={{ backgroundColor: '#dc2626', opacity: (!cancelReason || cancellingOrder) ? 0.5 : 1 }}>
                {cancellingOrder ? 'Cancelling...' : 'Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Non-Receipt Modal */}
      {nonReceiptOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-lg mb-1" style={{ color: '#2d1a0e' }}>Report Non-Receipt</h3>
            <p className="text-sm mb-4" style={{ color: '#5c3d2e' }}>Please confirm you did not receive your order from <strong>{nonReceiptOrder.bakers?.business_name}</strong>. This will open a review with our team.</p>
            <p className="text-xs font-semibold mb-2" style={{ color: '#2d1a0e' }}>Type exactly: <span style={{ color: '#dc2626' }}>I did not receive my order</span></p>
            <input
              type="text"
              value={nonReceiptInput}
              onChange={e => setNonReceiptInput(e.target.value)}
              placeholder="I did not receive my order"
              className="w-full px-3 py-2.5 rounded-xl border text-sm mb-4"
              style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }}
            />
            <div className="flex gap-3">
              <button onClick={() => { setNonReceiptOrder(null); setNonReceiptInput('') }} className="flex-1 py-2.5 rounded-xl border text-sm font-semibold" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>Cancel</button>
              <button onClick={handleNonReceiptConfirm} disabled={nonReceiptInput !== 'I did not receive my order' || processingNonReceipt} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ backgroundColor: '#dc2626', opacity: (nonReceiptInput !== 'I did not receive my order' || processingNonReceipt) ? 0.5 : 1 }}>
                {processingNonReceipt ? 'Submitting...' : 'Confirm Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tip Modal */}
      {tipOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            {tipSuccess ? (
              <div className="text-center py-4">
                <p className="text-3xl mb-3">✓</p>
                <h3 className="font-bold text-lg mb-1" style={{ color: '#2d1a0e' }}>Tip sent!</h3>
                <p className="text-sm mb-5" style={{ color: '#5c3d2e' }}>Your ${(getTipAmountCents(tipOrder) / 100).toFixed(2)} tip to <strong>{tipOrder.bakers?.business_name}</strong> has been sent. Thank you for supporting a small business!</p>
                <button onClick={() => { setTipOrder(null); setTipSuccess(false); setTipSelection('15'); setTipCustomAmount('') }} className="w-full py-2.5 rounded-xl text-white text-sm font-semibold" style={{ backgroundColor: '#2d1a0e' }}>Done</button>
              </div>
            ) : (
              <>
                <h3 className="font-bold text-lg mb-1" style={{ color: '#2d1a0e' }}>Leave a tip</h3>
                <p className="text-sm mb-4" style={{ color: '#5c3d2e' }}>Tips go 100% to <strong>{tipOrder.bakers?.business_name}</strong>. Whiskly takes nothing.</p>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {(['10','15','20'] as const).map(pct => {
                    const cents = Math.round((tipOrder.budget || 0) * parseInt(pct) / 100 * 100)
                    const dollars = (cents / 100).toFixed(2)
                    return (
                      <button key={pct} onClick={() => setTipSelection(pct)} className="py-2 rounded-xl text-xs font-semibold text-center border transition-all" style={{ borderColor: tipSelection === pct ? '#2d1a0e' : '#e0d5cc', backgroundColor: tipSelection === pct ? '#2d1a0e' : 'white', color: tipSelection === pct ? 'white' : '#2d1a0e' }}>
                        <div>{pct}%</div>
                        <div className="opacity-75">${dollars}</div>
                      </button>
                    )
                  })}
                  <button onClick={() => setTipSelection('custom')} className="py-2 rounded-xl text-xs font-semibold text-center border transition-all" style={{ borderColor: tipSelection === 'custom' ? '#2d1a0e' : '#e0d5cc', backgroundColor: tipSelection === 'custom' ? '#2d1a0e' : 'white', color: tipSelection === 'custom' ? 'white' : '#2d1a0e' }}>Custom</button>
                </div>
                {tipSelection === 'custom' && (
                  <div className="mb-4 flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: '#2d1a0e' }}>$</span>
                    <input type="number" value={tipCustomAmount} onChange={e => setTipCustomAmount(e.target.value)} placeholder="0.00" min="1" step="0.01" className="flex-1 px-3 py-2 rounded-xl border text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
                  </div>
                )}
                {tipError && <p className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>{tipError}</p>}
                <div className="flex gap-3">
                  <button onClick={() => { setTipOrder(null); setTipSuccess(false); setTipError(null); setTipSelection('15'); setTipCustomAmount('') }} className="flex-1 py-2.5 rounded-xl border text-sm font-semibold" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>Cancel</button>
                  <button onClick={handleSendTip} disabled={sendingTip || getTipAmountCents(tipOrder) < 100} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ backgroundColor: '#2d1a0e', opacity: (sendingTip || getTipAmountCents(tipOrder) < 100) ? 0.5 : 1 }}>
                    {sendingTip ? 'Sending...' : 'Send Tip — $' + (getTipAmountCents(tipOrder) / 100).toFixed(2)}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Block Baker Modal */}
      {blockBakerOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-lg mb-2" style={{ color: '#2d1a0e' }}>Block {blockBakerOrder.bakers?.business_name}?</h3>
            <p className="text-sm mb-5" style={{ color: '#5c3d2e' }}>You won't see them in search results and they won't be able to send you messages. This can be reversed by contacting Whiskly support.</p>
            <div className="flex gap-3">
              <button onClick={() => setBlockBakerOrder(null)} className="flex-1 py-2.5 rounded-xl border text-sm font-semibold" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>Cancel</button>
              <button onClick={handleBlockBaker} disabled={blockingBaker} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ backgroundColor: '#dc2626', opacity: blockingBaker ? 0.5 : 1 }}>
                {blockingBaker ? 'Blocking...' : 'Block Baker'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Plan Choice Modal */}
      {planChoiceOrder && (() => {
        const price = planChoiceOrder.confirmed_price != null ? planChoiceOrder.confirmed_price / 100 : planChoiceOrder.budget
        const eventDate = planChoiceOrder.event_date ? new Date(planChoiceOrder.event_date + 'T00:00:00') : null
        const midDate = eventDate ? new Date((Date.now() + eventDate.getTime()) / 2) : null
        const p3Date = eventDate ? new Date(eventDate.getTime() - 3 * 24 * 60 * 60 * 1000) : null
        const fmtDate = (d: Date | null) => d ? d.toLocaleDateString([], { month: 'long', day: 'numeric' }) : '—'
        const p1 = (price * 0.33).toFixed(2)
        const p2 = (price * 0.33).toFixed(2)
        const p3 = (price - price * 0.33 - price * 0.33).toFixed(2)
        const deposit = (price * 0.33).toFixed(2)
        const remainder = (price - price * 0.33).toFixed(2)
        const isHighValue = price >= 750
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="font-bold text-lg mb-1" style={{ color: '#2d1a0e' }}>Choose how you'd like to pay</h3>
              <p className="text-sm mb-5" style={{ color: '#5c3d2e' }}>Your order has been confirmed at <strong>${price.toFixed(2)}</strong>. Select a payment option to continue.</p>
              <div className="flex flex-col gap-3 mb-5">
                {/* Standard option */}
                <button
                  onClick={() => setPlanChoiceSelection('standard')}
                  className="w-full text-left p-4 rounded-xl border-2 transition-all"
                  style={{ borderColor: planChoiceSelection === 'standard' ? '#2d1a0e' : '#e0d5cc', backgroundColor: planChoiceSelection === 'standard' ? '#f5f0eb' : 'white' }}
                >
                  <p className="font-semibold text-sm mb-1" style={{ color: '#2d1a0e' }}>Standard — two payments</p>
                  <p className="text-xs" style={{ color: '#5c3d2e' }}>Pay <strong>${deposit}</strong> today as deposit, <strong>${remainder}</strong> due 3 days before your event on {fmtDate(p3Date)}.</p>
                </button>
                {/* Installments option */}
                <button
                  onClick={() => setPlanChoiceSelection('installments')}
                  className="w-full text-left p-4 rounded-xl border-2 transition-all relative"
                  style={{ borderColor: planChoiceSelection === 'installments' ? '#2d1a0e' : '#e0d5cc', backgroundColor: planChoiceSelection === 'installments' ? '#f5f0eb' : 'white' }}
                >
                  {isHighValue && <span className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>Recommended for large orders</span>}
                  <p className="font-semibold text-sm mb-1" style={{ color: '#2d1a0e' }}>Pay in 3 installments</p>
                  <p className="text-xs" style={{ color: '#5c3d2e' }}>Pay <strong>${p1}</strong> today, <strong>${p2}</strong> on {fmtDate(midDate)}, <strong>${p3}</strong> on {fmtDate(p3Date)} (3 days before event).</p>
                </button>
              </div>
              <button
                onClick={submitPlanChoice}
                disabled={submittingPlanChoice}
                className="w-full py-3 rounded-xl text-white text-sm font-semibold"
                style={{ backgroundColor: '#2d1a0e', opacity: submittingPlanChoice ? 0.6 : 1 }}
              >{submittingPlanChoice ? 'Saving…' : 'Confirm and Pay Deposit'}</button>
            </div>
          </div>
        )
      })()}

      {/* Size Reduction Request Modal */}
      {sizeReductionOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-lg mb-1" style={{ color: '#2d1a0e' }}>Request Size Reduction</h3>
            <p className="text-sm mb-4" style={{ color: '#5c3d2e' }}>
              Current order: <strong>{sizeReductionOrder.servings} servings</strong> — {sizeReductionOrder.event_type}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1" style={{ color: '#2d1a0e' }}>Requested serving count</label>
              <input
                type="number"
                min={1}
                max={(parseInt(sizeReductionOrder.servings) || 1) - 1}
                value={sizeReductionServings}
                onChange={e => setSizeReductionServings(e.target.value)}
                placeholder="Enter new serving count"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                style={{ borderColor: '#e0d5cc', color: '#2d1a0e' }}
              />
              {sizeReductionServings && parseInt(sizeReductionServings) >= (parseInt(sizeReductionOrder.servings) || 1) && (
                <p className="text-xs mt-1" style={{ color: '#dc2626' }}>Must be less than current serving count ({sizeReductionOrder.servings})</p>
              )}
            </div>
            {sizeReductionServings && parseInt(sizeReductionServings) > 0 && parseInt(sizeReductionServings) < (parseInt(sizeReductionOrder.servings) || 1) && (
              <div className="rounded-lg p-3 mb-4 text-sm" style={{ backgroundColor: '#faf8f6', borderLeft: '3px solid #8B4513' }}>
                <div style={{ color: '#5c3d2e' }}>Your baker will review your request and confirm the adjusted price if approved.</div>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setSizeReductionOrder(null); setSizeReductionServings('') }}
                className="flex-1 py-2 rounded-lg text-sm font-semibold border"
                style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}
              >Cancel</button>
              <button
                onClick={submitSizeReduction}
                disabled={
                  submittingSizeReduction ||
                  !sizeReductionServings ||
                  parseInt(sizeReductionServings) <= 0 ||
                  parseInt(sizeReductionServings) >= (parseInt(sizeReductionOrder.servings) || 1)
                }
                className="flex-1 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ backgroundColor: '#5c3d2e', opacity: submittingSizeReduction ? 0.6 : 1 }}
              >{submittingSizeReduction ? 'Submitting…' : 'Submit Request'}</button>
            </div>
          </div>
        </div>
      )}

      {/* File Dispute Modal */}
      {disputeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-lg mb-1" style={{ color: '#2d1a0e' }}>File a Dispute</h3>
            <p className="text-xs mb-4" style={{ color: '#5c3d2e' }}>{disputeOrder.bakers?.business_name} · {disputeOrder.event_type}</p>
            <div className="mb-3">
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>Reason <span style={{ color: '#dc2626' }}>*</span></label>
              <select value={disputeReason} onChange={e => setDisputeReason(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border text-sm" style={{ borderColor: '#e0d5cc', color: disputeReason ? '#2d1a0e' : '#9c7b6b', backgroundColor: '#faf8f6' }}>
                <option value="">Select a reason</option>
                <option value="Order never delivered">Order never delivered</option>
                <option value="Wrong item received">Wrong item received</option>
                <option value="Quality significantly different from what was agreed">Quality significantly different from what was agreed</option>
                <option value="Baker cancelled after I paid">Baker cancelled after I paid</option>
                <option value="Charged incorrectly">Charged incorrectly</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>Description <span style={{ color: '#dc2626' }}>*</span> <span className="font-normal" style={{ color: '#9c7b6b' }}>(min 20 characters)</span></label>
              <textarea value={disputeDescription} onChange={e => setDisputeDescription(e.target.value)} rows={4} placeholder="Describe the issue in detail..." className="w-full px-3 py-2.5 rounded-lg border text-sm resize-none" style={{ borderColor: disputeDescription.trim().length > 0 && disputeDescription.trim().length < 20 ? '#dc2626' : '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
              {disputeDescription.trim().length > 0 && disputeDescription.trim().length < 20 && (
                <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{20 - disputeDescription.trim().length} more characters needed</p>
              )}
            </div>
            <div className="mb-4 px-4 py-3 rounded-xl" style={{ backgroundColor: '#fef3c7', border: '1px solid #fde68a' }}>
              <p className="text-xs font-bold" style={{ color: '#92400e' }}>This order will be locked</p>
              <p className="text-xs mt-0.5" style={{ color: '#92400e' }}>Filing a dispute locks this order. Neither party can change its status until our team reviews it within 48 hours.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setDisputeOrder(null); setDisputeReason(''); setDisputeDescription('') }} className="flex-1 py-3 rounded-xl border text-sm font-semibold" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>Cancel</button>
              <button onClick={handleCustomerFileDispute} disabled={!disputeReason || disputeDescription.trim().length < 20 || filingDispute} className="flex-1 py-3 rounded-xl text-white text-sm font-semibold" style={{ backgroundColor: '#dc2626', opacity: (!disputeReason || disputeDescription.trim().length < 20 || filingDispute) ? 0.5 : 1 }}>
                {filingDispute ? 'Filing...' : 'File Dispute'}
              </button>
            </div>
          </div>
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

        {(() => {
          const attentionItems: { orderId: string; label: string; name: string; eventType: string; eventDate: string }[] = []
          for (const o of orders) {
            if (o.status === 'confirmed' && !o.deposit_paid_at)
              attentionItems.push({ orderId: o.id, label: 'Deposit required', name: o.bakers?.business_name || '', eventType: o.event_type, eventDate: o.event_date })
            if (o.status === 'ready' && o.fulfillment_type === 'pickup')
              attentionItems.push({ orderId: o.id, label: 'Ready for pickup', name: o.bakers?.business_name || '', eventType: o.event_type, eventDate: o.event_date })
            if (o.counter_status === 'pending')
              attentionItems.push({ orderId: o.id, label: 'Counter offer to review', name: o.bakers?.business_name || '', eventType: o.event_type, eventDate: o.event_date })
            if (o.size_reduction_status === 'approved')
              attentionItems.push({ orderId: o.id, label: 'Size reduction approved — review new price', name: o.bakers?.business_name || '', eventType: o.event_type, eventDate: o.event_date })
          }
          if (attentionItems.length === 0) return null
          return (
            <div className="mb-6 rounded-2xl overflow-hidden shadow-sm" style={{ border: '2px solid #dc2626' }}>
              <button onClick={() => setNeedsAttentionCollapsed(v => !v)} className="w-full flex items-center justify-between px-5 py-3" style={{ backgroundColor: '#fef2f2' }}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold" style={{ color: '#991b1b' }}>Needs Attention</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#dc2626' }}>{attentionItems.length}</span>
                </div>
                <span className="text-xs" style={{ color: '#991b1b' }}>{needsAttentionCollapsed ? '▼' : '▲'}</span>
              </button>
              {!needsAttentionCollapsed && (
                <div className="flex flex-col divide-y" style={{ backgroundColor: 'white', borderColor: '#fee2e2' }}>
                  {attentionItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-5 py-3 gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: '#991b1b' }}>{item.label}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>{item.name} · {item.eventType} · {item.eventDate}</p>
                      </div>
                      <button onClick={() => { setActiveTab('orders'); document.getElementById('order-' + item.orderId)?.scrollIntoView({ behavior: 'smooth' }) }} className="flex-shrink-0 px-4 py-2 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: '#dc2626' }}>View Order</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })()}

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
            {orders.some(o => o.counter_status === 'pending') && (
              <div className="rounded-2xl px-5 py-4 flex items-center gap-3" style={{ backgroundColor: '#fffbeb', border: '2px solid #f59e0b' }}>
                <span className="text-xl flex-shrink-0">💬</span>
                <div>
                  <p className="text-sm font-bold" style={{ color: '#92400e' }}>You have a counter offer waiting</p>
                  <p className="text-xs mt-0.5" style={{ color: '#78350f' }}>A baker has responded with a new price. Review and accept or decline below.</p>
                </div>
              </div>
            )}
            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl p-16 shadow-sm text-center">
                <p className="text-5xl mb-4">🎂</p>
                <p className="font-bold text-lg mb-2" style={{ color: '#2d1a0e' }}>No orders yet</p>
                <p className="text-sm mb-6" style={{ color: '#5c3d2e' }}>Find a baker and start your first order!</p>
                <Link href="/bakers" className="px-6 py-3 rounded-xl text-white font-semibold text-sm inline-block" style={{ backgroundColor: '#2d1a0e' }}>Browse Bakers</Link>
              </div>
            ) : sortOrders(orders).map(order => {
              const daysUntil = getDaysUntil(order.event_date)
              const progressStep = getProgressStep(order)
              const steps = ['Request Sent', 'Baker Accepted', 'Awaiting Deposit', 'In Progress', 'Ready', 'Complete']
              return (
                <div key={order.id} id={'order-' + order.id} className="bg-white rounded-2xl p-6 shadow-sm">
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
                        backgroundColor: order.status === 'confirmed' ? '#dcfce7' : order.status === 'declined' ? '#fee2e2' : order.status === 'ready' ? '#f3e8ff' : order.status === 'in_progress' ? '#dbeafe' : order.status === 'countered' ? '#fef3c7' : '#fef9c3',
                        color: order.status === 'confirmed' ? '#166534' : order.status === 'declined' ? '#991b1b' : order.status === 'ready' ? '#6b21a8' : order.status === 'in_progress' ? '#1e40af' : order.status === 'countered' ? '#92400e' : '#854d0e'
                      }}>
                        {order.status === 'confirmed' ? 'Confirmed' : order.status === 'declined' ? 'Declined' : order.status === 'in_progress' ? 'In Progress' : order.status === 'ready' ? 'Ready!' : order.status === 'complete' ? 'Complete' : order.status === 'countered' ? 'Counter Offer' : 'Pending'}
                      </span>
                      {daysUntil > 0 && order.status !== 'declined' && (
                        <p className="text-xs mt-1 font-semibold" style={{ color: daysUntil <= 7 ? '#dc2626' : '#5c3d2e' }}>
                          {daysUntil === 1 ? 'Tomorrow!' : daysUntil + ' days away'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Counter offer card */}
                  {order.status === 'countered' && order.counter_status === 'pending' && (
                    <div className="mb-4 rounded-xl p-4" style={{ backgroundColor: '#fffbeb', border: '2px solid #f59e0b' }}>
                      <p className="text-sm font-bold mb-1" style={{ color: '#92400e' }}>Counter Offer from {order.bakers?.business_name}</p>
                      <div className="flex items-center gap-4 mb-3">
                        <div>
                          <p className="text-xs font-semibold mb-0.5" style={{ color: '#5c3d2e' }}>Counter Price</p>
                          <p className="text-lg font-bold" style={{ color: '#2d1a0e' }}>${order.counter_price}</p>
                        </div>
                        <div className="text-sm" style={{ color: '#9c7b6b' }}>vs.</div>
                        <div>
                          <p className="text-xs font-semibold mb-0.5" style={{ color: '#5c3d2e' }}>Your Budget</p>
                          <p className="text-lg font-bold" style={{ color: '#5c3d2e' }}>${order.budget}</p>
                        </div>
                      </div>
                      {order.counter_message && (
                        <p className="text-sm mb-3 italic leading-relaxed" style={{ color: '#78350f' }}>"{order.counter_message}"</p>
                      )}
                      <div className="flex gap-2">
                        <button onClick={() => acceptCounterOffer(order)}
                          className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold"
                          style={{ backgroundColor: '#2d1a0e' }}>
                          Accept ${order.counter_price}
                        </button>
                        <button onClick={() => declineCounterOffer(order)}
                          className="flex-1 py-2.5 rounded-xl text-sm font-bold border"
                          style={{ borderColor: '#fca5a5', color: '#991b1b', backgroundColor: 'white' }}>
                          Decline
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Deposit payment prompt */}
                  {needsDeposit(order) && (
                    <div className="mb-2 rounded-xl p-4 flex items-center justify-between gap-4" style={{ backgroundColor: '#fef9c3', border: '1px solid #fde68a' }}>
                      <div>
                        <p className="text-sm font-bold" style={{ color: '#854d0e' }}>Deposit required to confirm your order</p>
                        <p className="text-xs mt-0.5" style={{ color: '#92400e' }}>
                          Pay {order.budget >= 750 ? '60' : '50'}% now (${((order.budget * (order.budget >= 750 ? 0.60 : 0.50))).toFixed(2)}) — remainder due 3 days before your event.
                        </p>
                      </div>
                      <button onClick={() => payDeposit(order)}
                        className="flex-shrink-0 px-5 py-2.5 rounded-xl text-white text-sm font-bold"
                        style={{ backgroundColor: '#2d1a0e' }}>
                        Pay Deposit
                      </button>
                    </div>
                  )}
                  {needsDeposit(order) && (
                    <p className="text-xs leading-relaxed mb-4" style={{ color: '#9c7b6b' }}>
                      Heads up on cancellations: If you cancel more than 7 days before your event, your deposit is non-refundable but the remaining balance won't be charged. If you cancel within 7 days, the full order may be charged. Full details in our <a href="/terms" className="underline">Terms of Service</a>.
                    </p>
                  )}

                  {/* Deposit paid confirmation */}
                  {order.deposit_paid_at && !order.remainder_paid_at && (
                    <div className="mb-4 rounded-xl px-4 py-3 flex items-center justify-between gap-3" style={{ backgroundColor: '#dcfce7', border: '1px solid #bbf7d0' }}>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: '#166534' }}>✓ Deposit paid</p>
                        <p className="text-xs mt-0.5" style={{ color: '#166534' }}>
                          Remaining balance of ${order.amount_remainder ? (order.amount_remainder / 100).toFixed(2) : (order.budget / 2).toFixed(2)} due 3 days before your event.
                        </p>
                      </div>
                      {needsRemainder(order) && (
                        <button onClick={() => openPayment(order, 'remainder')}
                          className="flex-shrink-0 px-4 py-2 rounded-xl text-white text-xs font-bold"
                          style={{ backgroundColor: '#166534' }}>
                          Pay Balance
                        </button>
                      )}
                    </div>
                  )}

                  {/* Fully paid */}
                  {order.deposit_paid_at && order.remainder_paid_at && (
                    <div className="mb-4 rounded-xl px-4 py-3" style={{ backgroundColor: '#dcfce7', border: '1px solid #bbf7d0' }}>
                      <p className="text-xs font-semibold" style={{ color: '#166534' }}>✓ Fully paid — enjoy your event!</p>
                    </div>
                  )}

                  {order.status === 'ready' && (
                    <div className="mb-4 rounded-xl p-4" style={{ backgroundColor: '#f3e8ff' }}>
                      <p className="text-sm font-bold mb-1" style={{ color: '#6b21a8' }}>Your order is ready!</p>
                      {order.fulfillment_type === 'pickup' ? (
                        <div>
                          <p className="text-xs mb-2" style={{ color: '#6b21a8' }}>Pickup address:</p>
                          {order.bakers?.pickup_address
                            ? <a href={'https://maps.google.com/?q=' + encodeURIComponent(order.bakers.pickup_address)} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold underline" style={{ color: '#2d1a0e' }}>📍 {order.bakers.pickup_address}</a>
                            : order.bakers?.city
                              ? <p className="text-sm font-semibold" style={{ color: '#2d1a0e' }}>📍 {order.bakers.city}, {order.bakers.state}{order.bakers.pickup_zip ? ' ' + order.bakers.pickup_zip : ''} — contact baker for exact address</p>
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
                      <img src={order.delivery_proof_url} alt="Delivery proof" className="w-full object-contain" style={{ maxHeight: '320px', backgroundColor: '#faf8f6' }} />
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
                      <img src={order.handoff_photo_url} alt="Your order" className="w-full object-contain" style={{ maxHeight: '288px', backgroundColor: '#faf8f6' }} />
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

                  {order.status === 'complete' && order.tip_paid_at && (
                    <div className="mb-4 rounded-xl px-4 py-3 flex items-center gap-3" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                      <span className="text-xs font-semibold" style={{ color: '#166534' }}>Tip sent ✓ — ${(order.tip_amount / 100).toFixed(2)} to {order.bakers?.business_name}</span>
                    </div>
                  )}

                  {order.status === 'complete' && !order.tip_paid_at && !order.tip_amount && !dismissedTips.includes(order.id) && (
                    <div className="mb-4 rounded-xl px-4 py-3 flex items-center justify-between gap-3" style={{ backgroundColor: '#f5f0eb', border: '1px solid #e0d5cc' }}>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: '#2d1a0e' }}>Leave a tip?</p>
                        <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>Tips go 100% to {order.bakers?.business_name}. Whiskly takes nothing.</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => { setTipOrder(order); setTipSuccess(false); setTipError(null); setTipSelection('15'); setTipCustomAmount('') }} className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold" style={{ backgroundColor: '#2d1a0e' }}>Tip</button>
                        <button onClick={() => dismissTip(order.id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>No thanks</button>
                      </div>
                    </div>
                  )}

                  {order.status === 'complete' && !order.delivery_proof_url && !order.is_disputed && !order.customer_confirmed_nonreceipt && (
                    <div className="mb-4 rounded-xl px-4 py-3 flex items-center justify-between gap-3" style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca' }}>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: '#991b1b' }}>Did you not receive your order?</p>
                        <p className="text-xs mt-0.5" style={{ color: '#7f1d1d' }}>If your order was never delivered or picked up, let us know.</p>
                      </div>
                      <button onClick={() => { setNonReceiptOrder(order); setNonReceiptInput('') }} className="flex-shrink-0 px-4 py-2 rounded-lg text-white text-xs font-semibold" style={{ backgroundColor: '#dc2626' }}>Report</button>
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    <Link href={'/bakers/' + order.baker_id} className="px-4 py-2 rounded-lg text-xs font-semibold border" style={{ borderColor: '#2d1a0e', color: '#2d1a0e' }}>View Baker</Link>
                    <button onClick={() => openThread(order.id)} className="px-4 py-2 rounded-lg text-xs font-semibold border" style={{ borderColor: '#5c3d2e', color: '#5c3d2e' }}>Message</button>
                    {order.status === 'ready' && order.fulfillment_type === 'delivery' && (
                      <button onClick={() => markReceived(order.id)} className="px-4 py-2 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: '#166534' }}>Mark as Received</button>
                    )}
                    {order.status === 'ready' && order.fulfillment_type === 'pickup' && order.handoff_photo_url && !order.pickup_confirmed_at && (
                      <button onClick={() => confirmPickup(order)} className="px-4 py-2 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: '#166634' }}>Confirm Pickup</button>
                    )}
                    {order.status === 'declined' && (
                      <Link href="/bakers" className="px-4 py-2 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: '#2d1a0e' }}>Find Another Baker</Link>
                    )}
                    {order.status === 'complete' && (
                      <Link href={'/bakers/' + order.baker_id + '?reorder=' + order.id} className="px-4 py-2 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: '#8B4513' }}>Reorder</Link>
                    )}
                    {(order.status === 'pending' || order.status === 'confirmed') && !order.is_disputed && (
                      <button onClick={() => { setCancelOrder(order); setCancelReason(''); setCancelDescription('') }} className="px-4 py-2 rounded-lg text-xs font-semibold border" style={{ borderColor: '#dc2626', color: '#dc2626' }}>Cancel Order</button>
                    )}
                    {/* Size reduction button */}
                    {['confirmed', 'in_progress'].includes(order.status) && !order.size_reduction_requested && !order.remainder_paid_at && (() => {
                      const daysUntil = getDaysUntil(order.event_date)
                      if (daysUntil < 0) return null
                      return (
                        <button
                          onClick={() => { if (daysUntil > 7) { setSizeReductionOrder(order); setSizeReductionServings('') } }}
                          disabled={daysUntil <= 7}
                          title={daysUntil <= 7 ? 'Size reductions are not available within 7 days of your event. Contact your baker directly.' : undefined}
                          className="px-4 py-2 rounded-lg text-xs font-semibold border"
                          style={{ borderColor: daysUntil <= 7 ? '#e0d5cc' : '#5c3d2e', color: daysUntil <= 7 ? '#9c7b6b' : '#5c3d2e', opacity: daysUntil <= 7 ? 0.6 : 1 }}>
                          Request Size Reduction
                        </button>
                      )
                    })()}
                    {order.size_reduction_requested && order.size_reduction_status === 'pending' && (
                      <span className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: '#fef9c3', color: '#854d0e' }}>Size reduction requested — awaiting baker response</span>
                    )}
                    {order.size_reduction_status === 'approved' && (
                      <span className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>✓ Size reduction approved — new price confirmed by baker</span>
                    )}
                    {order.size_reduction_status === 'declined' && (
                      <span className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>Size reduction request was declined — original order stands</span>
                    )}
                    {order.deposit_paid_at && ['confirmed','in_progress','ready','complete'].includes(order.status) && !order.is_disputed && (
                      <button onClick={() => { setDisputeOrder(order); setDisputeReason(''); setDisputeDescription('') }} className="px-4 py-2 rounded-lg text-xs font-semibold border" style={{ borderColor: '#92400e', color: '#92400e' }}>File Dispute</button>
                    )}
                    <div className="relative">
                      <button onClick={() => setShowDotsOrderId(v => v === order.id ? null : order.id)} className="px-3 py-2 rounded-lg text-xs font-semibold border" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>⋯</button>
                      {showDotsOrderId === order.id && (
                        <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border z-30 min-w-36 overflow-hidden" style={{ borderColor: '#e0d5cc' }}>
                          <button onClick={() => { setShowDotsOrderId(null); setBlockBakerOrder(order) }} className="w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-[#faf8f6]" style={{ color: '#dc2626' }}>Block Baker</button>
                        </div>
                      )}
                    </div>
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
  <button key={conv.thread_key} onClick={() => { setActiveOrderId(conv.thread_key); loadThread(conv.order_id, conv.baker_id) }}
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
                    {offPlatformWarning && (
                      <div className="px-5 pt-3 pb-0">
                        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl border text-xs" style={{ borderColor: '#fbbf24', backgroundColor: '#fffbeb', color: '#92400e' }}>
                          <span className="flex-shrink-0 mt-0.5">⚠</span>
                          <span className="flex-1">Your message may contain {offPlatformWarning}. For your protection, please keep all communication and payments on Whiskly.</span>
                          <button onClick={() => setOffPlatformWarning(null)} className="flex-shrink-0 font-bold ml-1" style={{ color: '#92400e' }}>✕</button>
                        </div>
                      </div>
                    )}
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
            {customer?.is_trusted_member && (
              <div className="rounded-2xl p-5 flex items-start gap-4" style={{ backgroundColor: '#1e3a5f', color: 'white' }}>
                <div className="text-3xl flex-shrink-0">🛡️</div>
                <div>
                  <p className="font-bold text-base">Trusted Member</p>
                  <p className="text-sm mt-0.5 opacity-90">You've earned the Trusted Member badge — awarded to customers with a strong order history and excellent standing.</p>
                  {customer?.trusted_member_since && (
                    <p className="text-xs mt-2 opacity-70">Member since {new Date(customer.trusted_member_since).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                  )}
                </div>
              </div>
            )}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-6" style={{ color: '#2d1a0e' }}>Account Info</h2>
              <div className="flex flex-col gap-4">
                {[['Full Name', customer?.full_name], ['Email', customer?.email], ['Location', customer?.city && customer?.state ? customer.city + ', ' + customer.state : 'Not set']].map(([label, val]) => (
                  <div key={label as string}>
                    <label className="block text-sm font-semibold mb-1" style={{ color: '#2d1a0e' }}>{label}</label>
                    <p className="px-4 py-3 rounded-lg border text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }}>{val || '—'}</p>
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: '#2d1a0e' }}>Phone Number</label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={phoneValue}
                      onChange={e => { setPhoneValue(e.target.value); setPhoneSaved(false) }}
                      placeholder="e.g. (555) 123-4567"
                      className="flex-1 px-4 py-3 rounded-lg border text-sm"
                      style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }}
                    />
                    <button
                      onClick={async () => {
                        if (!customer) return
                        setSavingPhone(true)
                        await supabase.from('customers').update({ phone: phoneValue }).eq('id', customer.id)
                        setSavingPhone(false)
                        setPhoneSaved(true)
                        setTimeout(() => setPhoneSaved(false), 3000)
                      }}
                      disabled={savingPhone}
                      className="px-4 py-3 rounded-lg text-sm font-semibold text-white flex-shrink-0"
                      style={{ backgroundColor: '#2d1a0e', opacity: savingPhone ? 0.6 : 1 }}
                    >{savingPhone ? 'Saving...' : phoneSaved ? 'Saved ✓' : 'Save'}</button>
                  </div>
                </div>
                <div className="pt-2 flex items-center justify-between">
  <p className="text-xs" style={{ color: '#5c3d2e' }}>Want to sell on Whiskly? <Link href="/join" className="font-semibold underline" style={{ color: '#2d1a0e' }}>Apply as a Baker</Link></p>
  <div className="flex gap-2">
    <Link href="/account/settings" className="px-4 py-2 rounded-lg text-xs font-semibold border" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>Account Settings</Link>
    <button onClick={handleSignOut} className="px-4 py-2 rounded-lg text-xs font-semibold border" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>Sign Out</button>
  </div>
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
        <p className="text-sm" style={{ color: '#e0d5cc' }}>© 2026 Whiskly. All rights reserved. · <a href="mailto:support@whiskly.co" className="underline">support@whiskly.co</a></p>
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