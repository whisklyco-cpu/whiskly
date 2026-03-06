'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
  city: string
  state: string
  zip_code: string
  is_cottage_baker: boolean | null
  cottage_permit_number: string
  cottage_state_agreed: boolean
  business_address?: string
  ein_number?: string
  verification_file?: File
  verification_file_name?: string

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
  communication_preference: string
  agreed_to_terms: boolean
}

const INITIAL_DATA: BakerData = {
  full_name: '',
  business_name: '',
  email: '',
  password: '',
  phone: '',
  instagram_handle: '',
  how_did_you_hear: '',
  city: '',
  state: '',
  zip_code: '',
  is_cottage_baker: null,
  cottage_permit_number: '',
  cottage_state_agreed: false,
  business_address: '',
  ein_number: '',
  verification_file: undefined,
  verification_file_name: '',
  specialties: [],
  dietary_tags: [],
  years_experience: '',
  serves_zip_codes: '',
  delivery_available: false,
  pickup_available: true,
  delivery_fee_range: '',
  minimum_order: '',
  rush_orders_available: false,
  rush_order_fee: '',
  days_available: [],
  lead_time_days: '7',
  starting_price: '',
  deposit_percentage: '50',
  custom_quote_required: false,
  bio: '',
  cancellation_policy: '',
  communication_preference: 'platform',
  agreed_to_terms: false,
}

export default function JoinPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [bakerData, setBakerData] = useState<BakerData>(INITIAL_DATA)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const TOTAL_STEPS = 7

  function update(fields: Partial<BakerData>) {
    setBakerData(prev => ({ ...prev, ...fields }))
  }

  function nextStep() {
  setError('')

  if (step === 1) {
    if (!bakerData.full_name) { setError('Please enter your full name.'); return }
    if (!bakerData.business_name) { setError('Please enter your business name.'); return }
    if (!bakerData.email) { setError('Please enter your email.'); return }
    if (!bakerData.password || bakerData.password.length < 6) { setError('Password must be at least 6 characters.'); return }
  }

  if (step === 2) {
    if (!bakerData.city) { setError('Please enter your city.'); return }
    if (!bakerData.state) { setError('Please select your state.'); return }
    if (!bakerData.zip_code) { setError('Please enter your ZIP code.'); return }
    if (bakerData.is_cottage_baker === null) { setError('Please select your baker type.'); return }
    if (bakerData.is_cottage_baker && !bakerData.cottage_state_agreed) { setError('Please confirm you have read your state cottage food laws.'); return }
    if (bakerData.is_cottage_baker === false && !(bakerData as any).business_address) { setError('Please enter your business address.'); return }
    if (bakerData.is_cottage_baker === false && !(bakerData as any).verification_file) { setError('Please upload proof of your business (license, EIN, or health permit).'); return }
  }

  if (step === 3) {
    if (bakerData.specialties.length === 0) { setError('Please select at least one specialty.'); return }
  }

  if (step === 4) {
    if (!bakerData.delivery_available && !bakerData.pickup_available) { setError('Please select at least one fulfillment option (delivery or pickup).'); return }
  }

  if (step === 5) {
    if (bakerData.days_available.length === 0) { setError('Please select at least one day you are available.'); return }
    if (!bakerData.lead_time_days) { setError('Please select your lead time.'); return }
  }

  if (step === 6) {
    if (!bakerData.starting_price) { setError('Please enter your starting price.'); return }
  }

  setStep(s => Math.min(s + 1, TOTAL_STEPS))
  window.scrollTo(0, 0)
}

  function prevStep() {
    setStep(s => Math.max(s - 1, 1))
    window.scrollTo(0, 0)
  }

  async function handleSubmit() {
    if (!bakerData.agreed_to_terms) {
  setError('Please agree to the Whiskly Seller Terms to continue.')
  return
}
if (!bakerData.bio) {
  setError('Please write a short bio before submitting.')
  return
}
    setLoading(true)
    setError('')

    // Create auth account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: bakerData.email,
      password: bakerData.password,
      options: { data: { full_name: bakerData.full_name, role: 'baker' } }
    })

    if (authError) { setError(authError.message); setLoading(false); return }

    // Upload verification doc if storefront baker
    let verification_file_url = null
    if (!bakerData.is_cottage_baker && bakerData.verification_file) {
      const file = bakerData.verification_file
      const fileExt = file.name.split('.').pop()
      const fileName = Date.now() + '-verification.' + fileExt

      const { error: uploadError } = await supabase.storage
        .from('verification-docs')
        .upload(fileName, file)

      if (!uploadError) {
        verification_file_url = fileName
      }
    }

    // Create baker profile
    const { error: bakerError } = await supabase.from('bakers').insert({
      user_id: authData.user?.id,
      full_name: bakerData.full_name,
      business_name: bakerData.business_name,
      email: bakerData.email,
      phone: bakerData.phone,
      instagram_handle: bakerData.instagram_handle,
      how_did_you_hear: bakerData.how_did_you_hear,
      city: bakerData.city,
      state: bakerData.state,
      zip_code: bakerData.zip_code,
      is_cottage_baker: bakerData.is_cottage_baker,
      cottage_permit_number: bakerData.cottage_permit_number,
      cottage_state_agreed: bakerData.cottage_state_agreed,
      business_address: bakerData.business_address || null,
      ein_number: bakerData.ein_number || null,
      verification_file_url,
      verification_status: !bakerData.is_cottage_baker ? 'pending' : 'unverified',
      specialties: bakerData.specialties,
      dietary_tags: bakerData.dietary_tags,
      years_experience: bakerData.years_experience,
      serves_zip_codes: bakerData.serves_zip_codes,
      delivery_available: bakerData.delivery_available,
      pickup_available: bakerData.pickup_available,
      delivery_fee_range: bakerData.delivery_fee_range,
      minimum_order: parseInt(bakerData.minimum_order) || null,
      rush_orders_available: bakerData.rush_orders_available,
      rush_order_fee: bakerData.rush_order_fee,
      days_available: bakerData.days_available,
      lead_time_days: parseInt(bakerData.lead_time_days) || 7,
      starting_price: parseInt(bakerData.starting_price) || null,
      deposit_percentage: parseInt(bakerData.deposit_percentage) || 50,
      custom_quote_required: bakerData.custom_quote_required,
      bio: bakerData.bio,
      cancellation_policy: bakerData.cancellation_policy,
      communication_preference: bakerData.communication_preference,
      agreed_to_terms: bakerData.agreed_to_terms,
      is_active: true,
      profile_complete: true,
      tier: 'free',
    })

    if (bakerError) { setError(bakerError.message); setLoading(false); return }

    router.push('/dashboard/baker')
  }

  const steps = [
    <StepOne key={1} data={bakerData} update={update} />,
    <StepTwo key={2} data={bakerData} update={update} />,
    <StepThree key={3} data={bakerData} update={update} />,
    <StepFour key={4} data={bakerData} update={update} />,
    <StepFive key={5} data={bakerData} update={update} />,
    <StepSix key={6} data={bakerData} update={update} />,
    <StepSeven key={7} data={bakerData} update={update} />,
  ]

  const stepTitles = [
    'Basic Info',
    'Your Setup',
    'Your Craft',
    'Service Area',
    'Schedule',
    'Pricing',
    'Profile & Policies',
  ]

  return (
    <main className="min-h-screen py-12" style={{ backgroundColor: '#f5f0eb' }}>
      <div className="max-w-xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold" style={{ color: '#2d1a0e' }}>🎂 Whiskly</Link>
          <p className="text-sm mt-1" style={{ color: '#5c3d2e' }}>Baker Application · Step {step} of {TOTAL_STEPS}</p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1 mb-8">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className="flex-1 h-2 rounded-full transition-all duration-300"
              style={{ backgroundColor: i < step ? '#2d1a0e' : '#e0d5cc' }} />
          ))}
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm text-red-700 bg-red-50 border border-red-200">{error}</div>
        )}

        {/* Step title */}
        <h2 className="text-2xl font-bold mb-6" style={{ color: '#2d1a0e' }}>{stepTitles[step - 1]}</h2>

        {/* Step content */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-6">
          {steps[step - 1]}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          {step > 1 ? (
            <button onClick={prevStep} className="px-6 py-3 rounded-xl border font-semibold text-sm"
              style={{ borderColor: '#2d1a0e', color: '#2d1a0e' }}>
              ← Back
            </button>
          ) : <div />}

          {step < TOTAL_STEPS ? (
            <button onClick={nextStep} className="px-6 py-3 rounded-xl text-white font-semibold text-sm"
              style={{ backgroundColor: '#2d1a0e' }}>
              Continue →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading}
              className="px-6 py-3 rounded-xl text-white font-semibold text-sm"
              style={{ backgroundColor: '#2d1a0e', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Creating your profile...' : 'Launch My Profile 🎂'}
            </button>
          )}
        </div>

        <p className="text-center text-sm mt-6" style={{ color: '#5c3d2e' }}>
          Already have an account?{' '}
          <Link href="/login" className="font-semibold underline" style={{ color: '#2d1a0e' }}>Sign In</Link>
        </p>
      </div>
    </main>
  )
}