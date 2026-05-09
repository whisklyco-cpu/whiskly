import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { jwtVerify } from 'jose'

export const dynamic = 'force-dynamic'

async function getAdminEmail(req: NextRequest): Promise<string | null> {
  try {
    const cookie = req.cookies.get('whiskly_admin_session')?.value
    if (!cookie) return null
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload } = await jwtVerify(cookie, secret)
    return (payload.email as string) || null
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const adminEmail = await getAdminEmail(req)
  if (!adminEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { order_id, reversal_reason } = await req.json()

  if (!order_id || !reversal_reason || reversal_reason.trim().length < 20) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('*')
    .eq('id', order_id)
    .single()

  if (orderErr || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  // Check 24-hour reversal window
  if (!order.reversal_eligible_until || new Date() > new Date(order.reversal_eligible_until)) {
    return NextResponse.json({ error: 'Reversal window has closed' }, { status: 400 })
  }

  const now = new Date().toISOString()
  const errors: string[] = []
  const flags: string[] = []

  // Determine what money movement happened from auto_resolved_reason
  const originalDecision = order.auto_resolved_reason || ''
  const wasCustomerRuling = originalDecision.includes('customer')
  const wasBakerRuling = originalDecision.includes('baker') && !originalDecision.includes('customer')

  // ── REVERSE CUSTOMER RULING (refund was issued, try to re-charge) ──
  if (wasCustomerRuling || order.status === 'refunded') {
    // We cannot recapture a refund via Stripe API — flag for manual recovery
    flags.push('Original ruling was for customer. Refund(s) already issued — manual recovery required if customer must be re-charged.')
  }

  // ── REVERSE BAKER RULING (transfer was made, try to reverse) ──
  if (wasBakerRuling || order.status === 'complete') {
    // Find payout_tranches rows for this order filed at or after resolved_at
    const { data: tranches } = await supabase
      .from('payout_tranches')
      .select('stripe_transfer_id, net_amount')
      .eq('order_id', order_id)
      .eq('status', 'completed')
      .gte('released_at', order.resolved_at || '')

    for (const tranche of tranches ?? []) {
      if (!tranche.stripe_transfer_id) continue
      try {
        await stripe.transfers.createReversal(tranche.stripe_transfer_id, {
          amount: tranche.net_amount,
          metadata: { reversed_by: adminEmail, reason: 'dispute_reversal' },
        })
        // Restore reserve
        const { data: reserve } = await supabase
          .from('baker_reserve')
          .select('balance')
          .eq('baker_id', order.baker_id)
          .maybeSingle()
        const balanceBefore = reserve?.balance ?? 0
        const bakerGross = tranche.net_amount / 100
        await supabase.from('reserve_transactions').insert({
          baker_id: order.baker_id,
          order_id,
          transaction_type: 'manual_adjustment',
          amount: bakerGross,
          balance_before: balanceBefore,
          balance_after: balanceBefore,
          notes: `Dispute reversal — transfer ${tranche.stripe_transfer_id} reversed. Reason: ${reversal_reason} — ${adminEmail}`,
        })
      } catch (e: any) {
        flags.push(`Transfer reversal failed for ${tranche.stripe_transfer_id}: ${e.message} — MANUAL REVIEW REQUIRED`)
      }
    }
  }

  // Log reserve_transactions manual_adjustment for audit trail
  const { data: reserve } = await supabase
    .from('baker_reserve')
    .select('balance')
    .eq('baker_id', order.baker_id)
    .maybeSingle()

  const balanceBefore = reserve?.balance ?? 0
  await supabase.from('reserve_transactions').insert({
    baker_id: order.baker_id,
    order_id,
    transaction_type: 'manual_adjustment',
    amount: 0,
    balance_before: balanceBefore,
    balance_after: balanceBefore,
    notes: `Decision reversed by ${adminEmail}. Reason: ${reversal_reason}. Flags: ${flags.length ? flags.join('; ') : 'none'}`,
  })

  // Re-open dispute for fresh resolution
  await supabase.from('orders').update({
    is_disputed: true,
    status: 'disputed',
    dispute_notes: `[REVERSED] Original: ${order.dispute_notes || ''} | Reversal reason: ${reversal_reason}`,
    resolved_by_admin: null,
    resolved_at: null,
    reversal_eligible_until: null,
    auto_resolved_reason: null,
    reversed_by_admin: adminEmail,
    reversed_at: now,
  }).eq('id', order_id)

  return NextResponse.json({ ok: true, flags: flags.length ? flags : undefined, errors: errors.length ? errors : undefined })
}
