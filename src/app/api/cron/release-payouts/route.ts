import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // Orders where delivery was confirmed 3+ days ago and payout not yet released
  const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()

  const { data: orders } = await supabase
    .from('orders')
    .select('id, baker_id, customer_name, event_type, bakers(email, business_name)')
    .eq('status', 'complete')
    .not('delivery_confirmed_at', 'is', null)
    .is('payout_released_at', null)
    .lt('delivery_confirmed_at', cutoff)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://whiskly.co'
  const results: any[] = []

  for (const order of orders || []) {
    try {
      const res = await fetch(`${appUrl}/api/stripe/release-payout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: order.id }),
      })
      const data = await res.json()
      if (data.success) {
        // Notify baker
        await fetch(`${appUrl}/api/email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'payout_released',
            bakerEmail: (order as any).bakers?.email,
            bakerName: (order as any).bakers?.business_name,
            customerName: order.customer_name,
            eventType: order.event_type,
            amount: (data.payout_cents / 100).toFixed(2),
            orderId: order.id,
          }),
        }).catch(() => {})
        results.push({ order_id: order.id, status: 'released', amount: data.payout_cents })
      } else {
        results.push({ order_id: order.id, status: 'error', error: data.error })
      }
    } catch (err: any) {
      results.push({ order_id: order.id, status: 'error', error: err.message })
    }
  }

  return NextResponse.json({ processed: results.length, results })
}
