import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const FREE_COMMISSION = 0.10
const PRO_COMMISSION = 0.07

export async function POST(req: NextRequest) {
  try {
    const { order_id } = await req.json()

    const { data: order } = await supabase
      .from('orders')
      .select('*, bakers(id, stripe_account_id, is_pro)')
      .eq('id', order_id)
      .maybeSingle()

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (!order.bakers?.stripe_account_id) return NextResponse.json({ error: 'Baker has not connected Stripe account' }, { status: 400 })
    if (order.remainder_paid_at) return NextResponse.json({ error: 'Remainder already paid' }, { status: 400 })

    const remainderCents = order.amount_remainder
    const commissionRate = order.bakers.is_pro ? PRO_COMMISSION : FREE_COMMISSION
    const remainderCommissionCents = Math.round(remainderCents * commissionRate)
    const bakerRemainderCents = remainderCents - remainderCommissionCents

    const paymentIntent = await stripe.paymentIntents.create({
      amount: remainderCents,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      transfer_data: {
        destination: order.bakers.stripe_account_id,
        amount: bakerRemainderCents,
      },
      metadata: {
        order_id,
        type: 'remainder',
        whiskly_commission: remainderCommissionCents.toString(),
      },
      description: 'Whiskly remainder — Order ' + order_id.slice(0, 8) + ' — ' + order.event_type,
    })

    await supabase.from('orders').update({
      remainder_payment_intent_id: paymentIntent.id,
    }).eq('id', order_id)

    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
      remainder_amount: remainderCents,
    })
  } catch (err: any) {
    console.error('Stripe remainder error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}