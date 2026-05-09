import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const resend = new Resend(process.env.RESEND_API_KEY!)

  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

  // Orders where evidence period closed in the last 24h, not yet admin-notified
  const { data: orders } = await supabase
    .from('orders')
    .select('id, customer_name, event_type, evidence_deadline')
    .eq('is_disputed', true)
    .is('evidence_notified_at', null)
    .lt('evidence_deadline', now.toISOString())
    .gt('evidence_deadline', yesterday)

  if (!orders?.length) {
    return NextResponse.json({ ok: true, processed: 0 })
  }

  const results: any[] = []

  for (const order of orders) {
    const orderIdShort = order.id.slice(0, 8).toUpperCase()

    const { data: evidence } = await supabase
      .from('dispute_evidence')
      .select('submitted_by, submitted_at')
      .eq('order_id', order.id)

    const customerEv = evidence?.find(e => e.submitted_by === 'customer')
    const bakerEv = evidence?.find(e => e.submitted_by === 'baker')

    const customerStatus = customerEv?.submitted_at
      ? `Submitted at ${new Date(customerEv.submitted_at).toLocaleString()}`
      : 'Not submitted'
    const bakerStatus = bakerEv?.submitted_at
      ? `Submitted at ${new Date(bakerEv.submitted_at).toLocaleString()}`
      : 'Not submitted'

    try {
      await resend.emails.send({
        from: 'Whiskly Support <support@whiskly.co>',
        to: ['support@whiskly.co'],
        subject: `[Action Required] Evidence period closed — Order ${orderIdShort}`,
        html: `
          <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#faf8f6;">
            <p style="font-size:18px;font-weight:700;color:#2d1a0e;margin:0 0 16px;">Evidence Period Closed</p>
            <table style="width:100%;font-size:13px;color:#5c3d2e;border-collapse:collapse;">
              <tr><td style="padding:4px 0;font-weight:700;width:140px;">Order</td><td>${orderIdShort}</td></tr>
              <tr><td style="padding:4px 0;font-weight:700;">Customer</td><td>${order.customer_name}</td></tr>
              <tr><td style="padding:4px 0;font-weight:700;">Event type</td><td>${order.event_type || '—'}</td></tr>
              <tr><td style="padding:4px 0;font-weight:700;">Deadline</td><td>${new Date(order.evidence_deadline).toLocaleString()}</td></tr>
            </table>
            <hr style="border:none;border-top:1px solid #e0d5cc;margin:20px 0;" />
            <p style="font-size:14px;font-weight:700;color:#2d1a0e;margin:0 0 8px;">Submission status</p>
            <table style="width:100%;font-size:13px;color:#5c3d2e;border-collapse:collapse;">
              <tr><td style="padding:4px 0;font-weight:700;width:140px;">Customer</td><td>${customerStatus}</td></tr>
              <tr><td style="padding:4px 0;font-weight:700;">Baker</td><td>${bakerStatus}</td></tr>
            </table>
            <p style="font-size:13px;color:#5c3d2e;margin-top:20px;">
              Review the case in the admin panel and make a ruling.
            </p>
          </div>
        `,
      })

      await supabase
        .from('orders')
        .update({ evidence_notified_at: now.toISOString() })
        .eq('id', order.id)

      results.push({ order_id: order.id, ok: true })
    } catch (e: any) {
      results.push({ order_id: order.id, error: e.message })
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results })
}
