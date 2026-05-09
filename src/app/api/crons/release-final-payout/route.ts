import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const RESERVE_CAP_DOLLARS = 500
const STANDARD_RESERVE_RATE = 0.05
const INSTANT_PAYOUT_RESERVE_RATE = 0.07

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Orders delivered 3+ days ago with no payout and no open dispute
  const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()

  const { data: orders, error: queryError } = await supabase
    .from('orders')
    .select('id, baker_id, amount_total, ingredient_release_amount, delivery_confirmed_at')
    .eq('status', 'delivered')
    .eq('is_disputed', false)
    .lt('delivery_confirmed_at', cutoff)
    .is('payout_released_at', null)

  if (queryError) {
    console.error('[release-final-payout] query error:', queryError.message)
    return NextResponse.json({ error: queryError.message }, { status: 500 })
  }

  const results: Array<{
    order_id: string
    status: 'released' | 'skipped' | 'error'
    net_cents?: number
    stripe_transfer_id?: string
    error?: string
  }> = []

  for (const order of orders ?? []) {
    console.log(`[release-final-payout] processing order ${order.id}`)

    try {
      // a. Fetch baker: Stripe account ID and tier
      const { data: baker, error: bakerErr } = await supabase
        .from('bakers')
        .select('stripe_account_id, tier, instant_payout_enabled')
        .eq('id', order.baker_id)
        .maybeSingle()

      if (bakerErr) throw new Error(`baker lookup: ${bakerErr.message}`)
      if (!baker?.stripe_account_id) {
        console.warn(`[release-final-payout] order ${order.id} — baker has no stripe_account_id, skipping`)
        results.push({ order_id: order.id, status: 'skipped' })
        continue
      }

      // b & c. Fetch baker_reserve: balance and instant payout eligibility
      const { data: reserve, error: reserveErr } = await supabase
        .from('baker_reserve')
        .select('balance, is_instant_payout_eligible, completed_orders_count')
        .eq('baker_id', order.baker_id)
        .maybeSingle()

      if (reserveErr) throw new Error(`baker_reserve lookup: ${reserveErr.message}`)

      const reserveBalanceDollars: number = reserve?.balance ?? 0
      const isInstantPayoutElected: boolean =
        (reserve?.is_instant_payout_eligible ?? false) && (baker.instant_payout_enabled ?? false)

      // Calculate amounts (all in cents)
      const commissionRate = baker.tier === 'pro' ? 0.07 : 0.10
      const reserveRate = isInstantPayoutElected ? INSTANT_PAYOUT_RESERVE_RATE : STANDARD_RESERVE_RATE

      const amountTotal: number = order.amount_total ?? 0
      const ingredientAlreadyPaid: number = order.ingredient_release_amount ?? 0
      const grossCents = amountTotal - ingredientAlreadyPaid

      if (grossCents <= 0) {
        console.warn(`[release-final-payout] order ${order.id} — gross amount is $0 after ingredient advance, skipping`)
        results.push({ order_id: order.id, status: 'skipped' })
        continue
      }

      const commissionCents = Math.round(grossCents * commissionRate)

      // d. Reserve withheld only if baker_reserve.balance < $500 cap
      const reserveWithheldCents =
        reserveBalanceDollars < RESERVE_CAP_DOLLARS
          ? Math.round(grossCents * reserveRate)
          : 0

      const netCents = grossCents - commissionCents - reserveWithheldCents

      console.log(
        `[release-final-payout] order ${order.id} — gross $${(grossCents / 100).toFixed(2)}, ` +
        `commission $${(commissionCents / 100).toFixed(2)}, ` +
        `reserve $${(reserveWithheldCents / 100).toFixed(2)}, ` +
        `net $${(netCents / 100).toFixed(2)}`,
      )

      // e. Create Stripe transfer for net amount
      const transfer = await stripe.transfers.create({
        amount: netCents,
        currency: 'usd',
        destination: baker.stripe_account_id,
        metadata: { order_id: order.id, tranche_type: 'final_payout' },
        description: `Final payout — Order ${order.id.slice(0, 8)}`,
      })

      const now = new Date().toISOString()
      const reserveWithheldDollars = reserveWithheldCents / 100

      // f. Insert payout_tranches row (amounts in cents, matching ingredient_advance cron)
      const { error: trancheErr } = await supabase.from('payout_tranches').insert({
        order_id: order.id,
        baker_id: order.baker_id,
        tranche_type: 'final_payout',
        gross_amount: grossCents,
        commission_amount: commissionCents,
        reserve_withheld: reserveWithheldCents,
        net_amount: netCents,
        status: 'completed',
        released_at: now,
        stripe_transfer_id: transfer.id,
      })

      if (trancheErr) throw new Error(`payout_tranches insert: ${trancheErr.message}`)

      // g & h. Reserve accounting — only when reserve was actually withheld
      if (reserveWithheldCents > 0) {
        const balanceBefore = reserveBalanceDollars
        const balanceAfter = balanceBefore + reserveWithheldDollars

        const { error: txErr } = await supabase.from('reserve_transactions').insert({
          baker_id: order.baker_id,
          order_id: order.id,
          transaction_type: 'withhold',
          amount: reserveWithheldDollars,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          notes: 'Standard reserve withholding on final payout',
        })

        if (txErr) throw new Error(`reserve_transactions insert: ${txErr.message}`)

        // Fetch fresh counters then write atomically
        const { data: freshReserve, error: freshErr } = await supabase
          .from('baker_reserve')
          .select('total_withheld, completed_orders_count')
          .eq('baker_id', order.baker_id)
          .maybeSingle()

        if (freshErr) throw new Error(`baker_reserve fetch: ${freshErr.message}`)

        const { error: reserveUpdateErr } = await supabase.from('baker_reserve').update({
          balance: balanceAfter,
          total_withheld: (freshReserve?.total_withheld ?? 0) + reserveWithheldDollars,
          completed_orders_count: (freshReserve?.completed_orders_count ?? 0) + 1,
        }).eq('baker_id', order.baker_id)

        if (reserveUpdateErr) throw new Error(`baker_reserve update: ${reserveUpdateErr.message}`)
      } else {
        // Still increment completed_orders_count even when no reserve withheld
        const { data: freshReserve } = await supabase
          .from('baker_reserve')
          .select('completed_orders_count')
          .eq('baker_id', order.baker_id)
          .maybeSingle()

        await supabase.from('baker_reserve').update({
          completed_orders_count: (freshReserve?.completed_orders_count ?? 0) + 1,
        }).eq('baker_id', order.baker_id)
      }

      // i. Update order
      const { error: orderUpdateErr } = await supabase
        .from('orders')
        .update({
          payout_released_at: now,
          payout_amount: netCents,
          payout_intent_id: transfer.id,
        })
        .eq('id', order.id)

      if (orderUpdateErr) throw new Error(`order update: ${orderUpdateErr.message}`)

      console.log(`[release-final-payout] order ${order.id} — transfer ${transfer.id} complete`)

      results.push({
        order_id: order.id,
        status: 'released',
        net_cents: netCents,
        stripe_transfer_id: transfer.id,
      })
    } catch (err: any) {
      console.error(`[release-final-payout] order ${order.id} — error:`, err.message)
      results.push({ order_id: order.id, status: 'error', error: err.message })
      // Continue — one failure must not abort the batch
    }
  }

  const summary = {
    total: results.length,
    released: results.filter(r => r.status === 'released').length,
    skipped: results.filter(r => r.status === 'skipped').length,
    errors: results.filter(r => r.status === 'error').length,
  }

  console.log('[release-final-payout] done —', summary)
  return NextResponse.json({ ...summary, results })
}
