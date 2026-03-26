import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_CHECKOUT_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('Checkout webhook signature error:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { order_id, type } = session.metadata || {}

    if (!order_id) return NextResponse.json({ received: true })

    if (type === 'deposit') {
      await supabase.from('orders').update({
        deposit_paid_at: new Date().toISOString(),
        status: 'confirmed',
      }).eq('id', order_id)

      const { data: order } = await supabase
        .from('orders')
        .select('*, bakers(business_name, city, state)')
        .eq('id', order_id)
        .maybeSingle()

      if (order) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        await fetch(`${appUrl}/api/email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'deposit_confirmed',
            customerEmail: order.customer_email,
            customerName: order.customer_name,
            bakerName: order.bakers?.business_name,
            eventType: order.event_type,
            eventDate: order.event_date,
            budget: order.budget,
            orderId: order.id,
          }),
        }).catch(() => {})
      }
    }
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object as Stripe.PaymentIntent
    const { order_id, type } = intent.metadata || {}

    if (order_id && type === 'deposit') {
      await supabase.from('orders').update({
        deposit_paid_at: new Date().toISOString(),
        status: 'confirmed',
      }).eq('id', order_id)
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object as Stripe.PaymentIntent
    const { order_id } = intent.metadata || {}

    if (order_id) {
      await supabase.from('orders').update({ status: 'payment_issue' }).eq('id', order_id)

      const { data: order } = await supabase
        .from('orders')
        .select('*, bakers(business_name)')
        .eq('id', order_id)
        .maybeSingle()

      if (order) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://whiskly.co'
        await fetch(`${appUrl}/api/email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'balance_failed',
            customerEmail: order.customer_email,
            customerName: order.customer_name,
            bakerName: order.bakers?.business_name,
            eventDate: order.event_date,
            amount: order.balance_amount || (order.budget ? order.budget * 0.5 : 0),
            orderId: order.id,
          }),
        }).catch(() => {})
      }
    }
  }

  if (event.type === 'transfer.created') {
    const transfer = event.data.object as Stripe.Transfer
    const { order_id } = transfer.metadata || {}

    if (order_id) {
      await supabase.from('orders').update({
        payout_released_at: new Date().toISOString(),
        stripe_transfer_id: transfer.id,
      }).eq('id', order_id)
    }
  }

  return NextResponse.json({ received: true })
}