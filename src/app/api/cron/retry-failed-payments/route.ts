import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://whiskly.co'
  const results: any[] = []

  // Find payment_issue orders older than 48 hours — cancel them
  const cutoff48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

  const { data: staleOrders } = await supabase
    .from('orders')
    .select('*, bakers(business_name, email)')
    .eq('status', 'payment_issue')
    .not('payment_issue_at', 'is', null)
    .lt('payment_issue_at', cutoff48h)

  for (const order of staleOrders || []) {
    try {
      await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id)

      // Notify customer
      await fetch(`${appUrl}/api/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'balance_failed_final',
          customerEmail: order.customer_email,
          customerName: order.customer_name,
          bakerName: order.bakers?.business_name,
          eventType: order.event_type,
          eventDate: order.event_date,
        }),
      }).catch(() => {})

      // Notify baker
      await fetch(`${appUrl}/api/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'payment_issue_baker',
          bakerEmail: order.bakers?.email,
          bakerName: order.bakers?.business_name,
          customerName: order.customer_name,
          eventType: order.event_type,
          eventDate: order.event_date,
          orderId: order.id,
        }),
      }).catch(() => {})

      results.push({ order_id: order.id, action: 'cancelled_after_48h' })
    } catch (err: any) {
      results.push({ order_id: order.id, status: 'error', error: err.message })
    }
  }

  // Find payment_issue orders under 48 hours — send reminder (once)
  const { data: freshIssues } = await supabase
    .from('orders')
    .select('*, bakers(business_name)')
    .eq('status', 'payment_issue')
    .gte('payment_issue_at', cutoff48h)

  for (const order of freshIssues || []) {
    try {
      await fetch(`${appUrl}/api/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'balance_failed',
          customerEmail: order.customer_email,
          customerName: order.customer_name,
          bakerName: order.bakers?.business_name,
          eventType: order.event_type,
          eventDate: order.event_date,
          orderId: order.id,
        }),
      }).catch(() => {})
      results.push({ order_id: order.id, action: 'reminder_sent' })
    } catch (err: any) {
      results.push({ order_id: order.id, status: 'error', error: err.message })
    }
  }

  return NextResponse.json({ processed: results.length, results })
}
