import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  try {
    const { bakerId, email } = await req.json()

    const account = await stripe.accounts.create({
      type: 'express',
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    })

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: process.env.NEXT_PUBLIC_APP_URL + '/dashboard/baker?stripe=refresh',
      return_url: process.env.NEXT_PUBLIC_APP_URL + '/dashboard/baker?stripe=success',
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url, accountId: account.id })
  } catch (err: any) {
    console.error('Stripe error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}