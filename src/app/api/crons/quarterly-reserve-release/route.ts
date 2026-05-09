import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const RESERVE_FLOOR_DOLLARS = 200

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const now = new Date().toISOString()

  // 1. Bakers with excess reserve due for quarterly release
  //    Join to bakers to confirm active and not suspended
  const { data: reserves, error: queryErr } = await supabase
    .from('baker_reserve')
    .select(`
      baker_id,
      balance,
      total_released,
      bakers!inner (
        stripe_account_id,
        is_active,
        is_suspended
      )
    `)
    .gt('balance', RESERVE_FLOOR_DOLLARS)
    .or(`next_quarterly_release_at.is.null,next_quarterly_release_at.lte.${now}`)
    .eq('bakers.is_active', true)
    .eq('bakers.is_suspended', false)

  if (queryErr) {
    console.error('[quarterly-reserve-release] query error:', queryErr.message)
    return NextResponse.json({ error: queryErr.message }, { status: 500 })
  }

  const results: Array<{
    baker_id: string
    status: 'released' | 'skipped' | 'error'
    release_dollars?: number
    stripe_transfer_id?: string
    error?: string
  }> = []

  let totalReleasedDollars = 0

  for (const row of reserves ?? []) {
    const baker = Array.isArray(row.bakers) ? row.bakers[0] : row.bakers
    console.log(`[quarterly-reserve-release] processing baker ${row.baker_id}, balance $${row.balance.toFixed(2)}`)

    try {
      if (!baker?.stripe_account_id) {
        console.warn(`[quarterly-reserve-release] baker ${row.baker_id} — no stripe_account_id, skipping`)
        results.push({ baker_id: row.baker_id, status: 'skipped' })
        continue
      }

      // a. Amount to release: everything above the $200 floor
      const releaseDollars = row.balance - RESERVE_FLOOR_DOLLARS
      const releaseCents = Math.round(releaseDollars * 100)

      if (releaseCents <= 0) {
        results.push({ baker_id: row.baker_id, status: 'skipped' })
        continue
      }

      // b. Stripe transfer — if this fails we do NOT update the reserve
      let transfer: { id: string }
      try {
        transfer = await stripe.transfers.create({
          amount: releaseCents,
          currency: 'usd',
          destination: baker.stripe_account_id,
          metadata: { baker_id: row.baker_id, type: 'quarterly_reserve_release' },
          description: `Quarterly reserve release — $${releaseDollars.toFixed(2)} excess returned`,
        })
      } catch (stripeErr: any) {
        // Stripe failed — log and flag for manual review, do NOT touch the reserve balance
        console.error(
          `[quarterly-reserve-release] baker ${row.baker_id} — Stripe transfer failed (MANUAL REVIEW REQUIRED):`,
          stripeErr.message,
        )
        results.push({ baker_id: row.baker_id, status: 'error', error: `Stripe: ${stripeErr.message}` })
        continue
      }

      console.log(
        `[quarterly-reserve-release] baker ${row.baker_id} — transfer ${transfer.id} $${releaseDollars.toFixed(2)}`,
      )

      // c. Insert reserve_transaction
      const { error: txErr } = await supabase.from('reserve_transactions').insert({
        baker_id: row.baker_id,
        transaction_type: 'quarterly_release',
        amount: releaseDollars,
        balance_before: row.balance,
        balance_after: RESERVE_FLOOR_DOLLARS,
        notes: 'Quarterly reserve release — excess above $200 returned',
        stripe_transfer_id: transfer.id,
      })

      if (txErr) throw new Error(`reserve_transactions insert: ${txErr.message}`)

      // d. Update baker_reserve — set balance to floor, advance next release date by 90 days
      const nextRelease = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()

      const { error: reserveErr } = await supabase
        .from('baker_reserve')
        .update({
          balance: RESERVE_FLOOR_DOLLARS,
          total_released: (row.total_released ?? 0) + releaseDollars,
          last_quarterly_release_at: now,
          next_quarterly_release_at: nextRelease,
        })
        .eq('baker_id', row.baker_id)

      if (reserveErr) throw new Error(`baker_reserve update: ${reserveErr.message}`)

      totalReleasedDollars += releaseDollars
      results.push({
        baker_id: row.baker_id,
        status: 'released',
        release_dollars: releaseDollars,
        stripe_transfer_id: transfer.id,
      })
    } catch (err: any) {
      console.error(`[quarterly-reserve-release] baker ${row.baker_id} — error:`, err.message)
      results.push({ baker_id: row.baker_id, status: 'error', error: err.message })
    }
  }

  const summary = {
    total_bakers_processed: results.length,
    released: results.filter(r => r.status === 'released').length,
    skipped: results.filter(r => r.status === 'skipped').length,
    errors: results.filter(r => r.status === 'error').length,
    total_released_dollars: +totalReleasedDollars.toFixed(2),
  }

  console.log('[quarterly-reserve-release] done —', summary)
  return NextResponse.json({ ...summary, results })
}
