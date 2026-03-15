'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

const CONTACT_TYPES = [
  { value: 'customer_order', label: 'Issue with an order', icon: '📦', audience: 'customer', description: 'Problem with a current or past order' },
  { value: 'customer_payment', label: 'Payment issue', icon: '💳', audience: 'customer', description: 'Charge, refund, or billing question' },
  { value: 'customer_baker', label: 'Report a baker', icon: '🚩', audience: 'customer', description: 'Baker conduct, quality, or no-show issue' },
  { value: 'baker_account', label: 'Baker account issue', icon: '🧑‍🍳', audience: 'baker', description: 'Profile, dashboard, or account access' },
  { value: 'baker_payment', label: 'Baker payout issue', icon: '💰', audience: 'baker', description: 'Stripe Connect, payout, or commission question' },
  { value: 'baker_pro', label: 'Pro tier question', icon: '⭐', audience: 'baker', description: 'Upgrade, billing, or Pro features' },
  { value: 'dispute', label: 'File a dispute', icon: '⚖️', audience: 'both', description: 'Formal dispute between customer and baker' },
  { value: 'general', label: 'General question', icon: '💬', audience: 'both', description: 'Anything else — feedback, partnerships, press' },
]

const PRIORITY_TYPES = ['customer_order', 'customer_payment', 'baker_payment', 'dispute']

export default function ContactPage() {
  const [step, setStep] = useState<'type' | 'form' | 'sent'>('type')
  const [contactType, setContactType] = useState('')
  const [audience, setAudience] = useState<'customer' | 'baker' | ''>('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    order_id: '',
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const selectedType = CONTACT_TYPES.find(t => t.value === contactType)
  const isPriority = PRIORITY_TYPES.includes(contactType)
  const showOrderId = ['customer_order', 'customer_payment', 'customer_baker', 'baker_payment', 'dispute'].includes(contactType)

  async function handleSubmit() {
    if (!form.name || !form.email || !form.message) return
    setSubmitting(true)

    const subject = '[' + (isPriority ? 'PRIORITY' : 'Support') + '] ' + (selectedType?.label || 'Contact') + ' — ' + form.name
    const body = [
      'Type: ' + selectedType?.label,
      'From: ' + form.name + ' (' + form.email + ')',
      form.order_id ? 'Order ID: ' + form.order_id : '',
      '',
      'Message:',
      form.message,
      '',
      '---',
      'Submitted via whiskly.vercel.app/contact',
    ].filter(Boolean).join('\n')

    await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'announcement',
        to: 'support@whiskly.com',
        name: 'Whiskly Support',
        subject,
        body,
      })
    }).catch(() => {})

    // Send confirmation to user
    await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'announcement',
        to: form.email,
        name: form.name,
        subject: 'We received your message — Whiskly Support',
        body: 'Hi ' + form.name + ',\n\nThanks for reaching out. We\'ve received your message and will get back to you' + (isPriority ? ' within 24 hours' : ' within 2-3 business days') + '.\n\n' + (isPriority ? 'Since this is a priority issue, our team will review it as soon as possible.\n\n' : '') + 'Your request:\n' + form.message + '\n\nWhiskly Support\nsupport@whiskly.com',
      })
    }).catch(() => {})

    setSubmitting(false)
    setStep('sent')
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#f5f0eb' }}>
      <Navbar />

      <section className="px-5 md:px-16 py-12 md:py-16" style={{ maxWidth: '800px', margin: '0 auto' }}>

        {/* Header */}
        <div className="mb-10">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4"
            style={{ backgroundColor: '#e8ddd4', color: '#2d1a0e' }}>
            Support
          </div>
          <h1 className="text-4xl font-bold mb-3" style={{ color: '#2d1a0e', letterSpacing: '-0.02em' }}>
            How can we help?
          </h1>
          <p className="text-base leading-relaxed" style={{ color: '#5c3d2e' }}>
            Tell us what's going on and we'll get back to you as quickly as possible.
          </p>
        </div>

        {/* Step 1: Pick contact type */}
        {step === 'type' && (
          <div className="flex flex-col gap-6">
            {/* Audience selector */}
            <div>
              <p className="text-sm font-semibold mb-3" style={{ color: '#2d1a0e' }}>I am a...</p>
              <div className="flex gap-3">
                {[['customer', 'Customer'], ['baker', 'Baker']].map(([val, label]) => (
                  <button key={val} onClick={() => setAudience(val as any)}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold border transition-all"
                    style={{
                      backgroundColor: audience === val ? '#2d1a0e' : 'white',
                      color: audience === val ? 'white' : '#2d1a0e',
                      borderColor: audience === val ? '#2d1a0e' : '#e0d5cc',
                    }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Contact type options */}
            {audience && (
              <div>
                <p className="text-sm font-semibold mb-3" style={{ color: '#2d1a0e' }}>What do you need help with?</p>
                <div className="flex flex-col gap-2">
                  {CONTACT_TYPES.filter(t => t.audience === audience || t.audience === 'both').map(type => (
                    <button key={type.value}
                      onClick={() => { setContactType(type.value); setStep('form') }}
                      className="flex items-center gap-4 p-4 rounded-xl border text-left transition-all hover:shadow-sm"
                      style={{
                        backgroundColor: 'white',
                        borderColor: '#e0d5cc',
                        borderLeftWidth: PRIORITY_TYPES.includes(type.value) ? '4px' : '1px',
                        borderLeftColor: PRIORITY_TYPES.includes(type.value) ? '#dc2626' : '#e0d5cc',
                      }}>
                      <span className="text-2xl flex-shrink-0">{type.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold" style={{ color: '#2d1a0e' }}>{type.label}</p>
                          {PRIORITY_TYPES.includes(type.value) && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>Priority</span>
                          )}
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>{type.description}</p>
                      </div>
                      <span style={{ color: '#e0d5cc' }}>→</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* FAQ link */}
            <div className="p-4 rounded-xl" style={{ backgroundColor: '#f5f0eb' }}>
              <p className="text-sm font-semibold mb-1" style={{ color: '#2d1a0e' }}>Looking for quick answers?</p>
              <p className="text-xs mb-2" style={{ color: '#5c3d2e' }}>Check our FAQ — most common questions are answered there.</p>
              <Link href="/faq" className="text-xs font-semibold underline" style={{ color: '#8B4513' }}>
                Browse the FAQ →
              </Link>
            </div>
          </div>
        )}

        {/* Step 2: Form */}
        {step === 'form' && selectedType && (
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm">
            <button onClick={() => { setStep('type'); setContactType('') }}
              className="text-sm font-semibold mb-6 flex items-center gap-1"
              style={{ color: '#5c3d2e' }}>
              ← Back
            </button>

            <div className="flex items-center gap-3 mb-6 p-4 rounded-xl"
              style={{ backgroundColor: isPriority ? '#fef2f2' : '#f5f0eb', borderLeft: isPriority ? '4px solid #dc2626' : 'none' }}>
              <span className="text-2xl">{selectedType.icon}</span>
              <div>
                <p className="font-bold text-sm" style={{ color: '#2d1a0e' }}>{selectedType.label}</p>
                {isPriority ? (
                  <p className="text-xs mt-0.5" style={{ color: '#991b1b' }}>Priority issue — we aim to respond within 24 hours</p>
                ) : (
                  <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>We typically respond within 2-3 business days</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-1" style={{ color: '#2d1a0e' }}>Your Name <span style={{ color: '#dc2626' }}>*</span></label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Jane Smith"
                    className="w-full px-4 py-3 rounded-xl border text-sm"
                    style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-1" style={{ color: '#2d1a0e' }}>Email <span style={{ color: '#dc2626' }}>*</span></label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl border text-sm"
                    style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
                </div>
              </div>

              {showOrderId && (
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: '#2d1a0e' }}>
                    Order ID <span className="font-normal" style={{ color: '#5c3d2e' }}>(if applicable)</span>
                  </label>
                  <input value={form.order_id} onChange={e => setForm({ ...form, order_id: e.target.value })}
                    placeholder="Found in your dashboard under My Orders"
                    className="w-full px-4 py-3 rounded-xl border text-sm"
                    style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: '#2d1a0e' }}>Message <span style={{ color: '#dc2626' }}>*</span></label>
                <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                  rows={5}
                  placeholder={
                    contactType === 'dispute' ? 'Describe what happened, when it happened, and what resolution you are seeking...' :
                    contactType === 'customer_baker' ? 'Describe the issue with the baker, including any relevant dates and order details...' :
                    contactType === 'baker_payment' ? 'Describe the payment issue, including expected amount and any Stripe error messages...' :
                    'Tell us what\'s going on and we\'ll do our best to help...'
                  }
                  className="w-full px-4 py-3 rounded-xl border text-sm resize-none"
                  style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
              </div>

              {contactType === 'dispute' && (
                <div className="p-4 rounded-xl" style={{ backgroundColor: '#fef9c3', border: '1px solid #fde68a' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: '#854d0e' }}>Before filing a dispute</p>
                  <p className="text-xs" style={{ color: '#92400e' }}>
                    We recommend messaging the other party first through your dashboard. Most issues are resolved faster that way. If that hasn't worked, we're here to help mediate.
                  </p>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting || !form.name || !form.email || !form.message}
                className="w-full py-4 rounded-xl text-white font-semibold text-sm mt-2"
                style={{ backgroundColor: '#2d1a0e', opacity: (submitting || !form.name || !form.email || !form.message) ? 0.6 : 1 }}>
                {submitting ? 'Sending...' : 'Send Message'}
              </button>

              <p className="text-xs text-center" style={{ color: '#9c7b6b' }}>
                You'll receive a confirmation email at {form.email || 'your email address'}.
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Sent */}
        {step === 'sent' && (
          <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
            <p className="text-5xl mb-4">✓</p>
            <h2 className="text-2xl font-bold mb-3" style={{ color: '#2d1a0e' }}>Message received!</h2>
            <p className="text-sm mb-2" style={{ color: '#5c3d2e' }}>
              We've sent a confirmation to <strong>{form.email}</strong>.
            </p>
            <p className="text-sm mb-8" style={{ color: '#5c3d2e' }}>
              {isPriority
                ? 'This is a priority issue — we aim to respond within 24 hours.'
                : 'We typically respond within 2-3 business days.'}
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/" className="px-6 py-3 rounded-xl border text-sm font-semibold"
                style={{ borderColor: '#2d1a0e', color: '#2d1a0e' }}>
                Back to Home
              </Link>
              <Link href="/faq" className="px-6 py-3 rounded-xl text-white text-sm font-semibold"
                style={{ backgroundColor: '#2d1a0e' }}>
                Browse FAQ
              </Link>
            </div>
          </div>
        )}

      </section>

      <footer className="px-5 md:px-16 py-10 mt-10" style={{ backgroundColor: '#2d1a0e' }}>
        <div className="flex flex-col md:flex-row justify-between gap-8 mb-8" style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div className="max-w-xs">
            <p className="text-xl font-bold text-white mb-2">🎂 Whiskly</p>
            <p className="text-sm" style={{ color: '#c4a882' }}>Book bakers with confidence. Clear pricing. Structured booking.</p>
          </div>
          <div className="flex gap-10 md:gap-16 text-sm flex-wrap">
            <div>
              <p className="font-semibold text-white mb-3">Customers</p>
              <div className="flex flex-col gap-2" style={{ color: '#c4a882' }}>
                <Link href="/bakers">Browse Bakers</Link>
                <Link href="/signup">Create Account</Link>
              </div>
            </div>
            <div>
              <p className="font-semibold text-white mb-3">Bakers</p>
              <div className="flex flex-col gap-2" style={{ color: '#c4a882' }}>
                <Link href="/for-bakers">For Bakers</Link>
                <Link href="/join">Join as Baker</Link>
              </div>
            </div>
            <div>
              <p className="font-semibold text-white mb-3">Help</p>
              <div className="flex flex-col gap-2" style={{ color: '#c4a882' }}>
                <Link href="/faq">FAQ</Link>
                <Link href="/contact">Contact Support</Link>
                <Link href="/terms">Terms of Service</Link>
                <Link href="/privacy">Privacy Policy</Link>
              </div>
            </div>
          </div>
        </div>
        <p className="text-sm border-t pt-6" style={{ color: '#c4a882', borderColor: '#4a2e1a', maxWidth: '1280px', margin: '0 auto' }}>
          © 2026 Whiskly. All rights reserved. · Currently in Beta
        </p>
      </footer>
    </main>
  )
}