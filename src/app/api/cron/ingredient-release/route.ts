import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // Find orders confirmed 72+ hours ago with no ingredient release
  const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()

  const { data: orders } = await supabase
    .from('orders')
    .select('*, bakers(id, stripe_account_id, business_name, email, is_pro)')
    .eq('status', 'confirmed')
    .not('deposit_paid_at', 'is', null)
    .is('ingredient_release_at', null)
    .lt('deposit_paid_at', cutoff)

  const results: any[] = []

  for (const order of orders || []) {
    try {
      if (!order.bakers?.stripe_account_id) continue

      // 25% of total order = 50% of the deposit
      const totalCents = order.amount_total || Math.round((order.budget || 0) * 100)
      const ingredientCents = Math.round(totalCents * 0.25)

      const transfer = await stripe.transfers.create({
        amount: ingredientCents,
        currency: 'usd',
        destination: order.bakers.stripe_account_id,
        metadata: { order_id: order.id, type: 'ingredient_release' },
        description: `Ingredient advance — Order ${order.id.slice(0, 8)}`,
      })

      const now = new Date().toISOString()
      await supabase.from('orders').update({
        ingredient_release_at: now,
        ingredient_release_amount: ingredientCents,
      }).eq('id', order.id)

      await supabase.from('payout_schedule').insert({
        order_id: order.id,
        baker_id: order.baker_id,
        tranche: 'ingredient_release',
        amount_cents: ingredientCents,
        scheduled_for: now,
        released_at: now,
        stripe_transfer_id: transfer.id,
        status: 'released',
      })

      // Notify baker
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://whiskly.co'
      await fetch(`${appUrl}/api/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ingredient_release',
          bakerEmail: order.bakers.email,
          bakerName: order.bakers.business_name,
          customerName: order.customer_name,
          eventType: order.event_type,
          eventDate: order.event_date,
          amount: (ingredientCents / 100).toFixed(2),
        }),
      }).catch(() => {})

      results.push({ order_id: order.id, status: 'released', amount: ingredientCents })
    } catch (err: any) {
      results.push({ order_id: order.id, status: 'error', error: err.message })
    }
  }

  return NextResponse.json({ processed: results.length, results })
}
