'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const TABS = ['Overview', 'Featured Bakers', 'Email Campaigns', 'Seasonal']

export default function MarketingPortal() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [activeTab, setActiveTab] = useState('Overview')

  const [bakers, setBakers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [bakerSearch, setBakerSearch] = useState('')

  // Email campaign state
  const [emailAudience, setEmailAudience] = useState<'bakers' | 'customers' | 'all'>('all')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

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
    const { data } = await supabase.from('bakers').select('id, business_name, city, state, is_featured, is_active, profile_photo_url, specialties, avg_rating, review_count, is_pro').eq('is_active', true).order('created_at', { ascending: false })
    setBakers(data || [])
    setLoading(false)
  }

  async function toggleFeatured(baker: any) {
    const newVal = !baker.is_featured
    await supabase.from('bakers').update({ is_featured: newVal }).eq('id', baker.id)
    setBakers(bakers.map(b => b.id === baker.id ? { ...b, is_featured: newVal } : b))
  }

  async function sendCampaign() {
    if (!emailSubject.trim() || !emailBody.trim()) return
    setSendingEmail(true)

    let recipients: any[] = []

    if (emailAudience === 'bakers' || emailAudience === 'all') {
      const { data } = await supabase.from('bakers').select('email, business_name').eq('is_active', true)
      recipients = [...recipients, ...(data || []).map(b => ({ email: b.email, name: b.business_name, type: 'baker' }))]
    }

    if (emailAudience === 'customers' || emailAudience === 'all') {
      const { data } = await supabase.from('customers').select('email, full_name')
      recipients = [...recipients, ...(data || []).map(c => ({ email: c.email, name: c.full_name, type: 'customer' }))]
    }

    // Send via our email API — batched
    let sent = 0
    for (const r of recipients) {
      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'announcement',
          to: r.email,
          name: r.name,
          subject: emailSubject,
          body: emailBody,
        })
      }).catch(() => {})
      sent++
    }

    setSendingEmail(false)
    setEmailSent(true)
    setEmailSubject('')
    setEmailBody('')
    setTimeout(() => setEmailSent(false), 3000)
    alert('Campaign sent to ' + sent + ' recipients!')
  }

  const featuredBakers = bakers.filter(b => b.is_featured)
  const totalBakers = bakers.length

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f0eb' }}>
        <div className="bg-white rounded-2xl p-8 shadow-sm w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#2d1a0e' }}>Marketing Portal</h1>
          <p className="text-sm mb-6" style={{ color: '#5c3d2e' }}>Whiskly marketing team access</p>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAuth()}
            placeholder="Enter marketing password"
            className="w-full px-4 py-3 rounded-xl border text-sm mb-3"
            style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
          {authError && <p className="text-xs mb-3" style={{ color: '#dc2626' }}>{authError}</p>}
          <button onClick={handleAuth} className="w-full py-3 rounded-xl text-white font-semibold text-sm" style={{ backgroundColor: '#2d1a0e' }}>
            Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f0eb' }}>
      <nav className="bg-white shadow-sm px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-lg font-bold" style={{ color: '#2d1a0e' }}>🎂 Whiskly</Link>
          <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>Marketing</span>
        </div>
        <button onClick={() => setAuthed(false)} className="px-3 py-1.5 rounded-lg border text-xs font-semibold" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>Sign Out</button>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">

        <div className="flex gap-2 mb-6 flex-wrap">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ backgroundColor: activeTab === tab ? '#2d1a0e' : 'white', color: activeTab === tab ? 'white' : '#2d1a0e' }}>
              {tab}
            </button>
          ))}
        </div>

        {loading && <p className="text-sm" style={{ color: '#5c3d2e' }}>Loading...</p>}

        {/* Overview */}
        {activeTab === 'Overview' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Active Bakers', value: totalBakers },
                { label: 'Featured Bakers', value: featuredBakers.length },
                { label: 'Pro Bakers', value: bakers.filter(b => b.is_pro).length },
                { label: 'Avg Rating', value: bakers.filter(b => b.avg_rating).length ? (bakers.filter(b => b.avg_rating).reduce((s, b) => s + b.avg_rating, 0) / bakers.filter(b => b.avg_rating).length).toFixed(1) : '—' },
              ].map(stat => (
                <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm">
                  <p className="text-xs font-semibold mb-1" style={{ color: '#5c3d2e' }}>{stat.label}</p>
                  <p className="text-2xl font-bold" style={{ color: '#2d1a0e' }}>{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-4" style={{ color: '#2d1a0e' }}>Currently Featured</h2>
              {featuredBakers.length === 0 ? (
                <p className="text-sm" style={{ color: '#5c3d2e' }}>No featured bakers. Go to Featured Bakers tab to set one.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {featuredBakers.map(baker => (
                    <div key={baker.id} className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: '#fef9c3' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0" style={{ backgroundColor: '#f5f0eb' }}>
                          {baker.profile_photo_url
                            ? <img src={baker.profile_photo_url} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-sm font-bold" style={{ color: '#2d1a0e' }}>{baker.business_name?.[0]}</div>}
                        </div>
                        <div>
                          <p className="text-sm font-bold" style={{ color: '#2d1a0e' }}>{baker.business_name}</p>
                          <p className="text-xs" style={{ color: '#5c3d2e' }}>{baker.city}, {baker.state}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link href={'/bakers/' + baker.id} target="_blank"
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold border"
                          style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>
                          View
                        </Link>
                        <button onClick={() => toggleFeatured(baker)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold border"
                          style={{ borderColor: '#dc2626', color: '#dc2626' }}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Featured Bakers */}
        {activeTab === 'Featured Bakers' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-sm mb-4" style={{ color: '#5c3d2e' }}>
              Featured bakers appear first on the homepage and browse page. Toggle to feature or unfeature.
            </p>
            <input value={bakerSearch} onChange={e => setBakerSearch(e.target.value)}
              placeholder="Search bakers..."
              className="px-3 py-2 rounded-lg border text-sm mb-4 w-full max-w-sm"
              style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
            <div className="flex flex-col gap-3">
              {bakers
                .filter(b => !bakerSearch || b.business_name?.toLowerCase().includes(bakerSearch.toLowerCase()))
                .map(baker => (
                  <div key={baker.id} className="flex items-center justify-between p-4 rounded-xl border"
                    style={{ borderColor: baker.is_featured ? '#f59e0b' : '#e0d5cc', backgroundColor: baker.is_featured ? '#fffbeb' : 'white' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0" style={{ backgroundColor: '#f5f0eb' }}>
                        {baker.profile_photo_url
                          ? <img src={baker.profile_photo_url} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-sm font-bold" style={{ color: '#2d1a0e' }}>{baker.business_name?.[0]}</div>}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold" style={{ color: '#2d1a0e' }}>{baker.business_name}</p>
                          {baker.is_pro && <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#2d1a0e', color: 'white' }}>Pro</span>}
                          {baker.is_featured && <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#f59e0b', color: 'white' }}>★ Featured</span>}
                        </div>
                        <p className="text-xs" style={{ color: '#5c3d2e' }}>{baker.city}, {baker.state}</p>
                        {baker.specialties?.length > 0 && <p className="text-xs mt-0.5" style={{ color: '#8B4513' }}>{baker.specialties.slice(0, 3).join(', ')}</p>}
                        {baker.avg_rating && <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>★ {baker.avg_rating.toFixed(1)} ({baker.review_count} reviews)</p>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={'/bakers/' + baker.id} target="_blank"
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border"
                        style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>
                        View
                      </Link>
                      <button onClick={() => toggleFeatured(baker)}
                        className="px-4 py-2 rounded-lg text-xs font-semibold"
                        style={{
                          backgroundColor: baker.is_featured ? '#f5f0eb' : '#f59e0b',
                          color: baker.is_featured ? '#2d1a0e' : 'white'
                        }}>
                        {baker.is_featured ? 'Unfeature' : '★ Feature'}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Email Campaigns */}
        {activeTab === 'Email Campaigns' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm max-w-2xl">
            <h2 className="text-lg font-bold mb-1" style={{ color: '#2d1a0e' }}>Send Announcement Email</h2>
            <p className="text-sm mb-6" style={{ color: '#5c3d2e' }}>Send a platform-wide email to bakers, customers, or everyone.</p>

            {emailSent && (
              <div className="mb-4 px-4 py-3 rounded-xl text-sm font-semibold" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>
                ✓ Campaign sent successfully!
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#2d1a0e' }}>Audience</label>
                <div className="flex gap-3">
                  {[['all', 'Everyone'], ['bakers', 'Bakers only'], ['customers', 'Customers only']].map(([val, label]) => (
                    <button key={val} onClick={() => setEmailAudience(val as any)}
                      className="px-4 py-2 rounded-lg text-sm font-semibold border"
                      style={{
                        backgroundColor: emailAudience === val ? '#2d1a0e' : 'white',
                        color: emailAudience === val ? 'white' : '#2d1a0e',
                        borderColor: emailAudience === val ? '#2d1a0e' : '#e0d5cc'
                      }}>
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
                  rows={8}
                  placeholder="Write your announcement here..."
                  className="w-full px-4 py-3 rounded-xl border text-sm resize-none"
                  style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
              </div>

              <div className="p-4 rounded-xl" style={{ backgroundColor: '#fef9c3' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: '#854d0e' }}>Before you send</p>
                <p className="text-xs" style={{ color: '#92400e' }}>
                  This will send to {emailAudience === 'all' ? 'all bakers and customers' : emailAudience === 'bakers' ? 'all active bakers' : 'all customers'} on the platform. Double-check your message before sending — this cannot be undone.
                </p>
              </div>

              <button
                onClick={sendCampaign}
                disabled={sendingEmail || !emailSubject.trim() || !emailBody.trim()}
                className="py-3 rounded-xl text-white font-semibold text-sm"
                style={{ backgroundColor: '#2d1a0e', opacity: (sendingEmail || !emailSubject.trim() || !emailBody.trim()) ? 0.6 : 1 }}>
                {sendingEmail ? 'Sending...' : 'Send Campaign'}
              </button>
            </div>
          </div>
        )}

        {/* Seasonal */}
        {activeTab === 'Seasonal' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm max-w-2xl">
            <h2 className="text-lg font-bold mb-1" style={{ color: '#2d1a0e' }}>Seasonal Campaigns</h2>
            <p className="text-sm mb-6" style={{ color: '#5c3d2e' }}>Coming soon — seasonal push campaigns for Pro bakers.</p>

            <div className="flex flex-col gap-3">
              {[
                { name: "Valentine's Day", date: 'Feb 14', status: 'Coming soon' },
                { name: "Mother's Day", date: 'May 11', status: 'Coming soon' },
                { name: 'Wedding Season', date: 'May–Oct', status: 'Coming soon' },
                { name: 'Back to School', date: 'Aug–Sep', status: 'Coming soon' },
                { name: 'Holiday Season', date: 'Nov–Dec', status: 'Coming soon' },
              ].map(campaign => (
                <div key={campaign.name} className="flex items-center justify-between p-4 rounded-xl border" style={{ borderColor: '#e0d5cc' }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#2d1a0e' }}>{campaign.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>{campaign.date}</p>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ backgroundColor: '#f5f0eb', color: '#5c3d2e' }}>
                    {campaign.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}