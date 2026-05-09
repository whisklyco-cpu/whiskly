'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { EmailModal } from './EmailModal'

export function DisputeCase({
  order,
  bakers,
  onResolve,
  onRefund,
}: {
  order: any
  bakers: any[]
  onResolve: (orderId: string) => void
  onRefund: () => void
}) {
  // ── State ─────────────────────────────────────────────────────────────────
  const [expandedStep, setExpandedStep] = useState<number | null>(0)
  const [steps, setSteps] = useState<string[]>([])
  const [ruling, setRuling] = useState<string>('')
  const [strikeBaker, setStrikeBaker] = useState<boolean>(false)
  const [notes, setNotes] = useState<string>('')
  const [saving, setSaving] = useState<boolean>(false)
  const [emailModal, setEmailModal] = useState<{ to: string; subject: string; body: string } | null>(null)

  // FIX 2: Independent split inputs — no mirroring
  const [customerSplit, setCustomerSplit] = useState<number>(50)
  const [bakerSplit, setBakerSplit] = useState<number>(50)

  // FIX 3: Evidence checklist
  const [messageCount, setMessageCount] = useState<number | null>(null)
  const [expandedEvidence, setExpandedEvidence] = useState<Set<number>>(new Set())

  // Dispute evidence submissions
  const [evidenceData, setEvidenceData] = useState<any[] | null>(null)
  const [evidenceFetchError, setEvidenceFetchError] = useState<string>('')

  // FIX 4: Contact email drafts
  const bakerName = order.bakers?.business_name ?? ''
  const [customerDraft, setCustomerDraft] = useState(
    `Hi ${order.customer_name},\n\nWe are reviewing your dispute for your ${order.event_type} order with ${bakerName}. We may have a few questions as we investigate.\n\nCould you please share any additional details about your concern?\n\nWhiskly Support\nsupport@whiskly.co`
  )
  const [bakerDraft, setBakerDraft] = useState(
    `Hi ${bakerName},\n\nWe have received a dispute on order ${order.id.slice(0, 8).toUpperCase()} for a ${order.event_type} on ${order.event_date}. We are reviewing the situation.\n\nCould you please share your side of the situation?\n\nWhiskly Support\nsupport@whiskly.co`
  )
  const [sentToCustomer, setSentToCustomer] = useState(false)
  const [sentToBaker, setSentToBaker] = useState(false)
  const [sendingCustomer, setSendingCustomer] = useState(false)
  const [sendingBaker, setSendingBaker] = useState(false)
  const [sendError, setSendError] = useState('')
  const [closing, setClosing] = useState(false)
  const [closed, setClosed] = useState(false)
  const [closeError, setCloseError] = useState('')

  const baker = bakers.find((b: any) => b.id === order.baker_id) || order.bakers

  // ── Derived ───────────────────────────────────────────────────────────────
  const splitTotal = customerSplit + bakerSplit
  const notesValid = notes.trim().length >= 20
  const canAdvance = notes.trim().length > 0

  // ── Effects ───────────────────────────────────────────────────────────────
  // FIX 3: Fetch message count on mount
  useEffect(() => {
    async function fetchMsgCount() {
      const { createClient } = await import('@supabase/supabase-js')
      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
      const { count } = await sb
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('order_id', order.id)
      setMessageCount(count ?? 0)
    }
    fetchMsgCount()
  }, [order.id])

  async function fetchEvidence() {
    if (!order.evidence_deadline) return
    setEvidenceData(null)
    setEvidenceFetchError('')
    try {
      const r = await fetch(`/api/admin/disputes/evidence?order_id=${order.id}`)
      if (!r.ok) {
        const msg = r.status === 401 ? 'Unauthorized — please reload the admin page.' : `Failed to load evidence (${r.status}).`
        setEvidenceFetchError(msg)
        return
      }
      const d = await r.json()
      setEvidenceData(d.evidence || [])
    } catch {
      setEvidenceFetchError('Network error — could not load evidence.')
    }
  }

  useEffect(() => {
    fetchEvidence()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.id, order.evidence_deadline])

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleRulingClick(value: string) {
    setRuling(value)
  }

  function handleCustomerSplitChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseInt(e.target.value)
    setCustomerSplit(isNaN(v) ? 0 : Math.max(0, Math.min(100, v)))
  }

  function handleBakerSplitChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseInt(e.target.value)
    setBakerSplit(isNaN(v) ? 0 : Math.max(0, Math.min(100, v)))
  }

  function handleNotesChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setNotes(e.target.value)
  }

  function handleAdvanceStep3() {
    if (!notes.trim()) return
    markStepDone(STEPS[2].label, 3)
  }

  function markStepDone(label: string, nextStep: number) {
    setSteps(prev => (prev.includes(label) ? prev : [...prev, label]))
    setExpandedStep(nextStep < STEPS.length ? nextStep : null)
  }

  function toggleEvidence(i: number) {
    setExpandedEvidence(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  async function saveNotes() {
    setSaving(true)
    await supabase.from('orders').update({ dispute_notes: notes } as any).eq('id', order.id)
    setSaving(false)
  }

  async function closeDispute() {
    setClosing(true)
    setCloseError('')
    try {
      const res = await fetch('/api/admin/disputes/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          decision: ruling,
          notes: notes.trim(),
          customer_pct: customerSplit,
          baker_pct: bakerSplit,
          strike_baker: strikeBaker,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Resolution failed')
      markStepDone(STEPS[3].label, 4)
      setClosed(true)
      // Show the success banner briefly, then auto-close and remove from list
      setTimeout(() => {
        onResolve(order.id)
      }, 1500)
    } catch (e: any) {
      setCloseError(e.message || 'Unknown error')
    } finally {
      setClosing(false)
    }
  }

  async function sendContactEmail(recipient: 'customer' | 'baker') {
    const isCustomer = recipient === 'customer'
    const to = isCustomer ? order.customer_email : (baker?.email || '')
    const body = isCustomer ? customerDraft : bakerDraft
    const subject = `Your ${order.event_type || 'order'} dispute — Order ${order.id.slice(0, 8).toUpperCase()}`

    if (!to) { setSendError('No email address found for this recipient'); return }

    if (isCustomer) setSendingCustomer(true)
    else setSendingBaker(true)
    setSendError('')

    try {
      const res = await fetch('/api/admin/disputes/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: order.id, to, subject, body }),
      })
      const data = await res.json()
      if (!res.ok) { setSendError(data.error || 'Failed to send email'); return }
      if (isCustomer) setSentToCustomer(true)
      else setSentToBaker(true)
      // Auto-advance step 2 on first send
      markStepDone(STEPS[1].label, 2)
    } catch (e: any) {
      setSendError(e.message || 'Network error')
    } finally {
      if (isCustomer) setSendingCustomer(false)
      else setSendingBaker(false)
    }
  }

  // ── Constants ─────────────────────────────────────────────────────────────
  const STEPS = [
    { label: 'Review order details and evidence', key: 'review' },
    { label: 'Contact both parties if needed', key: 'contact' },
    { label: 'Make a ruling', key: 'ruling' },
    { label: 'Take action and close dispute', key: 'close' },
  ]

  const RULING_OPTIONS = [
    { value: 'customer', label: 'Rule for customer — full refund, baker may receive strike' },
    { value: 'baker', label: 'Rule for baker — release payment, no refund' },
    { value: 'partial', label: 'Split — partial refund, negotiate amount' },
    { value: 'noop', label: 'No action needed — unlock order and continue' },
  ]

  const advanceButtonLabel = notes.trim().length === 0
    ? 'Add notes before continuing'
    : 'Mark Done — Ruling Made'

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <EmailModal emailModal={emailModal} onClose={() => setEmailModal(null)} />
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

          {/* ── Step 1 — Evidence Checklist ─────────────────────────────── */}
          <div className="rounded-xl overflow-hidden border" style={{ borderColor: steps.includes(STEPS[0].label) ? '#bbf7d0' : '#e0d5cc' }}>
            <button
              type="button"
              onClick={() => setExpandedStep(expandedStep === 0 ? null : 0)}
              className="w-full flex items-center gap-3 p-3 text-left"
              style={{ backgroundColor: steps.includes(STEPS[0].label) ? '#dcfce7' : '#faf8f6' }}
            >
              <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ backgroundColor: steps.includes(STEPS[0].label) ? '#166534' : '#e0d5cc', color: 'white' }}>
                {steps.includes(STEPS[0].label) ? '✓' : '1'}
              </div>
              <span className="text-xs font-medium flex-1" style={{ color: steps.includes(STEPS[0].label) ? '#166534' : '#2d1a0e', textDecoration: steps.includes(STEPS[0].label) ? 'line-through' : 'none' }}>{STEPS[0].label}</span>
              <span className="text-xs" style={{ color: '#9c7b6b' }}>{expandedStep === 0 ? '▲' : '▼'}</span>
            </button>
            {expandedStep === 0 && (
              <div className="p-4 border-t flex flex-col gap-3" style={{ borderColor: '#e0d5cc', backgroundColor: 'white' }}>

                {/* Evidence checklist */}
                <div className="flex flex-col gap-2">

                  {/* 1. Delivery photo */}
                  <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: order.handoff_photo_url ? '#f0fdf4' : '#fef2f2' }}>
                    <span className="text-xs font-bold px-1 rounded-full flex-shrink-0" style={{ backgroundColor: order.handoff_photo_url ? '#16a34a' : '#ef4444', color: 'white' }}>
                      {order.handoff_photo_url ? '✓' : '✗'}
                    </span>
                    <div className="text-xs">
                      {order.handoff_photo_url ? (
                        <span style={{ color: '#166534' }}>
                          Delivery photo uploaded{' '}
                          <a href={order.handoff_photo_url} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: '#8B4513' }}>View photo</a>
                        </span>
                      ) : (
                        <span className="font-medium" style={{ color: '#991b1b' }}>No delivery photo</span>
                      )}
                    </div>
                  </div>

                  {/* 2. Baker marked delivered */}
                  <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: order.status === 'delivered' ? '#f0fdf4' : '#fef2f2' }}>
                    <span className="text-xs font-bold px-1 rounded-full flex-shrink-0" style={{ backgroundColor: order.status === 'delivered' ? '#16a34a' : '#ef4444', color: 'white' }}>
                      {order.status === 'delivered' ? '✓' : '✗'}
                    </span>
                    <span className="text-xs font-medium" style={{ color: order.status === 'delivered' ? '#166534' : '#991b1b' }}>
                      {order.status === 'delivered' ? 'Baker marked order delivered' : 'Baker has not marked order delivered'}
                    </span>
                  </div>

                  {/* 3. Customer confirmed receipt */}
                  <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: (order.pickup_confirmed_at || order.delivery_confirmed_at) ? '#f0fdf4' : '#fef2f2' }}>
                    <span className="text-xs font-bold px-1 rounded-full flex-shrink-0" style={{ backgroundColor: (order.pickup_confirmed_at || order.delivery_confirmed_at) ? '#16a34a' : '#ef4444', color: 'white' }}>
                      {(order.pickup_confirmed_at || order.delivery_confirmed_at) ? '✓' : '✗'}
                    </span>
                    <span className="text-xs font-medium" style={{ color: (order.pickup_confirmed_at || order.delivery_confirmed_at) ? '#166534' : '#991b1b' }}>
                      {(order.pickup_confirmed_at || order.delivery_confirmed_at) ? 'Customer confirmed receipt' : 'Customer has not confirmed receipt'}
                    </span>
                  </div>

                  {/* 4. Dispute reason */}
                  <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: order.dispute_reason?.trim() ? '#f0fdf4' : '#fef2f2' }}>
                    <span className="text-xs font-bold px-1 rounded-full flex-shrink-0" style={{ backgroundColor: order.dispute_reason?.trim() ? '#16a34a' : '#ef4444', color: 'white' }}>
                      {order.dispute_reason?.trim() ? '✓' : '✗'}
                    </span>
                    <span className="text-xs font-medium" style={{ color: order.dispute_reason?.trim() ? '#166534' : '#991b1b' }}>
                      {order.dispute_reason?.trim() ? `Dispute reason: ${order.dispute_reason}` : 'No dispute reason provided'}
                    </span>
                  </div>

                  {/* 5. Dispute description — expandable */}
                  <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #e0d5cc' }}>
                    <div className="flex items-start gap-3 p-3" style={{ backgroundColor: order.dispute_description?.trim() ? '#f0fdf4' : '#fef2f2' }}>
                      <span className="text-xs font-bold px-1 rounded-full flex-shrink-0" style={{ backgroundColor: order.dispute_description?.trim() ? '#16a34a' : '#ef4444', color: 'white' }}>
                        {order.dispute_description?.trim() ? '✓' : '✗'}
                      </span>
                      <span className="text-xs font-medium flex-1" style={{ color: order.dispute_description?.trim() ? '#166534' : '#991b1b' }}>
                        {order.dispute_description?.trim() ? 'Dispute description provided' : 'No dispute description provided'}
                      </span>
                      {order.dispute_description?.trim() && (
                        <button
                          type="button"
                          onClick={() => toggleEvidence(4)}
                          className="text-xs flex-shrink-0"
                          style={{ color: '#9c7b6b' }}
                        >
                          {expandedEvidence.has(4) ? '▲' : '▼'}
                        </button>
                      )}
                    </div>
                    {expandedEvidence.has(4) && order.dispute_description?.trim() && (
                      <div className="px-3 pb-3 pt-2 border-t text-xs" style={{ borderColor: '#e0d5cc', backgroundColor: 'white', color: '#5c3d2e' }}>
                        {order.dispute_description.slice(0, 200)}{order.dispute_description.length > 200 ? '…' : ''}
                      </div>
                    )}
                  </div>

                  {/* 6. Messages */}
                  <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: messageCount === null ? '#faf8f6' : messageCount > 0 ? '#f0fdf4' : '#fef2f2' }}>
                    <span className="text-xs font-bold px-1 rounded-full flex-shrink-0" style={{ backgroundColor: messageCount === null ? '#9ca3af' : messageCount > 0 ? '#16a34a' : '#ef4444', color: 'white' }}>
                      {messageCount === null ? '…' : messageCount > 0 ? '✓' : '✗'}
                    </span>
                    <span className="text-xs font-medium" style={{ color: messageCount === null ? '#6b7280' : messageCount > 0 ? '#166534' : '#991b1b' }}>
                      {messageCount === null
                        ? 'Checking messages...'
                        : messageCount > 0
                        ? `${messageCount} message${messageCount !== 1 ? 's' : ''} on this order`
                        : 'No messages found'}
                    </span>
                  </div>

                </div>

                {/* ── Evidence Submissions ──────────────────────────────── */}
                {order.evidence_deadline && (() => {
                  const deadlinePassed = new Date() > new Date(order.evidence_deadline)
                  const bothSubmitted = evidenceData !== null && evidenceData.length === 2 && evidenceData.every(e => e.submitted_at)
                  const canView = deadlinePassed || bothSubmitted
                  return (
                    <div className="mt-1 pt-3 border-t" style={{ borderColor: '#e0d5cc' }}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold" style={{ color: '#2d1a0e' }}>Evidence Submissions</p>
                        <button
                          type="button"
                          onClick={fetchEvidence}
                          className="text-xs px-2 py-0.5 rounded border"
                          style={{ borderColor: '#e0d5cc', color: '#5c3d2e', backgroundColor: '#faf8f6' }}
                        >
                          Refresh
                        </button>
                      </div>
                      {evidenceData === null && !evidenceFetchError ? (
                        <p className="text-xs" style={{ color: '#9c7b6b' }}>Loading…</p>
                      ) : evidenceFetchError ? (
                        <div className="p-3 rounded-lg" style={{ backgroundColor: '#fef2f2' }}>
                          <p className="text-xs font-semibold" style={{ color: '#991b1b' }}>{evidenceFetchError}</p>
                        </div>
                      ) : !canView ? (
                        <div className="p-3 rounded-lg" style={{ backgroundColor: '#fff7ed' }}>
                          <p className="text-xs font-semibold" style={{ color: '#854d0e' }}>
                            Evidence collection in progress. Deadline: {new Date(order.evidence_deadline).toLocaleString()}
                          </p>
                          <p className="text-xs mt-1" style={{ color: '#92400e' }}>
                            {evidenceData!.filter(e => e.submitted_at).length} of 2 parties have submitted.
                          </p>
                        </div>
                      ) : (
                        <div className="flex gap-3 flex-wrap">
                          {(['customer', 'baker'] as const).map(party => {
                            const ev = evidenceData!.find(e => e.submitted_by === party)
                            return (
                              <div key={party} className="flex-1 p-3 rounded-xl border" style={{ minWidth: 200, borderColor: '#e0d5cc', backgroundColor: '#faf8f6' }}>
                                <p className="text-xs font-bold mb-1.5 capitalize" style={{ color: '#2d1a0e' }}>{party} Evidence</p>
                                {ev?.submitted_at ? (
                                  <>
                                    <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>Submitted</span>
                                    <p className="text-xs mt-1" style={{ color: '#9c7b6b' }}>{new Date(ev.submitted_at).toLocaleString()}</p>
                                    {ev.statement && (
                                      <p className="text-xs mt-2 leading-relaxed" style={{ color: '#5c3d2e' }}>{ev.statement}</p>
                                    )}
                                    {ev.photo_urls?.length > 0 && (
                                      <div className="flex gap-1 mt-2 flex-wrap">
                                        {ev.photo_urls.map((url: string, i: number) => (
                                          <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                            <img src={url} alt={`evidence photo ${i + 1}`} className="w-12 h-12 rounded object-cover" style={{ border: '1px solid #e0d5cc' }} />
                                          </a>
                                        ))}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>Not submitted</span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })()}

                <button type="button" onClick={() => markStepDone(STEPS[0].label, 1)} className="px-4 py-2 rounded-lg text-xs font-semibold text-white self-start" style={{ backgroundColor: '#166534' }}>
                  Mark Done — Evidence Reviewed
                </button>
              </div>
            )}
          </div>

          {/* ── Step 2 — Contact Parties ─────────────────────────────────── */}
          <div className="rounded-xl overflow-hidden border" style={{ borderColor: steps.includes(STEPS[1].label) ? '#bbf7d0' : '#e0d5cc' }}>
            <button
              type="button"
              onClick={() => setExpandedStep(expandedStep === 1 ? null : 1)}
              className="w-full flex items-center gap-3 p-3 text-left"
              style={{ backgroundColor: steps.includes(STEPS[1].label) ? '#dcfce7' : '#faf8f6' }}
            >
              <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ backgroundColor: steps.includes(STEPS[1].label) ? '#166534' : '#e0d5cc', color: 'white' }}>
                {steps.includes(STEPS[1].label) ? '✓' : '2'}
              </div>
              <span className="text-xs font-medium flex-1" style={{ color: steps.includes(STEPS[1].label) ? '#166534' : '#2d1a0e', textDecoration: steps.includes(STEPS[1].label) ? 'line-through' : 'none' }}>{STEPS[1].label}</span>
              <span className="text-xs" style={{ color: '#9c7b6b' }}>{expandedStep === 1 ? '▲' : '▼'}</span>
            </button>
            {expandedStep === 1 && (
              <div className="p-4 border-t flex flex-col gap-3" style={{ borderColor: '#e0d5cc', backgroundColor: 'white' }}>
                <div className="rounded-xl p-3" style={{ backgroundColor: '#fef9c3' }}>
                  <p className="text-xs font-bold mb-1" style={{ color: '#854d0e' }}>This step is optional</p>
                  <p className="text-xs" style={{ color: '#5c3d2e' }}>Only contact parties if the evidence is unclear. Edit the drafts below and click Send — emails are sent directly from Whiskly. Sending at least one email completes this step automatically.</p>
                </div>

                {/* Customer draft */}
                <div className="p-3 rounded-xl flex flex-col gap-2" style={{ backgroundColor: '#f5f0eb' }}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold" style={{ color: '#2d1a0e' }}>
                      Email Customer — {order.customer_name}
                      <span className="font-normal ml-1" style={{ color: '#9c7b6b' }}>({order.customer_email})</span>
                    </p>
                    {sentToCustomer && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>✓ Sent</span>
                    )}
                  </div>
                  <textarea
                    value={customerDraft}
                    onChange={e => setCustomerDraft(e.target.value)}
                    rows={5}
                    className="w-full px-3 py-2 rounded-lg border text-xs resize-none"
                    style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: 'white', fontFamily: 'inherit' }}
                  />
                  <button
                    type="button"
                    onClick={() => sendContactEmail('customer')}
                    disabled={sendingCustomer || sentToCustomer}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white self-start disabled:opacity-40"
                    style={{ backgroundColor: '#2d1a0e' }}
                  >
                    {sendingCustomer ? 'Sending...' : sentToCustomer ? '✓ Sent' : 'Send to Customer'}
                  </button>
                </div>

                {/* Baker draft */}
                <div className="p-3 rounded-xl flex flex-col gap-2" style={{ backgroundColor: '#f5f0eb' }}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold" style={{ color: '#2d1a0e' }}>
                      Email Baker — {bakerName}
                      <span className="font-normal ml-1" style={{ color: '#9c7b6b' }}>({baker?.email})</span>
                    </p>
                    {sentToBaker && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>✓ Sent</span>
                    )}
                  </div>
                  <textarea
                    value={bakerDraft}
                    onChange={e => setBakerDraft(e.target.value)}
                    rows={5}
                    className="w-full px-3 py-2 rounded-lg border text-xs resize-none"
                    style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: 'white', fontFamily: 'inherit' }}
                  />
                  <button
                    type="button"
                    onClick={() => sendContactEmail('baker')}
                    disabled={sendingBaker || sentToBaker}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white self-start disabled:opacity-40"
                    style={{ backgroundColor: '#8B4513' }}
                  >
                    {sendingBaker ? 'Sending...' : sentToBaker ? '✓ Sent' : 'Send to Baker'}
                  </button>
                </div>

                {sendError && (
                  <p className="text-xs font-semibold" style={{ color: '#dc2626' }}>{sendError}</p>
                )}

                <button type="button" onClick={() => markStepDone(STEPS[1].label, 2)} className="px-4 py-2 rounded-lg text-xs font-semibold text-white self-start" style={{ backgroundColor: '#166534' }}>
                  Mark Done — Parties Contacted
                </button>
              </div>
            )}
          </div>

          {/* ── Step 3 — Make Ruling ──────────────────────────────────────── */}
          <div className="rounded-xl overflow-hidden border" style={{ borderColor: steps.includes(STEPS[2].label) ? '#bbf7d0' : '#e0d5cc' }}>
            <button
              type="button"
              onClick={() => setExpandedStep(expandedStep === 2 ? null : 2)}
              className="w-full flex items-center gap-3 p-3 text-left"
              style={{ backgroundColor: steps.includes(STEPS[2].label) ? '#dcfce7' : '#faf8f6' }}
            >
              <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ backgroundColor: steps.includes(STEPS[2].label) ? '#166534' : '#e0d5cc', color: 'white' }}>
                {steps.includes(STEPS[2].label) ? '✓' : '3'}
              </div>
              <span className="text-xs font-medium flex-1" style={{ color: steps.includes(STEPS[2].label) ? '#166534' : '#2d1a0e', textDecoration: steps.includes(STEPS[2].label) ? 'line-through' : 'none' }}>{STEPS[2].label}</span>
              <span className="text-xs" style={{ color: '#9c7b6b' }}>{expandedStep === 2 ? '▲' : '▼'}</span>
            </button>
            {expandedStep === 2 && (
              <div className="p-4 border-t flex flex-col gap-3" style={{ borderColor: '#e0d5cc', backgroundColor: 'white' }}>

                {/* Ruling options */}
                <div className="flex flex-col gap-2">
                  {RULING_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleRulingClick(opt.value)}
                      className="flex items-center gap-3 p-3 rounded-xl text-left border"
                      style={{
                        borderColor: ruling === opt.value ? '#2d1a0e' : '#e0d5cc',
                        backgroundColor: ruling === opt.value ? '#2d1a0e' : '#faf8f6',
                      }}
                    >
                      <div
                        className="w-4 h-4 rounded-full border-2 flex-shrink-0"
                        style={{
                          borderColor: ruling === opt.value ? 'white' : '#e0d5cc',
                          backgroundColor: ruling === opt.value ? 'white' : 'transparent',
                        }}
                      />
                      <span className="text-xs font-medium" style={{ color: ruling === opt.value ? 'white' : '#2d1a0e' }}>
                        {opt.label}
                      </span>
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
                    <p className="text-xs" style={{ color: '#5c3d2e' }}>The order will be marked complete. No refund issued. Payment released to baker via Stripe Connect.</p>
                  </div>
                )}

                {ruling === 'partial' && (
                  <div style={{padding: '16px', background: '#faf8f6', border: '1px solid #e0d5cc', borderRadius: '8px', marginTop: '12px'}}>
                    <p style={{fontWeight: 'bold', marginBottom: '12px'}}>Split amounts</p>
                    <div style={{display: 'flex', gap: '24px', alignItems: 'center'}}>
                      <div>
                        <label style={{display: 'block', marginBottom: '4px', fontSize: '14px'}}>Customer %</label>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={customerSplit}
                          onChange={handleCustomerSplitChange}
                          style={{width: '80px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px'}}
                        />
                      </div>
                      <div>
                        <label style={{display: 'block', marginBottom: '4px', fontSize: '14px'}}>Baker %</label>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={bakerSplit}
                          onChange={handleBakerSplitChange}
                          style={{width: '80px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px'}}
                        />
                      </div>
                      <div style={{marginTop: '20px'}}>
                        <span style={{
                          fontWeight: 'bold',
                          color: customerSplit + bakerSplit === 100 ? 'green' : 'red'
                        }}>
                          Total: {customerSplit + bakerSplit}%
                          {customerSplit + bakerSplit === 100 ? ' — Valid' : ' — Must equal 100'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {ruling === 'noop' && (
                  <div className="p-3 rounded-xl" style={{ backgroundColor: '#dbeafe' }}>
                    <p className="text-xs font-bold mb-1" style={{ color: '#1e40af' }}>No action needed</p>
                    <p className="text-xs" style={{ color: '#5c3d2e' }}>The dispute flag will be removed and the order will be unlocked for both parties to continue.</p>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: '#2d1a0e' }}>Internal Notes</label>
                  <textarea
                    value={notes}
                    onChange={handleNotesChange}
                    onBlur={saveNotes}
                    rows={3}
                    placeholder="e.g. No delivery photo found. Baker could not confirm delivery. Customer claims order never arrived. Ruled for customer."
                    className="w-full px-3 py-2 rounded-xl border text-xs resize-none"
                    style={{ borderColor: notesValid ? '#bbf7d0' : '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }}
                  />
                  <p className="text-xs mt-1" style={{ color: notesValid ? '#166534' : '#9c7b6b' }}>
                    {notes.trim().length} / 20 characters minimum{saving ? ' · Saving...' : ''}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAdvanceStep3}
                  disabled={!canAdvance}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white self-start"
                  style={{ backgroundColor: '#166534', opacity: canAdvance ? 1 : 0.4 }}
                >
                  {advanceButtonLabel}
                </button>

              </div>
            )}
          </div>

          {/* ── Step 4 — Take Action ──────────────────────────────────────── */}
          <div className="rounded-xl overflow-hidden border" style={{ borderColor: steps.includes(STEPS[3].label) ? '#bbf7d0' : '#e0d5cc' }}>
            <button
              type="button"
              onClick={() => setExpandedStep(expandedStep === 3 ? null : 3)}
              className="w-full flex items-center gap-3 p-3 text-left"
              style={{ backgroundColor: steps.includes(STEPS[3].label) ? '#dcfce7' : '#faf8f6' }}
            >
              <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ backgroundColor: steps.includes(STEPS[3].label) ? '#166534' : '#e0d5cc', color: 'white' }}>
                {steps.includes(STEPS[3].label) ? '✓' : '4'}
              </div>
              <span className="text-xs font-medium flex-1" style={{ color: steps.includes(STEPS[3].label) ? '#166534' : '#2d1a0e', textDecoration: steps.includes(STEPS[3].label) ? 'line-through' : 'none' }}>{STEPS[3].label}</span>
              <span className="text-xs" style={{ color: '#9c7b6b' }}>{expandedStep === 3 ? '▲' : '▼'}</span>
            </button>
            {expandedStep === 3 && (
              <div className="p-4 border-t flex flex-col gap-3" style={{ borderColor: '#e0d5cc', backgroundColor: 'white' }}>
                {!ruling && (
                  <p className="text-xs font-semibold" style={{ color: '#854d0e' }}>Complete the ruling step first.</p>
                )}
                {ruling && !closed && (
                  <>
                    <div className="p-3 rounded-xl" style={{ backgroundColor: '#f5f0eb' }}>
                      <p className="text-xs font-bold mb-1" style={{ color: '#2d1a0e' }}>Ready to apply ruling:</p>
                      <p className="text-xs" style={{ color: '#5c3d2e' }}>Click Close Dispute to automatically apply the ruling. All financial actions and emails will fire immediately.</p>
                    </div>
                    {closeError && (
                      <p className="text-xs font-semibold" style={{ color: '#dc2626' }}>{closeError}</p>
                    )}
                    {notes.trim().length < 20 && (
                      <p className="text-xs" style={{ color: '#854d0e' }}>Add at least 20 characters of notes in Step 3 before closing.</p>
                    )}
                    <button
                      type="button"
                      onClick={closeDispute}
                      disabled={closing || notes.trim().length < 20}
                      className="px-5 py-2 rounded-lg text-xs font-semibold text-white self-start"
                      style={{ backgroundColor: '#166534', opacity: (closing || notes.trim().length < 20) ? 0.5 : 1 }}
                    >
                      {closing ? 'Applying ruling...' : 'Close Dispute'}
                    </button>
                  </>
                )}
                {ruling && closed && (
                  <div className="flex flex-col gap-3">
                    <div className="p-3 rounded-xl" style={{ backgroundColor: '#dcfce7' }}>
                      <p className="text-xs font-bold" style={{ color: '#166534' }}>Dispute closed. Financial actions applied and both parties notified.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onResolve(order.id)}
                      className="px-5 py-2 rounded-lg text-xs font-semibold text-white self-start"
                      style={{ backgroundColor: '#2d1a0e' }}
                    >
                      Return to disputes list
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  )
}
