# Whiskly Product Roadmap

Last updated: March 2026

---

## Currently Live
- Homepage (desktop + mobile)
- Browse Bakers with mobile filters
- Baker profiles with order form
- Baker dashboard (orders, messages, profile, gallery)
- Customer dashboard (orders, messages, saved bakers, account)
- Messaging system (real-time, order threads + general inquiries)
- Reviews system
- Stripe payment flow (deposit + remainder + Connect onboarding + webhooks)
- Admin panel (orders, bakers, customers, disputes, applications, accounting)
- Marketing portal (featured bakers, campaigns, content hub, social log, seasonal)
- Support / contact page
- FAQ page
- For Bakers page (dynamic social proof tiers)
- Terms of Service + Privacy Policy
- Forgot password + account settings
- Domain: whiskly.co

---

## Pre-Launch (In Progress)
- [x] Cancellation UI — baker and customer dashboards (reason required, refund policy shown)
- [x] Dispute filing UI — baker and customer dashboards (reason + description, order locks)
- [x] Two-step accept confirmation on baker dashboard
- [x] Counter offer Accept/Decline UI on customer dashboard
- [ ] Two-way ratings (baker rates customer, optional, shown to bakers on order requests) — Session 2 ready
- [ ] Block feature (baker blocks customer silently, customer blocks baker) — Session 2 ready
- [ ] Baker flag system (restricted reasons, 3+ flags auto-flags customer in admin) — Session 2 ready
- [ ] Customer non-receipt confirmation + auto-resolve under $50 — Session 2 ready
- [ ] Pre-planned vacation scheduling — Session 3
- [ ] Strike expiry system — Session 3
- [ ] Tips (100% to baker, prompted at order completion)
- [ ] Order agreement/contract (auto-generated PDF on baker acceptance)
- [ ] Daisy Belle Pro SQL fix — run: UPDATE bakers SET tier='pro' WHERE business_name='Daisy Belle Bakery'
- [ ] support@whiskly.co setup + Resend direct send from admin panel

### Dispute Automation Rules
- Auto-refund ONLY when: delivery photo missing AND customer types confirmation AND baker has no prior disputes AND order under $50
- Auto-strike baker when: cancels after deposit paid
- Auto-flag customer when: 3+ flags from different bakers
- Auto-convert emergency pause to vacation mode when: 2nd pause within 90 days
- Auto-resolve under $50 when: all four auto-refund conditions met AND customer has fewer than 2 prior refunds
- Auto-disable auto-resolve for: any baker with prior dispute, any customer with 2+ disputes or 2+ refunds in 6 months

### Strike System
- Strike 1: expires after 12 months OR 10 completed orders with no issues (whichever first)
- Strike 2: expires after 18 months OR 20 completed orders with no issues
- Strike 3: never auto-expires, requires admin review and appeal
- Emergency pause abuse strikes: expire after 6 months
- Completed order with no issues = Complete status + no dispute + no cancellation + customer rating 3+
- Strikes never deleted from history, just marked inactive
- Baker notified when strike issued AND when strike expires

### Customer Trust System
- Baker rates customer after order (optional, 1-5 stars + private note)
- Customer rating shown to bakers on order request cards
- Customer flag reasons (baker-only, restricted list): abusive behavior, false information on order, false dispute, repeated no-show/ghosting, attempted off-platform transaction
- Flag visibility: admin only (until V2 when baker network visibility unlocked)
- Auto-disable auto-resolve for customers with 2+ disputes or 2+ refunds in 6 months
- Pattern detection: customer disputes 2+ orders → admin flagged, auto-resolve disabled

### Gaming Prevention
- No public messaging about delivery photo requirements (silent protection)
- Customer must type "I confirm I did not receive this order" for non-receipt claim
- Photo upload timestamp stored — flagged if uploaded 2+ hours after delivery time
- Baker loses money on auto-refund, no upside to skipping photos
- First photo-less refund = warning email, no strike. Second = admin review, likely strike.

---

## V1 — Core Product Completeness
- [ ] Per-specialty pricing on baker profiles
- [ ] Reorder feature (one-click reorder from past baker)
- [ ] Cron: Important Dates reminder emails
- [ ] Mobile QA final pass

---

## V2 — Pro Tier
- [ ] Pro billing (Stripe subscriptions + Founding Baker rate)
- [ ] Founding Baker badge logic (first 50, locked forever)
- [ ] Analytics dashboard (profile views, requests, conversion rate)
- [ ] Custom booking links (whiskly.co/bakers/yourname)
- [ ] Profile writing assistance (AI-powered bio generator)
- [ ] Pricing calculator (market-based by zip and specialty)

---

## V2 — Payments & Legal
- [ ] **Stripe escrow** — hold full order amount with Whiskly, release to baker after completion
  - WHY: Current flow pays baker deposit immediately via Stripe Connect. If a dispute is filed after deposit but before remainder, refunding requires pulling money back from baker's account which depends on their balance. Escrow eliminates this risk entirely.
  - TRIGGER: Build this when dispute volume or order volume justifies the complexity. Suggested trigger: 50+ orders/month or first escrow-related dispute.
  - COMPLEXITY: Medium-high. Requires Stripe Connect changes, new webhook events, and updated payout logic.
- [ ] Formal digital contract with e-signature on baker acceptance and customer deposit payment
  - WHY: Currently baker acceptance + customer payment serves as implicit agreement. A formal contract with PDF download closes legal gaps for higher-value orders.

---

## Post-Launch Immediate (first week after launch)
- [ ] **Resend direct send from admin panel** — verify support@whiskly.co in Resend dashboard, create `/api/admin/send-email` route, replace all "Open in Email" + "Copy Text" combos in admin panel (Emergency and Dispute workflows) with a single "Send Email" button that fires Resend directly and shows "✓ Sent" inline. No mail client dependency. ~30 min build. TRIGGER: Do this the same week you set up support@whiskly.co email.
- [ ] **Set up support@whiskly.co** — create the email address (Google Workspace or Zoho, ~$6/month), verify in Resend dashboard, update all email references in codebase from placeholder to live address
- [ ] **Stripe webhook verify** — confirm webhook is receiving events correctly on whiskly.co (check Stripe dashboard → Webhooks → recent deliveries)
- [ ] **First baker SQL fix** — confirm `tier` column is correct for all bakers (run: `SELECT business_name, tier, is_pro FROM bakers ORDER BY created_at`)

---

## V3 — Growth
- [ ] Referral program (baker referral codes, customer referral credits)
- [ ] Push notifications
- [ ] Block feature (baker blocks customer or vice versa)
- [ ] Seasonal push campaigns (Pro bakers featured in holiday emails)
- [ ] Weekly digest email to admin (orders, revenue, new bakers)
- [ ] Auto-rotation cron for featured bakers (30-day limit)

---

## V4 — Scale
- [ ] Native mobile app (iOS + Android)
- [ ] Social media API integrations (Instagram, TikTok posting)
- [ ] Baker subscription tiers beyond Pro
- [ ] Multi-location baker support
- [ ] Gift cards
- [ ] Wholesale/bulk ordering for corporate clients

---

## Known Technical Debt
- [ ] Stripe API version should be reviewed annually (currently 2026-02-25.clover)
- [ ] localStorage used for campaign history and social log in marketing portal — migrate to Supabase for persistence across devices
- [ ] Customer saved bakers stored in localStorage — migrate to Supabase
- [ ] Admin/marketing passwords stored as env vars — migrate to Supabase user roles when team grows beyond 2-3 people

---

## Business Decisions Locked
- Commission: 10% free tier, 7% Pro tier
- Pro pricing: $29/month or $199/year
- Founding Baker: $19/month or $149/year, first 50 only, locked forever
- Tips: 100% to baker, Whiskly takes nothing
- Entity: Delaware LLC
- Domain: whiskly.co
- Supply-first go-to-market (bakers before customers)
- No fake bakers on the platform

---

## Notes on Dispute Flow (Current V1 Limitation)
Current dispute flow freezes the remainder payment when a dispute is filed. The deposit (already paid to baker via Stripe Connect) requires a Stripe refund which pulls from baker's account balance. This works at low volume but becomes a problem if:
- Baker has already spent the deposit funds
- Multiple disputes are open simultaneously
- High-value orders are disputed

**Resolution:** Build Stripe escrow in V2 (see above). Until then, admin handles refunds manually through the Stripe dashboard if needed.