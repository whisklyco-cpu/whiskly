import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const { data: evidence } = await supabase
    .from('dispute_evidence')
    .select('id, order_id, submitted_by, token_expires_at, submitted_at')
    .eq('token', token)
    .single()

  if (!evidence) return NextResponse.json({ error: 'Invalid token' }, { status: 404 })

  if (new Date() > new Date(evidence.token_expires_at)) {
    return NextResponse.json({ error: 'Token expired' }, { status: 410 })
  }

  const { data: order } = await supabase
    .from('orders')
    .select('event_type, event_date, bakers(business_name)')
    .eq('id', evidence.order_id)
    .single()

  const baker = Array.isArray(order?.bakers) ? order?.bakers[0] : order?.bakers

  return NextResponse.json({
    order_id: evidence.order_id,
    submitted_by: evidence.submitted_by,
    token_expires_at: evidence.token_expires_at,
    already_submitted: !!evidence.submitted_at,
    event_type: order?.event_type,
    event_date: order?.event_date,
    baker_name: baker?.business_name,
  })
}
