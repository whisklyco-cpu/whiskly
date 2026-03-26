import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // Pending orders older than 48 hours with no baker response
  const cutoff48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

  const { data: orders } = await supabase
    .from('orders')
    .select('*, bakers(email, business_name)')
    .eq('status', 'pending')
    .lt('created_at', cutoff48h)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://whiskly.co'
  const results: any[] = []

  for (const order of orders || []) {
    try {
      await supabase.from('orders').update({ status: 'auto_cancelled' }).eq('id', order.id)

      // Apologize to customer
      await fetch(`${appUrl}/api/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'order_auto_cancelled',
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
          type: 'baker_confirmation_reminder',
          bakerEmail: order.bakers?.email,
          bakerName: order.bakers?.business_name,
          customerName: order.customer_name,
          eventType: order.event_type,
          eventDate: order.event_date,
          budget: order.budget,
          orderId: order.id,
          isCancellationNotice: true,
        }),
      }).catch(() => {})

      results.push({ order_id: order.id, action: 'auto_cancelled' })
    } catch (err: any) {
      results.push({ order_id: order.id, status: 'error', error: err.message })
    }
  }

  return NextResponse.json({ processed: results.length, results })
}
