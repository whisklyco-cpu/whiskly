import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const FREE_COMMISSION = 0.10
const PRO_COMMISSION = 0.07
const RESERVE_RATE = 0.05

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
      .select('*, bakers(id, stripe_account_id, is_pro, baker_reserve_balance)')
      .eq('id', order_id)
      .maybeSingle()

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (order.payout_released_at) return NextResponse.json({ error: 'Payout already released' }, { status: 400 })
    if (!order.bakers?.stripe_account_id) return NextResponse.json({ error: 'Baker has not connected Stripe' }, { status: 400 })

    const totalCents = order.amount_total || Math.round((order.budget || 0) * 100)
    const commissionRate = order.bakers.is_pro ? PRO_COMMISSION : FREE_COMMISSION
    const commissionCents = Math.round(totalCents * commissionRate)
    const reserveCents = Math.round(totalCents * RESERVE_RATE)
    const payoutCents = totalCents - commissionCents - reserveCents

    // Transfer to baker's Stripe Connect account
    const transfer = await stripe.transfers.create({
      amount: payoutCents,
      currency: 'usd',
      destination: order.bakers.stripe_account_id,
      metadata: { order_id, type: 'final_payout' },
      description: `Whiskly payout — Order ${order_id.slice(0, 8)}`,
    })

    const now = new Date().toISOString()

    // Update order
    await supabase.from('orders').update({
      payout_released_at: now,
      payout_amount: payoutCents,
      payout_intent_id: transfer.id,
    }).eq('id', order_id)

    // Update baker reserve balance
    const newReserve = (order.bakers.baker_reserve_balance || 0) + reserveCents / 100
    await supabase.from('bakers').update({ baker_reserve_balance: newReserve }).eq('id', order.baker_id)

    // Record in payout_schedule
    await supabase.from('payout_schedule').upsert({
      order_id,
      baker_id: order.baker_id,
      tranche: 'final_payout',
      amount_cents: payoutCents,
      scheduled_for: now,
      released_at: now,
      stripe_transfer_id: transfer.id,
      status: 'released',
    })

    return NextResponse.json({ success: true, transfer_id: transfer.id, payout_cents: payoutCents })
  } catch (err: any) {
    console.error('Release payout error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
