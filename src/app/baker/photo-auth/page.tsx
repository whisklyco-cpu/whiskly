'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Logo } from '@/components/Logo'

export default function PhotoAuthPage() {
  const router = useRouter()
  const [baker, setBaker] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(1) // 1 = process shots, 2 = affidavit
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Step 1: process shot uploads per category
  const [processShots, setProcessShots] = useState<Record<string, File | null>>({})
  const [processShotUploading, setProcessShotUploading] = useState<Record<string, boolean>>({})

  // Step 2: affidavit
  const [agreed, setAgreed] = useState(false)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: bakerData } = await supabase
        .from('bakers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!bakerData) { router.push('/login'); return }

      // If auth already completed, skip to dashboard
      if (bakerData.photo_auth_completed_at) {
        router.push('/dashboard/baker')
        return
      }

      // If auth not required, skip to dashboard
      if (!bakerData.photo_auth_required) {
        router.push('/dashboard/baker')
        return
      }

      setBaker(bakerData)
      // Init one slot per specialty
      const slots: Record<string, File | null> = {}
      const specialties: string[] = bakerData.specialties || ['General']
      specialties.forEach((s: string) => { slots[s] = null })
      setProcessShots(slots)
      setLoading(false)
    }
    init()
  }, [router])

  async function uploadProcessShot(specialty: string, file: File) {
    setProcessShotUploading(prev => ({ ...prev, [specialty]: true }))
    const ext = file.name.split('.').pop()
    const path = `photo-auth/${baker.id}/process-${specialty.replace(/\s+/g, '-').toLowerCase()}.${ext}`
    const { error: upErr } = await supabase.storage.from('baker-photos').upload(path, file, { upsert: true })
    if (upErr) {
      setError('Upload failed for ' + specialty + ': ' + upErr.message)
    } else {
      setProcessShots(prev => ({ ...prev, [specialty]: file }))
    }
    setProcessShotUploading(prev => ({ ...prev, [specialty]: false }))
  }

  async function handleComplete() {
    if (!agreed) return
    setSubmitting(true)
    setError('')

    const now = new Date().toISOString()
    const updates: any = {
      photo_auth_affidavit_signed_at: now,
      photo_auth_completed_at: now,
    }
    const { error: updateErr } = await supabase
      .from('bakers')
      .update(updates)
      .eq('id', baker.id)

    if (updateErr) {
      setError('Could not save. Please try again.')
      setSubmitting(false)
      return
    }

    router.push('/dashboard/baker')
  }

  const allProcessShotsUploaded = Object.values(processShots).every(v => v !== null)
  const totalSteps = 2

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f0eb' }}>
        <p className="text-sm" style={{ color: '#9c7b6b' }}>Loading...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#f5f0eb' }}>
      <nav className="bg-white shadow-sm px-6 py-4">
        <Logo size={28} />
      </nav>

      <div className="px-6 md:px-16 py-12" style={{ maxWidth: '720px', margin: '0 auto' }}>

        {/* Header */}
        <div className="mb-8">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4"
            style={{ backgroundColor: '#e8ddd4', color: '#2d1a0e' }}>
            Photo Authentication Required
          </div>
          <h1 className="text-2xl font-bold mb-3" style={{ color: '#2d1a0e' }}>
            Verify your work before going live
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: '#5c3d2e' }}>
            Whiskly is adding photo authentication as a Phase 1 requirement for all bakers. To stay listed on
            Whiskly, please complete the steps below. This protects you and Whiskly from photo theft. It takes
            about 10 minutes.
          </p>
        </div>

        {/* Step progress */}
        <div className="flex gap-2 mb-8">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  backgroundColor: s < step ? '#2d1a0e' : s === step ? '#8B4513' : '#e0d5cc',
                  color: s <= step ? 'white' : '#9c7b6b',
                }}>
                {s < step ? '✓' : s}
              </div>
              {s < totalSteps && <div className="w-8 h-0.5" style={{ backgroundColor: s < step ? '#2d1a0e' : '#e0d5cc' }} />}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm text-red-700 bg-red-50 border border-red-200">{error}</div>
        )}

        {/* STEP 1: Process shots */}
        {step === 1 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-lg font-bold mb-2" style={{ color: '#2d1a0e' }}>Step 1: Process shots</h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: '#5c3d2e' }}>
              Upload at least one process shot for each category you list. A process shot is any photo of the item
              being made: raw ingredients, you in your kitchen with the item, tools and partial components. Final
              product photos do not count.
            </p>
            <div className="flex flex-col gap-5">
              {Object.keys(processShots).map(specialty => (
                <div key={specialty}>
                  <p className="text-sm font-semibold mb-2" style={{ color: '#2d1a0e' }}>{specialty}</p>
                  {processShots[specialty] ? (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac' }}>
                      <span style={{ color: '#166534' }}>✓</span>
                      <span style={{ color: '#166534' }}>{processShots[specialty]!.name}</span>
                      <button
                        className="ml-auto text-xs underline"
                        style={{ color: '#5c3d2e' }}
                        onClick={() => setProcessShots(prev => ({ ...prev, [specialty]: null }))}
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <label className="block">
                      <div className="px-4 py-3 rounded-xl text-sm text-center cursor-pointer border-2 border-dashed" style={{ borderColor: '#e0d5cc', color: '#9c7b6b' }}>
                        {processShotUploading[specialty] ? 'Uploading…' : 'Click to upload a process shot'}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={processShotUploading[specialty]}
                        onChange={e => e.target.files?.[0] && uploadProcessShot(specialty, e.target.files[0])}
                      />
                    </label>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!allProcessShotsUploaded}
              className="mt-8 w-full py-3 rounded-xl font-semibold text-sm text-white"
              style={{ backgroundColor: allProcessShotsUploaded ? '#2d1a0e' : '#c4a882', cursor: allProcessShotsUploaded ? 'pointer' : 'not-allowed' }}
            >
              Continue
            </button>
          </div>
        )}

        {/* STEP 2: Affidavit */}
        {step === 2 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-lg font-bold mb-4" style={{ color: '#2d1a0e' }}>
              Step 2: Confirm your work
            </h2>
            <div className="rounded-xl p-5 mb-6 text-sm leading-relaxed" style={{ backgroundColor: '#faf8f6', border: '1px solid #e0d5cc', color: '#5c3d2e' }}>
              I confirm that all photos uploaded to my Whiskly profile are of work I personally created. I
              understand that submitting stolen or misrepresented work is grounds for immediate account suspension
              and forfeiture of any earnings.
            </div>
            <label className="flex items-start gap-3 cursor-pointer mb-8">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 flex-shrink-0"
              />
              <span className="text-sm font-semibold" style={{ color: '#2d1a0e' }}>I agree.</span>
            </label>
            <button
              onClick={handleComplete}
              disabled={!agreed || submitting}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white"
              style={{ backgroundColor: agreed ? '#2d1a0e' : '#c4a882', cursor: agreed ? 'pointer' : 'not-allowed' }}
            >
              {submitting ? 'Saving…' : 'Complete Verification'}
            </button>
          </div>
        )}

      </div>
    </main>
  )
}
