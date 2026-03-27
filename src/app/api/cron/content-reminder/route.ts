import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  // Find scheduled posts in the next 7 days that haven't had a reminder sent
  const { data: posts, error } = await supabase
    .from('marketing_content')
    .select('*')
    .eq('status', 'scheduled')
    .eq('reminder_sent', false)
    .gte('scheduled_for', now.toISOString())
    .lte('scheduled_for', in7Days.toISOString())

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!posts || posts.length === 0) return NextResponse.json({ sent: 0 })

  // Group posts by day for a clean email
  const grouped: Record<string, any[]> = {}
  for (const post of posts) {
    const day = new Date(post.scheduled_for).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric'
    })
    if (!grouped[day]) grouped[day] = []
    grouped[day].push(post)
  }

  const rows = Object.entries(grouped).map(([day, dayPosts]) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f5f0eb;">
        <p style="font-weight:700;color:#2d1a0e;margin:0 0 6px;">${day}</p>
        ${dayPosts.map(p => `
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
            <span style="background:#f5f0eb;color:#5c3d2e;padding:2px 8px;border-radius:99px;font-size:12px;">${p.platform}</span>
            <span style="color:#5c3d2e;font-size:13px;">${new Date(p.scheduled_for).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}${p.content_type ? ' · ' + p.content_type : ''}${p.baker_name ? ' · ' + p.baker_name : ''}</span>
          </div>
          ${p.caption ? `<p style="color:#9c7b6b;font-size:12px;margin:2px 0 6px 0;">${p.caption}</p>` : ''}
        `).join('')}
      </td>
    </tr>
  `).join('')

  const html = `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#faf8f6;">
      <p style="font-size:22px;font-weight:700;color:#2d1a0e;margin:0 0 4px;">Whiskly Marketing</p>
      <p style="font-size:14px;color:#9c7b6b;margin:0 0 24px;">Content reminder — ${posts.length} post${posts.length !== 1 ? 's' : ''} coming up in the next 7 days</p>
      <table style="width:100%;border-collapse:collapse;">
        ${rows}
      </table>
      <div style="margin-top:24px;text-align:center;">
        <a href="https://whiskly.co/marketing" style="background:#2d1a0e;color:white;text-decoration:none;padding:12px 24px;border-radius:12px;font-size:14px;font-weight:600;">Open Marketing Portal</a>
      </div>
    </div>
  `

  await resend.emails.send({
    from: 'Whiskly Marketing <marketing@whiskly.co>',
    to: [process.env.MARKETING_REMINDER_EMAIL!],
    subject: `${posts.length} post${posts.length !== 1 ? 's' : ''} scheduled this week — Whiskly Marketing`,
    html,
  })

  // Mark reminders as sent
  const ids = posts.map(p => p.id)
  await supabase.from('marketing_content').update({ reminder_sent: true }).in('id', ids)

  return NextResponse.json({ sent: posts.length })
}