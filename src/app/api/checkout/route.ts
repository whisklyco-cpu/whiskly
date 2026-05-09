import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

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
      .select('*, bakers(business_name)')
      .eq('id', order_id)
      .maybeSingle()

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (!order.budget) return NextResponse.json({ error: 'Order has no budget set' }, { status: 400 })

    const totalCents = Math.round(order.budget * 100)
    const depositRate = order.budget >= 750 ? 0.60 : 0.50
    const depositCents = Math.round(totalCents * depositRate)
    const customerTotalCents = depositCents

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      payment_method_options: { card: { request_three_d_secure: 'automatic' } },
      wallet_options: { link: { display: 'never' } },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: customerTotalCents,
            product_data: {
              name: `${depositRate === 0.60 ? '60' : '50'}% Deposit — ${order.event_type || 'Custom Order'}`,
              description: `Baker: ${order.bakers?.business_name || 'Whiskly Baker'} · Remainder due 3 days before your event`,
            },
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: 'usd',
            unit_amount: 299,
            product_data: {
              name: 'Platform Support Fee',
              description: 'One-time fee for using the Whiskly platform',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      payment_intent_data: { setup_future_usage: 'off_session' },
      success_url: `${appUrl}/dashboard/customer?paid=true&order_id=${order_id}`,
      cancel_url: `${appUrl}/dashboard/customer`,
      metadata: {
        order_id,
        type: 'deposit',
        deposit_amount: depositCents.toString(),
        total_amount: totalCents.toString(),
      },
    })

    await supabase.from('orders').update({
      checkout_session_id: session.id,
      amount_total: totalCents,
      amount_deposit: depositCents,
      amount_remainder: totalCents - depositCents,
    }).eq('id', order_id)

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Checkout session error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
