import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { jwtVerify } from 'jose'
import { Resend } from 'resend'

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
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[resolve] Missing service role key')
    return NextResponse.json({ error: 'Missing service role key' }, { status: 500 })
  }

  const adminEmail = await getAdminEmail(req)
  if (!adminEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const resend = new Resend(process.env.RESEND_API_KEY!)

  const { order_id, decision: rawDecision, notes, customer_pct, baker_pct, strike_baker } = await req.json()
  // Normalise 'partial' (DisputeCase ruling value) to 'split' (API decision value)
  const decision: string = rawDecision === 'partial' ? 'split' : rawDecision

  const validDecisions = ['customer', 'baker', 'split', 'noop']
  if (!order_id || !decision || !validDecisions.includes(decision) || !notes || notes.trim().length < 20) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (decision === 'split' && (customer_pct + baker_pct !== 100 || customer_pct < 0 || baker_pct < 0)) {
    return NextResponse.json({ error: 'Split percentages must sum to 100' }, { status: 400 })
  }

  // Fetch the order
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('*, bakers(id, business_name, email, stripe_account_id, tier)')
    .eq('id', order_id)
    .single()

  if (orderErr || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  if (!order.is_disputed) return NextResponse.json({ error: 'Order is not disputed' }, { status: 400 })

  const now = new Date()
  const resolvedAt = now.toISOString()
  const reversalEligibleUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()

  const baker = Array.isArray(order.bakers) ? order.bakers[0] : order.bakers
  const amountTotalCents: number = order.amount_total ?? 0
  const commissionRate = baker?.tier === 'pro' ? 0.07 : 0.10

  const decisionLabel = decision === 'customer'
    ? 'Ruled for customer'
    : decision === 'baker'
    ? 'Ruled for baker'
    : decision === 'noop'
    ? 'No action taken — order unlocked'
    : `Split decision (customer ${customer_pct}% / baker ${baker_pct}%)`

  const autoResolvedReason = `${decisionLabel} — resolved by ${adminEmail} on ${new Date(resolvedAt).toLocaleString()}`

  const errors: string[] = []

  // ── CUSTOMER WIN ────────────────────────────────────────────────
  if (decision === 'customer') {
    // Refund deposit
    if (order.deposit_payment_intent_id) {
      try {
        await stripe.refunds.create({ payment_intent: order.deposit_payment_intent_id })
      } catch (e: any) {
        errors.push('Deposit refund failed: ' + e.message)
      }
    }
    // Refund balance
    if (order.balance_payment_intent_id) {
      try {
        await stripe.refunds.create({ payment_intent: order.balance_payment_intent_id })
      } catch (e: any) {
        errors.push('Balance refund failed: ' + e.message)
      }
    }

    // Deduct from baker reserve (dispute_draw)
    const drawAmountDollars = amountTotalCents / 100
    const { data: reserve } = await supabase
      .from('baker_reserve')
      .select('balance')
      .eq('baker_id', order.baker_id)
      .maybeSingle()

    const balanceBefore = reserve?.balance ?? 0
    const balanceAfter = Math.max(0, balanceBefore - drawAmountDollars)

    await supabase.from('reserve_transactions').insert({
      baker_id: order.baker_id,
      order_id,
      transaction_type: 'dispute_draw',
      amount: drawAmountDollars,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      notes: `Dispute draw — ruled for customer. Admin: ${adminEmail}`,
    })

    if (reserve) {
      await supabase.from('baker_reserve').update({ balance: balanceAfter }).eq('baker_id', order.baker_id)
    }

    const { error: updateErrCustomer } = await supabase.from('orders').update({
      is_disputed: false,
      status: 'refunded',
      dispute_notes: notes,
      auto_resolved: false,
      auto_resolved_reason: autoResolvedReason,
      resolved_by_admin: adminEmail,
      resolved_at: resolvedAt,
      reversal_eligible_until: reversalEligibleUntil,
    }).eq('id', order_id)
    if (updateErrCustomer) {
      console.error('[resolve] orders.update failed (customer):', updateErrCustomer)
      return NextResponse.json({ error: 'Failed to update order: ' + updateErrCustomer.message }, { status: 500 })
    }

    // Strike baker if requested
    if (strike_baker && order.baker_id) {
      try {
        const { data: bakerData } = await supabase
          .from('bakers')
          .select('strike_count, strike_log')
          .eq('id', order.baker_id)
          .single()
        if (bakerData) {
          const newCount = (bakerData.strike_count ?? 0) + 1
          const log = [...(bakerData.strike_log || []), {
            reason: 'dispute_ruled_against_baker',
            date: resolvedAt,
            order_id,
            issued_by: adminEmail,
          }]
          await supabase.from('bakers').update({ strike_count: newCount, strike_log: log }).eq('id', order.baker_id)
        }
      } catch (e: any) {
        errors.push('Baker strike failed: ' + e.message)
      }
    }
  }

  // ── BAKER WIN ────────────────────────────────────────────────────
  if (decision === 'baker') {
    if (baker?.stripe_account_id && amountTotalCents > 0) {
      const commissionCents = Math.round(amountTotalCents * commissionRate)
      const netCents = amountTotalCents - commissionCents

      try {
        const transfer = await stripe.transfers.create({
          amount: netCents,
          currency: 'usd',
          destination: baker.stripe_account_id,
          metadata: { order_id, tranche_type: 'dispute_ruling_baker' },
          description: `Dispute ruling — baker favor — Order ${order_id.slice(0, 8)}`,
        })

        await supabase.from('payout_tranches').insert({
          order_id,
          baker_id: order.baker_id,
          tranche_type: 'final_payout',
          gross_amount: amountTotalCents,
          commission_amount: commissionCents,
          reserve_withheld: 0,
          net_amount: netCents,
          status: 'completed',
          released_at: resolvedAt,
          stripe_transfer_id: transfer.id,
        })

        const { data: reserve } = await supabase
          .from('baker_reserve')
          .select('balance')
          .eq('baker_id', order.baker_id)
          .maybeSingle()

        const balanceBefore = reserve?.balance ?? 0
        await supabase.from('reserve_transactions').insert({
          baker_id: order.baker_id,
          order_id,
          transaction_type: 'withhold',
          amount: 0,
          balance_before: balanceBefore,
          balance_after: balanceBefore,
          notes: `Dispute ruling — baker favor, no reserve withheld. Admin: ${adminEmail}`,
          stripe_transfer_id: transfer.id,
        })
      } catch (e: any) {
        errors.push('Baker transfer failed: ' + e.message)
      }
    }

    const { error: updateErrBaker } = await supabase.from('orders').update({
      is_disputed: false,
      status: 'complete',
      dispute_notes: notes,
      auto_resolved: false,
      auto_resolved_reason: autoResolvedReason,
      resolved_by_admin: adminEmail,
      resolved_at: resolvedAt,
      reversal_eligible_until: reversalEligibleUntil,
    }).eq('id', order_id)
    if (updateErrBaker) {
      console.error('[resolve] orders.update failed (baker):', updateErrBaker)
      return NextResponse.json({ error: 'Failed to update order: ' + updateErrBaker.message }, { status: 500 })
    }
  }

  // ── SPLIT ────────────────────────────────────────────────────────
  if (decision === 'split') {
    const customerCents = Math.round(amountTotalCents * (customer_pct / 100))
    const bakerCents = amountTotalCents - customerCents

    // Partial refund to customer
    if (customerCents > 0) {
      // Try deposit first, then balance
      const piToRefund = order.balance_payment_intent_id || order.deposit_payment_intent_id
      if (piToRefund) {
        try {
          await stripe.refunds.create({ payment_intent: piToRefund, amount: customerCents })
        } catch (e: any) {
          errors.push('Partial refund failed: ' + e.message)
        }
      }
    }

    // Partial transfer to baker
    if (bakerCents > 0 && baker?.stripe_account_id) {
      const commissionCents = Math.round(bakerCents * commissionRate)
      const netCents = bakerCents - commissionCents
      if (netCents > 0) {
        try {
          const transfer = await stripe.transfers.create({
            amount: netCents,
            currency: 'usd',
            destination: baker.stripe_account_id,
            metadata: { order_id, tranche_type: 'dispute_split_baker' },
            description: `Dispute split — baker ${baker_pct}% — Order ${order_id.slice(0, 8)}`,
          })

          await supabase.from('payout_tranches').insert({
            order_id,
            baker_id: order.baker_id,
            tranche_type: 'final_payout',
            gross_amount: bakerCents,
            commission_amount: commissionCents,
            reserve_withheld: 0,
            net_amount: netCents,
            status: 'completed',
            released_at: resolvedAt,
            stripe_transfer_id: transfer.id,
          })
        } catch (e: any) {
          errors.push('Baker split transfer failed: ' + e.message)
        }
      }
    }

    // Log customer draw from reserve
    const { data: reserve } = await supabase
      .from('baker_reserve')
      .select('balance')
      .eq('baker_id', order.baker_id)
      .maybeSingle()

    const balanceBefore = reserve?.balance ?? 0
    const drawDollars = customerCents / 100
    const balanceAfter = Math.max(0, balanceBefore - drawDollars)

    if (customerCents > 0) {
      await supabase.from('reserve_transactions').insert({
        baker_id: order.baker_id,
        order_id,
        transaction_type: 'dispute_draw',
        amount: drawDollars,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        notes: `Split dispute — ${customer_pct}% to customer. Admin: ${adminEmail}`,
      })
      if (reserve) {
        await supabase.from('baker_reserve').update({ balance: balanceAfter }).eq('baker_id', order.baker_id)
      }
    }

    const { error: updateErrSplit } = await supabase.from('orders').update({
      is_disputed: false,
      status: 'refunded',
      dispute_notes: notes,
      auto_resolved: false,
      auto_resolved_reason: autoResolvedReason,
      resolved_by_admin: adminEmail,
      resolved_at: resolvedAt,
      reversal_eligible_until: reversalEligibleUntil,
    }).eq('id', order_id)
    if (updateErrSplit) {
      console.error('[resolve] orders.update failed (split):', updateErrSplit)
      return NextResponse.json({ error: 'Failed to update order: ' + updateErrSplit.message }, { status: 500 })
    }
  }

  // ── NOOP ─────────────────────────────────────────────────────────
  if (decision === 'noop') {
    console.log('[resolve] noop update START — order_id:', order_id)
    const { error: updateErrNoop } = await supabase.from('orders').update({
      is_disputed: false,
      status: 'confirmed',
      dispute_notes: notes,
      auto_resolved: false,
      auto_resolved_reason: autoResolvedReason,
      resolved_by_admin: adminEmail,
      resolved_at: resolvedAt,
      reversal_eligible_until: reversalEligibleUntil,
    }).eq('id', order_id)
    console.log('[resolve] noop update END — order_id:', order_id, 'error:', updateErrNoop ?? null)
    if (updateErrNoop) {
      console.error('[resolve] orders.update failed (noop):', updateErrNoop)
      return NextResponse.json({ error: 'Failed to update order: ' + updateErrNoop.message }, { status: 500 })
    }
  }

  // ── EMAILS ───────────────────────────────────────────────────────
  const orderIdShort = order_id.slice(0, 8).toUpperCase()
  const totalDollars = (amountTotalCents / 100).toFixed(2)
  const bakerDisplayName = baker?.business_name ?? 'the baker'
  const eventType = order.event_type ?? 'order'

  let customerSubject = ''
  let bakerSubject = ''
  let customerEmailBody = ''
  let bakerEmailBody = ''

  if (decision === 'customer') {
    customerSubject = `Your dispute has been resolved — Order ${orderIdShort}`
    bakerSubject = `Dispute resolved — Order ${orderIdShort}`
    customerEmailBody = `We reviewed your dispute for your ${eventType} order with ${bakerDisplayName} and ruled in your favor. A full refund of $${totalDollars} will appear on your original payment method within 5–10 business days. Thank you for your patience.`
    bakerEmailBody = `We reviewed the dispute on order ${orderIdShort} and ruled in favor of the customer. A full refund has been issued.${strike_baker ? ' This has been recorded as a strike on your account.' : ''} If you have questions, contact support@whiskly.co.`
  } else if (decision === 'baker') {
    customerSubject = `Your dispute has been resolved — Order ${orderIdShort}`
    bakerSubject = `Dispute resolved in your favor — Order ${orderIdShort}`
    customerEmailBody = `We reviewed your dispute for your ${eventType} order with ${bakerDisplayName}. After reviewing the evidence, we were unable to find sufficient grounds for a refund. Our decision is final. If you have further questions, contact support@whiskly.co.`
    bakerEmailBody = `We reviewed the dispute on order ${orderIdShort} and ruled in your favor. Your payment has been released. Thank you for your patience.`
  } else if (decision === 'split') {
    const customerRefundDollars = (Math.round(amountTotalCents * customer_pct / 100) / 100).toFixed(2)
    const bakerPayoutDollars = (Math.round(amountTotalCents * baker_pct / 100) / 100).toFixed(2)
    customerSubject = `Your dispute has been resolved — Order ${orderIdShort}`
    bakerSubject = `Dispute resolved — Order ${orderIdShort}`
    customerEmailBody = `We reviewed your dispute for your ${eventType} order with ${bakerDisplayName} and issued a partial resolution. You will receive a refund of $${customerRefundDollars} (${customer_pct}% of $${totalDollars}) within 5–10 business days.`
    bakerEmailBody = `We reviewed the dispute on order ${orderIdShort} and issued a partial resolution. You will receive $${bakerPayoutDollars} (${baker_pct}% of $${totalDollars}).`
  } else if (decision === 'noop') {
    customerSubject = `Your dispute has been reviewed — Order ${orderIdShort}`
    bakerSubject = `Dispute reviewed — Order ${orderIdShort}`
    customerEmailBody = `We reviewed your dispute for your ${eventType} order with ${bakerDisplayName}. After investigation, no action was required and your order is continuing as normal. If you have questions, contact support@whiskly.co.`
    bakerEmailBody = `We reviewed the dispute on order ${orderIdShort}. No action was required and the order has been unlocked.`
  }

  const emailBase = (name: string, body: string) => `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#faf8f6;">
      <p style="font-size:20px;font-weight:700;color:#2d1a0e;margin:0 0 4px;">Whiskly Dispute Resolution</p>
      <p style="font-size:13px;color:#9c7b6b;margin:0 0 24px;">Order ${orderIdShort}</p>
      <p style="font-size:14px;color:#2d1a0e;">Hi ${name},</p>
      <p style="font-size:14px;color:#5c3d2e;line-height:1.6;">${body}</p>
      <p style="font-size:13px;color:#5c3d2e;margin-top:24px;">Whiskly Support<br><a href="mailto:support@whiskly.co" style="color:#8B4513;">support@whiskly.co</a></p>
    </div>
  `

  if (customerSubject) {
    try {
      await resend.emails.send({
        from: 'Whiskly Support <support@whiskly.co>',
        to: [order.customer_email],
        subject: customerSubject,
        html: emailBase(order.customer_name, customerEmailBody),
      })
    } catch (e: any) {
      errors.push('Customer email failed: ' + e.message)
    }
  }

  if (bakerSubject && baker?.email) {
    try {
      await resend.emails.send({
        from: 'Whiskly Support <support@whiskly.co>',
        to: [baker.email],
        subject: bakerSubject,
        html: emailBase(bakerDisplayName, bakerEmailBody),
      })
    } catch (e: any) {
      errors.push('Baker email failed: ' + e.message)
    }
  }

  return NextResponse.json({ ok: true, errors: errors.length ? errors : undefined })
}
