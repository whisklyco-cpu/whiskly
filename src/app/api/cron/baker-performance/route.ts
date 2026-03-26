import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://whiskly.co'

  const { data: bakers } = await supabase
    .from('bakers')
    .select('id, email, business_name, avg_rating, review_count')
    .eq('is_active', true)

  const results: any[] = []

  for (const baker of bakers || []) {
    try {
      const { data: bakerOrders } = await supabase
        .from('orders')
        .select('status, created_at, confirmed_at, is_disputed')
        .eq('baker_id', baker.id)
        .not('status', 'eq', 'pending')

      const total = (bakerOrders || []).length
      if (total === 0) continue

      const completed = (bakerOrders || []).filter(o => o.status === 'complete').length
      const completionRate = total > 0 ? completed / total : 1
      const avgRating = baker.avg_rating || 5

      // Calculate avg response time (hours from created to confirmed)
      const responseTimes = (bakerOrders || [])
        .filter(o => o.confirmed_at && o.created_at)
        .map(o => (new Date(o.confirmed_at).getTime() - new Date(o.created_at).getTime()) / 3600000)
      const avgResponseHours = responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0

      const needsAlert = avgResponseHours > 48 || completionRate < 0.8 || avgRating < 3.5

      if (needsAlert) {
        await supabase.from('bakers').update({ needs_review: true }).eq('id', baker.id)

        await fetch(`${appUrl}/api/email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'baker_performance_alert',
            bakerEmail: baker.email,
            bakerName: baker.business_name,
            avgResponseHours: Math.round(avgResponseHours),
            completionRate: Math.round(completionRate * 100),
            avgRating: avgRating?.toFixed(1),
          }),
        }).catch(() => {})

        results.push({ baker_id: baker.id, flagged: true, avgResponseHours, completionRate, avgRating })
      } else {
        results.push({ baker_id: baker.id, flagged: false })
      }
    } catch (err: any) {
      results.push({ baker_id: baker.id, status: 'error', error: err.message })
    }
  }

  return NextResponse.json({ processed: results.length, results })
}
