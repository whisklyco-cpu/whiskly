import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const { type, bakerEmail, bakerName, customerName, eventType, eventDate, budget, description } = await req.json()

    if (type === 'new_order') {
      await resend.emails.send({
        from: 'Whiskly <notifications@whiskly.vercel.app>',
        to: bakerEmail,
        subject: 'New booking request on Whiskly!',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <h1 style="color: #2d1a0e; font-size: 24px; margin-bottom: 8px;">🎂 New Booking Request</h1>
            <p style="color: #5c3d2e; margin-bottom: 24px;">Hi ${bakerName}, you have a new request on Whiskly!</p>
            
            <div style="background: #f5f0eb; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <h2 style="color: #2d1a0e; font-size: 16px; margin-bottom: 16px;">Request Details</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #e0d5cc;">
                  <td style="padding: 8px 0; color: #5c3d2e; font-size: 14px;">Customer</td>
                  <td style="padding: 8px 0; color: #2d1a0e; font-size: 14px; font-weight: 600;">${customerName}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e0d5cc;">
                  <td style="padding: 8px 0; color: #5c3d2e; font-size: 14px;">Event Type</td>
                  <td style="padding: 8px 0; color: #2d1a0e; font-size: 14px; font-weight: 600;">${eventType}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e0d5cc;">
                  <td style="padding: 8px 0; color: #5c3d2e; font-size: 14px;">Event Date</td>
                  <td style="padding: 8px 0; color: #2d1a0e; font-size: 14px; font-weight: 600;">${eventDate}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e0d5cc;">
                  <td style="padding: 8px 0; color: #5c3d2e; font-size: 14px;">Budget</td>
                  <td style="padding: 8px 0; color: #2d1a0e; font-size: 14px; font-weight: 600;">$${budget}</td>
                </tr>
                ${description ? `
                <tr>
                  <td style="padding: 8px 0; color: #5c3d2e; font-size: 14px; vertical-align: top;">Details</td>
                  <td style="padding: 8px 0; color: #2d1a0e; font-size: 14px;">${description}</td>
                </tr>
                ` : ''}
              </table>
            </div>

            <a href="https://whiskly.vercel.app/dashboard/baker" 
              style="display: inline-block; background: #2d1a0e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
              View & Respond →
            </a>

            <p style="color: #5c3d2e; font-size: 12px; margin-top: 24px;">
              You're receiving this because you're a baker on Whiskly. Log in to accept or decline this request.
            </p>
          </div>
        `
      })
    }

    if (type === 'order_confirmed') {
      await resend.emails.send({
        from: 'Whiskly <notifications@whiskly.vercel.app>',
        to: bakerEmail,
        subject: 'Your order has been confirmed!',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <h1 style="color: #2d1a0e; font-size: 24px; margin-bottom: 8px;">✅ Order Confirmed</h1>
            <p style="color: #5c3d2e;">Hi ${customerName}, your order with ${bakerName} has been confirmed!</p>
            <a href="https://whiskly.vercel.app/bakers" 
              style="display: inline-block; background: #2d1a0e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 16px;">
              View Your Order →
            </a>
          </div>
        `
      })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Email error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}