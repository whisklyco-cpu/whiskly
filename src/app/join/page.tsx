'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Step components
import StepOne from './steps/StepOne'
import StepTwo from './steps/StepTwo'
import StepThree from './steps/StepThree'
import StepFour from './steps/StepFour'
import StepFive from './steps/StepFive'
import StepSix from './steps/StepSix'
import StepSeven from './steps/StepSeven'

export type BakerData = {
  // Step 1
  full_name: string
  business_name: string
  email: string
  password: string
  phone: string
  instagram_handle: string
  how_did_you_hear: string
  // Step 2
  is_cottage_baker: boolean
  cottage_permit_number: string
  cottage_state_agreed: boolean
  state: string
  city: string
  zip_code: string
  // Step 3
  specialties: string[]
  dietary_tags: string[]
  years_experience: string
  // Step 4
  serves_zip_codes: string
  delivery_available: boolean
  pickup_available: boolean
  delivery_fee_range: string
  minimum_order: string
  rush_orders_available: boolean
  rush_order_fee: string
  // Step 5
  days_available: string[]
  lead_time_days: string
  // Step 6
  starting_price: string
  deposit_percentage: string
  custom_quote_required: boolean
  // Step 7
  bio: string
  cancellation_policy: string
  refund_policy: string
  communication_preference: string
  agreed_to_terms: boolean
}

const INITIAL_DATA: BakerData = {
  full_name: '', business_name: '', email: '', password: '', phone: '', instagram_handle: '', how_did_you_hear: '',
  is_cottage_baker: false, cottage_permit_number: '', cottage_state_agreed: false, state: '', city: '', zip_code: '',
  specialties: [], dietary_tags: [], years_experience: '',
  serves_zip_codes: '', delivery_available: false, pickup_available: true, delivery_fee_range: '', minimum_order: '', rush_orders_available: false, rush_order_fee: '',
  days_available: [], lead_time_days: '7',
  starting_price: '', deposit_percentage: '50', custom_quote_required: true,
  bio: '', cancellation_policy: '', refund_policy: '', communication_preference: 'platform', agreed_to_terms: false
}

const STEPS = [
  'Basic Info', 'Your Setup', 'Your Craft', 'Service Area', 'Schedule', 'Pricing', 'Profile & Policies'
]

export default function Join() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<BakerData>(INITIAL_DATA)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function updateData(fields: Partial<BakerData>) {
    setData(prev => ({ ...prev, ...fields }))
  }

  function nextStep() {
    setStep(s => Math.min(s + 1, STEPS.length - 1))
    window.scrollTo(0, 0)
  }

  function prevStep() {
    setStep(s => Math.max(s - 1, 0))
    window.scrollTo(0, 0)
  }

  async function handleSubmit() {
    if (!data.agreed_to_terms) {
      setError('You must agree to the terms to continue.')
      return
    }
    setLoading(true)
    setError('')

    // Create auth account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { full_name: data.full_name, role: 'baker' } }
    })

    if (authError) { setError(authError.message); setLoading(false); return }

    // Create baker profile
    const { error: bakerError } = await supabase.from('bakers').insert({
      user_id: authData.user?.id,
      business_name: data.business_name,
      owner_name: data.full_name,
      email: data.email,
      phone: data.phone,
      instagram_handle: data.instagram_handle,
      how_did_you_hear: data.how_did_you_hear,
      is_cottage_baker: data.is_cottage_baker,
      cottage_permit_number: data.cottage_permit_number,
      cottage_state_agreed: data.cottage_state_agreed,
      city: data.city,
      state: data.state,
      zip_code: data.zip_code,
      specialties: data.specialties,
      dietary_tags: data.dietary_tags,
      years_experience: parseInt(data.years_experience) || 0,
      serves_zip_codes: data.serves_zip_codes.split(',').map(z => z.trim()).filter(Boolean),
      delivery_available: data.delivery_available,
      pickup_available: data.pickup_available,
      delivery_fee_range: data.delivery_fee_range,
      minimum_order: parseInt(data.minimum_order) || 0,
      rush_orders_available: data.rush_orders_available,
      rush_order_fee: data.rush_order_fee,
      days_available: data.days_available,
      lead_time_days: parseInt(data.lead_time_days) || 7,
      starting_price: parseInt(data.starting_price) || 0,
      deposit_percentage: parseInt(data.deposit_percentage) || 50,
      custom_quote_required: data.custom_quote_required,
      bio: data.bio,
      cancellation_policy: data.cancellation_policy,
      refund_policy: data.refund_policy,
      communication_preference: data.communication_preference,
      agreed_to_terms: data.agreed_to_terms,
      profile_complete: true,
      tier: 'free',
    })

    if (bakerError) { setError(bakerError.message); setLoading(false); return }

    router.push('/dashboard/baker')
  }

  return (
    <main className="min-h-screen py-12" style={{ backgroundColor: '#f5f0eb' }}>
      <div className="max-w-2xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold" style={{ color: '#2d1a0e' }}>🎂 Whiskly</Link>
          <p className="text-sm mt-2" style={{ color: '#5c3d2e' }}>Baker Application · Step {step + 1} of {STEPS.length}</p>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-1 mb-8">
          {STEPS.map((s, i) => (
            <div
              key={i}
              className="flex-1 h-2 rounded-full transition-all duration-300"
              style={{ backgroundColor: i <= step ? '#2d1a0e' : '#e0d5cc' }}
            />
          ))}
        </div>

        {/* Step Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: '#2d1a0e' }}>{STEPS[step]}</h1>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm text-red-700 bg-red-50 border border-red-200">{error}</div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          {step === 0 && <StepOne data={data} update={updateData} />}
          {step === 1 && <StepTwo data={data} update={updateData} />}
          {step === 2 && <StepThree data={data} update={updateData} />}
          {step === 3 && <StepFour data={data} update={updateData} />}
          {step === 4 && <StepFive data={data} update={updateData} />}
          {step === 5 && <StepSix data={data} update={updateData} />}
          {step === 6 && <StepSeven data={data} update={updateData} />}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            onClick={prevStep}
            className="px-6 py-3 rounded-xl border font-semibold text-sm"
            style={{ borderColor: '#2d1a0e', color: '#2d1a0e', visibility: step === 0 ? 'hidden' : 'visible' }}
          >
            ← Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={nextStep}
              className="px-6 py-3 rounded-xl text-white font-semibold text-sm"
              style={{ backgroundColor: '#2d1a0e' }}
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-3 rounded-xl text-white font-semibold text-sm"
              style={{ backgroundColor: '#2d1a0e', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Creating your profile...' : 'Launch My Profile 🎂'}
            </button>
          )}
        </div>

        {/* Sign in link */}
        <p className="text-center text-sm mt-6" style={{ color: '#5c3d2e' }}>
          Already have an account? <Link href="/login" className="font-semibold underline" style={{ color: '#2d1a0e' }}>Sign In</Link>
        </p>
      </div>
    </main>
  )
}