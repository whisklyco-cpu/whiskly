'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import Navbar from '@/components/Navbar'

const faqs = [
  {
    category: 'For Customers',
    color: '#2d1a0e',
    questions: [
      {
        q: 'How does Whiskly work?',
        a: 'Whiskly is a marketplace that connects you with independent local bakers for custom orders. Browse baker profiles, see their pricing and portfolio, and submit a detailed order request directly on their profile. The baker reviews your request and accepts or declines. Once accepted, you manage everything — messaging, payment, and delivery — in one place.'
      },
      {
        q: 'Is it free to use as a customer?',
        a: 'Yes, completely free. There are no fees to browse bakers or submit order requests. You only pay when a baker accepts your order.'
      },
      {
        q: 'How do I know the bakers are trustworthy?',
        a: 'Every baker on Whiskly has a complete profile with real photos, verified reviews from past customers, and transparent pricing. Pro bakers also carry a Verified badge, indicating they\'ve been vetted by our team. You can read reviews and see exactly what previous customers ordered before reaching out.'
      },
      {
        q: 'What if my baker declines my request?',
        a: 'No worries — you can browse other bakers and submit a new request. Bakers may decline due to scheduling conflicts, budget mismatches, or specialty limitations. We recommend being as detailed as possible in your request to get the best match.'
      },
      {
        q: 'Can I message a baker before placing an order?',
        a: 'Yes. Once you submit an order request, you can message your baker directly through the platform. All conversations are kept in one thread tied to your order so nothing gets lost.'
      },
      {
        q: 'How does pickup or delivery work?',
        a: 'That\'s up to the baker. Some offer pickup only, some offer delivery, and some offer both. You\'ll see the fulfillment options on the baker\'s profile before you submit a request. Once your order is ready, your baker will confirm the logistics with you through the messaging system.'
      },
      {
        q: 'What payment methods are accepted?',
        a: 'Whiskly uses Stripe for secure payments. You can pay with any major credit or debit card. A deposit is collected when your order is confirmed, with the remainder due before delivery or pickup.'
      },
      {
        q: 'Can I save bakers I like?',
        a: 'Yes. You can save bakers to your favorites list from their profile page. You can also save important dates, birthdays, anniversaries, and more, and we\'ll remind you to place an order in advance.'
      },
      {
        q: 'What if there is a problem with my order?',
        a: 'If something goes wrong with your order, you can file a formal dispute through your dashboard. Orders are locked while a dispute is open and our team reviews the situation within 48 hours. Depending on the outcome, a full or partial refund may be issued.'
      },
      {
  q: 'Is there a fee to use Whiskly?',
  a: 'Yes. Whiskly charges a $4.99 platform fee at checkout, added to the order price set by your baker. This covers payment processing, customer support, and the platform you use to book and manage your order. The fee is shown clearly at the booking step before you pay.'
},
{
  q: 'How much of my payment goes to the baker?',
  a: 'Your baker receives 100% of the order price they set. Whiskly does not take a commission from the baker during this early phase.'
},
{
  q: 'Can I get a refund on the platform fee?',
  a: 'The $4.99 platform fee is non-refundable once an order is submitted, since it covers the cost of processing your booking. Your deposit and final payment to the baker follow the baker\'s cancellation policy, shown on their profile.'
},
{
  q: 'How does the deposit work?',
  a: 'When your baker accepts your order, you will receive a prompt to pay a 50% deposit to confirm. The remaining balance is due 48 hours before your event. You will not be charged anything until your baker accepts.'
},
{
  q: 'Is there a platform fee?',
  a: 'Yes. Whiskly charges a $4.99 platform fee per order, shown as a line item at checkout. This fee covers secure payment processing infrastructure, order management, customer support, and dispute mediation. The platform fee is in addition to the baker\'s listed price. For example, if a baker\'s cake is listed at $150, your subtotal at checkout will be $150 (cake) + $4.99 (Whiskly platform fee) = $154.99, plus any applicable Stripe processing fees, which are also disclosed at checkout. The platform fee is refunded only if your entire order is refunded due to a baker cancellation or no-show.'
},
{
  q: 'What if my baker sends a counter offer?',
  a: 'If a baker cannot fulfill your order at your stated budget, they may send a counter offer with their price. You will see the counter offer in your dashboard and can accept or decline. If you decline, the order is cancelled and you can browse other bakers.'
},
{
  q: 'Can I tip my baker?',
  a: 'Yes. After your order is complete you will be prompted to leave a tip. Tips go 100% to your baker. Whiskly takes nothing.'
},
    ]
  },
  {
    category: 'For Bakers',
    color: '#8B4513',
    questions: [
      {
        q: 'How do I join Whiskly as a baker?',
        a: 'Click "Apply as a Baker" and fill out your profile — your specialties, starting prices, portfolio photos, and bio. Once approved, your profile goes live and customers can start finding you and submitting requests.'
      },
      {
        q: 'Is it free to join?',
        a: 'Yes. The free tier includes everything you need to run your business: order management, customer messaging, delivery and pickup flow, reviews, and unlimited orders. Whiskly takes a 10% commission on completed transactions.'
      },
      {
        q: 'What is Whiskly Pro?',
        a: 'A standard paid tier for non-founding bakers is coming soon for bakers 51 and beyond. Pricing and features will be published before it launches. At launch, the only paid tier available is the Founding tier ($14/month or $99/year), which is limited to the first 50 bakers.'
      },
      {
        q: 'What is the Founding Baker offer?',
        a: 'Founding Bakers (the first 50 approved on the platform) receive: a permanent Founding Baker badge on their profile; priority featured placement in browse results for their first 12 months; a 30-day free trial of the Founding tier; and locked founding pricing ($14/month or $99/year) and a 7% commission rate for three years from account approval — even if Whiskly raises prices for new bakers. Once 50 spots are filled, this offer is gone.'
      },
      {
        q: 'Do I have to accept every order request?',
        a: 'Absolutely not. You review every request before committing. You can see the event date, budget, description, and inspiration photos before deciding. Accept what works for you, decline what doesn\'t — no explanation required.'
      },
      {
        q: 'How does pricing work on my profile?',
        a: 'You set your own starting prices per specialty — custom cakes from $X, cupcakes from $X, cookies from $X, and so on. Customers see your pricing before they reach out, which filters out budget mismatches and reduces back-and-forth.'
      },
      {
        q: 'What is the pricing calculator?',
        a: 'The pricing calculator is a Pro feature that shows you what bakers in your area are charging for similar specialties. It helps you price competitively and confidently without guessing or undercharging. It factors in your location, specialty, and market data.'
      },
      {
        q: 'What is profile writing assistance?',
        a: 'Profile writing assistance is a Pro feature that helps you write a polished bio and specialty descriptions for your profile. Answer a few questions about your background and style, and we\'ll generate professional copy that helps your profile stand out and convert more visitors into customers.'
      },
      {
        q: 'Can I use Whiskly if I bake from home?',
        a: 'Yes. Whiskly is built for independent bakers — whether you operate from a commercial kitchen, a home kitchen, or a small storefront. As long as you comply with your local cottage food laws and regulations, you\'re welcome on the platform.'
      },
      {
        q: 'How do I get more visibility on Whiskly?',
        a: 'Complete your profile fully — photos, pricing, bio, and specialties all help. Collect reviews from early customers. Pro bakers get featured placement at the top of browse results, which significantly increases visibility. You can also share your custom Whiskly link on social media to drive traffic directly to your profile.'
      },
      {
  q: 'Can I send a counter offer if the budget is too low?',
  a: 'Yes. Instead of declining, you can send a counter offer with your price and an optional note explaining why. The customer then accepts or declines your counter. This keeps the conversation going without a hard no.'
},
{
  q: 'What happens if I have an emergency and cannot fulfill an order?',
  a: 'You can trigger an Emergency Pause from your dashboard. This immediately notifies our team and puts your orders on hold while we reach out to affected customers. No strikes are issued for genuine emergencies. We handle communication with your customers so you can focus on what matters.'
},
{
  q: 'Can I pause new orders temporarily?',
  a: 'Yes. You have three availability options in your profile: Vacation Mode (set a return date and new orders are paused), At Capacity (lets customers know you are fully booked), and Emergency Pause (for unexpected situations that need immediate attention).'
},
{
  q: 'What is the emergency rescue roster?',
  a: 'The emergency rescue roster is an optional list of bakers who are open to being contacted when another baker cancels last-minute. If you opt in, you may occasionally receive a notification about an urgent open order in your area that needs to be fulfilled quickly. There is no obligation to accept any order — opting in just means you are open to hearing about them.'
},
{
  q: 'How does the rush order fee work?',
  a: 'You can set a rush fee percentage in your profile settings. Any order that falls within your stated lead time is automatically flagged as a rush order and your fee is applied. The customer sees the rush fee clearly before submitting.'
},
{
  q: 'What are strikes?',
  a: 'A strike is a formal warning recorded on your account when you cancel a confirmed order within 7 days of the event date. If you receive 3 strikes, your account will be reviewed and may be suspended. Strikes are visible to Whiskly admins but are never shown to customers.'
},
{
  q: 'How does Whiskly make money?',
  a: 'Right now, we charge customers a small $4.99 platform fee at checkout. Bakers pay 0% commission. We don\'t take a cut from your order price.\n\nAs Whiskly grows, we activate commission on a per-baker basis when one of two things happens: 40% of your orders come from customers who discovered you through Whiskly (over a rolling 90-day period), or 18 months from when you joined the platform, whichever comes first. When commission activates, you choose your tier: Free (10%, no monthly fee) or Founding ($14/month or $99/year, 7% — first 50 bakers only, locked for 3 years). A standard paid tier for bakers 51+ is coming soon.\n\nYou\'ll always see your Whiskly-sourced percentage in your dashboard, and we give 60 days written notice before commission activates for your account. Learn more at whiskly.co/founding.'
},
{
  q: 'What if I never hit 40% Whiskly-sourced orders?',
  a: 'Commission still activates 18 months after you join, regardless of your Whiskly-sourced percentage. This is a backstop so you have full clarity on the timeline. Most bakers reach 40% naturally as Whiskly grows, but the 18-month cap means there\'s a fixed end date to the 0% commission period either way.'
},
{
  q: 'What counts as a "Whiskly-sourced" order?',
  a: 'A Whiskly-sourced order is one where the customer found your specific profile through Whiskly\'s discovery features (browse page, search, category pages, or recommendations) AND had no prior order relationship with you on the platform. If a customer was already yours and you sent them your Whiskly link, that order is not Whiskly-sourced. If a customer discovered you because they searched Whiskly for "wedding cake bakers in Baltimore," that order is Whiskly-sourced. We track this automatically and you\'ll see the breakdown in your dashboard.'
},
    ]
  },
  {
    category: 'General',
    color: '#5c3d2e',
    questions: [
      {
        q: 'What areas does Whiskly serve?',
        a: 'Whiskly is in early access and growing. We\'re actively onboarding bakers across the US. If there are no bakers in your area yet, check back soon — we\'re adding new bakers regularly.'
      },
      {
        q: 'How do I contact support?',
        a: 'You can reach us at support@whiskly.co. Pro bakers receive priority support with faster response times.'
      },
      {
        q: 'Is my payment information secure?',
        a: 'Yes. All payments are processed through Stripe, one of the most trusted payment platforms in the world. Whiskly never stores your card information directly.'
      },
      {
        q: 'What is the early access period?',
        a: 'Whiskly is currently in early access, meaning we\'re actively building and improving the platform. During early access, there are no transaction fees for bakers. We\'ll give plenty of notice before any fees are introduced.'
      },
      {
  q: 'What is the difference between Free and Founding for bakers?',
  a: 'Free tier bakers pay 10% commission and get all core tools including order management, messaging, payments, and reviews. Founding Bakers (first 50 only) pay 7% commission, locked for 3 years, at $14/month or $99/year with a 30-day free trial. They also receive a permanent Founding Baker badge, priority search placement for 12 months, and early feature access. A standard paid tier for bakers 51+ is coming soon.'
},
{
  q: 'How do I report a problem?',
  a: 'Visit our contact page or email support@whiskly.co. Priority support with faster response times is available for Pro bakers.'
},
    ]
  }
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b" style={{ borderColor: '#e0d5cc' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left py-5 flex items-start justify-between gap-4">
        <p className="font-semibold text-sm leading-relaxed" style={{ color: '#2d1a0e' }}>{q}</p>
        <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
          style={{ backgroundColor: open ? '#2d1a0e' : '#e0d5cc', color: open ? 'white' : '#5c3d2e', transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}>
          +
        </span>
      </button>
      {open && (
        <p className="text-sm leading-relaxed pb-5" style={{ color: '#5c3d2e' }}>{a}</p>
      )}
    </div>
  )
}

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState('For Customers')

  const active = faqs.find(f => f.category === activeCategory)!

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#f5f0eb' }}>
      <Navbar />

      {/* Header */}
      <section className="px-6 md:px-16 py-16 md:py-20" style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div className="max-w-2xl">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-6"
            style={{ backgroundColor: '#e8ddd4', color: '#2d1a0e' }}>
            FAQ
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#2d1a0e', letterSpacing: '-0.02em' }}>
            Frequently asked questions
          </h1>
          <p className="text-base leading-relaxed" style={{ color: '#5c3d2e' }}>
            Everything you need to know about Whiskly — for customers and bakers.
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="px-6 md:px-16 pb-20" style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div className="flex flex-col md:flex-row gap-10">

          {/* Category tabs */}
          <div className="flex md:flex-col gap-2 flex-shrink-0">
            {faqs.map(f => (
              <button key={f.category}
                onClick={() => setActiveCategory(f.category)}
                className="px-5 py-3 rounded-xl text-sm font-semibold text-left transition-all"
                style={{
                  backgroundColor: activeCategory === f.category ? '#2d1a0e' : 'white',
                  color: activeCategory === f.category ? 'white' : '#2d1a0e',
                  whiteSpace: 'nowrap'
                }}>
                {f.category}
              </button>
            ))}
          </div>

          {/* Questions */}
          <div className="flex-1 bg-white rounded-2xl p-6 md:p-8 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: active.color }}>
              {active.category}
            </p>
            <div>
              {active.questions.map((item, i) => (
                <FAQItem key={i} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        </div>

        {/* Still have questions */}
        <div className="mt-10 rounded-2xl p-8 text-center" style={{ backgroundColor: '#2d1a0e' }}>
          <h3 className="text-lg font-bold text-white mb-2">Still have questions?</h3>
          <p className="text-sm mb-6" style={{ color: '#c4a882' }}>We're here to help. Reach out and we'll get back to you.</p>
          <a href="mailto:support@whiskly.co"
            className="inline-block px-8 py-3 rounded-xl font-semibold text-sm"
            style={{ backgroundColor: '#8B4513', color: 'white' }}>
            Contact Support
          </a>
        </div>
      </section>

      {/* Footer */}
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
                <Link href="/login">Sign In</Link>
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