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

  return NextResponse.json({ received: true })
}
