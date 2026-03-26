import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const cutoff48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
  const cutoff72h = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()

  // Orders completed 48-72h ago with no review
  const { data: orders } = await supabase
    .from('orders')
    .select('*, bakers(business_name)')
    .eq('status', 'complete')
    .is('review_id', null)
    .or(`delivery_confirmed_at.gte.${cutoff72h},pickup_confirmed_at.gte.${cutoff72h}`)
    .or(`delivery_confirmed_at.lt.${cutoff48h},pickup_confirmed_at.lt.${cutoff48h}`)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://whiskly.co'
  const results: any[] = []

  for (const order of orders || []) {
    try {
      await fetch(`${appUrl}/api/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'review_request',
          customerEmail: order.customer_email,
          customerName: order.customer_name,
          bakerName: order.bakers?.business_name,
          eventType: order.event_type,
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
