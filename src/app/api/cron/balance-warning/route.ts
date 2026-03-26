import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const now = new Date()
  // 3–4 days from now
  const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const fourDays = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { data: orders } = await supabase
    .from('orders')
    .select('*, bakers(business_name)')
    .not('deposit_paid_at', 'is', null)
    .is('balance_paid_at', null)
    .in('status', ['confirmed', 'in_progress'])
    .gte('event_date', threeDays)
    .lte('event_date', fourDays)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://whiskly.co'
  const results: any[] = []

  for (const order of orders || []) {
    try {
      const balanceDue = (order.amount_remainder || Math.round((order.budget || 0) * 50)) / 100
      await fetch(`${appUrl}/api/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'balance_warning',
          customerEmail: order.customer_email,
          customerName: order.customer_name,
          bakerName: order.bakers?.business_name,
          eventType: order.event_type,
          eventDate: order.event_date,
          amount: balanceDue.toFixed(2),
          orderId: order.id,
        }),
      }).catch(() => {})
      results.push({ order_id: order.id, status: 'sent' })
    } catch (err: any) {
      results.push({ order_id: order.id, status: 'error', error: err.message })
    }
  }

  return NextResponse.json({ processed: results.length, results })
}
