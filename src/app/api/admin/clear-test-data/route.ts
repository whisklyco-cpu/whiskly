import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { jwtVerify } from 'jose'

export const dynamic = 'force-dynamic'

async function getAdminEmail(req: NextRequest): Promise<string | null> {
  try {
    const cookie = req.cookies.get('whiskly_admin_session')?.value
    if (!cookie) return null
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload } = await jwtVerify(cookie, secret)
    return (payload.email as string) || null
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const adminEmail = await getAdminEmail(req)
  if (!adminEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // Count before deletion for summary message
    const [{ count: orderCount }, { count: msgCount }, { count: reviewCount }] = await Promise.all([
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('messages').select('id', { count: 'exact', head: true }),
      supabase.from('reviews').select('id', { count: 'exact', head: true }),
    ])

    // Delete in dependency order
    await supabase.from('reserve_transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('dispute_evidence').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('payout_tranches').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('baker_reserve').delete().neq('baker_id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('customer_reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('messages').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // Reset baker stats
    await supabase.from('bakers').update({
      completed_orders_count: 0,
      strike_count: 0,
      strike_log: [],
      avg_rating: null,
      rating_count: 0,
    }).neq('id', '00000000-0000-0000-0000-000000000000')

    const message = `Test data cleared. ${orderCount || 0} order${orderCount !== 1 ? 's' : ''}, ${msgCount || 0} message${msgCount !== 1 ? 's' : ''}, and ${reviewCount || 0} review${reviewCount !== 1 ? 's' : ''} deleted.`
    return NextResponse.json({ message })
  } catch (err: any) {
    console.error('Clear test data error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
