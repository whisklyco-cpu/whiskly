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
    const { order_id, baker_id, tip_amount_cents, customer_email } = await req.json()

    if (!order_id || !tip_amount_cents || tip_amount_cents < 100) {
      return NextResponse.json({ error: 'Invalid tip amount' }, { status: 400 })
    }

    const { data: order } = await supabase
      .from('orders')
      .select('*, bakers(id, business_name, email, stripe_account_id)')
      .eq('id', order_id)
      .maybeSingle()

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (order.tip_paid_at) return NextResponse.json({ error: 'Tip already sent' }, { status: 400 })
    if (!order.deposit_payment_intent_id) {
      return NextResponse.json({ error: 'No payment method on file for this order' }, { status: 400 })
    }

    // Retrieve the deposit PaymentIntent to get the saved payment method
    const depositIntent = await stripe.paymentIntents.retrieve(order.deposit_payment_intent_id)
    const paymentMethodId = depositIntent.payment_method as string | null
    if (!paymentMethodId) {
      return NextResponse.json({ error: 'No saved payment method found. Please contact support.' }, { status: 400 })
    }

    // Create and confirm tip payment using the same card
    const tipIntent = await stripe.paymentIntents.create({
      amount: tip_amount_cents,
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
      off_session: true,
      metadata: { order_id, type: 'tip' },
      description: 'Whiskly tip — ' + (order.bakers?.business_name || 'baker') + ' — Order ' + order_id.slice(0, 8),
    })

    if (tipIntent.status !== 'succeeded') {
      return NextResponse.json({ error: 'Payment could not be processed. Please contact support.' }, { status: 400 })
    }

    const now = new Date().toISOString()
    await supabase.from('orders').update({
      tip_amount: tip_amount_cents,
      tip_paid_at: now,
    }).eq('id', order_id)

    const tipDollars = (tip_amount_cents / 100).toFixed(2)
    const bakerName = order.bakers?.business_name || 'Your baker'
    const customerName = order.customer_name || 'A customer'
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''

    // Email the baker
    await fetch(siteUrl + '/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'announcement',
        to: order.bakers?.email || '',
        name: bakerName,
        subject: `You received a $${tipDollars} tip on Whiskly!`,
        body: `Great news! ${customerName} left you a $${tipDollars} tip on their ${order.event_type || 'order'}. Tips go 100% to you — Whiskly takes nothing.`,
      }),
    }).catch(() => {})

    // Email the customer
    const emailTo = customer_email || order.customer_email
    if (emailTo) {
      await fetch(siteUrl + '/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'announcement',
          to: emailTo,
          name: customerName,
          subject: `Your tip to ${bakerName} has been sent`,
          body: `Your $${tipDollars} tip to ${bakerName} has been sent. Thank you for supporting a small business!`,
        }),
      }).catch(() => {})
    }

    return NextResponse.json({ success: true, tip_paid_at: now })
  } catch (err: any) {
    console.error('Stripe tip error:', err)
    // Surface Stripe authentication_required errors more helpfully
    if (err?.code === 'authentication_required' || err?.code === 'card_declined') {
      return NextResponse.json({ error: 'Your card requires additional verification. Please contact support to send a tip.' }, { status: 400 })
    }
    return NextResponse.json({ error: err.message || 'Payment failed' }, { status: 500 })
  }
}
