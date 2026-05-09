import { NextRequest, NextResponse } from 'next/server'
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
  const adminEmail = await getAdminEmail(req)
  if (!adminEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const resend = new Resend(process.env.RESEND_API_KEY!)

  const { order_id, to, subject, body } = await req.json()

  if (!order_id || !to || !subject || !body) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    await resend.emails.send({
      from: 'Whiskly Support <support@whiskly.co>',
      to: [to],
      subject,
      html: `<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#faf8f6;">${body.replace(/\n/g, '<br/>')}</div>`,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
