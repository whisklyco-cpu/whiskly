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
    const { customer_user_id, email, name } = await req.json()
    if (!customer_user_id || !email) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

    // Get or create Stripe customer
    const { data: customerRecord } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('user_id', customer_user_id)
      .maybeSingle()

    let stripeCustomerId = customerRecord?.stripe_customer_id

    if (!stripeCustomerId) {
      const stripeCustomer = await stripe.customers.create({ email, name: name || email })
      stripeCustomerId = stripeCustomer.id
      await supabase.from('customers').update({ stripe_customer_id: stripeCustomerId }).eq('user_id', customer_user_id)
    }

    // Create SetupIntent so customer can save their card
    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      usage: 'off_session',
    })

    return NextResponse.json({ client_secret: setupIntent.client_secret, stripe_customer_id: stripeCustomerId })
  } catch (err: any) {
    console.error('Save card error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
