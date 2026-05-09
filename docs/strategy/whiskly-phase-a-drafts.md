# Whiskly Phase A Launch Drafts

All drafts ready for Claude Code implementation. Built around the three confirmed decisions:
- **Customer fee:** $4.99 per order
- **Backstop trigger:** First of (40% Whiskly-sourced over 90-day rolling) OR (18 months from activation), with 90-day-notice escape hatch
- **Attribution:** Approach 1 (first-touch cookie) + Approach 3 (new baker-customer pair via Whiskly discovery)

---

## 1. Terms of Service: Section 6 Rewrite (Fees and Commission)

Replace the entire current Section 6 with this. Renumber subsequent sections if needed. Delete current Section 14 (fee waiver) entirely.

### 6. Fees and Commission

**6.1 Phase 1 Pricing (Current)**

During Phase 1, bakers pay no commission and no monthly fee to Whiskly. Customers pay a $4.99 platform fee at checkout, in addition to the order price set by the baker. Bakers receive 100% of their listed order price, less standard payment processing fees passed through from Stripe.

Standard payouts (2 business days) are free. Instant payouts (within minutes) carry a 1% fee, passed through directly from Stripe with no markup from Whiskly.

**6.2 Phase 2 Pricing (Future)**

Commission will activate for an individual baker when the first of the following conditions is met:

(a) The baker's Whiskly-sourced orders exceed 40% of their total platform order volume over a rolling 90-day period; or

(b) Eighteen (18) months have elapsed since the baker's account activation date.

For purposes of this Section, an order is "Whiskly-sourced" if (i) the customer discovered the baker through Whiskly's discovery features (browse, search, category pages, or platform recommendations) and (ii) the customer had no prior order relationship with the baker on the Whiskly platform.

When commission activates, bakers may select one of three tiers:

| Tier | Monthly Fee | Commission |
|---|---|---|
| Free | $0 | 10% per order |
| Pro | $19/month | 7% per order |
| Elite | $34/month | 5% per order |

Bakers will default to the Free tier and may upgrade or downgrade at any time. Tier changes take effect at the start of the next billing cycle.

**6.3 Notice of Commission Activation**

Whiskly will provide written notice to a baker at least sixty (60) days before commission activates for that baker. Notice will include the activation date, the baker's current tier (Free by default), instructions for upgrading or downgrading, and a summary of the baker's recent platform activity supporting the activation.

**6.4 Early Activation Provision**

Whiskly reserves the right to activate commission across all baker accounts earlier than the conditions in Section 6.2 if necessary to maintain platform operations. In the event of early activation, Whiskly will:

(a) Provide at least ninety (90) days written notice to all affected bakers;

(b) Apply a discounted commission rate of 5% across all tiers for the first six (6) months following early activation; and

(c) Honor any tier-pricing locks held by Founding Bakers as defined in Section 6.5.

This provision is reserved for genuine operational necessity and is not the planned activation path.

**6.5 Founding Baker Provisions**

Bakers who join during the Founding Baker period (the first 10 baker accounts approved on the Whiskly platform) receive the following lifetime benefits:

(a) Permanent featured placement in browse search results;

(b) When commission activates, the first twelve (12) months of Pro or Elite tier are provided free of monthly fee (commission rate still applies); and

(c) Locked-in tier monthly fees ($19/month Pro, $34/month Elite) for the lifetime of the account, even if Whiskly raises tier pricing for new bakers in the future.

**6.6 Changes to Fee Structure**

Whiskly may modify the customer platform fee, commission rates, or tier monthly fees from time to time. Any change to baker-paid fees (commission rates or tier monthly fees) will be communicated to bakers in writing at least sixty (60) days before taking effect, except as provided in Section 6.4. Changes to the customer platform fee will be communicated through the Whiskly website and may take effect upon publication.

---

## 2. Terms of Service: Other Required Changes

**Delete entirely:**
- Current Section 14 (fee waiver during beta)

**Find and remove all instances of:**
- "5% reserve balance" or "5% annual reserve"
- "annual reserve account"
- "withholding for chargeback protection"
- Any other 5% reserve language

**Update:**
- "Last Updated" date to current date
- Renumber any sections that shift after Section 14 deletion

---

## 3. Privacy Policy Updates

Find and remove any reference to:
- "5% reserve balance" or "5% annual reserve"
- "annual reserve account"
- "withholding amounts for dispute protection"
- Any language about Whiskly holding baker funds beyond standard payout timing

Update the "Last Updated" date.

If the Privacy Policy currently has a section explaining "what financial information we hold and why," that section should now read something like:

> **Financial Information**
>
> When you connect a payment method or Stripe account to Whiskly, we collect and store the minimum information necessary to process payments, including your name, billing address, and the last four digits of your payment method. Full payment details are stored by Stripe, our payment processor, not by Whiskly. Bakers receive payouts directly from Stripe on a standard 2-business-day schedule. Whiskly does not hold baker funds in reserve.

---

## 4. /for-bakers Page Rewrite

Keep the existing "Sound familiar?" pain points section. Replace the pricing, tiers, and Founding Baker sections with this. Add the new "Why we built it this way" section before the final CTA.

### Hero

> **Built by a baker who got tired of chasing payments and missing orders.**
>
> You make incredible cakes. Whiskly handles everything else: bookings, deposits, customer communication, the calendar. So you can spend your time in the kitchen instead of the DMs.
>
> [Apply as a Baker]

### Sound familiar?

(Keep current pain point section as-is.)

### How Whiskly works

> Customers find your cakes through Whiskly's browse and search. They book directly through your profile with a structured order form, pay a deposit through the platform, and get clear delivery details. You see the order, accept it, bake the cake. Whiskly handles the rest.
>
> You set your prices. You keep your customer relationships. You keep your style. Whiskly is the platform underneath, not a middleman.

### What it costs

> Right now, joining Whiskly is free. There's no monthly fee. There's no commission on your orders. You keep 100% of every order price you set.
>
> Customers pay a small $4.99 platform fee at checkout, separate from your order price. That covers Whiskly's operations during this early phase.
>
> As Whiskly grows and starts driving meaningful customer volume to your business, we'll introduce tiered pricing so you can choose the level of platform support you want. We'll always give you 60 days written notice before any change, and Founding Bakers lock in the lowest rates for life.

### Founding Baker (first 10 only)

> The first 10 bakers on Whiskly become Founding Bakers. The benefits are permanent and locked in for the lifetime of your account.
>
> ✓ Featured placement in browse results, forever
> ✓ Locked-in tier pricing for life ($19/mo Pro, $34/mo Elite)
> ✓ 12 months of Pro or Elite tier free when commission activates
> ✓ Direct input on platform features through monthly founder calls
> ✓ Founding Baker badge on your profile
>
> Once we hit 10 Founding Bakers, this offer closes permanently.
>
> [Apply as a Baker]

### Why we built it this way

> Whiskly only earns when we earn for you. Your customer fee covers our operations during this early phase. Commission only activates when at least 40% of your orders come from customers Whiskly brought you, or after 18 months on the platform, whichever comes first.
>
> That means we're not extracting from your existing business. We're building something that grows with you.

### Final CTA

> Ready to apply? It takes about 10 minutes.
>
> [Apply as a Baker]

### Sections to delete from current /for-bakers page

- "Most bakers hit that in their first week" (unsupported claim)
- Any current reference to 10% commission as the active rate
- Any current reference to monthly fees being charged today
- The duplicate hero image (also appears in homepage Verified Platform block)

---

## 5. Customer FAQ Additions

Add these three entries to the customer-side FAQ tab:

**Is there a fee to use Whiskly?**

> Yes. Whiskly charges a $4.99 platform fee at checkout, added to the order price set by your baker. This covers payment processing, customer support, and the platform you use to book and manage your order. The fee is shown clearly at the booking step before you pay.

**How much of my payment goes to the baker?**

> Your baker receives 100% of the order price they set. Whiskly does not take a commission from the baker during this early phase.

**Can I get a refund on the platform fee?**

> The $4.99 platform fee is non-refundable once an order is submitted, since it covers the cost of processing your booking. Your deposit and final payment to the baker follow the baker's cancellation policy, shown on their profile.

---

## 6. Customer Checkout Flow Disclosure

At the "Request to Book" step, BEFORE the customer enters payment details, display the following order summary:

```
Order Summary
─────────────────────────────────────
Baker:               [Baker Name]
Order:               [Description]
Order price:         $XX.XX
Whiskly platform fee: $4.99
─────────────────────────────────────
Deposit due today:    $XX.XX
Final balance due [date]: $XX.XX
```

The $4.99 platform fee must be a visible line item, not buried in a total. Same line item must appear in the receipt email template.

---

## 7. Site-Wide Copy Locks

These should be globally consistent across header, footer, body, and email templates.

**CTA language for baker application:** "Apply as a Baker" (everywhere)
- Replace any instance of: "Join as Baker", "Become a Baker", "Get Started Free" (when referring to baker application)

**Beta language:** "Early Access" (everywhere)
- Replace every instance of: "Currently in Beta", "Beta", "Beta Launch"

**Phone number:** Verify and update across the site. Confirm location of all references.

---

## 8. Page Titles and Meta Descriptions

Replace the current generic "Whiskly" title on every page with these specific titles. All include the brand suffix.

| Page | Title |
|---|---|
| Homepage (/) | Whiskly \| Custom Cakes from Local Home Bakers |
| /bakers | Browse Bakers \| Whiskly |
| /for-bakers | Sell on Whiskly \| Tools for Home Bakers |
| /faq | FAQ \| Whiskly |
| /signup | Sign Up \| Whiskly |
| /join | Apply as a Baker \| Whiskly |
| /login | Sign In \| Whiskly |
| /terms | Terms of Service \| Whiskly |
| /privacy | Privacy Policy \| Whiskly |
| /forgot-password | Reset Password \| Whiskly |

Meta descriptions:

| Page | Meta Description |
|---|---|
| Homepage | Book local home bakers for custom cakes, cookies, and desserts. Clear pricing, structured ordering, and secure payments. No more Instagram DMs. |
| /bakers | Find verified home bakers near you for custom cakes, cookies, and desserts. Filter by specialty, dietary needs, and price. |
| /for-bakers | Sell your custom cakes on Whiskly. Free to join, 0% commission, structured booking and payments built for home bakers. |
| /faq | Common questions about ordering custom cakes through Whiskly, baker pricing, delivery, and platform features. |

---

## 9. Open Graph and Twitter Card Tags

Add to the head of every page (verify these exist; if not, add):

```html
<meta property="og:title" content="[Page-specific title from above]" />
<meta property="og:description" content="[Page-specific meta description from above]" />
<meta property="og:image" content="https://www.whiskly.co/og-image.png" />
<meta property="og:url" content="https://www.whiskly.co[current-path]" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Whiskly" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="[Page-specific title from above]" />
<meta name="twitter:description" content="[Page-specific meta description from above]" />
<meta name="twitter:image" content="https://www.whiskly.co/og-image.png" />
```

Need to create/upload `og-image.png` (1200x630px recommended). Should be Whiskly logo on brand-color background, or hero photo with logo overlay.

---

## 10. Homepage Cleanup

- Verify zero-stat block is removed (confirmed removed in audit)
- Remove duplicate hero image from "Verified Platform / Trusted by local bakers" block (image currently appears in hero AND this block)
- Update "Trusted by local bakers" copy until baker count is meaningful. Suggested replacement: "Built for local bakers. Ready for early access."

---

## 11. /bakers Page SEO Fix

The /bakers page currently renders as "Loading..." in static HTML, blocking search engine indexing.

Convert to either Server-Side Rendering (SSR) or Static Site Generation (SSG with revalidation):
- SSR: every request renders baker cards server-side, then hydrates
- SSG with revalidation: pre-render baker cards at build time, revalidate every 60 minutes

For Next.js App Router, use `export const dynamic = 'force-dynamic'` for SSR or `export const revalidate = 3600` for SSG.

At minimum, baker cards (name, specialty, photo, price range, location) must appear in the initial HTML response.

---

## 12. Operational Tasks (Parallel Track)

These do not require copy changes but are launch-blocking or near-blocking:

**Vercel:**
- Upgrade Hobby to Pro ($20/month)
- Verify hourly cron schedules deploy successfully after upgrade
- Add CRON_SECRET environment variable for cron endpoint authentication

**Supabase:**
- Configure Resend as SMTP provider (replace default Supabase SMTP)
- Enable Leaked Password Protection in Auth settings
- Verify 2FA is enforced on admin accounts

**Stripe:**
- Add `setup_future_usage: off_session` to deposit PaymentIntent creation
- Verify Stripe Connect account linkage works for tip charging
- Upload finalized Privacy Policy and Terms to Stripe dashboard
- Confirm chargeback protection settings (recommended: Standard Connect with bakers as merchant of record, Stripe handles disputes)

**Database (Supabase):**
- Remove any reference to baker reserve balance fields if they exist
- Add fields for first-touch attribution: `customer.first_touch_source`, `customer.first_touch_path`, `customer.first_touch_baker_id`
- Add field to orders table: `order.is_whiskly_sourced` (boolean, populated at order creation based on attribution rules)
- Add field to bakers table: `baker.activation_date` (used for 18-month backstop calculation)
- Migration to backfill existing test data: assume all current orders are NOT Whiskly-sourced (conservative default)

**Test data cleanup:**
- Remove the misspelled test baker profile from public visibility
- Either delete entirely or hide from /bakers display until ready

---

## 13. Attribution Layer Build (Phase B, post-launch but pre-customer-marketing)

This is the build dependency for the 40% trigger to be measurable. Without it, Section 6.2 of Terms cannot be enforced.

**Required tracking:**

1. **First-touch cookie (Approach 1)**
   - Set on first visit to whiskly.co
   - Captures: source (direct, search, baker_link, ad, referral), entry path, timestamp
   - Persists 365 days
   - Stored as `whiskly_ft` cookie

2. **Session entry path tracking (Approach 3 input)**
   - Per session, record how customer arrived at a baker profile
   - Possible values: `browse`, `search`, `category`, `recommendation`, `direct_url`, `baker_link`
   - Browse/search/category/recommendation = Whiskly-driven discovery
   - direct_url/baker_link = baker-driven

3. **Prior order history check (Approach 3 input)**
   - At order creation, check if this customer has any prior order with this baker
   - If yes: NOT Whiskly-sourced (relationship pre-existed)
   - If no AND session entry path is Whiskly-driven: Whiskly-sourced
   - If no AND session entry path is baker-driven: NOT Whiskly-sourced

4. **Baker dashboard widget**
   - Behind feature flag until data is meaningful (suggest: 10+ orders for the baker)
   - Display: "Whiskly-sourced orders this period: X% (rolling 90 days)"
   - Visual progress bar to 40%
   - Explanation tooltip: "Commission activates when this reaches 40% or you've been on Whiskly for 18 months."

---

## 14. Things to Verify Before Pushing Live

- [ ] All instances of "10% commission" removed from /for-bakers
- [ ] All instances of "5% reserve" removed from Terms and Privacy
- [ ] Section 14 of Terms deleted
- [ ] $4.99 platform fee shows as line item at Request to Book (not just receipt)
- [ ] Page titles updated on all 10+ pages
- [ ] Meta descriptions updated
- [ ] OG and Twitter card tags present and pointing to valid og-image.png
- [ ] Phone number consistent across all pages
- [ ] CTA text is "Apply as a Baker" everywhere
- [ ] Copy says "Early Access" everywhere (not "Beta")
- [ ] /bakers page renders baker cards in initial HTML
- [ ] Misspelled test baker profile removed
- [ ] Vercel Pro active, hourly crons deploy successfully
- [ ] Resend configured as Supabase SMTP
- [ ] Leaked Password Protection enabled
- [ ] Stripe `setup_future_usage` configured
- [ ] Privacy Policy and Terms uploaded to Stripe dashboard
- [ ] Attribution database fields added (even if dashboard widget not yet shown)

---

## 15. Notes for Claude Code Implementation

- All copy in this document is final and ready to ship. No placeholders to fill except customer-specific data (baker names, order details, dates).
- Terms and Privacy require human review before publishing as legally binding. Recommend reading through once for tone/clarity, then publishing.
- The attribution layer build (Section 13) can run in parallel with Phase A copy changes. They don't block each other.
- The Founding Baker offer in Terms (Section 6.5) and the marketing version on /for-bakers must stay in sync. If you change one, change the other.
- The 60-day notice in Section 6.3 and 90-day notice in Section 6.4 are deliberate. Don't equalize them.
