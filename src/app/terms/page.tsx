'use client'

import Link from 'next/link'
import WhisklyLogo from '@/components/WhisklyLogo'
import Navbar from '@/components/Navbar'

const sections = [
  {
    title: '1. Acceptance of Terms',
    content: `By accessing or using Whiskly ("the Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Platform. These Terms apply to all users of the Platform, including customers and bakers.

Whiskly is operated by Whiskly LLC, a Delaware limited liability company. We reserve the right to update these Terms at any time. Continued use of the Platform after changes constitutes acceptance of the updated Terms.`
  },
  {
    title: '2. Platform Description',
    content: `Whiskly is a two-sided marketplace that connects customers seeking custom baked goods with independent bakers. Whiskly facilitates introductions and order management but is not a party to any transaction between customers and bakers. Whiskly does not employ bakers, guarantee the quality of any baked goods, or take responsibility for any transaction that occurs between users.`
  },
  {
    title: '3. User Accounts',
    content: `You must create an account to use certain features of the Platform. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You agree to provide accurate and complete information when creating your account.

You must be at least 18 years old to create an account. By creating an account, you represent that you meet this requirement.

Whiskly reserves the right to suspend or terminate any account at its discretion, including for violation of these Terms.`
  },
  {
    title: '4. Baker Responsibilities',
    content: `Bakers who list their services on Whiskly agree to the following:

- You are solely responsible for complying with all applicable laws, including local cottage food laws, health regulations, food handling permits, and business licensing requirements.
- You are an independent contractor, not an employee of Whiskly. Whiskly has no control over how you operate your baking business.
- You agree to accurately represent your skills, specialties, and pricing on your profile.
- You agree to fulfill orders you accept in a professional and timely manner.
- You agree to communicate promptly with customers through the Platform.
- You are responsible for the quality, safety, and accuracy of all baked goods you produce.
- You agree to disclose any known allergens in your products.`
  },
  {
    title: '5. Customer Responsibilities',
    content: `Customers who use Whiskly to place orders agree to the following:

- You agree to provide accurate information when submitting order requests, including event dates, budget, and any relevant dietary restrictions or allergies.
- You understand that submitting a request does not guarantee fulfillment. A baker must accept your request before an order is confirmed.
- You agree to pay any deposit or balance due in accordance with the payment terms established at the time of order confirmation.
- You agree to communicate respectfully with bakers through the Platform.`
  },
  {
    title: '6. Fees and Commission',
    content: `6.1 Phase 1 Pricing (Current)

During Phase 1, bakers pay no commission and no monthly fee to Whiskly. Customers pay a $4.99 platform fee at checkout, in addition to the order price set by the baker. Bakers receive 100% of their listed order price, less standard payment processing fees passed through from Stripe.

Standard payouts (2 business days) are free. Instant payouts (within minutes) carry a 1% fee, passed through directly from Stripe with no markup from Whiskly.

6.2 Phase 2 Pricing (Future)

Commission will activate for an individual baker when the first of the following conditions is met:

(a) The baker's Whiskly-sourced orders exceed 40% of their total platform order volume over a rolling 90-day period; or

(b) Eighteen (18) months have elapsed since the baker's account activation date.

For purposes of this Section, an order is "Whiskly-sourced" if (i) the customer discovered the baker through Whiskly's discovery features (browse, search, category pages, or platform recommendations) and (ii) the customer had no prior order relationship with the baker on the Whiskly platform.

When commission activates, bakers may select one of three tiers:

Tier          Monthly Fee     Commission
Free          $0              10% per order
Pro           $19/month       7% per order
Elite         $34/month       5% per order

Bakers will default to the Free tier and may upgrade or downgrade at any time. Tier changes take effect at the start of the next billing cycle.

6.3 Notice of Commission Activation

Whiskly will provide written notice to a baker at least sixty (60) days before commission activates for that baker. Notice will include the activation date, the baker's current tier (Free by default), instructions for upgrading or downgrading, and a summary of the baker's recent platform activity supporting the activation.

6.4 Early Activation Provision

Whiskly reserves the right to activate commission across all baker accounts earlier than the conditions in Section 6.2 if necessary to maintain platform operations. In the event of early activation, Whiskly will:

(a) Provide at least ninety (90) days written notice to all affected bakers;

(b) Apply a discounted commission rate of 5% across all tiers for the first six (6) months following early activation; and

(c) Honor any tier-pricing locks held by Founding Bakers as defined in Section 6.5.

This provision is reserved for genuine operational necessity and is not the planned activation path.

6.5 Founding Baker Provisions

Bakers who join during the Founding Baker period (the first 10 baker accounts approved on the Whiskly platform) receive the following lifetime benefits:

(a) Permanent featured placement in browse search results;

(b) When commission activates, the first twelve (12) months of Pro or Elite tier are provided free of monthly fee (commission rate still applies); and

(c) Locked-in tier monthly fees ($19/month Pro, $34/month Elite) for the lifetime of the account, even if Whiskly raises tier pricing for new bakers in the future.

6.6 Changes to Fee Structure

Whiskly may modify the customer platform fee, commission rates, or tier monthly fees from time to time. Any change to baker-paid fees (commission rates or tier monthly fees) will be communicated to bakers in writing at least sixty (60) days before taking effect, except as provided in Section 6.4. Changes to the customer platform fee will be communicated through the Whiskly website and may take effect upon publication.`
  },
  {
    title: '7. Cancellation and Refund Policy',
    content: `The following cancellation and refund policy applies to all orders placed through the Platform:

Baker Cancellations:
- If a baker cancels a confirmed order before the ingredient advance has been released (within 72 hours of confirmation), the customer will receive a full refund of the deposit.
- If a baker cancels after the ingredient advance has been released, the customer will receive a refund of the deposit minus the ingredient advance amount, which the baker retains as a kill fee for materials already purchased.
- A baker who cancels a confirmed order within 7 days of the event date will receive a strike on their account.
- Repeated cancellations may result in account suspension or removal from the Platform.

Customer Cancellations:
- If a customer cancels more than 7 days before the event date, the deposit (minus any ingredient advance already released) is non-refundable. The remaining balance will not be charged.
- If a customer cancels within 7 days of the event date, the full order amount may be charged at Whiskly's discretion based on the baker's incurred costs.
- Cancellation requests must be submitted through the Platform.

Auto-Cancellation:
- Order requests not accepted by a baker within 48 hours are automatically cancelled with no charge to the customer.
- Orders with unresolved payment failures after the 48-hour grace period are automatically cancelled.

Quality Disputes:
- If a customer believes the delivered product materially differs from what was agreed upon, they must contact Whiskly support within 24 hours of delivery or pickup.
- Whiskly will mediate disputes between customers and bakers. Whiskly's decision in any dispute is final.
- Whiskly may issue partial or full refunds at its discretion in cases of verified quality disputes.

No-Show Baker:
- If a baker fails to deliver or make an order available for pickup on the agreed date without prior notice, the customer is entitled to a full refund. The baker's account will be reviewed for suspension.

Whiskly is not responsible for any damages, losses, or expenses beyond the amount paid for the order.`
  },
  {
    title: '8. Prohibited Conduct',
    content: `You agree not to:

- Use the Platform for any unlawful purpose
- Attempt to circumvent the Platform by conducting transactions off-platform after making initial contact through Whiskly
- Post false, misleading, or fraudulent information on your profile or in any communications
- Harass, threaten, or abuse other users
- Interfere with the operation of the Platform
- Attempt to access another user's account without authorization
- Use the Platform to distribute spam or unsolicited communications

Violation of these prohibitions may result in immediate account termination.`
  },
  {
    title: '9. Reviews and Content',
    content: `Users may submit reviews and other content through the Platform. By submitting content, you grant Whiskly a non-exclusive, royalty-free license to use, display, and distribute that content in connection with the Platform.

You agree that all content you submit is accurate and not defamatory. Whiskly reserves the right to remove any content that violates these Terms or that Whiskly determines is harmful to the Platform or its users.`
  },
  {
    title: '10. Intellectual Property',
    content: `All content on the Platform, including the Whiskly name, logo, design, and software, is owned by Whiskly LLC and protected by applicable intellectual property laws. You may not use, reproduce, or distribute any Whiskly intellectual property without prior written permission.

Baker profile photos and content remain the property of the respective bakers. By uploading content to the Platform, you grant Whiskly a license to use such content for Platform purposes, including marketing.`
  },
  {
    title: '11. Disclaimers',
    content: `THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WHISKLY DOES NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS.

WHISKLY IS NOT RESPONSIBLE FOR THE QUALITY, SAFETY, OR LEGALITY OF ANY BAKED GOODS SOLD THROUGH THE PLATFORM, OR FOR THE ABILITY OF BAKERS TO FULFILL ORDERS.

YOUR USE OF THE PLATFORM IS AT YOUR OWN RISK.`
  },
  {
    title: '12. Limitation of Liability',
    content: `TO THE MAXIMUM EXTENT PERMITTED BY LAW, WHISKLY AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE PLATFORM OR ANY TRANSACTION CONDUCTED THROUGH THE PLATFORM.

IN NO EVENT SHALL WHISKLY'S TOTAL LIABILITY TO YOU EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID TO WHISKLY IN THE THREE MONTHS PRECEDING THE CLAIM OR (B) ONE HUNDRED DOLLARS ($100).`
  },
  {
    title: '13. Governing Law and Disputes',
    content: `These Terms are governed by the laws of the State of Delaware, without regard to conflict of law principles. Any dispute arising from these Terms or your use of the Platform shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association, except that either party may seek injunctive relief in a court of competent jurisdiction.

You waive any right to participate in a class action lawsuit or class-wide arbitration.`
  },
  {
    title: '14. Contact',
    content: `For questions about these Terms, please contact us at support@whiskly.co.`
  },
]

export default function TermsPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: '#f5f0eb' }}>
      <Navbar />

      <section className="px-5 md:px-16 py-16" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-6"
          style={{ backgroundColor: '#e8ddd4', color: '#2d1a0e' }}>
          Legal
        </div>
        <h1 className="text-4xl font-bold mb-2" style={{ color: '#2d1a0e', letterSpacing: '-0.02em' }}>
          Terms of Service
        </h1>
        <p className="text-sm mb-2" style={{ color: '#5c3d2e' }}>
          Last Updated: May 8, 2026
        </p>
        <p className="text-sm mb-12 leading-relaxed" style={{ color: '#5c3d2e' }}>
          Please read these Terms of Service carefully before using Whiskly. These Terms govern your use of our platform as both a customer and a baker.
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
          <p className="text-white font-semibold mb-2">Have questions about our Terms?</p>
          <p className="text-sm mb-4" style={{ color: '#c4a882' }}>We're happy to explain anything in plain language.</p>
          <a href="mailto:support@whiskly.co"
            className="inline-block px-6 py-3 rounded-xl font-semibold text-sm"
            style={{ backgroundColor: '#8B4513', color: 'white' }}>
            Contact Us
          </a>
        </div>

        <div className="mt-6 flex gap-4 justify-center text-sm" style={{ color: '#5c3d2e' }}>
          <Link href="/privacy" className="underline">Privacy Policy</Link>
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