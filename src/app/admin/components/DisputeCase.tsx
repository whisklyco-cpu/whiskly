'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { EmailModal } from './EmailModal'

export function DisputeCase({ order, bakers, onResolve, onRefund }: { order: any, bakers: any[], onResolve: (orderId: string, outcome: string, strikeBaker: boolean) => void, onRefund: () => void }) {
  const [expandedStep, setExpandedStep] = useState<number | null>(0)
  const [steps, setSteps] = useState<string[]>([])
  const [ruling, setRuling] = useState('')
  const [strikeBaker, setStrikeBaker] = useState(false)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [emailModal, setEmailModal] = useState<{ to: string, subject: string, body: string } | null>(null)
  const [emailCopied, setEmailCopied] = useState<string | null>(null)

  const baker = bakers.find(b => b.id === order.baker_id) || order.bakers

  function copyEmail(text: string, key: string) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
        .then(() => { setEmailCopied(key); setTimeout(() => setEmailCopied(null), 2000) })
        .catch(() => setEmailModal({ to: '', subject: '', body: text }))
    } else {
      const el = document.getElementById('demail-' + key) as HTMLTextAreaElement
      if (el) { el.select(); el.setSelectionRange(0, 99999); try { document.execCommand('copy'); setEmailCopied(key); setTimeout(() => setEmailCopied(null), 2000) } catch { setEmailModal({ to: '', subject: '', body: text }) } }
      else { setEmailModal({ to: '', subject: '', body: text }) }
    }
  }

  const STEPS = [
    { label: 'Review order details and evidence', key: 'review' },
    { label: 'Contact both parties if needed', key: 'contact' },
    { label: 'Make a ruling', key: 'ruling' },
    { label: 'Take action and close dispute', key: 'close' },
  ]

  async function saveNotes() {
    setSaving(true)
    await supabase.from('orders').update({ dispute_notes: notes } as any).eq('id', order.id).then(() => setSaving(false))
  }

  function toggleStep(label: string, next: number) {
    const updated = steps.includes(label) ? steps.filter(s => s !== label) : [...steps, label]
    setSteps(updated)
    if (!steps.includes(label)) setExpandedStep(next < STEPS.length ? next : null)
  }

  const RULING_OPTIONS = [
    { value: 'customer', label: 'Rule for customer — full refund, baker may receive strike' },
    { value: 'baker', label: 'Rule for baker — release payment, no refund' },
    { value: 'partial', label: 'Split — partial refund, negotiate amount' },
    { value: 'noop', label: 'No action needed — unlock order and continue' },
  ]

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

        {/* Step 1 — Review Evidence */}
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: steps.includes(STEPS[0].label) ? '#bbf7d0' : '#e0d5cc' }}>
          <button onClick={() => setExpandedStep(expandedStep === 0 ? null : 0)} className="w-full flex items-center gap-3 p-3 text-left" style={{ backgroundColor: steps.includes(STEPS[0].label) ? '#dcfce7' : '#faf8f6' }}>
            <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ backgroundColor: steps.includes(STEPS[0].label) ? '#166534' : '#e0d5cc', color: 'white' }}>{steps.includes(STEPS[0].label) ? '✓' : '1'}</div>
            <span className="text-xs font-medium flex-1" style={{ color: steps.includes(STEPS[0].label) ? '#166534' : '#2d1a0e', textDecoration: steps.includes(STEPS[0].label) ? 'line-through' : 'none' }}>{STEPS[0].label}</span>
            <span className="text-xs" style={{ color: '#9c7b6b' }}>{expandedStep === 0 ? '▲' : '▼'}</span>
          </button>
          {expandedStep === 0 && (
            <div className="p-4 border-t flex flex-col gap-3" style={{ borderColor: '#e0d5cc', backgroundColor: 'white' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl" style={{ backgroundColor: '#f5f0eb' }}>
                  <p className="text-xs font-bold mb-2" style={{ color: '#2d1a0e' }}>Order Details</p>
                  <p className="text-xs" style={{ color: '#5c3d2e' }}><strong>Customer:</strong> {order.customer_name} · {order.customer_email}</p>
                  <p className="text-xs" style={{ color: '#5c3d2e' }}><strong>Baker:</strong> {order.bakers?.business_name} · {baker?.email}</p>
                  <p className="text-xs" style={{ color: '#5c3d2e' }}><strong>Event:</strong> {order.event_type} on {order.event_date}</p>
                  <p className="text-xs" style={{ color: '#5c3d2e' }}><strong>Budget:</strong> ${order.budget}</p>
                  <p className="text-xs" style={{ color: '#5c3d2e' }}><strong>Fulfillment:</strong> {order.fulfillment_type || 'Not specified'}</p>
                  {order.item_description && <p className="text-xs mt-1" style={{ color: '#5c3d2e' }}><strong>Description:</strong> {order.item_description}</p>}
                  {order.allergen_notes && <p className="text-xs mt-1" style={{ color: '#5c3d2e' }}><strong>Allergens:</strong> {order.allergen_notes}</p>}
                </div>
                <div className="p-3 rounded-xl" style={{ backgroundColor: '#f5f0eb' }}>
                  <p className="text-xs font-bold mb-2" style={{ color: '#2d1a0e' }}>Payment Status</p>
                  <p className="text-xs" style={{ color: order.deposit_paid_at ? '#166534' : '#991b1b' }}>Deposit: {order.deposit_paid_at ? 'Paid on ' + new Date(order.deposit_paid_at).toLocaleDateString() : 'Not paid'}</p>
                  <p className="text-xs" style={{ color: order.remainder_paid_at ? '#166534' : '#854d0e' }}>Remainder: {order.remainder_paid_at ? 'Paid on ' + new Date(order.remainder_paid_at).toLocaleDateString() : 'Not paid'}</p>
                  {order.delivery_proof_url && (
                    <div className="mt-2">
                      <p className="text-xs font-bold mb-1" style={{ color: '#2d1a0e' }}>Delivery Photo</p>
                      <a href={order.delivery_proof_url} target="_blank" rel="noopener noreferrer">
                        <img src={order.delivery_proof_url} alt="Delivery proof" className="w-full h-24 object-cover rounded-lg" />
                      </a>
                    </div>
                  )}
                  {order.handoff_photo_url && (
                    <div className="mt-2">
                      <p className="text-xs font-bold mb-1" style={{ color: '#2d1a0e' }}>Handoff Photo</p>
                      <a href={order.handoff_photo_url} target="_blank" rel="noopener noreferrer">
                        <img src={order.handoff_photo_url} alt="Handoff proof" className="w-full h-24 object-cover rounded-lg" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
              {order.inspiration_photo_urls?.length > 0 && (
                <div className="p-3 rounded-xl" style={{ backgroundColor: '#f5f0eb' }}>
                  <p className="text-xs font-bold mb-2" style={{ color: '#2d1a0e' }}>Inspiration Photos (what customer requested)</p>
                  <div className="flex gap-2 flex-wrap">
                    {order.inspiration_photo_urls.map((url: string, i: number) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt={'Inspiration ' + (i+1)} className="w-20 h-20 object-cover rounded-lg border" style={{ borderColor: '#e0d5cc' }} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#fef9c3' }}>
                <p className="text-xs font-bold mb-1" style={{ color: '#854d0e' }}>What to look for</p>
                <p className="text-xs" style={{ color: '#5c3d2e' }}>Does the delivery photo match the order description and inspiration photos? Was the order delivered? Was it on time? Is there any communication in messages that supports either side?</p>
              </div>
              <button onClick={() => toggleStep(STEPS[0].label, 1)} className="px-4 py-2 rounded-lg text-xs font-semibold text-white self-start" style={{ backgroundColor: '#166534' }}>Mark Done — Evidence Reviewed</button>
            </div>
          )}
        </div>

        {/* Step 2 — Contact Parties */}
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: steps.includes(STEPS[1].label) ? '#bbf7d0' : '#e0d5cc' }}>
          <button onClick={() => setExpandedStep(expandedStep === 1 ? null : 1)} className="w-full flex items-center gap-3 p-3 text-left" style={{ backgroundColor: steps.includes(STEPS[1].label) ? '#dcfce7' : '#faf8f6' }}>
            <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ backgroundColor: steps.includes(STEPS[1].label) ? '#166534' : '#e0d5cc', color: 'white' }}>{steps.includes(STEPS[1].label) ? '✓' : '2'}</div>
            <span className="text-xs font-medium flex-1" style={{ color: steps.includes(STEPS[1].label) ? '#166534' : '#2d1a0e', textDecoration: steps.includes(STEPS[1].label) ? 'line-through' : 'none' }}>{STEPS[1].label}</span>
            <span className="text-xs" style={{ color: '#9c7b6b' }}>{expandedStep === 1 ? '▲' : '▼'}</span>
          </button>
          {expandedStep === 1 && (
            <div className="p-4 border-t flex flex-col gap-3" style={{ borderColor: '#e0d5cc', backgroundColor: 'white' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl" style={{ backgroundColor: '#f5f0eb' }}>
                  <p className="text-xs font-bold mb-2" style={{ color: '#2d1a0e' }}>Contact Customer</p>
                  <p className="text-xs mb-2" style={{ color: '#5c3d2e' }}>{order.customer_name} · {order.customer_email}</p>
                  <a href={'mailto:' + order.customer_email + '?subject=' + encodeURIComponent('Whiskly Dispute Update — Order ' + order.id.slice(0,8)) + '&body=' + encodeURIComponent('Hi ' + order.customer_name + ',\n\nWe are reviewing your dispute for your ' + order.event_type + ' order with ' + order.bakers?.business_name + '. We may have a few questions as we investigate.\n\nCould you please share any additional details about your concern?\n\nWhiskly Support\nsupport@whiskly.co')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white inline-block" style={{ backgroundColor: '#2d1a0e' }}>
                    Email Customer
                  </a>
                </div>
                <div className="p-3 rounded-xl" style={{ backgroundColor: '#f5f0eb' }}>
                  <p className="text-xs font-bold mb-2" style={{ color: '#2d1a0e' }}>Contact Baker</p>
                  <p className="text-xs mb-2" style={{ color: '#5c3d2e' }}>{order.bakers?.business_name} · {baker?.email}</p>
                  <a href={'mailto:' + baker?.email + '?subject=' + encodeURIComponent('Whiskly Dispute — Order ' + order.id.slice(0,8)) + '&body=' + encodeURIComponent('Hi ' + order.bakers?.business_name + ',\n\nWe have received a dispute on order ' + order.id.slice(0,8) + ' for a ' + order.event_type + ' on ' + order.event_date + '. We are reviewing the situation and may have a few questions.\n\nCould you please share your side of the situation?\n\nWhiskly Support\nsupport@whiskly.co')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white inline-block" style={{ backgroundColor: '#8B4513' }}>
                    Email Baker
                  </a>
                </div>
              </div>
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#fef9c3' }}>
                <p className="text-xs font-bold mb-1" style={{ color: '#854d0e' }}>This step is optional</p>
                <p className="text-xs" style={{ color: '#5c3d2e' }}>Only contact parties if the evidence is unclear. For straightforward cases (no delivery photo, clear no-show, etc.) you can skip directly to making a ruling.</p>
              </div>
              <button onClick={() => toggleStep(STEPS[1].label, 2)} className="px-4 py-2 rounded-lg text-xs font-semibold text-white self-start" style={{ backgroundColor: '#166534' }}>Mark Done — Parties Contacted</button>
            </div>
          )}
        </div>

        {/* Step 3 — Make Ruling */}
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: steps.includes(STEPS[2].label) ? '#bbf7d0' : '#e0d5cc' }}>
          <button onClick={() => setExpandedStep(expandedStep === 2 ? null : 2)} className="w-full flex items-center gap-3 p-3 text-left" style={{ backgroundColor: steps.includes(STEPS[2].label) ? '#dcfce7' : '#faf8f6' }}>
            <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ backgroundColor: steps.includes(STEPS[2].label) ? '#166534' : '#e0d5cc', color: 'white' }}>{steps.includes(STEPS[2].label) ? '✓' : '3'}</div>
            <span className="text-xs font-medium flex-1" style={{ color: steps.includes(STEPS[2].label) ? '#166534' : '#2d1a0e', textDecoration: steps.includes(STEPS[2].label) ? 'line-through' : 'none' }}>{STEPS[2].label}</span>
            <span className="text-xs" style={{ color: '#9c7b6b' }}>{expandedStep === 2 ? '▲' : '▼'}</span>
          </button>
          {expandedStep === 2 && (
            <div className="p-4 border-t flex flex-col gap-3" style={{ borderColor: '#e0d5cc', backgroundColor: 'white' }}>
              <div className="flex flex-col gap-2">
                {RULING_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setRuling(opt.value)}
                    className="flex items-center gap-3 p-3 rounded-xl text-left border"
                    style={{ borderColor: ruling === opt.value ? '#2d1a0e' : '#e0d5cc', backgroundColor: ruling === opt.value ? '#2d1a0e' : '#faf8f6' }}>
                    <div className="w-4 h-4 rounded-full border-2 flex-shrink-0" style={{ borderColor: ruling === opt.value ? 'white' : '#e0d5cc', backgroundColor: ruling === opt.value ? 'white' : 'transparent' }} />
                    <span className="text-xs font-medium" style={{ color: ruling === opt.value ? 'white' : '#2d1a0e' }}>{opt.label}</span>
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
                  <p className="text-xs" style={{ color: '#5c3d2e' }}>The order will be marked complete. No refund issued. Payment already released to baker via Stripe Connect.</p>
                </div>
              )}
              {ruling === 'partial' && (
                <div className="p-3 rounded-xl" style={{ backgroundColor: '#fef9c3' }}>
                  <p className="text-xs font-bold mb-1" style={{ color: '#854d0e' }}>Split ruling</p>
                  <p className="text-xs" style={{ color: '#5c3d2e' }}>Issue a partial refund manually in Stripe dashboard, then mark resolved here. Note the amount in your internal notes.</p>
                </div>
              )}
              {ruling === 'noop' && (
                <div className="p-3 rounded-xl" style={{ backgroundColor: '#dbeafe' }}>
                  <p className="text-xs font-bold mb-1" style={{ color: '#1e40af' }}>No action needed</p>
                  <p className="text-xs" style={{ color: '#5c3d2e' }}>The dispute flag will be removed and the order will be unlocked for both parties to continue.</p>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: '#2d1a0e' }}>Internal Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} onBlur={saveNotes} rows={3}
                  placeholder="e.g. No delivery photo found. Baker could not confirm delivery. Customer claims order never arrived. Ruled for customer."
                  className="w-full px-3 py-2 rounded-xl border text-xs resize-none"
                  style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
                {saving && <p className="text-xs mt-1" style={{ color: '#5c3d2e' }}>Saving...</p>}
              </div>
              <button onClick={() => ruling && notes.trim().length > 10 && toggleStep(STEPS[2].label, 3)}
                disabled={!ruling || notes.trim().length <= 10}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white self-start"
                style={{ backgroundColor: '#166534', opacity: (!ruling || notes.trim().length <= 10) ? 0.4 : 1 }}>
                {!ruling ? 'Select a ruling first' : notes.trim().length <= 10 ? 'Add notes before continuing' : 'Mark Done — Ruling Made'}
              </button>
            </div>
          )}
        </div>

        {/* Step 4 — Take Action */}
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: steps.includes(STEPS[3].label) ? '#bbf7d0' : '#e0d5cc' }}>
          <button onClick={() => setExpandedStep(expandedStep === 3 ? null : 3)} className="w-full flex items-center gap-3 p-3 text-left" style={{ backgroundColor: steps.includes(STEPS[3].label) ? '#dcfce7' : '#faf8f6' }}>
            <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ backgroundColor: steps.includes(STEPS[3].label) ? '#166534' : '#e0d5cc', color: 'white' }}>{steps.includes(STEPS[3].label) ? '✓' : '4'}</div>
            <span className="text-xs font-medium flex-1" style={{ color: steps.includes(STEPS[3].label) ? '#166534' : '#2d1a0e', textDecoration: steps.includes(STEPS[3].label) ? 'line-through' : 'none' }}>{STEPS[3].label}</span>
            <span className="text-xs" style={{ color: '#9c7b6b' }}>{expandedStep === 3 ? '▲' : '▼'}</span>
          </button>
          {expandedStep === 3 && (
            <div className="p-4 border-t flex flex-col gap-3" style={{ borderColor: '#e0d5cc', backgroundColor: 'white' }}>
              {!ruling && <p className="text-xs font-semibold" style={{ color: '#854d0e' }}>Complete the ruling step first.</p>}
              {ruling && (
                <>
                  <div className="p-3 rounded-xl" style={{ backgroundColor: '#f5f0eb' }}>
                    <p className="text-xs font-bold mb-1" style={{ color: '#2d1a0e' }}>Actions to take for this ruling:</p>
                    {ruling === 'customer' && <p className="text-xs" style={{ color: '#5c3d2e' }}>1. Click Issue Refund below. 2. Email customer confirming refund. 3. Email baker with decision. 4. Click Close Dispute.</p>}
                    {ruling === 'baker' && <p className="text-xs" style={{ color: '#5c3d2e' }}>1. Email customer with decision. 2. Email baker confirming ruling. 3. Click Close Dispute.</p>}
                    {ruling === 'partial' && <p className="text-xs" style={{ color: '#5c3d2e' }}>1. Issue partial refund in Stripe dashboard manually. 2. Email both parties with decision and refund amount. 3. Click Close Dispute.</p>}
                    {ruling === 'noop' && <p className="text-xs" style={{ color: '#5c3d2e' }}>1. Email both parties that the dispute has been reviewed and no action was needed. 2. Click Close Dispute.</p>}
                  </div>
                  {(() => {
                    const custSubject = 'Whiskly Dispute Resolution — Order ' + order.id.slice(0,8)
                    const bakerSubject = 'Whiskly Dispute Resolution — Order ' + order.id.slice(0,8)
                    const customerBody = ruling === 'customer'
                      ? 'Hi ' + order.customer_name + ',\n\nWe have completed our review of your dispute for order ' + order.id.slice(0,8) + '. We are ruling in your favor and a full refund has been issued. Please allow 5-10 business days.\n\nWhiskly Support\nsupport@whiskly.co'
                      : ruling === 'baker'
                      ? 'Hi ' + order.customer_name + ',\n\nWe have completed our review of your dispute for order ' + order.id.slice(0,8) + '. After reviewing the evidence we are unable to issue a refund at this time. If you have further questions please reply to this email.\n\nWhiskly Support\nsupport@whiskly.co'
                      : 'Hi ' + order.customer_name + ',\n\nWe have completed our review of your dispute for order ' + order.id.slice(0,8) + '. We have made a decision and will be in touch shortly.\n\nWhiskly Support\nsupport@whiskly.co'
                    const bakerBody = ruling === 'customer'
                      ? 'Hi ' + order.bakers?.business_name + ",\n\nWe have completed our review of the dispute on order " + order.id.slice(0,8) + ". We ruled in the customer's favor and issued a refund. If you believe this is incorrect please reply within 7 days.\n\nWhiskly Support\nsupport@whiskly.co"
                      : ruling === 'baker'
                      ? 'Hi ' + order.bakers?.business_name + ',\n\nWe have completed our review of the dispute on order ' + order.id.slice(0,8) + '. We have ruled in your favor.\n\nWhiskly Support\nsupport@whiskly.co'
                      : 'Hi ' + order.bakers?.business_name + ',\n\nWe have completed our review of the dispute on order ' + order.id.slice(0,8) + '. We have made a decision and will be in touch shortly.\n\nWhiskly Support\nsupport@whiskly.co'
                    return (
                      <div className="flex flex-col gap-3">
                        {(ruling === 'customer') && order.deposit_paid_at && (
                          <button onClick={onRefund} className="px-4 py-2 rounded-lg text-xs font-semibold border self-start" style={{ borderColor: '#dc2626', color: '#dc2626' }}>Issue Refund via Stripe</button>
                        )}
                        <div className="p-3 rounded-xl" style={{ backgroundColor: '#f5f0eb' }}>
                          <p className="text-xs font-bold mb-2" style={{ color: '#2d1a0e' }}>Email customer ({order.customer_email}):</p>
                          <textarea id="demail-customer" readOnly value={customerBody} rows={4} onFocus={e => e.target.select()} className="w-full px-3 py-2 rounded-lg border text-xs resize-none mb-2" style={{ borderColor: '#e0d5cc', color: '#5c3d2e', backgroundColor: 'white', fontFamily: 'inherit' }} />
                          <div className="flex gap-2 flex-wrap">
                            <a href={'mailto:' + order.customer_email + '?subject=' + encodeURIComponent(custSubject) + '&body=' + encodeURIComponent(customerBody)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: '#2d1a0e' }}>Open in Email</a>
                            <button onClick={() => copyEmail(customerBody, 'customer')} className="px-3 py-1.5 rounded-lg text-xs font-semibold border" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>{emailCopied === 'customer' ? '✓ Copied!' : 'Copy Text'}</button>
                            <button onClick={() => setEmailModal({ to: order.customer_email, subject: custSubject, body: customerBody })} className="px-3 py-1.5 rounded-lg text-xs font-semibold border" style={{ borderColor: '#2d1a0e', color: '#2d1a0e' }}>View Full</button>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl" style={{ backgroundColor: '#f5f0eb' }}>
                          <p className="text-xs font-bold mb-2" style={{ color: '#2d1a0e' }}>Email baker ({baker?.email}):</p>
                          <textarea id="demail-baker" readOnly value={bakerBody} rows={4} onFocus={e => e.target.select()} className="w-full px-3 py-2 rounded-lg border text-xs resize-none mb-2" style={{ borderColor: '#e0d5cc', color: '#5c3d2e', backgroundColor: 'white', fontFamily: 'inherit' }} />
                          <div className="flex gap-2 flex-wrap">
                            <a href={'mailto:' + baker?.email + '?subject=' + encodeURIComponent(bakerSubject) + '&body=' + encodeURIComponent(bakerBody)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border" style={{ borderColor: '#8B4513', color: '#8B4513' }}>Open in Email</a>
                            <button onClick={() => copyEmail(bakerBody, 'baker')} className="px-3 py-1.5 rounded-lg text-xs font-semibold border" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>{emailCopied === 'baker' ? '✓ Copied!' : 'Copy Text'}</button>
                            <button onClick={() => setEmailModal({ to: baker?.email || '', subject: bakerSubject, body: bakerBody })} className="px-3 py-1.5 rounded-lg text-xs font-semibold border" style={{ borderColor: '#8B4513', color: '#8B4513' }}>View Full</button>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                  <button onClick={() => {
                    toggleStep(STEPS[3].label, 4)
                    onResolve(order.id, ruling === 'customer' ? 'refund' : 'complete', strikeBaker)
                  }} className="px-5 py-2 rounded-lg text-xs font-semibold text-white self-start" style={{ backgroundColor: '#166534' }}>
                    Close Dispute
                  </button>
                </>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
    </>
  )
}
