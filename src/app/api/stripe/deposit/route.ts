import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

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
    if (!order.budget) return NextResponse.json({ error: 'Order has no budget set' }, { status: 400 })

    const totalCents = Math.round(order.budget * 100)
    const depositCents = Math.round(totalCents * 0.5)
    const commissionRate = order.bakers.is_pro ? PRO_COMMISSION : FREE_COMMISSION
    const depositCommissionCents = Math.round(depositCents * commissionRate)
    const bakerDepositCents = depositCents - depositCommissionCents

    const paymentIntent = await stripe.paymentIntents.create({
      amount: depositCents,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      transfer_data: {
        destination: order.bakers.stripe_account_id,
        amount: bakerDepositCents,
      },
      metadata: {
        order_id,
        type: 'deposit',
        whiskly_commission: depositCommissionCents.toString(),
      },
      description: 'Whiskly deposit — Order ' + order_id.slice(0, 8) + ' — ' + order.event_type,
    })

    await supabase.from('orders').update({
      deposit_payment_intent_id: paymentIntent.id,
      amount_total: totalCents,
      amount_deposit: depositCents,
      amount_remainder: totalCents - depositCents,
    }).eq('id', order_id)

    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
      deposit_amount: depositCents,
      total_amount: totalCents,
    })
  } catch (err: any) {
    console.error('Stripe deposit error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}