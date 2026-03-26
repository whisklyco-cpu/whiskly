import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // Find dates that are exactly 42 days from today
  const target = new Date()
  target.setDate(target.getDate() + 42)
  const targetMonth = target.getMonth() + 1
  const targetDay = target.getDate()

  const { data: dates } = await supabase
    .from('customer_important_dates')
    .select('*, customers(email, first_name)')
    .eq('month', targetMonth)
    .eq('day', targetDay)
    .is('reminded_at', null)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://whiskly.co'
  const results: any[] = []

  for (const entry of dates || []) {
    try {
      await fetch(`${appUrl}/api/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'important_date_reminder',
          customerEmail: entry.customers?.email,
          customerName: entry.customers?.first_name || 'there',
          label: entry.label,
          daysAway: 42,
          month: targetMonth,
          day: targetDay,
        }),
      }).catch(() => {})

      await supabase.from('customer_important_dates').update({ reminded_at: new Date().toISOString() }).eq('id', entry.id)
      results.push({ date_id: entry.id, status: 'sent' })
    } catch (err: any) {
      results.push({ date_id: entry.id, status: 'error', error: err.message })
    }
  }

  return NextResponse.json({ processed: results.length, results })
}
