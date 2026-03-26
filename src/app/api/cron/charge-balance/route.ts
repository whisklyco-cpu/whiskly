import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const today = new Date().toISOString().split('T')[0]

  const { data: orders } = await supabase
    .from('orders')
    .select('id')
    .eq('balance_charge_date', today)
    .is('balance_paid_at', null)
    .not('deposit_paid_at', 'is', null)
    .in('status', ['confirmed', 'in_progress'])

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://whiskly.co'
  const results: any[] = []

  for (const order of orders || []) {
    try {
      const res = await fetch(`${appUrl}/api/stripe/charge-balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: order.id }),
      })
      const data = await res.json()
      results.push({ order_id: order.id, status: data.success ? 'charged' : 'error', error: data.error })
    } catch (err: any) {
      results.push({ order_id: order.id, status: 'error', error: err.message })
    }
  }

  return NextResponse.json({ processed: results.length, results })
}
