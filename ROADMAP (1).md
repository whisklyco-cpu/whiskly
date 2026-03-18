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
- [ ] Cancellation/dispute UI (customer + baker dashboards)
- [ ] Order agreement/contract (auto-generated PDF on baker acceptance, free for all tiers)
- [ ] Baker outreach email template
- [ ] Daisy Belle Pro / Whiskly Test Free (SQL fix)
- [ ] FAQ cleanup + em dash sweep
- [ ] Tips (100% to baker, prompted at order completion)

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
