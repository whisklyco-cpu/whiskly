// NOTE: Requires tip_amount column on orders table:
// ALTER TABLE orders ADD COLUMN IF NOT EXISTS tip_amount integer;
// (tip_amount stored in cents)

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { order_id, tip_amount_cents } = await req.json()

    if (!order_id || !tip_amount_cents || tip_amount_cents < 100) {
      return NextResponse.json({ error: 'Invalid tip amount' }, { status: 400 })
    }

    const { data: order } = await supabase
      .from('orders')
      .select('*, bakers(id, stripe_account_id, business_name)')
      .eq('id', order_id)
      .maybeSingle()

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (!order.bakers?.stripe_account_id) {
      return NextResponse.json({ error: 'Baker has not connected Stripe' }, { status: 400 })
    }

    // Tips go 100% to baker — no platform fee, no commission
    const paymentIntent = await stripe.paymentIntents.create({
      amount: tip_amount_cents,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      transfer_data: {
        destination: order.bakers.stripe_account_id,
        amount: tip_amount_cents,
      },
      metadata: {
        order_id,
        type: 'tip',
        baker_name: order.bakers.business_name,
      },
      description: 'Tip for ' + order.bakers.business_name + ' — Order ' + order_id.slice(0, 8),
    })

    return NextResponse.json({ client_secret: paymentIntent.client_secret })
  } catch (err: any) {
    console.error('Stripe tip error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
