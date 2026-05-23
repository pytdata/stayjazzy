import { corsHeaders } from '../_shared/cors.ts'

const ADMIN_EMAIL = 'admin@stayjazzy.com'
const BRAND_COLOR = '#1a6b3a'
const LOGO_URL = 'https://miaoda-conversation-file.s3cdn.medo.dev/user-bo1v51m4ml1c/app-bu4kziuqa9dt/20260523/logo.jpeg'

function baseTemplate(content: string, title: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,.08); }
    .header { background: ${BRAND_COLOR}; padding: 28px 32px; text-align: center; }
    .header img { height: 56px; border-radius: 8px; background: #fff; padding: 6px; }
    .header h1 { color: #fff; margin: 12px 0 0; font-size: 20px; letter-spacing: .5px; }
    .body { padding: 32px; color: #222; line-height: 1.7; }
    .body h2 { color: ${BRAND_COLOR}; margin-top: 0; }
    .highlight { background: #f0faf4; border-left: 4px solid ${BRAND_COLOR}; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 20px 0; }
    .badge { display: inline-block; background: ${BRAND_COLOR}; color: #fff; padding: 4px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; }
    .service-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .service-row:last-child { border-bottom: none; font-weight: 700; color: ${BRAND_COLOR}; }
    .btn { display: inline-block; background: ${BRAND_COLOR}; color: #fff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0 8px; }
    .footer { background: #f8f8f8; text-align: center; padding: 20px 32px; color: #888; font-size: 13px; border-top: 1px solid #eee; }
    .social-links a { color: ${BRAND_COLOR}; text-decoration: none; margin: 0 8px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <img src="${LOGO_URL}" alt="Stay Jazzy Multimedia"/>
      <h1>Stay Jazzy Multimedia</h1>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Stay Jazzy Multimedia. All rights reserved.</p>
      <div class="social-links">
        <a href="#">Instagram</a> · <a href="#">Facebook</a> · <a href="#">TikTok</a>
      </div>
      <p style="margin-top:8px;font-size:12px;">If you did not request this email, please ignore it.</p>
    </div>
  </div>
</body>
</html>`
}

function bookingConfirmationHtml(data: {
  user_name?: string; user_email: string; booking_id: string
  selected_services: { tier_name: string; package_name: string; price: number; currency: string }[]
}) {
  const total = data.selected_services.reduce((s, x) => s + x.price, 0)
  const currency = data.selected_services[0]?.currency || 'GHS'
  const serviceRows = data.selected_services.map(s =>
    `<div class="service-row"><span>${s.tier_name} (${s.package_name})</span><span>${currency} ${s.price.toFixed(2)}</span></div>`
  ).join('')

  const content = `
    <h2>Booking Confirmed! 🎉</h2>
    <p>Hello <strong>${data.user_name || data.user_email}</strong>,</p>
    <p>Your booking with Stay Jazzy Multimedia has been received and is now being processed. Our team will be in touch with you shortly.</p>
    <div class="highlight">
      <p style="margin:0 0 8px;font-size:13px;color:#666;">BOOKING REFERENCE</p>
      <span class="badge">#${data.booking_id.slice(0, 8).toUpperCase()}</span>
    </div>
    <h3 style="color:#333;font-size:15px;margin-bottom:8px;">Selected Services</h3>
    <div style="border:1px solid #eee;border-radius:8px;padding:12px 16px;">
      ${serviceRows}
      <div class="service-row"><span>Total</span><span>${currency} ${total.toFixed(2)}</span></div>
    </div>
    <p style="margin-top:24px;">You can track your booking progress and chat with our team via your Booking Dashboard.</p>
    <p>Thank you for choosing Stay Jazzy Multimedia!</p>
    <p>— The Stay Jazzy Team</p>`

  return baseTemplate(content, 'Booking Confirmed — Stay Jazzy Multimedia')
}

function newBookingNotificationHtml(data: {
  user_name?: string; user_email: string; user_phone: string; booking_id: string
  selected_services: { tier_name: string; package_name: string; price: number; currency: string }[]
}) {
  const total = data.selected_services.reduce((s, x) => s + x.price, 0)
  const currency = data.selected_services[0]?.currency || 'GHS'
  const serviceRows = data.selected_services.map(s =>
    `<div class="service-row"><span>${s.tier_name} (${s.package_name})</span><span>${currency} ${s.price.toFixed(2)}</span></div>`
  ).join('')

  const content = `
    <h2>New Booking Received</h2>
    <p>A new booking has been submitted and requires your attention.</p>
    <div class="highlight">
      <p style="margin:0 0 6px;"><strong>Client:</strong> ${data.user_name || 'N/A'}</p>
      <p style="margin:0 0 6px;"><strong>Email:</strong> ${data.user_email}</p>
      <p style="margin:0;"><strong>Phone:</strong> ${data.user_phone}</p>
    </div>
    <h3 style="color:#333;font-size:15px;margin-bottom:8px;">Services Booked</h3>
    <div style="border:1px solid #eee;border-radius:8px;padding:12px 16px;">
      ${serviceRows}
      <div class="service-row"><span>Total</span><span>${currency} ${total.toFixed(2)}</span></div>
    </div>
    <p style="margin-top:20px;">Log in to the admin portal to manage this booking and initiate chat with the client.</p>
    <span class="badge">Booking ID: #${data.booking_id.slice(0, 8).toUpperCase()}</span>`

  return baseTemplate(content, 'New Booking — Stay Jazzy Multimedia Admin')
}

function bookingStatusUpdateHtml(data: {
  user_name?: string; user_email: string; booking_id: string
  stage: string; notes?: string
}) {
  const stageLabels: Record<string, string> = {
    initial_payment: 'Initial Payment', in_progress: 'In Progress',
    review: 'Review', final_stage: 'Final Stage', completed: 'Completed',
  }
  const content = `
    <h2>Booking Status Update</h2>
    <p>Hello <strong>${data.user_name || data.user_email}</strong>,</p>
    <p>Your booking status has been updated.</p>
    <div class="highlight">
      <p style="margin:0 0 6px;font-size:13px;color:#666;">BOOKING #${data.booking_id.slice(0, 8).toUpperCase()}</p>
      <p style="margin:0;font-size:18px;font-weight:700;color:${BRAND_COLOR};">
        ${stageLabels[data.stage] || data.stage}
      </p>
    </div>
    ${data.notes ? `<p><strong>Note from our team:</strong> ${data.notes}</p>` : ''}
    <p>Log in to your booking dashboard to view full details and chat with our team.</p>
    <p>— The Stay Jazzy Team</p>`

  return baseTemplate(content, 'Booking Update — Stay Jazzy Multimedia')
}

function contactFormNotificationHtml(data: {
  name: string; email: string; phone?: string; subject?: string; message: string
}) {
  const content = `
    <h2>New Contact Form Submission</h2>
    <div class="highlight">
      <p style="margin:0 0 6px;"><strong>From:</strong> ${data.name}</p>
      <p style="margin:0 0 6px;"><strong>Email:</strong> ${data.email}</p>
      ${data.phone ? `<p style="margin:0 0 6px;"><strong>Phone:</strong> ${data.phone}</p>` : ''}
      ${data.subject ? `<p style="margin:0;"><strong>Subject:</strong> ${data.subject}</p>` : ''}
    </div>
    <h3 style="color:#333;font-size:15px;">Message</h3>
    <div style="background:#f9f9f9;border-radius:8px;padding:16px;border:1px solid #eee;">
      <p style="margin:0;white-space:pre-wrap;">${data.message}</p>
    </div>
    <p style="margin-top:20px;">Log in to the admin portal to view and respond to this message.</p>`

  return baseTemplate(content, 'Contact Form — Stay Jazzy Multimedia')
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const payload = await req.json() as {
      type: 'booking_confirmation' | 'new_booking_admin' | 'status_update' | 'contact_form'
      data: Record<string, unknown>
    }

    let to = ''
    let subject = ''
    let html = ''

    if (payload.type === 'booking_confirmation') {
      const d = payload.data as Parameters<typeof bookingConfirmationHtml>[0]
      to = d.user_email
      subject = `Booking Confirmed — #${d.booking_id.slice(0, 8).toUpperCase()}`
      html = bookingConfirmationHtml(d)
    } else if (payload.type === 'new_booking_admin') {
      const d = payload.data as Parameters<typeof newBookingNotificationHtml>[0]
      to = ADMIN_EMAIL
      subject = `New Booking from ${d.user_email}`
      html = newBookingNotificationHtml(d)
    } else if (payload.type === 'status_update') {
      const d = payload.data as Parameters<typeof bookingStatusUpdateHtml>[0]
      to = d.user_email
      subject = `Booking Update — Stay Jazzy Multimedia`
      html = bookingStatusUpdateHtml(d)
    } else if (payload.type === 'contact_form') {
      const d = payload.data as Parameters<typeof contactFormNotificationHtml>[0]
      to = ADMIN_EMAIL
      subject = `Contact: ${(d as { subject?: string }).subject || 'New Message'}`
      html = contactFormNotificationHtml(d as Parameters<typeof contactFormNotificationHtml>[0])
    } else {
      return new Response(JSON.stringify({ error: 'Unknown email type' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Send via Resend (configured via RESEND_API_KEY secret)
    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) {
      // Log the email content for debugging when no API key is set
      console.log(`[send-email] Would send to: ${to}, subject: ${subject}`)
      return new Response(JSON.stringify({ ok: true, message: 'Email logged (no API key)' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'Stay Jazzy Multimedia <noreply@stayjazzy.com>', to, subject, html }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[send-email] Resend error:', err)
      return new Response(JSON.stringify({ error: err }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const result = await res.json()
    return new Response(JSON.stringify({ ok: true, id: result.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('[send-email] Error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
