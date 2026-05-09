import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const REQUIRED_ORDERS = 5
const REQUIRED_ACCOUNT_AGE_DAYS = 30
const REQUIRED_RESERVE_DOLLARS = 100
const DISPUTE_WINDOW_DAYS = 90

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // 1. All active, non-suspended bakers
  const { data: bakers, error: bakersErr } = await supabase
    .from('bakers')
    .select('id, created_at, verified')
    .eq('is_active', true)
    .eq('is_suspended', false)

  if (bakersErr) {
    console.error('[check-instant-payout-eligibility] bakers query error:', bakersErr.message)
    return NextResponse.json({ error: bakersErr.message }, { status: 500 })
  }

  const disputeCutoff = new Date(Date.now() - DISPUTE_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()

  let totalChecked = 0
  let newlyEligible = 0
  let newlySuspended = 0
  let unchanged = 0

  for (const baker of bakers ?? []) {
    try {
      // Fetch baker_reserve for this baker
      const { data: reserve } = await supabase
        .from('baker_reserve')
        .select('balance, is_instant_payout_eligible, completed_orders_count, instant_payout_unlocked_at')
        .eq('baker_id', baker.id)
        .maybeSingle()

      // Fetch upheld disputes in past 90 days
      const { data: disputes } = await supabase
        .from('orders')
        .select('id')
        .eq('baker_id', baker.id)
        .eq('is_disputed', true)
        .eq('auto_resolved', false)
        .gte('dispute_filed_at', disputeCutoff)

      // 2. Evaluate each of the 5 criteria
      const completedOrders = reserve?.completed_orders_count ?? 0
      const reserveBalance = reserve?.balance ?? 0
      const accountAgeDays = Math.floor(
        (Date.now() - new Date(baker.created_at).getTime()) / (1000 * 60 * 60 * 24),
      )
      const disputeCount = (disputes ?? []).length
      const identityVerified = baker.verified === true

      const criteriaOrders = completedOrders >= REQUIRED_ORDERS
      const criteriaAge = accountAgeDays >= REQUIRED_ACCOUNT_AGE_DAYS
      const criteriaBalance = reserveBalance >= REQUIRED_RESERVE_DOLLARS
      const criteriaDisputes = disputeCount === 0
      const criteriaIdentity = identityVerified

      const isEligible = criteriaOrders && criteriaAge && criteriaBalance && criteriaDisputes && criteriaIdentity
      const wasEligible = reserve?.is_instant_payout_eligible ?? false

      // Build human-readable reason
      const reason = isEligible
        ? 'All 5 eligibility criteria met.'
        : [
            !criteriaOrders && `Needs ${REQUIRED_ORDERS - completedOrders} more completed order(s) (has ${completedOrders})`,
            !criteriaAge && `Account is ${accountAgeDays} day(s) old — needs ${REQUIRED_ACCOUNT_AGE_DAYS}`,
            !criteriaBalance && `Reserve balance $${reserveBalance.toFixed(2)} — needs $${REQUIRED_RESERVE_DOLLARS}`,
            !criteriaDisputes && `${disputeCount} upheld dispute(s) in the past ${DISPUTE_WINDOW_DAYS} days`,
            !criteriaIdentity && 'Identity not verified',
          ]
            .filter(Boolean)
            .join('; ')

      const now = new Date().toISOString()

      // 4. Always log the eligibility check
      await supabase.from('instant_payout_eligibility_log').insert({
        baker_id: baker.id,
        event_type: 'eligibility_check',
        completed_orders: completedOrders,
        account_age_days: accountAgeDays,
        reserve_balance: reserveBalance,
        disputes_90_days: disputeCount,
        identity_verified: identityVerified,
        is_eligible: isEligible,
        reason,
      })

      // 5. Only write to baker_reserve when status has changed
      if (isEligible && !wasEligible) {
        // Newly eligible
        await supabase.from('baker_reserve').upsert(
          {
            baker_id: baker.id,
            is_instant_payout_eligible: true,
            instant_payout_unlocked_at: now,
          },
          { onConflict: 'baker_id' },
        )

        await supabase.from('instant_payout_eligibility_log').insert({
          baker_id: baker.id,
          event_type: 'unlocked',
          completed_orders: completedOrders,
          account_age_days: accountAgeDays,
          reserve_balance: reserveBalance,
          disputes_90_days: disputeCount,
          identity_verified: identityVerified,
          is_eligible: true,
          reason: 'Instant payout unlocked — all criteria met.',
        })

        console.log(`[check-instant-payout-eligibility] baker ${baker.id} — NEWLY ELIGIBLE`)
        newlyEligible++
      } else if (!isEligible && wasEligible) {
        // No longer eligible
        await supabase.from('baker_reserve').update({
          is_instant_payout_eligible: false,
          instant_payout_suspended_at: now,
          instant_payout_suspend_reason: reason,
        }).eq('baker_id', baker.id)

        await supabase.from('instant_payout_eligibility_log').insert({
          baker_id: baker.id,
          event_type: 'suspended',
          completed_orders: completedOrders,
          account_age_days: accountAgeDays,
          reserve_balance: reserveBalance,
          disputes_90_days: disputeCount,
          identity_verified: identityVerified,
          is_eligible: false,
          reason: `Instant payout suspended: ${reason}`,
        })

        console.log(`[check-instant-payout-eligibility] baker ${baker.id} — NEWLY SUSPENDED: ${reason}`)
        newlySuspended++
      } else {
        unchanged++
      }

      totalChecked++
    } catch (err: any) {
      console.error(`[check-instant-payout-eligibility] baker ${baker.id} — error:`, err.message)
      totalChecked++
    }
  }

  const summary = { totalChecked, newlyEligible, newlySuspended, unchanged }
  console.log('[check-instant-payout-eligibility] done —', summary)
  return NextResponse.json(summary)
}
