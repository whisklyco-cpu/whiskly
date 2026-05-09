'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

// ── Types ──────────────────────────────────────────────────────────────────────

interface EvidenceContext {
  order_id: string
  submitted_by: 'customer' | 'baker'
  token_expires_at: string
  already_submitted: boolean
  event_type: string
  event_date: string
  baker_name: string
}

// ── Countdown hook ─────────────────────────────────────────────────────────────

function computeCountdownLabel(expiresAt: string): string {
  const remaining = new Date(expiresAt).getTime() - Date.now()
  if (remaining <= 0) return 'Expired'
  const h = Math.floor(remaining / (1000 * 60 * 60))
  const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
  return `${h}h ${m}m remaining`
}

function useCountdown(expiresAt: string | null) {
  const [label, setLabel] = useState(() => expiresAt ? computeCountdownLabel(expiresAt) : '')

  useEffect(() => {
    if (!expiresAt) return
    setLabel(computeCountdownLabel(expiresAt))
    const id = setInterval(() => setLabel(computeCountdownLabel(expiresAt)), 60_000)
    return () => clearInterval(id)
  }, [expiresAt])

  return label
}

// ── Main form ─────────────────────────────────────────────────────────────────

function EvidenceForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [pageState, setPageState] = useState<'loading' | 'valid' | 'expired' | 'already_submitted' | 'done' | 'invalid'>('loading')
  const [ctx, setCtx] = useState<EvidenceContext | null>(null)
  const [statement, setStatement] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const timeLeft = useCountdown(ctx?.token_expires_at ?? null)

  useEffect(() => {
    if (!token) { setPageState('invalid'); return }
    fetch(`/api/disputes/evidence?token=${encodeURIComponent(token)}`)
      .then(async res => {
        if (res.status === 410) { setPageState('expired'); return }
        if (!res.ok) { setPageState('invalid'); return }
        const data: EvidenceContext = await res.json()
        if (data.already_submitted) { setPageState('already_submitted'); return }
        setCtx(data)
        setPageState('valid')
      })
      .catch(() => setPageState('invalid'))
  }, [token])

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, 3)
    setPhotos(prev => [...prev, ...files].slice(0, 3))
    e.target.value = ''
  }

  function removePhoto(i: number) {
    setPhotos(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (statement.trim().length < 20) {
      setSubmitError('Please write at least 20 characters.')
      return
    }
    setSubmitting(true)
    setSubmitError('')

    const photoUrls: string[] = []

    if (photos.length > 0) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
      for (const photo of photos) {
        const ext = photo.name.split('.').pop() || 'jpg'
        const path = `${token}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { data } = await supabase.storage
          .from('dispute-evidence')
          .upload(path, photo, { upsert: true })
        if (data) {
          const { data: { publicUrl } } = supabase.storage
            .from('dispute-evidence')
            .getPublicUrl(path)
          photoUrls.push(publicUrl)
        }
      }
    }

    try {
      const res = await fetch('/api/disputes/evidence/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, statement: statement.trim(), photo_urls: photoUrls }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submission failed')
      setPageState('done')
    } catch (err: any) {
      setSubmitError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#f5f0eb',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '48px 16px',
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '40px 36px',
    maxWidth: '560px',
    width: '100%',
    boxShadow: '0 4px 24px rgba(45,26,14,0.08)',
    border: '1px solid #e0d5cc',
  }

  if (pageState === 'loading') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <p style={{ color: '#9c7b6b', fontSize: 14 }}>Loading…</p>
        </div>
      </div>
    )
  }

  if (pageState === 'expired') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <p style={{ fontSize: 20, fontWeight: 700, color: '#2d1a0e', fontFamily: 'Georgia, serif', marginBottom: 12 }}>Link Expired</p>
          <p style={{ fontSize: 14, color: '#5c3d2e', lineHeight: 1.6 }}>
            This link has expired. If you still need to submit evidence, contact{' '}
            <a href="mailto:support@whiskly.co" style={{ color: '#8B4513' }}>support@whiskly.co</a>.
          </p>
        </div>
      </div>
    )
  }

  if (pageState === 'already_submitted') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <p style={{ fontSize: 20, fontWeight: 700, color: '#2d1a0e', fontFamily: 'Georgia, serif', marginBottom: 12 }}>Already Submitted</p>
          <p style={{ fontSize: 14, color: '#5c3d2e', lineHeight: 1.6 }}>
            You have already submitted your evidence for this dispute. We will notify you of our decision within 3 business days.
          </p>
        </div>
      </div>
    )
  }

  if (pageState === 'invalid') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <p style={{ fontSize: 20, fontWeight: 700, color: '#2d1a0e', fontFamily: 'Georgia, serif', marginBottom: 12 }}>Invalid Link</p>
          <p style={{ fontSize: 14, color: '#5c3d2e', lineHeight: 1.6 }}>
            This link is not valid. If you believe this is an error, contact{' '}
            <a href="mailto:support@whiskly.co" style={{ color: '#8B4513' }}>support@whiskly.co</a>.
          </p>
        </div>
      </div>
    )
  }

  if (pageState === 'done') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ backgroundColor: '#dcfce7', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#166534', margin: 0 }}>Statement received</p>
          </div>
          <p style={{ fontSize: 14, color: '#5c3d2e', lineHeight: 1.6 }}>
            Your statement has been received. We will notify you of our decision within 3 business days.
          </p>
        </div>
      </div>
    )
  }

  // pageState === 'valid'
  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* Header */}
        <p style={{ fontSize: 22, fontWeight: 700, color: '#2d1a0e', fontFamily: 'Georgia, serif', margin: '0 0 4px' }}>
          Submit Your Evidence
        </p>
        <p style={{ fontSize: 13, color: '#9c7b6b', margin: '0 0 20px' }}>
          {ctx?.event_type} order{ctx?.baker_name ? ` · ${ctx.baker_name}` : ''}
          {ctx?.event_date ? ` · ${ctx.event_date}` : ''}
        </p>

        {/* Deadline */}
        <div style={{ backgroundColor: '#fff7ed', borderRadius: 10, padding: '10px 14px', marginBottom: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#854d0e', margin: 0 }}>{timeLeft}</p>
          <p style={{ fontSize: 12, color: '#92400e', margin: '2px 0 0' }}>
            Deadline: {ctx ? new Date(ctx.token_expires_at).toLocaleString() : ''}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Statement */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#2d1a0e', marginBottom: 6 }}>
              Your statement <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <p style={{ fontSize: 12, color: '#9c7b6b', margin: '0 0 8px' }}>
              Describe what happened in your own words. Be as specific as possible — dates, times, what was agreed, what went wrong.
            </p>
            <textarea
              value={statement}
              onChange={e => setStatement(e.target.value)}
              rows={8}
              required
              placeholder="e.g. I placed my order on March 5th for a wedding cake. The baker confirmed the order but never showed up on the delivery date…"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 10,
                border: `1px solid ${statement.trim().length >= 20 ? '#bbf7d0' : '#e0d5cc'}`,
                fontSize: 13,
                color: '#2d1a0e',
                backgroundColor: '#faf8f6',
                resize: 'vertical',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                lineHeight: 1.6,
              }}
            />
            <p style={{ fontSize: 11, color: statement.trim().length >= 20 ? '#166534' : '#9c7b6b', margin: '4px 0 0' }}>
              {statement.trim().length} / 20 characters minimum
            </p>
          </div>

          {/* Photos */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#2d1a0e', marginBottom: 6 }}>
              Supporting photos <span style={{ fontSize: 11, fontWeight: 400, color: '#9c7b6b' }}>(optional, up to 3)</span>
            </label>
            <p style={{ fontSize: 12, color: '#9c7b6b', margin: '0 0 10px' }}>
              Upload photos that support your statement — delivery photos, messages, receipts, etc.
            </p>

            {photos.length < 3 && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px dashed #e0d5cc',
                  backgroundColor: '#faf8f6',
                  color: '#5c3d2e',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                + Add photo
              </button>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={handlePhotoChange}
            />

            {photos.length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                {photos.map((f, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img
                      src={URL.createObjectURL(f)}
                      alt={`photo ${i + 1}`}
                      style={{ width: 72, height: 72, borderRadius: 8, objectFit: 'cover', border: '1px solid #e0d5cc' }}
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      style={{
                        position: 'absolute',
                        top: -6,
                        right: -6,
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        backgroundColor: '#dc2626',
                        color: 'white',
                        border: 'none',
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {submitError && (
            <p style={{ fontSize: 13, color: '#dc2626', marginBottom: 12 }}>{submitError}</p>
          )}

          <button
            type="submit"
            disabled={submitting || statement.trim().length < 20}
            style={{
              width: '100%',
              padding: '14px 0',
              borderRadius: 12,
              backgroundColor: '#2d1a0e',
              color: 'white',
              fontSize: 14,
              fontWeight: 700,
              border: 'none',
              cursor: submitting || statement.trim().length < 20 ? 'not-allowed' : 'pointer',
              opacity: submitting || statement.trim().length < 20 ? 0.5 : 1,
              fontFamily: 'inherit',
            }}
          >
            {submitting ? 'Submitting…' : 'Submit My Statement'}
          </button>
        </form>

        <p style={{ fontSize: 11, color: '#9c7b6b', textAlign: 'center', marginTop: 16 }}>
          Questions?{' '}
          <a href="mailto:support@whiskly.co" style={{ color: '#8B4513' }}>support@whiskly.co</a>
        </p>
      </div>
    </div>
  )
}

// ── Page export ───────────────────────────────────────────────────────────────

export default function EvidencePage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', backgroundColor: '#f5f0eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#9c7b6b', fontSize: 14 }}>Loading…</p>
        </div>
      }
    >
      <EvidenceForm />
    </Suspense>
  )
}
