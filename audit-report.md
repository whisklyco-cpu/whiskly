# Whiskly Codebase Audit Report
_Generated: 2026-03-23_

---

## Scorecard

| Area | Status | Summary |
|------|--------|---------|
| 1. Code Health | WARN | Missing Suspense on most hook-using pages; unhandled email types; legacy unused route |
| 2. Design Consistency | WARN | Emojis widespread in UI chrome; Geist loaded instead of Playfair/Lato; minor off-palette grays |
| 3. Feature Completeness | PASS | All core features wired; minor gaps in loading states and 404 page |
| 4. Business / Legal Readiness | PASS | Terms, privacy, and baker ToS all present; no hardcoded keys; one missing env example file |

---

## Section 1 — Code Health

### 1.1 Suspense Boundaries

`useSearchParams()` requires a Suspense boundary in Next.js App Router or the build silently degrades.

| File | Hook | Suspense Wrapped? |
|------|------|-------------------|
| `src/app/dashboard/customer/page.tsx` | `useSearchParams()` | YES — `CustomerDashboardInner` wrapped at line 1386 |
| `src/app/login/page.tsx` | `useRouter()` | No Suspense needed (router only) |
| `src/app/signup/page.tsx` | `useRouter()` | No Suspense needed |
| `src/app/dashboard/baker/page.tsx` | `useRouter()` | No Suspense needed |
| `src/app/bakers/[id]/page.tsx` | `useRouter()`, `useParams()` | No Suspense needed |

**Result: PASS.** The only `useSearchParams()` call is correctly wrapped. All other hooks are `useRouter()` / `useParams()` which do not require Suspense.

---

### 1.2 Missing `'use client'` Directives

All files using React hooks already carry `'use client'` at line 1. No missing directives found.

---

### 1.3 Unused / Legacy Routes

| File | Issue |
|------|-------|
| `src/app/(bakers)/page.tsx` | Legacy server-component browse page in route group `(bakers)/`. Superseded by `src/app/bakers/page.tsx`. Has its own inline nav, calls `select('*')` on `bakers` table with no auth or block filtering, references emoji directly. Not linked from any current nav. Should be deleted or the route group removed. |
| `src/app/api/orders/route.ts` | Old form-action API route (`POST /api/orders`). Uses `formData`, inserts orders without auth check, no Stripe, no email notification, no `item_type`. Completely superseded by the direct Supabase insert in `src/app/bakers/[id]/page.tsx`. Dead code — nothing calls this route. |
| `src/app/order-confirmed/page.tsx` | Landing page for the old `refCode`-based confirmation flow from the dead `/api/orders` route. No longer reachable via current UI. |

---

### 1.4 Hardcoded URLs

| File | Line | Value | Issue |
|------|------|-------|-------|
| `src/app/api/email/route.ts` | 7 | `https://whiskly.vercel.app` | Should be `process.env.NEXT_PUBLIC_APP_URL`. All email CTAs point here. |
| `src/app/api/email/route.ts` | 21 | `whiskly.vercel.app` (footer link text) | Same — should reference the live domain `whiskly.co`. |
| `src/app/api/review-reminder/route.ts` | 26, 92, 129 | `https://whiskly.vercel.app` / `hello@whiskly.vercel.app` | Stale staging URL in email templates and sender address. |
| `src/app/contact/page.tsx` | 50 | `whiskly.vercel.app/contact` | Submitted in contact form metadata. |
| `src/app/dashboard/customer/page.tsx` | 997 | `https://whiskly.vercel.app/bakers/` | Share URL in social share button. |

---

### 1.5 Console Statements

All `console.error()` calls are inside `catch` blocks in API routes or utility handlers — appropriate for server-side logging. No `console.log` debug statements found in UI code.

**Result: PASS** (server-side error logging is acceptable).

---

### 1.6 Supabase Query Specificity

`select('*')` used on tables that will grow:

| File | Line | Table | Impact |
|------|------|-------|--------|
| `src/app/(bakers)/page.tsx` | 7 | `bakers` | Legacy page (should be deleted anyway) |
| `src/app/account/settings/page.tsx` | 45, 50 | `customers`, `bakers` | Low — single row per user |
| `src/app/admin/page.tsx` | 44, 45 | `bakers`, `customers` | WARN — admin loads all rows; will grow |
| `src/app/bakers/page.tsx` | 85 | `bakers` | WARN — loads all active bakers; fine at current scale, needs pagination at ~500+ |
| `src/app/bakers/[id]/page.tsx` | 162, 166, 170 | `bakers`, `portfolio_items`, `reviews` | Low — filtered by `id` |
| `src/app/dashboard/baker/page.tsx` | 79 | `bakers` | Low — single row |
| `src/app/dashboard/customer/page.tsx` | 145, 158 | `customers`, `bakers` | WARN — `bakers select('*')` loads all active bakers to populate "nearby bakers" |
| `src/app/api/stripe/refund/route.ts` | 17 | `orders` | Low — single row by id |

---

### 1.7 API Route Error Handling

All Stripe API routes (`deposit`, `remainder`, `refund`, `connect`, `tip`, `webhook`) have proper `try/catch` with `NextResponse.json({ error: ... }, { status: 500 })`.

**Exception:**
| File | Issue |
|------|-------|
| `src/app/api/orders/route.ts` | No try/catch. On Supabase error it redirects to `/error` (a route that does not exist). Dead route but should be removed to avoid confusion. |

---

### 1.8 Unhandled Email Types (P0 Bug)

The `/api/email` route handler does **not** implement the following types, which are actively called from dashboard code. These calls will silently return `{ success: true }` without sending any email:

| Type | Called From | Status in route.ts |
|------|-------------|-------------------|
| `announcement` | Baker dashboard (strike expiry, flag alert), customer dashboard (non-receipt, tip), admin panel, contact page | **MISSING** — no handler |
| `baker_cancelled` | `src/app/dashboard/baker/page.tsx:546` | **MISSING** |
| `customer_cancelled` | `src/app/dashboard/customer/page.tsx:407` | **MISSING** |
| `dispute_filed` | Both dashboards (baker:577, customer:437) | **MISSING** |
| `order_ready` | Baker dashboard (submitHandoff) | Exists — but only sends pickup-flavored text; delivery-specific variant uses `order_ready_customer` from `updateOrderStatus`. Minor overlap. |

---

### 1.9 TypeScript `any` Usage

57 instances of `: any` across the codebase. Concentrated in:
- `src/app/admin/` — all component props typed as `any` (acceptable for internal admin tooling)
- `src/app/dashboard/baker/page.tsx` — `order: any`, `baker: any`, nested state
- `src/app/dashboard/customer/page.tsx` — same pattern

Not a launch blocker but adds risk for refactors. Should be addressed before V2.

---

### 1.10 Missing Loading States / Error Pages

| Missing | Impact |
|---------|--------|
| `src/app/dashboard/baker/loading.tsx` | No skeleton shown during initial dashboard load — user sees blank screen |
| `src/app/dashboard/customer/loading.tsx` | Same |
| `src/app/bakers/loading.tsx` | Browse page shows nothing during load |
| `src/app/not-found.tsx` | Next.js will use its default 404 — unbranded, jarring |
| `src/app/error.tsx` | No global error boundary — unhandled runtime errors show Next.js default |

---

## Section 2 — Design Consistency

### 2.1 Approved Brand Palette

```
Espresso  #2d1a0e    Bark      #5c3d2e    Clay      #8B4513
Linen     #f5f0eb    Mist      #e0d5cc    Canvas    #faf8f6
Gold      #c8975a    Warm tan  #9c7b6b
```

Semantic colors (red `#dc2626`, green `#166534`, amber `#854d0e`, blue `#1e40af`) are used consistently for status indicators across the app — this is intentional and acceptable.

**Off-palette colors found:**

| File | Color | Context | Action |
|------|-------|---------|--------|
| `src/app/(bakers)/page.tsx:105` | `#c4a882` | Footer copyright text | Legacy file; delete the file |
| `src/components/HeroSection.tsx:157,180` | `bg-gray-100` | Avatar fallback background | Replace with `style={{ backgroundColor: '#f5f0eb' }}` |
| `src/app/(bakers)/page.tsx:60` | `bg-gray-100` | Baker photo placeholder | Legacy file; delete |
| `src/app/dashboard/baker/page.tsx:1130` | `bg-gray-50` | Profile link box | Replace with `backgroundColor: '#faf8f6'` |
| `src/app/dashboard/baker/page.tsx:857-858` | `hover:bg-gray-50` | Dots menu items | Replace with `hover:bg-[#faf8f6]` or inline style |
| `src/app/dashboard/customer/page.tsx:1140` | `hover:bg-gray-50` | Dots menu item | Same fix |

---

### 2.2 Emoji in UI Chrome

Brand rule: only the cake logo mark (🎂) is permitted. Everything else should use text or SVG icons.

**Violations:**

| File | Line | Emoji | Context |
|------|------|-------|---------|
| `src/app/bakers/page.tsx` | 268 | 🔍 | "No results" state |
| `src/app/bakers/page.tsx` | 295 | 🏠 | Cottage baker badge |
| `src/app/bakers/page.tsx` | 302 | 📍 | City/state location |
| `src/app/bakers/page.tsx` | 323 | 🚗 | Delivery badge |
| `src/app/bakers/page.tsx` | 325 | 📅 | Lead time badge |
| `src/app/bakers/[id]/page.tsx` | 488 | 🏠 | Cottage baker badge |
| `src/app/bakers/[id]/page.tsx` | 491 | 📍 | Location line |
| `src/app/bakers/[id]/page.tsx` | 576-587 | 🚗 📦 💵 📅 📋 | Baker detail list |
| `src/app/contact/page.tsx` | 8-15 | 📦 💳 🚩 🧑‍🍳 💰 💬 | Contact category icons |
| `src/app/dashboard/customer/page.tsx` | 845 | 💬 | Baker question banner |
| `src/app/(bakers)/page.tsx` | 69 | 📍 | Legacy file |

Logo-mark uses of 🎂 (permitted): `src/app/admin/page.tsx:202`, `src/app/bakers/page.tsx:284`, `src/app/dashboard/customer/page.tsx:603,854,868`, `src/app/bakers/[id]/page.tsx:645`.

---

### 2.3 Font Stack

**Issue:** `src/app/layout.tsx` loads **Geist** and **Geist Mono** via `next/font/google`. The brand specifies Playfair Display (headings) and Lato (body). Geist is a neutral developer font — it does not match the warm, artisan aesthetic of the brand.

`src/app/globals.css:25` falls back to `Arial, Helvetica, sans-serif` — also off-brand.

Email templates use `Georgia, serif` — closer to brand tone but still not Playfair.

---

### 2.4 Dark Background Check

No dark mode or `dark:` Tailwind variants found anywhere. All main pages use `#f5f0eb` (Linen) as the background. Hero section confirmed on Linen. **PASS.**

---

## Section 3 — Feature Completeness

| Feature | Status | Evidence |
|---------|--------|----------|
| Message Baker button on baker profile | PASS | `src/app/bakers/[id]/page.tsx:515` — button opens message modal |
| Messages tab on customer dashboard | PASS | `activeTab === 'messages'` section, line ~1090 |
| Browse bakers page (`/bakers`) | PASS | `src/app/bakers/page.tsx` — full filter UI, block filtering |
| Stripe payment flow | PASS | Deposit/remainder/tip routes; PaymentModal component wired in customer dashboard; webhook confirms payment |
| Admin panel (`/admin`) | PASS | `src/app/admin/page.tsx` — orders, bakers, customers, disputes, emergency |
| Order status flow (pending → complete) | PASS | pending → confirmed → in_progress → ready → complete. Cancel and dispute branches present |
| Delivery complete email trigger | PASS | `baker/page.tsx:269` — `delivery_complete` email sent from `submitDelivery()` |
| Mobile viewport meta tag | WARN | Next.js App Router injects viewport meta automatically via `<Metadata>`. The `layout.tsx` does not explicitly set it but Next.js handles this. Recommend adding `export const viewport` export for explicit control. |
| Responsive breakpoints | PASS | All main pages use `md:` breakpoints. Dashboard pages use mobile-first layout patterns. |
| 404 page (`not-found.tsx`) | FAIL | No `src/app/not-found.tsx` exists — unbranded Next.js default will show |
| Loading skeletons (`loading.tsx`) | FAIL | No `loading.tsx` files found anywhere in `src/app/` |

---

### 3.1 Dead / Superseded Routes

| Route | File | Status |
|-------|------|--------|
| `/(bakers)` | `src/app/(bakers)/page.tsx` | Superseded by `/bakers`. Should be removed. |
| `/api/orders` | `src/app/api/orders/route.ts` | Superseded by direct Supabase insert. Should be removed. |
| `/order-confirmed` | `src/app/order-confirmed/page.tsx` | Tied to dead `/api/orders` flow. Should be removed. |

---

## Section 4 — Business / Legal Readiness

| Check | Status | Notes |
|-------|--------|-------|
| `/terms` page | PASS | `src/app/terms/page.tsx` exists |
| `/privacy` page | PASS | `src/app/privacy/page.tsx` exists |
| Baker onboarding ToS agreement | PASS | `src/app/join/page.tsx:166` — `agreed_to_terms` required before submission; `StepSeven.tsx:46` — explicit agreement text shown |
| Hardcoded Stripe/Supabase keys | PASS | All secrets accessed via `process.env.*` only |
| `.env.example` / `.env.local.example` | FAIL | Only `.env.local` exists (gitignored). No `.env.example` documenting required variables for new developers or deployment platforms. |
| RLS / auth before client mutations | WARN | Client-side dashboards call `supabase.auth.getUser()` / `getSession()` before loading data. However, individual handler functions (e.g. `handleBlockCustomer`, `handleFlagCustomer`, `handleCancelOrder`) do not re-verify auth before the mutation — they rely on the dashboard load guard. This is acceptable because dashboards redirect to `/login` if no session, but RLS policies on the Supabase side should be the authoritative guard. |
| Sender email address | WARN | `src/app/api/email/route.ts:6` — sender is `onboarding@resend.dev` (Resend default). Must be changed to a verified `@whiskly.co` address before launch. Emails from `onboarding@resend.dev` will look unprofessional and may hit spam filters. |
| Admin auth | WARN | Admin panel at `/admin` is protected by a hardcoded password check via env var. Acceptable pre-launch; must migrate to proper role-based auth before any team growth. |

---

## Prioritized Fix List

### P0 — Blocks Launch

| # | Issue | File(s) | Fix |
|---|-------|---------|-----|
| P0-1 | `announcement`, `baker_cancelled`, `customer_cancelled`, `dispute_filed` email types silently no-op | `src/app/api/email/route.ts` | Add handler blocks for each type. `announcement` needs a generic subject/body pass-through. The others need styled templates matching existing email patterns. |
| P0-2 | Sender email is `onboarding@resend.dev` | `src/app/api/email/route.ts:6`, `src/app/api/review-reminder/route.ts:129` | Change `FROM` to `Whiskly <hello@whiskly.co>` after verifying domain in Resend dashboard. |
| P0-3 | All email CTAs point to `whiskly.vercel.app` | `src/app/api/email/route.ts:7`, `review-reminder/route.ts:26,92` | Change `BASE_URL` to `https://whiskly.co`. Update footer text to `whiskly.co`. |
| P0-4 | No `not-found.tsx` | `src/app/` | Create branded 404 page with Navbar, Linen background, "Page not found" message, and links back to home and `/bakers`. |

### P1 — Important Before Investors or Users See It

| # | Issue | File(s) | Fix |
|---|-------|---------|-----|
| P1-1 | Font is Geist, not Playfair Display / Lato | `src/app/layout.tsx`, `globals.css` | Replace Geist with `Playfair_Display` (headings) and `Lato` (body) from `next/font/google`. Update `globals.css` body font-family. |
| P1-2 | Emojis used as UI icons throughout bakers browse and profile pages | `src/app/bakers/page.tsx`, `src/app/bakers/[id]/page.tsx` | Replace location pin 📍 with text "Location:"; delivery 🚗 with "Delivery"; cottage 🏠 with "Cottage Baker" text pill; etc. Use SVG for any icon needing visual weight. |
| P1-3 | Dead routes still served | `src/app/(bakers)/`, `src/app/api/orders/route.ts`, `src/app/order-confirmed/` | Delete all three. They are superseded, unmaintained, and expose old unauthenticated insert surface. |
| P1-4 | No `loading.tsx` on any route | `src/app/dashboard/baker/`, `src/app/dashboard/customer/`, `src/app/bakers/` | Add minimal loading skeletons — at minimum a spinner or pulsing card on dashboard routes and the browse page. |
| P1-5 | No `.env.example` file | Project root | Create `.env.example` documenting: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_GOOGLE_MAPS_KEY`, `ADMIN_PASSWORD`, `MARKETING_PASSWORD`. |
| P1-6 | `hover:bg-gray-50` in dropdown menus | `baker/page.tsx:857-858`, `customer/page.tsx:1140` | Replace with `hover:bg-[#faf8f6]` or equivalent brand canvas color. |
| P1-7 | `bg-gray-100` avatar fallbacks | `src/components/HeroSection.tsx:157,180` | Replace with `style={{ backgroundColor: '#f5f0eb' }}`. |

### P2 — Nice to Have

| # | Issue | File(s) | Fix |
|---|-------|---------|-----|
| P2-1 | 57 `any` type annotations | Various | Progressively type baker/customer/order shapes with interfaces. Start with shared types in `src/types/`. |
| P2-2 | `select('*')` on `bakers` in admin and customer dashboard | `admin/page.tsx:44`, `customer/page.tsx:158` | Specify only needed columns. Admin baker list: `id, business_name, email, city, state, tier, is_active, stripe_account_id, created_at`. |
| P2-3 | No global `error.tsx` | `src/app/` | Add root `error.tsx` with branded error UI and "Go home" button. |
| P2-4 | `src/app/api/orders/route.ts` uses `supabase` browser client in server route | `src/app/api/orders/route.ts` | Moot if deleted (P1-3), but worth noting the pattern — API routes should use `createClient` with service role key, not the browser client. |
| P2-5 | `isPro` sent in `delivery_complete` email payload but not used in route handler | `baker/page.tsx:269`, `email/route.ts` | Either use it in the email template or stop sending it. |
| P2-6 | Admin password in env var | `src/app/admin/page.tsx` | Acceptable now; migrate to Supabase auth roles when team grows. Document in ROADMAP. |
| P2-7 | Viewport meta not explicitly declared | `src/app/layout.tsx` | Add `export const viewport: Viewport = { width: 'device-width', initialScale: 1 }` for explicit control per Next.js 15+ best practice. |
