import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const formData = await request.formData()

  const bakerId = formData.get('baker_id') as string
  const customerName = formData.get('customer_name') as string
  const customerEmail = formData.get('customer_email') as string
  const eventType = formData.get('event_type') as string
  const eventDate = formData.get('event_date') as string
  const budget = formData.get('budget') as string
  const itemDescription = formData.get('item_description') as string

  // Generate a reference code
  const refCode = 'WH-' + Math.random().toString(36).substring(2, 8).toUpperCase()

  const { error } = await supabase.from('orders').insert({
    baker_id: bakerId,
    customer_name: customerName,
    customer_email: customerEmail,
    event_type: eventType,
    event_date: eventDate,
    budget: parseInt(budget) || 0,
    item_description: itemDescription,
    reference_code: refCode,
    status: 'pending'
  })

  if (error) {
    return NextResponse.redirect(new URL('/error', request.url))
  }

  return NextResponse.redirect(new URL(`/order-confirmed?ref=${refCode}`, request.url))
}