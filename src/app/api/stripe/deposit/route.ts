import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const FREE_COMMISSION = 0.10
const PRO_COMMISSION = 0.07
const FOUNDING_COMMISSION = 0.05

function getCommissionRate(baker: { tier?: string | null; is_founding_baker?: boolean | null }): number {
  if (baker?.is_founding_baker) return FOUNDING_COMMISSION
  if (baker?.tier === 'founding') return FOUNDING_COMMISSION
  if (baker?.tier === 'pro') return PRO_COMMISSION
  if (baker?.tier === 'elite') return PRO_COMMISSION // legacy fallback — treat as Pro
  return FREE_COMMISSION
}

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    const { order_id } = await req.json()

    const { data: order } = await supabase
      .from('orders')
      .select('*, bakers(id, stripe_account_id, tier, is_founding_baker)')
      .eq('id', order_id)
      .maybeSingle()

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (!order.budget) return NextResponse.json({ error: 'Order has no budget set' }, { status: 400 })

    const totalCents = Math.round(order.budget * 100)
    // Payment plan: Payment 1 = 33% of total
    // High-value ($750+, no payment plan): 60% deposit
    // Standard: 50% deposit
    const depositRate = order.payment_plan ? 0.33 : order.budget >= 750 ? 0.60 : 0.50
    const depositCents = Math.round(totalCents * depositRate)
    const commissionRate = getCommissionRate(order.bakers)
    const depositCommissionCents = Math.round(depositCents * commissionRate)
    const customerDepositCents = depositCents + 299

    // TODO: When baker Stripe Connect onboarding is built, re-add transfer_data:
    // transfer_data: { destination: order.bakers.stripe_account_id, amount: depositCents - depositCommissionCents }
    const paymentIntent = await stripe.paymentIntents.create({
      amount: customerDepositCents,
      currency: 'usd',
      payment_method_types: ['card'],
      setup_future_usage: 'off_session',
      metadata: {
        order_id,
        type: 'deposit',
        whiskly_commission: depositCommissionCents.toString(),
        platform_fee: '299',
      },
      description: 'Whiskly deposit — Order ' + order_id.slice(0, 8) + ' — ' + (order.event_type || 'Custom Order'),
    })

    // For payment plan orders, store Payment 2 amount (33%) for cron use
    const payment2Cents = order.payment_plan ? Math.round(totalCents * 0.33) : null
    const orderUpdates: any = {
      deposit_payment_intent_id: paymentIntent.id,
      amount_total: totalCents,
      amount_deposit: depositCents,
      amount_remainder: totalCents - depositCents,
    }
    if (order.payment_plan && payment2Cents) {
      orderUpdates.payment_plan_payment2_amount = payment2Cents
    }
    await supabase.from('orders').update(orderUpdates).eq('id', order_id)

    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
      deposit_amount: depositCents,
      customer_total: customerDepositCents,
      total_amount: totalCents,
    })
  } catch (err: any) {
    console.error('Stripe deposit error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}