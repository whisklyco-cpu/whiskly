'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { EmailModal } from './EmailModal'

export function EmergencyCase({ emergencyCase: ec, bakers, orders, onResolve }: { emergencyCase: any, bakers: any[], orders: any[], onResolve: (id: string, resolution: string) => void }) {
  const [steps, setSteps] = useState<string[]>(ec.steps_completed || [])
  const [expandedStep, setExpandedStep] = useState<number | null>(0)
  const [notes, setNotes] = useState(ec.notes || '')
  const [resolution, setResolution] = useState('')
  const [saving, setSaving] = useState(false)
  const [viewedOrders, setViewedOrders] = useState<Set<string>>(new Set())
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [notifiedCritical, setNotifiedCritical] = useState<Set<string>>(new Set())
  const [notifiedOthers, setNotifiedOthers] = useState<Set<string>>(new Set())
  const [orderOutcomes, setOrderOutcomes] = useState<Record<string, string>>({})
  const [orderOutcomesSent, setOrderOutcomesSent] = useState<Set<string>>(new Set())
  const [processingRefund, setProcessingRefund] = useState<string | null>(null)
  const [emailCopied, setEmailCopied] = useState<string | null>(null)
  const [emailModal, setEmailModal] = useState<{ subject: string, body: string, to: string } | null>(null)

  const baker = bakers.find(b => b.id === ec.baker_id) || ec.bakers
  const affectedOrders = orders.filter(o => o.baker_id === ec.baker_id && ['pending','confirmed','in_progress'].includes(o.status))
  const criticalOrders = affectedOrders.filter(o => { const [y,m,d] = o.event_date.split('-').map(Number); const days = Math.round((new Date(y,m-1,d).getTime() - Date.now()) / 86400000); return days <= 3 && days >= 0 })
  const nonCriticalOrders = affectedOrders.filter(o => { const [y,m,d] = o.event_date.split('-').map(Number); const days = Math.round((new Date(y,m-1,d).getTime() - Date.now()) / 86400000); return days > 3 })
  const hoursOpen = Math.floor((Date.now() - new Date(ec.created_at).getTime()) / 3600000)

  const STEPS = [
    { label: 'Contact baker by email or phone', key: 'contact_baker' },
    { label: 'Assess all affected orders', key: 'assess_orders' },
    { label: 'Notify critical orders (event within 72hrs)', key: 'notify_critical' },
    { label: 'Notify all other affected customers', key: 'notify_others' },
    { label: 'Decide outcome for each order', key: 'decide_outcomes' },
    { label: 'Log resolution notes and close case', key: 'log_notes' },
  ]

  function getDaysUntil(dateStr: string) {
    const [y,m,d] = dateStr.split('-').map(Number)
    return Math.round((new Date(y,m-1,d).getTime() - Date.now()) / 86400000)
  }

  function customerEmailText(order: any, isUrgent: boolean) {
    return 'Hi ' + order.customer_name + ',\n\nWe want to reach out about your upcoming ' + order.event_type + ' order with ' + baker?.business_name + '. Your baker has had an unexpected situation come up and we are personally reviewing your order to make sure everything is taken care of.\n\n' + (isUrgent ? 'We see your event is very soon. Please reply to this email immediately and we will prioritize your case.\n\n' : 'We will be in touch within 24 hours with an update.\n\n') + 'We are sorry for any concern this causes.\n\nWhiskly Support\nsupport@whiskly.co'
  }

  function outcomeEmailText(order: any, outcome: string) {
    if (outcome === 'hold') return 'Hi ' + order.customer_name + ',\n\nWe have reviewed your order for your ' + order.event_type + ' with ' + baker?.business_name + '. Your baker expects to return soon and your order is being held. We will follow up as soon as we have a confirmed update.\n\nWhiskly Support\nsupport@whiskly.co'
    if (outcome === 'refund') return 'Hi ' + order.customer_name + ',\n\nWe have reviewed your order for your ' + order.event_type + ' with ' + baker?.business_name + '. Due to the circumstances we have issued a full refund to your original payment method. Please allow 5-10 business days.\n\nWe are sorry for the inconvenience.\n\nWhiskly Support\nsupport@whiskly.co'
    if (outcome === 'replacement') return 'Hi ' + order.customer_name + ',\n\nWe have reviewed your order for your ' + order.event_type + ' with ' + baker?.business_name + '. We are actively looking for a replacement baker in your area and will be in touch shortly with options.\n\nWhiskly Support\nsupport@whiskly.co'
    return ''
  }

  function bakerOutcomeEmailText(outcomes: Record<string, string>) {
    const lines = affectedOrders.map(o => {
      const outcome = outcomes[o.id]
      const label = outcome === 'hold' ? 'On hold — awaiting your return' : outcome === 'refund' ? 'Refunded to customer' : outcome === 'replacement' ? 'Finding replacement baker' : 'Pending'
      return '- ' + o.customer_name + ' (' + o.event_type + ', ' + o.event_date + '): ' + label
    }).join('\n')
    return 'Hi ' + baker?.business_name + ',\n\nWe wanted to let you know how we have handled your affected orders during your emergency pause:\n\n' + lines + '\n\nPlease reach out to support@whiskly.co when you are ready to return or if you have any questions.\n\nWhiskly Support\nsupport@whiskly.co'
  }

  async function markStep(label: string, next: number) {
    const updated = [...steps, label]
    setSteps(updated)
    await supabase.from('emergency_cases').update({ steps_completed: updated }).eq('id', ec.id)
    setExpandedStep(next < STEPS.length ? next : null)
  }

  async function saveNotes() {
    setSaving(true)
    await supabase.from('emergency_cases').update({ notes }).eq('id', ec.id)
    setSaving(false)
  }

  async function triggerRefund(order: any) {
    setProcessingRefund(order.id)
    const res = await fetch('/api/stripe/refund', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_id: order.id }) })
    const data = await res.json()
    setProcessingRefund(null)
    if (data.error) { alert('Refund error: ' + data.error); return }
    alert('Refund issued for ' + order.customer_name)
  }

  function copyEmail(text: string, key: string) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
        .then(() => { setEmailCopied(key); setTimeout(() => setEmailCopied(null), 2000) })
        .catch(() => fallbackCopy(text, key))
    } else {
      fallbackCopy(text, key)
    }
  }

  function fallbackCopy(text: string, key: string) {
    const el = document.getElementById('email-' + key) as HTMLTextAreaElement
    if (el) {
      el.select()
      el.setSelectionRange(0, 99999)
      try { document.execCommand('copy'); setEmailCopied(key); setTimeout(() => setEmailCopied(null), 2000) }
      catch { setEmailModal({ to: '', subject: '', body: text }) }
    } else {
      setEmailModal({ to: '', subject: '', body: text })
    }
  }

  const allOrdersViewed = affectedOrders.length === 0 || affectedOrders.every(o => viewedOrders.has(o.id))
  const allCriticalNotified = criticalOrders.length === 0 || criticalOrders.every(o => notifiedCritical.has(o.id))
  const allOthersNotified = nonCriticalOrders.length === 0 || nonCriticalOrders.every(o => notifiedOthers.has(o.id))
  const allOutcomesDecided = affectedOrders.length === 0 || affectedOrders.every(o => orderOutcomes[o.id])
  const allOutcomeEmailsSent = affectedOrders.length === 0 || affectedOrders.every(o => orderOutcomesSent.has(o.id))

  const replacementBakers = bakers.filter(b => b.id !== ec.baker_id && b.is_active && !b.is_suspended && !b.is_on_vacation && !b.is_at_capacity && !b.is_emergency_pause && b.city?.toLowerCase() === baker?.city?.toLowerCase())

  return (
    <>
    <EmailModal emailModal={emailModal} onClose={() => setEmailModal(null)} />

    <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4" style={{ borderColor: '#dc2626' }}>

      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="font-bold text-lg" style={{ color: '#2d1a0e' }}>Emergency — {baker?.business_name}</p>
            {hoursOpen >= 24 && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: '#dc2626', color: 'white' }}>OVERDUE {hoursOpen}hrs</span>}
            {hoursOpen < 24 && hoursOpen >= 4 && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: '#f59e0b', color: 'white' }}>{hoursOpen}hrs open</span>}
            {criticalOrders.length > 0 && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: '#dc2626', color: 'white' }}>{criticalOrders.length} CRITICAL</span>}
          </div>
          <p className="text-xs" style={{ color: '#5c3d2e' }}>Opened {new Date(ec.created_at).toLocaleString()} · {baker?.city}, {baker?.state} · {baker?.email}</p>
        </div>
        <span className="text-xs px-3 py-1.5 rounded-lg font-semibold flex-shrink-0" style={{ backgroundColor: '#f5f0eb', color: '#5c3d2e' }}>{steps.length}/{STEPS.length} steps done</span>
      </div>

      <div className="flex flex-col gap-2 mb-5">

        {/* STEP 1 — Contact Baker */}
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: steps.includes(STEPS[0].label) ? '#bbf7d0' : '#e0d5cc' }}>
          <button onClick={() => setExpandedStep(expandedStep === 0 ? null : 0)} className="w-full flex items-center gap-3 p-3 text-left" style={{ backgroundColor: steps.includes(STEPS[0].label) ? '#dcfce7' : '#faf8f6' }}>
            <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ backgroundColor: steps.includes(STEPS[0].label) ? '#166534' : '#e0d5cc', color: 'white' }}>{steps.includes(STEPS[0].label) ? '✓' : '1'}</div>
            <span className="text-xs font-medium flex-1" style={{ color: steps.includes(STEPS[0].label) ? '#166534' : '#2d1a0e', textDecoration: steps.includes(STEPS[0].label) ? 'line-through' : 'none' }}>{STEPS[0].label}</span>
            <span className="text-xs" style={{ color: '#9c7b6b' }}>{expandedStep === 0 ? '▲' : '▼'}</span>
          </button>
          {expandedStep === 0 && (
            <div className="p-4 border-t flex flex-col gap-3" style={{ borderColor: '#e0d5cc', backgroundColor: 'white' }}>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl" style={{ backgroundColor: '#f5f0eb' }}>
                  <p className="text-xs font-bold mb-1" style={{ color: '#2d1a0e' }}>Baker Contact Info</p>
                  <p className="text-xs font-semibold" style={{ color: '#2d1a0e' }}>{baker?.business_name}</p>
                  <p className="text-xs" style={{ color: '#5c3d2e' }}>{baker?.email}</p>
                  {baker?.phone && <p className="text-xs" style={{ color: '#5c3d2e' }}>{baker.phone}</p>}
                  <p className="text-xs" style={{ color: '#5c3d2e' }}>{baker?.city}, {baker?.state}</p>
                </div>
                <div className="p-3 rounded-xl" style={{ backgroundColor: '#f5f0eb' }}>
                  <p className="text-xs font-bold mb-1" style={{ color: '#2d1a0e' }}>What to ask</p>
                  <p className="text-xs" style={{ color: '#5c3d2e' }}>What happened? What is your timeline? Can you still fulfill any orders?</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <a href={'mailto:' + baker?.email + '?subject=Whiskly%20Emergency%20Pause%20Check-in&body=Hi%20' + encodeURIComponent(baker?.business_name || '') + '%2C%0A%0AWe%20received%20your%20emergency%20pause.%20Please%20reply%20as%20soon%20as%20possible%20so%20we%20can%20support%20you%20and%20your%20customers.%0A%0AWhiskly%20Support'}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: '#2d1a0e' }}>
                  Open Email Draft
                </a>
                <button onClick={() => copyEmail(baker?.email || '', 'baker-contact')} className="px-3 py-1.5 rounded-lg text-xs font-semibold border" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>
                  {emailCopied === 'baker-contact' ? '✓ Copied' : 'Copy Email Address'}
                </button>
              </div>
              {!steps.includes(STEPS[0].label) && <button onClick={() => markStep(STEPS[0].label, 1)} className="px-4 py-2 rounded-lg text-xs font-semibold text-white self-start" style={{ backgroundColor: '#166534' }}>Mark Done — Baker Contacted</button>}
            </div>
          )}
        </div>

        {/* STEP 2 — Assess Orders */}
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: steps.includes(STEPS[1].label) ? '#bbf7d0' : '#e0d5cc' }}>
          <button onClick={() => setExpandedStep(expandedStep === 1 ? null : 1)} className="w-full flex items-center gap-3 p-3 text-left" style={{ backgroundColor: steps.includes(STEPS[1].label) ? '#dcfce7' : '#faf8f6' }}>
            <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ backgroundColor: steps.includes(STEPS[1].label) ? '#166534' : '#e0d5cc', color: 'white' }}>{steps.includes(STEPS[1].label) ? '✓' : '2'}</div>
            <span className="text-xs font-medium flex-1" style={{ color: steps.includes(STEPS[1].label) ? '#166534' : '#2d1a0e', textDecoration: steps.includes(STEPS[1].label) ? 'line-through' : 'none' }}>{STEPS[1].label}</span>
            <span className="text-xs flex-shrink-0" style={{ color: '#9c7b6b' }}>{viewedOrders.size}/{affectedOrders.length} reviewed · {expandedStep === 1 ? '▲' : '▼'}</span>
          </button>
          {expandedStep === 1 && (
            <div className="p-4 border-t flex flex-col gap-3" style={{ borderColor: '#e0d5cc', backgroundColor: 'white' }}>
              {affectedOrders.length === 0 ? (
                <p className="text-xs" style={{ color: '#5c3d2e' }}>No active orders for this baker.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold" style={{ color: '#2d1a0e' }}>Click each order to review it. You must open every order before proceeding.</p>
                  {affectedOrders.map(o => {
                    const days = getDaysUntil(o.event_date)
                    const urgent = days <= 3 && days >= 0
                    const viewed = viewedOrders.has(o.id)
                    return (
                      <div key={o.id} className="rounded-xl border overflow-hidden" style={{ borderColor: viewed ? '#bbf7d0' : urgent ? '#fecaca' : '#e0d5cc' }}>
                        <button onClick={() => { setExpandedOrder(expandedOrder === o.id ? null : o.id); setViewedOrders(prev => new Set([...prev, o.id])) }}
                          className="w-full flex items-center gap-3 p-3 text-left"
                          style={{ backgroundColor: viewed ? '#dcfce7' : urgent ? '#fef2f2' : '#faf8f6' }}>
                          <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ backgroundColor: viewed ? '#166534' : urgent ? '#dc2626' : '#e0d5cc', color: 'white' }}>{viewed ? '✓' : '!'}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold" style={{ color: '#2d1a0e' }}>{o.customer_name} — {o.event_type}</p>
                            <p className="text-xs" style={{ color: '#5c3d2e' }}>{o.event_date} · ${o.budget} · {o.status}</p>
                          </div>
                          <span className="text-xs font-bold flex-shrink-0" style={{ color: urgent ? '#dc2626' : '#854d0e' }}>{days < 0 ? 'PAST' : days === 0 ? 'TODAY' : days + 'd'}{urgent ? ' ⚠' : ''}</span>
                        </button>
                        {expandedOrder === o.id && (
                          <div className="p-3 border-t text-xs flex flex-col gap-1.5" style={{ borderColor: '#e0d5cc', backgroundColor: 'white' }}>
                            <p style={{ color: '#5c3d2e' }}><strong>Customer:</strong> {o.customer_name} · {o.customer_email}</p>
                            <p style={{ color: '#5c3d2e' }}><strong>Event:</strong> {o.event_type} on {o.event_date}</p>
                            <p style={{ color: '#5c3d2e' }}><strong>Budget:</strong> ${o.budget} · <strong>Fulfillment:</strong> {o.fulfillment_type || 'Not set'}</p>
                            <p style={{ color: o.deposit_paid_at ? '#166534' : '#991b1b' }}><strong>Deposit:</strong> {o.deposit_paid_at ? 'Paid' : 'Not paid'}</p>
                            <p style={{ color: o.remainder_paid_at ? '#166534' : '#854d0e' }}><strong>Remainder:</strong> {o.remainder_paid_at ? 'Paid' : 'Not paid'}</p>
                            {o.item_description && <p style={{ color: '#5c3d2e' }}><strong>Description:</strong> {o.item_description}</p>}
                            {o.allergen_notes && <p style={{ color: '#854d0e' }}><strong>Allergens:</strong> {o.allergen_notes}</p>}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
              {!allOrdersViewed && <p className="text-xs font-semibold" style={{ color: '#854d0e' }}>Open every order above before marking done ({affectedOrders.length - viewedOrders.size} remaining)</p>}
              {!steps.includes(STEPS[1].label) && <button onClick={() => allOrdersViewed && markStep(STEPS[1].label, 2)} disabled={!allOrdersViewed} className="px-4 py-2 rounded-lg text-xs font-semibold text-white self-start" style={{ backgroundColor: '#166534', opacity: allOrdersViewed ? 1 : 0.4 }}>Mark Done — All Orders Reviewed</button>}
            </div>
          )}
        </div>

        {/* STEP 3 — Notify Critical */}
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: steps.includes(STEPS[2].label) ? '#bbf7d0' : '#e0d5cc' }}>
          <button onClick={() => setExpandedStep(expandedStep === 2 ? null : 2)} className="w-full flex items-center gap-3 p-3 text-left" style={{ backgroundColor: steps.includes(STEPS[2].label) ? '#dcfce7' : '#faf8f6' }}>
            <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ backgroundColor: steps.includes(STEPS[2].label) ? '#166534' : '#e0d5cc', color: 'white' }}>{steps.includes(STEPS[2].label) ? '✓' : '3'}</div>
            <span className="text-xs font-medium flex-1" style={{ color: steps.includes(STEPS[2].label) ? '#166534' : '#2d1a0e', textDecoration: steps.includes(STEPS[2].label) ? 'line-through' : 'none' }}>{STEPS[2].label}</span>
            <span className="text-xs flex-shrink-0" style={{ color: '#9c7b6b' }}>{notifiedCritical.size}/{criticalOrders.length} notified · {expandedStep === 2 ? '▲' : '▼'}</span>
          </button>
          {expandedStep === 2 && (
            <div className="p-4 border-t flex flex-col gap-3" style={{ borderColor: '#e0d5cc', backgroundColor: 'white' }}>
              {criticalOrders.length === 0 ? (
                <p className="text-xs" style={{ color: '#5c3d2e' }}>No critical orders. Skip this step.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-xs font-semibold" style={{ color: '#dc2626' }}>{criticalOrders.length} order{criticalOrders.length > 1 ? 's' : ''} with events within 72hrs — contact immediately</p>
                  {criticalOrders.map(o => {
                    const notified = notifiedCritical.has(o.id)
                    const emailText = customerEmailText(o, true)
                    const key = 'crit-' + o.id
                    return (
                      <div key={o.id} className="p-3 rounded-xl border" style={{ backgroundColor: notified ? '#dcfce7' : '#fef2f2', borderColor: notified ? '#bbf7d0' : '#fecaca' }}>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-xs font-bold" style={{ color: notified ? '#166534' : '#991b1b' }}>{o.customer_name} — {o.event_type} in {getDaysUntil(o.event_date)} day{getDaysUntil(o.event_date) !== 1 ? 's' : ''}</p>
                            <p className="text-xs" style={{ color: '#5c3d2e' }}>{o.customer_email}</p>
                          </div>
                          {notified && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#166534', color: 'white' }}>✓ Notified</span>}
                        </div>
                        <textarea id={'email-' + key} readOnly value={emailText} rows={4} className="w-full px-3 py-2 rounded-lg border text-xs resize-none mb-2" style={{ borderColor: '#e0d5cc', color: '#5c3d2e', backgroundColor: 'white', fontFamily: 'inherit' }} />
                        <div className="flex gap-2 flex-wrap">
                          <a href={'mailto:' + o.customer_email + '?subject=' + encodeURIComponent('Urgent: Update about your Whiskly order') + '&body=' + encodeURIComponent(emailText)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: '#dc2626' }}>
                            Open in Email
                          </a>
                          <button onClick={() => copyEmail(emailText, key)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>
                            {emailCopied === key ? '✓ Copied!' : 'Copy Email Text'}
                          </button>
                          {!notified && (
                            <button onClick={() => setNotifiedCritical(prev => new Set([...prev, o.id]))}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white ml-auto" style={{ backgroundColor: '#166534' }}>
                              Mark Notified
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              {!allCriticalNotified && <p className="text-xs font-semibold" style={{ color: '#854d0e' }}>Mark every critical customer as notified before proceeding ({criticalOrders.length - notifiedCritical.size} remaining)</p>}
              {!steps.includes(STEPS[2].label) && <button onClick={() => allCriticalNotified && markStep(STEPS[2].label, 3)} disabled={!allCriticalNotified} className="px-4 py-2 rounded-lg text-xs font-semibold text-white self-start" style={{ backgroundColor: '#166534', opacity: allCriticalNotified ? 1 : 0.4 }}>Mark Done — Critical Customers Notified</button>}
            </div>
          )}
        </div>

        {/* STEP 4 — Notify Others */}
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: steps.includes(STEPS[3].label) ? '#bbf7d0' : '#e0d5cc' }}>
          <button onClick={() => setExpandedStep(expandedStep === 3 ? null : 3)} className="w-full flex items-center gap-3 p-3 text-left" style={{ backgroundColor: steps.includes(STEPS[3].label) ? '#dcfce7' : '#faf8f6' }}>
            <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ backgroundColor: steps.includes(STEPS[3].label) ? '#166534' : '#e0d5cc', color: 'white' }}>{steps.includes(STEPS[3].label) ? '✓' : '4'}</div>
            <span className="text-xs font-medium flex-1" style={{ color: steps.includes(STEPS[3].label) ? '#166534' : '#2d1a0e', textDecoration: steps.includes(STEPS[3].label) ? 'line-through' : 'none' }}>{STEPS[3].label}</span>
            <span className="text-xs flex-shrink-0" style={{ color: '#9c7b6b' }}>{notifiedOthers.size}/{nonCriticalOrders.length} notified · {expandedStep === 3 ? '▲' : '▼'}</span>
          </button>
          {expandedStep === 3 && (
            <div className="p-4 border-t flex flex-col gap-3" style={{ borderColor: '#e0d5cc', backgroundColor: 'white' }}>
              {nonCriticalOrders.length === 0 ? (
                <p className="text-xs" style={{ color: '#5c3d2e' }}>No non-critical orders. Skip this step.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {nonCriticalOrders.map(o => {
                    const notified = notifiedOthers.has(o.id)
                    const emailText = customerEmailText(o, false)
                    const key = 'other-' + o.id
                    return (
                      <div key={o.id} className="p-3 rounded-xl border" style={{ backgroundColor: notified ? '#dcfce7' : '#f5f0eb', borderColor: notified ? '#bbf7d0' : '#e0d5cc' }}>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-xs font-bold" style={{ color: notified ? '#166534' : '#2d1a0e' }}>{o.customer_name} — {o.event_type} in {getDaysUntil(o.event_date)} days</p>
                            <p className="text-xs" style={{ color: '#5c3d2e' }}>{o.customer_email}</p>
                          </div>
                          {notified && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#166534', color: 'white' }}>✓ Notified</span>}
                        </div>
                        <textarea id={'email-' + key} readOnly value={emailText} rows={4} className="w-full px-3 py-2 rounded-lg border text-xs resize-none mb-2" style={{ borderColor: '#e0d5cc', color: '#5c3d2e', backgroundColor: 'white', fontFamily: 'inherit' }} />
                        <div className="flex gap-2 flex-wrap">
                          <a href={'mailto:' + o.customer_email + '?subject=' + encodeURIComponent('Update about your Whiskly order') + '&body=' + encodeURIComponent(emailText)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: '#8B4513' }}>
                            Open in Email
                          </a>
                          <button onClick={() => copyEmail(emailText, key)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>
                            {emailCopied === key ? '✓ Copied!' : 'Copy Email Text'}
                          </button>
                          {!notified && (
                            <button onClick={() => setNotifiedOthers(prev => new Set([...prev, o.id]))}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white ml-auto" style={{ backgroundColor: '#166534' }}>
                              Mark Notified
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              {!allOthersNotified && <p className="text-xs font-semibold" style={{ color: '#854d0e' }}>Mark every customer as notified before proceeding ({nonCriticalOrders.length - notifiedOthers.size} remaining)</p>}
              {!steps.includes(STEPS[3].label) && <button onClick={() => allOthersNotified && markStep(STEPS[3].label, 4)} disabled={!allOthersNotified} className="px-4 py-2 rounded-lg text-xs font-semibold text-white self-start" style={{ backgroundColor: '#166534', opacity: allOthersNotified ? 1 : 0.4 }}>Mark Done — All Customers Notified</button>}
            </div>
          )}
        </div>

        {/* STEP 5 — Decide Outcomes */}
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: steps.includes(STEPS[4].label) ? '#bbf7d0' : '#e0d5cc' }}>
          <button onClick={() => setExpandedStep(expandedStep === 4 ? null : 4)} className="w-full flex items-center gap-3 p-3 text-left" style={{ backgroundColor: steps.includes(STEPS[4].label) ? '#dcfce7' : '#faf8f6' }}>
            <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ backgroundColor: steps.includes(STEPS[4].label) ? '#166534' : '#e0d5cc', color: 'white' }}>{steps.includes(STEPS[4].label) ? '✓' : '5'}</div>
            <span className="text-xs font-medium flex-1" style={{ color: steps.includes(STEPS[4].label) ? '#166534' : '#2d1a0e', textDecoration: steps.includes(STEPS[4].label) ? 'line-through' : 'none' }}>{STEPS[4].label}</span>
            <span className="text-xs flex-shrink-0" style={{ color: '#9c7b6b' }}>{orderOutcomesSent.size}/{affectedOrders.length} done · {expandedStep === 4 ? '▲' : '▼'}</span>
          </button>
          {expandedStep === 4 && (
            <div className="p-4 border-t flex flex-col gap-4" style={{ borderColor: '#e0d5cc', backgroundColor: 'white' }}>
              {affectedOrders.length === 0 ? (
                <p className="text-xs" style={{ color: '#5c3d2e' }}>No active orders to decide on.</p>
              ) : affectedOrders.map(o => {
                const outcome = orderOutcomes[o.id]
                const sent = orderOutcomesSent.has(o.id)
                const emailText = outcomeEmailText(o, outcome)
                const key = 'outcome-' + o.id
                return (
                  <div key={o.id} className="p-4 rounded-xl border flex flex-col gap-3" style={{ borderColor: sent ? '#bbf7d0' : '#e0d5cc', backgroundColor: sent ? '#dcfce7' : '#faf8f6' }}>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold" style={{ color: sent ? '#166534' : '#2d1a0e' }}>{o.customer_name} · {o.event_type} · {o.event_date}</p>
                      {sent && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#166534', color: 'white' }}>✓ Done</span>}
                    </div>
                    {!sent && (
                      <>
                        <div className="flex flex-col gap-1.5">
                          <p className="text-xs font-semibold" style={{ color: '#2d1a0e' }}>Select outcome:</p>
                          {[
                            { value: 'hold', label: 'Keep on hold — baker may still fulfill', color: '#1e40af', bg: '#dbeafe' },
                            { value: 'refund', label: 'Issue full refund and cancel', color: '#991b1b', bg: '#fee2e2' },
                            { value: 'replacement', label: 'Find replacement baker', color: '#854d0e', bg: '#fef9c3' },
                          ].map(opt => (
                            <button key={opt.value} onClick={() => setOrderOutcomes({ ...orderOutcomes, [o.id]: opt.value })}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg text-left border text-xs font-medium"
                              style={{ borderColor: outcome === opt.value ? opt.color : '#e0d5cc', backgroundColor: outcome === opt.value ? opt.bg : 'white', color: outcome === opt.value ? opt.color : '#5c3d2e' }}>
                              <div className="w-3 h-3 rounded-full border-2 flex-shrink-0" style={{ borderColor: outcome === opt.value ? opt.color : '#e0d5cc', backgroundColor: outcome === opt.value ? opt.color : 'transparent' }} />
                              {opt.label}
                            </button>
                          ))}
                        </div>
                        {outcome === 'refund' && o.deposit_paid_at && (
                          <div className="p-3 rounded-xl" style={{ backgroundColor: '#fef2f2' }}>
                            <p className="text-xs font-bold mb-2" style={{ color: '#991b1b' }}>Issue refund via Stripe</p>
                            <button onClick={() => triggerRefund(o)} disabled={processingRefund === o.id} className="px-4 py-2 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: '#dc2626', opacity: processingRefund === o.id ? 0.5 : 1 }}>
                              {processingRefund === o.id ? 'Processing...' : 'Issue Refund Now'}
                            </button>
                          </div>
                        )}
                        {outcome === 'refund' && !o.deposit_paid_at && (
                          <p className="text-xs" style={{ color: '#5c3d2e' }}>No deposit was paid — no refund needed. Order will be cancelled.</p>
                        )}
                        {outcome === 'replacement' && (
                          <div className="p-3 rounded-xl" style={{ backgroundColor: '#fef9c3' }}>
                            <p className="text-xs font-bold mb-2" style={{ color: '#854d0e' }}>Available bakers in {baker?.city}</p>
                            {replacementBakers.length === 0 ? (
                              <p className="text-xs" style={{ color: '#5c3d2e' }}>No other active bakers found in {baker?.city}. Consider expanding your search or issuing a refund.</p>
                            ) : replacementBakers.slice(0, 3).map(rb => (
                              <div key={rb.id} className="flex items-center justify-between py-1.5 border-b last:border-0" style={{ borderColor: '#fde68a' }}>
                                <div>
                                  <p className="text-xs font-semibold" style={{ color: '#2d1a0e' }}>{rb.business_name}</p>
                                  <p className="text-xs" style={{ color: '#5c3d2e' }}>{rb.email} · {rb.specialties?.slice(0,2).join(', ')}</p>
                                </div>
                                <a href={'mailto:' + rb.email + '?subject=Emergency%20Baker%20Coverage%20Request&body=Hi%20' + encodeURIComponent(rb.business_name) + '%2C%0A%0AWe%20have%20a%20customer%20who%20needs%20a%20' + encodeURIComponent(o.event_type) + '%20for%20' + encodeURIComponent(o.event_date) + '.%20Would%20you%20be%20able%20to%20help%3F%0A%0AWhiskly%20Support'}
                                  className="px-2 py-1 rounded text-xs font-semibold text-white" style={{ backgroundColor: '#8B4513' }}>
                                  Contact
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                        {outcome && (
                          <div>
                            <p className="text-xs font-bold mb-2" style={{ color: '#2d1a0e' }}>Send outcome email to customer:</p>
                            <textarea id={'email-' + key} readOnly value={emailText} rows={4} className="w-full px-3 py-2 rounded-lg border text-xs resize-none mb-2" style={{ borderColor: '#e0d5cc', color: '#5c3d2e', backgroundColor: 'white', fontFamily: 'inherit' }} />
                            <div className="flex gap-2 flex-wrap">
                              <a href={'mailto:' + o.customer_email + '?subject=' + encodeURIComponent('Update on your Whiskly order') + '&body=' + encodeURIComponent(emailText)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: '#2d1a0e' }}>
                                Open in Email
                              </a>
                              <button onClick={() => copyEmail(emailText, key)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>
                                {emailCopied === key ? '✓ Copied!' : 'Copy Email Text'}
                              </button>
                              <button onClick={() => setOrderOutcomesSent(prev => new Set([...prev, o.id]))}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white ml-auto" style={{ backgroundColor: '#166534' }}>
                                Mark Customer Notified
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
              {allOutcomesDecided && allOutcomeEmailsSent && (
                <div className="p-4 rounded-xl border" style={{ borderColor: '#e0d5cc', backgroundColor: '#f5f0eb' }}>
                  <p className="text-xs font-bold mb-2" style={{ color: '#2d1a0e' }}>Send outcome summary to baker:</p>
                  <textarea id="email-baker-outcomes" readOnly value={bakerOutcomeEmailText(orderOutcomes)} rows={5} className="w-full px-3 py-2 rounded-lg border text-xs resize-none mb-2" style={{ borderColor: '#e0d5cc', color: '#5c3d2e', backgroundColor: 'white', fontFamily: 'inherit' }} />
                  <div className="flex gap-2 flex-wrap">
                    <a href={'mailto:' + baker?.email + '?subject=' + encodeURIComponent('Update on your orders during emergency pause') + '&body=' + encodeURIComponent(bakerOutcomeEmailText(orderOutcomes))}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: '#8B4513' }}>
                      Open in Email
                    </a>
                    <button onClick={() => copyEmail(bakerOutcomeEmailText(orderOutcomes), 'baker-outcomes')} className="px-3 py-1.5 rounded-lg text-xs font-semibold border" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>
                      {emailCopied === 'baker-outcomes' ? '✓ Copied!' : 'Copy Email Text'}
                    </button>
                  </div>
                </div>
              )}
              {!allOutcomesDecided && <p className="text-xs font-semibold" style={{ color: '#854d0e' }}>Select an outcome for every order ({affectedOrders.length - Object.keys(orderOutcomes).length} remaining)</p>}
              {allOutcomesDecided && !allOutcomeEmailsSent && <p className="text-xs font-semibold" style={{ color: '#854d0e' }}>Mark each customer as notified before proceeding ({affectedOrders.length - orderOutcomesSent.size} remaining)</p>}
              {!steps.includes(STEPS[4].label) && <button onClick={() => allOutcomesDecided && allOutcomeEmailsSent && markStep(STEPS[4].label, 5)} disabled={!allOutcomesDecided || !allOutcomeEmailsSent} className="px-4 py-2 rounded-lg text-xs font-semibold text-white self-start" style={{ backgroundColor: '#166534', opacity: (allOutcomesDecided && allOutcomeEmailsSent) ? 1 : 0.4 }}>Mark Done — All Outcomes Decided</button>}
            </div>
          )}
        </div>

        {/* STEP 6 — Log Notes */}
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: steps.includes(STEPS[5].label) ? '#bbf7d0' : '#e0d5cc' }}>
          <button onClick={() => setExpandedStep(expandedStep === 5 ? null : 5)} className="w-full flex items-center gap-3 p-3 text-left" style={{ backgroundColor: steps.includes(STEPS[5].label) ? '#dcfce7' : '#faf8f6' }}>
            <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ backgroundColor: steps.includes(STEPS[5].label) ? '#166534' : '#e0d5cc', color: 'white' }}>{steps.includes(STEPS[5].label) ? '✓' : '6'}</div>
            <span className="text-xs font-medium flex-1" style={{ color: steps.includes(STEPS[5].label) ? '#166534' : '#2d1a0e', textDecoration: steps.includes(STEPS[5].label) ? 'line-through' : 'none' }}>{STEPS[5].label}</span>
            <span className="text-xs" style={{ color: '#9c7b6b' }}>{expandedStep === 5 ? '▲' : '▼'}</span>
          </button>
          {expandedStep === 5 && (
            <div className="p-4 border-t flex flex-col gap-3" style={{ borderColor: '#e0d5cc', backgroundColor: 'white' }}>
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#fef9c3' }}>
                <p className="text-xs font-bold mb-1" style={{ color: '#854d0e' }}>What to document</p>
                <p className="text-xs" style={{ color: '#5c3d2e' }}>What was the situation? When did you contact the baker? What did they say? What outcome was chosen for each order? Any follow-up needed?</p>
              </div>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} onBlur={saveNotes} rows={4}
                placeholder="e.g. Baker had a family emergency. Contacted via email at 3pm. Orders for Sarah J and Tom L held. Order for Mike R refunded — deposit returned. Baker expects to return in 3 days."
                className="w-full px-3 py-2 rounded-xl border text-xs resize-none"
                style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
              {saving && <p className="text-xs" style={{ color: '#5c3d2e' }}>Saving...</p>}
              {!steps.includes(STEPS[5].label) && <button onClick={() => notes.trim().length > 20 && markStep(STEPS[5].label, 6)} disabled={notes.trim().length <= 20} className="px-4 py-2 rounded-lg text-xs font-semibold text-white self-start" style={{ backgroundColor: '#166534', opacity: notes.trim().length > 20 ? 1 : 0.4 }}>Mark Done — Notes Logged</button>}
            </div>
          )}
        </div>

      </div>

      <div className="pt-4 border-t" style={{ borderColor: '#e0d5cc' }}>
        {steps.length < STEPS.length && <p className="text-xs font-semibold mb-3" style={{ color: '#854d0e' }}>Complete all {STEPS.length} steps to close this case ({STEPS.length - steps.length} remaining)</p>}
        <div className="flex gap-3 flex-wrap">
          <select value={resolution} onChange={e => setResolution(e.target.value)} className="flex-1 px-3 py-2 rounded-xl border text-xs min-w-48" style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }}>
            <option value="">Select resolution...</option>
            <option value="baker_returned">Baker returned — orders continue</option>
            <option value="converted_vacation">Converted to vacation mode</option>
            <option value="orders_refunded">All orders refunded</option>
            <option value="baker_suspended">Baker suspended</option>
            <option value="resolved_other">Resolved — other</option>
          </select>
          <button onClick={() => { if (resolution && steps.length >= STEPS.length) onResolve(ec.id, resolution) }}
            disabled={!resolution || steps.length < STEPS.length}
            className="px-5 py-2 rounded-xl text-white text-xs font-semibold"
            style={{ backgroundColor: '#166534', opacity: (!resolution || steps.length < STEPS.length) ? 0.4 : 1 }}>
            Close Case
          </button>
        </div>
      </div>
    </div>
    </>
  )
}
