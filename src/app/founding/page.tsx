import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { Logo } from '@/components/Logo'

export default function FoundingPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: '#f5f0eb' }}>
      <Navbar />

      {/* SECTION 1: HERO */}
      <section className="px-6 md:px-16 py-20 md:py-28" style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div className="max-w-3xl">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-6"
            style={{ backgroundColor: '#e8ddd4', color: '#2d1a0e' }}>
            Founding Baker Program
          </div>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6"
            style={{ color: '#2d1a0e', letterSpacing: '-0.02em' }}>
            You helped build Whiskly. Your badge, your status, and your place in the story are permanent.{' '}
            <span style={{ color: '#8B4513' }}>Your rates are locked in for three years.</span>
          </h1>
          <p className="text-lg mb-10 leading-relaxed max-w-2xl" style={{ color: '#5c3d2e' }}>
            The first 50 bakers who join Whiskly receive permanent pricing, exclusive status, and a direct
            relationship with the founder. This offer will never be made again.
          </p>
          <div className="flex gap-4 flex-wrap">
            <Link href="/join?source=founding"
              className="px-8 py-4 rounded-xl text-white font-semibold"
              style={{ backgroundColor: '#8B4513' }}>
              Apply Now
            </Link>
            <a href="#benefits"
              className="px-8 py-4 rounded-xl font-semibold border"
              style={{ borderColor: '#2d1a0e', color: '#2d1a0e' }}>
              See What&apos;s Included
            </a>
          </div>
        </div>
      </section>

      {/* SECTION 2: HOW IT WORKS — THREE REQUIREMENTS */}
      <section className="py-20" style={{ backgroundColor: '#2d1a0e' }}>
        <div className="px-6 md:px-16" style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#8B4513' }}>Earn it</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ letterSpacing: '-0.02em' }}>
            How a baker earns Founding status
          </h2>
          <p className="text-base mb-12 max-w-2xl" style={{ color: '#c4a882' }}>
            Founding status is earned, not granted on signup. A baker must meet all three requirements below.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              {
                num: '01',
                title: 'Apply and be personally approved by the founder.',
                body: 'Every application is individually reviewed. Bakers we already know face a lighter bar. New bakers need to show real custom-order work: portfolio photos, social presence, and proof of past custom orders.',
              },
              {
                num: '02',
                title: 'Complete your Whiskly profile to 100%.',
                body: 'Bio, specialties, pricing, service area, lead time, payment settings, and minimum required portfolio photos with at least one process shot per category.',
              },
              {
                num: '03',
                title: 'Accept and complete a first order within 45 days of approval.',
                body: 'The clock starts at approval. 45 days is generous but firm.',
              },
            ].map((req) => (
              <div key={req.num} className="rounded-2xl p-8" style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-3xl font-bold mb-4" style={{ color: '#8B4513' }}>{req.num}</p>
                <p className="font-bold text-white mb-3 leading-snug">{req.title}</p>
                <p className="text-sm leading-relaxed" style={{ color: '#c4a882' }}>{req.body}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl p-6" style={{ backgroundColor: 'rgba(139,69,19,0.15)', border: '1px solid rgba(139,69,19,0.3)' }}>
            <p className="text-sm leading-relaxed" style={{ color: '#f5e6d3' }}>
              <span className="font-semibold text-white">Numbers are assigned in order of completion, not application.</span>{' '}
              The first baker to apply, get approved, complete their profile, and fulfill a first order receives Baker #1.
              The first to apply does not automatically receive #1.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3: COMPARISON TABLE */}
      <section className="py-20" style={{ backgroundColor: 'white' }}>
        <div className="px-6 md:px-16" style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#8B4513' }}>Compare</p>
          <h2 className="text-3xl font-bold mb-4" style={{ color: '#2d1a0e', letterSpacing: '-0.02em' }}>
            Free versus Founding: the core difference
          </h2>
          <div className="overflow-x-auto mt-8">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ borderBottom: '2px solid #e0d5cc' }}>
                  <th className="text-left py-4 px-5 font-semibold w-1/2" style={{ color: '#5c3d2e' }}></th>
                  <th className="text-center py-4 px-5 font-semibold" style={{ color: '#5c3d2e' }}>Free</th>
                  <th className="text-center py-4 px-5 font-bold rounded-t-xl" style={{ color: 'white', backgroundColor: '#2d1a0e' }}>Founding</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Commission (Phase 2+)', '10%', '7% locked'],
                  ['Monthly price', '$0', '$14 locked'],
                  ['Annual price', '$0', '$99 locked'],
                  ['Free trial', '—', '30 days'],
                  ['Portfolio photos', '6–10', '6–50'],
                  ['Featured / hero photos', '1', '3'],
                  ['Spots available', 'Unlimited', 'First 50 only'],
                  ['Verified Original Work badge', 'No', 'Yes'],
                  ['Founding badge + number', 'No', 'Yes'],
                  ['Priority search placement', 'No', 'First 12 months'],
                ].map(([label, free, founding], i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f5f0eb', backgroundColor: i % 2 === 0 ? '#faf8f6' : 'white' }}>
                    <td className="py-3.5 px-5 font-medium" style={{ color: '#2d1a0e' }}>{label}</td>
                    <td className="py-3.5 px-5 text-center" style={{ color: '#5c3d2e' }}>{free}</td>
                    <td className="py-3.5 px-5 text-center font-semibold" style={{ color: '#2d1a0e', backgroundColor: founding === 'No' ? 'transparent' : '#fff7ed' }}>{founding}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-8 text-sm leading-relaxed max-w-2xl" style={{ color: '#5c3d2e' }}>
            The Free tier is available to any baker, forever, at standard rates. Founding is the first 50
            only, with a permanent Founding Baker badge and rates locked for three years. A standard paid tier for
            bakers 51+ will be announced separately. If Whiskly raises pricing during those three years, founding
            bakers are not affected.
          </p>
        </div>
      </section>

      {/* SECTION 4: BENEFITS */}
      <section id="benefits" className="py-20" style={{ backgroundColor: '#f5f0eb' }}>
        <div className="px-6 md:px-16" style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#8B4513' }}>What you get</p>
          <h2 className="text-3xl font-bold mb-12" style={{ color: '#2d1a0e', letterSpacing: '-0.02em' }}>
            What founding bakers receive
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Financial */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#8B4513' }}>Financial</p>
              <ul className="flex flex-col gap-3">
                {[
                  '7% commission rate, locked for 3 years',
                  '$14/month or $99/year, locked for 3 years',
                  '30-day free trial',
                ].map((b, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-white" style={{ backgroundColor: '#8B4513' }}>✓</span>
                    <p className="text-sm leading-relaxed" style={{ color: '#5c3d2e' }}>{b}</p>
                  </li>
                ))}
              </ul>
            </div>
            {/* Status and visibility */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#8B4513' }}>Status &amp; visibility</p>
              <ul className="flex flex-col gap-3">
                {[
                  'Founding Baker badge permanently on your profile',
                  'A founding baker number from 1 to 50, displayed alongside the badge',
                  'Verified Original Work badge, earned through enhanced photo authentication',
                  'Listed by name and specialty on the permanent Meet Our Founding Bakers page',
                  'Priority placement in search results — first 12 months',
                  'Named in Whiskly press coverage and investor materials',
                ].map((b, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-white" style={{ backgroundColor: '#8B4513' }}>✓</span>
                    <p className="text-sm leading-relaxed" style={{ color: '#5c3d2e' }}>{b}</p>
                  </li>
                ))}
              </ul>
            </div>
            {/* Access and relationship */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#8B4513' }}>Access &amp; relationship</p>
              <ul className="flex flex-col gap-3">
                {[
                  'Early access to every new platform feature before Pro and Free bakers',
                  'A direct founding baker group chat with the founder',
                  'A personal 30-minute onboarding call with the founder',
                  'First access to corporate, business, and bulk orders before they open to the general baker pool',
                ].map((b, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-white" style={{ backgroundColor: '#8B4513' }}>✓</span>
                    <p className="text-sm leading-relaxed" style={{ color: '#5c3d2e' }}>{b}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Welcome kit callout */}
          <div className="rounded-2xl p-8" style={{ backgroundColor: '#2d1a0e' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#8B4513' }}>Welcome kit</p>
            <p className="text-base leading-relaxed" style={{ color: '#c4a882' }}>
              Every founding baker receives a digital welcome kit on day one at no cost: a high-quality Founding Baker
              badge image for social media, custom Instagram story templates, a printable certificate, an email
              signature graphic, and social post templates for announcing their first Whiskly order. Physical
              merchandise will follow within the first 12 months.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 5: COMMITMENTS */}
      <section className="py-20" style={{ backgroundColor: 'white' }}>
        <div className="px-6 md:px-16" style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#8B4513' }}>Your side</p>
            <h2 className="text-3xl font-bold mb-4" style={{ color: '#2d1a0e', letterSpacing: '-0.02em' }}>
              What founding bakers commit to
            </h2>
            <p className="text-base mb-8 leading-relaxed" style={{ color: '#5c3d2e' }}>
              Founding status is a two-way relationship. In exchange for the benefits above, founding bakers agree to:
            </p>
            <div className="bg-white rounded-2xl p-8 shadow-sm border flex flex-col gap-4" style={{ borderColor: '#e0d5cc' }}>
              {[
                'Keep their profile active and in good standing for at least 12 months after approval',
                'Respond to new order requests within 48 hours',
                'Provide honest feedback on the platform during the founding period',
                'Share their Whiskly profile with their existing customer base within 30 days of approval',
              ].map((c, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-white" style={{ backgroundColor: '#2d1a0e' }}>✓</span>
                  <p className="text-sm leading-relaxed" style={{ color: '#5c3d2e' }}>{c}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: FINAL CTA */}
      <section className="px-6 md:px-16 py-20" style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: '#2d1a0e' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#8B4513' }}>First 50 only</p>
          <h2 className="text-3xl font-bold text-white mb-4" style={{ letterSpacing: '-0.02em' }}>
            Get in early. Lock it in forever.
          </h2>
          <p className="text-sm mb-8 max-w-xl mx-auto leading-relaxed" style={{ color: '#c4a882' }}>
            There is no time limit on this program. Founding spots remain open until all 50 are filled. The status is
            about being among the first 50, not about a deadline. But once it is filled, it is closed forever.
          </p>
          <Link href="/join?source=founding"
            className="inline-block px-10 py-4 rounded-xl font-semibold text-sm"
            style={{ backgroundColor: '#8B4513', color: 'white' }}>
            Apply Now
          </Link>
        </div>
      </section>

      <footer className="px-6 md:px-16 py-12" style={{ backgroundColor: '#2d1a0e' }}>
        <div className="flex flex-col md:flex-row justify-between gap-8 mb-8" style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div className="max-w-xs">
            <div className="mb-2"><Logo size={32} linked={false} className="text-[#f5f0eb]" /></div>
            <p className="text-sm" style={{ color: '#c4a882' }}>Book bakers with confidence. Clear pricing. Structured booking.</p>
          </div>
          <div className="flex gap-16 text-sm">
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
                <Link href="/founding">Founding Program</Link>
                <Link href="/join">Apply as a Baker</Link>
              </div>
            </div>
            <div>
              <p className="font-semibold text-white mb-3">Legal</p>
              <div className="flex flex-col gap-2" style={{ color: '#c4a882' }}>
                <Link href="/terms">Terms of Service</Link>
                <Link href="/privacy">Privacy Policy</Link>
                <Link href="/faq">FAQ</Link>
              </div>
            </div>
          </div>
        </div>
        <p className="text-sm border-t pt-6" style={{ color: '#c4a882', borderColor: '#4a2e1a', maxWidth: '1280px', margin: '0 auto' }}>
          © 2026 Whiskly. All rights reserved. · Early Access · <a href="mailto:support@whiskly.co" className="underline">support@whiskly.co</a>
        </p>
      </footer>
    </main>
  )
}
