import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { jwtVerify } from 'jose'

export const dynamic = 'force-dynamic'

async function isAdmin(req: NextRequest): Promise<boolean> {
  try {
    const cookie = req.cookies.get('whiskly_admin_session')?.value
    if (!cookie) return false
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    await jwtVerify(cookie, secret)
    return true
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const order_id = req.nextUrl.searchParams.get('order_id')
  if (!order_id) return NextResponse.json({ error: 'Missing order_id' }, { status: 400 })

  const { data: evidence, error } = await supabase
    .from('dispute_evidence')
    .select('submitted_by, submitted_at, statement, photo_urls')
    .eq('order_id', order_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ evidence: evidence || [] })
}
