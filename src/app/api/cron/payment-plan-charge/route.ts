import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date()
  const nowIso = now.toISOString()
  const results: any[] = []

  // ── PASS 1: Charge Payment 2 ─────────────────────────────────────────────
  // Orders where: payment_plan=true, payment2 not yet paid, payment2 due today or past,
  // and grace period not yet set (meaning first attempt)
  const { data: dueOrders } = await supabase
    .from('orders')
    .select('*')
    .eq('payment_plan', true)
    .is('payment_plan_payment2_paid_at', null)
    .is('payment_plan_payment2_grace_expires_at', null)
    .lte('payment_plan_payment2_date', nowIso)
    .in('status', ['confirmed', 'in_progress'])

  for (const order of (dueOrders || [])) {
    try {
      if (!order.payment_plan_payment2_amount) {
        results.push({ order_id: order.id, action: 'payment2_skip', reason: 'no amount stored' })
        continue
      }

      // Find the customer's saved payment method from their deposit payment intent
      if (!order.deposit_payment_intent_id) {
        results.push({ order_id: order.id, action: 'payment2_skip', reason: 'no deposit intent' })
        continue
      }

      const depositIntent = await stripe.paymentIntents.retrieve(order.deposit_payment_intent_id)
      const paymentMethod = depositIntent.payment_method as string
      const customerId = depositIntent.customer as string

      if (!paymentMethod || !customerId) {
        results.push({ order_id: order.id, action: 'payment2_skip', reason: 'no saved payment method' })
        continue
      }

      // Charge Payment 2
      const intent = await stripe.paymentIntents.create({
        amount: order.payment_plan_payment2_amount,
        currency: 'usd',
        customer: customerId,
        payment_method: paymentMethod,
        confirm: true,
        off_session: true,
        metadata: {
          order_id: order.id,
          type: 'payment_plan_payment2',
        },
        description: 'Whiskly payment plan — Payment 2 — Order ' + order.id.slice(0, 8),
      })

      await supabase.from('orders').update({
        payment_plan_payment2_paid_at: nowIso,
        payment_plan_payment2_intent_id: intent.id,
      }).eq('id', order.id)

      results.push({ order_id: order.id, action: 'payment2_charged', amount: order.payment_plan_payment2_amount })
    } catch (e: any) {
      // Charge failed — set failed_at and grace period (48 hours)
      const graceExpires = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString()
      await supabase.from('orders').update({
        payment_plan_payment2_failed_at: nowIso,
        payment_plan_payment2_grace_expires_at: graceExpires,
      }).eq('id', order.id)

      // Email customer warning
      await fetch(process.env.NEXT_PUBLIC_SITE_URL + '/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'announcement',
          to: order.customer_email,
          name: order.customer_name,
          subject: 'Action required: Payment 2 failed for your Whiskly order',
          body: 'Your second installment payment of $' + (order.payment_plan_payment2_amount / 100).toFixed(2) + ' for your upcoming order failed to process. You have 48 hours to update your payment method to avoid cancellation. Please log in to your dashboard and update your payment details. If you have questions, contact support@whiskly.co.',
        }),
      }).catch(() => {})

      results.push({ order_id: order.id, action: 'payment2_failed', error: e.message })
    }
  }

  // ── PASS 2: Cancel orders whose grace period has expired ─────────────────
  const { data: expiredOrders } = await supabase
    .from('orders')
    .select('*, bakers(business_name, email)')
    .eq('payment_plan', true)
    .is('payment_plan_payment2_paid_at', null)
    .not('payment_plan_payment2_grace_expires_at', 'is', null)
    .lte('payment_plan_payment2_grace_expires_at', nowIso)
    .in('status', ['confirmed', 'in_progress'])

  for (const order of (expiredOrders || [])) {
    try {
      await supabase.from('orders').update({
        status: 'cancelled',
        cancelled_by: 'system',
        cancellation_reason: 'Payment plan — Payment 2 not received within grace period',
        cancelled_at: nowIso,
      }).eq('id', order.id)

      // Baker keeps ingredient advance as kill fee — no deposit refund
      // Notify customer
      await fetch(process.env.NEXT_PUBLIC_SITE_URL + '/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'announcement',
          to: order.customer_email,
          name: order.customer_name,
          subject: 'Your Whiskly order has been cancelled — payment not received',
          body: 'We were unable to collect your second installment payment after the 48-hour grace period. As a result, your order has been cancelled. The ingredient advance paid to your baker is non-refundable as a kill fee. Your deposit has not been refunded. If you believe this is an error, please contact support@whiskly.co immediately.',
        }),
      }).catch(() => {})

      // Notify baker
      const bakerEmail = (order.bakers as any)?.email
      const bakerName = (order.bakers as any)?.business_name
      if (bakerEmail) {
        await fetch(process.env.NEXT_PUBLIC_SITE_URL + '/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'announcement',
            to: bakerEmail,
            name: bakerName,
            subject: 'Order cancelled — customer did not complete payment plan',
            body: 'The payment plan order from ' + order.customer_name + ' (Order ' + order.id.slice(0, 8).toUpperCase() + ') has been cancelled because the customer did not complete their second installment payment. You keep the ingredient advance already paid to you. Contact support@whiskly.co if you have questions.',
          }),
        }).catch(() => {})
      }

      results.push({ order_id: order.id, action: 'cancelled_grace_expired' })
    } catch (e: any) {
      results.push({ order_id: order.id, action: 'cancel_error', error: e.message })
    }
  }

  return NextResponse.json({ processed: results.length, results })
}
