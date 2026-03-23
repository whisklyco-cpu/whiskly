# Whiskly Soft Launch Test Checklist

Last updated: March 2026

Share this with your testers. Ask them to note anything confusing, broken, or missing.
Test site: https://www.whiskly.co

---

## Tester 1 — Husband (Customer)

### Account Setup
- [ ] Go to whiskly.co and create a customer account
- [ ] Verify the confirmation email arrived
- [ ] Sign in and confirm you land on the customer dashboard
- [ ] Go to Account Settings and update your name

### Browsing
- [ ] Go to Browse Bakers
- [ ] Use the specialty filter — does it work?
- [ ] Open a baker profile — does it look good?
- [ ] Save a baker to favorites
- [ ] Go back to dashboard and confirm saved baker appears

### Placing an Order
- [ ] Go to Daisy Belle Bakery's profile
- [ ] Fill out the order form completely
- [ ] Select Delivery and type a partial address — does Google autocomplete suggest addresses?
- [ ] Select an address from the dropdown — does it fill in city, state, zip automatically?
- [ ] If autocomplete doesn't work, manually type city, state, and zip — does the form accept it?
- [ ] Upload an inspiration photo
- [ ] Submit the order
- [ ] Confirm you land on the customer dashboard and see the order

### Counter Offer Flow (baker will send one)
- [ ] Wait for baker to send a counter offer
- [ ] Check your Orders tab — does a yellow "Counter Offer" banner appear at the top?
- [ ] Open the order — does the counter price and message show clearly?
- [ ] Click Accept — does the order move to Confirmed?
- [ ] Confirm you get a prompt to pay deposit

### Deposit Payment
- [ ] Pay the deposit using a test card: 4242 4242 4242 4242, any future expiry, any CVC
- [ ] Confirm the deposit paid successfully
- [ ] Check that the order status updates

### Messaging
- [ ] Send a message to the baker from the Messages tab
- [ ] Confirm the message appears in your thread

### Cancellation (test on a separate order)
- [ ] Place a second order with the baker
- [ ] Try cancelling it while it is still Pending — is it free?
- [ ] Place a third order, wait for it to be confirmed, then try cancelling — does it show the refund policy?
- [ ] Confirm the cancellation warning mentions what you will or won't get back

### Dispute (test on a separate order)
- [ ] Place an order and have it confirmed and paid
- [ ] File a dispute from the order card
- [ ] Select a reason and write a description (at least 20 characters)
- [ ] Confirm the order locks and shows Disputed status
- [ ] Confirm you receive a dispute acknowledgment email

### Tips
- [ ] After an order is marked complete by the baker, does a tip prompt appear?
- [ ] Try each tip percentage — does the dollar amount calculate correctly?
- [ ] Try the custom amount
- [ ] Click No thanks — does the banner disappear and stay gone?

### General
- [ ] Does the site look good on your phone?
- [ ] Is anything confusing or unclear?
- [ ] Did you receive all expected emails? (order confirmation, deposit receipt, dispute acknowledgment)
- [ ] Note anything that felt broken or frustrating

---

## Tester 2 — Best Friend (Baker)

### Account Setup
- [ ] Go to whiskly.co/join and apply as a baker
- [ ] Fill out your full profile — bio, specialties, starting price, lead time, city, state
- [ ] Upload a profile photo
- [ ] Upload at least 3 portfolio photos
- [ ] Add your phone number (used for emergency contact only)
- [ ] Connect Stripe — go through the full Stripe Connect onboarding
- [ ] Confirm your profile appears on the Browse Bakers page

### Receiving and Accepting Orders
- [ ] Wait for a test order to come in from the customer tester
- [ ] Open the order and review all details — is everything clear?
- [ ] Click Accept — does the two-step confirmation modal appear?
- [ ] Check that the modal shows customer name, event type, date, budget
- [ ] Confirm the order — does the customer get a deposit prompt?

### Counter Offer Flow
- [ ] On a separate test order, click Counter Offer instead of Accept
- [ ] Enter a price higher than the customer's budget
- [ ] Add an optional note
- [ ] Send the counter — does the order show Counter Sent status?
- [ ] Wait for the customer to accept — does the order update to Confirmed?

### Managing Orders
- [ ] Mark an accepted order as In Progress
- [ ] Mark it as Ready
- [ ] Upload a delivery/handoff photo
- [ ] Confirm the customer receives a notification

### Cancellation
- [ ] On a confirmed order, try cancelling
- [ ] Does the reason dropdown appear?
- [ ] Does it warn you about the strike and refund consequences?
- [ ] Complete the cancellation and confirm the customer gets notified

### Dispute
- [ ] File a dispute on an order
- [ ] Select a reason and write a description
- [ ] Confirm the order locks
- [ ] Confirm you receive a dispute acknowledgment email

### Rating a Customer
- [ ] After an order completes, does a Rate Customer button appear?
- [ ] Rate the customer — does the star selector work?
- [ ] Add a private note
- [ ] Submit — confirm no error

### Blocking and Flagging
- [ ] On a completed order, click the three-dots menu
- [ ] Try blocking the customer — does the confirmation modal appear?
- [ ] Try flagging the customer — does the reason dropdown appear?
- [ ] Confirm the flag warning message appears about tip-based flags

### Vacation Scheduling
- [ ] Go to Profile tab and find Availability Status
- [ ] Toggle Vacation Mode on — does the return date picker appear?
- [ ] Add a scheduled vacation with start and end dates
- [ ] Confirm it appears in the Scheduled Vacations list
- [ ] Delete the vacation

### At Capacity and Emergency Pause
- [ ] Toggle At Capacity on — go to your public profile and confirm the banner appears
- [ ] Toggle it off
- [ ] Find the Emergency Pause button — does it look appropriately serious?
- [ ] Do NOT trigger it unless testing — confirm the warning text is clear

### Emergency Roster
- [ ] Find the Emergency Roster section in your profile
- [ ] Toggle it on
- [ ] Select which urgency windows you are available for
- [ ] Save and confirm it persists after page refresh

### Profile and Visibility
- [ ] View your public profile at whiskly.co/bakers/[your-id]
- [ ] Does everything look correct?
- [ ] Does your profile appear in Browse Bakers?
- [ ] Does your starting price show?
- [ ] Does your lead time show?

### Messages
- [ ] Reply to a message from the customer tester
- [ ] Confirm the thread is tied to the right order

### General
- [ ] Does the dashboard look good on your phone?
- [ ] Is the order management flow intuitive?
- [ ] Was anything confusing about the onboarding?
- [ ] Did you receive all expected emails? (new order notification, deposit confirmation)
- [ ] Note anything that felt broken or frustrating

---

## Tester 3 — Other Best Friend (Marketing + Customer)

### Customer Side — Fresh Eyes Test
This tester should approach the site as a complete stranger who knows nothing about Whiskly.

- [ ] Go to whiskly.co — what is your first impression?
- [ ] Does the homepage clearly explain what Whiskly is?
- [ ] Does the For Bakers page make sense?
- [ ] Does the FAQ answer your questions?
- [ ] Create a customer account
- [ ] Browse bakers — is it easy to find someone?
- [ ] Place a test order — is the form clear and easy to fill out?
- [ ] Does the confirmation make sense?

### Marketing Audit
- [ ] Go to whiskly.co/marketing and enter the marketing password
- [ ] Check the Featured Bakers tab — does it load correctly?
- [ ] Check the Content Hub tab — does it work?
- [ ] Check the Campaigns tab
- [ ] Check the Social Log tab
- [ ] Check the Seasonal tab
- [ ] Is there anything in the marketing portal that is confusing or missing?

### Copy and Content Review
- [ ] Read the homepage copy — is anything unclear or off-brand?
- [ ] Read the For Bakers page — is it compelling?
- [ ] Read the FAQ — are any answers confusing or outdated?
- [ ] Check the Terms of Service and Privacy Policy — do they reference whiskly.co (not .com)?
- [ ] Check all email addresses throughout the site — should all be @whiskly.co not @whiskly.com
- [ ] Note any typos, grammar issues, or em dashes (—) that snuck through

### Mobile Experience
- [ ] Test the entire site on your phone
- [ ] Does the homepage look good on mobile?
- [ ] Does Browse Bakers work on mobile — can you use the filters?
- [ ] Does the order form work on mobile?
- [ ] Does the customer dashboard work on mobile?

### Social Media Check
- [ ] Does Whiskly have an Instagram presence?
- [ ] Does the Instagram link to whiskly.co?
- [ ] Is there enough content for a baker to trust the platform looks real?

### General Feedback
- [ ] First impression in one sentence?
- [ ] Would you use this to order a custom cake?
- [ ] What is the one thing that would make you trust it more?
- [ ] What is the one thing that confused you most?
- [ ] Did anything feel broken or unprofessional?

---

## After Testing — Report Back

Ask each tester to send you:
1. A list of anything that broke or didn't work
2. A list of anything confusing or unclear
3. Their overall first impression
4. One thing they would change

Collect all feedback before making any fixes so you can prioritize what matters most.
