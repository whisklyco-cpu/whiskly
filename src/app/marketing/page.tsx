'use client'

import ContentCalendar from '@/components/marketing/ContentCalendar'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AdsTab from '@/components/marketing/AdsTab'

const TABS = ['Featured Bakers', 'Content Calendar', 'Campaigns', 'Social Log', 'Seasonal', 'Content Hub', 'Paid Ads']

const SOCIAL_PLATFORMS = ['Instagram', 'Threads', 'TikTok', 'Facebook', 'Lemon8']
const CAMPAIGN_TYPES = ['Email blast', 'Featured rotation', 'Seasonal push', 'New baker spotlight', 'Holiday campaign', 'Other']
const SEASONAL_EVENTS = [
  { name: "Valentine's Day", date: 'Feb 14' },
  { name: "Mother's Day", date: 'May 11' },
  { name: 'Graduation Season', date: 'May–Jun' },
  { name: 'Summer Weddings', date: 'Jun–Aug' },
  { name: 'Back to School', date: 'Aug–Sep' },
  { name: 'Halloween', date: 'Oct 31' },
  { name: 'Thanksgiving', date: 'Nov 27' },
  { name: 'Christmas', date: 'Dec 25' },
  { name: "New Year's Eve", date: 'Dec 31' },
]

export default function MarketingPortal() {
  // Auth state
  const [session, setSession] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState('')
  const [signingIn, setSigningIn] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [sendingReset, setSendingReset] = useState(false)

  const [activeTab, setActiveTab] = useState('Featured Bakers')

  const [bakers, setBakers] = useState<any[]>([])
  const [featuredBakers, setFeaturedBakers] = useState<any[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [socialLogs, setSocialLogs] = useState<any[]>([])
  const [adLogs, setAdLogs] = useState<any[]>([])
  const [creditLogs, setCreditLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Campaign form
  const [campaignName, setCampaignName] = useState('')
  const [campaignType, setCampaignType] = useState('')
  const [campaignNotes, setCampaignNotes] = useState('')
  const [savingCampaign, setSavingCampaign] = useState(false)

  // Social log form
  const [socialPlatform, setSocialPlatform] = useState('')
  const [socialCaption, setSocialCaption] = useState('')
  const [socialBaker, setSocialBaker] = useState('')
  const [savingSocial, setSavingSocial] = useState(false)

  // Check for existing session on load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthLoading(false)
      if (session) loadData()
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) loadData()
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSignIn() {
    if (!email.trim() || !password) return
    setSigningIn(true)
    setAuthError('')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) {
      setAuthError('Incorrect email or password.')
      setSigningIn(false)
    }
    // on success, onAuthStateChange fires and sets session automatically
  }

  async function handleForgotPassword() {
    if (!forgotEmail.trim()) return
    setSendingReset(true)
    await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
      redirectTo: 'https://whiskly.co/marketing',
    })
    setForgotSent(true)
    setSendingReset(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setSession(null)
    setEmail('')
    setPassword('')
  }

  async function loadData() {
    setLoading(true)
    const [{ data: bakersData }, { data: featuredData }, { data: logsData }] = await Promise.all([
      supabase.from('bakers').select('id, business_name, city, state, profile_photo_url, is_pro, tier, featured_since').eq('is_active', true).eq('profile_complete', true).order('business_name'),
      supabase.from('bakers').select('id, business_name, city, state, profile_photo_url, is_pro, tier, featured_since').eq('is_featured', true).order('featured_since', { ascending: false }),
      supabase.from('marketing_logs').select('*').order('created_at', { ascending: false }),
    ])
    setBakers(bakersData || [])
    setFeaturedBakers(featuredData || [])
    const logs = logsData || []
    setCampaigns(logs.filter((l: any) => l.type === 'campaign'))
    setSocialLogs(logs.filter((l: any) => l.type === 'social'))
    setAdLogs(logs.filter((l: any) => l.type === 'paid_ad'))
    setCreditLogs(logs.filter((l: any) => ['ad_credit', 'promo'].includes(l.type)))
    setLoading(false)
  }

  async function featureBaker(bakerId: string) {
    await supabase.from('bakers').update({ is_featured: true, featured_since: new Date().toISOString() } as any).eq('id', bakerId)
    loadData()
  }

  async function unfeatureBaker(bakerId: string) {
    await supabase.from('bakers').update({ is_featured: false, featured_since: null } as any).eq('id', bakerId)
    loadData()
  }

  async function saveCampaign() {
    if (!campaignName.trim() || !campaignType) return
    setSavingCampaign(true)
    await supabase.from('marketing_logs').insert({
      type: 'campaign',
      data: { name: campaignName.trim(), campaign_type: campaignType, notes: campaignNotes.trim(), sent_at: new Date().toISOString() },
    })
    setCampaignName(''); setCampaignType(''); setCampaignNotes('')
    setSavingCampaign(false)
    loadData()
  }

  async function saveSocialLog() {
    if (!socialPlatform || !socialCaption.trim()) return
    setSavingSocial(true)
    await supabase.from('marketing_logs').insert({
      type: 'social',
      data: { platform: socialPlatform, caption: socialCaption.trim(), baker: socialBaker.trim(), posted_at: new Date().toISOString() },
    })
    setSocialPlatform(''); setSocialCaption(''); setSocialBaker('')
    setSavingSocial(false)
    loadData()
  }

  function featuredDays(since: string) {
    if (!since) return 0
    return Math.round((Date.now() - new Date(since).getTime()) / 86400000)
  }

  // Loading session check
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#faf8f6' }}>
        <p className="text-sm" style={{ color: '#9c7b6b' }}>Loading...</p>
      </div>
    )
  }

  // Login screen
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#faf8f6' }}>
        <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-lg flex flex-col gap-4">
          <div>
            <p className="font-bold text-lg" style={{ color: '#2d1a0e' }}>Marketing Portal</p>
            <p className="text-sm mt-1" style={{ color: '#9c7b6b' }}>Sign in to continue.</p>
          </div>

          {!showForgot ? (
            <>
              <div className="flex flex-col gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSignIn()}
                  placeholder="Email"
                  className="w-full px-4 py-3 rounded-xl border text-sm"
                  style={{ borderColor: '#e0d5cc', color: '#2d1a0e' }}
                />
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSignIn()}
                    placeholder="Password"
                    className="w-full px-4 py-3 rounded-xl border text-sm"
                    style={{ borderColor: '#e0d5cc', color: '#2d1a0e' }}
                  />
                  <button onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-xs" style={{ color: '#9c7b6b' }}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {authError && <p className="text-xs" style={{ color: '#dc2626' }}>{authError}</p>}

              <button onClick={handleSignIn} disabled={signingIn || !email.trim() || !password}
                className="py-3 rounded-xl text-white font-semibold text-sm"
                style={{ backgroundColor: '#2d1a0e', opacity: (!email.trim() || !password) ? 0.4 : 1 }}>
                {signingIn ? 'Signing in...' : 'Sign In'}
              </button>

              <button onClick={() => { setShowForgot(true); setForgotEmail(email) }}
                className="text-xs text-center" style={{ color: '#9c7b6b' }}>
                Forgot password?
              </button>
            </>
          ) : (
            <>
              <p className="text-sm" style={{ color: '#5c3d2e' }}>
                {forgotSent
                  ? 'Check your email for a password reset link.'
                  : 'Enter your email and we\'ll send a reset link.'}
              </p>
              {!forgotSent && (
                <>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full px-4 py-3 rounded-xl border text-sm"
                    style={{ borderColor: '#e0d5cc', color: '#2d1a0e' }}
                  />
                  <button onClick={handleForgotPassword} disabled={sendingReset || !forgotEmail.trim()}
                    className="py-3 rounded-xl text-white font-semibold text-sm"
                    style={{ backgroundColor: '#2d1a0e', opacity: !forgotEmail.trim() ? 0.4 : 1 }}>
                    {sendingReset ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </>
              )}
              <button onClick={() => { setShowForgot(false); setForgotSent(false) }}
                className="text-xs text-center" style={{ color: '#9c7b6b' }}>
                Back to sign in
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  // Authenticated portal
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#faf8f6' }}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="font-bold text-xl" style={{ color: '#2d1a0e' }}>Marketing Portal</p>
          <div className="flex items-center gap-3">
            <p className="text-xs" style={{ color: '#9c7b6b' }}>{session.user.email}</p>
            <button onClick={handleSignOut}
              className="text-xs px-3 py-1.5 rounded-lg border font-semibold"
              style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>
              Sign Out
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-4 py-2 rounded-xl text-xs font-semibold"
              style={{ backgroundColor: activeTab === tab ? '#2d1a0e' : 'white', color: activeTab === tab ? 'white' : '#5c3d2e', border: '1px solid', borderColor: activeTab === tab ? '#2d1a0e' : '#e0d5cc' }}>
              {tab}
            </button>
          ))}
        </div>

        {loading && <p className="text-sm" style={{ color: '#9c7b6b' }}>Loading...</p>}

        {/* Featured Bakers */}
        {activeTab === 'Featured Bakers' && !loading && (
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="font-bold mb-1" style={{ color: '#2d1a0e' }}>Currently Featured</p>
              <p className="text-xs mb-4" style={{ color: '#9c7b6b' }}>Max 30 days per rotation. Rotate at least once per month. Pro bakers get priority.</p>
              {featuredBakers.length === 0 && <p className="text-xs" style={{ color: '#9c7b6b' }}>No bakers currently featured.</p>}
              <div className="flex flex-col gap-3">
                {featuredBakers.map(b => (
                  <div key={b.id} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: '#e0d5cc' }}>
                    <div className="flex items-center gap-3">
                      {b.profile_photo_url && <img src={b.profile_photo_url} alt={b.business_name} className="w-10 h-10 rounded-full object-cover" />}
                      <div>
                        <p className="text-sm font-semibold" style={{ color: '#2d1a0e' }}>{b.business_name}</p>
                        <p className="text-xs" style={{ color: '#9c7b6b' }}>{b.city}, {b.state} · {b.is_pro ? 'Pro' : 'Free'} · {featuredDays(b.featured_since)} days featured</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {featuredDays(b.featured_since) >= 30 && <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>Over 30 days</span>}
                      <button onClick={() => unfeatureBaker(b.id)} className="text-xs px-3 py-1.5 rounded-lg border font-semibold" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="font-bold mb-4" style={{ color: '#2d1a0e' }}>Add Baker to Featured</p>
              <div className="flex flex-col gap-2">
                {bakers.filter(b => !featuredBakers.find(f => f.id === b.id)).map(b => (
                  <div key={b.id} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: '#e0d5cc' }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#2d1a0e' }}>{b.business_name}</p>
                      <p className="text-xs" style={{ color: '#9c7b6b' }}>{b.city}, {b.state} · {b.is_pro ? 'Pro' : 'Free'}</p>
                    </div>
                    <button onClick={() => featureBaker(b.id)} className="text-xs px-3 py-1.5 rounded-lg text-white font-semibold" style={{ backgroundColor: '#2d1a0e' }}>Feature</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Campaigns */}
        {activeTab === 'Campaigns' && !loading && (
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="font-bold mb-4" style={{ color: '#2d1a0e' }}>Log a Campaign</p>
              <div className="flex flex-col gap-3">
                <input value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="Campaign name (e.g. Mother's Day Email Blast)"
                  className="w-full px-3 py-2 rounded-xl border text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e' }} />
                <select value={campaignType} onChange={e => setCampaignType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-sm" style={{ borderColor: '#e0d5cc', color: campaignType ? '#2d1a0e' : '#9c7b6b' }}>
                  <option value="">Campaign type...</option>
                  {CAMPAIGN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <textarea value={campaignNotes} onChange={e => setCampaignNotes(e.target.value)} placeholder="Notes (optional — recipients, results, etc.)" rows={3}
                  className="w-full px-3 py-2 rounded-xl border text-sm resize-none" style={{ borderColor: '#e0d5cc', color: '#2d1a0e' }} />
                <button onClick={saveCampaign} disabled={savingCampaign || !campaignName.trim() || !campaignType}
                  className="py-2.5 rounded-xl text-white text-sm font-semibold self-start px-5"
                  style={{ backgroundColor: '#2d1a0e', opacity: (!campaignName.trim() || !campaignType) ? 0.4 : 1 }}>
                  {savingCampaign ? 'Saving...' : 'Log Campaign'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="font-bold mb-4" style={{ color: '#2d1a0e' }}>Campaign History</p>
              {campaigns.length === 0 && <p className="text-xs" style={{ color: '#9c7b6b' }}>No campaigns logged yet.</p>}
              <div className="flex flex-col gap-3">
                {campaigns.map(c => (
                  <div key={c.id} className="p-3 rounded-xl border" style={{ borderColor: '#e0d5cc' }}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold" style={{ color: '#2d1a0e' }}>{c.data?.name}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#f5f0eb', color: '#5c3d2e' }}>{c.data?.campaign_type}</span>
                    </div>
                    {c.data?.notes && <p className="text-xs mt-1" style={{ color: '#5c3d2e' }}>{c.data.notes}</p>}
                    <p className="text-xs mt-1" style={{ color: '#9c7b6b' }}>{new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Social Log */}
        {activeTab === 'Social Log' && !loading && (
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="font-bold mb-1" style={{ color: '#2d1a0e' }}>Log a Post</p>
              <p className="text-xs mb-4" style={{ color: '#9c7b6b' }}>Recommended: Instagram/Threads 3-4x/week · TikTok 2-3x/week · Facebook 2x/week · Lemon8 1-2x/week</p>
              <div className="flex flex-col gap-3">
                <select value={socialPlatform} onChange={e => setSocialPlatform(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-sm" style={{ borderColor: '#e0d5cc', color: socialPlatform ? '#2d1a0e' : '#9c7b6b' }}>
                  <option value="">Select platform...</option>
                  {SOCIAL_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <input value={socialBaker} onChange={e => setSocialBaker(e.target.value)} placeholder="Baker featured (optional)"
                  className="w-full px-3 py-2 rounded-xl border text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e' }} />
                <textarea value={socialCaption} onChange={e => setSocialCaption(e.target.value)} placeholder="Caption or post description" rows={3}
                  className="w-full px-3 py-2 rounded-xl border text-sm resize-none" style={{ borderColor: '#e0d5cc', color: '#2d1a0e' }} />
                <button onClick={saveSocialLog} disabled={savingSocial || !socialPlatform || !socialCaption.trim()}
                  className="py-2.5 rounded-xl text-white text-sm font-semibold self-start px-5"
                  style={{ backgroundColor: '#2d1a0e', opacity: (!socialPlatform || !socialCaption.trim()) ? 0.4 : 1 }}>
                  {savingSocial ? 'Saving...' : 'Log Post'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="font-bold mb-4" style={{ color: '#2d1a0e' }}>Post History</p>
              {socialLogs.length === 0 && <p className="text-xs" style={{ color: '#9c7b6b' }}>No posts logged yet.</p>}
              <div className="flex flex-col gap-3">
                {socialLogs.map(s => (
                  <div key={s.id} className="p-3 rounded-xl border" style={{ borderColor: '#e0d5cc' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#f5f0eb', color: '#5c3d2e' }}>{s.data?.platform}</span>
                      <p className="text-xs" style={{ color: '#9c7b6b' }}>{new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                    {s.data?.baker && <p className="text-xs font-semibold" style={{ color: '#854d0e' }}>{s.data.baker}</p>}
                    <p className="text-xs mt-0.5" style={{ color: '#2d1a0e' }}>{s.data?.caption}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Seasonal */}
        {activeTab === 'Seasonal' && !loading && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="font-bold mb-1" style={{ color: '#2d1a0e' }}>Seasonal Campaign Calendar</p>
            <p className="text-xs mb-4" style={{ color: '#9c7b6b' }}>Send seasonal campaigns 3 weeks before the event date. Never send more than 2 emails per week per recipient.</p>
            <div className="flex flex-col gap-3">
              {SEASONAL_EVENTS.map(ev => (
                <div key={ev.name} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: '#e0d5cc' }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#2d1a0e' }}>{ev.name}</p>
                    <p className="text-xs" style={{ color: '#9c7b6b' }}>{ev.date}</p>
                  </div>
                  <button onClick={() => { setCampaignName(ev.name + ' Campaign'); setCampaignType('Seasonal push'); setActiveTab('Campaigns') }}
                    className="text-xs px-3 py-1.5 rounded-lg border font-semibold" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>
                    Log Campaign
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Hub */}
        {activeTab === 'Content Hub' && !loading && (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="font-bold mb-3" style={{ color: '#2d1a0e' }}>Content Priorities</p>
              <ol className="flex flex-col gap-2">
                {['New baker spotlights (great for early growth)', 'Completed order photos (with baker and customer permission)', 'Seasonal content', 'Behind-the-scenes baker content'].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#5c3d2e' }}>
                    <span className="font-bold flex-shrink-0" style={{ color: '#854d0e' }}>{i + 1}.</span> {item}
                  </li>
                ))}
              </ol>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="font-bold mb-3" style={{ color: '#2d1a0e' }}>Posting Schedule</p>
              <div className="flex flex-col gap-2">
                {SOCIAL_PLATFORMS.map(p => {
                  const count = socialLogs.filter(s => s.data?.platform === p).length
                  return (
                    <div key={p} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: '#f5f0eb' }}>
                      <p className="text-sm font-semibold" style={{ color: '#2d1a0e' }}>{p}</p>
                      <p className="text-xs" style={{ color: '#9c7b6b' }}>{count} posts logged</p>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="font-bold mb-3" style={{ color: '#2d1a0e' }}>Bakers Not Recently Featured</p>
              <p className="text-xs mb-3" style={{ color: '#9c7b6b' }}>Active bakers who have never been featured — consider spotlighting them.</p>
              {bakers.filter(b => !b.featured_since).slice(0, 10).map(b => (
                <div key={b.id} className="flex items-center justify-between py-2 border-b" style={{ borderColor: '#e0d5cc' }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#2d1a0e' }}>{b.business_name}</p>
                    <p className="text-xs" style={{ color: '#9c7b6b' }}>{b.city}, {b.state}</p>
                  </div>
                  <button onClick={() => featureBaker(b.id)} className="text-xs px-3 py-1.5 rounded-lg text-white font-semibold" style={{ backgroundColor: '#2d1a0e' }}>Feature</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Content Calendar' && !loading && (
  <ContentCalendar adLogs={adLogs} />
)}

        {/* Paid Ads */}
        {activeTab === 'Paid Ads' && !loading && (
          <AdsTab adLogs={adLogs} creditLogs={creditLogs} onRefresh={loadData} />
        )}

      </div>
    </div>
  )
}