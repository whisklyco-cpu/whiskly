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
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('Webhook signature error:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object as Stripe.PaymentIntent
    const { order_id, type } = intent.metadata

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
        await fetch(process.env.NEXT_PUBLIC_APP_URL + '/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'order_confirmed',
            to: order.customer_email,
            order,
            baker: order.bakers,
          }),
        })
        fetch(process.env.NEXT_PUBLIC_APP_URL + '/api/email', {
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

    if (type === 'remainder') {
      await supabase.from('orders').update({
        remainder_paid_at: new Date().toISOString(),
      }).eq('id', order_id)
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object as Stripe.PaymentIntent
    const { order_id, type } = intent.metadata

    if (order_id && type === 'deposit') {
      await supabase.from('orders').update({
        status: 'pending',
        deposit_payment_intent_id: null,
      }).eq('id', order_id)
    }
  }

  // ── Subscription lifecycle events ──────────────────────────────────────────

  if (event.type === 'customer.subscription.created') {
    const sub = event.data.object as Stripe.Subscription
    await supabase
      .from('bakers')
      .update({
        stripe_subscription_id: sub.id,
        stripe_customer_id: sub.customer as string,
        subscription_status: sub.status,
        subscription_current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
      })
      .eq('stripe_customer_id', sub.customer as string)
  }

  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription
    await supabase
      .from('bakers')
      .update({
        subscription_status: sub.status,
        subscription_current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
      })
      .eq('stripe_subscription_id', sub.id)
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    await supabase
      .from('bakers')
      .update({ subscription_status: 'canceled' })
      .eq('stripe_subscription_id', sub.id)
  }

  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice
    const subId = (invoice as any).subscription as string | null
    if (subId) {
      const sub = await stripe.subscriptions.retrieve(subId)
      await supabase
        .from('bakers')
        .update({
          subscription_status: sub.status,
          subscription_current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
        })
        .eq('stripe_subscription_id', subId)
    }
  }

  return NextResponse.json({ received: true })
}