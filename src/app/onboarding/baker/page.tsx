'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function BakerOnboarding() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [agreed, setAgreed] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [baker, setBaker] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: bakerData } = await supabase.from('bakers').select('*').eq('user_id', user.id).maybeSingle()
      if (!bakerData) { router.push('/login'); return }
      if (bakerData.onboarding_completed) { router.push('/dashboard/baker'); return }
      setBaker(bakerData)
      setLoading(false)
    }
    init()
  }, [router])

  async function handleComplete() {
    if (!baker || completing) return
    setCompleting(true)

    await supabase.from('bakers').update({
      onboarding_completed: true,
      agreed_to_terms: true,
    }).eq('id', baker.id)

    const emailBody = `Hi ${baker.business_name},

Thank you for joining Whiskly. Here is a record of what you agreed to today.

---

How Whiskly works financially:

Right now, you keep 100% of every order. Customers pay a $2.99 platform support fee at checkout. That is it.

In the future, when Whiskly is driving 40% or more of your orders, commission activates with 60 days written notice. At that point you choose your tier:

Free: 10% commission, no monthly fee, full order management.
Pro: 7% commission, $19 a month — priority placement, analytics, social graphics, seasonal campaigns.
Elite: 5% commission, $34 a month — everything in Pro plus Business Orders portal and brand partnerships.

You are never locked in. You can change tiers or leave at any time.

---

Welcome to Whiskly. We are glad you are here.

— The Whiskly team`

    await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'announcement',
        to: baker.email,
        name: baker.business_name,
        subject: 'Your Whiskly agreement confirmation',
        body: emailBody,
      }),
    }).catch(() => {})

    router.push('/dashboard/baker')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#faf8f6' }}>
        <p className="text-sm" style={{ color: '#9c7b6b' }}>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: '#faf8f6' }}>
      <div className="w-full max-w-lg">

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map(n => (
            <div key={n} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  backgroundColor: step >= n ? '#2d1a0e' : '#e0d5cc',
                  color: step >= n ? 'white' : '#9c7b6b',
                }}>
                {n}
              </div>
              {n < 3 && <div className="w-8 h-0.5" style={{ backgroundColor: step > n ? '#2d1a0e' : '#e0d5cc' }} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8">

          {/* Step 1 — Welcome */}
          {step === 1 && (
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-2xl font-bold mb-3" style={{ color: '#2d1a0e' }}>Welcome to Whiskly</p>
                <p className="text-sm leading-relaxed" style={{ color: '#5c3d2e' }}>
                  Before you head to your dashboard, we want to walk you through a few things so you know exactly how this works. This will take about two minutes.
                </p>
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm"
                style={{ backgroundColor: '#2d1a0e' }}>
                Let's go
              </button>
            </div>
          )}

          {/* Step 2 — Commission disclosure */}
          {step === 2 && (
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-2xl font-bold mb-5" style={{ color: '#2d1a0e' }}>How Whiskly works financially</p>
                <div className="flex flex-col gap-4 text-sm leading-relaxed" style={{ color: '#5c3d2e' }}>
                  <p>
                    Right now, you keep 100% of every order. Customers pay a $2.99 platform support fee at checkout. That is it.
                  </p>
                  <p>
                    In the future, when Whiskly is driving 40% or more of your orders, commission activates with 60 days written notice. At that point you choose your tier:
                  </p>
                  <div className="rounded-xl p-4 flex flex-col gap-2" style={{ backgroundColor: '#f5f0eb' }}>
                    <p><span className="font-semibold" style={{ color: '#2d1a0e' }}>Free:</span> 10% commission, no monthly fee, full order management.</p>
                    <p><span className="font-semibold" style={{ color: '#2d1a0e' }}>Pro:</span> 7% commission, $19 a month — priority placement, analytics, social graphics, seasonal campaigns.</p>
                    <p><span className="font-semibold" style={{ color: '#2d1a0e' }}>Elite:</span> 5% commission, $34 a month — everything in Pro plus Business Orders portal and brand partnerships.</p>
                  </div>
                  <p>
                    You are never locked in. You can change tiers or leave at any time.
                  </p>
                  <p>
                    We built it this way on purpose. You should not pay us more until we have actually earned it for you.
                  </p>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  className="mt-0.5 flex-shrink-0"
                />
                <span className="text-sm" style={{ color: '#2d1a0e' }}>
                  I have read and understand how Whiskly's fee structure works, including the future commission model.
                </span>
              </label>

              <button
                onClick={() => { if (agreed) setStep(3) }}
                disabled={!agreed}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm"
                style={{ backgroundColor: '#2d1a0e', opacity: agreed ? 1 : 0.4, cursor: agreed ? 'pointer' : 'not-allowed' }}>
                I agree, continue
              </button>
            </div>
          )}

          {/* Step 3 — Confirmation */}
          {step === 3 && (
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-2xl font-bold mb-3" style={{ color: '#2d1a0e' }}>You are all set</p>
                <p className="text-sm leading-relaxed" style={{ color: '#5c3d2e' }}>
                  A copy of what you just agreed to has been sent to your email. You can always find our full terms at whiskly.com/terms.
                </p>
              </div>
              <button
                onClick={handleComplete}
                disabled={completing}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm"
                style={{ backgroundColor: '#2d1a0e', opacity: completing ? 0.6 : 1 }}>
                {completing ? 'Setting up your dashboard...' : 'Go to my dashboard'}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
