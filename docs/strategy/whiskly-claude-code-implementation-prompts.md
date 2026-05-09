# Whiskly Claude Code Implementation Prompts

Sequenced prompts for implementing everything from the May 8, 2026 strategy session.

## How to use this

1. Have both source-of-truth files ready to attach to Claude Code:
   - `whiskly-phase-a-drafts.md`
   - `whiskly-baker-communications.md`
2. Run batches **in order**. Each batch builds on the previous.
3. After each batch, do the verification step before moving on.
4. The "Manual Tasks" section at the bottom lists things Claude Code can't do (Vercel upgrade, Stripe dashboard work, etc.). Do those in parallel.

---

## Batch 1: Copy and Content Updates (no functional changes)

**What this changes:** Public-facing copy on Terms, Privacy, /for-bakers, homepage, FAQ, page titles, meta tags. Locks CTA language and "Early Access" wording site-wide.

**Risk level:** Low. Pure content. No functional impact.

**Time estimate:** 15 to 30 minutes of Claude Code work.

**Prompt to paste:**

```
I'm attaching whiskly-phase-a-drafts.md as the source of truth for the changes below. Please read it before starting.

Implement Sections 1, 2, 3, 4, 5, 7, 8, 9, and 10 of that document. Specifically:

1. Replace the entire Section 6 of Terms of Service with the rewrite in the doc (Section 1 of source doc)
2. Delete the current Section 14 of Terms (fee waiver clause)
3. Find and remove all references to "5% reserve balance," "5% annual reserve," "annual reserve account," and "withholding for chargeback protection" from BOTH Terms of Service and Privacy Policy
4. Update "Last Updated" dates on Terms and Privacy to today
5. Renumber Terms sections if Section 14 deletion creates gaps
6. Rewrite the /for-bakers page using the copy in Section 4 of source doc. Keep the existing "Sound familiar?" pain points section as-is. Replace pricing, tiers, Founding Baker, and add new "Why we built it this way" section.
7. Add the three new customer FAQ entries from Section 5 of source doc
8. Update CTAs site-wide: every instance of "Join as Baker," "Become a Baker," or "Get Started Free" (when referring to baker application) becomes "Apply as a Baker"
9. Replace every instance of "Currently in Beta," "Beta," or "Beta Launch" with "Early Access"
10. Update page titles per the table in Section 8 of source doc (10 pages need new titles)
11. Update meta descriptions per the table in Section 8 of source doc
12. Add Open Graph and Twitter card tags per Section 9 of source doc to every page
13. Homepage cleanup: remove duplicate hero image from "Verified Platform / Trusted by local bakers" block; replace "Trusted by local bakers" copy with "Built for local bakers. Ready for early access."
14. Remove the unsupported claim "Most bakers hit that in their first week" from /for-bakers

Do NOT change anything related to:
- Database schema
- API endpoints
- Payment processing logic
- Email templates
- Authentication

Show me a summary of files changed when done.
```

**Verification after Batch 1:**

- [ ] Visit /for-bakers and confirm new pricing copy is live
- [ ] Visit /terms and confirm Section 6 is rewritten, Section 14 is gone, no 5% reserve language
- [ ] Visit /privacy and confirm no reserve language
- [ ] Visit /bakers and confirm "Apply as a Baker" CTA in header
- [ ] Visit homepage and check for "Early Access" not "Beta"
- [ ] Check page titles in browser tabs
- [ ] Use a tool like opengraph.xyz or share a link to test OG tags

---

## Batch 2: Customer Checkout Disclosure

**What this changes:** Adds visible $4.99 platform fee line item at "Request to Book" step and on receipt emails.

**Risk level:** Medium. Touches customer-facing payment flow.

**Time estimate:** 30 to 60 minutes.

**Prompt to paste:**

```
I'm attaching whiskly-phase-a-drafts.md. Reference Section 6 of that document.

Add the $4.99 Whiskly platform fee as a visible line item in:

1. The "Request to Book" / order summary step of the customer checkout flow, BEFORE the customer enters payment details
2. The receipt email template sent to customers after order confirmation

Format:
- Line item label: "Whiskly platform fee"
- Amount: $4.99
- Should appear between the order price and the deposit/total section
- Must be visually clear, not hidden in fine print

Do NOT actually charge the fee yet (that's a separate Stripe configuration). Just display it in the UI for now. We will add the actual fee charging in a separate step once display is verified.

Also update any internal pricing/totals calculations to include the $4.99 in the customer-facing total, even though the actual payment intent doesn't yet include it.

Show me the files changed and screenshots of the updated UI if possible.
```

**Verification after Batch 2:**

- [ ] Walk through customer booking flow and confirm $4.99 line item appears at Request to Book
- [ ] Test order completion and check receipt email shows $4.99 line item
- [ ] Confirm customer total reflects the $4.99
- [ ] Confirm no actual charge change yet

---

## Batch 3: /bakers Page SEO Fix

**What this changes:** Converts /bakers from client-side rendering ("Loading...") to SSR or SSG so search engines can index baker cards.

**Risk level:** Medium. Touches the most-trafficked discovery page.

**Time estimate:** 30 to 60 minutes.

**Prompt to paste:**

```
The /bakers page currently renders as "Loading..." in the static HTML response. This blocks search engine indexing of baker profiles.

Convert /bakers to either Server-Side Rendering (SSR) or Static Site Generation with revalidation (ISR).

Recommended approach for Next.js App Router:
- Add `export const revalidate = 3600` to enable ISR with 1-hour revalidation, OR
- Add `export const dynamic = 'force-dynamic'` for full SSR on every request

Pick the option that best fits how baker data updates currently work. If baker data updates infrequently (new bakers added a few times per week), use ISR. If it updates constantly (live status, availability), use SSR.

Requirements:
- Baker cards (name, specialty, photo, price range, location) must appear in the initial HTML response
- Filters and sort should still work as client-side interactions
- Loading state should only appear for client-side filter changes, not initial page load
- Verify in production (after deploy) by viewing page source on /bakers and confirming baker names appear in the HTML

Show me the file changes and explain whether you chose SSR or ISR and why.
```

**Verification after Batch 3:**

- [ ] After deploy, view source on /bakers and confirm baker names in HTML
- [ ] Confirm filters still work after page loads
- [ ] Run a quick lighthouse audit to check for SEO improvements

---

## Batch 4: Database Schema Additions

**What this changes:** Adds new fields to baker, order, and customer tables for attribution tracking and commission lifecycle.

**Risk level:** Medium. Schema changes need migrations. No data loss but order matters.

**Time estimate:** 30 to 60 minutes.

**Prompt to paste:**

```
I'm attaching whiskly-phase-a-drafts.md and whiskly-baker-communications.md. Reference Section 13 of the first doc and Section 8 of the second.

Add the following fields to the Supabase database via migrations.

To the `bakers` table (or equivalent):
- `activation_date` (date, default to created_at date for existing bakers)
- `is_founding_baker` (boolean, default false; set TRUE for the first 10 approved bakers)
- `commission_activation_date` (date, nullable)
- `commission_activation_trigger` (text enum: '40_percent', '18_month_backstop', 'early_activation', null)
- `tier_selected` (text enum: 'free', 'pro', 'elite', null)
- `tier_selected_at` (timestamp, nullable)
- `founding_baker_free_tier_expires_at` (date, nullable; only set when Founding Baker selects Pro or Elite during activation window)
- `disclosure_acknowledged_at` (timestamp, nullable)
- `disclosure_version_acknowledged` (text, nullable)
- `threshold_30_notice_sent_at` (timestamp, nullable)

To the `customers` table (or equivalent):
- `first_touch_source` (text, nullable; values like 'direct', 'search', 'baker_link', 'ad', 'referral')
- `first_touch_path` (text, nullable; the URL path of first visit)
- `first_touch_baker_id` (uuid, nullable; if first touch was a baker profile link)
- `first_touch_at` (timestamp, nullable)

To the `orders` table:
- `is_whiskly_sourced` (boolean, default false; populated at order creation based on attribution rules)
- `discovery_path` (text enum: 'browse', 'search', 'category', 'recommendation', 'direct_url', 'baker_link', null)

Backfill existing data conservatively:
- All existing customers: leave first_touch fields null
- All existing orders: set is_whiskly_sourced to FALSE (we don't know historical attribution)
- All existing bakers: set is_founding_baker to TRUE for the first 2 bakers (the current ones), FALSE for any others
- All existing bakers: set activation_date to their created_at date

Write a Supabase migration file with these changes. Test the migration on a non-production environment first if possible. Do NOT run on production until I confirm.

Show me the migration SQL.
```

**Verification after Batch 4:**

- [ ] Review migration SQL before running
- [ ] Run on non-production environment first
- [ ] Confirm existing bakers have correct is_founding_baker flag
- [ ] Confirm existing orders have is_whiskly_sourced = FALSE
- [ ] Confirm no production data was affected before approving

---

## Batch 5: Attribution Tracking Implementation

**What this changes:** Implements the actual cookie-based first-touch tracking and session entry path detection. Populates the new database fields when customers visit the site or place orders.

**Risk level:** Medium. New tracking logic, but doesn't affect existing flows.

**Time estimate:** 1 to 2 hours.

**Prompt to paste:**

```
Reference Section 13 of whiskly-phase-a-drafts.md (attribution layer build).

Implement the attribution tracking system:

1. **First-touch cookie:**
   - Cookie name: `whiskly_ft`
   - Set on first visit to whiskly.co (any page)
   - Persists 365 days
   - Captures: source, entry_path, baker_id (if baker profile), timestamp
   - Source detection logic:
     - 'baker_link' if path matches /bakers/[slug]
     - 'search' if document.referrer matches Google, Bing, DuckDuckGo, etc.
     - 'referral' if document.referrer is a non-search external domain
     - 'direct' if no referrer
     - 'ad' if URL has utm_medium=cpc or similar (we'll add ad tracking later)
   - When a customer creates an account, copy the first-touch data from cookie to their customer record (the new fields we added in Batch 4)

2. **Session entry path tracking for baker profiles:**
   - When a customer lands on a baker profile, record HOW they got there in this session
   - If they came from /bakers (browse), category page, search page, or recommendation: record 'browse', 'category', 'search', 'recommendation' respectively
   - If they came directly to the baker profile URL: record 'direct_url' or 'baker_link' (depending on referrer)
   - Store this in session storage so it persists through the order flow

3. **Order creation logic:**
   - When an order is created, populate `orders.is_whiskly_sourced` and `orders.discovery_path`
   - Logic for is_whiskly_sourced:
     - TRUE if discovery_path in ('browse', 'search', 'category', 'recommendation') AND customer has no prior order with this baker
     - FALSE otherwise
   - Set discovery_path from session storage value at the time of order

4. **Baker dashboard widget (behind feature flag):**
   - Add a widget that shows baker's rolling 90-day Whiskly-sourced percentage
   - Visual progress bar to 40% threshold
   - Tooltip explaining what counts as Whiskly-sourced
   - Feature flag: only show to bakers with 10+ total orders (not enough data otherwise)

Test thoroughly. Attribution bugs are hard to detect after launch.

Show me the implementation files and explain the attribution flow end-to-end.
```

**Verification after Batch 5:**

- [ ] Visit whiskly.co in incognito and confirm `whiskly_ft` cookie set
- [ ] Test all source paths: direct, search engine, baker link, referral
- [ ] Place a test order via /bakers browse and verify `is_whiskly_sourced = TRUE`
- [ ] Place a test order via direct baker profile URL and verify `is_whiskly_sourced = FALSE`
- [ ] Confirm dashboard widget hidden for bakers under 10 orders, shown for bakers above

---

## Batch 6: Baker Welcome Email and Onboarding Disclosure

**What this changes:** New baker email + in-app disclosure screen blocking dashboard access until acknowledged.

**Risk level:** Low. New additions, doesn't modify existing flows.

**Time estimate:** 1 to 2 hours.

**Prompt to paste:**

```
I'm attaching whiskly-baker-communications.md. Reference Sections 1, 2, and 8 of that document.

Implement two things:

1. **Welcome email (Section 1 of source doc):**
   - Sent automatically via Resend when a baker application is approved
   - Use the exact copy from Section 1
   - Variables to substitute: [Baker name], "Founding Baker" benefits section conditional on is_founding_baker = TRUE
   - From: lxy@whiskly.co (or whatever the founder email is)
   - Reply-to: same
   - Subject: "Welcome to Whiskly. You're in."

2. **Onboarding disclosure screen (Section 2 of source doc):**
   - Shown to bakers on FIRST login after approval, before they can access the dashboard
   - Use the exact copy from Section 2 of source doc
   - Conditional sections: "If you're a Founding Baker" only shows if is_founding_baker = TRUE
   - Variables: [calculated activation deadline date] = baker.activation_date + 18 months
   - Requires checkbox acknowledgment to proceed
   - On acknowledgment, save:
     - bakers.disclosure_acknowledged_at = now()
     - bakers.disclosure_version_acknowledged = "v1.0" (hardcode this for now; we'll version it later)
   - Block all dashboard routes until acknowledged
   - Recommended: store a hash of the disclosure text the baker saw, in case the disclosure text changes later and a baker disputes what they agreed to

Test by:
- Creating a test baker, approving them, confirming welcome email arrives
- Logging in as that baker, confirming disclosure blocks dashboard
- Acknowledging disclosure, confirming dashboard becomes accessible
- Logging out and back in, confirming disclosure does NOT show again

Show me the implementation files and a screenshot of the disclosure screen.
```

**Verification after Batch 6:**

- [ ] Test full flow: apply -> approve -> welcome email -> first login -> disclosure -> acknowledge -> dashboard
- [ ] Confirm Founding Baker conditional copy works
- [ ] Confirm disclosure doesn't show on subsequent logins
- [ ] Check Resend dashboard for email delivery success

---

## Batch 7: Recurring and Triggered Emails

**What this changes:** Monthly impact report (cron-based) plus the threshold-approaching, 60-day commission, tier reminder, and Founding Baker expiration emails (event-triggered).

**Risk level:** Low. Doesn't fire for any baker until conditions are met.

**Time estimate:** 2 to 3 hours.

**Prompt to paste:**

```
I'm attaching whiskly-baker-communications.md. Reference Sections 3 through 7 and Section 8 (implementation notes).

Implement these communications:

1. **Monthly impact report (Section 3):**
   - Cron job: 1st of every month at 9 AM ET
   - For each active baker, calculate metrics for the previous calendar month
   - Send standard version if baker had 1+ orders
   - Send "no orders this month" version (also in Section 3) if baker had 0 orders
   - Skip if baker joined within last 14 days
   - Use the visual progress bar referenced in Section 3 (HTML email, simple inline CSS)

2. **Threshold-approaching notice (Section 4):**
   - Triggered automatically when baker's rolling 90-day Whiskly-sourced % crosses 30%
   - Send only ONCE per account (use bakers.threshold_30_notice_sent_at to prevent duplicates)
   - Skip if baker is within 60 days of 18-month backstop
   - Calculate and trigger via cron job that runs daily, checking each active baker's current %

3. **60-day commission activation notice (Section 5):**
   - Triggered automatically when baker either:
     - Crosses 40% Whiskly-sourced (rolling 90 days), OR
     - Reaches 18 months from activation_date
   - On trigger, set:
     - bakers.commission_activation_date = today + 60 days
     - bakers.commission_activation_trigger = '40_percent' or '18_month_backstop'
   - Use appropriate opening based on trigger
   - Include Founding Baker section conditionally
   - Schedule the 30-day and 7-day reminders (Section 6)

4. **Tier selection reminders (Section 6):**
   - 30-day reminder: 30 days before commission_activation_date if tier_selected is null
   - 7-day reminder: 7 days before activation if tier_selected is still null
   - Default-applied confirmation: send on activation_date if tier_selected is still null; set tier_selected = 'free' and tier_selected_at = now()

5. **Founding Baker free tier expiration (Section 7):**
   - Sent 11 months after commission_activation_date
   - Only to bakers where is_founding_baker = TRUE AND tier_selected IN ('pro', 'elite')
   - Set bakers.founding_baker_free_tier_expires_at = commission_activation_date + 12 months at activation time

For all emails:
- Send via Resend
- From: lxy@whiskly.co (or founder email)
- All have a footer link to email preferences (so bakers can opt out of non-essential emails)
- The 60-day commission notice and tier selection reminders CANNOT be opted out of (they're operationally required)

Edge cases per Section 8 implementation notes:
- Baker pauses account during activation window: pause the 60-day countdown
- Baker disputes Whiskly-sourced calculation: provide a "request a review" link in the activation email that pauses activation pending manual review

Show me the cron job definitions, email templates, and trigger logic. Walk me through the full lifecycle for one hypothetical baker.
```

**Verification after Batch 7:**

- [ ] Manually trigger monthly impact report for one test baker, confirm delivery
- [ ] Manually set a test baker's Whiskly-sourced % to 31% and confirm threshold notice fires once
- [ ] Manually trigger 40% activation, confirm 60-day notice + scheduled reminders
- [ ] Test default-to-Free behavior by letting the test baker not respond
- [ ] Confirm Founding Baker free tier expiration scheduling logic

---

## Manual Tasks (Claude Code cannot do these)

These require dashboard access or your direct action. Do them in parallel with the Claude Code work.

### High priority (do this week)

1. **Vercel Hobby to Pro upgrade**
   - https://vercel.com dashboard, upgrade your project's team
   - $20/month
   - Required for hourly cron jobs (without this, Batch 7 won't run at the right cadence)
   - Add CRON_SECRET environment variable for cron endpoint authentication

2. **Stripe dashboard configuration**
   - Upload finalized Privacy Policy URL: https://whiskly.co/privacy
   - Upload finalized Terms of Service URL: https://whiskly.co/terms
   - Add `setup_future_usage: off_session` to your deposit PaymentIntent (this is a code change but requires you to know which PaymentIntent in your codebase, so flag it for Claude Code if you didn't already do it)
   - Verify Stripe Connect account configuration: Standard accounts (not Express) so bakers handle their own dispute liability

3. **Supabase configuration**
   - Configure Resend as SMTP provider (replace default Supabase SMTP)
   - Enable Leaked Password Protection in Auth settings
   - Verify 2FA is enforced on admin accounts

4. **Phone number update**
   - Update phone number on the site (verify which page(s) it appears on)
   - I couldn't find a phone number on the public site during the audit, so confirm where this needs to go

5. **Misspelled test baker profile**
   - Either delete or hide from public /bakers display
   - Per memory, this is a known issue

### Medium priority (do within 2 weeks)

6. **Create og-image.png**
   - 1200x630px recommended
   - Whiskly logo on brand-color background, or hero photo with logo overlay
   - Upload to /public/og-image.png in your codebase
   - Once uploaded, the OG tags from Batch 1 will reference it

7. **Update Founding Baker counter on /for-bakers**
   - Show "8 of 10 spots left" (or current accurate count)
   - This is manual until you build a database-driven counter

8. **Decide on legal review**
   - The Terms language is final but should still get a human read
   - Consider booking 1 hour with a lawyer via UpCounsel or similar
   - Especially Section 6.4 (early activation provision) which is unusual

---

## Summary of what Claude Code does vs. you do

| Task | Who does it |
|---|---|
| Copy/content updates (Batch 1) | Claude Code |
| Customer checkout disclosure (Batch 2) | Claude Code |
| /bakers SSR fix (Batch 3) | Claude Code |
| Database schema (Batch 4) | Claude Code, you review |
| Attribution tracking (Batch 5) | Claude Code |
| Welcome email + onboarding disclosure (Batch 6) | Claude Code |
| Recurring/triggered emails (Batch 7) | Claude Code |
| Vercel upgrade | You |
| Stripe dashboard config | You |
| Supabase admin config | You |
| Phone number, og-image, Founding Baker counter | You |
| Legal review | You + lawyer |

---

## After all batches complete

Final verification (the launch checklist from Section 14 of Phase A drafts):

- [ ] All instances of "10% commission" removed from /for-bakers
- [ ] All instances of "5% reserve" removed from Terms and Privacy
- [ ] Section 14 of Terms deleted
- [ ] $4.99 platform fee shows as line item at Request to Book
- [ ] Page titles updated on all pages
- [ ] Meta descriptions updated
- [ ] OG and Twitter card tags present
- [ ] Phone number consistent across all pages
- [ ] CTA text is "Apply as a Baker" everywhere
- [ ] Copy says "Early Access" everywhere
- [ ] /bakers page renders baker cards in initial HTML
- [ ] Misspelled test baker profile removed
- [ ] Vercel Pro active, hourly crons deploy successfully
- [ ] Resend configured as Supabase SMTP
- [ ] Leaked Password Protection enabled
- [ ] Stripe `setup_future_usage` configured
- [ ] Privacy Policy and Terms uploaded to Stripe dashboard
- [ ] Welcome email and onboarding disclosure tested end-to-end
- [ ] Cron jobs scheduled and dry-run successfully

When this checklist is fully checked, Whiskly is ready to open for new baker recruitment with the new model.

---

## If something goes wrong

If Claude Code hits an error, paste the error message back here and I'll help debug. Common issues:

- **Migration fails:** usually a foreign key or constraint issue. Check the migration SQL before running.
- **Cron jobs don't fire:** verify Vercel Pro is active and CRON_SECRET is set
- **Resend emails not sending:** check API key in environment variables and domain verification status
- **Attribution data not populating:** likely a cookie or session storage issue, check browser dev tools
- **Disclosure screen doesn't block dashboard:** middleware order issue, dashboard route protection needs to check disclosure_acknowledged_at before any other checks
