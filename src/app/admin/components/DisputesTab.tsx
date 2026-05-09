'use client'

import { useState, useMemo, useEffect } from 'react'
import { DisputeCase } from './DisputeCase'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Dispute {
  id: string
  customer_name: string
  customer_email: string
  baker_id: string
  amount_total: number
  dispute_reason: string
  dispute_description?: string
  dispute_filed_at: string
  is_disputed: boolean
  auto_resolved: boolean
  deposit_payment_intent_id?: string
  balance_payment_intent_id?: string
  resolved_at?: string
  resolved_by_admin?: string
  auto_resolved_reason?: string
  dispute_notes?: string
  reversal_eligible_until?: string
  reversed_by_admin?: string
  reversed_at?: string
  bakers?: { id: string; business_name: string; email: string; tier: string }
  // computed
  baker_name?: string
  baker_dispute_count?: number
  customer_dispute_count?: number
}

interface ReserveTx {
  id: string
  transaction_type: string
  amount: number
  balance_before: number
  balance_after: number
  notes?: string
  created_at: string
  stripe_transfer_id?: string
}

interface Props {
  activeDisputes: Dispute[]
  resolvedDisputes: Dispute[]
  onResolved: (orderId: string) => void
  onReversed: (orderId: string) => void
  focusOrderId?: string | null
  onFocusConsumed?: () => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysOpen(filedAt: string): number {
  return Math.floor((Date.now() - new Date(filedAt).getTime()) / (1000 * 60 * 60 * 24))
}

function fmt$(cents: number) {
  return '$' + (cents / 100).toFixed(2)
}

function humanDecision(reason: string) {
  if (!reason) return '—'
  if (reason.startsWith('Ruled for customer')) return 'Customer'
  if (reason.startsWith('Ruled for baker')) return 'Baker'
  if (reason.startsWith('Split')) return 'Split'
  return reason.slice(0, 40)
}

function enrichDispute(d: Dispute, allDisputes: Dispute[]): Dispute {
  const bakerName = d.bakers?.business_name ?? d.baker_name ?? '—'
  const bakerDisputeCount = allDisputes.filter(x => x.baker_id === d.baker_id).length
  const customerDisputeCount = allDisputes.filter(x => x.customer_email === d.customer_email).length
  return { ...d, baker_name: bakerName, baker_dispute_count: bakerDisputeCount, customer_dispute_count: customerDisputeCount }
}

// ─── Stats Bar ───────────────────────────────────────────────────────────────

function StatsBar({ active, resolved }: { active: Dispute[]; resolved: Dispute[] }) {
  const totalActive = active.length
  const avgDays = totalActive === 0
    ? 0
    : active.reduce((s, d) => s + daysOpen(d.dispute_filed_at), 0) / totalActive
  const amountAtStake = active.reduce((s, d) => s + (d.amount_total ?? 0), 0)
  const total = active.length + resolved.length
  const resolutionRate = total === 0 ? 0 : Math.round((resolved.length / total) * 100)

  const stats = [
    { label: 'Active Disputes', value: String(totalActive), highlight: totalActive > 0 },
    { label: 'Avg Days Open', value: avgDays.toFixed(1), highlight: avgDays > 5 },
    { label: 'Amount at Stake', value: fmt$(amountAtStake) },
    { label: 'Resolution Rate', value: resolutionRate + '%' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
      {stats.map(s => (
        <div key={s.label} className="rounded-xl p-4" style={{ backgroundColor: 'white', border: '1px solid #e0d5cc' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: '#5c3d2e' }}>{s.label}</p>
          <p className="text-xl font-bold" style={{ color: s.highlight ? '#dc2626' : '#2d1a0e' }}>{s.value}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Filters ─────────────────────────────────────────────────────────────────

function FilterBar({
  search, onSearch,
  reasonFilter, onReason,
  sort, onSort,
  disputes,
}: {
  search: string; onSearch: (v: string) => void
  reasonFilter: string; onReason: (v: string) => void
  sort: string; onSort: (v: string) => void
  disputes: Dispute[]
}) {
  const reasons = Array.from(new Set(disputes.map(d => d.dispute_reason).filter(Boolean)))

  return (
    <div className="flex gap-2 flex-wrap mb-4">
      <input
        value={search}
        onChange={e => onSearch(e.target.value)}
        placeholder="Search order, baker, customer..."
        className="px-3 py-2 rounded-lg border text-xs flex-1 min-w-48"
        style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }}
      />
      <select
        value={reasonFilter}
        onChange={e => onReason(e.target.value)}
        className="px-3 py-2 rounded-lg border text-xs"
        style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }}
      >
        <option value="">All Reasons</option>
        {reasons.map(r => <option key={r} value={r}>{r}</option>)}
      </select>
      <select
        value={sort}
        onChange={e => onSort(e.target.value)}
        className="px-3 py-2 rounded-lg border text-xs"
        style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }}
      >
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="amount_desc">Highest Amount</option>
        <option value="days_open">Days Open</option>
      </select>
    </div>
  )
}

// ─── Resolve Modal ────────────────────────────────────────────────────────────

function ResolveModal({ dispute, onClose, onResolved }: {
  dispute: Dispute
  onClose: () => void
  onResolved: (orderId: string) => void
}) {
  const [decision, setDecision] = useState('')
  const [notes, setNotes] = useState('')
  const [customerPct, setCustomerPct] = useState(50)
  const [bakerPct, setBakerPct] = useState(50)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const valid =
    decision !== '' &&
    notes.trim().length >= 20 &&
    (decision !== 'split' || customerPct + bakerPct === 100)

  async function confirm() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/disputes/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: dispute.id,
          decision,
          notes,
          customer_pct: customerPct,
          baker_pct: bakerPct,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Unknown error'); setSaving(false); return }
      onResolved(dispute.id)
      onClose()
    } catch (e: any) {
      setError(e.message)
      setSaving(false)
    }
  }

  const OPTIONS = [
    { value: 'customer', label: 'Rule in favor of Customer', desc: 'Full refund issued. Dispute draw from baker reserve.' },
    { value: 'baker', label: 'Rule in favor of Baker', desc: 'Payout released to baker. No refund.' },
    { value: 'split', label: 'Split Decision', desc: 'Partial refund to customer, partial payout to baker.' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-lg rounded-2xl shadow-2xl overflow-y-auto" style={{ backgroundColor: 'white', maxHeight: '90vh' }}>
        <div className="p-6 border-b" style={{ borderColor: '#e0d5cc' }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-bold text-lg" style={{ fontFamily: 'Georgia, serif', color: '#2d1a0e' }}>Resolve Dispute</p>
              <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>Order {dispute.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <button type="button" onClick={onClose} className="text-sm px-2 py-1 rounded-lg border" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>Close</button>
          </div>
        </div>

        <div className="p-6 flex flex-col gap-5">
          {/* Order summary */}
          <div className="rounded-xl p-4" style={{ backgroundColor: '#f5f0eb' }}>
            <p className="text-xs font-bold mb-2" style={{ color: '#2d1a0e' }}>Order Summary</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs" style={{ color: '#5c3d2e' }}>
              <span><strong>Baker:</strong> {dispute.baker_name}</span>
              <span><strong>Customer:</strong> {dispute.customer_name}</span>
              <span><strong>Amount:</strong> {fmt$(dispute.amount_total)}</span>
              <span><strong>Filed:</strong> {new Date(dispute.dispute_filed_at).toLocaleDateString()}</span>
              <span className="col-span-2"><strong>Reason:</strong> {dispute.dispute_reason}</span>
              {dispute.dispute_description && (
                <span className="col-span-2"><strong>Description:</strong> {dispute.dispute_description}</span>
              )}
            </div>
          </div>

          {/* Decision */}
          <div>
            <p className="text-xs font-bold mb-2" style={{ color: '#2d1a0e' }}>Decision <span style={{ color: '#dc2626' }}>*</span></p>
            <div className="flex flex-col gap-2">
              {OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDecision(opt.value)}
                  className="flex items-start gap-3 p-3 rounded-xl text-left border transition-colors"
                  style={{
                    borderColor: decision === opt.value ? '#2d1a0e' : '#e0d5cc',
                    backgroundColor: decision === opt.value ? '#2d1a0e' : '#faf8f6',
                  }}
                >
                  <div className="w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5" style={{ borderColor: decision === opt.value ? 'white' : '#e0d5cc', backgroundColor: decision === opt.value ? 'white' : 'transparent' }} />
                  <div>
                    <p className="text-xs font-semibold" style={{ color: decision === opt.value ? 'white' : '#2d1a0e' }}>{opt.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: decision === opt.value ? '#e0d5cc' : '#5c3d2e' }}>{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Split inputs */}
          {decision === 'split' && (
            <div className="p-3 rounded-xl" style={{ backgroundColor: '#fef9c3' }}>
              <p className="text-xs font-bold mb-2" style={{ color: '#854d0e' }}>Split Percentages (must total 100)</p>
              <div className="flex gap-4 items-center">
                <label className="flex items-center gap-2 text-xs" style={{ color: '#2d1a0e' }}>
                  Customer %
                  <input
                    type="number" min={0} max={100}
                    value={customerPct}
                    onChange={e => { const v = parseInt(e.target.value) || 0; setCustomerPct(v); setBakerPct(100 - v) }}
                    className="w-16 px-2 py-1 rounded-lg border text-xs"
                    style={{ borderColor: '#e0d5cc', color: '#2d1a0e' }}
                  />
                </label>
                <label className="flex items-center gap-2 text-xs" style={{ color: '#2d1a0e' }}>
                  Baker %
                  <input
                    type="number" min={0} max={100}
                    value={bakerPct}
                    onChange={e => { const v = parseInt(e.target.value) || 0; setBakerPct(v); setCustomerPct(100 - v) }}
                    className="w-16 px-2 py-1 rounded-lg border text-xs"
                    style={{ borderColor: '#e0d5cc', color: '#2d1a0e' }}
                  />
                </label>
                {customerPct + bakerPct !== 100 && (
                  <span className="text-xs font-semibold" style={{ color: '#dc2626' }}>Must total 100</span>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: '#2d1a0e' }}>
              Resolution notes (required — this is logged permanently and shared with both parties) <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={4}
              placeholder="Minimum 20 characters. Explain your reasoning clearly — both parties will receive this."
              className="w-full px-3 py-2.5 rounded-xl border text-xs resize-none"
              style={{ borderColor: notes.length > 0 && notes.trim().length < 20 ? '#dc2626' : '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }}
            />
            <p className="text-xs mt-1" style={{ color: notes.trim().length >= 20 ? '#166534' : '#9c7b6b' }}>
              {notes.trim().length} / 20 min characters
            </p>
          </div>

          {error && <p className="text-xs font-semibold" style={{ color: '#dc2626' }}>{error}</p>}

          <button
            type="button"
            onClick={confirm}
            disabled={!valid || saving}
            className="w-full py-3 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-40"
            style={{ backgroundColor: '#2d1a0e' }}
          >
            {saving ? 'Processing...' : 'Confirm Resolution'}
          </button>
          <p className="text-xs text-center" style={{ color: '#9c7b6b' }}>
            This action triggers Stripe money movement and sends emails to both parties.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Reversal Modal ───────────────────────────────────────────────────────────

function ReversalModal({ dispute, onClose, onReversed }: {
  dispute: Dispute
  onClose: () => void
  onReversed: (orderId: string) => void
}) {
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [flags, setFlags] = useState<string[]>([])

  const valid = reason.trim().length >= 20

  async function confirm() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/disputes/reverse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: dispute.id, reversal_reason: reason }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Unknown error'); setSaving(false); return }
      if (data.flags?.length) { setFlags(data.flags); setSaving(false); return }
      onReversed(dispute.id)
      onClose()
    } catch (e: any) {
      setError(e.message)
      setSaving(false)
    }
  }

  if (flags.length) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="w-full max-w-md rounded-2xl shadow-2xl p-6" style={{ backgroundColor: 'white' }}>
          <p className="font-bold text-lg mb-3" style={{ color: '#2d1a0e' }}>Reversal Partially Complete</p>
          <p className="text-xs mb-3" style={{ color: '#5c3d2e' }}>The dispute has been re-opened. However, the following require manual action:</p>
          <div className="rounded-xl p-3 mb-4" style={{ backgroundColor: '#fef2f2' }}>
            {flags.map((f, i) => <p key={i} className="text-xs mb-1" style={{ color: '#991b1b' }}>{f}</p>)}
          </div>
          <button type="button" onClick={() => { onReversed(dispute.id); onClose() }} className="w-full py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#2d1a0e' }}>
            Acknowledged — Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl p-6" style={{ backgroundColor: 'white' }}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <p className="font-bold text-lg" style={{ fontFamily: 'Georgia, serif', color: '#2d1a0e' }}>Reverse Decision</p>
          <button type="button" onClick={onClose} className="text-xs px-2 py-1 rounded-lg border" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>Cancel</button>
        </div>

        <div className="rounded-xl p-3 mb-4" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
          <p className="text-xs font-bold mb-1" style={{ color: '#991b1b' }}>Warning</p>
          <p className="text-xs" style={{ color: '#5c3d2e' }}>This will attempt to reverse all money movement and re-open the dispute for a fresh resolution. Stripe refund reversals are not always possible.</p>
        </div>

        <div className="rounded-xl p-3 mb-4" style={{ backgroundColor: '#f5f0eb' }}>
          <p className="text-xs font-bold mb-1" style={{ color: '#2d1a0e' }}>Original Decision</p>
          <p className="text-xs" style={{ color: '#5c3d2e' }}>{dispute.auto_resolved_reason}</p>
          <p className="text-xs mt-1" style={{ color: '#9c7b6b' }}>Resolved at: {dispute.resolved_at ? new Date(dispute.resolved_at).toLocaleString() : '—'}</p>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-bold mb-1" style={{ color: '#2d1a0e' }}>
            Reason for reversal <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            placeholder="Minimum 20 characters. Explain why this decision is being reversed."
            className="w-full px-3 py-2 rounded-xl border text-xs resize-none"
            style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }}
          />
          <p className="text-xs mt-1" style={{ color: '#9c7b6b' }}>{reason.trim().length} / 20 min characters</p>
        </div>

        {error && <p className="text-xs font-semibold mb-3" style={{ color: '#dc2626' }}>{error}</p>}

        <button
          type="button"
          onClick={confirm}
          disabled={!valid || saving}
          className="w-full py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
          style={{ backgroundColor: '#dc2626' }}
        >
          {saving ? 'Reversing...' : 'Confirm Reversal'}
        </button>
      </div>
    </div>
  )
}

// ─── Correction Modal (post-24hr) ─────────────────────────────────────────────

function CorrectionModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-sm rounded-2xl shadow-2xl p-6" style={{ backgroundColor: 'white' }}>
        <p className="font-bold text-lg mb-2" style={{ fontFamily: 'Georgia, serif', color: '#2d1a0e' }}>Reversal Window Closed</p>
        <p className="text-sm mb-4" style={{ color: '#5c3d2e' }}>The 24-hour reversal window for this decision has passed. Automated money movement is no longer possible.</p>
        <p className="text-sm mb-5" style={{ color: '#5c3d2e' }}>To request a correction, contact the platform owner directly at <a href="mailto:support@whiskly.co" className="underline" style={{ color: '#8B4513' }}>support@whiskly.co</a> with the order ID and details.</p>
        <button type="button" onClick={onClose} className="w-full py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#2d1a0e' }}>Close</button>
      </div>
    </div>
  )
}

// ─── Audit Trail ─────────────────────────────────────────────────────────────

function AuditTrail({ dispute }: { dispute: Dispute }) {
  const [open, setOpen] = useState(false)
  const [txs, setTxs] = useState<ReserveTx[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)

  async function load() {
    if (loaded) { setOpen(o => !o); return }
    setLoading(true)
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    const { data } = await supabase
      .from('reserve_transactions')
      .select('*')
      .eq('order_id', dispute.id)
      .order('created_at', { ascending: true })
    setTxs(data || [])
    setLoaded(true)
    setLoading(false)
    setOpen(true)
  }

  return (
    <div className="mt-3">
      <button type="button" onClick={load} className="text-xs font-semibold underline" style={{ color: '#8B4513' }}>
        {loading ? 'Loading...' : open ? 'Hide Audit Trail' : 'Show Audit Trail'}
      </button>
      {open && (
        <div className="mt-3 rounded-xl p-3" style={{ backgroundColor: '#faf8f6', border: '1px solid #e0d5cc' }}>
          <p className="text-xs font-bold mb-2" style={{ color: '#2d1a0e' }}>Audit Trail</p>

          {/* Resolution record */}
          <div className="mb-3 pb-3" style={{ borderBottom: '1px solid #e0d5cc' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: '#5c3d2e' }}>Original Resolution</p>
            <p className="text-xs" style={{ color: '#2d1a0e' }}>{dispute.auto_resolved_reason || '—'}</p>
            {dispute.dispute_notes && <p className="text-xs mt-1" style={{ color: '#5c3d2e' }}>Notes: {dispute.dispute_notes}</p>}
            {dispute.resolved_at && <p className="text-xs mt-1" style={{ color: '#9c7b6b' }}>{new Date(dispute.resolved_at).toLocaleString()}</p>}
          </div>

          {/* Reversal record */}
          {dispute.reversed_by_admin && (
            <div className="mb-3 pb-3" style={{ borderBottom: '1px solid #e0d5cc' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: '#dc2626' }}>Reversal</p>
              <p className="text-xs" style={{ color: '#2d1a0e' }}>Reversed by {dispute.reversed_by_admin}</p>
              {dispute.reversed_at && <p className="text-xs mt-1" style={{ color: '#9c7b6b' }}>{new Date(dispute.reversed_at).toLocaleString()}</p>}
            </div>
          )}

          {/* Reserve transactions */}
          {txs.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: '#5c3d2e' }}>Reserve Transactions</p>
              <div className="flex flex-col gap-1.5">
                {txs.map(tx => (
                  <div key={tx.id} className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold mr-1" style={{ backgroundColor: '#f5f0eb', color: '#5c3d2e' }}>{tx.transaction_type}</span>
                      {tx.notes && <span className="text-xs" style={{ color: '#9c7b6b' }}>{tx.notes}</span>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-semibold" style={{ color: tx.amount > 0 ? '#dc2626' : '#166534' }}>
                        {tx.amount > 0 ? '-' : '+'} ${Math.abs(tx.amount).toFixed(2)}
                      </p>
                      <p className="text-xs" style={{ color: '#9c7b6b' }}>{new Date(tx.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {txs.length === 0 && <p className="text-xs" style={{ color: '#9c7b6b' }}>No reserve transactions found.</p>}
        </div>
      )}
    </div>
  )
}

// ─── Dispute Row ──────────────────────────────────────────────────────────────

function DisputeRow({
  dispute,
  isResolved,
  onResolveClick,
  onReverseClick,
  onCorrectionClick,
}: {
  dispute: Dispute
  isResolved: boolean
  onResolveClick: (d: Dispute) => void
  onReverseClick: (d: Dispute) => void
  onCorrectionClick: (d: Dispute) => void
}) {
  const days = daysOpen(dispute.dispute_filed_at)
  const isRepeatBaker = (dispute.baker_dispute_count ?? 0) >= 2
  const isRepeatCustomer = (dispute.customer_dispute_count ?? 0) >= 2
  const canReverse = dispute.reversal_eligible_until && new Date() < new Date(dispute.reversal_eligible_until)

  const borderColor = isRepeatBaker && isRepeatCustomer
    ? '#dc2626'
    : isRepeatBaker
    ? '#dc2626'
    : isRepeatCustomer
    ? '#f59e0b'
    : '#e0d5cc'

  const [copied, setCopied] = useState(false)

  function copyId() {
    navigator.clipboard.writeText(dispute.id).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div
      className="bg-white rounded-xl p-4 border-l-4 shadow-sm"
      style={{ borderLeftColor: borderColor, border: '1px solid #e0d5cc', borderLeftWidth: 4 }}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        {/* Left: info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <button
              type="button"
              onClick={copyId}
              className="font-mono text-xs px-2 py-0.5 rounded-lg border cursor-pointer"
              style={{ borderColor: '#e0d5cc', color: '#5c3d2e', backgroundColor: '#faf8f6' }}
              title="Click to copy order ID"
            >
              {copied ? 'Copied!' : dispute.id.slice(0, 8).toUpperCase()}
            </button>
            {isRepeatBaker && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>Repeat Baker</span>
            )}
            {isRepeatCustomer && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#fff7ed', color: '#c2410c' }}>Repeat Customer</span>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-0.5 text-xs mt-1" style={{ color: '#5c3d2e' }}>
            <span><strong style={{ color: '#2d1a0e' }}>Baker:</strong> {dispute.baker_name}</span>
            <span><strong style={{ color: '#2d1a0e' }}>Customer:</strong> {dispute.customer_name}</span>
            <span><strong style={{ color: '#2d1a0e' }}>Amount:</strong> {fmt$(dispute.amount_total)}</span>
            <span><strong style={{ color: '#2d1a0e' }}>Reason:</strong> {dispute.dispute_reason || '—'}</span>
            <span><strong style={{ color: '#2d1a0e' }}>Filed:</strong> {new Date(dispute.dispute_filed_at).toLocaleDateString()}</span>
            <span>
              <strong style={{ color: '#2d1a0e' }}>Days open:</strong>{' '}
              <span style={{ color: days > 5 ? '#dc2626' : '#5c3d2e', fontWeight: days > 5 ? 700 : 400 }}>
                {days}
              </span>
            </span>
            {isResolved && dispute.auto_resolved_reason && (
              <span className="col-span-full">
                <strong style={{ color: '#2d1a0e' }}>Decision:</strong> {humanDecision(dispute.auto_resolved_reason)}
              </span>
            )}
            {isResolved && dispute.resolved_by_admin && (
              <span><strong style={{ color: '#2d1a0e' }}>Resolved by:</strong> {dispute.resolved_by_admin}</span>
            )}
            {isResolved && dispute.resolved_at && (
              <span><strong style={{ color: '#2d1a0e' }}>Resolved:</strong> {new Date(dispute.resolved_at).toLocaleDateString()}</span>
            )}
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex gap-2 flex-shrink-0 flex-wrap">
          {!isResolved && (
            <button
              type="button"
              onClick={() => onResolveClick(dispute)}
              className="px-4 py-2 rounded-lg text-xs font-bold text-white"
              style={{ backgroundColor: '#2d1a0e' }}
            >
              Resolve
            </button>
          )}
          {isResolved && canReverse && (
            <button
              type="button"
              onClick={() => onReverseClick(dispute)}
              className="px-4 py-2 rounded-lg text-xs font-bold border"
              style={{ borderColor: '#dc2626', color: '#dc2626' }}
            >
              Reverse Decision
            </button>
          )}
          {isResolved && !canReverse && (
            <button
              type="button"
              onClick={() => onCorrectionClick(dispute)}
              className="px-3 py-2 rounded-lg text-xs font-semibold border"
              style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}
            >
              Request Correction
            </button>
          )}
        </div>
      </div>

      {/* Resolved: notes + audit */}
      {isResolved && (
        <div>
          {dispute.dispute_notes && (
            <div className="mt-3 p-3 rounded-xl text-xs" style={{ backgroundColor: '#f5f0eb', color: '#5c3d2e' }}>
              <strong style={{ color: '#2d1a0e' }}>Resolution Notes:</strong> {dispute.dispute_notes}
            </div>
          )}
          <AuditTrail dispute={dispute} />
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DisputesTab({ activeDisputes, resolvedDisputes, onResolved, onReversed, focusOrderId, onFocusConsumed }: Props) {
  const [tab, setTab] = useState<'active' | 'resolved'>('active')
  const [search, setSearch] = useState('')
  const [reasonFilter, setReasonFilter] = useState('')
  const [sort, setSort] = useState('newest')

  const [resolveTarget, setResolveTarget] = useState<Dispute | null>(null)
  const [reverseTarget, setReverseTarget] = useState<Dispute | null>(null)
  const [correctionTarget, setCorrectionTarget] = useState<Dispute | null>(null)

  // Compute dispute counts per baker and customer
  const allDisputes = useMemo(() => [...activeDisputes, ...resolvedDisputes], [activeDisputes, resolvedDisputes])

  // BUG 1 fix: when overview Resolve button passes a focusOrderId, auto-open that dispute's modal
  useEffect(() => {
    if (!focusOrderId) return
    const match = activeDisputes.find(d => d.id === focusOrderId)
    if (match) {
      setTab('active')
      setResolveTarget(enrichDispute(match, allDisputes))
      onFocusConsumed?.()
    }
  }, [focusOrderId, activeDisputes]) // eslint-disable-line react-hooks/exhaustive-deps

  const source = useMemo(
    () => (tab === 'active' ? activeDisputes : resolvedDisputes).map(d => enrichDispute(d, allDisputes)),
    [tab, activeDisputes, resolvedDisputes, allDisputes],
  )

  const filtered = useMemo(() => {
    let list = source.filter(d => {
      const q = search.toLowerCase()
      if (q && !d.id.toLowerCase().includes(q) && !(d.baker_name ?? '').toLowerCase().includes(q) && !d.customer_name?.toLowerCase().includes(q)) return false
      if (reasonFilter && d.dispute_reason !== reasonFilter) return false
      return true
    })

    list = [...list].sort((a, b) => {
      if (sort === 'newest') return new Date(b.dispute_filed_at).getTime() - new Date(a.dispute_filed_at).getTime()
      if (sort === 'oldest') return new Date(a.dispute_filed_at).getTime() - new Date(b.dispute_filed_at).getTime()
      if (sort === 'amount_desc') return (b.amount_total ?? 0) - (a.amount_total ?? 0)
      if (sort === 'days_open') return daysOpen(b.dispute_filed_at) - daysOpen(a.dispute_filed_at)
      return 0
    })

    return list
  }, [source, search, reasonFilter, sort])

  return (
    <div>
      {resolveTarget && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-3xl rounded-2xl shadow-2xl my-8" style={{ backgroundColor: 'white' }}>
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: '#e0d5cc' }}>
              <p className="font-bold" style={{ fontFamily: 'Georgia, serif', color: '#2d1a0e' }}>
                Resolve Dispute — {resolveTarget.id.slice(0, 8).toUpperCase()}
              </p>
              <button type="button" onClick={() => setResolveTarget(null)} className="text-sm px-2 py-1 rounded-lg border" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>Close</button>
            </div>
            <div className="p-4">
              <DisputeCase
                order={resolveTarget}
                bakers={[]}
                onResolve={(orderId) => { onResolved(orderId); setResolveTarget(null) }}
                onRefund={() => setResolveTarget(null)}
              />
            </div>
          </div>
        </div>
      )}
      {reverseTarget && (
        <ReversalModal
          dispute={reverseTarget}
          onClose={() => setReverseTarget(null)}
          onReversed={(id) => { onReversed(id); setReverseTarget(null) }}
        />
      )}
      {correctionTarget && (
        <CorrectionModal onClose={() => setCorrectionTarget(null)} />
      )}

      <StatsBar active={activeDisputes.map(d => enrichDispute(d, allDisputes))} resolved={resolvedDisputes.map(d => enrichDispute(d, allDisputes))} />

      {/* Tab switcher */}
      <div className="flex gap-2 mb-4">
        {(['active', 'resolved'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="px-4 py-2 rounded-lg text-sm font-semibold capitalize"
            style={{ backgroundColor: tab === t ? '#2d1a0e' : 'white', color: tab === t ? 'white' : '#2d1a0e', border: '1px solid #e0d5cc' }}
          >
            {t === 'active' ? 'Active Disputes' : 'Resolved Disputes'}
            <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: tab === t ? 'rgba(255,255,255,0.2)' : '#f5f0eb', color: tab === t ? 'white' : '#5c3d2e' }}>
              {t === 'active' ? activeDisputes.length : resolvedDisputes.length}
            </span>
          </button>
        ))}
      </div>

      <FilterBar
        search={search} onSearch={setSearch}
        reasonFilter={reasonFilter} onReason={setReasonFilter}
        sort={sort} onSort={setSort}
        disputes={source}
      />

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center" style={{ border: '1px solid #e0d5cc' }}>
          <p className="font-semibold" style={{ color: '#2d1a0e' }}>
            {tab === 'active' ? 'No active disputes' : 'No resolved disputes'}
          </p>
          <p className="text-sm mt-1" style={{ color: '#5c3d2e' }}>
            {search || reasonFilter ? 'Try adjusting your filters.' : tab === 'active' ? 'All orders are in good standing.' : 'No disputes have been resolved yet.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(d => (
            <DisputeRow
              key={d.id}
              dispute={d}
              isResolved={tab === 'resolved'}
              onResolveClick={setResolveTarget}
              onReverseClick={setReverseTarget}
              onCorrectionClick={setCorrectionTarget}
            />
          ))}
        </div>
      )}
    </div>
  )
}
