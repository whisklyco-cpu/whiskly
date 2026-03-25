import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    const { baker_id, email, return_url } = await req.json()

    // Check if baker already has a stripe account
    const { data: baker } = await supabase
      .from('bakers')
      .select('stripe_account_id, business_name')
      .eq('id', baker_id)
      .maybeSingle()

    if (!baker) return NextResponse.json({ error: 'Baker not found' }, { status: 404 })

    let accountId = baker.stripe_account_id

    // Create Connect account if doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          name: baker.business_name,
          mcc: '5812', // Eating places and restaurants
        },
      })
      accountId = account.id

      // Save to bakers table
      await supabase.from('bakers').update({ stripe_account_id: accountId }).eq('id', baker_id)
    }

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: return_url + '?stripe=refresh',
      return_url: return_url + '?stripe=success',
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (err: any) {
    console.error('Stripe onboarding error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}