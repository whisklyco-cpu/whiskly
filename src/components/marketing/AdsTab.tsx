'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const AD_PLATFORMS = ['Meta (Facebook/Instagram)', 'Google', 'TikTok', 'Pinterest', 'LinkedIn', 'Lemon8']
const AUDIENCE_TYPES = ['Bakers', 'Customers']
const OBJECTIVE_TYPES = ['Brand Awareness', 'Engagement', 'Traffic', 'Conversions', 'Lead Generation', 'App Installs']
const AD_FORMATS = ['Carousel', 'Single Image', 'Video', 'Text / Copy Only', 'Story / Reel', 'Collection']
const CREDIT_PLATFORMS = ['Meta', 'Google', 'TikTok', 'Pinterest', 'LinkedIn', 'Lemon8', 'Other']
const PROMO_TYPES = ['Discount Code', 'Free Trial', 'Referral Bonus', 'Baker Incentive', 'Other']

const PLATFORM_COLORS: Record<string, { bg: string; color: string }> = {
  'Meta (Facebook/Instagram)': { bg: '#e0e7ff', color: '#3730a3' },
  'Google': { bg: '#fef9c3', color: '#854d0e' },
  'TikTok': { bg: '#fce7f3', color: '#9d174d' },
  'Pinterest': { bg: '#fee2e2', color: '#991b1b' },
  'LinkedIn': { bg: '#dbeafe', color: '#1e40af' },
  'Lemon8': { bg: '#fef3c7', color: '#92400e' },
}

const AUDIENCE_COLORS: Record<string, { bg: string; color: string }> = {
  'Bakers': { bg: '#f5f0eb', color: '#5c3d2e' },
  'Customers': { bg: '#ecfdf5', color: '#065f46' },
}

const FORMAT_COLORS: Record<string, { bg: string; color: string }> = {
  'Carousel':        { bg: '#ede9fe', color: '#5b21b6' },
  'Single Image':    { bg: '#e0f2fe', color: '#0369a1' },
  'Video':           { bg: '#fce7f3', color: '#9d174d' },
  'Text / Copy Only':{ bg: '#f1f5f9', color: '#334155' },
  'Story / Reel':    { bg: '#fef3c7', color: '#92400e' },
  'Collection':      { bg: '#d1fae5', color: '#065f46' },
}

function cpr(spend: number, conversions: number) {
  if (!conversions || !spend) return null
  return (spend / conversions).toFixed(2)
}
function ctr(clicks: number, impressions: number) {
  if (!impressions || !clicks) return null
  return ((clicks / impressions) * 100).toFixed(2)
}
function fmt(n: number) { return n ? n.toLocaleString() : '—' }
function fmtDate(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function fmtMoney(n: number) {
  return (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function buildUTM(base: string, source: string, medium: string, campaign: string, content: string, term: string) {
  if (!base) return ''
  try {
    const url = new URL(base.startsWith('http') ? base : 'https://' + base)
    if (source)   url.searchParams.set('utm_source',   source.replace(/\s+/g, '-').toLowerCase())
    if (medium)   url.searchParams.set('utm_medium',   medium.replace(/\s+/g, '-').toLowerCase())
    if (campaign) url.searchParams.set('utm_campaign', campaign.replace(/\s+/g, '-').toLowerCase())
    if (content)  url.searchParams.set('utm_content',  content.replace(/\s+/g, '-').toLowerCase())
    if (term)     url.searchParams.set('utm_term',     term.replace(/\s+/g, '-').toLowerCase())
    return url.toString()
  } catch { return '' }
}

interface AdLog   { id: string; created_at: string; type: string; data: any }
interface AdsTabProps { adLogs: AdLog[]; creditLogs: AdLog[]; onRefresh: () => void }

const SUB_TABS = ['Log Campaign', 'Campaign History', 'AI Insights', 'Credits & Promos']

export default function AdsTab({ adLogs, creditLogs, onRefresh }: AdsTabProps) {
  const [subTab, setSubTab] = useState('Log Campaign')

  // Campaign form
  const [campaignName, setCampaignName] = useState('')
  const [platform, setPlatform]         = useState('')
  const [audience, setAudience]         = useState('')
  const [objective, setObjective]       = useState('')
  const [adFormat, setAdFormat]         = useState('')
  const [startDate, setStartDate]       = useState('')
  const [endDate, setEndDate]           = useState('')
  const [budget, setBudget]             = useState('')
  const [spend, setSpend]               = useState('')
  const [impressions, setImpressions]   = useState('')
  const [clicks, setClicks]             = useState('')
  const [conversions, setConversions]   = useState('')
  const [creativeUrl, setCreativeUrl]   = useState('')
  const [notes, setNotes]               = useState('')
  const [saving, setSaving]             = useState(false)

  // UTM builder
  const [utmBase, setUtmBase]         = useState('whiskly.co')
  const [utmSource, setUtmSource]     = useState('')
  const [utmMedium, setUtmMedium]     = useState('')
  const [utmCampaign, setUtmCampaign] = useState('')
  const [utmContent, setUtmContent]   = useState('')
  const [utmTerm, setUtmTerm]         = useState('')
  const [utmCopied, setUtmCopied]     = useState(false)

  // History filters
  const [filterAudience, setFilterAudience] = useState('All')
  const [filterPlatform, setFilterPlatform] = useState('All')
  const [filterFormat, setFilterFormat]     = useState('All')
  const [expandedId, setExpandedId]         = useState<string | null>(null)

  // AI insights
  const [insights, setInsights]               = useState('')
  const [loadingInsights, setLoadingInsights] = useState(false)

  // Credits & Promos form
  const [creditType, setCreditType]       = useState<'credit' | 'promo'>('credit')
  const [creditPlatform, setCreditPlatform] = useState('')
  const [creditAmount, setCreditAmount]   = useState('')
  const [creditExpiry, setCreditExpiry]   = useState('')
  const [creditNotes, setCreditNotes]     = useState('')
  const [promoCode, setPromoCode]         = useState('')
  const [promoType, setPromoType]         = useState('')
  const [promoValue, setPromoValue]       = useState('')
  const [promoExpiry, setPromoExpiry]     = useState('')
  const [promoNotes, setPromoNotes]       = useState('')
  const [savingCredit, setSavingCredit]   = useState(false)

  const canSave = !!(campaignName.trim() && platform && audience)
  const utmUrl  = buildUTM(utmBase, utmSource, utmMedium, utmCampaign, utmContent, utmTerm)

  function copyUTM() {
    if (!utmUrl) return
    navigator.clipboard.writeText(utmUrl)
    setUtmCopied(true)
    setTimeout(() => setUtmCopied(false), 2000)
  }

  async function saveAd() {
    if (!canSave) return
    setSaving(true)
    await supabase.from('marketing_logs').insert({
      type: 'paid_ad',
      data: {
        campaign_name: campaignName.trim(), platform, audience, objective,
        ad_format: adFormat, start_date: startDate, end_date: endDate,
        budget: parseFloat(budget) || 0, spend: parseFloat(spend) || 0,
        impressions: parseInt(impressions) || 0, clicks: parseInt(clicks) || 0,
        conversions: parseInt(conversions) || 0, creative_url: creativeUrl.trim(),
        tracking_url: utmUrl,
        utm: { source: utmSource, medium: utmMedium, campaign: utmCampaign, content: utmContent, term: utmTerm },
        notes: notes.trim(),
      },
    })
    setCampaignName(''); setPlatform(''); setAudience(''); setObjective(''); setAdFormat('')
    setStartDate(''); setEndDate(''); setBudget(''); setSpend('')
    setImpressions(''); setClicks(''); setConversions('')
    setCreativeUrl(''); setNotes('')
    setUtmSource(''); setUtmMedium(''); setUtmCampaign(''); setUtmContent(''); setUtmTerm('')
    setSaving(false)
    onRefresh()
    setSubTab('Campaign History')
  }

  async function saveCredit() {
    setSavingCredit(true)
    if (creditType === 'credit') {
      await supabase.from('marketing_logs').insert({
        type: 'ad_credit',
        data: { platform: creditPlatform, amount: parseFloat(creditAmount) || 0, expiry: creditExpiry, notes: creditNotes.trim() },
      })
      setCreditPlatform(''); setCreditAmount(''); setCreditExpiry(''); setCreditNotes('')
    } else {
      await supabase.from('marketing_logs').insert({
        type: 'promo',
        data: { code: promoCode.trim(), promo_type: promoType, value: promoValue.trim(), expiry: promoExpiry, notes: promoNotes.trim() },
      })
      setPromoCode(''); setPromoType(''); setPromoValue(''); setPromoExpiry(''); setPromoNotes('')
    }
    setSavingCredit(false)
    onRefresh()
  }

  async function generateInsights() {
    if (adLogs.length === 0) return
    setLoadingInsights(true)
    setInsights('')
    const summary = adLogs.map(a => {
      const d = a.data
      return {
        campaign: d.campaign_name, platform: d.platform, audience: d.audience,
        format: d.ad_format, objective: d.objective,
        spend: d.spend, impressions: d.impressions, clicks: d.clicks, conversions: d.conversions,
        cpr: d.conversions > 0 && d.spend > 0 ? (d.spend / d.conversions).toFixed(2) : null,
        ctr: d.impressions > 0 && d.clicks > 0 ? ((d.clicks / d.impressions) * 100).toFixed(2) : null,
        notes: d.notes,
      }
    })
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `You are a marketing analyst for Whiskly, a two-sided marketplace connecting customers with independent bakers for custom baked goods (cakes, cupcakes, cookies). Analyze paid ad campaign data and give actionable insights. Be specific and direct. Use this structure:

## What's Working
## What's Not Working
## Best Performing Format
## Best Performing Audience (Bakers vs Customers)
## Recommendations

2-4 bullet points per section. Reference specific numbers. Plain language only.`,
          messages: [{ role: 'user', content: `Paid ad data:\n\n${JSON.stringify(summary, null, 2)}\n\nAnalyze and give insights.` }],
        }),
      })
      const data = await res.json()
      const text = data.content?.map((c: any) => c.text || '').join('') || 'No insights returned.'
      setInsights(text)
    } catch {
      setInsights('Unable to generate insights right now. Please try again.')
    }
    setLoadingInsights(false)
  }

  const filtered = adLogs.filter(a => {
    if (filterAudience !== 'All' && a.data?.audience !== filterAudience) return false
    if (filterPlatform !== 'All' && a.data?.platform !== filterPlatform) return false
    if (filterFormat   !== 'All' && a.data?.ad_format !== filterFormat)  return false
    return true
  })

  const totalSpend       = adLogs.reduce((s, a) => s + (a.data?.spend || 0), 0)
  const totalImpressions = adLogs.reduce((s, a) => s + (a.data?.impressions || 0), 0)
  const totalClicks      = adLogs.reduce((s, a) => s + (a.data?.clicks || 0), 0)
  const totalConversions = adLogs.reduce((s, a) => s + (a.data?.conversions || 0), 0)

  const credits      = creditLogs.filter(c => c.type === 'ad_credit')
  const promos       = creditLogs.filter(c => c.type === 'promo')
  const totalCredits = credits.reduce((s, c) => s + (c.data?.amount || 0), 0)

  function renderMarkdown(text: string) {
    return text
      .replace(/## (.+)/g, '<p style="font-weight:700;color:#2d1a0e;margin-top:14px;margin-bottom:5px;font-size:13px;">$1</p>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^- (.+)/gm, '<div style="display:flex;gap:6px;align-items:flex-start;margin-bottom:5px;color:#5c3d2e;font-size:13px;"><span style="color:#8B4513;flex-shrink:0;margin-top:1px;">•</span><span>$1</span></div>')
      .replace(/\n/g, '')
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Summary stats */}
      {adLogs.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {[
            { label: 'Spend',        value: `$${fmtMoney(totalSpend)}` },
            { label: 'Impressions',  value: fmt(totalImpressions) },
            { label: 'Clicks',       value: fmt(totalClicks) },
            { label: 'Conversions',  value: fmt(totalConversions) },
            { label: 'Avg CPR',      value: cpr(totalSpend, totalConversions) ? `$${cpr(totalSpend, totalConversions)}` : '—' },
            { label: 'Avg CTR',      value: ctr(totalClicks, totalImpressions) ? `${ctr(totalClicks, totalImpressions)}%` : '—' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl p-3 shadow-sm text-center">
              <p className="text-base font-bold" style={{ color: '#2d1a0e' }}>{stat.value}</p>
              <p className="text-xs mt-0.5" style={{ color: '#9c7b6b' }}>{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-2 flex-wrap">
        {SUB_TABS.map(t => (
          <button key={t} onClick={() => setSubTab(t)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border"
            style={{ backgroundColor: subTab === t ? '#8B4513' : 'white', color: subTab === t ? 'white' : '#5c3d2e', borderColor: subTab === t ? '#8B4513' : '#e0d5cc' }}>
            {t}
          </button>
        ))}
      </div>

      {/* ── LOG CAMPAIGN ─────────────────────────────────────── */}
      {subTab === 'Log Campaign' && (
        <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <div>
            <p className="font-bold" style={{ color: '#2d1a0e' }}>Campaign Details</p>
            <p className="text-xs mt-0.5" style={{ color: '#9c7b6b' }}>Log a new paid ad campaign across any platform.</p>
          </div>
          <div className="flex flex-col gap-3">
            <input value={campaignName} onChange={e => setCampaignName(e.target.value)}
              placeholder="Campaign name (e.g. Meta Baker Recruitment — Spring 2025)"
              className="w-full px-3 py-2 rounded-xl border text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e' }} />

            <div className="grid grid-cols-2 gap-3">
              <select value={platform} onChange={e => { setPlatform(e.target.value); setUtmSource(e.target.value.split(' ')[0].toLowerCase()) }}
                className="w-full px-3 py-2 rounded-xl border text-sm" style={{ borderColor: '#e0d5cc', color: platform ? '#2d1a0e' : '#9c7b6b' }}>
                <option value="">Platform...</option>
                {AD_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={audience} onChange={e => setAudience(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-sm" style={{ borderColor: '#e0d5cc', color: audience ? '#2d1a0e' : '#9c7b6b' }}>
                <option value="">Target audience...</option>
                {AUDIENCE_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <select value={adFormat} onChange={e => { setAdFormat(e.target.value); setUtmContent(e.target.value.toLowerCase().replace(/\s+/g,'-').replace(/\//g,'')) }}
                className="w-full px-3 py-2 rounded-xl border text-sm" style={{ borderColor: '#e0d5cc', color: adFormat ? '#2d1a0e' : '#9c7b6b' }}>
                <option value="">Ad format...</option>
                {AD_FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <select value={objective} onChange={e => setObjective(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-sm" style={{ borderColor: '#e0d5cc', color: objective ? '#2d1a0e' : '#9c7b6b' }}>
                <option value="">Objective...</option>
                {OBJECTIVE_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#9c7b6b' }}>Start date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e' }} />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#9c7b6b' }}>End date</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e' }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm" style={{ color: '#9c7b6b' }}>$</span>
                <input type="number" min="0" value={budget} onChange={e => setBudget(e.target.value)}
                  placeholder="Budget set" className="w-full pl-6 pr-3 py-2 rounded-xl border text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e' }} />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm" style={{ color: '#9c7b6b' }}>$</span>
                <input type="number" min="0" value={spend} onChange={e => setSpend(e.target.value)}
                  placeholder="Amount spent" className="w-full pl-6 pr-3 py-2 rounded-xl border text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e' }} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <input type="number" min="0" value={impressions} onChange={e => setImpressions(e.target.value)}
                placeholder="Impressions" className="w-full px-3 py-2 rounded-xl border text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e' }} />
              <input type="number" min="0" value={clicks} onChange={e => setClicks(e.target.value)}
                placeholder="Clicks" className="w-full px-3 py-2 rounded-xl border text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e' }} />
              <input type="number" min="0" value={conversions} onChange={e => setConversions(e.target.value)}
                placeholder="Conversions" className="w-full px-3 py-2 rounded-xl border text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e' }} />
            </div>

            {spend && conversions && parseFloat(spend) > 0 && parseInt(conversions) > 0 && (
              <div className="flex gap-4 px-3 py-2 rounded-xl text-xs" style={{ backgroundColor: '#f5f0eb', color: '#5c3d2e' }}>
                <span>Cost per result: <strong>${cpr(parseFloat(spend), parseInt(conversions))}</strong></span>
                {impressions && parseInt(impressions) > 0 && clicks && parseInt(clicks) > 0 &&
                  <span>CTR: <strong>{ctr(parseInt(clicks), parseInt(impressions))}%</strong></span>}
              </div>
            )}

            <input value={creativeUrl} onChange={e => setCreativeUrl(e.target.value)}
              placeholder="Link to ad creative (Drive, Dropbox, Canva, etc.) — optional"
              className="w-full px-3 py-2 rounded-xl border text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e' }} />

            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Notes — targeting details, audience size, what worked, etc. (optional)" rows={2}
              className="w-full px-3 py-2 rounded-xl border text-sm resize-none" style={{ borderColor: '#e0d5cc', color: '#2d1a0e' }} />
          </div>

          {/* UTM Builder */}
          <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ borderColor: '#e0d5cc', backgroundColor: '#faf8f6' }}>
            <div>
              <p className="text-sm font-bold" style={{ color: '#2d1a0e' }}>Tracking Link Builder</p>
              <p className="text-xs mt-0.5" style={{ color: '#9c7b6b' }}>Builds a trackable URL so you can see exactly which ad drove clicks in Google Analytics or your dashboard.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Landing page', hint: '', val: utmBase, set: setUtmBase, ph: 'whiskly.co' },
                { label: 'Platform / Source', hint: 'e.g. meta, google', val: utmSource, set: setUtmSource, ph: 'meta' },
                { label: 'Medium', hint: 'e.g. paid, cpc', val: utmMedium, set: setUtmMedium, ph: 'paid' },
                { label: 'Campaign name', hint: 'slug', val: utmCampaign, set: setUtmCampaign, ph: 'baker-spring-2025' },
                { label: 'Ad format / Content', hint: 'optional', val: utmContent, set: setUtmContent, ph: 'carousel' },
                { label: 'Keyword / Term', hint: 'optional', val: utmTerm, set: setUtmTerm, ph: 'custom-cakes' },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-xs mb-1 block" style={{ color: '#9c7b6b' }}>
                    {f.label} {f.hint && <span style={{ color: '#c4a882' }}>({f.hint})</span>}
                  </label>
                  <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                    className="w-full px-3 py-2 rounded-xl border text-xs" style={{ borderColor: '#e0d5cc', color: '#2d1a0e' }} />
                </div>
              ))}
            </div>
            {utmUrl && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl border" style={{ borderColor: '#e0d5cc', backgroundColor: 'white' }}>
                <p className="text-xs flex-1 break-all" style={{ color: '#5c3d2e' }}>{utmUrl}</p>
                <button onClick={copyUTM} className="text-xs px-3 py-1.5 rounded-lg text-white font-semibold flex-shrink-0"
                  style={{ backgroundColor: utmCopied ? '#16a34a' : '#2d1a0e' }}>
                  {utmCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            )}
          </div>

          <button onClick={saveAd} disabled={saving || !canSave}
            className="py-2.5 rounded-xl text-white text-sm font-semibold self-start px-6"
            style={{ backgroundColor: '#2d1a0e', opacity: !canSave ? 0.4 : 1 }}>
            {saving ? 'Saving...' : 'Log Campaign'}
          </button>
        </div>
      )}

      {/* ── CAMPAIGN HISTORY ─────────────────────────────────── */}
      {subTab === 'Campaign History' && (
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <p className="font-bold" style={{ color: '#2d1a0e' }}>Campaign History</p>
            <div className="flex gap-2 flex-wrap">
              <div className="flex gap-1">
                {['All', 'Bakers', 'Customers'].map(a => (
                  <button key={a} onClick={() => setFilterAudience(a)}
                    className="text-xs px-2.5 py-1 rounded-lg font-semibold"
                    style={{ backgroundColor: filterAudience === a ? '#2d1a0e' : '#f5f0eb', color: filterAudience === a ? 'white' : '#5c3d2e' }}>
                    {a}
                  </button>
                ))}
              </div>
              <select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)}
                className="text-xs px-2.5 py-1 rounded-lg border" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>
                <option value="All">All platforms</option>
                {AD_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={filterFormat} onChange={e => setFilterFormat(e.target.value)}
                className="text-xs px-2.5 py-1 rounded-lg border" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>
                <option value="All">All formats</option>
                {AD_FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          {filtered.length === 0 && <p className="text-xs" style={{ color: '#9c7b6b' }}>No campaigns logged yet.</p>}
          <div className="flex flex-col gap-3">
            {filtered.map(a => {
              const d = a.data
              const pc = PLATFORM_COLORS[d?.platform] || { bg: '#f5f0eb', color: '#5c3d2e' }
              const ac = AUDIENCE_COLORS[d?.audience] || { bg: '#f5f0eb', color: '#5c3d2e' }
              const fc = FORMAT_COLORS[d?.ad_format]  || { bg: '#f5f0eb', color: '#5c3d2e' }
              const isExp = expandedId === a.id

              return (
                <div key={a.id} className="rounded-xl border overflow-hidden" style={{ borderColor: '#e0d5cc' }}>
                  <button onClick={() => setExpandedId(isExp ? null : a.id)}
                    className="w-full flex items-start justify-between p-3 text-left gap-2" style={{ backgroundColor: 'white' }}>
                    <div className="flex flex-col gap-1.5">
                      <p className="text-sm font-semibold" style={{ color: '#2d1a0e' }}>{d?.campaign_name}</p>
                      <div className="flex gap-1.5 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: pc.bg, color: pc.color }}>{d?.platform}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: ac.bg, color: ac.color }}>{d?.audience}</span>
                        {d?.ad_format && <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: fc.bg, color: fc.color }}>{d.ad_format}</span>}
                        {d?.objective && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#f5f0eb', color: '#8B4513' }}>{d.objective}</span>}
                      </div>
                    </div>
                    <span className="text-xs flex-shrink-0 mt-1" style={{ color: '#9c7b6b' }}>{isExp ? '▲' : '▼'}</span>
                  </button>
                  <div className="flex gap-4 px-3 pb-3 flex-wrap" style={{ backgroundColor: 'white' }}>
                    {d?.spend > 0 && <span className="text-xs" style={{ color: '#5c3d2e' }}>Spent <strong>${fmtMoney(d.spend)}</strong>{d?.budget > 0 ? ` / $${fmtMoney(d.budget)}` : ''}</span>}
                    {d?.impressions > 0 && <span className="text-xs" style={{ color: '#5c3d2e' }}><strong>{fmt(d.impressions)}</strong> impr.</span>}
                    {d?.clicks > 0 && <span className="text-xs" style={{ color: '#5c3d2e' }}><strong>{fmt(d.clicks)}</strong> clicks</span>}
                    {d?.conversions > 0 && <span className="text-xs" style={{ color: '#5c3d2e' }}><strong>{d.conversions}</strong> conv.</span>}
                    {cpr(d?.spend, d?.conversions) && <span className="text-xs font-semibold" style={{ color: '#854d0e' }}>CPR ${cpr(d.spend, d.conversions)}</span>}
                    {ctr(d?.clicks, d?.impressions) && <span className="text-xs font-semibold" style={{ color: '#854d0e' }}>CTR {ctr(d.clicks, d.impressions)}%</span>}
                  </div>
                  {isExp && (
                    <div className="px-3 pb-3 flex flex-col gap-1.5 border-t" style={{ borderColor: '#f5f0eb', backgroundColor: '#faf8f6' }}>
                      {(d?.start_date || d?.end_date) && (
                        <p className="text-xs pt-2" style={{ color: '#9c7b6b' }}>
                          {d.start_date && fmtDate(d.start_date)}{d.start_date && d.end_date && ' → '}{d.end_date && fmtDate(d.end_date)}
                        </p>
                      )}
                      {d?.tracking_url && (
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs flex-1 break-all" style={{ color: '#5c3d2e' }}>{d.tracking_url}</p>
                          <button onClick={() => navigator.clipboard.writeText(d.tracking_url)}
                            className="text-xs px-2 py-1 rounded-lg border flex-shrink-0" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>Copy</button>
                        </div>
                      )}
                      {d?.notes && <p className="text-xs" style={{ color: '#5c3d2e' }}>{d.notes}</p>}
                      {d?.creative_url && <a href={d.creative_url} target="_blank" rel="noopener noreferrer" className="text-xs underline" style={{ color: '#8B4513' }}>View creative</a>}
                      <p className="text-xs" style={{ color: '#9c7b6b' }}>Logged {fmtDate(a.created_at)}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── AI INSIGHTS ──────────────────────────────────────── */}
      {subTab === 'AI Insights' && (
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="font-bold mb-1" style={{ color: '#2d1a0e' }}>AI Campaign Insights</p>
            <p className="text-xs mb-4" style={{ color: '#9c7b6b' }}>
              Analyzes all your logged campaigns to surface what's working, what's not, and where to invest next.
              {adLogs.length === 0 && ' Log at least one campaign to get started.'}
            </p>
            <button onClick={generateInsights} disabled={loadingInsights || adLogs.length === 0}
              className="py-2.5 px-5 rounded-xl text-white text-sm font-semibold"
              style={{ backgroundColor: '#8B4513', opacity: adLogs.length === 0 ? 0.4 : 1 }}>
              {loadingInsights ? 'Analyzing...' : insights ? 'Refresh Insights' : 'Generate Insights'}
            </button>
          </div>

          {loadingInsights && (
            <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-3">
              <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: '#e0d5cc', borderTopColor: '#8B4513' }} />
              <p className="text-sm" style={{ color: '#9c7b6b' }}>Analyzing your campaigns...</p>
            </div>
          )}

          {insights && !loadingInsights && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="text-sm" style={{ color: '#5c3d2e', lineHeight: '1.7' }}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(insights) }} />
            </div>
          )}

          {/* Format breakdown */}
          {adLogs.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="font-bold mb-3" style={{ color: '#2d1a0e' }}>Performance by Ad Format</p>
              <div className="flex flex-col gap-2">
                {AD_FORMATS.map(f => {
                  const logs = adLogs.filter(a => a.data?.ad_format === f)
                  if (!logs.length) return null
                  const fSpend = logs.reduce((s, a) => s + (a.data?.spend || 0), 0)
                  const fConv  = logs.reduce((s, a) => s + (a.data?.conversions || 0), 0)
                  const fClicks= logs.reduce((s, a) => s + (a.data?.clicks || 0), 0)
                  const fImpr  = logs.reduce((s, a) => s + (a.data?.impressions || 0), 0)
                  const colors = FORMAT_COLORS[f] || { bg: '#f5f0eb', color: '#5c3d2e' }
                  return (
                    <div key={f} className="flex items-center justify-between p-2.5 rounded-xl" style={{ backgroundColor: colors.bg }}>
                      <span className="text-xs font-semibold" style={{ color: colors.color }}>{f}</span>
                      <div className="flex gap-3 text-xs" style={{ color: colors.color }}>
                        <span>${fmtMoney(fSpend)}</span>
                        {fConv > 0 && <span>{fConv} conv.</span>}
                        {fSpend > 0 && fConv > 0 && <span>CPR ${cpr(fSpend, fConv)}</span>}
                        {fImpr > 0 && fClicks > 0 && <span>CTR {ctr(fClicks, fImpr)}%</span>}
                      </div>
                    </div>
                  )
                }).filter(Boolean)}
              </div>
            </div>
          )}

          {/* Audience breakdown */}
          {adLogs.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="font-bold mb-3" style={{ color: '#2d1a0e' }}>Bakers vs Customers</p>
              <div className="flex flex-col gap-2">
                {['Bakers', 'Customers'].map(aud => {
                  const logs = adLogs.filter(a => a.data?.audience === aud)
                  if (!logs.length) return null
                  const aSpend = logs.reduce((s, a) => s + (a.data?.spend || 0), 0)
                  const aConv  = logs.reduce((s, a) => s + (a.data?.conversions || 0), 0)
                  const colors = AUDIENCE_COLORS[aud]
                  return (
                    <div key={aud} className="flex items-center justify-between p-2.5 rounded-xl" style={{ backgroundColor: colors.bg }}>
                      <span className="text-xs font-semibold" style={{ color: colors.color }}>{aud}</span>
                      <div className="flex gap-3 text-xs" style={{ color: colors.color }}>
                        <span>{logs.length} campaign{logs.length !== 1 ? 's' : ''}</span>
                        <span>${fmtMoney(aSpend)} spent</span>
                        {aConv > 0 && <span>{aConv} conv.</span>}
                        {aSpend > 0 && aConv > 0 && <span>CPR ${cpr(aSpend, aConv)}</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CREDITS & PROMOS ─────────────────────────────────── */}
      {subTab === 'Credits & Promos' && (
        <div className="flex flex-col gap-4">
          {(credits.length > 0 || promos.length > 0) && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
                <p className="text-lg font-bold" style={{ color: '#2d1a0e' }}>${fmtMoney(totalCredits)}</p>
                <p className="text-xs mt-0.5" style={{ color: '#9c7b6b' }}>Total ad credits logged</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
                <p className="text-lg font-bold" style={{ color: '#2d1a0e' }}>{promos.length}</p>
                <p className="text-xs mt-0.5" style={{ color: '#9c7b6b' }}>Promo codes logged</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-4">
            <p className="font-bold" style={{ color: '#2d1a0e' }}>Log a Credit or Promo</p>
            <div className="flex gap-2">
              {(['credit', 'promo'] as const).map(t => (
                <button key={t} onClick={() => setCreditType(t)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border capitalize"
                  style={{ backgroundColor: creditType === t ? '#2d1a0e' : 'white', color: creditType === t ? 'white' : '#5c3d2e', borderColor: creditType === t ? '#2d1a0e' : '#e0d5cc' }}>
                  {t === 'credit' ? 'Ad Credit' : 'Promo Code'}
                </button>
              ))}
            </div>

            {creditType === 'credit' ? (
              <div className="flex flex-col gap-3">
                <p className="text-xs" style={{ color: '#9c7b6b' }}>Log free ad credits from platforms (e.g. Google gave you $300 to try Ads).</p>
                <div className="grid grid-cols-2 gap-3">
                  <select value={creditPlatform} onChange={e => setCreditPlatform(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-sm" style={{ borderColor: '#e0d5cc', color: creditPlatform ? '#2d1a0e' : '#9c7b6b' }}>
                    <option value="">Platform...</option>
                    {CREDIT_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-sm" style={{ color: '#9c7b6b' }}>$</span>
                    <input type="number" min="0" value={creditAmount} onChange={e => setCreditAmount(e.target.value)}
                      placeholder="Credit amount" className="w-full pl-6 pr-3 py-2 rounded-xl border text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e' }} />
                  </div>
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: '#9c7b6b' }}>Expiry date (if applicable)</label>
                  <input type="date" value={creditExpiry} onChange={e => setCreditExpiry(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e' }} />
                </div>
                <textarea value={creditNotes} onChange={e => setCreditNotes(e.target.value)} placeholder="Notes (optional)" rows={2}
                  className="w-full px-3 py-2 rounded-xl border text-sm resize-none" style={{ borderColor: '#e0d5cc', color: '#2d1a0e' }} />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-xs" style={{ color: '#9c7b6b' }}>Log discount codes or promotions you're running for bakers or customers.</p>
                <div className="grid grid-cols-2 gap-3">
                  <input value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="BAKER25"
                    className="w-full px-3 py-2 rounded-xl border text-sm font-mono" style={{ borderColor: '#e0d5cc', color: '#2d1a0e' }} />
                  <select value={promoType} onChange={e => setPromoType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-sm" style={{ borderColor: '#e0d5cc', color: promoType ? '#2d1a0e' : '#9c7b6b' }}>
                    <option value="">Promo type...</option>
                    {PROMO_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input value={promoValue} onChange={e => setPromoValue(e.target.value)}
                    placeholder="Value (e.g. 25% off, $10 off)"
                    className="w-full px-3 py-2 rounded-xl border text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e' }} />
                  <input type="date" value={promoExpiry} onChange={e => setPromoExpiry(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e' }} />
                </div>
                <textarea value={promoNotes} onChange={e => setPromoNotes(e.target.value)}
                  placeholder="Notes — who it's for, conditions, etc. (optional)" rows={2}
                  className="w-full px-3 py-2 rounded-xl border text-sm resize-none" style={{ borderColor: '#e0d5cc', color: '#2d1a0e' }} />
              </div>
            )}

            <button onClick={saveCredit} disabled={savingCredit}
              className="py-2.5 rounded-xl text-white text-sm font-semibold self-start px-6"
              style={{ backgroundColor: '#2d1a0e' }}>
              {savingCredit ? 'Saving...' : creditType === 'credit' ? 'Log Credit' : 'Log Promo Code'}
            </button>
          </div>

          {credits.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="font-bold mb-3" style={{ color: '#2d1a0e' }}>Ad Credits</p>
              <div className="flex flex-col gap-2">
                {credits.map(c => {
                  const isExpired = c.data?.expiry && new Date(c.data.expiry) < new Date()
                  return (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: '#e0d5cc' }}>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold" style={{ color: '#2d1a0e' }}>{c.data?.platform}</p>
                          {isExpired && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>Expired</span>}
                        </div>
                        {c.data?.expiry && <p className="text-xs" style={{ color: '#9c7b6b' }}>Expires {fmtDate(c.data.expiry)}</p>}
                        {c.data?.notes && <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>{c.data.notes}</p>}
                      </div>
                      <p className="text-base font-bold" style={{ color: '#2d1a0e' }}>${fmtMoney(c.data?.amount || 0)}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {promos.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="font-bold mb-3" style={{ color: '#2d1a0e' }}>Promo Codes</p>
              <div className="flex flex-col gap-2">
                {promos.map(p => {
                  const isExpired = p.data?.expiry && new Date(p.data.expiry) < new Date()
                  return (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: '#e0d5cc' }}>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold font-mono" style={{ color: '#8B4513' }}>{p.data?.code}</p>
                          {p.data?.promo_type && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#f5f0eb', color: '#5c3d2e' }}>{p.data.promo_type}</span>}
                          {isExpired && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>Expired</span>}
                        </div>
                        {p.data?.expiry && <p className="text-xs" style={{ color: '#9c7b6b' }}>Expires {fmtDate(p.data.expiry)}</p>}
                        {p.data?.notes && <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>{p.data.notes}</p>}
                      </div>
                      <p className="text-sm font-semibold" style={{ color: '#2d1a0e' }}>{p.data?.value}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  )
}