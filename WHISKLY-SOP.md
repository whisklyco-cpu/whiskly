# Whiskly Standard Operating Procedures (SOPs)

Last updated: March 2026
Owner: Whiskly Operations

---

## Table of Contents

1. Baker Application & Onboarding
2. Order Lifecycle Management
3. Payment & Refund Procedures
4. Dispute Resolution
5. Emergency Baker Pause Protocol
6. Baker Violation & Strike System
7. Customer Complaints
8. Baker Account Changes (Location, Vacation, Capacity)
9. Platform Suspension & Removal
10. Marketing & Featured Baker Rotation
11. Tax & Accounting
12. Weekly Admin Checklist

---

## 1. Baker Application & Onboarding

### When a baker applies:
1. Baker submits join form at /join
2. Application appears in Admin Panel → Applications tab
3. Review within 48 hours of submission

### Review checklist:
- [ ] Profile photo uploaded (professional, clearly shows baker or their work)
- [ ] Bio is complete and free of contact information (no phone numbers, Instagram handles, or external links)
- [ ] At least one specialty selected
- [ ] City and state are accurate
- [ ] Starting price is set
- [ ] Specialties match portfolio if photos are uploaded

### If approving:
1. Click Approve in admin panel
2. Baker receives automated approval email
3. Add a welcome note in the baker's messages tab if possible
4. Consider featuring them in the marketing portal for their first 2 weeks

### If rejecting:
1. Click Reject in admin panel
2. Send a personal email explaining why and what they can fix to reapply
3. Common rejection reasons: incomplete profile, no photo, bio contains contact info, location unclear

### Onboarding follow-up (Day 3):
- Check if baker has connected Stripe
- If not, send a reminder email from support@whiskly.co
- Check if baker has uploaded portfolio photos
- If not, send a tip email about the importance of photos for bookings

---

## 2. Order Lifecycle Management

### Order statuses and what each means:
| Status | Meaning | Who acts next |
|--------|---------|---------------|
| Pending | Customer submitted, baker hasn't responded | Baker |
| Countered | Baker sent a counter offer | Customer |
| Confirmed | Baker accepted, deposit needed | Customer |
| In Progress | Baker is actively working | Baker |
| Ready | Order is ready for pickup or delivery | Customer |
| Complete | Order fulfilled and confirmed | Neither |
| Declined | Baker declined the request | Customer (find new baker) |
| Disputed | Formal dispute filed, order locked | Admin |
| Refunded | Refund issued | Neither |

### Overdue order protocol:
- **48hrs no response:** Customer receives automated email. Admin receives alert.
- **Event date passed with no resolution:** Order auto-declines. See Strike System (Section 6).

### Rush order definition:
Any order where the event date falls within the baker's stated lead time. Shown with a red Rush badge in both dashboards.

---

## 3. Payment & Refund Procedures

### Normal payment flow:
1. Baker accepts order → Customer receives deposit prompt
2. Customer pays 50% deposit → Order confirmed
3. 48hrs before event → Customer receives remainder prompt
4. Customer pays remaining 50% → Baker notified
5. Baker delivers → Customer confirms → Order complete

### Processing fee:
- 3% platform fee added to customer total at checkout
- This covers Stripe processing costs
- Clearly shown as a line item at checkout

### Commission rates:
- Free tier bakers: 10% of order total
- Pro tier bakers: 7% of order total
- Tips: 100% to baker, no commission taken

### Refund scenarios:

| Scenario | Refund | Notes |
|----------|--------|-------|
| Baker declines before deposit | N/A | No money exchanged |
| Customer cancels 7+ days before event | Deposit non-refundable | Per Terms of Service |
| Customer cancels within 7 days | Full charge at baker discretion | Baker decides |
| Baker cancels after deposit | Full refund to customer | Baker gets a strike |
| Baker no-show | Full refund to customer | Baker gets a strike |
| Dispute ruled for customer | Full or partial refund | Admin discretion |
| Dispute ruled for baker | No refund | Remainder released if held |

### How to issue a refund:
1. Go to Admin Panel → Orders
2. Find the order
3. Click Refund
4. Confirm in the dialog
5. Stripe processes within 5-10 business days
6. Email customer confirmation manually from support@whiskly.co

### Note on escrow:
Current system does not use escrow. Deposits go directly to baker via Stripe Connect. Refunds pull from baker's Stripe balance. If baker has insufficient balance, contact Stripe support. Escrow system planned for V2.

---

## 4. Dispute Resolution

### When a dispute is filed:
1. Order is automatically locked — no status changes allowed
2. Admin receives priority alert in admin panel
3. Both parties receive an automated email acknowledging the dispute

### Resolution timeline:
- Respond to both parties within 24 hours
- Resolve within 48 hours where possible
- For complex cases, communicate expected timeline to both parties

### Investigation steps:
1. Read the full order details (description, budget, event date)
2. Read all messages between baker and customer
3. Review delivery/handoff photos if available
4. Review inspiration photos submitted with order
5. Contact both parties via support@whiskly.co if needed

### Resolution options:
| Outcome | Action in Admin |
|---------|----------------|
| Rule for customer | Issue full refund, freeze remainder, baker may receive strike |
| Rule for baker | Release payment, notify customer of decision |
| Split decision | Partial refund negotiated between parties |
| No action needed | Unlock order, allow both parties to continue |

### Dispute reasons and typical outcomes:
- **Never delivered:** Verify delivery photo. If no photo, rule for customer.
- **Wrong item:** Review order description vs. delivery photo. Judgment call.
- **Quality issue:** Hardest to adjudicate. Review photos, messages, and description. Consider partial refund.
- **Baker no-show:** Automatic full refund. Baker gets a strike.
- **Customer refusing to pay remainder:** Review if order was fulfilled as described. If yes, rule for baker.
- **False claim:** If evidence clearly shows baker fulfilled order, rule for baker. Document for pattern monitoring.

### After resolution:
1. Mark dispute resolved in admin panel
2. Send personalized email to both parties explaining the decision
3. Log notes in the order for your records
4. Assess if strike is warranted (see Section 6)

---

## 5. Emergency Baker Pause Protocol

### What triggers an emergency pause:
Baker clicks "Emergency Pause" in their dashboard. This is for genuine emergencies only — death in family, medical emergency, natural disaster, major home emergency (burst pipe, fire, etc.).

### Immediate automated actions (happens without admin involvement):
- All pending orders placed on 24hr hold
- Existing confirmed orders flagged for admin review
- Customers with active orders receive: "Your baker has had an unexpected situation. Whiskly is reviewing your order and will be in touch within 24 hours."
- Admin receives Priority alert in admin panel

### Admin emergency checklist (work through in order):

**Step 1 — Contact the baker (within 2 hours)**
- [ ] Email baker at their registered address
- [ ] Note their response and situation in the case log
- [ ] Determine expected return timeline if possible

**Step 2 — Assess affected orders (within 2 hours)**
- [ ] Open the emergency case in admin panel
- [ ] Review all affected orders sorted by urgency (event date)
- [ ] Flag any orders where event is within 72 hours as Critical

**Step 3 — Notify customers based on urgency**

For events within 72 hours (Critical):
- [ ] Call customer if phone number is available
- [ ] Send urgent email immediately using the pre-drafted Critical template
- [ ] Offer: full refund OR referral to another Whiskly baker OR hold 24hrs for baker to confirm

For events within 1 week (High):
- [ ] Send email within 4 hours using High Priority template
- [ ] Offer: hold for 48hrs OR refund OR referral

For events more than 1 week out (Standard):
- [ ] Send email within 24 hours using Standard template
- [ ] Offer: hold for baker OR refund if preferred

**Step 4 — Decide order outcomes**
For each affected order choose one:
- [ ] Keep on hold (baker confirms they can still fulfill)
- [ ] Find replacement baker (reach out to similar baker in same area)
- [ ] Issue refund and cancel

**Step 5 — Resolve the case**
- [ ] Extend pause 24hrs if baker needs more time
- [ ] Convert to Vacation Mode if baker will be out longer (set return date)
- [ ] Mark baker as returned if situation resolved
- [ ] Suspend baker if situation is unresolvable

**Step 6 — Log everything**
- [ ] Document situation, communications, and resolutions in case notes
- [ ] Note if this is baker's first emergency pause
- [ ] Close the case

### Emergency pause limits:
- 1 emergency pause allowed per baker per 90 days
- Second emergency pause within 90 days converts to Vacation Mode (no admin alert, baker manages themselves)
- This limit protects against misuse while accommodating genuine emergencies

### No strikes issued for emergency pauses.
Emergency situations are never penalized. Strikes are only for negligence or bad faith behavior.

---

## 6. Baker Violation & Strike System

### What earns a strike:
| Violation | Strikes |
|-----------|---------|
| Event date passed, order never responded to | 1 |
| Baker cancels after deposit paid | 1 |
| Baker no-show for pickup order | 1 |
| Dispute ruled against baker | 1 |
| Baker found to have taken payment off-platform | 2 |
| Abusive behavior toward customer (verified) | 2 |

### Strike consequences:
| Strikes | Action |
|---------|--------|
| 1 | Automated warning email to baker |
| 2 | Warning email + flagged in admin panel for monitoring |
| 3 | Auto-suspend + admin alert to review and decide next steps |

### Strike review process (after 3rd strike):
1. Admin reviews full order history
2. Admin reviews all dispute records
3. Decide: permanent suspension or final warning with probation
4. Email baker with decision and reasoning
5. If reinstating: baker must re-verify profile and re-connect Stripe

### Strike appeals:
Baker can appeal a strike by emailing support@whiskly.co within 7 days.
Admin reviews appeal within 48 hours.
If appeal is valid (e.g. strike was issued in error), remove strike and log the correction.

---

## 7. Customer Complaints

### Types of customer complaints and how to handle:

**"My baker never responded"**
1. Check order status in admin panel
2. If pending more than 48hrs, manually message the baker
3. If no response within 24hrs, offer customer a refund or alternative baker
4. Issue a strike if event date was missed

**"My baker cancelled on me"**
1. Issue full refund immediately
2. Issue baker a strike
3. Offer to help find replacement baker
4. Send personal apology email from support@whiskly.co

**"The cake looked nothing like what I ordered"**
1. Request photos from customer
2. Review original order description and inspiration photos
3. Mediate between baker and customer
4. If quality is genuinely misrepresented, consider partial refund

**"I never received my order"**
1. Check delivery proof photo in admin panel
2. If no delivery photo, rule for customer — full refund
3. If delivery photo exists, investigate further before ruling
4. Issue baker a strike if no-show is confirmed

**"I was charged incorrectly"**
1. Pull up order in admin panel
2. Review payment amounts vs. order budget
3. If overcharge confirmed, issue difference as refund
4. Contact Stripe support if payment discrepancy is on their end

---

## 8. Baker Account Changes

### Baker updates their location:
1. Baker saves new city/state in profile
2. Admin receives a notification in the admin panel
3. Saved customers receive automated email: "A baker you saved has moved to [New City]"
4. In-progress orders are not affected — existing delivery/pickup details remain
5. If move affects ability to fulfill existing orders, treat as baker cancellation (see refund table)

### Baker enables Vacation Mode:
- Baker sets return date
- Profile shows "Back on [date]" banner
- New order form is disabled with message: "This baker is on vacation until [date]"
- Existing orders continue normally
- No strikes while on vacation
- Admin notified so you have geographic coverage awareness

### Baker enables At Capacity:
- Profile shows "Currently at capacity" banner
- New order form shows: "This baker is not taking new orders right now. Save them to get notified when they're available."
- No return date required
- Existing orders continue normally
- Admin notified

### Baker enables Emergency Pause:
See Section 5.

---

## 9. Platform Suspension & Removal

### Temporary suspension (admin-initiated):
Used for: 3 strikes reached, serious complaint under investigation, suspicious activity.
- Baker profile hidden from browse
- Existing orders can still be fulfilled at baker's discretion
- Baker receives email explaining suspension and expected timeline
- Admin reviews within 72 hours

### Permanent removal:
Used for: fraud, abusive behavior, repeated violations after reinstatement.
1. Suspend baker account
2. Cancel any active Stripe Connect relationship
3. Email baker with reason for permanent removal
4. Retain order history for accounting and dispute purposes
5. Notify any customers with active orders and issue refunds

### Customer suspension:
Used for: fraudulent disputes, abusive behavior toward bakers, chargebacks without valid reason.
1. Suspend customer account in admin panel
2. Email customer with reason
3. If chargeback was filed with bank, document everything for Stripe dispute response

---

## 10. Marketing & Featured Baker Rotation

### Featured baker guidelines:
- Maximum 30 days featured per rotation
- Rotate at least once per month
- Prioritize Pro bakers for featured placement
- Feature bakers across different specialties and locations
- Use the Marketing Portal to manage featured bakers

### Social media posting schedule (recommended):
- Instagram/Threads: 3-4x per week
- TikTok: 2-3x per week
- Facebook: 2x per week
- Lemon8: 1-2x per week

### Content priorities:
1. New baker spotlights (great for early growth)
2. Completed order photos (with baker and customer permission)
3. Seasonal content (see Seasonal Campaign Calendar in marketing portal)
4. Behind-the-scenes baker content

### Campaign timing:
- Send seasonal campaigns 3 weeks before the event date
- Send weekly digest to customers on Tuesdays (best open rates)
- Never send more than 2 emails per week to any recipient

---

## 11. Tax & Accounting

### Monthly tasks:
- [ ] Download transaction CSV from Admin Panel → Accounting
- [ ] Review baker payout summary
- [ ] Reconcile with Stripe dashboard
- [ ] Save CSV to accounting folder with month and year label

### Quarterly tasks:
- [ ] Pay estimated IRS taxes (due: April 15, June 16, September 15, January 15)
- [ ] Review commission revenue vs. Pro subscription revenue
- [ ] Update financial projections

### Annual tasks:
- [ ] Provide transaction history to CPA for tax filing
- [ ] Issue 1099s to bakers who earned $600+ through the platform (consult CPA)
- [ ] Review pricing and commission structure

### Important reminders:
- Whiskly does NOT collect or remit sales tax on behalf of bakers
- Bakers are independent contractors, not employees
- Set aside 35% of all owner draws for personal taxes
- Pay quarterly estimated taxes to avoid April penalties

---

## 12. Weekly Admin Checklist

Run through this every Monday morning. Takes about 15-20 minutes.

**Orders:**
- [ ] Check for any overdue pending orders (48hrs+ no response)
- [ ] Check for any orders with event dates this week
- [ ] Review any flagged or disputed orders
- [ ] Check for any emergency cases open

**Bakers:**
- [ ] Review any new applications
- [ ] Check for bakers with 2 strikes (monitor closely)
- [ ] Check Stripe Connect status for any bakers showing "Not connected"
- [ ] Review baker count and geographic coverage

**Marketing:**
- [ ] Check featured baker rotation (anyone over 30 days)
- [ ] Check seasonal calendar for upcoming events needing campaigns
- [ ] Review social post log — any bakers not featured recently?

**Finance:**
- [ ] Review week's GMV and commission in Accounting tab
- [ ] Note any unusually large or small orders
- [ ] Check for any refunds issued and reason

**Platform health:**
- [ ] Check Vercel deployments — any failed builds?
- [ ] Check Supabase dashboard — any errors or unusual activity?
- [ ] Check Stripe dashboard — any failed payments or disputes?

---

*This document should be reviewed and updated quarterly or whenever a significant platform change is made.*
*Questions or suggested additions: support@whiskly.co*
