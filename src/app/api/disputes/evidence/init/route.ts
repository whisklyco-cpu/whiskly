import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const resend = new Resend(process.env.RESEND_API_KEY!)

  const { order_id } = await req.json()
  if (!order_id) return NextResponse.json({ error: 'Missing order_id' }, { status: 400 })

  const { data: order } = await supabase
    .from('orders')
    .select('*, bakers(id, business_name, email)')
    .eq('id', order_id)
    .single()

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const baker = Array.isArray(order.bakers) ? order.bakers[0] : order.bakers

  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
  const customerToken = crypto.randomUUID()
  const bakerToken = crypto.randomUUID()

  const orderIdShort = order_id.slice(0, 8).toUpperCase()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.whiskly.co'
  const customerLink = `${baseUrl}/disputes/evidence?token=${customerToken}`
  const bakerLink = `${baseUrl}/disputes/evidence?token=${bakerToken}`

  const { error: insertErr } = await supabase.from('dispute_evidence').insert([
    { order_id, submitted_by: 'customer', token: customerToken, token_expires_at: expiresAt },
    { order_id, submitted_by: 'baker',    token: bakerToken,    token_expires_at: expiresAt },
  ])

  if (insertErr && !insertErr.message.includes('unique')) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  await supabase
    .from('orders')
    .update({ evidence_deadline: expiresAt })
    .eq('id', order_id)

  const emailWrapper = (body: string) => `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#faf8f6;">
      <p style="font-size:20px;font-weight:700;color:#2d1a0e;margin:0 0 24px;">Whiskly</p>
      <p style="font-size:14px;color:#5c3d2e;line-height:1.6;">${body}</p>
      <p style="font-size:13px;color:#5c3d2e;margin-top:24px;">
        Whiskly Support<br>
        <a href="mailto:support@whiskly.co" style="color:#8B4513;">support@whiskly.co</a>
      </p>
    </div>
  `

  const subject = `We need your side of the story — Order ${orderIdShort}`
  const errors: string[] = []

  try {
    await resend.emails.send({
      from: 'Whiskly Support <support@whiskly.co>',
      to: [order.customer_email],
      subject,
      html: emailWrapper(
        `Hi ${order.customer_name},<br><br>` +
        `A dispute has been filed regarding your ${order.event_type || 'order'} order with ${baker?.business_name || 'your baker'}. ` +
        `We want to hear your side before making a decision. You have 48 hours to submit your statement and any photos.<br><br>` +
        `<a href="${customerLink}" style="background:#8B4513;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Submit your evidence</a><br><br>` +
        `After 48 hours the link will expire and we will proceed with the information available.<br><br>Whiskly Support`
      ),
    })
  } catch (e: any) {
    errors.push('Customer email failed: ' + e.message)
  }

  if (baker?.email) {
    try {
      await resend.emails.send({
        from: 'Whiskly Support <support@whiskly.co>',
        to: [baker.email],
        subject,
        html: emailWrapper(
          `Hi ${baker.business_name},<br><br>` +
          `A dispute has been filed on order ${orderIdShort} for a ${order.event_type || 'order'}` +
          `${order.event_date ? ` on ${order.event_date}` : ''}. ` +
          `You have 48 hours to submit your statement and any supporting photos.<br><br>` +
          `<a href="${bakerLink}" style="background:#8B4513;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Submit your evidence</a><br><br>` +
          `After 48 hours the link will expire.<br><br>Whiskly Support`
        ),
      })
    } catch (e: any) {
      errors.push('Baker email failed: ' + e.message)
    }
  }

  return NextResponse.json({ ok: true, errors: errors.length ? errors : undefined })
}
