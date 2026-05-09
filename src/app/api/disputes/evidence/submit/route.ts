import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { token, statement, photo_urls } = await req.json()

  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  if (!statement || statement.trim().length < 20) {
    return NextResponse.json({ error: 'Statement must be at least 20 characters' }, { status: 400 })
  }

  const { data: evidence } = await supabase
    .from('dispute_evidence')
    .select('id, submitted_at, token_expires_at')
    .eq('token', token)
    .single()

  if (!evidence) return NextResponse.json({ error: 'Invalid token' }, { status: 404 })

  if (new Date() > new Date(evidence.token_expires_at)) {
    return NextResponse.json({ error: 'Token expired' }, { status: 410 })
  }

  if (evidence.submitted_at) {
    return NextResponse.json({ error: 'Evidence already submitted' }, { status: 409 })
  }

  const { error } = await supabase
    .from('dispute_evidence')
    .update({
      statement: statement.trim(),
      photo_urls: photo_urls || [],
      submitted_at: new Date().toISOString(),
    })
    .eq('token', token)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
