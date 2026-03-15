'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const TABS = ['Today', 'Featured', 'Directory', 'Campaigns', 'Content Hub', 'Social Log', 'Seasonal']

const PLATFORMS = ['Instagram', 'TikTok', 'Facebook', 'Threads', 'Lemon8']

const PLATFORM_TIPS: Record<string, string> = {
  Instagram: 'Use 3-5 hashtags, tag location, lead with the visual hook. Best length: 125 chars before "more".',
  TikTok: 'Keep it punchy. Start with a hook in the first line. Use trending sounds reference. 150 chars max.',
  Facebook: 'More conversational, longer is okay. Ask a question to drive comments. No hashtag spam.',
  Threads: 'Short and conversational. Max 500 chars. Feels like Twitter — be direct and human.',
  Lemon8: 'Lifestyle-forward. More descriptive, like a mini blog. Great for baking aesthetics and recipes.',
}

export default function MarketingPortal() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [activeTab, setActiveTab] = useState('Today')

  const [bakers, setBakers] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [socialLog, setSocialLog] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Featured baker state
  const [bakerSearch, setBakerSearch] = useState('')
  const [directorySearch, setDirectorySearch] = useState('')
  const [directorySpecialty, setDirectorySpecialty] = useState('')
  const [directoryLocation, setDirectoryLocation] = useState('')
  const [directoryFilter, setDirectoryFilter] = useState('all')

  // Campaign state
  const [emailAudience, setEmailAudience] = useState<'bakers' | 'customers' | 'all'>('all')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [emailPreview, setEmailPreview] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)

  // Content hub state
  const [selectedBaker, setSelectedBaker] = useState<any>(null)
  const [selectedPlatform, setSelectedPlatform] = useState('Instagram')
  const [generatingCaption, setGeneratingCaption] = useState(false)
  const [generatedCaptions, setGeneratedCaptions] = useState<Record<string, string>>({})
  const [copiedPlatform, setCopiedPlatform] = useState('')

  // Social log state
  const [newPost, setNewPost] = useState({ baker_id: '', platform: 'Instagram', caption: '', post_date: new Date().toISOString().slice(0, 10) })
  const [savingPost, setSavingPost] = useState(false)

  function handleAuth() {
    if (password === process.env.NEXT_PUBLIC_MARKETING_PASSWORD) {
      setAuthed(true)
      loadData()
    } else {
      setAuthError('Incorrect password.')
    }
  }

  async function loadData() {
    setLoading(true)
    const [bakersRes, ordersRes] = await Promise.all([
      supabase.from('bakers').select('*').eq('is_active', true).order('created_at', { ascending: false }),
      supabase.from('orders').select('baker_id, status, created_at, budget, amount_total, deposit_paid_at').order('created_at', { ascending: false }),
    ])
    setBakers(bakersRes.data || [])
    setOrders(ordersRes.data || [])

    // Load campaigns from localStorage (simple persistence)
    const saved = localStorage.getItem('whiskly-campaigns')
    if (saved) setCampaigns(JSON.parse(saved))
    const savedPosts = localStorage.getItem('whiskly-social-log')
    if (savedPosts) setSocialLog(JSON.parse(savedPosts))

    setLoading(false)
  }

  // Baker metrics
  function getBakerMetrics(bakerId: string) {
    const bakerOrders = orders.filter(o => o.baker_id === bakerId)
    const completedOrders = bakerOrders.filter(o => o.status === 'complete')
    const revenue = bakerOrders.filter(o => o.deposit_paid_at).reduce((s, o) => s + (o.amount_total || (o.budget * 100) || 0), 0) / 100
    return { totalOrders: bakerOrders.length, completedOrders: completedOrders.length, revenue }
  }

  // Top performers
  const topPerformers = [...bakers]
    .map(b => ({ ...b, ...getBakerMetrics(b.id) }))
    .sort((a, b) => b.completedOrders - a.completedOrders || b.revenue - a.revenue)
    .slice(0, 5)

  // Featured bakers with days remaining
  const featuredBakers = bakers.filter(b => b.is_featured)
  const unfeaturedBakers = bakers.filter(b => !b.is_featured && b.is_active)

  function getDaysAsFeatured(baker: any) {
    if (!baker.featured_since) return null
    return Math.floor((Date.now() - new Date(baker.featured_since).getTime()) / 86400000)
  }

  async function featureBaker(baker: any) {
    const now = new Date().toISOString()
    await supabase.from('bakers').update({ is_featured: true, featured_since: now }).eq('id', baker.id)
    setBakers(bakers.map(b => b.id === baker.id ? { ...b, is_featured: true, featured_since: now } : b))
  }

  async function unfeatureBaker(baker: any) {
    await supabase.from('bakers').update({ is_featured: false, featured_since: null }).eq('id', baker.id)
    setBakers(bakers.map(b => b.id === baker.id ? { ...b, is_featured: false, featured_since: null } : b))
  }

  // Individual baker outreach
  async function sendBakerMessage(baker: any, message: string) {
    await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'announcement',
        to: baker.email,
        name: baker.business_name,
        subject: 'A note from the Whiskly team',
        body: message,
      })
    }).catch(() => {})
    alert('Message sent to ' + baker.business_name + '!')
  }

  // Campaign sending
  async function sendCampaign() {
    if (!emailSubject.trim() || !emailBody.trim()) return
    setSendingEmail(true)

    let recipients: any[] = []
    if (emailAudience === 'bakers' || emailAudience === 'all') {
      const { data } = await supabase.from('bakers').select('email, business_name').eq('is_active', true)
      recipients = [...recipients, ...(data || []).map(b => ({ email: b.email, name: b.business_name }))]
    }
    if (emailAudience === 'customers' || emailAudience === 'all') {
      const { data } = await supabase.from('customers').select('email, full_name')
      recipients = [...recipients, ...(data || []).map(c => ({ email: c.email, name: c.full_name }))]
    }

    for (const r of recipients) {
      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'announcement', to: r.email, name: r.name, subject: emailSubject, body: emailBody })
      }).catch(() => {})
    }

    const newCampaign = {
      id: Date.now().toString(),
      subject: emailSubject,
      audience: emailAudience,
      recipients: recipients.length,
      sent_at: new Date().toISOString(),
      body: emailBody,
    }
    const updated = [newCampaign, ...campaigns]
    setCampaigns(updated)
    localStorage.setItem('whiskly-campaigns', JSON.stringify(updated))

    setSendingEmail(false)
    setEmailPreview(false)
    setEmailSubject('')
    setEmailBody('')
    alert('Campaign sent to ' + recipients.length + ' recipients!')
  }

  // Caption generation
  async function generateCaptions(baker: any) {
    setGeneratingCaption(true)
    setSelectedBaker(baker)
    const metrics = getBakerMetrics(baker.id)

    const prompt = `Generate social media captions to promote this baker on Whiskly marketplace.

Baker: ${baker.business_name}
Location: ${baker.city}, ${baker.state}
Specialties: ${baker.specialties?.join(', ') || 'Custom cakes and baked goods'}
Bio: ${baker.bio || 'Independent baker creating custom baked goods'}
Rating: ${baker.avg_rating ? baker.avg_rating.toFixed(1) + '/5' : 'New baker'}
Orders completed: ${metrics.completedOrders}
${baker.is_pro ? 'Pro verified baker' : ''}

Generate one caption for each platform: Instagram, TikTok, Facebook, Threads, Lemon8.
Keep each caption authentic, not salesy. Focus on the human story and the craft.
Include the baker profile link placeholder: [PROFILE_LINK]

Format your response as JSON with keys: Instagram, TikTok, Facebook, Threads, Lemon8`

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        })
      })
      const data = await res.json()
      const text = data.content?.[0]?.text || ''
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        const profileUrl = 'https://whiskly.vercel.app/bakers/' + baker.id
        const withLinks: Record<string, string> = {}
        for (const platform of PLATFORMS) {
          withLinks[platform] = (parsed[platform] || '').replace('[PROFILE_LINK]', profileUrl)
        }
        setGeneratedCaptions(withLinks)
      }
    } catch (err) {
      console.error('Caption generation error:', err)
    }
    setGeneratingCaption(false)
  }

  function copyCaption(platform: string) {
    const caption = generatedCaptions[platform]
    if (!caption) return
    navigator.clipboard.writeText(caption)
    setCopiedPlatform(platform)
    setTimeout(() => setCopiedPlatform(''), 2000)
  }

  // Social log
  function savePost() {
    if (!newPost.baker_id || !newPost.caption) return
    setSavingPost(true)
    const baker = bakers.find(b => b.id === newPost.baker_id)
    const post = {
      id: Date.now().toString(),
      ...newPost,
      baker_name: baker?.business_name || '',
      created_at: new Date().toISOString(),
    }
    const updated = [post, ...socialLog]
    setSocialLog(updated)
    localStorage.setItem('whiskly-social-log', JSON.stringify(updated))
    setNewPost({ baker_id: '', platform: 'Instagram', caption: '', post_date: new Date().toISOString().slice(0, 10) })
    setSavingPost(false)
  }

  function deletePost(id: string) {
    const updated = socialLog.filter(p => p.id !== id)
    setSocialLog(updated)
    localStorage.setItem('whiskly-social-log', JSON.stringify(updated))
  }

  // Today's action items
  const expiringSoon = featuredBakers.filter(b => {
    const days = getDaysAsFeatured(b)
    return days !== null && days >= 25
  })
  const neverFeatured = bakers.filter(b => !b.is_featured && !b.featured_since && b.is_active)
  const noRecentPost = bakers.filter(b => {
    const lastPost = socialLog.find(p => p.baker_id === b.id)
    if (!lastPost) return true
    const daysSince = Math.floor((Date.now() - new Date(lastPost.created_at).getTime()) / 86400000)
    return daysSince > 30
  }).slice(0, 3)

  const SPECIALTIES = ['Wedding Cakes', 'Birthday Cakes', 'Custom Cookies', 'Cupcakes', 'Kids Party Cakes', 'Vegan/Gluten Free', 'Macarons', 'Cheesecakes']

  const SEASONAL_CAMPAIGNS = [
    { name: "Valentine's Day", date: 'Feb 14', daysUntil: Math.floor((new Date(new Date().getFullYear(), 1, 14).getTime() - Date.now()) / 86400000), emoji: '💝', tip: 'Feature bakers with heart-shaped cakes and romantic designs. Send campaign 3 weeks out.' },
    { name: "Mother's Day", date: 'May 11', daysUntil: Math.floor((new Date(new Date().getFullYear(), 4, 11).getTime() - Date.now()) / 86400000), emoji: '🌸', tip: 'Highlight floral cakes and custom designs. Most orders placed 2 weeks before.' },
    { name: 'Wedding Season', date: 'May–Oct', daysUntil: null, emoji: '💍', tip: 'Feature bakers with wedding cake portfolios. Run ongoing campaign May through October.' },
    { name: 'Back to School', date: 'Aug–Sep', daysUntil: Math.floor((new Date(new Date().getFullYear(), 7, 15).getTime() - Date.now()) / 86400000), emoji: '🎒', tip: 'Push custom cookies and treats for teachers and school events.' },
    { name: 'Halloween', date: 'Oct 31', daysUntil: Math.floor((new Date(new Date().getFullYear(), 9, 31).getTime() - Date.now()) / 86400000), emoji: '🎃', tip: 'Spooky custom cakes and cookies. Feature bakers with Halloween portfolio photos.' },
    { name: 'Thanksgiving', date: 'Nov 27', daysUntil: Math.floor((new Date(new Date().getFullYear(), 10, 27).getTime() - Date.now()) / 86400000), emoji: '🍂', tip: 'Custom pies, cakes, and dessert boxes for family gatherings.' },
    { name: 'Holiday Season', date: 'Dec 1–25', daysUntil: Math.floor((new Date(new Date().getFullYear(), 11, 1).getTime() - Date.now()) / 86400000), emoji: '🎄', tip: 'Biggest season of the year. Feature all Pro bakers. Run weekly campaigns in December.' },
  ]

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f0eb' }}>
        <div className="bg-white rounded-2xl p-8 shadow-sm w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#2d1a0e' }}>Marketing Portal</h1>
          <p className="text-sm mb-6" style={{ color: '#5c3d2e' }}>Whiskly marketing team access</p>
          <div className="relative mb-3">
  <input
    type={showPassword ? 'text' : 'password'}
    value={password}
    onChange={e => setPassword(e.target.value)}
    onKeyDown={e => e.key === 'Enter' && handleAuth()}
    placeholder="Enter marketing password"
    className="w-full px-4 py-3 rounded-xl border text-sm"
    style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
  <button type="button" onClick={() => setShowPassword(!showPassword)}
    className="absolute right-3 top-3 text-xs font-semibold"
    style={{ color: '#5c3d2e' }}>
    {showPassword ? 'Hide' : 'Show'}
  </button>
</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f0eb' }}>
      <nav className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-lg font-bold" style={{ color: '#2d1a0e' }}>🎂 Whiskly</Link>
          <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>Marketing</span>
        </div>
        <div className="flex items-center gap-4 text-xs" style={{ color: '#5c3d2e' }}>
          <span>{bakers.length} active bakers</span>
          <span>{featuredBakers.length} featured</span>
          <span>{campaigns.length} campaigns sent</span>
          <button onClick={() => setAuthed(false)} className="px-3 py-1.5 rounded-lg border text-xs font-semibold" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>Sign Out</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-4 py-2 rounded-lg text-sm font-semibold relative"
              style={{ backgroundColor: activeTab === tab ? '#2d1a0e' : 'white', color: activeTab === tab ? 'white' : '#2d1a0e' }}>
              {tab}
              {tab === 'Today' && (expiringSoon.length + neverFeatured.slice(0, 3).length) > 0 && (
                <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: '#f59e0b', color: 'white' }}>
                  {expiringSoon.length + Math.min(neverFeatured.length, 3)}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading && <p className="text-sm" style={{ color: '#5c3d2e' }}>Loading...</p>}

        {/* TODAY */}
        {activeTab === 'Today' && (
          <div className="flex flex-col gap-6">

            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Active Bakers', value: bakers.length },
                { label: 'Featured', value: featuredBakers.length },
                { label: 'Pro Bakers', value: bakers.filter(b => b.is_pro).length },
                { label: 'Campaigns Sent', value: campaigns.length },
                { label: 'Social Posts Logged', value: socialLog.length },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm text-center">
                  <p className="text-2xl font-bold" style={{ color: '#2d1a0e' }}>{s.value}</p>
                  <p className="text-xs mt-1" style={{ color: '#5c3d2e' }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Action items */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-4" style={{ color: '#2d1a0e' }}>Today's Action Items</h2>

              {expiringSoon.length === 0 && neverFeatured.length === 0 && noRecentPost.length === 0 ? (
                <div className="text-center py-8 rounded-xl" style={{ backgroundColor: '#f5f0eb' }}>
                  <p className="text-2xl mb-2">✓</p>
                  <p className="font-semibold" style={{ color: '#2d1a0e' }}>All caught up!</p>
                  <p className="text-sm mt-1" style={{ color: '#5c3d2e' }}>No urgent marketing tasks right now.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {expiringSoon.map(baker => (
                    <div key={baker.id} className="flex items-center justify-between p-4 rounded-xl border-l-4 gap-4"
                      style={{ backgroundColor: '#fef2f2', borderColor: '#dc2626' }}>
                      <div>
                        <p className="text-sm font-bold" style={{ color: '#2d1a0e' }}>Featured baker expiring soon — {baker.business_name}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>Featured for {getDaysAsFeatured(baker)} days — 30 day limit approaching. Rotate or extend.</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => unfeatureBaker(baker)}
                          className="px-3 py-2 rounded-lg text-xs font-semibold border"
                          style={{ borderColor: '#dc2626', color: '#dc2626' }}>
                          Remove
                        </button>
                        <button onClick={() => featureBaker(baker)}
                          className="px-3 py-2 rounded-lg text-xs font-semibold text-white"
                          style={{ backgroundColor: '#2d1a0e' }}>
                          Reset Timer
                        </button>
                      </div>
                    </div>
                  ))}

                  {neverFeatured.slice(0, 3).map(baker => {
                    const metrics = getBakerMetrics(baker.id)
                    return (
                      <div key={baker.id} className="flex items-center justify-between p-4 rounded-xl border-l-4 gap-4"
                        style={{ backgroundColor: '#fffbeb', borderColor: '#f59e0b' }}>
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0" style={{ backgroundColor: '#f5f0eb' }}>
                            {baker.profile_photo_url
                              ? <img src={baker.profile_photo_url} alt="" className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center font-bold text-sm" style={{ color: '#2d1a0e' }}>{baker.business_name?.[0]}</div>}
                          </div>
                          <div>
                            <p className="text-sm font-bold" style={{ color: '#2d1a0e' }}>Never featured — {baker.business_name}</p>
                            <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>{baker.city}, {baker.state} · {metrics.completedOrders} orders · {baker.avg_rating ? '★ ' + baker.avg_rating.toFixed(1) : 'No rating yet'}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => { setSelectedBaker(baker); setActiveTab('Content Hub') }}
                            className="px-3 py-2 rounded-lg text-xs font-semibold border"
                            style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>
                            Create Content
                          </button>
                          <button onClick={() => featureBaker(baker)}
                            className="px-3 py-2 rounded-lg text-xs font-semibold text-white"
                            style={{ backgroundColor: '#f59e0b' }}>
                            Feature
                          </button>
                        </div>
                      </div>
                    )
                  })}

                  {noRecentPost.map(baker => (
                    <div key={baker.id} className="flex items-center justify-between p-4 rounded-xl border-l-4 gap-4"
                      style={{ backgroundColor: '#f5f0eb', borderColor: '#e0d5cc' }}>
                      <div>
                        <p className="text-sm font-bold" style={{ color: '#2d1a0e' }}>No recent social post — {baker.business_name}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>Hasn't been posted about in 30+ days. Consider creating content.</p>
                      </div>
                      <button onClick={() => { setSelectedBaker(baker); setActiveTab('Content Hub') }}
                        className="flex-shrink-0 px-3 py-2 rounded-lg text-xs font-semibold border"
                        style={{ borderColor: '#2d1a0e', color: '#2d1a0e' }}>
                        Create Content
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top performers */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold" style={{ color: '#2d1a0e' }}>Top Performers This Month</h2>
                <p className="text-xs" style={{ color: '#5c3d2e' }}>Great candidates to feature and promote</p>
              </div>
              <div className="flex flex-col gap-3">
                {topPerformers.map((baker, i) => (
                  <div key={baker.id} className="flex items-center justify-between p-4 rounded-xl"
                    style={{ backgroundColor: i === 0 ? '#fffbeb' : '#faf8f6' }}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-lg font-bold flex-shrink-0" style={{ color: i === 0 ? '#f59e0b' : '#e0d5cc' }}>#{i + 1}</span>
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0" style={{ backgroundColor: '#f5f0eb' }}>
                        {baker.profile_photo_url
                          ? <img src={baker.profile_photo_url} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center font-bold text-sm" style={{ color: '#2d1a0e' }}>{baker.business_name?.[0]}</div>}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold" style={{ color: '#2d1a0e' }}>{baker.business_name}</p>
                          {baker.is_pro && <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#2d1a0e', color: 'white' }}>Pro</span>}
                          {baker.is_featured && <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#f59e0b', color: 'white' }}>★ Featured</span>}
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>
                          {baker.city}, {baker.state} · {baker.completedOrders} orders · ${baker.revenue.toFixed(0)} revenue
                          {baker.avg_rating ? ' · ★ ' + baker.avg_rating.toFixed(1) : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => { setSelectedBaker(baker); setActiveTab('Content Hub') }}
                        className="px-3 py-2 rounded-lg text-xs font-semibold border"
                        style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>
                        Create Content
                      </button>
                      {!baker.is_featured ? (
                        <button onClick={() => featureBaker(baker)}
                          className="px-3 py-2 rounded-lg text-xs font-semibold text-white"
                          style={{ backgroundColor: '#8B4513' }}>
                          Feature
                        </button>
                      ) : (
                        <button onClick={() => unfeatureBaker(baker)}
                          className="px-3 py-2 rounded-lg text-xs font-semibold border"
                          style={{ borderColor: '#dc2626', color: '#dc2626' }}>
                          Unfeature
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* FEATURED */}
        {activeTab === 'Featured' && (
          <div className="flex flex-col gap-6">
            {featuredBakers.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-4" style={{ color: '#2d1a0e' }}>Currently Featured ({featuredBakers.length})</h2>
                <div className="flex flex-col gap-3">
                  {featuredBakers.map(baker => {
                    const days = getDaysAsFeatured(baker)
                    const expiring = days !== null && days >= 25
                    return (
                      <div key={baker.id} className="flex items-center justify-between p-4 rounded-xl border"
                        style={{ borderColor: expiring ? '#f59e0b' : '#e0d5cc', backgroundColor: expiring ? '#fffbeb' : 'white' }}>
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0" style={{ backgroundColor: '#f5f0eb' }}>
                            {baker.profile_photo_url
                              ? <img src={baker.profile_photo_url} alt="" className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center font-bold" style={{ color: '#2d1a0e' }}>{baker.business_name?.[0]}</div>}
                          </div>
                          <div>
                            <p className="text-sm font-bold" style={{ color: '#2d1a0e' }}>{baker.business_name}</p>
                            <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>{baker.city}, {baker.state}</p>
                            {days !== null && (
                              <p className="text-xs mt-0.5 font-semibold" style={{ color: expiring ? '#c2410c' : '#5c3d2e' }}>
                                {expiring ? '⚠ ' : ''}Featured for {days} day{days !== 1 ? 's' : ''} {expiring ? '— consider rotating' : ''}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Link href={'/bakers/' + baker.id} target="_blank"
                            className="px-3 py-2 rounded-lg text-xs font-semibold border"
                            style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>
                            View Profile
                          </Link>
                          <button onClick={() => featureBaker(baker)}
                            className="px-3 py-2 rounded-lg text-xs font-semibold border"
                            style={{ borderColor: '#2d1a0e', color: '#2d1a0e' }}>
                            Reset Timer
                          </button>
                          <button onClick={() => unfeatureBaker(baker)}
                            className="px-3 py-2 rounded-lg text-xs font-semibold border"
                            style={{ borderColor: '#dc2626', color: '#dc2626' }}>
                            Remove
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold" style={{ color: '#2d1a0e' }}>All Active Bakers</h2>
                <input value={bakerSearch} onChange={e => setBakerSearch(e.target.value)}
                  placeholder="Search..."
                  className="px-3 py-2 rounded-lg border text-sm"
                  style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
              </div>
              <div className="flex flex-col gap-2">
                {unfeaturedBakers
                  .filter(b => !bakerSearch || b.business_name?.toLowerCase().includes(bakerSearch.toLowerCase()))
                  .map(baker => {
                    const metrics = getBakerMetrics(baker.id)
                    return (
                      <div key={baker.id} className="flex items-center justify-between p-3 rounded-xl"
                        style={{ backgroundColor: '#faf8f6' }}>
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0" style={{ backgroundColor: '#f5f0eb' }}>
                            {baker.profile_photo_url
                              ? <img src={baker.profile_photo_url} alt="" className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center font-bold text-xs" style={{ color: '#2d1a0e' }}>{baker.business_name?.[0]}</div>}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold" style={{ color: '#2d1a0e' }}>{baker.business_name}</p>
                              {baker.is_pro && <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#2d1a0e', color: 'white' }}>Pro</span>}
                            </div>
                            <p className="text-xs" style={{ color: '#5c3d2e' }}>{baker.city}, {baker.state} · {metrics.completedOrders} orders{baker.avg_rating ? ' · ★ ' + baker.avg_rating.toFixed(1) : ''}</p>
                          </div>
                        </div>
                        <button onClick={() => featureBaker(baker)}
                          className="flex-shrink-0 px-3 py-2 rounded-lg text-xs font-semibold"
                          style={{ backgroundColor: '#f59e0b', color: 'white' }}>
                          ★ Feature
                        </button>
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>
        )}

        {/* DIRECTORY */}
        {activeTab === 'Directory' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <input value={directorySearch} onChange={e => setDirectorySearch(e.target.value)}
                placeholder="Search by name, city..."
                className="px-3 py-2 rounded-lg border text-sm flex-1 min-w-48"
                style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
              <select value={directorySpecialty} onChange={e => setDirectorySpecialty(e.target.value)}
                className="px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }}>
                <option value="">All Specialties</option>
                {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={directoryFilter} onChange={e => setDirectoryFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }}>
                <option value="all">All Bakers</option>
                <option value="pro">Pro Only</option>
                <option value="featured">Featured</option>
                <option value="top">Top Rated</option>
                <option value="new">Newest</option>
              </select>
            </div>

            <p className="text-xs mb-4" style={{ color: '#5c3d2e' }}>
              {bakers.filter(b => {
                const q = directorySearch.toLowerCase()
                const matchSearch = !q || b.business_name?.toLowerCase().includes(q) || b.city?.toLowerCase().includes(q)
                const matchSpecialty = !directorySpecialty || b.specialties?.includes(directorySpecialty)
                const matchFilter = directoryFilter === 'all' || (directoryFilter === 'pro' && b.is_pro) || (directoryFilter === 'featured' && b.is_featured) || (directoryFilter === 'top' && b.avg_rating >= 4) || directoryFilter === 'new'
                return matchSearch && matchSpecialty && matchFilter
              }).length} bakers shown
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: '1px solid #e0d5cc' }}>
                    {['Baker', 'Location', 'Specialties', 'Rating', 'Orders', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left py-2 px-3 font-semibold" style={{ color: '#5c3d2e' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bakers
                    .filter(b => {
                      const q = directorySearch.toLowerCase()
                      const matchSearch = !q || b.business_name?.toLowerCase().includes(q) || b.city?.toLowerCase().includes(q)
                      const matchSpecialty = !directorySpecialty || b.specialties?.includes(directorySpecialty)
                      const matchFilter = directoryFilter === 'all' || (directoryFilter === 'pro' && b.is_pro) || (directoryFilter === 'featured' && b.is_featured) || (directoryFilter === 'top' && b.avg_rating >= 4) || directoryFilter === 'new'
                      return matchSearch && matchSpecialty && matchFilter
                    })
                    .map(baker => {
                      const metrics = getBakerMetrics(baker.id)
                      return (
                        <tr key={baker.id} className="border-b" style={{ borderColor: '#f5f0eb' }}>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0" style={{ backgroundColor: '#f5f0eb' }}>
                                {baker.profile_photo_url
                                  ? <img src={baker.profile_photo_url} alt="" className="w-full h-full object-cover" />
                                  : <div className="w-full h-full flex items-center justify-center font-bold" style={{ color: '#2d1a0e', fontSize: '10px' }}>{baker.business_name?.[0]}</div>}
                              </div>
                              <div>
                                <p className="font-semibold" style={{ color: '#2d1a0e' }}>{baker.business_name}</p>
                                <p style={{ color: '#9c7b6b' }}>{baker.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3" style={{ color: '#5c3d2e' }}>{baker.city}, {baker.state}</td>
                          <td className="py-2.5 px-3" style={{ color: '#5c3d2e' }}>{baker.specialties?.slice(0, 2).join(', ') || '—'}</td>
                          <td className="py-2.5 px-3" style={{ color: '#2d1a0e' }}>{baker.avg_rating ? '★ ' + baker.avg_rating.toFixed(1) : '—'}</td>
                          <td className="py-2.5 px-3" style={{ color: '#2d1a0e' }}>{metrics.completedOrders}</td>
                          <td className="py-2.5 px-3">
                            <div className="flex gap-1 flex-wrap">
                              {baker.is_pro && <span className="px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#2d1a0e', color: 'white' }}>Pro</span>}
                              {baker.is_featured && <span className="px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#f59e0b', color: 'white' }}>★</span>}
                              {baker.is_founding_baker && <span className="px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#8B4513', color: 'white' }}>Founding</span>}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex gap-1.5">
                              <Link href={'/bakers/' + baker.id} target="_blank"
                                className="px-2 py-1 rounded text-xs font-semibold border"
                                style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>
                                View
                              </Link>
                              <button onClick={() => { setSelectedBaker(baker); setActiveTab('Content Hub') }}
                                className="px-2 py-1 rounded text-xs font-semibold border"
                                style={{ borderColor: '#8B4513', color: '#8B4513' }}>
                                Content
                              </button>
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

        {/* CAMPAIGNS */}
        {activeTab === 'Campaigns' && (
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm max-w-2xl">
              <h2 className="text-lg font-bold mb-1" style={{ color: '#2d1a0e' }}>Send Announcement</h2>
              <p className="text-sm mb-5" style={{ color: '#5c3d2e' }}>Send a platform-wide email to bakers, customers, or everyone.</p>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#2d1a0e' }}>Audience</label>
                  <div className="flex gap-3">
                    {[['all', 'Everyone'], ['bakers', 'Bakers only'], ['customers', 'Customers only']].map(([val, label]) => (
                      <button key={val} onClick={() => setEmailAudience(val as any)}
                        className="px-4 py-2 rounded-lg text-sm font-semibold border"
                        style={{ backgroundColor: emailAudience === val ? '#2d1a0e' : 'white', color: emailAudience === val ? 'white' : '#2d1a0e', borderColor: emailAudience === val ? '#2d1a0e' : '#e0d5cc' }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: '#2d1a0e' }}>Subject Line</label>
                  <input value={emailSubject} onChange={e => setEmailSubject(e.target.value)}
                    placeholder="e.g. Exciting news from Whiskly!"
                    className="w-full px-4 py-3 rounded-xl border text-sm"
                    style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: '#2d1a0e' }}>Message</label>
                  <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)}
                    rows={6} placeholder="Write your announcement here..."
                    className="w-full px-4 py-3 rounded-xl border text-sm resize-none"
                    style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setEmailPreview(!emailPreview)}
                    className="flex-1 py-3 rounded-xl border text-sm font-semibold"
                    style={{ borderColor: '#e0d5cc', color: '#2d1a0e' }}>
                    {emailPreview ? 'Hide Preview' : 'Preview'}
                  </button>
                  <button onClick={sendCampaign} disabled={sendingEmail || !emailSubject.trim() || !emailBody.trim()}
                    className="flex-1 py-3 rounded-xl text-white font-semibold text-sm"
                    style={{ backgroundColor: '#2d1a0e', opacity: (sendingEmail || !emailSubject.trim() || !emailBody.trim()) ? 0.6 : 1 }}>
                    {sendingEmail ? 'Sending...' : 'Send Campaign'}
                  </button>
                </div>

                {emailPreview && emailSubject && emailBody && (
                  <div className="p-4 rounded-xl border" style={{ borderColor: '#e0d5cc', backgroundColor: '#faf8f6' }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: '#5c3d2e' }}>Preview</p>
                    <p className="text-sm font-bold mb-2" style={{ color: '#2d1a0e' }}>{emailSubject}</p>
                    <p className="text-sm whitespace-pre-line" style={{ color: '#5c3d2e' }}>{emailBody}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Campaign history */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-4" style={{ color: '#2d1a0e' }}>Campaign History ({campaigns.length})</h2>
              {campaigns.length === 0 ? (
                <p className="text-sm" style={{ color: '#5c3d2e' }}>No campaigns sent yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {campaigns.map(c => (
                    <div key={c.id} className="flex items-start justify-between p-4 rounded-xl" style={{ backgroundColor: '#faf8f6' }}>
                      <div>
                        <p className="text-sm font-bold" style={{ color: '#2d1a0e' }}>{c.subject}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>
                          {new Date(c.sent_at).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })} · {c.recipients} recipients · {c.audience === 'all' ? 'Everyone' : c.audience}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full font-semibold flex-shrink-0" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>Sent</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CONTENT HUB */}
        {activeTab === 'Content Hub' && (
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-1" style={{ color: '#2d1a0e' }}>Content Hub</h2>
              <p className="text-sm mb-5" style={{ color: '#5c3d2e' }}>Select a baker to generate social captions and grab their assets for reposting.</p>

              {/* Baker selector */}
              <div className="mb-5">
                <label className="block text-sm font-semibold mb-2" style={{ color: '#2d1a0e' }}>Select Baker</label>
                <select
                  value={selectedBaker?.id || ''}
                  onChange={e => setSelectedBaker(bakers.find(b => b.id === e.target.value) || null)}
                  className="w-full max-w-sm px-4 py-3 rounded-xl border text-sm"
                  style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }}>
                  <option value="">Choose a baker...</option>
                  {bakers.map(b => <option key={b.id} value={b.id}>{b.business_name} — {b.city}, {b.state}</option>)}
                </select>
              </div>

              {selectedBaker && (
                <div className="flex flex-col gap-5">
                  {/* Baker info */}
                  <div className="flex items-center gap-4 p-4 rounded-xl" style={{ backgroundColor: '#f5f0eb' }}>
                    <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0" style={{ backgroundColor: '#e0d5cc' }}>
                      {selectedBaker.profile_photo_url
                        ? <img src={selectedBaker.profile_photo_url} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center font-bold text-lg" style={{ color: '#2d1a0e' }}>{selectedBaker.business_name?.[0]}</div>}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold" style={{ color: '#2d1a0e' }}>{selectedBaker.business_name}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>{selectedBaker.city}, {selectedBaker.state} · {selectedBaker.specialties?.join(', ')}</p>
                      {selectedBaker.avg_rating && <p className="text-xs mt-0.5" style={{ color: '#8B4513' }}>★ {selectedBaker.avg_rating.toFixed(1)} · {selectedBaker.review_count} reviews</p>}
                    </div>
                    <div className="flex gap-2">
                      <Link href={'/bakers/' + selectedBaker.id} target="_blank"
                        className="px-3 py-2 rounded-lg text-xs font-semibold border"
                        style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>
                        View Profile
                      </Link>
                      <button
                        onClick={() => navigator.clipboard.writeText('https://whiskly.vercel.app/bakers/' + selectedBaker.id)}
                        className="px-3 py-2 rounded-lg text-xs font-semibold border"
                        style={{ borderColor: '#2d1a0e', color: '#2d1a0e' }}>
                        Copy Link
                      </button>
                    </div>
                  </div>

                  {/* Portfolio assets */}
                  {selectedBaker.profile_photo_url && (
                    <div>
                      <p className="text-sm font-semibold mb-2" style={{ color: '#2d1a0e' }}>Profile Photo</p>
                      <div className="flex gap-3 flex-wrap">
                        <div className="relative group">
                          <img src={selectedBaker.profile_photo_url} alt="" className="w-24 h-24 object-cover rounded-xl border" style={{ borderColor: '#e0d5cc' }} />
                          <a href={selectedBaker.profile_photo_url} download target="_blank" rel="noopener noreferrer"
                            className="absolute inset-0 flex items-center justify-center rounded-xl opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold"
                            style={{ backgroundColor: 'rgba(45,26,14,0.6)' }}>
                            Download
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Generate captions */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold" style={{ color: '#2d1a0e' }}>Social Captions</p>
                      <button onClick={() => generateCaptions(selectedBaker)} disabled={generatingCaption}
                        className="px-4 py-2 rounded-lg text-xs font-semibold text-white"
                        style={{ backgroundColor: '#8B4513', opacity: generatingCaption ? 0.7 : 1 }}>
                        {generatingCaption ? 'Generating...' : Object.keys(generatedCaptions).length > 0 ? 'Regenerate' : 'Generate Captions'}
                      </button>
                    </div>

                    {Object.keys(generatedCaptions).length > 0 && (
                      <div className="flex flex-col gap-3">
                        {PLATFORMS.map(platform => (
                          <div key={platform} className="p-4 rounded-xl border" style={{ borderColor: '#e0d5cc', backgroundColor: '#faf8f6' }}>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-bold" style={{ color: '#2d1a0e' }}>{platform}</p>
                              <button onClick={() => copyCaption(platform)}
                                className="px-3 py-1 rounded-lg text-xs font-semibold border"
                                style={{ borderColor: copiedPlatform === platform ? '#166534' : '#e0d5cc', color: copiedPlatform === platform ? '#166534' : '#5c3d2e', backgroundColor: copiedPlatform === platform ? '#dcfce7' : 'white' }}>
                                {copiedPlatform === platform ? '✓ Copied!' : 'Copy'}
                              </button>
                            </div>
                            <p className="text-xs leading-relaxed mb-2" style={{ color: '#5c3d2e' }}>{generatedCaptions[platform]}</p>
                            <p className="text-xs italic" style={{ color: '#9c7b6b' }}>{PLATFORM_TIPS[platform]}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Log a post */}
                  <div className="p-4 rounded-xl border" style={{ borderColor: '#e0d5cc' }}>
                    <p className="text-sm font-semibold mb-3" style={{ color: '#2d1a0e' }}>Log a Social Post</p>
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-3">
                        <select value={newPost.platform} onChange={e => setNewPost({ ...newPost, platform: e.target.value, baker_id: selectedBaker.id })}
                          className="px-3 py-2 rounded-lg border text-sm flex-1"
                          style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: 'white' }}>
                          {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <input type="date" value={newPost.post_date} onChange={e => setNewPost({ ...newPost, post_date: e.target.value, baker_id: selectedBaker.id })}
                          className="px-3 py-2 rounded-lg border text-sm"
                          style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: 'white' }} />
                      </div>
                      <textarea value={newPost.caption} onChange={e => setNewPost({ ...newPost, caption: e.target.value, baker_id: selectedBaker.id })}
                        rows={2} placeholder="Paste the caption you used..."
                        className="w-full px-3 py-2 rounded-lg border text-sm resize-none"
                        style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: 'white' }} />
                      <button onClick={savePost} disabled={savingPost || !newPost.caption}
                        className="py-2 rounded-lg text-sm font-semibold text-white"
                        style={{ backgroundColor: '#2d1a0e', opacity: !newPost.caption ? 0.6 : 1 }}>
                        {savingPost ? 'Saving...' : 'Log Post'}
                      </button>
                    </div>
                  </div>

                  {/* Outreach */}
                  <OutreachBox baker={selectedBaker} onSend={sendBakerMessage} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* SOCIAL LOG */}
        {activeTab === 'Social Log' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: '#2d1a0e' }}>Social Post Log ({socialLog.length})</h2>
            </div>
            {socialLog.length === 0 ? (
              <div className="text-center py-12" style={{ color: '#5c3d2e' }}>
                <p className="font-semibold mb-1">No posts logged yet</p>
                <p className="text-sm">Go to Content Hub, select a baker, and log your posts there.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e0d5cc' }}>
                      {['Date', 'Baker', 'Platform', 'Caption', 'Actions'].map(h => (
                        <th key={h} className="text-left py-2 px-3 font-semibold" style={{ color: '#5c3d2e' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {socialLog.map(post => (
                      <tr key={post.id} className="border-b" style={{ borderColor: '#f5f0eb' }}>
                        <td className="py-2.5 px-3" style={{ color: '#5c3d2e' }}>{new Date(post.post_date).toLocaleDateString()}</td>
                        <td className="py-2.5 px-3 font-semibold" style={{ color: '#2d1a0e' }}>{post.baker_name}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>{post.platform}</span>
                        </td>
                        <td className="py-2.5 px-3 max-w-xs truncate" style={{ color: '#5c3d2e' }}>{post.caption}</td>
                        <td className="py-2.5 px-3">
                          <button onClick={() => deletePost(post.id)}
                            className="px-2 py-1 rounded text-xs border"
                            style={{ borderColor: '#dc2626', color: '#dc2626' }}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SEASONAL */}
        {activeTab === 'Seasonal' && (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-1" style={{ color: '#2d1a0e' }}>Seasonal Campaign Calendar</h2>
              <p className="text-sm mb-5" style={{ color: '#5c3d2e' }}>Upcoming events to plan campaigns around. Click "Plan Campaign" to pre-fill the email builder.</p>
              <div className="flex flex-col gap-3">
                {SEASONAL_CAMPAIGNS.map(campaign => {
                  const urgent = campaign.daysUntil !== null && campaign.daysUntil <= 21 && campaign.daysUntil >= 0
                  const past = campaign.daysUntil !== null && campaign.daysUntil < 0
                  return (
                    <div key={campaign.name} className="flex items-center justify-between p-4 rounded-xl border"
                      style={{ borderColor: urgent ? '#f59e0b' : '#e0d5cc', backgroundColor: urgent ? '#fffbeb' : past ? '#f5f5f5' : 'white' }}>
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <span className="text-2xl flex-shrink-0">{campaign.emoji}</span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold" style={{ color: past ? '#9c7b6b' : '#2d1a0e' }}>{campaign.name}</p>
                            {urgent && <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#f59e0b', color: 'white' }}>Send soon!</span>}
                            {past && <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#f5f0eb', color: '#9c7b6b' }}>Passed</span>}
                          </div>
                          <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>
                            {campaign.date}
                            {campaign.daysUntil !== null && !past && ' · ' + campaign.daysUntil + ' days away'}
                          </p>
                          <p className="text-xs mt-1" style={{ color: '#8B4513' }}>{campaign.tip}</p>
                        </div>
                      </div>
                      {!past && (
                        <button
                          onClick={() => {
                            setEmailSubject('🎉 ' + campaign.name + ' is coming — find your perfect baker on Whiskly!')
                            setEmailBody('Hi there,\n\n' + campaign.name + ' is coming up and we\'ve got amazing bakers ready to make it special.\n\nBrowse our bakers at https://whiskly.vercel.app/bakers\n\nBook early — spots fill up fast!\n\nThe Whiskly Team')
                            setEmailAudience('customers')
                            setActiveTab('Campaigns')
                          }}
                          className="flex-shrink-0 ml-4 px-4 py-2 rounded-lg text-xs font-semibold text-white"
                          style={{ backgroundColor: urgent ? '#f59e0b' : '#2d1a0e' }}>
                          Plan Campaign
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

function OutreachBox({ baker, onSend }: { baker: any, onSend: (baker: any, message: string) => void }) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSend() {
    if (!message.trim()) return
    setSending(true)
    await onSend(baker, message)
    setMessage('')
    setSending(false)
  }

  return (
    <div className="p-4 rounded-xl border" style={{ borderColor: '#e0d5cc' }}>
      <p className="text-sm font-semibold mb-1" style={{ color: '#2d1a0e' }}>Message {baker.business_name}</p>
      <p className="text-xs mb-3" style={{ color: '#5c3d2e' }}>Send a direct email — e.g. "We want to feature you this week!"</p>
      <textarea value={message} onChange={e => setMessage(e.target.value)} rows={2}
        placeholder={'Hi ' + (baker.business_name) + ', we\'d love to feature you...'}
        className="w-full px-3 py-2 rounded-lg border text-sm resize-none mb-2"
        style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
      <button onClick={handleSend} disabled={sending || !message.trim()}
        className="w-full py-2 rounded-lg text-sm font-semibold text-white"
        style={{ backgroundColor: '#2d1a0e', opacity: (!message.trim() || sending) ? 0.6 : 1 }}>
        {sending ? 'Sending...' : 'Send Message'}
      </button>
    </div>
  )
}