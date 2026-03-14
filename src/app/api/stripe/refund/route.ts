import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { order_id } = await req.json()

    const { data: order } = await supabase
      .from('orders').select('*').eq('id', order_id).maybeSingle()

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    const refunds = []

    if (order.deposit_payment_intent_id) {
      const refund = await stripe.refunds.create({
        payment_intent: order.deposit_payment_intent_id,
      })
      refunds.push(refund)
    }

    if (order.remainder_payment_intent_id) {
      const refund = await stripe.refunds.create({
        payment_intent: order.remainder_payment_intent_id,
      })
      refunds.push(refund)
    }

    await supabase.from('orders').update({ status: 'refunded' }).eq('id', order_id)

    return NextResponse.json({ success: true, refunds: refunds.length })
  } catch (err: any) {
    console.error('Refund error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}