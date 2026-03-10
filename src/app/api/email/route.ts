import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'Whiskly <onboarding@resend.dev>'
const BASE_URL = 'https://whiskly.vercel.app'

function baseWrapper(content: string) {
  return `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: #2d1a0e; padding: 24px 32px;">
        <span style="color: #f5f0eb; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">Whiskly</span>
      </div>
      <div style="padding: 32px;">
        ${content}
      </div>
      <div style="border-top: 1px solid #e0d5cc; padding: 20px 32px; text-align: center;">
        <p style="color: #9c7b6b; font-size: 12px; margin: 0;">
          Whiskly · The custom baked goods marketplace ·
          <a href="${BASE_URL}" style="color: #9c7b6b;">whiskly.vercel.app</a>
        </p>
      </div>
    </div>
  `
}

function detailTable(rows: { label: string; value: string }[]) {
  return `
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      ${rows.map(({ label, value }) => `
        <tr style="border-bottom: 1px solid #e0d5cc;">
          <td style="padding: 10px 0; color: #5c3d2e; font-size: 14px; width: 40%;">${label}</td>
          <td style="padding: 10px 0; color: #2d1a0e; font-size: 14px; font-weight: 600;">${value}</td>
        </tr>
      `).join('')}
    </table>
  `
}

function ctaButton(text: string, href: string) {
  return `
    <a href="${href}"
      style="display: inline-block; background: #2d1a0e; color: #ffffff; padding: 13px 28px;
             border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 8px;">
      ${text}
    </a>
  `
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      type,
      bakerEmail,
      customerEmail,
      bakerName,
      customerName,
      eventType,
      eventDate,
      budget,
      description,
      question,
      proofPhotoUrl,
      careInstructions,
      orderId,
    } = body

    // ─── New Order ────────────────────────────────────────────────────────────
    if (type === 'new_order') {
      const rows = [
        { label: 'Customer', value: customerName },
        { label: 'Event Type', value: eventType },
        { label: 'Event Date', value: eventDate },
        { label: 'Budget', value: `$${budget}` },
        ...(description ? [{ label: 'Details', value: description }] : []),
      ]

      await resend.emails.send({
        from: FROM,
        to: bakerEmail,
        subject: `New booking request from ${customerName}`,
        html: baseWrapper(`
          <h1 style="color: #2d1a0e; font-size: 22px; margin: 0 0 8px;">New Booking Request</h1>
          <p style="color: #5c3d2e; margin: 0 0 20px;">Hi ${bakerName}, someone wants to book you on Whiskly.</p>
          <div style="background: #f5f0eb; border-radius: 10px; padding: 20px;">
            ${detailTable(rows)}
          </div>
          <div style="margin-top: 24px;">
            ${ctaButton('View & Respond', `${BASE_URL}/dashboard/baker`)}
          </div>
          <p style="color: #9c7b6b; font-size: 12px; margin-top: 24px;">
            Log in to accept, decline, or ask a question about this request.
          </p>
        `)
      })
    }

    // ─── Order Confirmed ──────────────────────────────────────────────────────
    if (type === 'order_confirmed') {
      await resend.emails.send({
        from: FROM,
        to: customerEmail,
        subject: `Your order with ${bakerName} is confirmed`,
        html: baseWrapper(`
          <h1 style="color: #2d1a0e; font-size: 22px; margin: 0 0 8px;">Order Confirmed</h1>
          <p style="color: #5c3d2e; margin: 0 0 20px;">
            Hi ${customerName}, great news — ${bakerName} has accepted your request.
            They'll be in touch as they get started.
          </p>
          <div style="background: #f5f0eb; border-radius: 10px; padding: 20px;">
            ${detailTable([
              { label: 'Event Type', value: eventType },
              { label: 'Event Date', value: eventDate },
              { label: 'Baker', value: bakerName },
            ])}
          </div>
          <div style="margin-top: 24px;">
            ${ctaButton('View My Order', `${BASE_URL}/dashboard/customer`)}
          </div>
        `)
      })
    }

    // ─── Baker Question ───────────────────────────────────────────────────────
    if (type === 'baker_question') {
      await resend.emails.send({
        from: FROM,
        to: customerEmail,
        subject: `${bakerName} has a question about your order`,
        html: baseWrapper(`
          <h1 style="color: #2d1a0e; font-size: 22px; margin: 0 0 8px;">A Question About Your Order</h1>
          <p style="color: #5c3d2e; margin: 0 0 20px;">Hi ${customerName}, ${bakerName} reached out about your ${eventType} order.</p>
          <div style="background: #f5f0eb; border-radius: 10px; padding: 20px 24px; border-left: 4px solid #c8975a;">
            <p style="color: #2d1a0e; font-size: 15px; margin: 0; line-height: 1.6;">"${question}"</p>
            <p style="color: #9c7b6b; font-size: 12px; margin: 12px 0 0;">— ${bakerName}</p>
          </div>
          <div style="margin-top: 24px;">
            ${ctaButton('Reply in Messages', `${BASE_URL}/dashboard/customer?tab=messages${orderId ? `&order=${orderId}` : ''}`)}
          </div>
        `)
      })
    }

    // ─── Order Ready (pickup) ─────────────────────────────────────────────────
    if (type === 'order_ready') {
      await resend.emails.send({
        from: FROM,
        to: customerEmail,
        subject: `Your order is ready for pickup`,
        html: baseWrapper(`
          <h1 style="color: #2d1a0e; font-size: 22px; margin: 0 0 8px;">Your Order Is Ready</h1>
          <p style="color: #5c3d2e; margin: 0 0 20px;">
            Hi ${customerName}, ${bakerName} has finished your ${eventType} order and it's ready for pickup.
          </p>
          <div style="background: #f5f0eb; border-radius: 10px; padding: 20px;">
            ${detailTable([
              { label: 'Baker', value: bakerName },
              { label: 'Event Type', value: eventType },
              { label: 'Event Date', value: eventDate },
            ])}
          </div>
          <div style="margin-top: 24px;">
            ${ctaButton('View Pickup Details', `${BASE_URL}/dashboard/customer`)}
          </div>
          <p style="color: #9c7b6b; font-size: 12px; margin-top: 20px;">
            The full pickup address is now available in your dashboard. Confirm pickup once you've collected your order.
          </p>
        `)
      })
    }

    // ─── Delivery Complete ────────────────────────────────────────────────────
    if (type === 'delivery_complete') {
      await resend.emails.send({
        from: FROM,
        to: customerEmail,
        subject: `Your order has been delivered`,
        html: baseWrapper(`
          <h1 style="color: #2d1a0e; font-size: 22px; margin: 0 0 8px;">Your Order Has Arrived</h1>
          <p style="color: #5c3d2e; margin: 0 0 24px;">
            Hi ${customerName}, ${bakerName} has marked your ${eventType} order as delivered.
            We hope it's everything you imagined.
          </p>

          ${proofPhotoUrl ? `
          <div style="margin-bottom: 24px;">
            <p style="color: #2d1a0e; font-size: 13px; font-weight: 600; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.5px;">Delivery Photo</p>
            <img src="${proofPhotoUrl}" alt="Delivery confirmation"
              style="width: 100%; border-radius: 10px; border: 1px solid #e0d5cc;" />
          </div>
          ` : ''}

          ${careInstructions ? `
          <div style="background: #f5f0eb; border-radius: 10px; padding: 20px 24px; margin-bottom: 24px;">
            <p style="color: #2d1a0e; font-size: 13px; font-weight: 600; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.5px;">Care Instructions</p>
            <p style="color: #5c3d2e; font-size: 14px; margin: 0; line-height: 1.6;">${careInstructions}</p>
          </div>
          ` : ''}

          <div style="border: 1px solid #e0d5cc; border-radius: 10px; padding: 20px 24px; margin-bottom: 24px; text-align: center;">
            <p style="color: #5c3d2e; font-size: 14px; margin: 0 0 4px;">Made with care by</p>
            <p style="color: #2d1a0e; font-size: 18px; font-weight: 700; margin: 0 0 4px;">${bakerName}</p>
            <p style="color: #9c7b6b; font-size: 13px; margin: 0;">Thank you for choosing Whiskly</p>
          </div>

          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding-right: 8px;">
                ${ctaButton('Leave a Review', `${BASE_URL}/dashboard/customer${orderId ? `?review=${orderId}` : ''}`)}
              </td>
              <td style="padding-left: 8px;">
                <a href="https://twitter.com/intent/tweet?text=Just+got+my+custom+cake+from+${encodeURIComponent(bakerName)}+on+Whiskly+%F0%9F%8E%82&url=${BASE_URL}/bakers"
                  style="display: inline-block; border: 1px solid #2d1a0e; color: #2d1a0e; padding: 13px 28px;
                         border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                  Share the Love
                </a>
              </td>
            </tr>
          </table>
        `)
      })
    }

    // ─── Pickup Complete ──────────────────────────────────────────────────────
    if (type === 'pickup_complete') {
      await resend.emails.send({
        from: FROM,
        to: customerEmail,
        subject: `Pickup confirmed — enjoy your order`,
        html: baseWrapper(`
          <h1 style="color: #2d1a0e; font-size: 22px; margin: 0 0 8px;">Pickup Confirmed</h1>
          <p style="color: #5c3d2e; margin: 0 0 24px;">
            Hi ${customerName}, your pickup has been confirmed. We hope ${bakerName}'s creation is absolutely wonderful.
          </p>

          ${careInstructions ? `
          <div style="background: #f5f0eb; border-radius: 10px; padding: 20px 24px; margin-bottom: 24px;">
            <p style="color: #2d1a0e; font-size: 13px; font-weight: 600; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.5px;">Care Instructions</p>
            <p style="color: #5c3d2e; font-size: 14px; margin: 0; line-height: 1.6;">${careInstructions}</p>
          </div>
          ` : ''}

          <div style="border: 1px solid #e0d5cc; border-radius: 10px; padding: 20px 24px; margin-bottom: 24px; text-align: center;">
            <p style="color: #5c3d2e; font-size: 14px; margin: 0 0 4px;">Made with care by</p>
            <p style="color: #2d1a0e; font-size: 18px; font-weight: 700; margin: 0;">${bakerName}</p>
            <p style="color: #9c7b6b; font-size: 13px; margin: 4px 0 0;">Thank you for choosing Whiskly</p>
          </div>

          ${ctaButton('Leave a Review', `${BASE_URL}/dashboard/customer${orderId ? `?review=${orderId}` : ''}`)}
        `)
      })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Email error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}