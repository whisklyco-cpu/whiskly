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
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Orders confirmed 72+ hours ago with no ingredient advance released yet
  const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()

  const { data: orders, error: queryError } = await supabase
    .from('orders')
    .select('id, baker_id, amount_total, confirmed_at, customer_name, event_type, event_date')
    .eq('status', 'confirmed')
    .lt('confirmed_at', cutoff)
    .is('ingredient_release_at', null)

  if (queryError) {
    console.error('[ingredient-advance] query error:', queryError.message)
    return NextResponse.json({ error: queryError.message }, { status: 500 })
  }

  const results: Array<{
    order_id: string
    status: 'released' | 'skipped' | 'error'
    amount_cents?: number
    stripe_transfer_id?: string
    error?: string
  }> = []

  for (const order of orders ?? []) {
    console.log(`[ingredient-advance] processing order ${order.id}`)

    try {
      // 1. Fetch baker's Stripe Connect account
      const { data: baker, error: bakerError } = await supabase
        .from('bakers')
        .select('stripe_account_id')
        .eq('id', order.baker_id)
        .maybeSingle()

      if (bakerError) throw new Error(`baker lookup: ${bakerError.message}`)

      if (!baker?.stripe_account_id) {
        console.warn(`[ingredient-advance] order ${order.id} — baker has no stripe_account_id, skipping`)
        results.push({ order_id: order.id, status: 'skipped' })
        continue
      }

      // 2. Calculate ingredient advance: 25% of order total
      const grossCents = Math.round((order.amount_total ?? 0) * 0.25)

      if (grossCents <= 0) {
        console.warn(`[ingredient-advance] order ${order.id} — computed amount is $0, skipping`)
        results.push({ order_id: order.id, status: 'skipped' })
        continue
      }

      // 3. Create Stripe transfer to baker's connected account
      const transfer = await stripe.transfers.create({
        amount: grossCents,
        currency: 'usd',
        destination: baker.stripe_account_id,
        metadata: { order_id: order.id, tranche_type: 'ingredient_advance' },
        description: `Ingredient advance — Order ${order.id.slice(0, 8)}`,
      })

      console.log(`[ingredient-advance] order ${order.id} — transfer ${transfer.id} ($${(grossCents / 100).toFixed(2)})`)

      const now = new Date().toISOString()

      // 4. Insert into payout_tranches
      const { error: trancheError } = await supabase.from('payout_tranches').insert({
        order_id: order.id,
        baker_id: order.baker_id,
        tranche_type: 'ingredient_advance',
        gross_amount: grossCents,
        commission_amount: 0,
        reserve_withheld: 0,
        net_amount: grossCents,
        status: 'completed',
        released_at: now,
        stripe_transfer_id: transfer.id,
      })

      if (trancheError) throw new Error(`payout_tranches insert: ${trancheError.message}`)

      // 5. Mark order as released
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          ingredient_release_at: now,
          ingredient_release_amount: grossCents,
        })
        .eq('id', order.id)

      if (updateError) throw new Error(`order update: ${updateError.message}`)

      results.push({
        order_id: order.id,
        status: 'released',
        amount_cents: grossCents,
        stripe_transfer_id: transfer.id,
      })
    } catch (err: any) {
      console.error(`[ingredient-advance] order ${order.id} — error:`, err.message)
      results.push({ order_id: order.id, status: 'error', error: err.message })
      // Continue to next order — one failure must not abort the batch
    }
  }

  const summary = {
    total: results.length,
    released: results.filter(r => r.status === 'released').length,
    skipped: results.filter(r => r.status === 'skipped').length,
    errors: results.filter(r => r.status === 'error').length,
  }

  console.log('[ingredient-advance] done —', summary)
  return NextResponse.json({ ...summary, results })
}
