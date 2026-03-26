import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const FREE_COMMISSION = 0.10
const PRO_COMMISSION = 0.07

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
      .select('*, bakers(id, stripe_account_id, is_pro, business_name)')
      .eq('id', order_id)
      .maybeSingle()

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (order.balance_paid_at) return NextResponse.json({ error: 'Balance already paid' }, { status: 400 })
    if (!order.stripe_customer_id) return NextResponse.json({ error: 'No saved payment method' }, { status: 400 })

    const remainderCents = order.amount_remainder || Math.round((order.budget || 0) * 50)
    const platformFeeCents = Math.round(remainderCents * 0.03)
    const totalCents = remainderCents + platformFeeCents

    // Get default payment method for this customer
    const paymentMethods = await stripe.paymentMethods.list({
      customer: order.stripe_customer_id,
      type: 'card',
    })

    if (!paymentMethods.data.length) {
      return NextResponse.json({ error: 'No saved payment method on file' }, { status: 400 })
    }

    const paymentMethodId = paymentMethods.data[0].id

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: 'usd',
      customer: order.stripe_customer_id,
      payment_method: paymentMethodId,
      confirm: true,
      off_session: true,
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
      metadata: { order_id, type: 'balance' },
      description: `Whiskly balance — Order ${order_id.slice(0, 8)} — ${order.event_type || 'Custom Order'}`,
    })

    await supabase.from('orders').update({
      balance_payment_intent_id: paymentIntent.id,
      balance_paid_at: new Date().toISOString(),
    }).eq('id', order_id)

    return NextResponse.json({ success: true, payment_intent_id: paymentIntent.id })
  } catch (err: any) {
    console.error('Charge balance error:', err)
    // Mark as payment issue if card was declined
    if (err.code === 'card_declined' || err.code === 'payment_intent_authentication_failure') {
      const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      const { order_id } = await req.json().catch(() => ({}))
      if (order_id) {
        await supabaseAdmin.from('orders').update({ payment_issue_at: new Date().toISOString(), status: 'payment_issue' }).eq('id', order_id)
      }
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
