'use client'

import { useState, useEffect, useRef } from 'react'
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
  const [unreadCount, setUnreadCount] = useState(0)

  const [deliveryModalOrder, setDeliveryModalOrder] = useState<any>(null)
  const [deliveryPhoto, setDeliveryPhoto] = useState<File | null>(null)
  const [deliveryPhotoPreview, setDeliveryPhotoPreview] = useState<string | null>(null)
  const [careInstructions, setCareInstructions] = useState('')
  const [submittingDelivery, setSubmittingDelivery] = useState(false)
  const deliveryPhotoRef = useRef<HTMLInputElement>(null)

  const [businessName, setBusinessName] = useState('')
  const [bio, setBio] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [startingPrice, setStartingPrice] = useState('')
  const [leadTime, setLeadTime] = useState('7')
  const [phone, setPhone] = useState('')
  const [isOnVacation, setIsOnVacation] = useState(false)
  const [vacationReturnDate, setVacationReturnDate] = useState('')
  const [isAtCapacity, setIsAtCapacity] = useState(false)
  const [isEmergencyPause, setIsEmergencyPause] = useState(false)
  const [savingStatus, setSavingStatus] = useState(false)
  const [isEmergencyRoster, setIsEmergencyRoster] = useState(false)
  const [emergencyWindows, setEmergencyWindows] = useState<string[]>([])
  const [payouts, setPayouts] = useState<any[]>([])
  const [togglingInstantPayout, setTogglingInstantPayout] = useState(false)
  const [reserveData, setReserveData] = useState<any>(null)
  const [reserveTxs, setReserveTxs] = useState<any[]>([])
  const [pendingTranches, setPendingTranches] = useState<any[]>([])
  const [recentDisputeCount, setRecentDisputeCount] = useState(0)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [proBakerCount, setProBakerCount] = useState(0)
  const [dismissedTouch2, setDismissedTouch2] = useState(false)
  const [dismissedTouch3, setDismissedTouch3] = useState(false)
  const [copiedStripeUrl, setCopiedStripeUrl] = useState(false)
  const [openTipIdx, setOpenTipIdx] = useState<number | null>(null)
  const [paymentPlansEnabled, setPaymentPlansEnabled] = useState(false)
  const [needsAttentionCollapsed, setNeedsAttentionCollapsed] = useState(false)

  // Planned vacations
  const [plannedVacations, setPlannedVacations] = useState<any[]>([])
  const [vacStartDate, setVacStartDate] = useState('')
  const [vacEndDate, setVacEndDate] = useState('')
  const [vacLabel, setVacLabel] = useState('')
  const [savingVacation, setSavingVacation] = useState(false)
  const [vacConflictOrders, setVacConflictOrders] = useState<any[]>([])
  const [pendingVacSave, setPendingVacSave] = useState<{ start: string; end: string; label: string } | null>(null)

  useEffect(() => {
    loadDashboard()
    const params = new URLSearchParams(window.location.search)
    if (params.get('stripe') === 'success') {
      alert('Stripe connected successfully! You can now receive payments.')
      window.history.replaceState({}, '', '/dashboard/baker')
    }
  }, [])

  useEffect(() => {
    if (!baker) return
    const orderChannel = supabase
      .channel('baker-orders-' + baker.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders', filter: 'baker_id=eq.' + baker.id }, (payload) => {
        setOrders(prev => [payload.new as any, ...prev])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: 'baker_id=eq.' + baker.id }, (payload) => {
        setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o))
      })
      .subscribe()
    const msgChannel = supabase
      .channel('baker-new-messages-' + baker.user_id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: 'receiver_id=eq.' + baker.user_id }, () => {
        setActiveTab(current => { if (current !== 'messages') setUnreadCount(c => c + 1); return current })
      }).subscribe()
    return () => { supabase.removeChannel(orderChannel); supabase.removeChannel(msgChannel) }
  }, [baker])

  // Auto-update profile_complete when all six checklist items are met
  useEffect(() => {
    if (!baker || loading) return
    const allComplete =
      !!baker.profile_photo_url &&
      portfolio.length >= 3 &&
      !!(baker.starting_price && baker.starting_price > 0) &&
      !!(baker.bio && baker.bio.trim().length > 0) &&
      !!baker.tier &&
      !!baker.stripe_account_id
    if (allComplete && !baker.profile_complete) {
      supabase.from('bakers').update({ profile_complete: true }).eq('id', baker.id).then(() => {})
      setBaker((prev: any) => ({ ...prev, profile_complete: true }))
    }
  }, [baker?.profile_photo_url, portfolio.length, baker?.starting_price, baker?.bio, baker?.tier, baker?.stripe_account_id, baker?.profile_complete, loading])

  async function handlePlanSelection(plan: 'free' | 'pro') {
    const updates: any = { has_seen_plan_modal: true }
    if (plan === 'free') updates.tier = 'free'
    await supabase.from('bakers').update(updates).eq('id', baker.id)
    setBaker((prev: any) => ({ ...prev, ...updates }))
    setShowPlanModal(false)
    if (plan === 'pro') window.location.href = '/join?plan=pro'
  }

  function dismissTouch2Banner() {
    localStorage.setItem('whiskly_touch2_' + baker.id, '1')
    setDismissedTouch2(true)
  }

  function dismissTouch3Banner() {
    localStorage.setItem('whiskly_touch3_' + baker.id, '1')
    setDismissedTouch3(true)
  }

  function copyStripeUrl() {
    navigator.clipboard.writeText('https://www.whiskly.co/bakers/' + baker.id)
    setCopiedStripeUrl(true)
    setTimeout(() => setCopiedStripeUrl(false), 2000)
  }

  async function loadDashboard() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: bakerData } = await supabase.from('bakers').select('*').eq('user_id', user.id).maybeSingle()
    if (bakerData && !bakerData.is_active) {
      router.push('/application-pending')
      return
    }
    if (bakerData && !bakerData.onboarding_completed) {
      router.push('/onboarding/baker')
      return
    }
    if (bakerData) {
      setBaker(bakerData)
      setBusinessName(bakerData.business_name || '')
      setBio(bakerData.bio || '')
      setCity(bakerData.city || '')
      setState(bakerData.state || '')
      setZipCode(bakerData.zip_code || '')
      setStartingPrice(bakerData.starting_price?.toString() || '')
      setLeadTime(bakerData.lead_time_days?.toString() || '7')
      setPhone(bakerData.phone || '')
      setIsOnVacation(bakerData.is_on_vacation || false)
      setVacationReturnDate(bakerData.vacation_return_date || '')
      setIsAtCapacity(bakerData.is_at_capacity || false)
      setIsEmergencyPause(bakerData.is_emergency_pause || false)
      setIsEmergencyRoster(bakerData.emergency_roster || false)
      setEmergencyWindows(bakerData.emergency_windows || [])
      setPaymentPlansEnabled(bakerData.payment_plans_enabled || false)
      const { data: ordersData } = await supabase.from('orders').select('*, inspiration_photo_urls').eq('baker_id', bakerData.id).order('created_at', { ascending: false })
      setOrders((ordersData || []).map(o => ({ ...o, inspiration_photo_urls: o.inspiration_photo_urls || [] })))
      const { data: portfolioData } = await supabase.from('portfolio_items').select('*').eq('baker_id', bakerData.id).order('created_at', { ascending: false })
      setPortfolio(portfolioData || [])
      const { data: unreadData } = await supabase.from('messages').select('id').eq('receiver_id', user.id).is('read_at', null)
      setUnreadCount((unreadData || []).length)
      // Fetch payout history (legacy payout_schedule)
      const { data: payoutData } = await supabase.from('payout_schedule').select('*').eq('baker_id', bakerData.id).order('created_at', { ascending: false }).limit(10)
      setPayouts(payoutData || [])
      // Fetch reserve data
      const disputeCutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
      const [reserveRes, reserveTxRes, tranchesRes, disputeRes] = await Promise.all([
        supabase.from('baker_reserve').select('*').eq('baker_id', bakerData.id).maybeSingle(),
        supabase.from('reserve_transactions').select('*').eq('baker_id', bakerData.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('payout_tranches').select('*').eq('baker_id', bakerData.id).in('status', ['pending', 'scheduled']).order('created_at', { ascending: false }),
        supabase.from('orders').select('id').eq('baker_id', bakerData.id).eq('is_disputed', true).eq('auto_resolved', false).gte('dispute_filed_at', disputeCutoff),
      ])
      setReserveData(reserveRes.data)
      setReserveTxs(reserveTxRes.data || [])
      setPendingTranches(tranchesRes.data || [])
      setRecentDisputeCount((disputeRes.data || []).length)
      // Pro baker count — used for plan modal and upgrade banners
      const { count: proCount } = await supabase.from('bakers').select('*', { count: 'exact', head: true }).eq('tier', 'pro').eq('is_active', true)
      setProBakerCount(proCount || 0)
      // Show plan selection modal on first login after approval
      if (bakerData.has_seen_plan_modal === false) setShowPlanModal(true)
      // Load banner dismissal state from localStorage
      if (typeof window !== 'undefined') {
        setDismissedTouch2(localStorage.getItem('whiskly_touch2_' + bakerData.id) === '1')
        setDismissedTouch3(localStorage.getItem('whiskly_touch3_' + bakerData.id) === '1')
      }
      // Fetch planned vacations
      const { data: vacData } = await supabase.from('baker_vacations').select('*').eq('baker_id', bakerData.id).order('start_date', { ascending: true })
      setPlannedVacations(vacData || [])
      // Vacation auto-activation
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const todayStr = today.toISOString().split('T')[0]
      for (const vac of (vacData || [])) {
        if (todayStr >= vac.start_date && todayStr <= vac.end_date && !bakerData.is_on_vacation) {
          await supabase.from('bakers').update({ is_on_vacation: true, vacation_return_date: vac.end_date }).eq('id', bakerData.id)
          bakerData.is_on_vacation = true; bakerData.vacation_return_date = vac.end_date
        }
        if (todayStr > vac.end_date && bakerData.is_on_vacation && bakerData.vacation_return_date === vac.end_date) {
          await supabase.from('bakers').update({ is_on_vacation: false, vacation_return_date: null }).eq('id', bakerData.id)
          bakerData.is_on_vacation = false; bakerData.vacation_return_date = null
        }
      }
      // Re-sync vacation state after auto-activation
      setIsOnVacation(bakerData.is_on_vacation || false)
      setVacationReturnDate(bakerData.vacation_return_date || '')
    }
    setLoading(false)
  }

  async function saveProfile() {
    setSaving(true)
    await supabase.from('bakers').update({
      business_name: businessName, bio, city, state, zip_code: zipCode,
      starting_price: parseInt(startingPrice) || null, lead_time_days: parseInt(leadTime) || 7, phone: phone || null,
      specialties: baker?.specialties || [], rush_orders_available: baker?.rush_orders_available || false,
      cancellation_policy: baker?.cancellation_policy || '', pickup_address: baker?.pickup_address || null,
    }).eq('id', baker.id)
    setSaving(false)
    alert('Profile saved!')
  }

  async function uploadPhoto(file: File) {
    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = baker.id + '.' + fileExt
    const { error: uploadError } = await supabase.storage.from('baker-photos').upload(fileName, file, { upsert: true })
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
    const { error: uploadError } = await supabase.storage.from('baker-photos').upload(fileName, file, { upsert: true })
    if (!uploadError) {
      const { data } = supabase.storage.from('baker-photos').getPublicUrl(fileName)
      const { data: newItem } = await supabase.from('portfolio_items').insert({ baker_id: baker.id, image_url: data.publicUrl, is_visible: true }).select().single()
      if (newItem) setPortfolio([newItem, ...portfolio])
    }
    setUploadingPortfolio(false)
  }

  async function deletePortfolioPhoto(id: string) {
    await supabase.from('portfolio_items').delete().eq('id', id)
    setPortfolio(portfolio.filter(p => p.id !== id))
  }

  async function saveVacation(force = false) {
    if (!vacStartDate || !vacEndDate || vacEndDate <= vacStartDate) return
    if (!force) {
      const conflicts = orders.filter(o =>
        ['confirmed', 'in_progress'].includes(o.status) &&
        o.event_date >= vacStartDate && o.event_date <= vacEndDate
      )
      if (conflicts.length > 0) {
        setVacConflictOrders(conflicts)
        setPendingVacSave({ start: vacStartDate, end: vacEndDate, label: vacLabel })
        return
      }
    }
    setSavingVacation(true)
    const { data: newVac } = await supabase.from('baker_vacations').insert({
      baker_id: baker.id, start_date: vacStartDate, end_date: vacEndDate, label: vacLabel.trim() || null,
    }).select().single()
    if (newVac) setPlannedVacations(prev => [...prev, newVac].sort((a, b) => a.start_date.localeCompare(b.start_date)))
    setVacStartDate(''); setVacEndDate(''); setVacLabel('')
    setPendingVacSave(null); setVacConflictOrders([])
    setSavingVacation(false)
  }

  async function deleteVacation(id: string) {
    await supabase.from('baker_vacations').delete().eq('id', id)
    setPlannedVacations(prev => prev.filter(v => v.id !== id))
  }

  async function toggleInstantPayout() {
    if (!baker?.instant_payout_eligible) return
    setTogglingInstantPayout(true)
    const newVal = !baker.instant_payout_enabled
    await supabase.from('bakers').update({ instant_payout_enabled: newVal }).eq('id', baker.id)
    setBaker((prev: any) => ({ ...prev, instant_payout_enabled: newVal }))
    setTogglingInstantPayout(false)
  }

  async function checkAndExpireStrikes() {
    const { data: bakerData } = await supabase.from('bakers').select('strike_count, strike_log, completed_orders_since_strike').eq('id', baker.id).maybeSingle()
    if (!bakerData) return
    const newCompletedCount = (bakerData.completed_orders_since_strike || 0) + 1
    await supabase.from('bakers').update({ completed_orders_since_strike: newCompletedCount }).eq('id', baker.id)
    const strikeLog: any[] = bakerData.strike_log || []
    if (!strikeLog.length) return
    const now = new Date()
    let expiredCount = 0
    const updatedLog = strikeLog.map(strike => {
      if (strike.expired) return strike
      const createdAt = new Date(strike.created_at)
      const monthsDiff = (now.getFullYear() - createdAt.getFullYear()) * 12 + (now.getMonth() - createdAt.getMonth())
      const isEmergency = (strike.reason || '').includes('emergency_pause')
      let shouldExpire = false
      if (isEmergency) {
        shouldExpire = monthsDiff >= 6
      } else if (strike.count === 1) {
        shouldExpire = monthsDiff >= 12 || newCompletedCount >= 10
      } else if (strike.count === 2) {
        shouldExpire = monthsDiff >= 18 || newCompletedCount >= 20
      }
      // count === 3 never auto-expires
      if (shouldExpire) { expiredCount++; return { ...strike, expired: true } }
      return strike
    })
    if (expiredCount > 0) {
      const newStrikeCount = Math.max(0, (bakerData.strike_count || 0) - expiredCount)
      await supabase.from('bakers').update({ strike_count: newStrikeCount, strike_log: updatedLog, completed_orders_since_strike: 0 }).eq('id', baker.id)
      setBaker((prev: any) => ({ ...prev, strike_count: newStrikeCount, strike_log: updatedLog }))
      fetch('/api/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'announcement', to: baker.email || '', name: baker.business_name, subject: 'Good news — your strike' + (expiredCount > 1 ? 's have' : ' has') + ' expired on Whiskly', body: expiredCount + ' strike' + (expiredCount > 1 ? 's have' : ' has') + ' been removed from your Whiskly account. Keep up the great work!\n\nYour current strike count is now ' + newStrikeCount + '.' }) }).catch(() => {})
    }
  }

  async function updateOrderStatus(orderId: string, status: string, confirmedPriceCents?: number) {
    const updates: any = { status }
    if (status === 'confirmed' && confirmedPriceCents !== undefined) {
      updates.confirmed_price = confirmedPriceCents
    }
    await supabase.from('orders').update(updates).eq('id', orderId)
    setOrders(orders.map(o => o.id === orderId ? { ...o, status, ...(confirmedPriceCents !== undefined ? { confirmed_price: confirmedPriceCents } : {}) } : o))
    if (status === 'confirmed') {
      const order = orders.find(o => o.id === orderId)
      if (order) {
        const displayPrice = confirmedPriceCents !== undefined ? confirmedPriceCents / 100 : order.budget
        const savedAmount = confirmedPriceCents !== undefined && confirmedPriceCents / 100 < order.budget
          ? (order.budget - confirmedPriceCents / 100).toFixed(2) : null
        const acceptedBody = `Your order has been confirmed at $${displayPrice.toFixed(2)}.${savedAmount ? ` You saved $${savedAmount} compared to your original budget.` : ''} Please log in to your dashboard to pay your deposit and lock in your order.`
        fetch('/api/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'announcement', to: order.customer_email, name: order.customer_name, subject: 'Your Whiskly order has been confirmed!', body: acceptedBody }) }).catch(() => {})
        fetch('/api/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'deposit_nudge', customerEmail: order.customer_email, customerName: order.customer_name, bakerName: baker.business_name, eventType: order.event_type, eventDate: order.event_date, budget: displayPrice, orderId }) }).catch(() => {})
      }
    }
    if (status === 'declined') {
      const order = orders.find(o => o.id === orderId)
      if (order) {
        fetch('/api/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'order_declined', customerEmail: order.customer_email, customerName: order.customer_name, bakerName: baker.business_name, eventType: order.event_type, eventDate: order.event_date, orderId }) }).catch(() => {})
      }
    }
    if (status === 'ready') {
      const order = orders.find(o => o.id === orderId)
      if (order) {
        fetch('/api/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'order_ready_customer', customerEmail: order.customer_email, customerName: order.customer_name, bakerName: baker.business_name, eventType: order.event_type, eventDate: order.event_date, fulfillmentType: order.fulfillment_type, orderId }) }).catch(() => {})
      }
    }
    if (status === 'complete') {
      checkAndExpireStrikes().catch(() => {})
    }
  }

  async function submitDelivery(order: any) {
    if (!deliveryPhoto) return
    setSubmittingDelivery(true)
    const ext = deliveryPhoto.name.split('.').pop()
    const fileName = order.id + '-delivery-' + Date.now() + '.' + ext
    const { error } = await supabase.storage.from('delivery-proof').upload(fileName, deliveryPhoto, { upsert: true })
    let proofPhotoUrl = ''
    if (!error) {
      const { data } = supabase.storage.from('delivery-proof').getPublicUrl(fileName)
      proofPhotoUrl = data.publicUrl
    }
    await supabase.from('orders').update({ status: 'complete', delivery_proof_url: proofPhotoUrl, care_instructions: careInstructions, delivery_confirmed_at: new Date().toISOString() }).eq('id', order.id)
    await fetch('/api/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'delivery_complete', customerEmail: order.customer_email, customerName: order.customer_name, bakerName: baker.business_name, eventType: order.event_type, eventDate: order.event_date, orderId: order.id, proofPhotoUrl, careInstructions, isPro: baker.tier === 'pro' }) }).catch(() => {})
    setOrders(orders.map(o => o.id === order.id ? { ...o, status: 'complete', delivery_proof_url: proofPhotoUrl, care_instructions: careInstructions, delivery_confirmed_at: new Date().toISOString() } : o))
    setDeliveryModalOrder(null); setDeliveryPhoto(null); setDeliveryPhotoPreview(null); setCareInstructions('')
    setSubmittingDelivery(false)
    checkAndExpireStrikes().catch(() => {})
  }

  async function submitHandoff(order: any) {
    if (!deliveryPhoto) return
    setSubmittingDelivery(true)
    const ext = deliveryPhoto.name.split('.').pop()
    const fileName = order.id + '-handoff-' + Date.now() + '.' + ext
    const { error } = await supabase.storage.from('delivery-proof').upload(fileName, deliveryPhoto, { upsert: true })
    let photoUrl = ''
    if (!error) {
      const { data } = supabase.storage.from('delivery-proof').getPublicUrl(fileName)
      photoUrl = data.publicUrl
    }
    await supabase.from('orders').update({ handoff_photo_url: photoUrl, care_instructions: careInstructions }).eq('id', order.id)
    await fetch('/api/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'order_ready', customerEmail: order.customer_email, customerName: order.customer_name, bakerName: baker.business_name, eventType: order.event_type, eventDate: order.event_date, orderId: order.id }) }).catch(() => {})
    setOrders(orders.map(o => o.id === order.id ? { ...o, handoff_photo_url: photoUrl, care_instructions: careInstructions } : o))
    setDeliveryModalOrder(null); setDeliveryPhoto(null); setDeliveryPhotoPreview(null); setCareInstructions('')
    setSubmittingDelivery(false)
  }

  function getDaysUntil(dateStr: string) {
    const [year, month, day] = dateStr.split('-').map(Number)
    const eventDate = new Date(year, month - 1, day)
    const today = new Date(); today.setHours(0, 0, 0, 0)
    return Math.round((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  async function sendReminder(order: any) {
    const { data: customerData } = await supabase.from('customers').select('user_id').eq('email', order.customer_email).maybeSingle()
    const days = getDaysUntil(order.event_date)
    const content = 'Just a friendly reminder, your ' + order.event_type + ' is coming up in ' + days + ' day' + (days !== 1 ? 's' : '') + '! Reach out if you have any questions or last-minute details.'
    await supabase.from('messages').insert({ sender_id: baker.user_id, receiver_id: customerData?.user_id || null, baker_id: baker.id, order_id: order.id, content })
    await fetch('/api/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'baker_question', customerEmail: order.customer_email, customerName: order.customer_name, bakerName: businessName, question: content, eventType: order.event_type, eventDate: order.event_date, orderId: order.id }) }).catch(() => {})
    alert('Reminder sent to ' + order.customer_name + '!')
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  async function connectStripe() {
    const { data: { user } } = await supabase.auth.getUser()
    const res = await fetch('/api/stripe/connect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ baker_id: baker.id, email: user?.email, return_url: window.location.origin + '/dashboard/baker' }) })
    const data = await res.json()
    if (data.error) { alert('Error: ' + data.error); return }
    if (data.url) window.location.href = data.url
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f0eb' }}>
      <p style={{ color: '#2d1a0e' }}>Loading your dashboard...</p>
    </div>
  )

async function saveAvailabilityStatus(updates: any) {
  setSavingStatus(true)
  await supabase.from('bakers').update(updates).eq('id', baker.id)
  setBaker({ ...baker, ...updates })
  setSavingStatus(false)
}

async function triggerEmergencyPause() {
  if (!confirm('This will pause all new orders and alert our team immediately. Use only for genuine emergencies. Continue?')) return
  const now = new Date().toISOString()
  const newCount = (baker.emergency_pause_count || 0) + 1
  await supabase.from('bakers').update({
    is_emergency_pause: true,
    emergency_pause_at: now,
    emergency_pause_count: newCount,
    last_emergency_pause_at: now,
  }).eq('id', baker.id)

  // Create emergency case
  await supabase.from('emergency_cases').insert({
    baker_id: baker.id,
    status: 'open',
    notes: 'Baker initiated emergency pause at ' + now,
  })

  // Notify admin via email
  await fetch('/api/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'announcement',
      to: 'support@whiskly.co',
      name: 'Whiskly Admin',
      subject: '[EMERGENCY] Baker pause — ' + baker.business_name,
      body: baker.business_name + ' has initiated an emergency pause at ' + new Date(now).toLocaleString() + '.\n\nPlease review immediately in the admin panel.\n\nAffected baker ID: ' + baker.id,
    })
  }).catch(() => {})

  setIsEmergencyPause(true)
  setBaker({ ...baker, is_emergency_pause: true, emergency_pause_at: now })
  alert('Emergency pause activated. Our team has been notified and will be in touch shortly.')
}

  const STATUS_ORDER: Record<string, number> = { in_progress: 0, confirmed: 1, ready: 2, pending: 3, countered: 4, complete: 5, declined: 6, cancelled: 7 }
  function sortOrders(list: any[]) {
    return [...list].sort((a, b) => {
      const ap = STATUS_ORDER[a.status] ?? 8, bp = STATUS_ORDER[b.status] ?? 8
      if (ap !== bp) return ap - bp
      if (a.event_date && b.event_date) return a.event_date.localeCompare(b.event_date)
      return a.event_date ? -1 : b.event_date ? 1 : 0
    })
  }

  const pending = orders.filter(o => o.status === 'pending')
  const countered = orders.filter(o => o.status === 'countered')
  const confirmed = orders.filter(o => o.status === 'confirmed')
  const inProgress = orders.filter(o => o.status === 'in_progress')
  const maxPhotos = baker?.tier === 'pro' ? 10 : 3

  function SizeReductionBakerCard({ order, baker, setOrders }: { order: any; baker: any; setOrders: any }) {
    const [confirmedPrice, setConfirmedPrice] = useState('')
    const [responding, setResponding] = useState(false)

    async function approve() {
      if (!confirmedPrice || isNaN(parseFloat(confirmedPrice))) return
      setResponding(true)
      const newTotal = parseFloat(confirmedPrice)
      await supabase.from('orders').update({
        size_reduction_status: 'approved',
        budget: newTotal,
      }).eq('id', order.id)
      const { data: customerData } = await supabase.from('customers').select('user_id').eq('email', order.customer_email).maybeSingle()
      await supabase.from('messages').insert({
        sender_id: baker.user_id,
        receiver_id: customerData?.user_id || null,
        baker_id: baker.id,
        order_id: order.id,
        content: 'Your size reduction request has been approved. The new confirmed price for your order is $' + newTotal.toFixed(2) + '.',
      })
      fetch('/api/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'announcement', to: order.customer_email, name: order.customer_name, subject: 'Your size reduction has been approved — Whiskly', body: 'Great news! Your baker has approved your size reduction request. The new confirmed price for your order is $' + newTotal.toFixed(2) + '. Your balance payment will be adjusted accordingly.' }) }).catch(() => {})
      setOrders((prev: any[]) => prev.map(o => o.id === order.id ? { ...o, size_reduction_status: 'approved', budget: newTotal } : o))
      setResponding(false)
    }

    async function decline() {
      setResponding(true)
      await supabase.from('orders').update({ size_reduction_status: 'declined' }).eq('id', order.id)
      const { data: customerData } = await supabase.from('customers').select('user_id').eq('email', order.customer_email).maybeSingle()
      await supabase.from('messages').insert({
        sender_id: baker.user_id,
        receiver_id: customerData?.user_id || null,
        baker_id: baker.id,
        order_id: order.id,
        content: 'Your size reduction request has been declined. Your original order and price remain in place.',
      })
      fetch('/api/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'announcement', to: order.customer_email, name: order.customer_name, subject: 'Your size reduction request was declined — Whiskly', body: 'Your baker has reviewed your size reduction request and is unable to accommodate it at this time. Your original order details and price remain unchanged.' }) }).catch(() => {})
      setOrders((prev: any[]) => prev.map(o => o.id === order.id ? { ...o, size_reduction_status: 'declined' } : o))
      setResponding(false)
    }

    return (
      <div className="p-3 rounded-xl border-2" style={{ borderColor: '#f59e0b', backgroundColor: '#fffbeb' }}>
        <p className="text-xs font-bold mb-1" style={{ color: '#92400e' }}>Size reduction requested</p>
        <p className="text-xs mb-2" style={{ color: '#78350f' }}>
          {order.customer_name} is requesting a reduction from {order.size_reduction_original_servings} to {order.size_reduction_requested_servings} servings.
        </p>
        <p className="text-xs mb-2" style={{ color: '#5c3d2e' }}>Enter the new confirmed price to approve, or decline to keep the original order.</p>
        <div className="flex gap-2 items-center mb-2">
          <span className="text-xs font-semibold" style={{ color: '#2d1a0e' }}>$</span>
          <input type="number" value={confirmedPrice} onChange={e => setConfirmedPrice(e.target.value)}
            placeholder="New confirmed price" className="flex-1 px-3 py-1.5 rounded-lg border text-xs"
            style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: 'white' }} />
        </div>
        <div className="flex gap-2">
          <button onClick={decline} disabled={responding} className="flex-1 py-1.5 rounded-lg text-xs font-semibold border" style={{ borderColor: '#dc2626', color: '#dc2626' }}>Decline</button>
          <button onClick={approve} disabled={responding || !confirmedPrice} className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: '#166534', opacity: (!confirmedPrice || responding) ? 0.5 : 1 }}>Approve with $</button>
        </div>
      </div>
    )
  }

  function OrderCard({ order }: { order: any }) {
    const [expanded, setExpanded] = useState(false)
    const [localAsking, setLocalAsking] = useState(false)
    const [localQuestion, setLocalQuestion] = useState('')
    const [localSending, setLocalSending] = useState(false)
    const [localCountering, setLocalCountering] = useState(false)
    const [localCounterPrice, setLocalCounterPrice] = useState('')
    const [localCounterMessage, setLocalCounterMessage] = useState('')
    const [localCounterSending, setLocalCounterSending] = useState(false)
    // Set Price modal (shown before accept modal)
    const [showPriceModal, setShowPriceModal] = useState(false)
    const [confirmedPrice, setConfirmedPrice] = useState('')
    const [aiPricing, setAiPricing] = useState<{ low: number; high: number; reasoning: string } | null>(null)
    const [aiPricingLoading, setAiPricingLoading] = useState(false)
    // Accept confirmation modal
    const [showAcceptModal, setShowAcceptModal] = useState(false)
    // Cancel modal
    const [showCancelModal, setShowCancelModal] = useState(false)
    const [cancelReason, setCancelReason] = useState('')
    const [cancelDescription, setCancelDescription] = useState('')
    const [cancellingOrder, setCancellingOrder] = useState(false)
    // Dispute modal
    const [showDisputeModal, setShowDisputeModal] = useState(false)
    const [disputeReason, setDisputeReason] = useState('')
    const [disputeDescription, setDisputeDescription] = useState('')
    const [filingDispute, setFilingDispute] = useState(false)
    // Rate customer
    const [alreadyRated, setAlreadyRated] = useState(false)
    const [showRateModal, setShowRateModal] = useState(false)
    const [rateStars, setRateStars] = useState(5)
    const [rateNote, setRateNote] = useState('')
    const [submittingRating, setSubmittingRating] = useState(false)
    // Customer rating display (shown when expanded)
    const [customerAvgRating, setCustomerAvgRating] = useState<number | null>(null)
    const [customerRatingCount, setCustomerRatingCount] = useState(0)
    const [customerIsTrusted, setCustomerIsTrusted] = useState(false)
    const [loadedCustomerRating, setLoadedCustomerRating] = useState(false)
    // High-value pre-acceptance review
    const [showHighValueReview, setShowHighValueReview] = useState(false)
    const [highValueScopeConfirmed, setHighValueScopeConfirmed] = useState(false)
    // Three-dots menu / Block / Flag
    const [showDotsMenu, setShowDotsMenu] = useState(false)
    const [showBlockModal, setShowBlockModal] = useState(false)
    const [blockingCustomer, setBlockingCustomer] = useState(false)
    const [showFlagModal, setShowFlagModal] = useState(false)
    const [flagReason, setFlagReason] = useState('')
    const [flagDescription, setFlagDescription] = useState('')
    const [submittingFlag, setSubmittingFlag] = useState(false)

    const statusConfig: Record<string, { label: string, bg: string, color: string }> = {
      pending:     { label: 'Pending',      bg: '#fef9c3', color: '#854d0e' },
      countered:   { label: 'Counter Sent', bg: '#fff7ed', color: '#c2410c' },
      confirmed:   { label: 'Accepted',     bg: '#dcfce7', color: '#166534' },
      in_progress: { label: 'In Progress',  bg: '#dbeafe', color: '#1e40af' },
      ready:       { label: 'Ready',        bg: '#f3e8ff', color: '#6b21a8' },
      complete:    { label: 'Complete',     bg: '#f5f0eb', color: '#2d1a0e' },
      declined:    { label: 'Declined',     bg: '#fee2e2', color: '#991b1b' },
      cancelled:   { label: 'Cancelled',    bg: '#fee2e2', color: '#991b1b' },
      disputed:    { label: 'Disputed',     bg: '#fef3c7', color: '#92400e' },
    }
    const s = statusConfig[order.status] || statusConfig.pending
    const isAccepted = ['confirmed','in_progress','ready','complete'].includes(order.status)
    const canDispute = !!order.deposit_paid_at &&
      ['confirmed', 'in_progress', 'ready', 'complete'].includes(order.status) &&
      !order.is_disputed

    useEffect(() => {
      if (order.status === 'complete') {
        supabase.from('customer_reviews').select('id').eq('order_id', order.id).maybeSingle().then(({ data }) => {
          if (data) setAlreadyRated(true)
        })
      }
    }, [order.id, order.status])

    useEffect(() => {
      if (expanded && !loadedCustomerRating) {
        supabase.from('customers').select('avg_rating, rating_count, is_trusted_member').eq('email', order.customer_email).maybeSingle().then(({ data }) => {
          if (data) { setCustomerAvgRating(data.avg_rating || null); setCustomerRatingCount(data.rating_count || 0); setCustomerIsTrusted(data.is_trusted_member || false) }
          setLoadedCustomerRating(true)
        })
      }
    }, [expanded, loadedCustomerRating])

    function openPriceModal() {
      setConfirmedPrice(order.budget?.toString() || '')
      setAiPricing(null)
      setShowPriceModal(true)
      if (baker?.tier === 'pro') {
        setAiPricingLoading(true)
        fetch('/api/ai/pricing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_type: order.event_type,
            servings: order.servings,
            item_description: order.item_description,
            scope_flavor_details: order.scope_flavor_details,
            scope_design_description: order.scope_design_description,
            city: baker.city,
            state: baker.state,
            budget: order.budget,
          }),
        })
          .then(r => r.json())
          .then(d => { if (d.low && d.high) setAiPricing(d) })
          .catch(() => {})
          .finally(() => setAiPricingLoading(false))
      }
    }

    async function handleSendQuestion() {
      if (!localQuestion.trim()) return
      setLocalSending(true)
      const { data: customerData } = await supabase.from('customers').select('user_id').eq('email', order.customer_email).maybeSingle()
      await supabase.from('orders').update({ baker_question: localQuestion.trim() }).eq('id', order.id)
      await supabase.from('messages').insert({ sender_id: baker.user_id, receiver_id: customerData?.user_id || null, baker_id: baker.id, order_id: order.id, content: 'Question about your order: ' + localQuestion.trim() })
      await fetch('/api/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'baker_question', customerEmail: order.customer_email, customerName: order.customer_name, bakerName: businessName, question: localQuestion.trim(), eventType: order.event_type, eventDate: order.event_date, orderId: order.id }) }).catch(() => {})
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, baker_question: localQuestion.trim() } : o))
      setLocalAsking(false); setLocalQuestion(''); setLocalSending(false)
    }

    async function handleSendCounter() {
      if (!localCounterPrice.trim()) return
      setLocalCounterSending(true)
      const { data: customerData } = await supabase.from('customers').select('user_id').eq('email', order.customer_email).maybeSingle()
      await supabase.from('orders').update({
        counter_price: parseFloat(localCounterPrice),
        counter_message: localCounterMessage.trim() || null,
        counter_status: 'pending',
        counter_at: new Date().toISOString(),
        status: 'countered',
      }).eq('id', order.id)
      const msgContent = 'I would love to make this for you! My price for this order would be $' + localCounterPrice + (localCounterMessage ? '. ' + localCounterMessage : '') + '. Please accept or decline in your dashboard.'
      await supabase.from('messages').insert({ sender_id: baker.user_id, receiver_id: customerData?.user_id || null, baker_id: baker.id, order_id: order.id, content: msgContent })
      await fetch('/api/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'baker_question', customerEmail: order.customer_email, customerName: order.customer_name, bakerName: businessName, question: msgContent, eventType: order.event_type, eventDate: order.event_date, orderId: order.id }) }).catch(() => {})
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, counter_price: parseFloat(localCounterPrice), counter_message: localCounterMessage, counter_status: 'pending', status: 'countered' } : o))
      setLocalCountering(false); setLocalCounterPrice(''); setLocalCounterMessage(''); setLocalCounterSending(false)
    }

    async function handleRateCustomer() {
      setSubmittingRating(true)
      const { data: customerData } = await supabase.from('customers').select('id').eq('email', order.customer_email).maybeSingle()
      if (!customerData) { setSubmittingRating(false); return }
      await supabase.from('customer_reviews').insert({ order_id: order.id, baker_id: baker.id, customer_id: customerData.id, rating: rateStars, private_note: rateNote.trim() || null })
      const { data: allReviews } = await supabase.from('customer_reviews').select('rating').eq('customer_id', customerData.id)
      if (allReviews && allReviews.length > 0) {
        const avg = allReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / allReviews.length
        await supabase.from('customers').update({ avg_rating: Math.round(avg * 100) / 100, rating_count: allReviews.length }).eq('id', customerData.id)
      }
      setAlreadyRated(true); setShowRateModal(false); setRateStars(5); setRateNote(''); setSubmittingRating(false)
    }

    async function handleBlockCustomer() {
      setBlockingCustomer(true)
      const { data: customerData } = await supabase.from('customers').select('user_id').eq('email', order.customer_email).maybeSingle()
      await supabase.from('blocks').insert({ blocker_id: baker.id, blocked_id: customerData?.user_id, blocker_type: 'baker' })
      setShowBlockModal(false); setShowDotsMenu(false); setBlockingCustomer(false)
    }

    async function handleFlagCustomer() {
      if (!flagReason || flagDescription.trim().length < 20) return
      setSubmittingFlag(true)
      const { data: customerData } = await supabase.from('customers').select('id').eq('email', order.customer_email).maybeSingle()
      if (!customerData) { setSubmittingFlag(false); return }
      await supabase.from('customer_flags').upsert({ baker_id: baker.id, customer_id: customerData.id, reason: flagReason, description: flagDescription.trim() }, { onConflict: 'baker_id,customer_id' })
      const { count } = await supabase.from('customer_flags').select('*', { count: 'exact', head: true }).eq('customer_id', customerData.id)
      const newFlagCount = count || 0
      const updates: any = { flag_count: newFlagCount }
      if (newFlagCount >= 3) {
        updates.is_flagged = true
        await fetch('/api/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'announcement', to: 'support@whiskly.co', name: 'Whiskly Admin', subject: '[ADMIN] Customer flagged — ' + order.customer_name, body: order.customer_name + ' (' + order.customer_email + ') has reached ' + newFlagCount + ' flags.\n\nLatest flag: ' + flagReason + '\n' + flagDescription.trim() + '\n\nFiled by: ' + baker.business_name }) }).catch(() => {})
      }
      await supabase.from('customers').update(updates).eq('id', customerData.id)
      setShowFlagModal(false); setFlagReason(''); setFlagDescription(''); setSubmittingFlag(false)
    }

    async function handleCancelOrder() {
      if (!cancelReason) return
      setCancellingOrder(true)
      const now = new Date().toISOString()
      await supabase.from('orders').update({
        status: 'cancelled',
        cancelled_by: 'baker',
        cancellation_reason: cancelReason,
        cancelled_at: now,
      }).eq('id', order.id)
      if (order.deposit_paid_at) {
        await fetch('/api/stripe/refund', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: order.id }),
        }).catch(() => {})
      }
      const existingLog: any[] = baker.strike_log || []
      const newStrike = { reason: cancelReason, date: now, order_id: order.id, type: 'baker_cancellation' }
      const newCount = (baker.strike_count || 0) + 1
      await supabase.from('bakers').update({
        strike_count: newCount,
        strike_log: [...existingLog, newStrike],
      }).eq('id', baker.id)
      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'baker_cancelled',
          customerEmail: order.customer_email,
          customerName: order.customer_name,
          bakerName: baker.business_name,
          eventType: order.event_type,
          eventDate: order.event_date,
          orderId: order.id,
          reason: cancelReason,
        }),
      }).catch(() => {})
      setBaker((prev: any) => ({ ...prev, strike_count: newCount, strike_log: [...existingLog, newStrike] }))
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'cancelled', cancelled_by: 'baker' } : o))
      setShowCancelModal(false); setCancelReason(''); setCancelDescription(''); setCancellingOrder(false)
    }

    async function handleBakerFileDispute() {
      if (!disputeReason || disputeDescription.trim().length < 20) return
      setFilingDispute(true)
      const now = new Date().toISOString()
      await supabase.from('orders').update({
        status: 'disputed',
        is_disputed: true,
        dispute_reason: disputeReason,
        dispute_description: disputeDescription.trim(),
        dispute_filed_by: 'baker',
        dispute_filed_at: now,
      }).eq('id', order.id)
      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'dispute_filed',
          customerEmail: order.customer_email,
          customerName: order.customer_name,
          bakerName: baker.business_name,
          bakerEmail: baker.email,
          eventType: order.event_type,
          eventDate: order.event_date,
          orderId: order.id,
          reason: disputeReason,
          filedBy: 'baker',
        }),
      }).catch(() => {})
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'disputed', is_disputed: true } : o))
      setShowDisputeModal(false); setDisputeReason(''); setDisputeDescription(''); setFilingDispute(false)
    }

    return (
      <>
      {/* High-Value Pre-Acceptance Scope Review ($750+) */}
      {showHighValueReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl overflow-y-auto" style={{ maxHeight: '90vh' }}>
            <h3 className="font-bold text-lg mb-1" style={{ color: '#8B4513' }}>High-Value Order — Review Scope</h3>
            <p className="text-xs mb-4" style={{ color: '#5c3d2e' }}>This is a high-value order. Review the full scope before committing.</p>
            <div className="flex flex-col gap-2.5 mb-4 p-4 rounded-xl" style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa' }}>
              {order.scope_serving_count && <div><p className="text-xs font-semibold" style={{ color: '#5c3d2e' }}>Exact Servings</p><p className="text-sm font-medium" style={{ color: '#2d1a0e' }}>{order.scope_serving_count}</p></div>}
              {order.scope_flavor_details && <div><p className="text-xs font-semibold" style={{ color: '#5c3d2e' }}>Flavor Details</p><p className="text-sm font-medium" style={{ color: '#2d1a0e' }}>{order.scope_flavor_details}</p></div>}
              {order.scope_design_description && <div><p className="text-xs font-semibold" style={{ color: '#5c3d2e' }}>Design Description</p><p className="text-sm font-medium" style={{ color: '#2d1a0e' }}>{order.scope_design_description}</p></div>}
              {order.scope_fulfillment_method && <div><p className="text-xs font-semibold" style={{ color: '#5c3d2e' }}>Fulfillment</p><p className="text-sm font-medium capitalize" style={{ color: '#2d1a0e' }}>{order.scope_fulfillment_method}</p></div>}
              <div><p className="text-xs font-semibold" style={{ color: '#5c3d2e' }}>Budget</p><p className="text-sm font-medium" style={{ color: '#2d1a0e' }}>${order.budget}</p></div>
              <div><p className="text-xs font-semibold" style={{ color: '#5c3d2e' }}>Event Date</p><p className="text-sm font-medium" style={{ color: '#2d1a0e' }}>{(() => { const [y,m,d] = order.event_date.split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString([],{month:'long',day:'numeric',year:'numeric'}) })()}</p></div>
            </div>
            <label className="flex items-start gap-2 cursor-pointer mb-4">
              <input type="checkbox" checked={highValueScopeConfirmed} onChange={e => setHighValueScopeConfirmed(e.target.checked)} className="mt-0.5 flex-shrink-0" />
              <span className="text-xs" style={{ color: '#2d1a0e' }}>I confirm I can fulfill this order as described.</span>
            </label>
            <div className="flex gap-3">
              <button onClick={() => { setShowHighValueReview(false); setHighValueScopeConfirmed(false) }} className="flex-1 py-3 rounded-xl border text-sm font-semibold" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>Go Back</button>
              <button onClick={() => { setShowHighValueReview(false); openPriceModal() }} disabled={!highValueScopeConfirmed} className="flex-1 py-3 rounded-xl text-white text-sm font-semibold" style={{ backgroundColor: '#8B4513', opacity: !highValueScopeConfirmed ? 0.5 : 1 }}>Continue to Accept</button>
            </div>
          </div>
        </div>
      )}

      {/* Set Price Modal */}
      {showPriceModal && (() => {
        const priceNum = parseFloat(confirmedPrice) || 0
        const budget = order.budget || 0
        const isAbove = priceNum > budget
        const isBelow = priceNum > 0 && priceNum < budget
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl overflow-y-auto" style={{ maxHeight: '90vh' }}>
              <h3 className="font-bold text-lg mb-1" style={{ color: '#2d1a0e' }}>Set Your Price</h3>
              <p className="text-xs mb-4" style={{ color: '#5c3d2e' }}>Enter your price for this order. If your price matches the customer's budget, confirm it below. If not, adjust it here instead of using Counter Offer.</p>
              <div className="flex flex-col gap-2 mb-4 p-3 rounded-xl" style={{ backgroundColor: '#f5f0eb' }}>
                <div className="flex justify-between text-xs"><span style={{ color: '#5c3d2e' }}>Customer</span><span className="font-semibold" style={{ color: '#2d1a0e' }}>{order.customer_name}</span></div>
                <div className="flex justify-between text-xs"><span style={{ color: '#5c3d2e' }}>Event</span><span className="font-semibold" style={{ color: '#2d1a0e' }}>{order.event_type}</span></div>
                <div className="flex justify-between text-xs"><span style={{ color: '#5c3d2e' }}>Date</span><span className="font-semibold" style={{ color: '#2d1a0e' }}>{(() => { const [y,m,d] = order.event_date.split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString([],{month:'short',day:'numeric',year:'numeric'}) })()}</span></div>
                {order.servings && <div className="flex justify-between text-xs"><span style={{ color: '#5c3d2e' }}>Servings</span><span className="font-semibold" style={{ color: '#2d1a0e' }}>{order.servings}</span></div>}
                <div className="flex justify-between text-xs"><span style={{ color: '#5c3d2e' }}>Customer's Budget</span><span className="font-semibold" style={{ color: '#2d1a0e' }}>${budget}</span></div>
              </div>
              <div className="mb-3">
                <label className="block text-sm font-semibold mb-1" style={{ color: '#2d1a0e' }}>Your Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color: '#5c3d2e' }}>$</span>
                  <input
                    type="number"
                    min={1}
                    value={confirmedPrice}
                    onChange={e => setConfirmedPrice(e.target.value)}
                    className="w-full pl-7 pr-4 py-2.5 rounded-lg border text-sm"
                    style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }}
                    autoFocus
                  />
                </div>
              </div>
              {isAbove && (
                <div className="mb-3 px-4 py-3 rounded-xl text-xs font-semibold" style={{ backgroundColor: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }}>
                  ⚠️ Your price exceeds the customer's budget. Consider using Counter Offer instead so the customer can review and approve the higher price.
                </div>
              )}
              {isBelow && (
                <div className="mb-3 px-4 py-3 rounded-xl text-xs" style={{ backgroundColor: '#f5f0eb', color: '#5c3d2e' }}>
                  Your price is below the customer's budget. The customer will be charged your price of ${priceNum.toFixed(2)}.
                </div>
              )}
              {baker?.tier === 'pro' && (
                <div className="mb-4 p-3 rounded-xl" style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: '#0c4a6e' }}>AI Pricing Insight</p>
                  {aiPricingLoading ? (
                    <p className="text-xs" style={{ color: '#5c3d2e' }}>Analyzing market rates…</p>
                  ) : aiPricing ? (
                    <>
                      <p className="text-sm font-semibold" style={{ color: '#2d1a0e' }}>Market rate: ${aiPricing.low}–${aiPricing.high}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>{aiPricing.reasoning}</p>
                      <p className="text-xs mt-1 opacity-60" style={{ color: '#2d1a0e' }}>Powered by AI · Based on market rates</p>
                    </>
                  ) : null}
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => { setShowPriceModal(false); setConfirmedPrice('') }} className="flex-1 py-3 rounded-xl border text-sm font-semibold" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>Cancel</button>
                <button
                  onClick={() => { setShowPriceModal(false); setShowAcceptModal(true) }}
                  disabled={!priceNum || priceNum <= 0}
                  className="flex-1 py-3 rounded-xl text-white text-sm font-semibold"
                  style={{ backgroundColor: '#2d1a0e', opacity: (!priceNum || priceNum <= 0) ? 0.5 : 1 }}
                >Confirm Price and Continue</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Accept Confirmation Modal */}
      {showAcceptModal && (() => {
        const priceDollars = parseFloat(confirmedPrice) || order.budget
        const priceCents = Math.round(priceDollars * 100)
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="font-bold text-lg mb-4" style={{ color: '#2d1a0e' }}>Confirm Accept Order</h3>
              <div className="flex flex-col gap-2.5 mb-4 p-4 rounded-xl" style={{ backgroundColor: '#f5f0eb' }}>
                <div><p className="text-xs font-semibold" style={{ color: '#5c3d2e' }}>Customer</p><p className="text-sm font-medium" style={{ color: '#2d1a0e' }}>{order.customer_name}</p></div>
                <div><p className="text-xs font-semibold" style={{ color: '#5c3d2e' }}>Event Type</p><p className="text-sm font-medium" style={{ color: '#2d1a0e' }}>{order.event_type}</p></div>
                <div><p className="text-xs font-semibold" style={{ color: '#5c3d2e' }}>Event Date</p><p className="text-sm font-medium" style={{ color: '#2d1a0e' }}>{(() => { const [y,m,d] = order.event_date.split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString([],{month:'long',day:'numeric',year:'numeric'}) })()}</p></div>
                <div><p className="text-xs font-semibold" style={{ color: '#5c3d2e' }}>Your Price</p><p className="text-sm font-bold" style={{ color: '#2d1a0e' }}>${priceDollars.toFixed(2)}</p></div>
                {order.servings && <div><p className="text-xs font-semibold" style={{ color: '#5c3d2e' }}>Servings</p><p className="text-sm font-medium" style={{ color: '#2d1a0e' }}>{order.servings}</p></div>}
                {order.fulfillment_type && <div><p className="text-xs font-semibold" style={{ color: '#5c3d2e' }}>Fulfillment</p><p className="text-sm font-medium capitalize" style={{ color: '#2d1a0e' }}>{order.fulfillment_type}</p></div>}
              </div>
              {priceDollars > 150 && (
                <p className="text-sm font-bold mb-4 px-4 py-3 rounded-xl" style={{ color: '#991b1b', backgroundColor: '#fee2e2' }}>
                  You are committing to make this order. Cancelling after accepting will result in a full refund to the customer and a strike on your account.
                </p>
              )}
              <div className="flex gap-3">
                <button onClick={() => { setShowAcceptModal(false); setShowPriceModal(true) }} className="flex-1 py-3 rounded-xl border text-sm font-semibold" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>Back</button>
                <button onClick={() => { updateOrderStatus(order.id, 'confirmed', priceCents); setShowAcceptModal(false); setConfirmedPrice('') }} className="flex-1 py-3 rounded-xl text-white text-sm font-semibold" style={{ backgroundColor: '#2d1a0e' }}>Yes, Accept Order</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-lg mb-1" style={{ color: '#2d1a0e' }}>Cancel Order</h3>
            <p className="text-xs mb-4" style={{ color: '#5c3d2e' }}>{order.customer_name} · {order.event_type}</p>
            {order.status === 'in_progress' && (
              <div className="mb-4 px-4 py-3 rounded-xl" style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca' }}>
                <p className="text-sm font-bold" style={{ color: '#991b1b' }}>This is a serious action.</p>
                <p className="text-xs mt-0.5" style={{ color: '#991b1b' }}>This order is in progress and the event is approaching. Please contact the customer first before cancelling.</p>
              </div>
            )}
            <div className="mb-3">
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>Reason <span style={{ color: '#dc2626' }}>*</span></label>
              <select value={cancelReason} onChange={e => setCancelReason(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border text-sm" style={{ borderColor: '#e0d5cc', color: cancelReason ? '#2d1a0e' : '#9c7b6b', backgroundColor: '#faf8f6' }}>
                <option value="">Select a reason</option>
                <option value="Scheduling conflict">Scheduling conflict</option>
                <option value="Unable to fulfill this design">Unable to fulfill this design</option>
                <option value="Personal circumstances">Personal circumstances</option>
                <option value="Event date is too soon for my lead time">Event date is too soon for my lead time</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>Additional details (optional)</label>
              <textarea value={cancelDescription} onChange={e => setCancelDescription(e.target.value)} rows={3} placeholder="Any additional context..." className="w-full px-3 py-2.5 rounded-lg border text-sm resize-none" style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
            </div>
            <div className="mb-4 px-4 py-3 rounded-xl" style={{ backgroundColor: '#fef3c7', border: '1px solid #fde68a' }}>
              <p className="text-xs font-bold" style={{ color: '#92400e' }}>Consequence warning</p>
              <p className="text-xs mt-0.5" style={{ color: '#92400e' }}>Cancelling will issue a full refund to the customer and add a strike to your account.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowCancelModal(false); setCancelReason(''); setCancelDescription('') }} className="flex-1 py-3 rounded-xl border text-sm font-semibold" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>Go Back</button>
              <button onClick={handleCancelOrder} disabled={!cancelReason || cancellingOrder} className="flex-1 py-3 rounded-xl text-white text-sm font-semibold" style={{ backgroundColor: '#dc2626', opacity: (!cancelReason || cancellingOrder) ? 0.5 : 1 }}>
                {cancellingOrder ? 'Cancelling...' : 'Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rate Customer Modal */}
      {showRateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-lg mb-1" style={{ color: '#2d1a0e' }}>Rate {order.customer_name}</h3>
            <p className="text-xs mb-4" style={{ color: '#5c3d2e' }}>This rating is private and helps you and other bakers on Whiskly.</p>
            <div className="flex gap-2 mb-4 justify-center">
              {[1,2,3,4,5].map(star => (
                <button key={star} onClick={() => setRateStars(star)} className="text-3xl transition-opacity" style={{ opacity: star <= rateStars ? 1 : 0.3 }}>★</button>
              ))}
            </div>
            <textarea
              value={rateNote}
              onChange={e => setRateNote(e.target.value)}
              rows={3}
              placeholder="Optional private note (only visible to you and Whiskly admins)..."
              className="w-full px-3 py-2.5 rounded-xl border text-sm resize-none mb-4"
              style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }}
            />
            <div className="flex gap-3">
              <button onClick={() => { setShowRateModal(false); setRateStars(5); setRateNote('') }} className="flex-1 py-2.5 rounded-xl border text-sm font-semibold" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>Cancel</button>
              <button onClick={handleRateCustomer} disabled={submittingRating} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: '#2d1a0e', opacity: submittingRating ? 0.5 : 1 }}>
                {submittingRating ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Customer Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-lg mb-2" style={{ color: '#2d1a0e' }}>Block {order.customer_name}?</h3>
            <p className="text-sm mb-5" style={{ color: '#5c3d2e' }}>They won't be able to send you new orders. This action can be reversed by contacting Whiskly support.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowBlockModal(false)} className="flex-1 py-2.5 rounded-xl border text-sm font-semibold" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>Cancel</button>
              <button onClick={handleBlockCustomer} disabled={blockingCustomer} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: '#dc2626', opacity: blockingCustomer ? 0.5 : 1 }}>
                {blockingCustomer ? 'Blocking...' : 'Block Customer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flag Customer Modal */}
      {showFlagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-lg mb-1" style={{ color: '#2d1a0e' }}>Flag {order.customer_name}</h3>
            <p className="text-xs mb-4" style={{ color: '#5c3d2e' }}>Flags are reviewed by Whiskly. If a customer reaches 3 flags, admin is alerted.</p>
            <div className="mb-3">
              <label className="block text-xs font-semibold mb-1" style={{ color: '#2d1a0e' }}>Reason <span style={{ color: '#dc2626' }}>*</span></label>
              <select value={flagReason} onChange={e => setFlagReason(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border text-sm" style={{ borderColor: '#e0d5cc', color: flagReason ? '#2d1a0e' : '#9ca3af', backgroundColor: 'white' }}>
                <option value="">Select a reason...</option>
                <option value="no_show">No-show / didn't pick up order</option>
                <option value="abusive">Abusive or threatening behavior</option>
                <option value="false_dispute">Filed a false dispute</option>
                <option value="payment_issues">Payment or chargeback issues</option>
                <option value="unreasonable_demands">Unreasonable demands</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold mb-1" style={{ color: '#2d1a0e' }}>Description <span style={{ color: '#dc2626' }}>*</span></label>
              <textarea
                value={flagDescription}
                onChange={e => setFlagDescription(e.target.value)}
                rows={3}
                placeholder="Describe what happened (minimum 20 characters)..."
                className="w-full px-3 py-2.5 rounded-xl border text-sm resize-none"
                style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }}
              />
              {flagDescription.trim().length > 0 && flagDescription.trim().length < 20 && (
                <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{20 - flagDescription.trim().length} more characters required</p>
              )}
            </div>
            <p className="text-xs mb-4 px-3 py-2 rounded-lg" style={{ backgroundColor: '#fef9c3', color: '#854d0e' }}>Only submit flags in good faith. Abuse of the flag system may result in your account being reviewed.</p>
            <div className="flex gap-3">
              <button onClick={() => { setShowFlagModal(false); setFlagReason(''); setFlagDescription('') }} className="flex-1 py-2.5 rounded-xl border text-sm font-semibold" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>Cancel</button>
              <button onClick={handleFlagCustomer} disabled={submittingFlag || !flagReason || flagDescription.trim().length < 20} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: '#92400e', opacity: (submittingFlag || !flagReason || flagDescription.trim().length < 20) ? 0.5 : 1 }}>
                {submittingFlag ? 'Submitting...' : 'Submit Flag'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-lg mb-1" style={{ color: '#2d1a0e' }}>File a Dispute</h3>
            <p className="text-xs mb-4" style={{ color: '#5c3d2e' }}>{order.customer_name} · {order.event_type}</p>
            <div className="mb-3">
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>Reason <span style={{ color: '#dc2626' }}>*</span></label>
              <select value={disputeReason} onChange={e => setDisputeReason(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border text-sm" style={{ borderColor: '#e0d5cc', color: disputeReason ? '#2d1a0e' : '#9c7b6b', backgroundColor: '#faf8f6' }}>
                <option value="">Select a reason</option>
                <option value="Customer no-show for pickup">Customer no-show for pickup</option>
                <option value="Customer refusing to pay remainder">Customer refusing to pay remainder</option>
                <option value="False quality claim">False quality claim</option>
                <option value="Customer provided wrong delivery information">Customer provided wrong delivery information</option>
                <option value="Abusive or threatening behavior">Abusive or threatening behavior</option>
                <option value="Attempted to take transaction off-platform">Attempted to take transaction off-platform</option>
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
              <button onClick={() => { setShowDisputeModal(false); setDisputeReason(''); setDisputeDescription('') }} className="flex-1 py-3 rounded-xl border text-sm font-semibold" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>Cancel</button>
              <button onClick={handleBakerFileDispute} disabled={!disputeReason || disputeDescription.trim().length < 20 || filingDispute} className="flex-1 py-3 rounded-xl text-white text-sm font-semibold" style={{ backgroundColor: '#dc2626', opacity: (!disputeReason || disputeDescription.trim().length < 20 || filingDispute) ? 0.5 : 1 }}>
                {filingDispute ? 'Filing...' : 'File Dispute'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#e0d5cc' }}>
        <button onClick={() => setExpanded(!expanded)} className="w-full px-5 py-4 flex items-center justify-between gap-3 text-left" style={{ backgroundColor: expanded ? '#faf8f6' : 'white' }}>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-sm" style={{ color: '#2d1a0e' }}>{order.customer_name}</p>
                {customerIsTrusted && <span className="px-2 py-0.5 text-xs rounded-full font-semibold flex-shrink-0" style={{ backgroundColor: '#dbeafe', color: '#1e3a5f' }}>🛡️ Trusted</span>}
                <span className="px-2 py-0.5 text-xs rounded-full font-semibold flex-shrink-0" style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</span>
                {order.baker_question && !expanded && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#fef9c3', color: '#854d0e' }}>Question sent</span>}
                {order.counter_status === 'pending' && !expanded && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#fff7ed', color: '#c2410c' }}>Counter pending</span>}
                {order.inspiration_photo_urls?.length > 0 && !expanded && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#f5f0eb', color: '#5c3d2e' }}>{order.inspiration_photo_urls.length} photo{order.inspiration_photo_urls.length > 1 ? 's' : ''}</span>}
                {order.is_multi_item && <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>Multi-item order</span>}
              </div>
              <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>
                {order.event_type} · {(() => { const [y,m,d] = (order.event_date).split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString([], {month:'short',day:'numeric',year:'numeric'}) })()}
                {order.budget ? ' · $' + order.budget : ''}
                {order.counter_price && order.counter_status === 'pending' ? ' · Counter: $' + order.counter_price : ''}
                {order.fulfillment_type ? ' · ' + (order.fulfillment_type === 'delivery' ? 'Delivery' : 'Pickup') : ''}
              </p>
              {(() => {
  const daysUntil = getDaysUntil(order.event_date)
  const bakerLeadTime = baker?.lead_time_days || 7
  const isRush = daysUntil >= 0 && daysUntil < bakerLeadTime
  const isEventPassed = daysUntil < 0 && order.status === 'pending'
  const isOverdue = daysUntil < 0 && order.status !== 'complete' && order.status !== 'declined'
  const isPendingTooLong = order.status === 'pending' && ((Date.now() - new Date(order.created_at).getTime()) / 3600000) > 48
  if (isEventPassed) return <p className="text-xs font-semibold mt-1 px-2 py-0.5 rounded-full inline-block" style={{ backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}>Event passed — respond immediately</p>
  if (isOverdue) return <p className="text-xs font-semibold mt-1 px-2 py-0.5 rounded-full inline-block" style={{ backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}>Event date passed</p>
  if (isPendingTooLong) return <p className="text-xs font-semibold mt-1 px-2 py-0.5 rounded-full inline-block" style={{ backgroundColor: '#fef9c3', color: '#854d0e', border: '1px solid #fde68a' }}>Awaiting your response for 48hrs</p>
  if (isRush) return <p className="text-xs font-semibold mt-1 px-2 py-0.5 rounded-full inline-block" style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>Rush order — {daysUntil === 0 ? 'event is today' : daysUntil === 1 ? 'event is tomorrow' : 'event in ' + daysUntil + ' days'}</p>
  return null
})()}
            </div>
          </div>
          <span className="text-xs flex-shrink-0" style={{ color: '#5c3d2e' }}>{expanded ? '▲' : '▼'}</span>
        </button>

        <div className="px-5 pb-3 flex gap-2 flex-wrap" style={{ backgroundColor: expanded ? '#faf8f6' : 'white' }}>
          {order.status === 'pending' && !localAsking && !localCountering && (
            <>
              <button onClick={() => {
                if (order.budget >= 750 && order.scope_serving_count) {
                  setHighValueScopeConfirmed(false)
                  setShowHighValueReview(true)
                } else {
                  openPriceModal()
                }
              }} className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: '#2d1a0e' }}>Accept</button>
              <button onClick={() => { setExpanded(true); setLocalCountering(true) }} className="px-4 py-1.5 rounded-lg text-xs font-semibold border" style={{ borderColor: '#8B4513', color: '#8B4513' }}>Counter Offer</button>
              <button onClick={() => { setExpanded(true); setLocalAsking(true) }} className="px-4 py-1.5 rounded-lg text-xs font-semibold border" style={{ borderColor: '#5c3d2e', color: '#5c3d2e' }}>Ask a Question</button>
              <button onClick={() => updateOrderStatus(order.id, 'declined')} className="px-4 py-1.5 rounded-lg text-xs font-semibold border" style={{ borderColor: '#991b1b', color: '#991b1b' }}>Decline</button>
            </>
          )}
          {order.status === 'countered' && order.counter_status === 'pending' && (
            <span className="px-4 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: '#fff7ed', color: '#c2410c' }}>Counter offer sent — awaiting customer response</span>
          )}
          {order.status === 'confirmed' && (
            <div className="flex flex-col gap-1">
              <button onClick={() => updateOrderStatus(order.id, 'in_progress')} disabled={!order.deposit_paid_at} className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: '#1e40af', opacity: !order.deposit_paid_at ? 0.4 : 1, cursor: !order.deposit_paid_at ? 'not-allowed' : undefined }}>Mark In Progress</button>
              {!order.deposit_paid_at && <span className="text-xs" style={{ color: '#9c7b6b' }}>Waiting for customer deposit</span>}
            </div>
          )}
          {order.status === 'in_progress' && (
            <div className="flex flex-col gap-1">
              <button onClick={() => updateOrderStatus(order.id, 'ready')} disabled={!order.deposit_paid_at} className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: '#6b21a8', opacity: !order.deposit_paid_at ? 0.4 : 1, cursor: !order.deposit_paid_at ? 'not-allowed' : undefined }}>Mark Ready</button>
              {!order.deposit_paid_at && <span className="text-xs" style={{ color: '#9c7b6b' }}>Waiting for customer deposit</span>}
            </div>
          )}
          {order.status === 'ready' && order.fulfillment_type === 'delivery' && (
            <div className="flex flex-col gap-1">
              <button onClick={() => setDeliveryModalOrder(order)} disabled={!order.deposit_paid_at} className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: '#166534', opacity: !order.deposit_paid_at ? 0.4 : 1, cursor: !order.deposit_paid_at ? 'not-allowed' : undefined }}>Mark Delivered</button>
              {!order.deposit_paid_at && <span className="text-xs" style={{ color: '#9c7b6b' }}>Waiting for customer deposit</span>}
            </div>
          )}
          {order.status === 'ready' && order.fulfillment_type === 'pickup' && !order.handoff_photo_url && (
            <div className="flex flex-col gap-1">
              <button onClick={() => setDeliveryModalOrder(order)} disabled={!order.deposit_paid_at} className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: '#1e40af', opacity: !order.deposit_paid_at ? 0.4 : 1, cursor: !order.deposit_paid_at ? 'not-allowed' : undefined }}>Confirm Handoff</button>
              {!order.deposit_paid_at && <span className="text-xs" style={{ color: '#9c7b6b' }}>Waiting for customer deposit</span>}
            </div>
          )}
          {order.status === 'ready' && order.fulfillment_type === 'pickup' && order.handoff_photo_url && <span className="px-4 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>Handoff photo uploaded — awaiting customer confirmation</span>}
          {order.status === 'ready' && !order.fulfillment_type && <button onClick={() => updateOrderStatus(order.id, 'complete')} className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: '#166634' }}>Mark Complete</button>}
          {(order.status === 'confirmed' || order.status === 'in_progress') && (
            <button onClick={() => setShowCancelModal(true)} className="px-4 py-1.5 rounded-lg text-xs font-semibold border" style={{ borderColor: '#dc2626', color: '#dc2626' }}>Cancel Order</button>
          )}
          {canDispute && (
            <button onClick={() => setShowDisputeModal(true)} className="px-4 py-1.5 rounded-lg text-xs font-semibold border" style={{ borderColor: '#92400e', color: '#92400e' }}>File Dispute</button>
          )}
          {order.status === 'complete' && !alreadyRated && (
            <button onClick={() => setShowRateModal(true)} className="px-4 py-1.5 rounded-lg text-xs font-semibold border" style={{ borderColor: '#5c3d2e', color: '#5c3d2e' }}>Rate Customer</button>
          )}
          {(order.status === 'complete' || order.status === 'declined') && (
            <div className="relative">
              <button onClick={() => setShowDotsMenu(v => !v)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>⋯</button>
              {showDotsMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border z-30 min-w-36 overflow-hidden" style={{ borderColor: '#e0d5cc' }}>
                  <button onClick={() => { setShowDotsMenu(false); setShowBlockModal(true) }} className="w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-[#faf8f6]" style={{ color: '#dc2626' }}>Block Customer</button>
                  <button onClick={() => { setShowDotsMenu(false); setShowFlagModal(true) }} className="w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-[#faf8f6] border-t" style={{ borderColor: '#f5f0eb', color: '#92400e' }}>Flag Customer</button>
                </div>
              )}
            </div>
          )}
        </div>

        {expanded && (
          <div className="px-5 pb-5 flex flex-col gap-3 border-t" style={{ borderColor: '#e0d5cc', backgroundColor: 'white' }}>
            <div className="grid grid-cols-2 gap-3 pt-4">
              {order.servings && <div><p className="text-xs font-semibold" style={{ color: '#5c3d2e' }}>Servings</p><p className="text-sm" style={{ color: '#2d1a0e' }}>{order.servings}</p></div>}
              {order.budget > 0 && <div><p className="text-xs font-semibold" style={{ color: '#5c3d2e' }}>Customer Budget</p><p className="text-sm" style={{ color: '#2d1a0e' }}>${order.budget}</p></div>}
              {order.counter_price && <div><p className="text-xs font-semibold" style={{ color: '#c2410c' }}>Your Counter Offer</p><p className="text-sm font-bold" style={{ color: '#c2410c' }}>${order.counter_price}</p></div>}
              {order.flavor_preferences && <div className="col-span-2"><p className="text-xs font-semibold" style={{ color: '#5c3d2e' }}>Flavors</p><p className="text-sm" style={{ color: '#2d1a0e' }}>{order.flavor_preferences}</p></div>}
              {order.allergen_notes && <div className="col-span-2"><p className="text-xs font-semibold" style={{ color: '#5c3d2e' }}>Allergens / Dietary</p><p className="text-sm" style={{ color: '#2d1a0e' }}>{order.allergen_notes}</p></div>}
            </div>

            {order.fulfillment_type === 'delivery' && (
              <div className="px-3 py-2.5 rounded-xl" style={{ backgroundColor: '#f5f0eb' }}>
                <p className="text-xs font-semibold mb-0.5" style={{ color: '#2d1a0e' }}>Delivery Address</p>
                {isAccepted && order.delivery_address ? (
                  <a href={'https://maps.google.com/?q=' + encodeURIComponent(order.delivery_address)} target="_blank" rel="noopener noreferrer" className="text-sm font-medium underline" style={{ color: '#2d1a0e' }}>{order.delivery_address}</a>
                ) : (
                  <p className="text-xs" style={{ color: '#5c3d2e' }}>
                    {order.delivery_city ? order.delivery_city + (order.delivery_state ? ', ' + order.delivery_state : '') + (order.delivery_zip ? ' ' + order.delivery_zip : '') : 'Address not provided'}
                    {!isAccepted && <span className="ml-1 italic"> · Full address unlocks when you accept</span>}
                  </p>
                )}
              </div>
            )}

            {order.fulfillment_type === 'pickup' && (
              <div className="px-3 py-2.5 rounded-xl" style={{ backgroundColor: '#f5f0eb' }}>
                <p className="text-xs font-semibold mb-0.5" style={{ color: '#2d1a0e' }}>Pickup</p>
                <p className="text-xs" style={{ color: '#5c3d2e' }}>Customer will pick up from your location</p>
              </div>
            )}

            {order.item_description && <div><p className="text-xs font-semibold mb-1" style={{ color: '#5c3d2e' }}>Description</p><p className="text-sm leading-relaxed" style={{ color: '#2d1a0e' }}>{order.item_description}</p></div>}

            {order.is_multi_item && (order.line_items || []).length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: '#2d1a0e' }}>Additional Items</p>
                <div className="flex flex-col gap-1.5">
                  {(order.line_items as any[]).map((li: any, i: number) => (
                    <div key={i} className="px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>
                      <span className="font-semibold">{li.item_type || 'Item'}</span>
                      {li.servings ? <span> · {li.servings} servings</span> : null}
                      {li.description ? <span> · {li.description}</span> : null}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {order.size_reduction_requested && (!order.size_reduction_status || order.size_reduction_status === 'pending') && (
              <SizeReductionBakerCard order={order} baker={baker} setOrders={setOrders} />
            )}

            {order.inspiration_photo_urls?.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: '#2d1a0e' }}>Inspiration Photos</p>
                <div className="flex gap-2 flex-wrap">
                  {order.inspiration_photo_urls.map((url: string, i: number) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img src={url} alt={'Inspiration ' + (i + 1)} className="w-24 h-24 object-cover rounded-xl border hover:opacity-90 transition-opacity" style={{ borderColor: '#e0d5cc' }} />
                    </a>
                  ))}
                </div>
                <p className="text-xs mt-1.5 italic" style={{ color: '#5c3d2e' }}>For reference only, not exact replication</p>
              </div>
            )}

            <div className="pt-1 flex items-center gap-3 flex-wrap">
              <p className="text-xs" style={{ color: '#5c3d2e' }}>{order.customer_email}</p>
              {loadedCustomerRating && (
                customerAvgRating !== null && customerRatingCount > 0
                  ? <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#fef9c3', color: '#854d0e' }}>★ {customerAvgRating.toFixed(1)} from {customerRatingCount} order{customerRatingCount !== 1 ? 's' : ''}</span>
                  : <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#f5f0eb', color: '#5c3d2e' }}>New customer — no rating yet</span>
              )}
              {customerIsTrusted && <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#dbeafe', color: '#1e3a5f' }}>🛡️ Trusted Member</span>}
              {order.status === 'complete' && alreadyRated && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>You rated this customer</span>
              )}
            </div>

            {order.baker_question && <div className="px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: '#fef9c3', color: '#854d0e' }}>Question sent: "{order.baker_question}"</div>}

            {order.counter_status === 'accepted' && (
              <div className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>
                Customer accepted your counter offer of ${order.counter_price}
              </div>
            )}

            {order.counter_status === 'declined' && (
              <div className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>
                Customer declined your counter offer of ${order.counter_price}
              </div>
            )}

            {localCountering && (
              <div className="flex flex-col gap-2 p-3 rounded-xl" style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa' }}>
                <p className="text-xs font-semibold" style={{ color: '#c2410c' }}>Send a counter offer:</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold" style={{ color: '#2d1a0e' }}>$</span>
                  <input type="number" value={localCounterPrice} onChange={e => setLocalCounterPrice(e.target.value)} placeholder={order.budget?.toString() || '0'} className="flex-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#fed7aa', color: '#2d1a0e', backgroundColor: 'white' }} />
                </div>
                <p className="text-xs" style={{ color: '#5c3d2e' }}>Customer budget: <strong>${order.budget}</strong></p>
                <textarea value={localCounterMessage} onChange={e => setLocalCounterMessage(e.target.value)} rows={2} placeholder="Optional note — e.g. This design requires additional detail work..." className="w-full px-3 py-2 rounded-lg border text-sm resize-none" style={{ borderColor: '#fed7aa', color: '#2d1a0e', backgroundColor: 'white' }} />
                <div className="flex gap-2">
                  <button onClick={handleSendCounter} disabled={localCounterSending || !localCounterPrice.trim()} className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: '#8B4513', opacity: (!localCounterPrice.trim() || localCounterSending) ? 0.5 : 1 }}>
                    {localCounterSending ? 'Sending...' : 'Send Counter Offer'}
                  </button>
                  <button onClick={() => { setLocalCountering(false); setLocalCounterPrice(''); setLocalCounterMessage('') }} className="px-4 py-1.5 rounded-lg text-xs font-semibold border" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>Cancel</button>
                </div>
              </div>
            )}

            {localAsking && (
              <div className="flex flex-col gap-2 p-3 rounded-xl" style={{ backgroundColor: '#f5f0eb' }}>
                <p className="text-xs font-semibold" style={{ color: '#2d1a0e' }}>Ask the customer a question:</p>
                <textarea value={localQuestion} onChange={e => setLocalQuestion(e.target.value)} rows={2} placeholder="e.g. Do you have a specific flavor in mind? What's your guest count?" autoFocus className="w-full px-3 py-2 rounded-lg border text-sm resize-none" style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: 'white' }} />
                <div className="flex gap-2">
                  <button onClick={handleSendQuestion} disabled={localSending || !localQuestion.trim()} className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: '#2d1a0e', opacity: (!localQuestion.trim() || localSending) ? 0.5 : 1 }}>
                    {localSending ? 'Sending...' : 'Send Question'}
                  </button>
                  <button onClick={() => { setLocalAsking(false); setLocalQuestion('') }} className="px-4 py-1.5 rounded-lg text-xs font-semibold border" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      </>
    )
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#f5f0eb' }}>
      {/* Plan Selection Modal — shown once after first approval */}
      {showPlanModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(45,26,14,0.75)' }}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-6 pt-6 pb-5" style={{ backgroundColor: '#2d1a0e' }}>
              <h2 className="text-xl font-bold text-white mb-1">Welcome to Whiskly</h2>
              <p className="text-sm" style={{ color: '#c4a882' }}>You've been approved. Choose how you'd like to list on Whiskly.</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Free tier */}
                <div className="rounded-2xl p-4 border-2" style={{ borderColor: '#e0d5cc', backgroundColor: '#faf8f6' }}>
                  <p className="font-bold text-base mb-1" style={{ color: '#2d1a0e' }}>Free</p>
                  <p className="text-2xl font-bold mb-0.5" style={{ color: '#2d1a0e' }}>$0<span className="text-sm font-normal">/mo</span></p>
                  <p className="text-xs mb-3 font-medium" style={{ color: '#8B4513' }}>10% commission per order</p>
                  <ul className="text-xs flex flex-col gap-1.5" style={{ color: '#5c3d2e' }}>
                    <li>✓ Order management</li>
                    <li>✓ Customer messaging</li>
                    <li>✓ 3 portfolio photos</li>
                    <li>✓ Reviews &amp; ratings</li>
                  </ul>
                </div>
                {/* Pro tier */}
                <div className="rounded-2xl p-4 border-2 relative" style={{ borderColor: '#8B4513', backgroundColor: '#fff7f0' }}>
                  {proBakerCount < 50 && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold text-white whitespace-nowrap" style={{ backgroundColor: '#8B4513' }}>
                      Founding Baker
                    </div>
                  )}
                  <p className="font-bold text-base mb-1" style={{ color: '#2d1a0e' }}>Pro</p>
                  <p className="text-2xl font-bold mb-0.5" style={{ color: '#8B4513' }}>
                    ${proBakerCount < 50 ? '19' : '29'}<span className="text-sm font-normal">/mo</span>
                  </p>
                  <p className="text-xs mb-1 font-medium" style={{ color: '#8B4513' }}>7% commission per order</p>
                  {proBakerCount < 50 && (
                    <p className="text-xs mb-2 font-semibold" style={{ color: '#8B4513' }}>Locked in forever · {50 - proBakerCount} spot{50 - proBakerCount !== 1 ? 's' : ''} left</p>
                  )}
                  <ul className="text-xs flex flex-col gap-1.5" style={{ color: '#5c3d2e' }}>
                    <li>✓ Featured placement</li>
                    <li>✓ Verified badge</li>
                    <li>✓ 10 portfolio photos</li>
                    <li>✓ Analytics + booking link</li>
                  </ul>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => handlePlanSelection('free')} className="flex-1 py-3 rounded-xl border font-semibold text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e' }}>Start Free</button>
                <button onClick={() => handlePlanSelection('pro')} className="flex-1 py-3 rounded-xl text-white font-semibold text-sm" style={{ backgroundColor: '#8B4513' }}>Upgrade to Pro →</button>
              </div>
              <p className="text-xs text-center mt-3" style={{ color: '#9c7b6b' }}>You can always upgrade later from your profile settings.</p>
            </div>
          </div>
        </div>
      )}

      {/* Vacation Conflict Modal */}
      {vacConflictOrders.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-lg mb-2" style={{ color: '#2d1a0e' }}>Vacation Conflict</h3>
            <p className="text-sm mb-3" style={{ color: '#5c3d2e' }}>These confirmed or in-progress orders fall within your vacation dates. You'll need to handle them before or during your vacation:</p>
            <div className="mb-4 flex flex-col gap-2">
              {vacConflictOrders.map(o => (
                <div key={o.id} className="px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: '#fef9c3', color: '#854d0e' }}>
                  <strong>{o.customer_name}</strong> · {o.event_type} · {(() => { const [y,m,d] = o.event_date.split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString([],{month:'short',day:'numeric',year:'numeric'}) })()}
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setVacConflictOrders([]); setPendingVacSave(null) }} className="flex-1 py-2.5 rounded-xl border text-sm font-semibold" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>Cancel — don't save</button>
              <button onClick={async () => {
                if (!pendingVacSave) return
                setSavingVacation(true)
                const { data: newVac } = await supabase.from('baker_vacations').insert({ baker_id: baker.id, start_date: pendingVacSave.start, end_date: pendingVacSave.end, label: pendingVacSave.label.trim() || null }).select().single()
                if (newVac) setPlannedVacations(prev => [...prev, newVac].sort((a, b) => a.start_date.localeCompare(b.start_date)))
                setVacStartDate(''); setVacEndDate(''); setVacLabel('')
                setVacConflictOrders([]); setPendingVacSave(null); setSavingVacation(false)
              }} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ backgroundColor: '#2d1a0e' }}>Save anyway — I'll handle these orders</button>
            </div>
          </div>
        </div>
      )}

      {deliveryModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-lg mb-1" style={{ color: '#2d1a0e' }}>{deliveryModalOrder.fulfillment_type === 'delivery' ? 'Confirm Delivery' : 'Confirm Handoff'}</h3>
            <p className="text-xs mb-5" style={{ color: '#5c3d2e' }}>{deliveryModalOrder.fulfillment_type === 'delivery' ? 'Upload a photo as proof of delivery. This protects both you and the customer.' : 'Upload a photo of the order ready for pickup. The customer will confirm receipt.'}</p>
            <div className="mb-4">
              <label className="block text-xs font-semibold mb-2" style={{ color: '#2d1a0e' }}>Proof Photo <span style={{ color: '#dc2626' }}>*</span></label>
              {deliveryPhotoPreview ? (
                <div className="relative">
                  <img src={deliveryPhotoPreview} alt="Proof" className="w-full h-48 object-cover rounded-xl border" style={{ borderColor: '#e0d5cc' }} />
                  <button onClick={() => { setDeliveryPhoto(null); setDeliveryPhotoPreview(null) }} className="absolute top-2 right-2 w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center" style={{ backgroundColor: '#991b1b' }}>✕</button>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center justify-center w-full h-36 rounded-xl border-2 border-dashed gap-2" style={{ borderColor: '#e0d5cc', backgroundColor: '#faf8f6' }}>
                  <span className="text-2xl font-light" style={{ color: '#5c3d2e' }}>+</span>
                  <span className="text-xs font-medium" style={{ color: '#5c3d2e' }}>Tap to upload photo</span>
                  <input ref={deliveryPhotoRef} type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) { setDeliveryPhoto(file); const reader = new FileReader(); reader.onload = ev => setDeliveryPhotoPreview(ev.target?.result as string); reader.readAsDataURL(file) } }} />
                </label>
              )}
            </div>
            {(baker?.tier === 'pro' || deliveryModalOrder.fulfillment_type === 'pickup') && (
              <div className="mb-5">
                <label className="block text-xs font-semibold mb-1" style={{ color: '#2d1a0e' }}>Care & Storage Instructions</label>
                <textarea value={careInstructions} onChange={e => setCareInstructions(e.target.value)} rows={3} placeholder="e.g. Keep refrigerated. Best served at room temperature. Consume within 3 days." className="w-full px-3 py-2.5 rounded-xl border text-sm resize-none" style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => { setDeliveryModalOrder(null); setDeliveryPhoto(null); setDeliveryPhotoPreview(null); setCareInstructions('') }} className="flex-1 py-3 rounded-xl border text-sm font-semibold" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>Cancel</button>
              <button onClick={() => deliveryModalOrder.fulfillment_type === 'delivery' ? submitDelivery(deliveryModalOrder) : submitHandoff(deliveryModalOrder)} disabled={!deliveryPhoto || submittingDelivery} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: '#2d1a0e', opacity: (!deliveryPhoto || submittingDelivery) ? 0.5 : 1 }}>
                {submittingDelivery ? 'Submitting...' : deliveryModalOrder.fulfillment_type === 'delivery' ? 'Confirm Delivery' : 'Confirm Handoff'}
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="flex items-center justify-between px-8 py-4 bg-white shadow-sm">
        <Link href="/" className="text-2xl font-bold" style={{ color: '#2d1a0e' }}>Whiskly</Link>
        <p className="text-sm font-medium" style={{ color: '#5c3d2e' }}>Baker Dashboard</p>
        <div className="flex items-center gap-3">
          <Link href={'/bakers/' + baker?.id} className="px-4 py-2 text-sm rounded-lg border" style={{ borderColor: '#2d1a0e', color: '#2d1a0e' }}>View Profile</Link>
          <Link href="/account/settings" className="px-4 py-2 text-sm rounded-lg border" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>Account Settings</Link>
          <button onClick={handleSignOut} className="px-4 py-2 text-sm rounded-lg text-white" style={{ backgroundColor: '#2d1a0e' }}>Sign Out</button>
        </div>
      </nav>

      <div className="px-4 md:px-8 py-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold" style={{ color: '#2d1a0e' }}>{businessName || 'Your Bakery'}</h1>
            {baker?.is_top_baker && (
              <span className="px-3 py-1 rounded-full text-sm font-semibold" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>⭐ Top Baker</span>
            )}
          </div>
          <p className="text-sm mt-1" style={{ color: '#5c3d2e' }}>Manage your profile and customer requests</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center"><p className="text-3xl font-bold" style={{ color: '#2d1a0e' }}>{pending.length}</p><p className="text-sm mt-1" style={{ color: '#5c3d2e' }}>Pending</p></div>
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center"><p className="text-3xl font-bold" style={{ color: '#2d1a0e' }}>{confirmed.length}</p><p className="text-sm mt-1" style={{ color: '#5c3d2e' }}>Accepted</p></div>
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center"><p className="text-3xl font-bold" style={{ color: '#1e40af' }}>{inProgress.length}</p><p className="text-sm mt-1" style={{ color: '#5c3d2e' }}>In Progress</p></div>
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center"><p className="text-3xl font-bold" style={{ color: '#2d1a0e' }}>{orders.length}</p><p className="text-sm mt-1" style={{ color: '#5c3d2e' }}>Total</p></div>
        </div>

        {(() => {
          const trackedOrders = orders.filter(o => o.status !== 'cancelled' && o.referral_source)
          const whisklyCount = trackedOrders.filter(o => o.referral_source === 'whiskly_search').length
          const ownCount = trackedOrders.filter(o => o.referral_source !== 'whiskly_search').length
          const total = trackedOrders.length
          const whisklyPct = total > 0 ? Math.round((whisklyCount / total) * 100) : 0
          const ownPct = total > 0 ? 100 - whisklyPct : 0
          return (
            <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
              <p className="font-bold mb-3" style={{ color: '#2d1a0e' }}>Where your orders come from</p>
              {total > 0 && (
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="rounded-xl p-4 text-center" style={{ backgroundColor: '#f5f0eb' }}>
                    <p className="text-2xl font-bold" style={{ color: '#2d1a0e' }}>{whisklyCount}</p>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: '#5c3d2e' }}>Via Whiskly</p>
                    <p className="text-xs mt-0.5" style={{ color: '#9c7b6b' }}>{whisklyPct}%</p>
                  </div>
                  <div className="rounded-xl p-4 text-center" style={{ backgroundColor: '#f5f0eb' }}>
                    <p className="text-2xl font-bold" style={{ color: '#2d1a0e' }}>{ownCount}</p>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: '#5c3d2e' }}>Your own marketing</p>
                    <p className="text-xs mt-0.5" style={{ color: '#9c7b6b' }}>{ownPct}%</p>
                  </div>
                </div>
              )}
              <p className="text-xs" style={{ color: '#9c7b6b' }}>Tracking started recently. This data grows with each new order.</p>
            </div>
          )
        })()}

        {(() => {
          const now = Date.now()
          const attentionItems: { orderId: string; label: string; name: string; eventType: string; eventDate: string }[] = []
          for (const o of orders) {
            const daysUntilEvent = o.event_date ? Math.round((new Date(o.event_date + 'T00:00:00').getTime() - now) / 86400000) : null
            const hoursSinceCreated = (now - new Date(o.created_at).getTime()) / 3600000
            if (o.status === 'pending' && hoursSinceCreated > 24)
              attentionItems.push({ orderId: o.id, label: 'New request — awaiting your response', name: o.customer_name, eventType: o.event_type, eventDate: o.event_date })
            if (o.status === 'confirmed' && !o.deposit_paid_at && daysUntilEvent !== null && daysUntilEvent <= 14)
              attentionItems.push({ orderId: o.id, label: 'Deposit not paid — event approaching', name: o.customer_name, eventType: o.event_type, eventDate: o.event_date })
            if (o.size_reduction_requested && (!o.size_reduction_status || o.size_reduction_status === 'pending'))
              attentionItems.push({ orderId: o.id, label: 'Size reduction request from customer', name: o.customer_name, eventType: o.event_type, eventDate: o.event_date })
            if (o.status === 'in_progress' && daysUntilEvent !== null && daysUntilEvent <= 7 && daysUntilEvent >= 0)
              attentionItems.push({ orderId: o.id, label: 'Event in ' + daysUntilEvent + ' day' + (daysUntilEvent !== 1 ? 's' : '') + ' — is your order on track?', name: o.customer_name, eventType: o.event_type, eventDate: o.event_date })
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
                      <button onClick={() => setActiveTab('orders')} className="flex-shrink-0 px-4 py-2 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: '#dc2626' }}>View Order</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })()}

        <div className="flex gap-2 mb-6 flex-wrap">
          {['Overview', 'Orders', 'Messages', 'Profile', 'Gallery'].map((tab) => (
            <button key={tab} onClick={() => { setActiveTab(tab.toLowerCase()); if (tab === 'Messages') setUnreadCount(0) }}
              className="px-5 py-2 rounded-lg text-sm font-semibold relative"
              style={{ backgroundColor: activeTab === tab.toLowerCase() ? '#2d1a0e' : 'white', color: activeTab === tab.toLowerCase() ? 'white' : '#2d1a0e' }}>
              {tab}
              {tab === 'Orders' && (pending.length + countered.length) > 0 && (
                <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: activeTab === 'orders' ? 'rgba(255,255,255,0.25)' : '#2d1a0e', color: 'white' }}>{pending.length + countered.length}</span>
              )}
              {tab === 'Messages' && unreadCount > 0 && (
                <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: '#dc2626', color: 'white' }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="flex flex-col gap-6">

            {/* Profile Completion Checklist — shown whenever any of the six items is incomplete */}
            {(() => {
              const checks = [
                { label: 'Profile photo uploaded', done: !!baker?.profile_photo_url, tab: 'profile' },
                { label: 'At least 3 portfolio photos', done: portfolio.length >= 3, tab: 'gallery' },
                { label: 'Starting price set', done: !!(baker?.starting_price && baker.starting_price > 0), tab: 'profile' },
                { label: 'Bio written', done: !!(baker?.bio && baker.bio.trim().length > 0), tab: 'profile' },
                { label: 'Plan selected (Free or Pro)', done: !!baker?.tier, tab: 'profile' },
                { label: 'Stripe payout connected', done: !!baker?.stripe_account_id, tab: 'profile', isStripe: true },
              ]
              const doneCount = checks.filter(c => c.done).length
              if (doneCount === 6) return null
              return (
                <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ borderLeft: '4px solid #8B4513' }}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-bold" style={{ color: '#2d1a0e' }}>Complete your profile</h2>
                      <p className="text-sm mt-0.5" style={{ color: '#5c3d2e' }}>Finish all 6 steps to appear on the Browse Bakers page.</p>
                    </div>
                    <span className="text-sm font-bold px-3 py-1 rounded-full flex-shrink-0 ml-4" style={{ backgroundColor: doneCount === 6 ? '#dcfce7' : '#f5f0eb', color: doneCount === 6 ? '#166534' : '#8B4513' }}>{doneCount}/6</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {(checks as any[]).map((item, i) => (
                      <div key={i}>
                        <button onClick={() => setActiveTab(item.tab)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-left w-full transition-opacity hover:opacity-80"
                          style={{ backgroundColor: item.done ? '#f0fdf4' : '#faf8f6', border: '1px solid ' + (item.done ? '#bbf7d0' : '#e0d5cc') }}>
                          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: item.done ? '#dcfce7' : '#e0d5cc' }}>
                            {item.done ? (
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6l3 3 5-5" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            ) : (
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#9c7b6b' }} />
                            )}
                          </div>
                          <span className="text-sm font-medium flex-1" style={{ color: item.done ? '#15803d' : '#2d1a0e' }}>{item.label}</span>
                          {!item.done && (
                            <span className="text-xs font-semibold" style={{ color: '#8B4513' }}>Complete →</span>
                          )}
                        </button>
                        {item.isStripe && !item.done && (
                          <div className="mt-1.5 px-4 py-3 rounded-xl" style={{ backgroundColor: '#faf8f6', border: '1px solid #5c3d2e' }}>
                            <p className="text-xs leading-relaxed mb-2" style={{ color: '#5c3d2e' }}>When Stripe asks for your website, use your Whiskly profile link:</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium flex-1 truncate" style={{ color: '#2d1a0e' }}>https://www.whiskly.co/bakers/{baker?.id}</span>
                              <button onClick={(e) => { e.stopPropagation(); copyStripeUrl() }}
                                className="text-xs font-semibold px-2.5 py-1 rounded-lg flex-shrink-0"
                                style={{ backgroundColor: '#2d1a0e', color: 'white' }}>
                                {copiedStripeUrl ? 'Copied!' : 'Copy'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* Touch 2: 5 completed orders — commission savings nudge */}
            {!dismissedTouch2 && (() => {
              const completedOrds = orders.filter(o => o.status === 'complete')
              const isFreeTier = baker?.tier !== 'pro'
              if (completedOrds.length < 5 || !isFreeTier) return null
              const totalOrderValue = completedOrds.slice(0, 5).reduce((sum, o) => sum + (o.amount_total ? o.amount_total / 100 : (o.budget || 0)), 0)
              const savings = (totalOrderValue * 0.03).toFixed(2)
              return (
                <div className="rounded-2xl p-5 flex items-start gap-4" style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa' }}>
                  <div className="flex-1">
                    <p className="font-bold text-sm mb-1" style={{ color: '#c2410c' }}>You could have saved ${savings} in commission</p>
                    <p className="text-xs leading-relaxed" style={{ color: '#92400e' }}>
                      Pro bakers pay 7% commission instead of 10%. On your first 5 completed orders, that's ${savings} you could have kept. The more you earn, the more the difference adds up.
                    </p>
                    <a href="/join?plan=pro" className="inline-block mt-3 px-4 py-2 rounded-lg text-white text-xs font-semibold" style={{ backgroundColor: '#8B4513' }}>Upgrade to Pro</a>
                  </div>
                  <button onClick={dismissTouch2Banner} className="text-xs font-semibold px-2 py-1 rounded-lg flex-shrink-0" style={{ color: '#92400e', backgroundColor: '#fed7aa' }}>Dismiss</button>
                </div>
              )
            })()}

            {/* Touch 3: 30-day prompt */}
            {!dismissedTouch3 && (() => {
              const accountAgeDays = baker ? Math.floor((Date.now() - new Date(baker.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0
              const isFreeTier = baker?.tier !== 'pro'
              if (accountAgeDays < 30 || !isFreeTier) return null
              const isFoundingAvailable = proBakerCount < 50
              const spotsLeft = Math.max(0, 50 - proBakerCount)
              return (
                <div className="rounded-2xl p-5 flex items-start gap-4" style={{ backgroundColor: '#f5f0ff', border: '1px solid #ddd6fe' }}>
                  <div className="flex-1">
                    {isFoundingAvailable ? (
                      <>
                        <p className="font-bold text-sm mb-1" style={{ color: '#5b21b6' }}>Founding Baker pricing closes soon</p>
                        <p className="text-xs leading-relaxed" style={{ color: '#6d28d9' }}>
                          Founding Baker pricing ($14/month or $99/year, locked for 3 years) is available to the first 50 bakers only. {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} remaining.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-bold text-sm mb-1" style={{ color: '#5b21b6' }}>Stand out on Whiskly</p>
                        <p className="text-xs leading-relaxed" style={{ color: '#6d28d9' }}>
                          Pro bakers receive featured placement in browse results and a Verified badge — making it easier for customers to find and trust you.
                        </p>
                      </>
                    )}
                    <a href="/join?plan=pro" className="inline-block mt-3 px-4 py-2 rounded-lg text-white text-xs font-semibold" style={{ backgroundColor: '#5b21b6' }}>Upgrade to Pro</a>
                  </div>
                  <button onClick={dismissTouch3Banner} className="text-xs font-semibold px-2 py-1 rounded-lg flex-shrink-0" style={{ color: '#5b21b6', backgroundColor: '#ddd6fe' }}>Dismiss</button>
                </div>
              )
            })()}

            {(() => {
              const completed = orders.filter(o => o.status === 'complete')
              const totalRevenue = completed.reduce((sum, o) => sum + ((o.amount_total || (o.budget && o.budget * 100) || 0) / 100 * 0.88), 0)
              const pendingRevenue = orders.filter(o => o.status === 'confirmed' || o.status === 'in_progress' || o.status === 'ready').reduce((sum, o) => sum + ((o.budget || 0) * 0.88), 0)
              return (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-lg font-bold mb-4" style={{ color: '#2d1a0e' }}>Earnings Overview</h2>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="rounded-xl p-4 text-center" style={{ backgroundColor: '#f5f0eb' }}>
                      <p className="text-2xl font-bold" style={{ color: '#2d1a0e' }}>${totalRevenue >= 1000 ? (totalRevenue / 1000).toFixed(1) + 'K' : totalRevenue.toFixed(0)}</p>
                      <p className="text-xs mt-1" style={{ color: '#5c3d2e' }}>Total Earned</p>
                    </div>
                    <div className="rounded-xl p-4 text-center" style={{ backgroundColor: '#f5f0eb' }}>
                      <p className="text-2xl font-bold" style={{ color: '#2d1a0e' }}>{completed.length}</p>
                      <p className="text-xs mt-1" style={{ color: '#5c3d2e' }}>Completed Orders</p>
                    </div>
                    <div className="rounded-xl p-4 text-center" style={{ backgroundColor: '#f5f0eb' }}>
                      <p className="text-2xl font-bold" style={{ color: '#8B4513' }}>${pendingRevenue >= 1000 ? (pendingRevenue / 1000).toFixed(1) + 'K' : pendingRevenue.toFixed(0)}</p>
                      <p className="text-xs mt-1" style={{ color: '#5c3d2e' }}>In Pipeline</p>
                    </div>
                  </div>
                  {completed.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold mb-2" style={{ color: '#5c3d2e' }}>Recent completed orders</p>
                      <div className="flex flex-col gap-2">
                        {completed.slice(0, 5).map(o => (
                          <div key={o.id} className="flex items-center justify-between text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: '#faf8f6' }}>
                            <div>
                              <p className="font-medium text-xs" style={{ color: '#2d1a0e' }}>{o.customer_name}</p>
                              <p className="text-xs" style={{ color: '#5c3d2e' }}>{o.event_type}</p>
                            </div>
                            <p className="text-xs font-semibold" style={{ color: '#2d1a0e' }}>${((o.amount_total || (o.budget && o.budget * 100) || 0) / 100 * 0.88).toFixed(0)}</p>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs mt-3" style={{ color: '#5c3d2e' }}>* Amounts shown after 12% platform fee. Beta period: no fees charged.</p>
                    </div>
                  )}
                  {completed.length === 0 && <p className="text-sm text-center py-4" style={{ color: '#5c3d2e' }}>No completed orders yet — earnings will appear here.</p>}
                </div>
              )
            })()}

            {/* Reserve Balance Section */}
            {(() => {
              const reserveBalance: number = reserveData?.balance ?? 0
              const reserveCap = 500
              const reservePct = Math.min(100, (reserveBalance / reserveCap) * 100)
              const isEligible: boolean = reserveData?.is_instant_payout_eligible ?? false
              const isElected: boolean = baker?.instant_payout_enabled ?? false
              const completedOrders: number = reserveData?.completed_orders_count ?? 0
              const accountAgeDays = baker ? Math.floor((Date.now() - new Date(baker.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0

              const criteria = [
                { label: `5 completed orders (${completedOrders} so far)`, met: completedOrders >= 5, tip: 'Orders where the customer confirmed delivery and the 3-day dispute window has closed without issue.' },
                { label: 'Account active for 30 days', met: accountAgeDays >= 30, tip: 'Your baker account must be at least 30 days old from your approval date.' },
                { label: `Reserve balance of $100 or more ($${reserveBalance.toFixed(2)} current)`, met: reserveBalance >= 100, tip: 'Whiskly holds 5% of each payout in a reserve balance up to a $500 cap. You need at least $100 in reserve before instant payouts unlock.' },
                { label: 'No disputes in the past 90 days', met: recentDisputeCount === 0, tip: 'You have no unresolved disputes or disputes decided against you in the last 90 days.' },
                { label: 'Identity verified', met: baker?.verified === true, tip: 'Stripe has confirmed your identity through your payout account setup. Complete your Stripe Connect onboarding fully to satisfy this requirement.' },
              ]

              const txTypeLabel = (t: string) =>
                t === 'withhold' ? 'Reserve Hold'
                : t === 'quarterly_release' ? 'Quarterly Release'
                : t === 'dispute_draw' ? 'Dispute Draw'
                : t

              const trancheTypeLabel = (t: string) =>
                t === 'ingredient_advance' ? 'Ingredient Advance'
                : t === 'final_payout' ? 'Final Payout'
                : t

              return (
                <div className="flex flex-col gap-4">
                  {/* 1. Reserve balance card */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold mb-4" style={{ color: '#2d1a0e' }}>Reserve Balance</h2>
                    <div className="flex items-end justify-between mb-2">
                      <p className="text-3xl font-bold" style={{ color: '#2d1a0e' }}>${reserveBalance.toFixed(2)}</p>
                      <p className="text-xs" style={{ color: '#5c3d2e' }}>of ${reserveCap} cap</p>
                    </div>
                    <div className="w-full rounded-full overflow-hidden mb-3" style={{ backgroundColor: '#e0d5cc', height: '8px' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${reservePct}%`, backgroundColor: reservePct >= 80 ? '#8B4513' : '#c4a882' }}
                      />
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: '#5c3d2e' }}>
                      Funds held by Whiskly to cover disputes. Released quarterly once above $200.
                    </p>
                  </div>

                  {/* 2. Instant payout status */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold mb-4" style={{ color: '#2d1a0e' }}>Instant Payout</h2>
                    {isEligible ? (
                      <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4" style={{ backgroundColor: '#dcfce7' }}>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#15803d' }} />
                          <span className="text-xs font-semibold" style={{ color: '#15803d' }}>Instant Payout Available</span>
                        </div>
                        <div className="flex items-center gap-4 p-4 rounded-xl" style={{ backgroundColor: '#f5f0eb' }}>
                          <div className="flex-1">
                            <p className="text-sm font-semibold" style={{ color: '#2d1a0e' }}>Elect instant payout</p>
                            <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>Receive payouts within minutes instead of 3 days. A 7% reserve rate applies when elected.</p>
                          </div>
                          <button
                            onClick={toggleInstantPayout}
                            disabled={togglingInstantPayout}
                            className="relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors"
                            style={{ backgroundColor: isElected ? '#8B4513' : '#d6ccc4' }}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isElected ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm mb-4" style={{ color: '#5c3d2e' }}>Complete all criteria below to unlock instant payouts.</p>
                        <div className="flex flex-col gap-2.5">
                          {(criteria as any[]).map((c, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div
                                className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                                style={{ backgroundColor: c.met ? '#dcfce7' : '#f5f0eb' }}
                              >
                                {c.met ? (
                                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                    <path d="M2 5l2.5 2.5L8 3" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                ) : (
                                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#9c7b6b' }} />
                                )}
                              </div>
                              <p className="text-sm leading-snug" style={{ color: c.met ? '#2d1a0e' : '#5c3d2e' }}>{c.label}</p>
                              <div className="relative">
                                <button
                                  onMouseEnter={() => setOpenTipIdx(i)}
                                  onMouseLeave={() => setOpenTipIdx(null)}
                                  onClick={() => setOpenTipIdx(openTipIdx === i ? null : i)}
                                  className="w-4 h-4 rounded-full flex items-center justify-center"
                                  style={{ backgroundColor: '#e0d5cc', color: '#5c3d2e', fontSize: '9px', fontWeight: 700, lineHeight: 1, cursor: 'default' }}
                                >?</button>
                                {openTipIdx === i && (
                                  <div className="absolute z-10 rounded-xl shadow-lg text-xs leading-relaxed p-3"
                                    style={{ right: 0, bottom: 'calc(100% + 6px)', width: '220px', backgroundColor: '#2d1a0e', color: '#f5f0eb' }}>
                                    {c.tip}
                                    <div className="absolute" style={{ right: '6px', top: '100%', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid #2d1a0e' }} />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3. Recent reserve transactions */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h2 className="text-base font-bold mb-4" style={{ color: '#2d1a0e' }}>Reserve Transactions</h2>
                    {reserveTxs.length === 0 ? (
                      <p className="text-sm text-center py-4" style={{ color: '#5c3d2e' }}>No reserve transactions yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr style={{ borderBottom: '1px solid #e0d5cc' }}>
                              {['Date', 'Type', 'Amount', 'Balance After'].map(h => (
                                <th key={h} className="text-left py-2 pr-4 font-semibold" style={{ color: '#5c3d2e' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {reserveTxs.map(tx => (
                              <tr key={tx.id} className="border-b" style={{ borderColor: '#f5f0eb' }}>
                                <td className="py-2.5 pr-4" style={{ color: '#5c3d2e' }}>
                                  {new Date(tx.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                </td>
                                <td className="py-2.5 pr-4 font-medium" style={{ color: '#2d1a0e' }}>{txTypeLabel(tx.transaction_type)}</td>
                                <td className="py-2.5 pr-4" style={{ color: tx.transaction_type === 'quarterly_release' ? '#15803d' : '#2d1a0e' }}>
                                  {tx.transaction_type === 'quarterly_release' ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                                </td>
                                <td className="py-2.5 font-semibold" style={{ color: '#2d1a0e' }}>${(tx.balance_after ?? 0).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* 4. Upcoming payout tranches */}
                  {pendingTranches.length > 0 && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                      <h2 className="text-base font-bold mb-4" style={{ color: '#2d1a0e' }}>Upcoming Payouts</h2>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr style={{ borderBottom: '1px solid #e0d5cc' }}>
                              {['Order', 'Type', 'Net Amount', 'Scheduled'].map(h => (
                                <th key={h} className="text-left py-2 pr-4 font-semibold" style={{ color: '#5c3d2e' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {pendingTranches.map(t => (
                              <tr key={t.id} className="border-b" style={{ borderColor: '#f5f0eb' }}>
                                <td className="py-2.5 pr-4 font-mono" style={{ color: '#5c3d2e' }}>{t.order_id?.slice(0, 8)}</td>
                                <td className="py-2.5 pr-4 font-medium" style={{ color: '#2d1a0e' }}>{trancheTypeLabel(t.tranche_type)}</td>
                                <td className="py-2.5 pr-4 font-semibold" style={{ color: '#2d1a0e' }}>${((t.net_amount ?? 0) / 100).toFixed(2)}</td>
                                <td className="py-2.5" style={{ color: '#5c3d2e' }}>
                                  {t.scheduled_for ? new Date(t.scheduled_for).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}

            {(() => {
              const upcoming = orders.filter(o => (o.status === 'confirmed' || o.status === 'in_progress' || o.status === 'ready') && getDaysUntil(o.event_date) > 0).sort((a, b) => getDaysUntil(a.event_date) - getDaysUntil(b.event_date)).slice(0, 5)
              if (upcoming.length === 0) return null
              return (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold" style={{ color: '#2d1a0e' }}>Upcoming Events</h2>
                    {baker?.tier !== 'pro' && <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ backgroundColor: '#fef9c3', color: '#854d0e' }}>Reminders · Pro only</span>}
                  </div>
                  <div className="flex flex-col gap-3">
                    {upcoming.map(order => {
                      const days = getDaysUntil(order.event_date)
                      const urgent = days <= 7
                      return (
                        <div key={order.id} className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: urgent ? '#fff7ed' : '#f5f0eb' }}>
                          <div className="flex items-center gap-4">
                            <div className="text-center w-12 flex-shrink-0">
                              <p className="text-2xl font-bold leading-none" style={{ color: urgent ? '#c2410c' : '#2d1a0e' }}>{days}</p>
                              <p className="text-xs mt-0.5" style={{ color: urgent ? '#c2410c' : '#5c3d2e' }}>days</p>
                            </div>
                            <div>
                              <p className="text-sm font-semibold" style={{ color: '#2d1a0e' }}>{order.customer_name}</p>
                              <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>{order.event_type} · {(() => { const [y,m,d] = (order.event_date).split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString([], {month:'short',day:'numeric',year:'numeric'}) })()}</p>
                              {order.budget && <p className="text-xs" style={{ color: '#5c3d2e' }}>${order.budget}</p>}
                            </div>
                          </div>
                          {baker?.tier === 'pro' ? (
                            <button onClick={() => sendReminder(order)} className="px-4 py-2 rounded-lg text-xs font-semibold text-white flex-shrink-0" style={{ backgroundColor: urgent ? '#c2410c' : '#8B4513' }}>Send Reminder</button>
                          ) : (
                            <button onClick={() => alert('Upgrade to Pro to send reminders!')} className="px-4 py-2 rounded-lg text-xs font-semibold flex-shrink-0 border" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>Remind</button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-4" style={{ color: '#2d1a0e' }}>
                Pending Requests
                {(pending.length + countered.length) > 0 && <span className="ml-2 text-sm px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#fef9c3', color: '#854d0e' }}>{pending.length + countered.length} new</span>}
              </h2>
              {pending.length === 0 && countered.length === 0 ? (
                <div className="text-center py-12">
                  <p className="font-semibold mb-1" style={{ color: '#2d1a0e' }}>No pending requests</p>
                  <p className="text-sm mt-1 mb-4" style={{ color: '#5c3d2e' }}>Share your profile link to start getting orders</p>
                  <div className="px-4 py-2 bg-[#faf8f6] rounded-lg text-sm inline-block" style={{ color: '#5c3d2e' }}>{typeof window !== 'undefined' ? window.location.origin + '/bakers/' + baker?.id : ''}</div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">{sortOrders([...pending, ...countered]).slice(0, 5).map(order => <OrderCard key={order.id} order={order} />)}</div>
              )}
            </div>

            {inProgress.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-4" style={{ color: '#2d1a0e' }}>In Progress</h2>
                <div className="flex flex-col gap-3">{sortOrders(inProgress).map(order => <OrderCard key={order.id} order={order} />)}</div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4" style={{ color: '#2d1a0e' }}>All Orders</h2>
            {orders.length === 0 ? <p className="text-center py-8" style={{ color: '#5c3d2e' }}>No orders yet</p> : (
              <div className="flex flex-col gap-3">{sortOrders(orders).map(order => <OrderCard key={order.id} order={order} />)}</div>
            )}
          </div>
        )}

        {activeTab === 'messages' && <MessagesTab bakerId={baker?.id} bakerUserId={baker?.user_id} orders={orders} />}

        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-6" style={{ color: '#2d1a0e' }}>Edit Profile</h2>
            <div className="flex flex-col gap-5 max-w-lg">
              <div className="p-4 rounded-xl border" style={{ borderColor: '#e0d5cc', backgroundColor: '#faf8f6' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#2d1a0e' }}>{baker?.tier === 'pro' ? 'Pro Baker' : 'Free Tier'}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>{baker?.tier === 'pro' ? 'Featured placement · 10 photos · Verified badge' : 'Standard listing · 3 photos · Basic profile'}</p>
                  </div>
                  {baker?.tier !== 'pro' && <button onClick={() => alert('Stripe billing coming soon!')} className="px-4 py-2 rounded-lg text-white text-xs font-semibold" style={{ backgroundColor: '#8B4513' }}>Upgrade to Pro</button>}
                </div>
              </div>

              <div className="p-4 rounded-xl border" style={{ borderColor: '#e0d5cc', backgroundColor: '#faf8f6' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#2d1a0e' }}>{baker?.stripe_account_id ? 'Stripe Connected' : 'Connect Stripe'}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>{baker?.stripe_account_id ? 'You can receive payments from customers' : 'Required to receive payments on Whiskly'}</p>
                  </div>
                  {!baker?.stripe_account_id && <button onClick={connectStripe} className="px-4 py-2 rounded-lg text-white text-xs font-semibold" style={{ backgroundColor: '#635bff' }}>Connect</button>}
                </div>
                {!baker?.stripe_account_id && (
                  <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: '#faf8f6', border: '1px solid #5c3d2e' }}>
                    <p className="text-xs leading-relaxed mb-2" style={{ color: '#5c3d2e' }}>Stripe will ask for your website during setup. Use your Whiskly profile link as your website:</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium flex-1 truncate" style={{ color: '#2d1a0e' }}>https://www.whiskly.co/bakers/{baker?.id}</span>
                      <button onClick={copyStripeUrl}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg flex-shrink-0"
                        style={{ backgroundColor: '#5c3d2e', color: 'white' }}>
                        {copiedStripeUrl ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl border" style={{ borderColor: '#e0d5cc', backgroundColor: '#fef9c3' }}>
                <p className="text-sm font-semibold mb-1" style={{ color: '#854d0e' }}>Sales Tax Reminder</p>
                <p className="text-xs leading-relaxed" style={{ color: '#92400e' }}>You are responsible for understanding and collecting any applicable sales tax in your state. Whiskly does not collect or remit sales tax on your behalf. Requirements vary by state and baker type. When in doubt, consult a tax professional.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#2d1a0e' }}>Profile Photo</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#f5f0eb' }}>
                    {baker?.profile_photo_url ? <img src={baker.profile_photo_url} alt="Profile" className="w-full h-full object-cover" /> : <span className="text-2xl font-bold" style={{ color: '#2d1a0e' }}>{businessName?.charAt(0) || 'B'}</span>}
                  </div>
                  <div>
                    <label className="cursor-pointer px-4 py-2 rounded-lg text-sm font-semibold border inline-block" style={{ borderColor: '#2d1a0e', color: '#2d1a0e' }}>
                      {uploading ? 'Uploading...' : 'Upload Photo'}
                      <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) uploadPhoto(e.target.files[0]) }} />
                    </label>
                    <p className="text-xs mt-1" style={{ color: '#5c3d2e' }}>JPG or PNG, shown on your public profile</p>
                  </div>
                </div>
              </div>

              <div><label className="block text-sm font-semibold mb-1" style={{ color: '#2d1a0e' }}>Business Name</label><input value={businessName} onChange={e => setBusinessName(e.target.value)} className="w-full px-4 py-3 rounded-lg border text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} /></div>
              <div><label className="block text-sm font-semibold mb-1" style={{ color: '#2d1a0e' }}>Bio</label><textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} className="w-full px-4 py-3 rounded-lg border text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} /></div>

              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: '#2d1a0e' }}>Phone Number</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" placeholder="e.g. (301) 555-0123" className="w-full px-4 py-3 rounded-lg border text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
                <p className="text-xs mt-1" style={{ color: '#9c7b6b' }}>Used for emergency contact only — not shown publicly</p>
              </div>

              <div className="flex gap-3">
                <div className="flex-1"><label className="block text-sm font-semibold mb-1" style={{ color: '#2d1a0e' }}>City</label><input value={city} onChange={e => setCity(e.target.value)} className="w-full px-4 py-3 rounded-lg border text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} /></div>
                <div className="w-20"><label className="block text-sm font-semibold mb-1" style={{ color: '#2d1a0e' }}>State</label><input value={state} onChange={e => setState(e.target.value)} className="w-full px-4 py-3 rounded-lg border text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} /></div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1"><label className="block text-sm font-semibold mb-1" style={{ color: '#2d1a0e' }}>Starting Price ($)</label><input value={startingPrice} onChange={e => setStartingPrice(e.target.value)} type="number" className="w-full px-4 py-3 rounded-lg border text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} /></div>
                <div className="flex-1"><label className="block text-sm font-semibold mb-1" style={{ color: '#2d1a0e' }}>Lead Time (days)</label><input value={leadTime} onChange={e => setLeadTime(e.target.value)} type="number" className="w-full px-4 py-3 rounded-lg border text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} /></div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#2d1a0e' }}>Specialties</label>
                <div className="flex flex-wrap gap-2">
                  {['Wedding Cakes','Birthday Cakes','Custom Cookies','Cupcakes','Kids Party Cakes','Vegan/Gluten Free','Alcohol Infused','Breads','Cheesecakes','Macarons','Custom Dessert Boxes'].map(s => (
                    <button key={s} onClick={() => { const current = baker?.specialties || []; const updated = current.includes(s) ? current.filter((x: string) => x !== s) : [...current, s]; setBaker({ ...baker, specialties: updated }) }}
                      className="px-3 py-1.5 rounded-full text-xs font-medium"
                      style={{ backgroundColor: baker?.specialties?.includes(s) ? '#2d1a0e' : '#f5f0eb', color: baker?.specialties?.includes(s) ? 'white' : '#2d1a0e', border: '1px solid ' + (baker?.specialties?.includes(s) ? '#2d1a0e' : '#e0d5cc') }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#2d1a0e' }}>Rush Orders</label>
                <button onClick={() => setBaker({ ...baker, rush_orders_available: !baker?.rush_orders_available })} className="flex items-center gap-3 p-3 rounded-xl w-full text-left" style={{ backgroundColor: '#f5f0eb' }}>
                  <div className="w-10 h-6 rounded-full transition-all relative flex-shrink-0" style={{ backgroundColor: baker?.rush_orders_available ? '#2d1a0e' : '#e0d5cc' }}>
                    <div className="w-4 h-4 bg-white rounded-full absolute top-1 transition-all" style={{ left: baker?.rush_orders_available ? '22px' : '4px' }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#2d1a0e' }}>{baker?.rush_orders_available ? 'Accepting rush orders' : 'Not accepting rush orders'}</p>
                    <p className="text-xs" style={{ color: '#5c3d2e' }}>Toggle to let customers know your availability</p>
                  </div>
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#2d1a0e' }}>Payment Plans</label>
                <button onClick={async () => {
                  const newVal = !paymentPlansEnabled
                  setPaymentPlansEnabled(newVal)
                  await supabase.from('bakers').update({ payment_plans_enabled: newVal }).eq('id', baker.id)
                }} className="flex items-center gap-3 p-3 rounded-xl w-full text-left" style={{ backgroundColor: '#f5f0eb' }}>
                  <div className="w-10 h-6 rounded-full transition-all relative flex-shrink-0" style={{ backgroundColor: paymentPlansEnabled ? '#2d1a0e' : '#e0d5cc' }}>
                    <div className="w-4 h-4 bg-white rounded-full absolute top-1 transition-all" style={{ left: paymentPlansEnabled ? '22px' : '4px' }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#2d1a0e' }}>{paymentPlansEnabled ? 'Offering payment plans for orders over $500' : 'Not offering payment plans'}</p>
                    <p className="text-xs" style={{ color: '#5c3d2e' }}>Customers with orders over $500 can pay in 3 installments</p>
                  </div>
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: '#2d1a0e' }}>Cancellation Policy</label>
                <textarea value={baker?.cancellation_policy || ''} onChange={e => setBaker({ ...baker, cancellation_policy: e.target.value })} rows={3} placeholder="e.g. Full refund if cancelled 2+ weeks out. 50% refund within 1 week. No refund within 48 hours." className="w-full px-4 py-3 rounded-lg border text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
              </div>

              {baker?.pickup_available && (
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: '#2d1a0e' }}>Pickup Address</label>
                  <p className="text-xs mb-2" style={{ color: '#5c3d2e' }}>Only shared with customers once you mark their order as Ready.</p>
                  <input value={baker?.pickup_address || ''} onChange={e => setBaker({ ...baker, pickup_address: e.target.value })} placeholder="123 Baker St, Upper Marlboro, MD 20774" className="w-full px-4 py-3 rounded-lg border text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
                </div>
              )}

{/* Availability Status */}
<div className="border-t pt-5" style={{ borderColor: '#e0d5cc' }}>
  <label className="block text-sm font-semibold mb-3" style={{ color: '#2d1a0e' }}>Availability Status</label>

  {/* Vacation Mode */}
  <div className="p-4 rounded-xl border mb-3" style={{ borderColor: '#e0d5cc', backgroundColor: isOnVacation ? '#dbeafe' : '#faf8f6' }}>
    <div className="flex items-center justify-between mb-2">
      <div>
        <p className="text-sm font-semibold" style={{ color: '#2d1a0e' }}>Vacation Mode</p>
        <p className="text-xs" style={{ color: '#5c3d2e' }}>Pause new orders while you are away</p>
      </div>
      <button onClick={async () => {
        const newVal = !isOnVacation
        setIsOnVacation(newVal)
        await saveAvailabilityStatus({ is_on_vacation: newVal, vacation_return_date: newVal ? vacationReturnDate : null })
      }} className="w-10 h-6 rounded-full relative flex-shrink-0 transition-all"
        style={{ backgroundColor: isOnVacation ? '#1e40af' : '#e0d5cc' }}>
        <div className="w-4 h-4 bg-white rounded-full absolute top-1 transition-all" style={{ left: isOnVacation ? '22px' : '4px' }} />
      </button>
    </div>
    {isOnVacation && (
      <div className="mt-2">
        <label className="block text-xs font-semibold mb-1" style={{ color: '#2d1a0e' }}>Return Date</label>
        <input type="date" value={vacationReturnDate} onChange={async e => {
          setVacationReturnDate(e.target.value)
          await saveAvailabilityStatus({ is_on_vacation: true, vacation_return_date: e.target.value })
        }} className="w-full px-3 py-2 rounded-lg border text-sm"
          style={{ borderColor: '#bfdbfe', color: '#2d1a0e', backgroundColor: 'white' }} />
      </div>
    )}
  </div>

  {/* Scheduled Vacations */}
  <div className="mt-4 pt-4 border-t" style={{ borderColor: '#e0d5cc' }}>
    <p className="text-sm font-semibold mb-3" style={{ color: '#2d1a0e' }}>Scheduled Vacations</p>
    {plannedVacations.length > 0 && (
      <div className="flex flex-col gap-2 mb-3">
        {plannedVacations.map(vac => (
          <div key={vac.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ backgroundColor: '#dbeafe', border: '1px solid #bfdbfe' }}>
            <div>
              {vac.label && <p className="text-xs font-semibold" style={{ color: '#1e40af' }}>{vac.label}</p>}
              <p className="text-xs" style={{ color: '#1e3a8a' }}>
                {(() => { const [y,m,d] = vac.start_date.split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString([],{month:'short',day:'numeric',year:'numeric'}) })()} — {(() => { const [y,m,d] = vac.end_date.split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString([],{month:'short',day:'numeric',year:'numeric'}) })()}
              </p>
            </div>
            <button onClick={() => deleteVacation(vac.id)} className="text-xs font-semibold px-2 py-1 rounded-lg" style={{ color: '#991b1b', backgroundColor: '#fee2e2' }}>Remove</button>
          </div>
        ))}
      </div>
    )}
    <div className="flex flex-col gap-2 p-3 rounded-xl" style={{ backgroundColor: '#f5f0eb', border: '1px solid #e0d5cc' }}>
      <p className="text-xs font-semibold" style={{ color: '#2d1a0e' }}>Add vacation</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs mb-1" style={{ color: '#5c3d2e' }}>Start date</label>
          <input type="date" value={vacStartDate} onChange={e => setVacStartDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-xs" style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: 'white' }} />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: '#5c3d2e' }}>End date</label>
          <input type="date" value={vacEndDate} onChange={e => setVacEndDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-xs" style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: 'white' }} />
        </div>
      </div>
      <input type="text" value={vacLabel} onChange={e => setVacLabel(e.target.value)} placeholder="Label (optional) — e.g. Family vacation" className="w-full px-3 py-2 rounded-lg border text-xs" style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: 'white' }} />
      {vacStartDate && vacEndDate && vacEndDate <= vacStartDate && (
        <p className="text-xs" style={{ color: '#dc2626' }}>End date must be after start date</p>
      )}
      <button onClick={() => saveVacation()} disabled={savingVacation || !vacStartDate || !vacEndDate || vacEndDate <= vacStartDate} className="px-4 py-2 rounded-lg text-xs font-semibold text-white self-start" style={{ backgroundColor: '#1e40af', opacity: (savingVacation || !vacStartDate || !vacEndDate || vacEndDate <= vacStartDate) ? 0.5 : 1 }}>
        {savingVacation ? 'Saving...' : 'Save Vacation'}
      </button>
    </div>
  </div>

  {/* At Capacity */}
  <div className="p-4 rounded-xl border mb-3 mt-4" style={{ borderColor: '#e0d5cc', backgroundColor: isAtCapacity ? '#fef9c3' : '#faf8f6' }}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold" style={{ color: '#2d1a0e' }}>At Capacity</p>
        <p className="text-xs" style={{ color: '#5c3d2e' }}>Let customers know you are fully booked</p>
      </div>
      <button onClick={async () => {
        const newVal = !isAtCapacity
        setIsAtCapacity(newVal)
        await saveAvailabilityStatus({ is_at_capacity: newVal })
      }} className="w-10 h-6 rounded-full relative flex-shrink-0 transition-all"
        style={{ backgroundColor: isAtCapacity ? '#854d0e' : '#e0d5cc' }}>
        <div className="w-4 h-4 bg-white rounded-full absolute top-1 transition-all" style={{ left: isAtCapacity ? '22px' : '4px' }} />
      </button>
    </div>
  </div>

  {/* Emergency Pause */}
  {!isEmergencyPause ? (
    <div className="p-4 rounded-xl border" style={{ borderColor: '#fecaca', backgroundColor: '#fef2f2' }}>
      <p className="text-sm font-semibold mb-1" style={{ color: '#991b1b' }}>Emergency Pause</p>
      <p className="text-xs mb-3" style={{ color: '#5c3d2e' }}>For genuine emergencies only — death in family, medical emergency, major home emergency. Immediately notifies our team. No strikes issued.</p>
      <button onClick={triggerEmergencyPause}
        className="px-4 py-2 rounded-lg text-xs font-semibold border"
        style={{ borderColor: '#dc2626', color: '#dc2626' }}>
        Trigger Emergency Pause
      </button>
    </div>
  ) : (
    <div className="p-4 rounded-xl border" style={{ borderColor: '#dc2626', backgroundColor: '#fef2f2' }}>
      <p className="text-sm font-bold mb-1" style={{ color: '#991b1b' }}>Emergency Pause Active</p>
      <p className="text-xs mb-3" style={{ color: '#5c3d2e' }}>Our team has been notified and is reviewing your affected orders. We will be in touch shortly.</p>
      <button onClick={async () => {
        await saveAvailabilityStatus({ is_emergency_pause: false })
        setIsEmergencyPause(false)
      }} className="px-4 py-2 rounded-lg text-xs font-semibold text-white"
        style={{ backgroundColor: '#166534' }}>
        I am back — Resume Orders
      </button>
    </div>
  )}
</div>

{/* Emergency Roster */}
<div className="border-t pt-5" style={{ borderColor: '#e0d5cc' }}>
  <div className="flex items-center justify-between mb-1">
    <div>
      <p className="text-sm font-semibold" style={{ color: '#2d1a0e' }}>Emergency Roster</p>
      <p className="text-xs" style={{ color: '#5c3d2e' }}>Let Whiskly know you can step in for other bakers in emergencies</p>
    </div>
    <button onClick={async () => {
      const newVal = !isEmergencyRoster
      setIsEmergencyRoster(newVal)
      await supabase.from('bakers').update({ emergency_roster: newVal } as any).eq('id', baker.id)
    }} className="w-10 h-6 rounded-full relative flex-shrink-0 transition-all"
      style={{ backgroundColor: isEmergencyRoster ? '#166534' : '#e0d5cc' }}>
      <div className="w-4 h-4 bg-white rounded-full absolute top-1 transition-all" style={{ left: isEmergencyRoster ? '22px' : '4px' }} />
    </button>
  </div>
  {isEmergencyRoster && (
    <div className="mt-3 p-3 rounded-xl border" style={{ borderColor: '#bbf7d0', backgroundColor: '#f0fdf4' }}>
      <p className="text-xs font-semibold mb-2" style={{ color: '#166534' }}>Available windows</p>
      {['Under 24 hours', '24-48 hours', '48-72 hours'].map(window => (
        <label key={window} className="flex items-center gap-2 mb-1.5 cursor-pointer">
          <input type="checkbox" checked={emergencyWindows.includes(window)} onChange={async () => {
            const updated = emergencyWindows.includes(window) ? emergencyWindows.filter(w => w !== window) : [...emergencyWindows, window]
            setEmergencyWindows(updated)
            await supabase.from('bakers').update({ emergency_windows: updated } as any).eq('id', baker.id)
          }} />
          <span className="text-xs" style={{ color: '#2d1a0e' }}>{window}</span>
        </label>
      ))}
    </div>
  )}
</div>

              <button onClick={saveProfile} disabled={saving} className="py-3 rounded-lg text-white font-semibold" style={{ backgroundColor: '#2d1a0e', opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving...' : 'Save Profile'}</button>
            </div>
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold" style={{ color: '#2d1a0e' }}>Portfolio Gallery</h2>
                <p className="text-sm mt-1" style={{ color: '#5c3d2e' }}>{portfolio.length}/{maxPhotos} photos{baker?.tier !== 'pro' && ' · Upgrade to Pro for 10 photos'}</p>
              </div>
              {portfolio.length < maxPhotos && (
                <label className="cursor-pointer px-4 py-2 rounded-lg text-white text-sm font-semibold" style={{ backgroundColor: '#2d1a0e' }}>
                  {uploadingPortfolio ? 'Uploading...' : 'Add Photo'}
                  <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) uploadPortfolioPhoto(e.target.files[0]) }} />
                </label>
              )}
            </div>
            {portfolio.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed rounded-2xl" style={{ borderColor: '#e0d5cc' }}>
                <p className="font-semibold mb-1" style={{ color: '#2d1a0e' }}>No photos yet</p>
                <p className="text-sm mb-4" style={{ color: '#5c3d2e' }}>Upload your best work to attract customers</p>
                <label className="cursor-pointer px-6 py-3 rounded-xl text-white text-sm font-semibold inline-block" style={{ backgroundColor: '#2d1a0e' }}>
                  {uploadingPortfolio ? 'Uploading...' : 'Upload Your First Photo'}
                  <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) uploadPortfolioPhoto(e.target.files[0]) }} />
                </label>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <span className="text-2xl font-light" style={{ color: '#5c3d2e' }}>+</span>
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

function MessagesTab({ bakerId, bakerUserId, orders }: { bakerId: string, bakerUserId: string, orders: any[] }) {
  const [conversations, setConversations] = useState<any[]>([])
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null)
  const [activeOrder, setActiveOrder] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [offPlatformWarning, setOffPlatformWarning] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { if (bakerId) loadConversations() }, [bakerId])

  useEffect(() => {
    if (!activeOrderId) return
    loadThread(activeOrderId)
    const channel = supabase.channel('baker-thread-' + activeOrderId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: 'order_id=eq.' + activeOrderId }, (payload) => {
        setMessages(prev => { if (prev.find(m => m.id === (payload.new as any).id)) return prev; return [...prev, payload.new] })
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [activeOrderId])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function loadConversations() {
    const { data } = await supabase.from('messages').select('*').eq('baker_id', bakerId).order('created_at', { ascending: false })
    if (!data) return
    const seen = new Set<string>()
    const threads: any[] = []
    for (const msg of data) {
      const key = msg.order_id || 'general-' + (msg.sender_id === bakerUserId ? msg.receiver_id : msg.sender_id)
      if (!seen.has(key)) { seen.add(key); threads.push({ ...msg, thread_key: key }) }
    }
    const enriched = await Promise.all(threads.map(async (t) => {
      const order = orders.find(o => o.id === t.order_id)
      const customerId = t.sender_id === bakerUserId ? t.receiver_id : t.sender_id
      const { data: customerData } = await supabase.from('customers').select('full_name').eq('user_id', customerId).maybeSingle()
      return { ...t, order_info: order || null, customer_name: customerData?.full_name || order?.customer_name || 'Customer', unread: !t.read_at && t.receiver_id === bakerUserId ? 1 : 0 }
    }))
    setConversations(enriched)
    if (!activeOrderId && enriched.length > 0) { setActiveOrderId(enriched[0].order_id); setActiveOrder(enriched[0].order_info) }
  }

  async function loadThread(orderId: string) {
    const { data } = await supabase.from('messages').select('*').eq('order_id', orderId).order('created_at', { ascending: true })
    setMessages(data || [])
    const order = orders.find(o => o.id === orderId)
    setActiveOrder(order || null)
    await supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('order_id', orderId).eq('receiver_id', bakerUserId).is('read_at', null)
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
    if (!newMessage.trim() || !activeOrderId || !activeOrder) return
    setSending(true)
    const msgContent = newMessage.trim()
    const pattern = detectOffPlatformPattern(msgContent)
    const { data: customerData } = await supabase.from('customers').select('user_id').eq('email', activeOrder.customer_email).maybeSingle()
    await supabase.from('messages').insert({
      sender_id: bakerUserId,
      receiver_id: customerData?.user_id || null,
      baker_id: bakerId,
      order_id: activeOrderId,
      content: msgContent,
      ...(pattern ? { is_flagged: true, flagged_reason: pattern } : {}),
    })
    setNewMessage('')
    setSending(false)
    if (pattern) setOffPlatformWarning(pattern)
    loadConversations()
  }

  function formatDate(ts: string) {
    const d = new Date(ts), today = new Date(), yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (d.toDateString() === today.toDateString()) return 'Today'
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  function formatTime(ts: string) { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden" style={{ height: '600px', display: 'flex' }}>
      <div className={`${activeOrderId ? 'hidden md:flex' : 'flex'} border-r overflow-y-auto flex-shrink-0 flex-col w-full md:w-72`} style={{ borderColor: '#e0d5cc' }}>
        <div className="p-4 border-b" style={{ borderColor: '#e0d5cc' }}><h3 className="font-bold text-sm" style={{ color: '#2d1a0e' }}>Conversations</h3></div>
        {conversations.length === 0 ? (
          <div className="p-6 text-center flex-1 flex flex-col items-center justify-center">
            <p className="text-sm font-medium mb-1" style={{ color: '#2d1a0e' }}>No messages yet</p>
            <p className="text-xs" style={{ color: '#5c3d2e' }}>Messages from customers will appear here</p>
          </div>
        ) : conversations.map(convo => (
          <button key={convo.thread_key} onClick={() => { setActiveOrderId(convo.order_id); setActiveOrder(convo.order_info) }}
            className="w-full p-4 text-left border-b"
            style={{ borderColor: '#e0d5cc', backgroundColor: activeOrderId === convo.order_id ? '#f5f0eb' : 'white', borderLeft: activeOrderId === convo.order_id ? '3px solid #2d1a0e' : '3px solid transparent' }}>
            <div className="flex items-center justify-between mb-0.5">
              <p className="text-sm font-semibold truncate" style={{ color: '#2d1a0e' }}>{convo.customer_name}</p>
              {convo.unread > 0 && <span className="text-xs text-white rounded-full w-5 h-5 flex items-center justify-center font-semibold flex-shrink-0 ml-1" style={{ backgroundColor: '#2d1a0e' }}>{convo.unread}</span>}
            </div>
            {convo.order_info && <p className="text-xs font-medium mb-0.5" style={{ color: '#8B4513' }}>{convo.order_info.event_type} · {(() => { const [y,m,d] = (convo.order_info.event_date).split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString([], {month:'short',day:'numeric',year:'numeric'}) })()}</p>}
            <p className="text-xs truncate" style={{ color: '#5c3d2e' }}>{convo.content}</p>
          </button>
        ))}
      </div>
      <div className={`${activeOrderId ? 'flex' : 'hidden md:flex'} flex-col flex-1 min-w-0`}>
        {!activeOrderId ? (
          <div className="flex-1 flex items-center justify-center"><div className="text-center"><p className="font-semibold mb-1" style={{ color: '#2d1a0e' }}>Select a conversation</p><p className="text-sm" style={{ color: '#5c3d2e' }}>Choose a customer from the left</p></div></div>
        ) : (
          <>
            <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: '#e0d5cc' }}>
              <button className="md:hidden text-sm font-semibold flex-shrink-0" onClick={() => { setActiveOrderId(null); setActiveOrder(null) }} style={{ color: '#2d1a0e' }}>← Back</button>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: '#2d1a0e' }}>{activeOrder?.customer_name || 'Customer'}</p>
                {activeOrder && <p className="text-xs mt-0.5" style={{ color: '#8B4513' }}>{activeOrder.event_type} · {(() => { const [y,m,d] = (activeOrder.event_date).split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString([], {month:'short',day:'numeric',year:'numeric'}) })()} {activeOrder.budget ? '· $' + activeOrder.budget : ''}</p>}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {messages.length === 0 && <p className="text-center text-sm py-8" style={{ color: '#5c3d2e' }}>No messages yet</p>}
              {messages.map((msg, i) => {
                const isMe = msg.sender_id === bakerUserId
                const showDate = i === 0 || formatDate(messages[i - 1].created_at) !== formatDate(msg.created_at)
                return (
                  <div key={msg.id}>
                    {showDate && <div className="text-center my-2"><span className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: '#f5f0eb', color: '#5c3d2e' }}>{formatDate(msg.created_at)}</span></div>}
                    <div className={'flex ' + (isMe ? 'justify-end' : 'justify-start')}>
                      <div style={{ maxWidth: '70%' }}>
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
              <div className="px-4 pt-3 pb-0">
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl border text-xs" style={{ borderColor: '#fbbf24', backgroundColor: '#fffbeb', color: '#92400e' }}>
                  <span className="flex-shrink-0 mt-0.5">⚠</span>
                  <span className="flex-1">Your message may contain {offPlatformWarning}. For your protection, please keep all communication and payments on Whiskly.</span>
                  <button onClick={() => setOffPlatformWarning(null)} className="flex-shrink-0 font-bold ml-1" style={{ color: '#92400e' }}>✕</button>
                </div>
              </div>
            )}
            <div className="p-4 border-t flex gap-3" style={{ borderColor: '#e0d5cc' }}>
              <input value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()} placeholder="Type a message..." className="flex-1 px-4 py-2 rounded-xl border text-sm" style={{ borderColor: '#e0d5cc', backgroundColor: '#faf8f6', color: '#2d1a0e' }} />
              <button onClick={sendMessage} disabled={sending || !newMessage.trim()} className="px-5 py-2 rounded-xl text-white text-sm font-semibold" style={{ backgroundColor: '#2d1a0e', opacity: (sending || !newMessage.trim()) ? 0.7 : 1 }}>Send</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}