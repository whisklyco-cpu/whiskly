'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CustomerSignup() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    city: '',
    state: '',
    zip_code: '',
    how_did_you_hear: '',
  })

  function update(fields: Partial<typeof form>) {
    setForm(prev => ({ ...prev, ...fields }))
  }

  async function handleSubmit() {
    if (!form.full_name || !form.email || !form.password) {
      setError('Please fill in all required fields.')
      return
    }
    setLoading(true)
    setError('')

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name, role: 'customer' } }
    })

    if (authError) { setError(authError.message); setLoading(false); return }

    const { error: customerError } = await supabase.from('customers').insert({
      user_id: authData.user?.id,
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
      city: form.city,
      state: form.state,
      zip_code: form.zip_code,
      how_did_you_hear: form.how_did_you_hear,
    })

    if (customerError) { setError(customerError.message); setLoading(false); return }

    router.push('/bakers')
  }

  const inputStyle = { borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }

  return (
    <main className="min-h-screen py-12" style={{ backgroundColor: '#f5f0eb' }}>
      <div className="max-w-md mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold" style={{ color: '#2d1a0e' }}>🎂 Whiskly</Link>
          <p className="text-sm mt-2" style={{ color: '#5c3d2e' }}>Create your account</p>
        </div>

        {/* Progress */}
        <div className="flex gap-1 mb-8">
          {[1, 2].map(i => (
            <div key={i} className="flex-1 h-2 rounded-full transition-all duration-300"
              style={{ backgroundColor: i <= step ? '#2d1a0e' : '#e0d5cc' }} />
          ))}
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm text-red-700 bg-red-50 border border-red-200">{error}</div>
        )}

        <div className="bg-white rounded-2xl p-8 shadow-sm">

          {step === 1 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-bold mb-2" style={{ color: '#2d1a0e' }}>Create your account</h2>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>Full Name *</label>
                <input value={form.full_name} onChange={e => update({ full_name: e.target.value })}
                  placeholder="Alexandria Johnson" className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle} />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>Email *</label>
                <input type="email" value={form.email} onChange={e => update({ email: e.target.value })}
                  placeholder="you@example.com" className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle} />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>Password *</label>
                <input type="password" value={form.password} onChange={e => update({ password: e.target.value })}
                  placeholder="Min. 6 characters" className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle} />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>Phone</label>
                <input type="tel" value={form.phone} onChange={e => update({ phone: e.target.value })}
                  placeholder="(301) 555-0100" className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle} />
              </div>

              <button
                onClick={() => {
                  if (!form.full_name || !form.email || !form.password) { setError('Please fill in all required fields.'); return }
                  setError('')
                  setStep(2)
                }}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm mt-2"
                style={{ backgroundColor: '#2d1a0e' }}
              >
                Continue →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-bold mb-2" style={{ color: '#2d1a0e' }}>Where are you located?</h2>
              <p className="text-sm -mt-2 mb-2" style={{ color: '#5c3d2e' }}>This helps us show you bakers near you</p>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>City</label>
                  <input value={form.city} onChange={e => update({ city: e.target.value })}
                    placeholder="Upper Marlboro" className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>State</label>
                  <input value={form.state} onChange={e => update({ state: e.target.value })}
                    placeholder="MD" className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>ZIP Code</label>
                <input value={form.zip_code} onChange={e => update({ zip_code: e.target.value })}
                  placeholder="20774" className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle} />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>How did you hear about us?</label>
                <select value={form.how_did_you_hear} onChange={e => update({ how_did_you_hear: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle}>
                  <option value="">Select one</option>
                  <option>Word of mouth</option>
                  <option>Instagram</option>
                  <option>TikTok</option>
                  <option>Google</option>
                  <option>Facebook</option>
                  <option>Another baker</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="flex gap-3 mt-2">
                <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border font-semibold text-sm"
                  style={{ borderColor: '#2d1a0e', color: '#2d1a0e' }}>
                  ← Back
                </button>
                <button onClick={handleSubmit} disabled={loading}
                  className="flex-1 py-3 rounded-xl text-white font-semibold text-sm"
                  style={{ backgroundColor: '#2d1a0e', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Creating account...' : 'Find Bakers 🎂'}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-sm mt-6" style={{ color: '#5c3d2e' }}>
          Already have an account?{' '}
          <Link href="/login" className="font-semibold underline" style={{ color: '#2d1a0e' }}>Sign In</Link>
        </p>
        <p className="text-center text-sm mt-2" style={{ color: '#5c3d2e' }}>
          Want to sell on Whiskly?{' '}
          <Link href="/join" className="font-semibold underline" style={{ color: '#2d1a0e' }}>Join as a Baker</Link>
        </p>
      </div>
    </main>
  )
}