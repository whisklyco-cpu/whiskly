'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 14 14" fill="none">
          <path
            d="M7 1.5l1.4 3 3.2.5-2.3 2.3.5 3.2L7 9 4.2 10.5l.5-3.2L2.4 5l3.2-.5z"
            fill={i <= full ? '#c8975a' : i === full + 1 && half ? '#c8975a' : '#e0d5cc'}
            fillOpacity={i === full + 1 && half ? 0.5 : 1}
            stroke="#c8975a"
            strokeWidth="0.5"
          />
        </svg>
      ))}
    </div>
  )
}

export default function BakerProfile() {
  const { id } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const reorderId = searchParams.get('reorder')
  const [reorderBanner, setReorderBanner] = useState(false)
  const [baker, setBaker] = useState<any>(null)
  const [portfolio, setPortfolio] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [attempted, setAttempted] = useState(false)
  const [inspirationFiles, setInspirationFiles] = useState<File[]>([])
  const [inspirationPreviews, setInspirationPreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const addressInputRef = useRef<HTMLInputElement>(null)

  // Message modal state
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [messageSent, setMessageSent] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [currentCustomer, setCurrentCustomer] = useState<any>(null)
  const [isBlocked, setIsBlocked] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)

  const [form, setForm] = useState({
    customer_name: '',
    email: '',
    item_type: '',
    event_type: '',
    event_date: '',
    servings: '',
    budget: '',
    flavor_preferences: '',
    allergen_notes: '',
    fulfillment_type: '',
    delivery_address: '',
    delivery_city: '',
    delivery_state: '',
    delivery_zip: '',
    item_description: '',
  })

  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const mapsLoadedRef = useRef(false)

  const loadGoogleMaps = useCallback(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
    if (!key || mapsLoadedRef.current) return
    if ((window as any).google?.maps) { mapsLoadedRef.current = true; return }
    const script = document.createElement('script')
    script.src = 'https://maps.googleapis.com/maps/api/js?key=' + key + '&libraries=places&v=weekly'
    script.async = true
    script.onload = () => { mapsLoadedRef.current = true }
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    if (form.fulfillment_type === 'delivery') loadGoogleMaps()
  }, [form.fulfillment_type, loadGoogleMaps])

  // Load current user for message feature + block check
  useEffect(() => {
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      setCurrentUser(session.user)
      const { data: customerData } = await supabase
        .from('customers').select('*').eq('user_id', session.user.id).maybeSingle()
      setCurrentCustomer(customerData)
      if (customerData && id) {
        const { data: blockData } = await supabase.from('blocks')
          .select('id').eq('blocker_id', id).eq('blocked_id', customerData.user_id).eq('blocker_type', 'baker').maybeSingle()
        if (blockData) setIsBlocked(true)
      }
    }
    loadUser()
  }, [])

  async function handleAddressInput(value: string) {
    setForm(f => ({ ...f, delivery_address: value }))
    if (!value || value.length < 3) {
      setAddressSuggestions([])
      setShowSuggestions(false)
      return
    }
    try {
      const { AutocompleteSuggestion } = await (window as any).google.maps.importLibrary('places')
      const request = { input: value, includedRegionCodes: ['us'] }
      const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions(request)
      setAddressSuggestions(suggestions.slice(0, 5))
      setShowSuggestions(suggestions.length > 0)
    } catch (err) {
      setAddressSuggestions([])
      setShowSuggestions(false)
    }
  }

  async function selectAddressSuggestion(suggestion: any) {
    setShowSuggestions(false)
    const prediction = suggestion.placePrediction
    setForm(f => ({ ...f, delivery_address: prediction.mainText?.toString() || prediction.text?.toString() || '' }))
    try {
      const place = prediction.toPlace()
      await place.fetchFields({ fields: ['addressComponents'] })
      const components = place.addressComponents || []
      let streetNumber = '', street = '', city = '', state = '', zip = ''
      for (const comp of components) {
        const types = comp.types || []
        if (types.includes('street_number')) streetNumber = comp.longText || ''
        if (types.includes('route')) street = comp.longText || ''
        if (types.includes('locality')) city = comp.longText || ''
        if (types.includes('administrative_area_level_1')) state = comp.shortText || ''
        if (types.includes('postal_code')) zip = comp.longText || ''
      }
      setForm(f => ({
        ...f,
        delivery_address: (streetNumber + ' ' + street).trim(),
        delivery_city: city,
        delivery_state: state,
        delivery_zip: zip,
      }))
    } catch (e) {
      console.error('Place details error:', e)
    }
  }

  useEffect(() => { loadBaker() }, [id])

  useEffect(() => {
    if (!reorderId) return
    async function prefillReorder() {
      const { data: prevOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('id', reorderId)
        .maybeSingle()
      if (!prevOrder) return
      setForm(f => ({
        ...f,
        customer_name: prevOrder.customer_name || '',
        email: prevOrder.customer_email || '',
        item_type: prevOrder.item_type || '',
        event_type: prevOrder.event_type || '',
        servings: prevOrder.servings?.toString() || '',
        budget: prevOrder.budget?.toString() || '',
        flavor_preferences: prevOrder.flavor_preferences || '',
        allergen_notes: prevOrder.allergen_notes || '',
        fulfillment_type: prevOrder.fulfillment_type || '',
        delivery_address: prevOrder.delivery_address || '',
        delivery_city: prevOrder.delivery_city || '',
        delivery_state: prevOrder.delivery_state || '',
        delivery_zip: prevOrder.delivery_zip || '',
        item_description: prevOrder.item_description || '',
      }))
      setReorderBanner(true)
    }
    prefillReorder()
  }, [reorderId])

  async function loadBaker() {
    const { data: bakerData } = await supabase
      .from('bakers').select('*').eq('id', id).single()
    if (bakerData) {
      setBaker(bakerData)
      const { data: portfolioData } = await supabase
        .from('portfolio_items').select('*').eq('baker_id', id)
        .eq('is_visible', true).order('created_at', { ascending: false })
      setPortfolio(portfolioData || [])
      const { data: reviewData } = await supabase
        .from('reviews').select('*').eq('baker_id', id).order('created_at', { ascending: false })
      setReviews(reviewData || [])
    }
    setLoading(false)
  }

  function handleInspirationChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    const remaining = 3 - inspirationFiles.length
    const toAdd = files.slice(0, remaining)
    setInspirationFiles(prev => [...prev, ...toAdd])
    toAdd.forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => setInspirationPreviews(prev => [...prev, ev.target?.result as string])
      reader.readAsDataURL(file)
    })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeInspirationPhoto(index: number) {
    setInspirationFiles(prev => prev.filter((_, i) => i !== index))
    setInspirationPreviews(prev => prev.filter((_, i) => i !== index))
  }

  async function uploadInspirationPhotos(orderId: string): Promise<string[]> {
    const urls: string[] = []
    for (const file of inspirationFiles) {
      const ext = file.name.split('.').pop()
      const fileName = orderId + '-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext
      const { error } = await supabase.storage.from('order-inspirations').upload(fileName, file, { upsert: true })
      if (!error) {
        const { data } = supabase.storage.from('order-inspirations').getPublicUrl(fileName)
        urls.push(data.publicUrl)
      }
    }
    return urls
  }

  async function sendMessage() {
  if (!messageText.trim() || !baker) return

  if (!currentUser) {
    router.push('/login?redirect=/bakers/' + id)
    return
  }

    setSendingMessage(true)
    try {
      await supabase.from('messages').insert({
        sender_id: currentUser.id,
        receiver_id: baker.user_id,
        baker_id: baker.id,
        order_id: null,
        content: messageText.trim(),
      })
      setMessageSent(true)
      setMessageText('')
      setTimeout(() => {
        setShowMessageModal(false)
        setMessageSent(false)
        router.push('/dashboard/customer?tab=messages&baker=' + baker.id)
      }, 1500)
    } catch (err) {
      console.error('Message error:', err)
    }
    setSendingMessage(false)
  }

  async function handleSubmit() {
    if (!currentUser) {
      setShowAuthModal(true)
      return
    }
    const missingFields: string[] = []
    if (!form.customer_name) missingFields.push('Your Name')
    if (!form.email) missingFields.push('Email')
    if (!form.item_type) missingFields.push('What are you ordering')
    if (!form.event_type) missingFields.push('Event Type')
    if (!form.event_date) missingFields.push('Event Date')
    if (!form.servings) missingFields.push('Servings')
    if (!form.budget) missingFields.push('Budget')
    if (!form.flavor_preferences) missingFields.push('Flavor Preferences')
    if (showFulfillment && !form.fulfillment_type) missingFields.push('Delivery or Pickup')
    if (form.fulfillment_type === 'delivery') {
      if (!form.delivery_address) missingFields.push('Street Address')
      if (!form.delivery_city) missingFields.push('City')
      if (!form.delivery_state) missingFields.push('State')
      if (!form.delivery_zip) missingFields.push('Zip Code')
    }
    if (missingFields.length > 0) {
      setAttempted(true)
      setFormError('Please fill in: ' + missingFields.join(', '))
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setFormError('')
    setAttempted(false)
    setSubmitting(true)

    const { data: newOrder } = await supabase.from('orders').insert({
      baker_id: baker.id,
      customer_name: form.customer_name,
      customer_email: form.email,
      item_type: form.item_type,
      event_type: form.event_type,
      event_date: form.event_date,
      servings: form.servings,
      budget: parseFloat(form.budget) || 0,
      flavor_preferences: form.flavor_preferences,
      allergen_notes: form.allergen_notes,
      fulfillment_type: form.fulfillment_type,
      delivery_address: form.fulfillment_type === 'delivery'
        ? (form.delivery_address + ', ' + form.delivery_city + ', ' + form.delivery_state + ' ' + form.delivery_zip).trim()
        : null,
      item_description: form.item_description,
      status: 'pending',
      inspiration_photo_urls: [],
      ...(reorderId ? { reorder_of: reorderId } : {}),
    }).select().single()

    if (newOrder && inspirationFiles.length > 0) {
      const photoUrls = await uploadInspirationPhotos(newOrder.id)
      if (photoUrls.length > 0) {
        await supabase.from('orders').update({ inspiration_photo_urls: photoUrls }).eq('id', newOrder.id)
      }
    }

    await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'new_order',
        bakerEmail: baker.email,
        bakerName: baker.business_name,
        customerName: form.customer_name,
        eventType: form.event_type,
        eventDate: form.event_date,
        budget: form.budget,
        description: form.item_description,
      })
    }).catch(() => {})

    fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'order_received',
        customerEmail: form.email,
        customerName: form.customer_name,
        bakerName: baker.business_name,
        itemType: form.item_type,
        eventType: form.event_type,
        eventDate: form.event_date,
        budget: form.budget,
      })
    }).catch(() => {})

    setSubmitting(false)
    setSubmitted(true)

    if (newOrder) {
      setTimeout(() => {
        router.push('/dashboard/customer?tab=orders&success=1')
      }, 1800)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f0eb' }}>
      <p style={{ color: '#2d1a0e' }}>Loading...</p>
    </div>
  )

  if (!baker) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f0eb' }}>
      <p style={{ color: '#2d1a0e' }}>Baker not found</p>
    </div>
  )

  const showFulfillment = baker.delivery_available && baker.pickup_available
  const avgRating = baker.avg_rating
  const reviewCount = baker.review_count || reviews.length

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#f5f0eb' }}>
      <Navbar />

      {/* Baker availability banners */}
{(baker.is_on_vacation || baker.is_at_capacity || baker.is_emergency_pause) && (
  <div className="max-w-5xl mx-auto px-4 md:px-6 pt-6">
    {baker.is_emergency_pause && (
      <div className="rounded-2xl px-5 py-4 mb-4" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
        <p className="font-bold text-sm" style={{ color: '#991b1b' }}>This baker is temporarily unavailable</p>
        <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>They have had an unexpected situation. Check back soon or browse other bakers.</p>
      </div>
    )}
    {baker.is_on_vacation && !baker.is_emergency_pause && (
      <div className="rounded-2xl px-5 py-4 mb-4" style={{ backgroundColor: '#dbeafe', border: '1px solid #bfdbfe' }}>
        <p className="font-bold text-sm" style={{ color: '#1e40af' }}>This baker is on vacation</p>
        <p className="text-xs mt-0.5" style={{ color: '#1e40af' }}>
          {baker.vacation_return_date ? 'Back on ' + new Date(baker.vacation_return_date + 'T00:00:00').toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' }) : 'Check back soon'}
        </p>
      </div>
    )}
    {baker.is_at_capacity && !baker.is_on_vacation && !baker.is_emergency_pause && (
      <div className="rounded-2xl px-5 py-4 mb-4" style={{ backgroundColor: '#fef9c3', border: '1px solid #fde68a' }}>
        <p className="font-bold text-sm" style={{ color: '#854d0e' }}>This baker is currently at capacity</p>
        <p className="text-xs mt-0.5" style={{ color: '#92400e' }}>They are not taking new orders right now. Save them to find them easily when they are available again.</p>
      </div>
    )}
  </div>
)}

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-lg mb-2" style={{ color: '#2d1a0e' }}>You need an account to place an order</h3>
            <p className="text-sm mb-5" style={{ color: '#5c3d2e' }}>Create a free account to send your order request, track your order, and message your baker.</p>
            <div className="flex flex-col gap-2">
              <Link href={'/signup?redirect=/bakers/' + id} className="w-full py-3 rounded-xl text-center text-sm font-semibold text-white" style={{ backgroundColor: '#2d1a0e' }}>Create Account</Link>
              <Link href={'/login?redirect=/bakers/' + id} className="w-full py-3 rounded-xl text-center text-sm font-semibold border" style={{ borderColor: '#e0d5cc', color: '#2d1a0e' }}>Sign In</Link>
              <button onClick={() => setShowAuthModal(false)} className="text-xs mt-1" style={{ color: '#9c7b6b' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            {messageSent ? (
              <div className="text-center py-6">
                <p className="text-3xl mb-3">✓</p>
                <p className="font-bold text-lg mb-1" style={{ color: '#2d1a0e' }}>Message sent!</p>
                <p className="text-sm" style={{ color: '#5c3d2e' }}>{baker.business_name} will reply in your messages.</p>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg" style={{ color: '#2d1a0e' }}>Message {baker.business_name}</h3>
                    <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>Ask a question before placing an order</p>
                  </div>
                  <button onClick={() => { setShowMessageModal(false); setMessageText('') }}
                    className="text-sm opacity-50 hover:opacity-100" style={{ color: '#2d1a0e' }}>✕</button>
                </div>

                {!currentUser ? (
  <div className="text-center py-4">
    <p className="text-sm mb-4" style={{ color: '#5c3d2e' }}>Sign in to message this baker. Messaging is available after placing an order.</p>
    <div className="flex gap-3">
      <Link href={'/login?redirect=/bakers/' + id}
                        className="flex-1 text-center py-3 rounded-xl border text-sm font-semibold"
                        style={{ borderColor: '#2d1a0e', color: '#2d1a0e' }}>
                        Sign In
                      </Link>
                      <Link href={'/signup?redirect=/bakers/' + id}
                        className="flex-1 text-center py-3 rounded-xl text-white text-sm font-semibold"
                        style={{ backgroundColor: '#2d1a0e' }}>
                        Create Account
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    <textarea
                      value={messageText}
                      onChange={e => setMessageText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                      rows={4}
                      placeholder={'Hi! I\'m interested in ordering a custom cake for...'}
                      autoFocus
                      className="w-full px-4 py-3 rounded-xl border text-sm resize-none mb-4"
                      style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
                    <div className="flex gap-3">
                      <button onClick={() => { setShowMessageModal(false); setMessageText('') }}
                        className="flex-1 py-3 rounded-xl border text-sm font-semibold"
                        style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>
                        Cancel
                      </button>
                      <button onClick={sendMessage} disabled={sendingMessage || !messageText.trim()}
                        className="flex-1 py-3 rounded-xl text-white text-sm font-semibold"
                        style={{ backgroundColor: '#2d1a0e', opacity: (!messageText.trim() || sendingMessage) ? 0.6 : 1 }}>
                        {sendingMessage ? 'Sending...' : 'Send Message'}
                      </button>
                    </div>
                    <p className="text-xs text-center mt-3" style={{ color: '#5c3d2e' }}>
                      Replies will appear in your <Link href="/dashboard/customer?tab=messages" className="underline">messages</Link>
                    </p>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">

          {/* Left Column */}
          <div className="md:col-span-2 flex flex-col gap-6">

            {/* Header Card */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex items-start gap-5">
                <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#f5f0eb' }}>
                  {baker.profile_photo_url
                    ? <img src={baker.profile_photo_url} alt={baker.business_name} className="w-full h-full object-cover" />
                    : <span className="text-2xl font-bold" style={{ color: '#5c3d2e' }}>{baker.business_name?.[0] || 'B'}</span>}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h1 className="text-2xl font-bold" style={{ color: '#2d1a0e' }}>{baker.business_name}</h1>
                    {baker.verified && (
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>✓ Verified</span>
                    )}
                    {baker.is_cottage_baker && (
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full" style={{ backgroundColor: '#fef9c3', color: '#854d0e' }}>Cottage Baker</span>
                    )}
                  </div>
                  <p className="text-sm mb-2" style={{ color: '#5c3d2e' }}>{baker.city}, {baker.state}</p>

                  {avgRating && reviewCount > 0 ? (
                    <div className="flex items-center gap-2 mb-3">
                      <Stars rating={avgRating} size={15} />
                      <span className="text-sm font-semibold" style={{ color: '#2d1a0e' }}>{avgRating.toFixed(1)}</span>
                      <span className="text-sm" style={{ color: '#5c3d2e' }}>({reviewCount} review{reviewCount !== 1 ? 's' : ''})</span>
                    </div>
                  ) : (
                    <p className="text-xs mb-3" style={{ color: '#9c7b6b' }}>No reviews yet</p>
                  )}

                  <div className="flex flex-wrap gap-2 mb-4">
                    {baker.starting_price && (
                      <span className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: '#f5f0eb', color: '#2d1a0e' }}>Starting from ${baker.starting_price}</span>
                    )}
                    {baker.lead_time_days && (
                      <span className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: '#f5f0eb', color: '#2d1a0e' }}>{baker.lead_time_days} day lead time</span>
                    )}
                    {baker.instagram_handle && (
                      <span className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: '#f5f0eb', color: '#2d1a0e' }}>@{baker.instagram_handle}</span>
                    )}
                  </div>

                  {/* Message Baker button */}
                  <button
                    onClick={() => setShowMessageModal(true)}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold border"
                    style={{ borderColor: '#2d1a0e', color: '#2d1a0e' }}>
                    Message {baker.business_name}
                  </button>
                </div>
              </div>
            </div>

            {/* About */}
            {baker.bio && (
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <h2 className="text-lg font-bold mb-3" style={{ color: '#2d1a0e' }}>About</h2>
                <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#5c3d2e' }}>{baker.bio}</p>
              </div>
            )}

            {/* Portfolio */}
            {portfolio.length > 0 && (
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <h2 className="text-lg font-bold mb-4" style={{ color: '#2d1a0e' }}>Portfolio</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {portfolio.map((item) => (
                    <div key={item.id} className="rounded-xl overflow-hidden" style={{ aspectRatio: '1' }}>
                      <img src={item.image_url} alt="Portfolio" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Specialties */}
            {baker.specialties?.length > 0 && (
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <h2 className="text-lg font-bold mb-4" style={{ color: '#2d1a0e' }}>Specialties</h2>
                <div className="flex flex-wrap gap-2">
                  {baker.specialties.map((s: string) => (
                    <span key={s} className="px-4 py-2 rounded-full text-sm font-medium" style={{ backgroundColor: '#f5f0eb', color: '#2d1a0e' }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Dietary Tags */}
            {baker.dietary_tags?.length > 0 && (
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <h2 className="text-lg font-bold mb-4" style={{ color: '#2d1a0e' }}>Dietary Options</h2>
                <div className="flex flex-wrap gap-2">
                  {baker.dietary_tags.map((tag: string) => (
                    <span key={tag} className="px-4 py-2 rounded-full text-sm font-medium" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>✓ {tag}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Service Details */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h2 className="text-lg font-bold mb-4" style={{ color: '#2d1a0e' }}>Service Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                {baker.delivery_available && <div className="flex items-center gap-2 text-sm" style={{ color: '#5c3d2e' }}>Delivery available</div>}
                {baker.pickup_available && <div className="flex items-center gap-2 text-sm" style={{ color: '#5c3d2e' }}>Pickup available</div>}
                {baker.rush_orders_available && <div className="flex items-center gap-2 text-sm" style={{ color: '#5c3d2e' }}><span>⚡</span> Rush orders accepted</div>}
                {baker.minimum_order > 0 && <div className="flex items-center gap-2 text-sm" style={{ color: '#5c3d2e' }}>${baker.minimum_order} minimum</div>}
                {baker.days_available?.length > 0 && (
                  <div className="flex items-center gap-2 text-sm col-span-2" style={{ color: '#5c3d2e' }}>
                    Available: {baker.days_available.join(', ')}
                  </div>
                )}
                {baker.cancellation_policy && (
                  <div className="flex items-center gap-2 text-sm col-span-2" style={{ color: '#5c3d2e' }}>
                    {baker.cancellation_policy}
                  </div>
                )}
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold" style={{ color: '#2d1a0e' }}>Reviews</h2>
                {avgRating && reviewCount > 0 && (
                  <div className="flex items-center gap-2">
                    <Stars rating={avgRating} size={14} />
                    <span className="text-sm font-semibold" style={{ color: '#2d1a0e' }}>{avgRating.toFixed(1)}</span>
                    <span className="text-sm" style={{ color: '#5c3d2e' }}>· {reviewCount} review{reviewCount !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
              {reviews.length === 0 ? (
                <div className="text-center py-8 rounded-xl" style={{ backgroundColor: '#faf8f6' }}>
                  <p className="text-sm font-medium mb-1" style={{ color: '#2d1a0e' }}>No reviews yet</p>
                  <p className="text-xs" style={{ color: '#5c3d2e' }}>Reviews appear after completed orders</p>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {reviews.map((review) => (
                    <div key={review.id} className="pb-5 border-b last:border-b-0 last:pb-0" style={{ borderColor: '#f5f0eb' }}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold" style={{ color: '#2d1a0e' }}>{review.customer_name || 'Verified Customer'}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#9c7b6b' }}>
                            {new Date(review.created_at).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                            {review.event_type && <span> · {review.event_type}</span>}
                          </p>
                        </div>
                        <Stars rating={review.rating} size={13} />
                      </div>
                      {review.comment && (
                        <p className="text-sm leading-relaxed" style={{ color: '#5c3d2e' }}>{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Column - Order Form */}
          <div>
            <div className="bg-white rounded-2xl p-6 shadow-sm md:sticky md:top-6">
              {isBlocked ? (
                <div className="text-center py-8">
                  <p className="text-sm font-medium mb-1" style={{ color: '#2d1a0e' }}>This baker is not currently accepting new orders.</p>
                  <p className="text-xs" style={{ color: '#5c3d2e' }}>You can browse other bakers on Whiskly.</p>
                </div>
              ) : submitted ? (
                <div className="text-center py-8">
                  <p className="text-4xl mb-3">🎉</p>
                  <h3 className="font-bold text-lg mb-2" style={{ color: '#2d1a0e' }}>Order Sent!</h3>
                  <p className="text-sm mb-1" style={{ color: '#5c3d2e' }}>{baker.business_name} will be in touch soon.</p>
                  <p className="text-xs" style={{ color: '#5c3d2e' }}>Taking you to your messages...</p>
                </div>
              ) : (
                <>
                  <h3 className="font-bold text-lg mb-0.5" style={{ color: '#2d1a0e' }}>Start Your Order</h3>
                  <p className="text-xs mb-4" style={{ color: '#5c3d2e' }}>Describe your vision — no payment until your baker confirms</p>
                  <p className="text-xs mb-4" style={{ color: '#5c3d2e' }}>Fields marked <span style={{ color: '#dc2626' }}>*</span> are required</p>
                  {reorderBanner && (
                    <div className="mb-4 rounded-xl px-4 py-3 flex items-center gap-3" style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa' }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5l1.7 3.5 3.8.6-2.8 2.7.7 3.9L8 10.5l-3.4 1.7.7-3.9L2.5 5.6l3.8-.6z" fill="#c2410c" /></svg>
                      <p className="text-xs font-semibold" style={{ color: '#c2410c' }}>Pre-filled from your previous order — update any details and hit Send!</p>
                    </div>
                  )}

                  {formError && (
                    <div className="mb-3 px-4 py-3 rounded-xl text-xs font-medium" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>
                      {formError}
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: '#2d1a0e' }}>Your Name <span style={{ color: '#dc2626' }}>*</span></label>
                      <input value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })}
                        placeholder="Jane Smith" className="w-full px-3 py-2.5 rounded-lg border text-sm"
                        style={{ borderColor: !form.customer_name && attempted ? '#dc2626' : '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: '#2d1a0e' }}>Email <span style={{ color: '#dc2626' }}>*</span></label>
                      <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                        placeholder="you@example.com" className="w-full px-3 py-2.5 rounded-lg border text-sm"
                        style={{ borderColor: !form.email && attempted ? '#dc2626' : '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: '#2d1a0e' }}>What are you ordering? <span style={{ color: '#dc2626' }}>*</span></label>
                      <select value={form.item_type} onChange={e => setForm({ ...form, item_type: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-lg border text-sm"
                        style={{ borderColor: !form.item_type && attempted ? '#dc2626' : '#e0d5cc', color: form.item_type ? '#2d1a0e' : '#9c7b6b', backgroundColor: '#faf8f6' }}>
                        <option value="">Select item type</option>
                        <option>Custom Cake</option>
                        <option>Cupcakes</option>
                        <option>Cookies</option>
                        <option>Cake Pops</option>
                        <option>Brownies</option>
                        <option>Macarons</option>
                        <option>Cheesecake</option>
                        <option>Pie</option>
                        <option>Assorted Desserts</option>
                        <option>Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: '#2d1a0e' }}>Event Type <span style={{ color: '#dc2626' }}>*</span></label>
                      <select value={form.event_type} onChange={e => setForm({ ...form, event_type: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-lg border text-sm"
                        style={{ borderColor: !form.event_type && attempted ? '#dc2626' : '#e0d5cc', color: form.event_type ? '#2d1a0e' : '#9c7b6b', backgroundColor: '#faf8f6' }}>
                        <option value="">Select event</option>
                        <option>Birthday</option>
                        <option>Wedding</option>
                        <option>Baby Shower</option>
                        <option>Bridal Shower</option>
                        <option>Anniversary</option>
                        <option>Corporate Event</option>
                        <option>Holiday</option>
                        <option>Just a treat for myself</option>
                        <option>Craving something sweet</option>
                        <option>Gift for someone</option>
                        <option>Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: '#2d1a0e' }}>Event Date <span style={{ color: '#dc2626' }}>*</span></label>
                      <input type="date" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-lg border text-sm"
                        style={{ borderColor: !form.event_date && attempted ? '#dc2626' : '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
                    </div>

                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold mb-1" style={{ color: '#2d1a0e' }}>Servings <span style={{ color: '#dc2626' }}>*</span></label>
                        <input value={form.servings} onChange={e => setForm({ ...form, servings: e.target.value })}
                          placeholder="e.g. 50" className="w-full px-3 py-2.5 rounded-lg border text-sm"
                          style={{ borderColor: !form.servings && attempted ? '#dc2626' : '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-semibold mb-1" style={{ color: '#2d1a0e' }}>Budget ($) <span style={{ color: '#dc2626' }}>*</span></label>
                        <input type="number" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })}
                          placeholder="150" className="w-full px-3 py-2.5 rounded-lg border text-sm"
                          style={{ borderColor: !form.budget && attempted ? '#dc2626' : '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
                      </div>
                    </div>

                    {showFulfillment && (
                      <div>
                        <label className="block text-xs font-semibold mb-1" style={{ color: '#2d1a0e' }}>Delivery or Pickup? <span style={{ color: '#dc2626' }}>*</span></label>
                        <select value={form.fulfillment_type} onChange={e => setForm({ ...form, fulfillment_type: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-lg border text-sm"
                          style={{ borderColor: !form.fulfillment_type && attempted ? '#dc2626' : '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }}>
                          <option value="">Select preference</option>
                          <option value="delivery">Delivery</option>
                          <option value="pickup">Pickup</option>
                        </select>
                      </div>
                    )}

                    {form.fulfillment_type === 'delivery' && (
                      <div className="flex flex-col gap-2 p-3 rounded-xl" style={{ backgroundColor: '#f5f0eb' }}>
                        <p className="text-xs font-semibold" style={{ color: '#2d1a0e' }}>Delivery Address <span style={{ color: '#dc2626' }}>*</span></p>
                        <p className="text-xs" style={{ color: '#5c3d2e' }}>Only your city, state & zip are shown to the baker until they accept your order.</p>
                        <div className="relative">
                          <input
                            ref={addressInputRef}
                            value={form.delivery_address}
                            onChange={e => handleAddressInput(e.target.value)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                            placeholder="Start typing your address..."
                            className="w-full px-3 py-2 rounded-lg border text-sm"
                            style={{ borderColor: !form.delivery_address && attempted ? '#dc2626' : '#e0d5cc', color: '#2d1a0e', backgroundColor: 'white' }}
                            autoComplete="off" />
                          {showSuggestions && addressSuggestions.length > 0 && (
                            <div className="absolute left-0 right-0 bg-white rounded-xl border shadow-xl"
                              style={{ borderColor: '#e0d5cc', top: '100%', marginTop: '4px', zIndex: 9999 }}>
                              {addressSuggestions.map((s: any, i: number) => (
                                <button key={i} type="button"
                                  onMouseDown={() => selectAddressSuggestion(s)}
                                  className="w-full px-3 py-2.5 text-left text-sm border-b last:border-b-0"
                                  style={{ color: '#2d1a0e', borderColor: '#f5f0eb', backgroundColor: 'white' }}
                                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f5f0eb')}
                                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'white')}>
                                  <span className="font-medium">{s.placePrediction?.mainText?.toString() || s.placePrediction?.text?.toString()}</span>
                                  <span className="text-xs ml-1" style={{ color: '#5c3d2e' }}>{s.placePrediction?.secondaryText?.toString()}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        {(form.delivery_city || form.delivery_state || form.delivery_zip) ? (
                          <div className="flex gap-2 items-center px-3 py-2 rounded-lg" style={{ backgroundColor: '#dcfce7', border: '1px solid #bbf7d0' }}>
                            <span className="text-xs" style={{ color: '#166534' }}>✓</span>
                            <span className="text-sm font-medium flex-1" style={{ color: '#166534' }}>
                              {form.delivery_city}{form.delivery_state ? ', ' + form.delivery_state : ''}{form.delivery_zip ? ' ' + form.delivery_zip : ''}
                            </span>
                            <button type="button" onClick={() => setForm(f => ({ ...f, delivery_address: '', delivery_city: '', delivery_state: '', delivery_zip: '' }))}
                              className="text-xs underline" style={{ color: '#166534' }}>Change</button>
                          </div>
                        ) : (attempted && (!form.delivery_city || !form.delivery_zip)) ? (
                          <p className="text-xs" style={{ color: '#dc2626' }}>Select an address from the dropdown to autofill city, state & zip</p>
                        ) : null}
                      </div>
                    )}

                    {form.fulfillment_type === 'pickup' && (
                      <div className="px-3 py-2.5 rounded-xl text-xs" style={{ backgroundColor: '#f5f0eb', color: '#5c3d2e' }}>
                        Pickup location ({baker.city}, {baker.state}) will be shared once your baker accepts your order.
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: '#2d1a0e' }}>Flavor Preferences <span style={{ color: '#dc2626' }}>*</span></label>
                      <input value={form.flavor_preferences} onChange={e => setForm({ ...form, flavor_preferences: e.target.value })}
                        placeholder="e.g. Chocolate, vanilla bean, lemon..."
                        className="w-full px-3 py-2.5 rounded-lg border text-sm"
                        style={{ borderColor: !form.flavor_preferences && attempted ? '#dc2626' : '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: '#2d1a0e' }}>Allergen / Dietary Notes</label>
                      <input value={form.allergen_notes} onChange={e => setForm({ ...form, allergen_notes: e.target.value })}
                        placeholder="e.g. Nut-free, gluten-free, vegan..."
                        className="w-full px-3 py-2.5 rounded-lg border text-sm"
                        style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: '#2d1a0e' }}>Describe your vision</label>
                      <textarea value={form.item_description} onChange={e => setForm({ ...form, item_description: e.target.value })}
                        rows={3} placeholder="3 tier chocolate cake with gold details, floral accents..."
                        className="w-full px-3 py-2.5 rounded-lg border text-sm resize-none"
                        style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: '#2d1a0e' }}>
                        Inspiration Photos <span className="font-normal ml-1" style={{ color: '#5c3d2e' }}>(up to 3)</span>
                      </label>
                      {inspirationPreviews.length > 0 && (
                        <div className="flex gap-2 mb-2 flex-wrap">
                          {inspirationPreviews.map((src, i) => (
                            <div key={i} className="relative">
                              <img src={src} alt={'Inspiration ' + (i + 1)} className="w-16 h-16 object-cover rounded-lg border" style={{ borderColor: '#e0d5cc' }} />
                              <button onClick={() => removeInspirationPhoto(i)}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-white flex items-center justify-center text-xs font-bold"
                                style={{ backgroundColor: '#991b1b' }}>✕</button>
                            </div>
                          ))}
                        </div>
                      )}
                      {inspirationFiles.length < 3 && (
                        <label className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium w-full"
                          style={{ borderColor: '#e0d5cc', color: '#5c3d2e', backgroundColor: '#faf8f6' }}>
                          <span>+ Add photo</span>
                          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleInspirationChange} />
                        </label>
                      )}
                      <p className="text-xs mt-1.5 leading-relaxed" style={{ color: '#5c3d2e' }}>Baker uses photos for inspiration only — not exact replicas.</p>
                    </div>

                    {(baker.is_on_vacation || baker.is_at_capacity || baker.is_emergency_pause) && (
  <div className="px-4 py-3 rounded-xl text-xs font-semibold text-center" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>
    {baker.is_emergency_pause ? 'This baker is temporarily unavailable' : baker.is_on_vacation ? 'This baker is on vacation until ' + (baker.vacation_return_date ? new Date(baker.vacation_return_date + 'T00:00:00').toLocaleDateString([], { month: 'long', day: 'numeric' }) : 'further notice') : 'This baker is not accepting new orders right now'}
  </div>
)}

                    <button onClick={handleSubmit} disabled={submitting || baker.is_on_vacation || baker.is_at_capacity || baker.is_emergency_pause}
                      className="w-full py-3 rounded-xl text-white font-semibold text-sm mt-1"
                      style={{ backgroundColor: '#2d1a0e', opacity: submitting ? 0.7 : 1 }}>
                      {submitting ? 'Sending...' : 'Start Your Order with ' + baker.business_name}
                    </button>

                    
                    <p className="text-xs text-center" style={{ color: '#5c3d2e' }}>No payment until your baker confirms</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <footer className="text-center py-8 mt-10" style={{ backgroundColor: '#2d1a0e' }}>
        <p className="text-sm" style={{ color: '#e0d5cc' }}>© 2026 Whiskly. All rights reserved. · <a href="mailto:support@whiskly.co" className="underline">support@whiskly.co</a></p>
      </footer>
    </main>
  )
}