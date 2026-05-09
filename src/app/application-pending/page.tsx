'use client'

import Link from 'next/link'
import WhisklyLogo from '@/components/WhisklyLogo'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ApplicationPendingPage() {
  const router = useRouter()
  const [businessName, setBusinessName] = useState('')
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function checkStatus() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: baker } = await supabase
        .from('bakers')
        .select('id, business_name, is_active')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!baker) {
        // No baker record — send them to start the application
        router.push('/join')
        return
      }
      if (baker.is_active) {
        // Already approved — send to dashboard
        router.push('/dashboard/baker')
        return
      }
      setBusinessName(baker.business_name || '')
      setChecking(false)
    }
    checkStatus()
  }, [router])

  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f0eb' }}>
        <div className="w-4 h-4 rounded-full animate-pulse" style={{ backgroundColor: '#2d1a0e' }} />
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-5" style={{ backgroundColor: '#f5f0eb' }}>
      <div className="w-full max-w-lg text-center">

        <div className="mb-8">
          <Link href="/"><WhisklyLogo variant="horizontal" size="md" /></Link>
        </div>

        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: '#e8ddd4' }}>
            <span className="text-3xl">🎂</span>
          </div>

          <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4"
            style={{ backgroundColor: '#e8ddd4', color: '#2d1a0e' }}>
            Application Received
          </div>

          <h1 className="text-2xl font-bold mb-3" style={{ color: '#2d1a0e', letterSpacing: '-0.01em' }}>
            Your application is under review
          </h1>

          <p className="text-sm leading-relaxed mb-6" style={{ color: '#5c3d2e' }}>
            {businessName ? `Thanks, ${businessName}!` : 'Thanks!'} We received your baker application and our team is reviewing it.
            We hand-select every baker on Whiskly, so this usually takes <strong>1–3 business days</strong>.
          </p>

          <div className="rounded-xl p-5 mb-6 text-left" style={{ backgroundColor: '#faf8f6', border: '1px solid #e0d5cc' }}>
            <p className="text-sm font-semibold mb-3" style={{ color: '#2d1a0e' }}>What happens next:</p>
            <ol className="flex flex-col gap-2.5">
              {[
                'Our team reviews your application and profile details.',
                'You\'ll receive an email at your registered address when approved.',
                'Once approved, sign in to access your full baker dashboard.',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm" style={{ color: '#5c3d2e' }}>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 text-white"
                    style={{ backgroundColor: '#2d1a0e' }}>{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <p className="text-xs mb-6" style={{ color: '#5c3d2e' }}>
            Questions? Email us at{' '}
            <a href="mailto:support@whiskly.co" className="font-semibold underline" style={{ color: '#8B4513' }}>
              support@whiskly.co
            </a>
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/bakers"
              className="px-6 py-3 rounded-xl font-semibold text-sm border"
              style={{ borderColor: '#2d1a0e', color: '#2d1a0e' }}>
              Browse Bakers
            </Link>
            <Link href="/"
              className="px-6 py-3 rounded-xl font-semibold text-sm text-white"
              style={{ backgroundColor: '#2d1a0e' }}>
              Back to Home
            </Link>
          </div>
        </div>

        <p className="text-xs mt-6" style={{ color: '#5c3d2e' }}>
          © 2026 Whiskly · <a href="mailto:support@whiskly.co" className="underline">support@whiskly.co</a>
        </p>
      </div>
    </main>
  )
}
