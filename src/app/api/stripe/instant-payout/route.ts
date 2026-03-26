import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const INSTANT_FEE_RATE = 0.01

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    const { baker_id, amount_cents } = await req.json()

    const { data: baker } = await supabase
      .from('bakers')
      .select('stripe_account_id, instant_payout_eligible, instant_payout_enabled')
      .eq('id', baker_id)
      .maybeSingle()

    if (!baker) return NextResponse.json({ error: 'Baker not found' }, { status: 404 })
    if (!baker.instant_payout_eligible) return NextResponse.json({ error: 'Baker is not eligible for instant payouts' }, { status: 400 })
    if (!baker.instant_payout_enabled) return NextResponse.json({ error: 'Instant payouts not enabled for this baker' }, { status: 400 })
    if (!baker.stripe_account_id) return NextResponse.json({ error: 'Baker has not connected Stripe' }, { status: 400 })

    // Deduct 1% instant payout fee from the amount
    const feeCents = Math.round(amount_cents * INSTANT_FEE_RATE)
    const netCents = amount_cents - feeCents

    // Get external account (debit card) for instant payout
    const externalAccounts = await stripe.accounts.listExternalAccounts(baker.stripe_account_id, { object: 'card' })

    if (!externalAccounts.data.length) {
      return NextResponse.json({ error: 'No debit card on file for instant payout' }, { status: 400 })
    }

    const payout = await stripe.payouts.create(
      {
        amount: netCents,
        currency: 'usd',
        method: 'instant',
        destination: externalAccounts.data[0].id,
        metadata: { baker_id, type: 'instant_payout' },
      },
      { stripeAccount: baker.stripe_account_id }
    )

    return NextResponse.json({ success: true, payout_id: payout.id, net_cents: netCents, fee_cents: feeCents })
  } catch (err: any) {
    console.error('Instant payout error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
