import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date()
  const nowIso = now.toISOString()
  const results: any[] = []

  // ── PART 5: Trusted Member Badge ─────────────────────────────────────────
  // Criteria (permanent once awarded):
  //   - 3+ completed orders
  //   - No disputes filed against them in last 180 days
  //   - No chargebacks (is_chargeback = true not present in orders)
  //   - avg_rating >= 4.0 (from bakers rating them, rating_count >= 1)
  //   - account >= 30 days old

  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const oneEightyDaysAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString()

  // Fetch customers who don't yet have the badge
  const { data: candidates } = await supabase
    .from('customers')
    .select('id, email, full_name, avg_rating, rating_count, created_at, is_trusted_member')
    .eq('is_trusted_member', false)
    .lte('created_at', thirtyDaysAgo)

  for (const customer of (candidates || [])) {
    try {
      // Check completed order count
      const { count: completedCount } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('customer_email', customer.email)
        .eq('status', 'complete')

      if (!completedCount || completedCount < 3) continue

      // Check for disputes in last 180 days (filed against this customer)
      const { count: recentDisputeCount } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('customer_email', customer.email)
        .eq('dispute_filed_by', 'baker')
        .gte('dispute_filed_at', oneEightyDaysAgo)

      if (recentDisputeCount && recentDisputeCount > 0) continue

      // Check avg_rating requirement (only enforce if they have ratings)
      if (customer.rating_count > 0 && (customer.avg_rating || 0) < 4.0) continue

      // All criteria met — award badge
      await supabase.from('customers').update({
        is_trusted_member: true,
        trusted_member_since: nowIso,
      }).eq('id', customer.id)

      results.push({ type: 'trusted_member_awarded', customer_id: customer.id, email: customer.email })
    } catch (e: any) {
      results.push({ type: 'trusted_member_error', customer_id: customer.id, error: e.message })
    }
  }

  // ── PART 6: Top Baker Badge ───────────────────────────────────────────────
  // Award criteria:
  //   - 10+ completed orders (no baker-initiated cancellations)
  //   - avg_rating >= 4.5 with rating_count >= 1
  //   - No disputes in last 90 days
  //   - profile_complete = true
  //   - account >= 60 days old
  //
  // Quarterly re-evaluation (Jan/Apr/Jul/Oct 1st):
  //   - Remove badge if criteria no longer met; send removal email

  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString()
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()

  // Check if today is a quarterly re-evaluation day (1st of Jan/Apr/Jul/Oct)
  const isQuarterlyDay = now.getDate() === 1 && [0, 3, 6, 9].includes(now.getMonth())

  // ── Award pass: bakers without the badge ─────────────────────────────────
  const { data: bakerCandidates } = await supabase
    .from('bakers')
    .select('id, email, business_name, avg_rating, review_count, strike_count, created_at, is_top_baker, profile_complete')
    .eq('is_top_baker', false)
    .eq('is_active', true)
    .eq('profile_complete', true)
    .lte('created_at', sixtyDaysAgo)

  for (const baker of (bakerCandidates || [])) {
    try {
      // avg_rating >= 4.5 with at least 1 review
      if (!baker.review_count || baker.review_count < 1) continue
      if ((baker.avg_rating || 0) < 4.5) continue

      // 10+ completed orders (no baker-initiated cancellations)
      const { count: completedCount } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('baker_id', baker.id)
        .eq('status', 'complete')

      if (!completedCount || completedCount < 10) continue

      // No baker-initiated cancellations
      const { count: bakerCancelCount } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('baker_id', baker.id)
        .eq('cancelled_by', 'baker')

      if (bakerCancelCount && bakerCancelCount > 0) continue

      // No disputes in last 90 days
      const { count: recentDisputeCount } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('baker_id', baker.id)
        .eq('is_disputed', true)
        .gte('dispute_filed_at', ninetyDaysAgo)

      if (recentDisputeCount && recentDisputeCount > 0) continue

      // Award badge
      await supabase.from('bakers').update({
        is_top_baker: true,
        top_baker_since: nowIso,
      }).eq('id', baker.id)

      // Send congratulations email
      await fetch(process.env.NEXT_PUBLIC_SITE_URL + '/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'announcement',
          to: baker.email,
          name: baker.business_name,
          subject: 'Congratulations — you\'ve earned the Top Baker badge on Whiskly!',
          body: 'We\'re thrilled to award you the Top Baker badge! This badge is given to a select group of bakers who consistently deliver outstanding results — you\'ve earned it through your high ratings, completed orders, and professionalism. The badge will appear on your public profile and in search results. Keep up the incredible work! — The Whiskly Team',
        }),
      }).catch(() => {})

      results.push({ type: 'top_baker_awarded', baker_id: baker.id, business_name: baker.business_name })
    } catch (e: any) {
      results.push({ type: 'top_baker_award_error', baker_id: baker.id, error: e.message })
    }
  }

  // ── Quarterly re-evaluation: remove badge if criteria no longer met ───────
  if (isQuarterlyDay) {
    const { data: topBakers } = await supabase
      .from('bakers')
      .select('id, email, business_name, avg_rating, review_count, is_active, profile_complete')
      .eq('is_top_baker', true)

    for (const baker of (topBakers || [])) {
      try {
        let shouldRemove = false

        if (!baker.is_active || !baker.profile_complete) { shouldRemove = true }
        else if (!baker.review_count || baker.review_count < 1 || (baker.avg_rating || 0) < 4.5) { shouldRemove = true }
        else {
          // Check completed orders still >= 10
          const { count: completedCount } = await supabase
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .eq('baker_id', baker.id)
            .eq('status', 'complete')
          if (!completedCount || completedCount < 10) shouldRemove = true
        }

        if (!shouldRemove) {
          // Check no disputes in last 90 days
          const { count: recentDisputeCount } = await supabase
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .eq('baker_id', baker.id)
            .eq('is_disputed', true)
            .gte('dispute_filed_at', ninetyDaysAgo)
          if (recentDisputeCount && recentDisputeCount > 0) shouldRemove = true
        }

        if (shouldRemove) {
          await supabase.from('bakers').update({
            is_top_baker: false,
            top_baker_since: null,
          }).eq('id', baker.id)

          // Send removal email
          await fetch(process.env.NEXT_PUBLIC_SITE_URL + '/api/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'announcement',
              to: baker.email,
              name: baker.business_name,
              subject: 'Your Top Baker badge has been removed — Whiskly',
              body: 'During our quarterly review, we found that your account no longer meets all Top Baker criteria (rating ≥ 4.5, 10+ completed orders, no recent disputes, active profile). Your badge has been removed. You can earn it back by continuing to provide excellent service. If you have questions, contact support@whiskly.co.',
            }),
          }).catch(() => {})

          results.push({ type: 'top_baker_removed', baker_id: baker.id, business_name: baker.business_name })
        }
      } catch (e: any) {
        results.push({ type: 'top_baker_reeval_error', baker_id: baker.id, error: e.message })
      }
    }
  }

  return NextResponse.json({ processed: results.length, quarterly_reeval: isQuarterlyDay, results })
}
