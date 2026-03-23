import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:Georgia,serif;">
  <div style="max-width:560px;margin:32px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:#2d1a0e;padding:28px 32px;">
      <h1 style="margin:0;font-size:22px;color:white;letter-spacing:0.5px;">Whiskly</h1>
      <p style="margin:4px 0 0;font-size:13px;color:#c8975a;">Custom baked goods, made with love</p>
    </div>
    <div style="padding:32px;">
      ${content}
    </div>
    <div style="background:#f5f0eb;padding:20px 32px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#5c3d2e;">© 2026 Whiskly · <a href="https://whiskly.co" style="color:#5c3d2e;">whiskly.co</a></p>
    </div>
  </div>
</body>
</html>
`

export async function GET(request: Request) {
  // Verify this is a legitimate cron call (Vercel sets this header)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== 'Bearer ' + process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find orders that:
  // 1. Completed 48–72 hours ago (the 24hr window we run this check)
  // 2. Have not had a review reminder sent yet
  // 3. Don't already have a review submitted
  const now = new Date()
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)
  const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000)

  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id,
      customer_name,
      customer_email,
      event_type,
      baker_id,
      review_reminder_sent_at,
      bakers ( business_name, profile_photo_url )
    `)
    .eq('status', 'complete')
    .is('review_reminder_sent_at', null)
    .gte('updated_at', seventyTwoHoursAgo.toISOString())
    .lte('updated_at', fortyEightHoursAgo.toISOString())

  if (error) {
    console.error('Review reminder query error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!orders || orders.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No orders eligible for review reminder' })
  }

  let sent = 0
  const errors: string[] = []

  for (const order of orders) {
    // Skip if a review already exists for this order
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('order_id', order.id)
      .maybeSingle()

    if (existingReview) {
      // Mark reminder as "sent" so we don't keep checking, even though we skipped
      await supabase.from('orders').update({ review_reminder_sent_at: now.toISOString() }).eq('id', order.id)
      continue
    }

    const baker = order.bakers as any
    const bakerName = baker?.business_name || 'your baker'
    const reviewUrl = `https://whiskly.co/dashboard/customer?tab=orders&review=${order.id}`

    const html = emailWrapper(`
      <h2 style="margin:0 0 8px;font-size:20px;color:#2d1a0e;">How did everything turn out?</h2>
      <p style="margin:0 0 20px;font-size:15px;color:#5c3d2e;line-height:1.6;">
        Hi ${order.customer_name?.split(' ')[0] || 'there'}, we hope your ${order.event_type || 'event'} was everything you dreamed of.
        Your review helps other customers discover ${bakerName} and supports their small business.
      </p>

      ${baker?.profile_photo_url ? `
        <div style="display:flex;align-items:center;gap:14px;background:#f5f0eb;border-radius:12px;padding:16px;margin-bottom:24px;">
          <img src="${baker.profile_photo_url}" width="48" height="48" style="border-radius:50%;object-fit:cover;" />
          <div>
            <p style="margin:0;font-size:14px;font-weight:600;color:#2d1a0e;">${bakerName}</p>
            <p style="margin:2px 0 0;font-size:12px;color:#5c3d2e;">Verified Whiskly Baker</p>
          </div>
        </div>
      ` : `
        <div style="background:#f5f0eb;border-radius:12px;padding:16px;margin-bottom:24px;">
          <p style="margin:0;font-size:14px;font-weight:600;color:#2d1a0e;">${bakerName}</p>
        </div>
      `}

      <div style="text-align:center;margin:28px 0;">
        <a href="${reviewUrl}"
          style="display:inline-block;background:#2d1a0e;color:white;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:600;letter-spacing:0.3px;">
          Leave a Review
        </a>
      </div>

      <p style="margin:0;font-size:13px;color:#9c7b6b;text-align:center;">
        Takes less than a minute · No account needed
      </p>
    `)

    try {
      await resend.emails.send({
        from: 'Whiskly <hello@whiskly.co>',
        to: order.customer_email,
        subject: `How was your order from ${bakerName}?`,
        html,
      })

      await supabase
        .from('orders')
        .update({ review_reminder_sent_at: now.toISOString() })
        .eq('id', order.id)

      sent++
    } catch (err: any) {
      errors.push(order.id + ': ' + err.message)
    }
  }

  return NextResponse.json({ sent, errors: errors.length ? errors : undefined })
}