'use client'

import Link from 'next/link'
import WhisklyLogo from '@/components/WhisklyLogo'
import Navbar from '@/components/Navbar'

const sections = [
  {
    title: '1. Information We Collect',
    content: `We collect the following types of information when you use Whiskly:

Account Information: When you create an account, we collect your name, email address, and password. Bakers may also provide a business name, location, specialties, pricing, and profile photos.

Order Information: When you place or fulfill an order, we collect details about the order including event type, event date, budget, item description, delivery address, and any inspiration photos you upload.

Payment Information: Payments are processed through Stripe. Whiskly does not store your full payment card details. We receive limited transaction data from Stripe including the last four digits of your card and transaction amounts.

Communications: We store messages sent between customers and bakers through the Platform in order to facilitate order management and dispute resolution.

Usage Data: We may collect information about how you use the Platform, including pages visited, features used, and actions taken.`
  },
  {
    title: '2. How We Use Your Information',
    content: `We use the information we collect to:

- Create and manage your account
- Facilitate transactions between customers and bakers
- Send order-related notifications and reminders
- Respond to customer support requests
- Improve the Platform and develop new features
- Enforce our Terms of Service
- Comply with legal obligations

If you are a baker on the Pro tier, we may use your profile information for marketing purposes including featuring your profile in search results and promotional materials.`
  },
  {
    title: '3. Information Sharing',
    content: `We do not sell your personal information to third parties.

We share your information in the following limited circumstances:

Between Users: Certain information is shared between customers and bakers as necessary to fulfill orders. For example, a baker receives a customer's event details and delivery address when an order is confirmed. Customer delivery addresses are not shared with bakers until an order is accepted.

Service Providers: We share information with trusted third-party service providers who help us operate the Platform, including Stripe (payments), Supabase (database), Vercel (hosting), and Resend (email). These providers are contractually obligated to protect your information.

Legal Requirements: We may disclose your information if required by law or if we believe disclosure is necessary to protect the rights or safety of Whiskly, our users, or the public.

Business Transfers: In the event of a merger, acquisition, or sale of Whiskly, your information may be transferred to the acquiring entity.`
  },
  {
    title: '4. Data Retention',
    content: `We retain your account information for as long as your account is active. If you delete your account, we will delete your personal information within 30 days, except where we are required to retain it for legal or compliance purposes.

Order records may be retained for up to 7 years for tax and legal compliance purposes.`
  },
  {
    title: '5. Cookies and Tracking',
    content: `Whiskly uses cookies and similar technologies to maintain your session, remember your preferences, and analyze Platform usage. You can control cookie settings through your browser, but disabling cookies may affect Platform functionality.

We do not use third-party advertising cookies or share your data with advertising networks.`
  },
  {
    title: '6. Your Rights',
    content: `Depending on your location, you may have the following rights regarding your personal information:

- Access: Request a copy of the personal information we hold about you
- Correction: Request that we correct inaccurate information
- Deletion: Request that we delete your personal information
- Portability: Request a machine-readable copy of your data
- Objection: Object to certain uses of your information

To exercise any of these rights, contact us at privacy@whiskly.com. We will respond to your request within 30 days.`
  },
  {
    title: '7. Data Security',
    content: `We implement reasonable technical and organizational measures to protect your personal information from unauthorized access, loss, or misuse. These measures include encrypted data transmission, secure authentication, and access controls.

No system is completely secure. We cannot guarantee the absolute security of your information and are not responsible for unauthorized access resulting from factors outside our reasonable control.`
  },
  {
    title: '8. Children\'s Privacy',
    content: `Whiskly is not intended for users under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected information from a child under 18, we will delete it promptly.`
  },
  {
    title: '9. Changes to This Policy',
    content: `We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on the Platform and, where appropriate, by email. Your continued use of the Platform after changes are posted constitutes acceptance of the updated policy.`
  },
  {
    title: '10. Contact',
    content: `For questions about this Privacy Policy or to exercise your data rights, contact us at privacy@whiskly.com.`
  },
]

export default function PrivacyPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: '#f5f0eb' }}>
      <Navbar />

      <section className="px-5 md:px-16 py-16" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-6"
          style={{ backgroundColor: '#e8ddd4', color: '#2d1a0e' }}>
          Legal
        </div>
        <h1 className="text-4xl font-bold mb-2" style={{ color: '#2d1a0e', letterSpacing: '-0.02em' }}>
          Privacy Policy
        </h1>
        <p className="text-sm mb-2" style={{ color: '#5c3d2e' }}>
          Last updated: March 2026
        </p>
        <p className="text-sm mb-12 leading-relaxed" style={{ color: '#5c3d2e' }}>
          This Privacy Policy explains how Whiskly LLC collects, uses, and protects your personal information when you use the Whiskly platform.
        </p>

        <div className="flex flex-col gap-8">
          {sections.map((section, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 md:p-8 shadow-sm">
              <h2 className="text-lg font-bold mb-4" style={{ color: '#2d1a0e' }}>{section.title}</h2>
              <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#5c3d2e' }}>
                {section.content}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl p-6 text-center" style={{ backgroundColor: '#2d1a0e' }}>
          <p className="text-white font-semibold mb-2">Questions about your privacy?</p>
          <p className="text-sm mb-4" style={{ color: '#c4a882' }}>Reach out and we'll respond within 30 days.</p>
          <a href="mailto:privacy@whiskly.com"
            className="inline-block px-6 py-3 rounded-xl font-semibold text-sm"
            style={{ backgroundColor: '#8B4513', color: 'white' }}>
            Contact Us
          </a>
        </div>

        <div className="mt-6 flex gap-4 justify-center text-sm" style={{ color: '#5c3d2e' }}>
          <Link href="/terms" className="underline">Terms of Service</Link>
          <Link href="/faq" className="underline">FAQ</Link>
        </div>
      </section>

      <footer className="px-5 md:px-16 py-10 mt-10" style={{ backgroundColor: '#2d1a0e' }}>
        <div className="flex flex-col md:flex-row justify-between gap-8 mb-8" style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div className="max-w-xs">
            <div className="mb-2"><WhisklyLogo variant="dark" size="md" /></div>
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
          © 2026 Whiskly. All rights reserved. · Currently in Beta
        </p>
      </footer>
    </main>
  )
}